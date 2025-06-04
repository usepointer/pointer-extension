import { marked } from 'marked'

function showLoader(resultDiv: HTMLElement | null): HTMLElement {
    let loadingDiv = document.getElementById('magic-loading');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'magic-loading';
        loadingDiv.className = 'loading-container';
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        loadingDiv.appendChild(spinner);
        const loadingText = document.createElement('div');
        loadingText.className = 'loading-text';
        loadingText.textContent = 'Magic takes time...';
        loadingDiv.appendChild(loadingText);
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
        resultDiv.classList.remove('has-data');
        resultDiv.classList.remove('loading');
    }
}

async function onMagicButtonClick() {
    const resultDiv = document.getElementById('magic-result');
    const loadingDiv = showLoader(resultDiv);
    resetResultDiv(resultDiv);
    const currentTab = await getCurrentTab();
    if (currentTab) {
        // Get current tab html content
        console.log('Current tab ID:', currentTab.id);
        const [{ result: contents }] = await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: () => {
                // This function will run in the context of the current tab
                const paragraphs = Array.from(document.getElementsByTagName('p'))
                    .map(p => p.innerText.trim())
                    .filter(text => text.length > 0);
                const spans = Array.from(document.getElementsByTagName('span'))
                    .map(p => p.innerText.trim())
                    .filter(text => text.length > 0);
                return [...paragraphs, spans];
                // You can do something with the HTML content here
            }
        });
        // Print result in the new section
        if (resultDiv && loadingDiv) {
            if (contents) {
                const response = await fetch('http://localhost:3001/get-insights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ htmlContent: contents }) });
                const insights = await response.json();
                resultDiv.innerHTML = await marked.parse(insights.result);
                resultDiv.classList.add('has-data');
                resultDiv.classList.remove('loading');
                resultDiv.style.display = '';
                hideLoader(loadingDiv);
            } else {
                resultDiv.textContent = '';
                resultDiv.classList.remove('has-data');
                resultDiv.classList.remove('loading');
                resultDiv.style.display = '';
                hideLoader(loadingDiv);
            }
        }
    } else if (resultDiv && loadingDiv) {
        resultDiv.textContent = '';
        resultDiv.classList.remove('loading');
        resultDiv.style.display = '';
        hideLoader(loadingDiv);
    }
}

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('magic-btn');
    if (btn) {
        btn.addEventListener('click', onMagicButtonClick);
    }
});