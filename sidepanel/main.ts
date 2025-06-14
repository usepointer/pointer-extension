import { resetResultDiv, handleNoContent, setButtonLoadingState, setupMagicButton } from './utils/domUtils';
import { getCurrentTab, extractTabTextContent } from './utils/tabUtils';
import { streamAndRenderMarkdown } from './utils/streamUtils';

const backendHost = import.meta.env.VITE_BACKEND_HOST

// Helper to show error message with icon
function showBackendError(div: HTMLElement) {
    div.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 200px;">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 1.2em; font-weight: bold; color: #f5f5f7; background: #23272f; padding: 12px 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(30,34,40,0.08);">
                <span>🚧</span>
                <span>Something went wrong, let's try again</span>
            </div>
        </div>
    `;
}

// Main event handler
async function onMagicButtonClick() {
    const resultDiv = document.getElementById('conversation');
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
            try {
                const response = await fetch(`${backendHost}/insights`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
                    body: JSON.stringify({ htmlContent: contents, customPrompt })
                });
                if (!response.ok) throw new Error('Backend error');
                await streamAndRenderMarkdown(response, resultDiv);
            } catch (err) {
                showBackendError(resultDiv);
            }
        } else {
            await handleNoContent(resultDiv);
        }
    }
    setButtonLoadingState(false);
}

document.addEventListener('DOMContentLoaded', () => setupMagicButton(onMagicButtonClick));
