import { marked } from 'marked';

// Streaming and rendering helpers
export async function streamAndRenderMarkdown(response: Response, resultDiv: HTMLElement) {
    if (!response.body) {
        resultDiv.textContent = 'No response body.';
        return;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    resultDiv.innerHTML = '';
    resultDiv.classList.add('has-data');
    resultDiv.classList.remove('loading');
    resultDiv.style.display = '';
    let resultText = '';
    let lastLength = 0;
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const event of events) {
            if (event.startsWith('data:')) {
                const data = event.replace(/^data:/, '').trim();
                if (data === '[DONE]') continue;
                const newText = JSON.parse(data).v;
                resultText += newText;
                resultDiv.innerHTML = await marked.parse(resultText);
                const childNodes = Array.from(resultDiv.childNodes);
                for (let i = lastLength; i < childNodes.length; i++) {
                    const el = childNodes[i];
                    if (el.nodeType === Node.ELEMENT_NODE) {
                        (el as HTMLElement).classList.add('text-animate');
                    }
                }
                lastLength = childNodes.length;
            }
        }
    }
}
