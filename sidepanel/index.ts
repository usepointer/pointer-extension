import { marked } from 'marked'

// Loader UI helpers
function createLoader(): HTMLElement {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'magic-loading';
    loadingDiv.className = 'loading-container';
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    loadingDiv.appendChild(spinner);
    const loadingText = document.createElement('div');
    loadingText.className = 'loading-text';
    loadingText.textContent = 'Magic takes time...';
    loadingDiv.appendChild(loadingText);
    return loadingDiv;
}

function showLoader(resultDiv: HTMLElement | null): HTMLElement {
    let loadingDiv = document.getElementById('magic-loading');
    if (!loadingDiv) {
        loadingDiv = createLoader();
        if (resultDiv && resultDiv.parentNode) {
            resultDiv.parentNode.insertBefore(loadingDiv, resultDiv);
        }
    }
    loadingDiv.style.display = 'flex';
    return loadingDiv;
}

function hideLoader(loadingDiv: HTMLElement | null) {
    if (loadingDiv) loadingDiv.style.display = 'none';
}

function resetResultDiv(resultDiv: HTMLElement | null) {
    if (resultDiv) {
        resultDiv.style.display = 'none';
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
function extractTabContent() {
    const paragraphs = Array.from(document.getElementsByTagName('p'))
        .map(p => p.innerText.trim())
        .filter(text => text.length > 0);
    const spans = Array.from(document.getElementsByTagName('span'))
        .map(p => p.innerText.trim())
        .filter(text => text.length > 0);
    return [...paragraphs, spans];
}

// Streaming and rendering helpers
async function streamAndRenderMarkdown(response: Response, resultDiv: HTMLElement, loadingDiv: HTMLElement) {
    if (!response.body) {
        resultDiv.textContent = 'No response body.';
        hideLoader(loadingDiv);
        return;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    resultDiv.innerHTML = '';
    resultDiv.classList.add('has-data');
    resultDiv.classList.remove('loading');
    resultDiv.style.display = '';
    hideLoader(loadingDiv);
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
    hideLoader(loadingDiv);
}

async function handleNoContent(resultDiv: HTMLElement, loadingDiv: HTMLElement) {
    resultDiv.textContent = '';
    resultDiv.classList.remove('has-data', 'loading');
    resultDiv.style.display = '';
    hideLoader(loadingDiv);
}

// Main event handler
async function onMagicButtonClick() {
    const resultDiv = document.getElementById('magic-result');
    const loadingDiv = showLoader(resultDiv);
    resetResultDiv(resultDiv);
    const currentTab = await getCurrentTab();
    if (!currentTab) {
        if (resultDiv && loadingDiv) await handleNoContent(resultDiv, loadingDiv);
        return;
    }
    // Get current tab html content
    const [{ result: contents }] = await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: extractTabContent
    });
    if (resultDiv && loadingDiv) {
        if (contents) {
            const response = await fetch('http://localhost:3001/get-insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
                body: JSON.stringify({ htmlContent: contents })
            });
            await streamAndRenderMarkdown(response, resultDiv, loadingDiv);
        } else {
            await handleNoContent(resultDiv, loadingDiv);
        }
    }
}

// DOM event binding
function setupMagicButton() {
    const btn = document.getElementById('magic-btn');
    if (btn) {
        btn.addEventListener('click', onMagicButtonClick);
    }
}

document.addEventListener('DOMContentLoaded', setupMagicButton);