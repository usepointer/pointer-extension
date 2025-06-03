async function onMagicButtonClick() {
    const currentTab = await getCurrentTab();
    if (currentTab) {
        // Get current tab html content
        console.log('Current tab ID:', currentTab.id);
        const [{ result }] = await chrome.scripting.executeScript({
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
            } else {
                resultDiv.textContent = '';
                resultDiv.classList.remove('has-data');
            }
        }
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