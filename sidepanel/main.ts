import { resetResultDiv, handleNoContent, setButtonLoadingState, setupMagicButton } from './domUtils';
import { getCurrentTab, extractTabTextContent } from './tabUtils';
import { streamAndRenderMarkdown } from './streamUtils';

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

document.addEventListener('DOMContentLoaded', () => setupMagicButton(onMagicButtonClick));
