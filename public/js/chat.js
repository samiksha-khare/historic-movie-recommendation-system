/**
 * Client-side chat logic for AI chatbot capabilities
 * Handles: SSE streaming, multi-turn conversation, mode switching, event/movie links
 */

const ChatApp = (function () {
    // State
    let conversationHistory = [];
    let currentMode = 'ask';
    let pendingEventData = null;
    let isStreaming = false;

    // DOM references
    const panel = () => document.getElementById('chatPanel');
    const messagesDiv = () => document.getElementById('chatMessages');
    const input = () => document.getElementById('chatInput');
    const sendBtn = () => document.getElementById('chatSend');
    const toggleBtn = () => document.getElementById('chatToggle');
    const closeBtn = () => document.getElementById('chatClose');
    const modeSelect = () => document.getElementById('chatMode');
    const confirmDiv = () => document.getElementById('chatEventConfirm');
    const previewContent = () => document.getElementById('eventPreviewContent');
    const confirmBtn = () => document.getElementById('confirmEvent');
    const editBtn = () => document.getElementById('editEventChat');

    // --- Panel open/close ---
    function openPanel() {
        panel().classList.add('open');
        toggleBtn().style.display = 'none';
        input().focus();
    }

    function closePanel() {
        panel().classList.remove('open');
        toggleBtn().style.display = 'flex';
    }

    // --- Message rendering ---
    function addMessage(content, sender) {
        const div = document.createElement('div');
        div.className = `chat-message ${sender}-message`;
        const inner = document.createElement('div');
        inner.className = 'message-content';

        if (sender === 'bot') {
            inner.innerHTML = renderMarkdown(content);
        } else {
            inner.textContent = content;
        }

        div.appendChild(inner);
        messagesDiv().appendChild(div);
        scrollToBottom();
        return inner;
    }

    function addStreamingMessage() {
        const div = document.createElement('div');
        div.className = 'chat-message bot-message';
        div.id = 'streaming-message';
        const inner = document.createElement('div');
        inner.className = 'message-content';
        inner.innerHTML = '';
        div.appendChild(inner);
        messagesDiv().appendChild(div);
        scrollToBottom();
        return inner;
    }

    function showTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'typing-indicator';
        div.id = 'typing-indicator';
        div.innerHTML = '<span></span><span></span><span></span>';
        messagesDiv().appendChild(div);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }

    function scrollToBottom() {
        const msgs = messagesDiv();
        msgs.scrollTop = msgs.scrollHeight;
    }

    // --- Markdown rendering ---
    function renderMarkdown(text) {
        if (typeof marked !== 'undefined' && marked.parse) {
            let html = marked.parse(text);
            // Convert event links [Name](event:ID) to clickable spans
            html = html.replace(
                /\[([^\]]+)\]\(event:(\d+)\)/g,
                '<span class="chat-event-link" data-event-id="$2">$1</span>'
            );
            // Convert movie references [movie:ID] to data attributes
            html = html.replace(
                /\[movie:(\d+)\]/g,
                '<span class="chat-movie-ref" data-movie-id="$1">[View]</span>'
            );
            return html;
        }
        // Fallback: basic formatting
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(
                /\[([^\]]+)\]\(event:(\d+)\)/g,
                '<span class="chat-event-link" data-event-id="$2">$1</span>'
            );
    }

    // --- API calls ---
    async function sendStreamingRequest(endpoint, payload) {
        isStreaming = true;
        sendBtn().disabled = true;

        showTypingIndicator();

        try {
            const response = await fetch(`/api/chat/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            hideTypingIndicator();

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const contentType = response.headers.get('Content-Type') || '';

            if (contentType.includes('text/event-stream')) {
                // SSE streaming response
                const messageEl = addStreamingMessage();
                let fullText = '';

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // Keep incomplete line in buffer

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.content) {
                                    fullText += parsed.content;
                                    messageEl.innerHTML = renderMarkdown(fullText);
                                    scrollToBottom();
                                }
                            } catch (e) {
                                // Skip malformed chunks
                            }
                        }
                    }
                }

                // Final render
                messageEl.innerHTML = renderMarkdown(fullText);
                postProcessLinks();

                // Add to conversation history
                conversationHistory.push({ role: 'assistant', content: fullText });
            } else {
                // JSON response (for /create endpoint)
                const data = await response.json();
                handleJsonResponse(data);
            }
        } catch (error) {
            hideTypingIndicator();
            addMessage(`Sorry, something went wrong: ${error.message}. Please try again.`, 'bot');
        }

        isStreaming = false;
        sendBtn().disabled = false;
    }

    function handleJsonResponse(data) {
        if (data.type === 'event_creation' && data.event_data) {
            // Show the message
            if (data.content) {
                addMessage(data.content, 'bot');
                conversationHistory.push({ role: 'assistant', content: data.content });
            }
            // Show event preview
            pendingEventData = data.event_data;
            showEventPreview(data.event_data);
        } else if (data.type === 'message') {
            addMessage(data.content, 'bot');
            conversationHistory.push({ role: 'assistant', content: data.content });
        } else if (data.error) {
            addMessage(`Error: ${data.error}`, 'bot');
        }
    }

    function showEventPreview(eventData) {
        const fields = [
            { label: 'Name', value: eventData.name },
            { label: 'Period', value: `${eventData.start_year} – ${eventData.end_year}` },
            { label: 'Region', value: eventData.region },
            { label: 'Genre', value: eventData.genre },
            { label: 'Description', value: eventData.description },
        ];
        previewContent().innerHTML = fields.map(f =>
            `<div class="preview-field"><strong>${f.label}:</strong> ${f.value}</div>`
        ).join('');
        confirmDiv().style.display = 'block';
        scrollToBottom();
    }

    async function confirmEventCreation() {
        if (!pendingEventData) return;

        try {
            await addNewEvent(pendingEventData);
            addMessage('Event created successfully! Movie recommendations will be generated shortly via the Kafka pipeline.', 'bot');
            confirmDiv().style.display = 'none';
            pendingEventData = null;
            conversationHistory = [];
            // Refresh the main page
            await populatePageContent();
        } catch (error) {
            addMessage(`Failed to create event: ${error.message}`, 'bot');
        }
    }

    // --- Post-process clickable links ---
    function postProcessLinks() {
        // Event links
        document.querySelectorAll('.chat-event-link').forEach(el => {
            if (el.dataset.bound) return;
            el.dataset.bound = 'true';
            el.addEventListener('click', async () => {
                const eventId = el.dataset.eventId;
                const response = await getEventDetailsById(eventId);
                document.getElementById("event_name").textContent = response.event_details[0].name;
                document.getElementById("event_start_year").textContent = response.event_details[0].start_year;
                document.getElementById("event_end_year").textContent = response.event_details[0].end_year;
                document.getElementById("event_region").textContent = response.event_details[0].region;
                document.getElementById("event_description").textContent = response.event_details[0].description;

                let genres = response.genres.map(g => `<span>${g.genre}</span>`);
                document.getElementById("event_genres").innerHTML = genres.join(", ");

                const TMDB_BASE_URL = 'https://image.tmdb.org/t/p/w92';
                const TMDB_DETAIL_BASE = 'https://www.themoviedb.org/movie';
                let moviesHtml = response.movies.map(movie => {
                    const src = movie.poster_path
                        ? `${TMDB_BASE_URL}${movie.poster_path}`
                        : 'path/to/your-placeholder.jpg';
                    return `
                        <div class="movie-poster">
                            <img src="${src}" alt="${movie.title}" title="${movie.title}" loading="lazy" />
                            <div class="movie-title">
                                <a href="${TMDB_DETAIL_BASE}/${movie.id}" target="_blank" rel="noopener">${movie.title.split(":")[0]}</a>
                            </div>
                            <div class="movie-chat-links">
                                <a class="why-link" data-event-id="${eventId}" data-movie-id="${movie.id}">Why?</a>
                                <a class="discuss-link" data-event-id="${eventId}" data-movie-id="${movie.id}">Discuss</a>
                            </div>
                        </div>
                    `;
                }).join('');
                document.getElementById('event_movies').innerHTML = moviesHtml;
                document.getElementById("edit_event").value = eventId;
                document.getElementById("delete_event").value = eventId;
                $('#eventModal').modal('show');
            });
        });
    }

    // --- Send message ---
    async function sendMessage() {
        const text = input().value.trim();
        if (!text || isStreaming) return;

        addMessage(text, 'user');
        conversationHistory.push({ role: 'user', content: text });
        input().value = '';

        const mode = modeSelect().value;
        currentMode = mode;

        switch (mode) {
            case 'ask':
                await sendStreamingRequest('ask', {
                    message: text,
                    history: conversationHistory.slice(0, -1), // Exclude latest (sent as message)
                });
                break;
            case 'recommend':
                await sendStreamingRequest('recommend', { message: text });
                break;
            case 'timeline':
                await sendStreamingRequest('timeline', {
                    message: text,
                    history: conversationHistory.slice(0, -1),
                });
                break;
            case 'create':
                await sendStreamingRequest('create', {
                    message: text,
                    history: conversationHistory.slice(0, -1),
                });
                break;
            case 'compare':
                await sendStreamingRequest('compare', {
                    message: text,
                    history: conversationHistory.slice(0, -1),
                });
                break;
            default:
                await sendStreamingRequest('ask', { message: text });
        }
    }

    // --- Public methods for external triggers ---
    function openWithExplain(eventId, movieId) {
        openPanel();
        modeSelect().value = 'ask';
        showTypingIndicator();
        sendStreamingRequest('explain', { event_id: eventId, movie_id: movieId });
    }

    function openWithDiscuss(eventId, movieId, movieTitle) {
        openPanel();
        modeSelect().value = 'ask';
        conversationHistory = [];
        addMessage(`Let's discuss "${movieTitle}"`, 'user');
        sendStreamingRequest('discuss', {
            movie_id: movieId,
            event_id: eventId,
            message: `Tell me about this movie and its historical significance.`,
            history: [],
        });
    }

    function openWithCompare(eventIds) {
        openPanel();
        modeSelect().value = 'compare';
        conversationHistory = [];
        addMessage('Comparing selected events...', 'user');
        sendStreamingRequest('compare', {
            message: 'Compare these historical events in detail.',
            event_ids: eventIds,
            history: [],
        });
    }

    // --- Initialize ---
    function init() {
        // Toggle panel
        toggleBtn().addEventListener('click', openPanel);
        closeBtn().addEventListener('click', closePanel);

        // Send message
        sendBtn().addEventListener('click', sendMessage);
        input().addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Mode change — clear history for fresh context
        modeSelect().addEventListener('change', () => {
            conversationHistory = [];
            confirmDiv().style.display = 'none';
            pendingEventData = null;
        });

        // Event creation confirm/edit
        confirmBtn().addEventListener('click', confirmEventCreation);
        editBtn().addEventListener('click', () => {
            confirmDiv().style.display = 'none';
            addMessage('What would you like to change?', 'bot');
        });

        // Delegated click handlers for Why?/Discuss links
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('why-link')) {
                e.preventDefault();
                const eventId = e.target.dataset.eventId;
                const movieId = e.target.dataset.movieId;
                openWithExplain(eventId, movieId);
            }
            if (e.target.classList.contains('discuss-link')) {
                e.preventDefault();
                const eventId = e.target.dataset.eventId;
                const movieId = e.target.dataset.movieId;
                const movieTitle = e.target.closest('.movie-poster')?.querySelector('.movie-title a')?.textContent || 'this movie';
                openWithDiscuss(eventId, movieId, movieTitle);
            }
        });
    }

    return { init, openPanel, closePanel, openWithExplain, openWithDiscuss, openWithCompare };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ChatApp.init();
});
