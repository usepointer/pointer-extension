import { marked } from 'marked'

function resetResultDiv(resultDiv: HTMLElement | null) {
    if (resultDiv) {
        resultDiv.style.display = '';
        resultDiv.textContent = '';
        resultDiv.classList.remove('has-data', 'loading');
    }
}

// Tab helpers
async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

// Content extraction for the current tab
function extractTabHTMLContent() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(document.body.outerHTML, 'text/html');

    ['script', 'svg', 'style'].forEach(tag => {
        doc.querySelectorAll(tag).forEach(el => el.remove());
    });

    doc.querySelectorAll('*').forEach(el => {
        [...el.attributes].forEach(attr => {
            if (attr.name !== 'id') {
                el.removeAttribute(attr.name);
            }
        });
    });
    const outerHTML = doc.documentElement.outerHTML;
    return outerHTML
        .replace(/\n/g, '')
        .replace(/\t/g, '')
        .replace(/<div/g, '<d')
        .replace(/<\/div>/g, '</d>')
        .replace(/<span/g, '<s')
        .replace(/<\/span>/g, '</s>')
    // const paragraphs = Array.from(document.getElementsByTagName('p'))
    //     .map(p => p.innerText.trim())
    //     .filter(text => text.length > 0);
    // const spans = Array.from(document.getElementsByTagName('span'))
    //     .map(p => p.innerText.trim())
    //     .filter(text => text.length > 0);
    // return [...paragraphs, ...spans];
}

function extractTabTextContent() {
    const paragraphs = Array.from(document.getElementsByTagName('p'))
        .map(p => p.innerText.trim())
        .filter(text => text.length > 0);
    const spans = Array.from(document.getElementsByTagName('span'))
        .map(p => p.innerText.trim())
        .filter(text => text.length > 0);
    return [...paragraphs, ...spans];
}
// Streaming and rendering helpers
async function streamAndRenderMarkdown(response: Response, resultDiv: HTMLElement) {
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

async function handleNoContent(resultDiv: HTMLElement) {
    resultDiv.textContent = '';
    resultDiv.classList.remove('has-data', 'loading');
    resultDiv.style.display = '';
}

function setButtonLoadingState(isLoading: boolean) {
    const btn = document.getElementById('magic-btn') as HTMLButtonElement | null;
    if (!btn) return;
    const loadingDots = btn.querySelector('.loading-dots') as HTMLElement | null;
    const wandIcon = btn.querySelector('img') as HTMLElement | null;
    const btnText = btn.querySelector('.btn-text') as HTMLElement | null;
    if (loadingDots) loadingDots.style.display = isLoading ? 'inline-block' : 'none';
    if (wandIcon) wandIcon.style.display = isLoading ? 'none' : '';
    if (btnText) btnText.style.display = isLoading ? 'none' : '';
    btn.disabled = isLoading;
}

// Main event handler
async function onMagicButtonClick() {
    const resultDiv = document.getElementById('magic-result');
    setButtonLoadingState(true);
    resetResultDiv(resultDiv);
    const customPromptInput = document.getElementById('custom-prompt') as HTMLTextAreaElement | null;
    const customPrompt = customPromptInput ? customPromptInput.value : '';
    const currentTab = await getCurrentTab();
    if (!currentTab) {
        if (resultDiv) await handleNoContent(resultDiv);
        setButtonLoadingState(false);
        return;
    }
    // Get current tab html content
    const [{ result: contents }] = await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: extractTabTextContent
    });
    if (resultDiv) {
        if (contents) {
            const response = await fetch('http://localhost:3001/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
                body: JSON.stringify({ htmlContent: contents, customPrompt })
            });
            await streamAndRenderMarkdown(response, resultDiv);
        } else {
            await handleNoContent(resultDiv);
        }
    }
    setButtonLoadingState(false);
}

// DOM event binding
function setupMagicButton() {
    const btn = document.getElementById('magic-btn');
    if (btn) {
        btn.addEventListener('click', onMagicButtonClick);
    }
}

document.addEventListener('DOMContentLoaded', setupMagicButton);