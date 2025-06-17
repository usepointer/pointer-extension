import { resetResultDiv, handleNoContent, setButtonLoadingState, setupMagicButton, resetPromptInput, getCustomPrompt, setupNewConversationButton, setupAddTabsButton } from './utils/domUtils';
import { getCurrentTab, extractTabTextContent, getOpenTabs } from './utils/tabUtils';
import { streamAndRenderMarkdown } from './utils/streamUtils';

const backendHost = import.meta.env.VITE_BACKEND_HOST

let tabsSelection: { tabId: number, tab: chrome.tabs.Tab, selected: boolean }[] = [];
let activeTabId: number | null;
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
    const customPrompt = getCustomPrompt()
    resetPromptInput()
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
                const inputMessageDiv = document.createElement('div');
                const inputMessageClass = `justify-self-end dark:bg-neutral-600 bg-neutral-200 rounded-2xl p-2 m-3 max-w-3xs`
                inputMessageDiv.setAttribute('class', inputMessageClass)
                inputMessageDiv.innerHTML = customPrompt
                const responseMessageDiv = document.createElement('article');
                resultDiv.append(inputMessageDiv)
                resultDiv.append(responseMessageDiv)
                const response = await fetch(`${backendHost}/insights`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
                    body: JSON.stringify({ htmlContent: contents, customPrompt })
                });
                if (!response.ok) throw new Error('Backend error');
                await streamAndRenderMarkdown(response, responseMessageDiv);
            } catch (err) {
                console.error(err)
                showBackendError(resultDiv);
            }
        } else {
            await handleNoContent(resultDiv);
        }
    }
}

async function onAddTabsButtonClick() {
    const tabsSelectionContainer = document.getElementById('tabs-selection')
    tabsSelectionContainer.classList.toggle('hidden')
}

async function populateTabsSelection() {
    const openTabs = await getOpenTabs()
    tabsSelection = openTabs.map(tab => ({ tabId: tab.id, tab, selected: false }))
    const tabsSelectionContainer = document.getElementById('tabs-selection')
    const openTabISelectionItems = tabsSelection.map(({ tab, selected }) => {
        const openTabSelectionItem = document.createElement('div');
        openTabSelectionItem.innerHTML += `<div
                class="flex items-center h-8 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded-xl gap-2 cursor-pointer select-none p-2">
                <input id="${tab.id}" type="checkbox">
                <label for="${tab.id}" class="flex items-center h-8 w-50 gap-1">
                    <img src="${tab.favIconUrl}" class="w-5 align-top" />
                    <span class="truncate" title="${tab.title}">
                        ${tab.title}
                    </span>
                </label>
            </div>`
        return openTabSelectionItem
    })

    const { id: tabId } = await getCurrentTab();
    setActiveTab(tabId)

    tabsSelectionContainer.append(...openTabISelectionItems)
}

document.addEventListener('DOMContentLoaded', async () => {
    await populateTabsSelection()
    setupMagicButton(onMagicButtonClick)
    setupNewConversationButton(resetResultDiv)
    setupAddTabsButton(onAddTabsButtonClick)
});

const textArea = document.getElementById('custom-prompt') as HTMLInputElement;
textArea.addEventListener("input", () => {
    const submitButton = document.getElementById('magic-btn') as HTMLButtonElement;
    submitButton.disabled = textArea.value.trim() === "";
});

chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
    setActiveTab(tabId)
});

function setActiveTab(tabId: number) {
    activeTabId = tabId;
    tabsSelection.find(tab => tab.tabId === activeTabId).selected = true;
}