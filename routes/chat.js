import express from 'express';
import { chatCompletion, streamCompletion, MODEL_DEFAULT, MODEL_ADVANCED } from '../services/llm.js';
import {
    getEventById,
    getGenresById,
    getMovieDetailsByEventId,
    getMovieById,
    searchMoviesByText,
    searchEventsByKeyword,
    getAllEventsCompact,
    getEventsByTimeRange,
    getGenresByEventIds,
} from '../models/database.js';

const router = express.Router();

// ---------- Capability 1: Natural Language Movie Search ----------
router.post('/recommend', async (req, res) => {
    try {
        const { message } = req.body;

        let candidates;
        try {
            candidates = await searchMoviesByText(message);
        } catch {
            // FULLTEXT index might not exist yet — fall back to LIKE search
            candidates = [];
        }

        // Fallback if FULLTEXT returns nothing or errored
        if (!candidates || candidates.length === 0) {
            const words = message.split(/\s+/).slice(0, 3).join('%');
            const likePattern = `%${words}%`;
            const { default: mysql } = await import('mysql2');
            // Use the existing pool via a simple LIKE query through our DB module
            candidates = await searchEventsByKeyword(message); // reuse as rough fallback
            candidates = []; // Clear — we'll let the LLM work from its knowledge
        }

        const movieContext = candidates.length > 0
            ? `Here are movies from our database that may be relevant:\n${JSON.stringify(candidates.map(m => ({ id: m.id, title: m.title, overview: m.overview, poster_path: m.poster_path })))}`
            : 'No movies matched directly in our database. Use your knowledge to suggest historically relevant movies, but note that poster images won\'t be available.';

        const messages = [
            {
                role: 'system',
                content: `You are a film historian specializing in historically-themed movies. The user wants movie recommendations.

${movieContext}

Instructions:
- Select and rank the top 5 most relevant movies for the user's query
- For each movie, explain in 1-2 sentences why it's relevant
- Format each recommendation as: **Movie Title** (Year) - explanation
- If movies are from our database, include their ID at the end in this format: [movie:ID]
- Keep your response concise and engaging`
            },
            { role: 'user', content: message }
        ];

        await streamCompletion(messages, res);
    } catch (error) {
        console.error('Error in /recommend:', error);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

// ---------- Capability 2: Recommendation Explainer ----------
router.post('/explain', async (req, res) => {
    try {
        const { event_id, movie_id } = req.body;

        const [eventDetails, movieDetails, genres] = await Promise.all([
            getEventById(event_id),
            getMovieById(movie_id),
            getGenresById(event_id),
        ]);

        const event = eventDetails[0];
        const movie = movieDetails[0];
        const genreList = genres.map(g => g.genre).join(', ');

        const messages = [
            {
                role: 'system',
                content: `You are a film historian. Explain why this movie was recommended for this historical event.

Historical Event: "${event.name}" (${event.start_year}–${event.end_year || event.start_year})
Region: ${event.region}
Genres: ${genreList}
Description: ${event.description}

Movie: "${movie.title}" (${movie.release_date})
Overview: ${movie.overview}

Discuss:
1. Thematic connections between the event and movie
2. Historical accuracy or artistic interpretation
3. What a viewer might learn about this period
Keep your response to 3-4 paragraphs.`
            },
            { role: 'user', content: `Why was "${movie.title}" recommended for "${event.name}"?` }
        ];

        await streamCompletion(messages, res);
    } catch (error) {
        console.error('Error in /explain:', error);
        res.status(500).json({ error: 'Failed to generate explanation' });
    }
});

// ---------- Capability 3: Conversational Event Creation ----------
router.post('/create', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        const messages = [
            {
                role: 'system',
                content: `You are a knowledgeable history assistant helping users add historical events to a database.

Your job:
1. When the user describes a historical event, extract structured fields: name, start_year, end_year, region, description, genre
2. If any field is unclear or missing, ask a clarifying question
3. Enrich the description using your historical knowledge — make it informative (2-4 sentences)
4. When you have all fields ready, output the event data as a JSON block inside \`\`\`json fences with these exact keys: name, start_year, end_year, region, description, genre
5. Before the JSON block, briefly confirm what you're about to create

Valid regions: Europe, Asia, North America, South America, Africa, Middle East, Oceania, Global
Common genres: War, Politics, Science, Culture, Revolution, Exploration, Religion, Economics, Law, Technology

Example JSON output:
\`\`\`json
{"name": "Signing of the Magna Carta", "start_year": 1215, "end_year": 1215, "region": "Europe", "description": "The Magna Carta was signed...", "genre": "Politics, Law"}
\`\`\``
            },
            ...history,
            { role: 'user', content: message }
        ];

        const response = await chatCompletion(messages, {});
        const content = response.message?.content || '';

        // Try to extract JSON event data from the response
        const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*"name"[\s\S]*"start_year"[\s\S]*\})/);

        if (jsonMatch) {
            try {
                const eventData = JSON.parse(jsonMatch[1].trim());
                // Extract any text before the JSON as the message
                const textContent = content.replace(/```json[\s\S]*?```/, '').replace(/\{[\s\S]*"name"[\s\S]*\}/, '').trim();
                res.json({
                    type: 'event_creation',
                    content: textContent || 'Here\'s the event I\'ve prepared:',
                    event_data: eventData,
                });
            } catch {
                res.json({ type: 'message', content });
            }
        } else {
            res.json({
                type: 'message',
                content,
            });
        }
    } catch (error) {
        console.error('Error in /create:', error);
        res.status(500).json({ error: 'Failed to process event creation' });
    }
});

