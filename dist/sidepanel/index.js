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
        const currentTab = yield getCurrentTab();
        if (currentTab) {
            // Get current tab html content
            console.log('Current tab ID:', currentTab.id);
            const [{ result }] = yield chrome.scripting.executeScript({
                target: { tabId: currentTab.id },
                func: () => {
                    // This function will run in the context of the current tab
                    const htmlContent = document.documentElement.outerHTML;
                    return htmlContent;
                    // You can do something with the HTML content here
                }
            });
            // Print result in the new section
            const resultDiv = document.getElementById('magic-result');
            if (resultDiv) {
                if (result && result.trim()) {
                    resultDiv.textContent = result;
                    resultDiv.classList.add('has-data');
                }
                else {
                    resultDiv.textContent = '';
                    resultDiv.classList.remove('has-data');
                }
            }
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
