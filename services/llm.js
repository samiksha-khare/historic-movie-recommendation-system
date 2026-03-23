import dotenv from 'dotenv';

dotenv.config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434';
const MODEL_DEFAULT = process.env.LLM_MODEL_DEFAULT || 'mistral';
const MODEL_ADVANCED = process.env.LLM_MODEL_ADVANCED || 'mistral';

export async function chatCompletion(messages, options = {}) {
    const model = options.model || MODEL_DEFAULT;
    
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages,
                stream: false,
            }),
        });
        
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error calling Ollama:', error.message);
        throw error;
    }
}

export async function streamCompletion(messages, res, options = {}) {
    const model = options.model || MODEL_DEFAULT;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages,
                stream: true,
            }),
        });

        if (!response.ok) {
            res.write(`data: ${JSON.stringify({ error: 'Ollama API error' })}\n\n`);
            res.end();
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.message?.content) {
                        res.write(`data: ${JSON.stringify({ content: data.message.content })}\n\n`);
                    }
                } catch (e) {
                    // Skip invalid JSON lines
                }
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error('Stream error:', error.message);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
}

export { MODEL_DEFAULT, MODEL_ADVANCED };