// ---------- Capability 4: Historical Event Q&A ----------
router.post('/ask', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        // Search for relevant events
        const keywords = message.split(/\s+/).filter(w => w.length > 3).slice(0, 5);
        let relevantEvents = [];
        for (const keyword of keywords) {
            const found = await searchEventsByKeyword(keyword);
            relevantEvents.push(...found);
        }

        // Deduplicate by id
        const seen = new Set();
        relevantEvents = relevantEvents.filter(e => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
        }).slice(0, 5);

        // Get genres and movies for matched events
        let eventContext = '';
        if (relevantEvents.length > 0) {
            const eventIds = relevantEvents.map(e => e.id);
            const genres = await getGenresByEventIds(eventIds);
            const genreMap = {};
            genres.forEach(g => {
                if (!genreMap[g.event_id]) genreMap[g.event_id] = [];
                genreMap[g.event_id].push(g.genre);
            });

            eventContext = relevantEvents.map(e => {
                const g = genreMap[e.id] ? genreMap[e.id].join(', ') : 'N/A';
                return `- "${e.name}" (${e.start_year}–${e.end_year || e.start_year}), ${e.region}, Genres: ${g}\n  Description: ${e.description}`;
            }).join('\n\n');
        }

        // Get compact event list for general awareness
        const allEvents = await getAllEventsCompact();
        const eventList = allEvents.map(e => `${e.name} (${e.start_year}, ${e.region})`).join('; ');

        const messages = [
            {
                role: 'system',
                content: `You are a knowledgeable history educator. Answer the user's question using the database context below. Also mention relevant movies the user could watch to learn more.

${relevantEvents.length > 0 ? `**Relevant events from our database:**\n${eventContext}` : 'No specific events matched the query in our database.'}

**All events in our database:** ${eventList}

Guidelines:
- Ground your answers in the database context when possible
- If the question is about an event not in our database, answer from your knowledge but suggest they add it
- Mention relevant event names naturally in your response
- Suggest relevant movies from our database when applicable
- Be educational, engaging, and concise (2-4 paragraphs)`
            },
            ...history,
            { role: 'user', content: message }
        ];

        await streamCompletion(messages, res, { model: MODEL_ADVANCED, max_tokens: 1500 });
    } catch (error) {
        console.error('Error in /ask:', error);
        res.status(500).json({ error: 'Failed to generate answer' });
    }
});

// ---------- Capability 5: Timeline Exploration ----------
router.post('/timeline', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        // Extract years and region from the message using LLM
        const extractionResponse = await chatCompletion([
            {
                role: 'system',
                content: 'Extract the start year, end year, and optional region from the user\'s query about a time period. Respond ONLY with JSON: {"start_year": number, "end_year": number, "region": string|null}'
            },
            { role: 'user', content: message }
        ], { temperature: 0, max_tokens: 100 });

        let params;
        try {
            const rawContent = extractionResponse.message?.content || '';
            // Extract JSON from the response (may be wrapped in markdown fences)
            const jsonMatch = rawContent.match(/```json?\s*([\s\S]*?)```/) || [null, rawContent];
            params = JSON.parse(jsonMatch[1].trim());
        } catch {
            params = { start_year: 0, end_year: 9999, region: null };
        }

        const events = await getEventsByTimeRange(
            params.start_year || 0,
            params.end_year || 9999,
            params.region
        );

        let genreContext = '';
        if (events.length > 0) {
            const eventIds = events.map(e => e.id);
            const genres = await getGenresByEventIds(eventIds);
            const genreMap = {};
            genres.forEach(g => {
                if (!genreMap[g.event_id]) genreMap[g.event_id] = [];
                genreMap[g.event_id].push(g.genre);
            });

            genreContext = events.map(e => {
                const g = genreMap[e.id] ? genreMap[e.id].join(', ') : 'N/A';
                return `- ${e.name} (${e.start_year}–${e.end_year || e.start_year}), ${e.region}, Genres: ${g}\n  ${e.description}`;
            }).join('\n\n');
        }

        const messages = [
            {
                role: 'system',
                content: `You are a history narrator. Present the following events as a chronological timeline narrative, highlighting cause-and-effect relationships.

**Events from database (${events.length} found):**
${genreContext || 'No events found for this time range.'}

Guidelines:
- Present events chronologically
- Highlight connections and cause-effect relationships between events
- Mention event names naturally
- If few events match, supplement with your knowledge but note those are not in the database
- Keep the narrative engaging and educational`
            },
            ...history,
            { role: 'user', content: message }
        ];

        await streamCompletion(messages, res, { max_tokens: 1500 });
    } catch (error) {
        console.error('Error in /timeline:', error);
        res.status(500).json({ error: 'Failed to generate timeline' });
    }
});

