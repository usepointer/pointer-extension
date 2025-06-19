import { marked } from 'marked';

// Streaming and rendering helpers
export async function streamAndRenderMarkdown(response: Response, resultDiv: HTMLElement): Promise<string> {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    const dataPrefix = 'data: '
    const doneStatement = '[DONE]'
    let buffer = '';
    resultDiv.innerHTML = '';
    let resultText = '';
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const event of events) {
            if (event.startsWith(dataPrefix)) {
                const data = event.replace(/^data:/, '').trim();
                if (data === doneStatement) continue;
                const newText = JSON.parse(data).v;
                resultText += newText;
                resultDiv.innerHTML = await marked.parse(resultText);
            }
        }
    }

    return resultText;
}
