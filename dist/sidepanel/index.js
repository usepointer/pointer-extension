"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function onMagicButtonClick() {
    return __awaiter(this, void 0, void 0, function* () {
        const resultDiv = document.getElementById('magic-result');
        let loadingDiv = document.getElementById('magic-loading');
        // Create loadingDiv if it doesn't exist
        if (!loadingDiv) {
            loadingDiv = document.createElement('div');
            loadingDiv.id = 'magic-loading';
            loadingDiv.className = 'loading-container';
            const spinner = document.createElement('div');
            spinner.className = 'spinner';
            loadingDiv.appendChild(spinner);
            // Optionally add loading text
            const loadingText = document.createElement('div');
            loadingText.className = 'loading-text';
            loadingText.textContent = 'Magic takes time...';
            loadingDiv.appendChild(loadingText);
            // Insert loadingDiv before resultDiv
            if (resultDiv && resultDiv.parentNode) {
                resultDiv.parentNode.insertBefore(loadingDiv, resultDiv);
            }
        }
        // Show loadingDiv, hide resultDiv
        if (loadingDiv)
            loadingDiv.style.display = 'flex';
        if (resultDiv) {
            resultDiv.style.display = 'none';
            resultDiv.textContent = '';
            resultDiv.classList.remove('has-data');
            resultDiv.classList.remove('loading');
        }
        const currentTab = yield getCurrentTab();
        if (currentTab) {
            // Get current tab html content
            console.log('Current tab ID:', currentTab.id);
            const [{ result: paragraphs }] = yield chrome.scripting.executeScript({
                target: { tabId: currentTab.id },
                func: () => {
                    // This function will run in the context of the current tab
                    const paragraphs = Array.from(document.getElementsByTagName('p'))
                        .map(p => p.innerText.trim())
                        .filter(text => text.length > 0);
                    return paragraphs;
                    // You can do something with the HTML content here
                }
            });
            // Print result in the new section
            if (resultDiv && loadingDiv) {
                if (paragraphs) {
                    const response = yield fetch('http://localhost:3001/get-insights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ htmlContent: paragraphs }) });
                    const insights = yield response.json();
                    resultDiv.innerHTML = insights.result;
                    resultDiv.classList.add('has-data');
                    resultDiv.classList.remove('loading');
                    resultDiv.style.display = '';
                    loadingDiv.style.display = 'none';
                }
                else {
                    resultDiv.textContent = '';
                    resultDiv.classList.remove('has-data');
                    resultDiv.classList.remove('loading');
                    resultDiv.style.display = '';
                    loadingDiv.style.display = 'none';
                }
            }
        }
        else if (resultDiv && loadingDiv) {
            resultDiv.textContent = '';
            resultDiv.classList.remove('loading');
            resultDiv.style.display = '';
            loadingDiv.style.display = 'none';
        }
    });
}
function getCurrentTab() {
    return __awaiter(this, void 0, void 0, function* () {
        let queryOptions = { active: true, lastFocusedWindow: true };
        // `tab` will either be a `tabs.Tab` instance or `undefined`.
        let [tab] = yield chrome.tabs.query(queryOptions);
        return tab;
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('magic-btn');
    if (btn) {
        btn.addEventListener('click', onMagicButtonClick);
    }
});