// ---------- Capability 6: Movie Discussion ----------
router.post('/discuss', async (req, res) => {
    try {
        const { movie_id, event_id, message, history = [] } = req.body;

        const [movieDetails, eventDetails, siblingMovies] = await Promise.all([
            getMovieById(movie_id),
            event_id ? getEventById(event_id) : Promise.resolve([]),
            event_id ? getMovieDetailsByEventId(event_id) : Promise.resolve([]),
        ]);

        const movie = movieDetails[0];
        const event = eventDetails.length > 0 ? eventDetails[0] : null;
        const siblings = siblingMovies.filter(m => m.id !== parseInt(movie_id));

        let context = `Movie: "${movie.title}" (${movie.release_date})\nOverview: ${movie.overview}`;
        if (event) {
            context += `\n\nHistorical Event Context: "${event.name}" (${event.start_year}–${event.end_year || event.start_year}), ${event.region}\n${event.description}`;
        }
        if (siblings.length > 0) {
            context += `\n\nOther movies recommended for this event: ${siblings.map(m => `"${m.title}"`).join(', ')}`;
        }

        const messages = [
            {
                role: 'system',
                content: `You are a film critic and historian. Discuss movies in their historical context.

${context}

Guidelines:
- Analyze historical accuracy, artistic merit, and thematic depth
- Compare with sibling recommendations when relevant
- Be conversational and engaging
- Support multi-turn discussion — build on previous exchanges`
            },
            ...history,
            { role: 'user', content: message }
        ];

        await streamCompletion(messages, res, { model: MODEL_ADVANCED, max_tokens: 1500 });
    } catch (error) {
        console.error('Error in /discuss:', error);
        res.status(500).json({ error: 'Failed to generate discussion' });
    }
});

// ---------- Capability 7: Comparative Event Analysis ----------
router.post('/compare', async (req, res) => {
    try {
        const { message, event_ids = [], history = [] } = req.body;

        let events = [];

        if (event_ids.length > 0) {
            // Fetch events by provided IDs
            for (const id of event_ids) {
                const eventData = await getEventById(id);
                if (eventData.length > 0) events.push(eventData[0]);
            }
        } else {
            // Extract event names from the message
            const keywords = message.split(/\s+/).filter(w => w.length > 3);
            for (const keyword of keywords) {
                const found = await searchEventsByKeyword(keyword);
                events.push(...found);
            }
            // Deduplicate
            const seen = new Set();
            events = events.filter(e => {
                if (seen.has(e.id)) return false;
                seen.add(e.id);
                return true;
            }).slice(0, 5);
        }

        // Get genres and movies for all events
        let eventsContext = '';
        if (events.length > 0) {
            const eventIds = events.map(e => e.id);
            const genres = await getGenresByEventIds(eventIds);
            const genreMap = {};
            genres.forEach(g => {
                if (!genreMap[g.event_id]) genreMap[g.event_id] = [];
                genreMap[g.event_id].push(g.genre);
            });

            const eventsWithMovies = await Promise.all(events.map(async e => {
                const movies = await getMovieDetailsByEventId(e.id);
                const g = genreMap[e.id] ? genreMap[e.id].join(', ') : 'N/A';
                return `### ${e.name} (${e.start_year}–${e.end_year || e.start_year})
Region: ${e.region} | Genres: ${g}
Description: ${e.description}
Recommended Movies: ${movies.map(m => m.title).join(', ') || 'None'}`;
            }));

            eventsContext = eventsWithMovies.join('\n\n');
        }

        const messages = [
            {
                role: 'system',
                content: `You are a comparative historian. Analyze and compare historical events.

**Events to compare:**
${eventsContext || 'No events provided. Ask the user which events they want to compare.'}

Guidelines:
- Create a markdown comparison table with categories: Time Period, Region, Key Causes, Key Consequences, Genre/Type, Duration
- Follow with a narrative analysis of parallels and contrasts
- Mention recommended movies for each event
- Be insightful — identify non-obvious connections
- If fewer than 2 events are available, ask the user to specify which events to compare`
            },
            ...history,
            { role: 'user', content: message }
        ];

        await streamCompletion(messages, res, { model: MODEL_ADVANCED, max_tokens: 2000 });
    } catch (error) {
        console.error('Error in /compare:', error);
        res.status(500).json({ error: 'Failed to generate comparison' });
    }
});

export default router;
