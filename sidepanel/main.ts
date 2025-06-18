import { resetResultDiv, handleNoContent, setButtonLoadingState, setupMagicButton, resetPromptInput, getCustomPrompt, setupNewConversationButton, setupAddTabsButton, setupTabCheckbox } from './utils/domUtils';
import { getCurrentTab, extractTabTextContent, getOpenTabs } from './utils/tabUtils';
import { streamAndRenderMarkdown } from './utils/streamUtils';
import { State } from './state/base.state';

const backendHost = import.meta.env.VITE_BACKEND_HOST

type TabsState = {
    tabs: { id: number, title: string, favIconUrl: string, selected: boolean }[],
    activeTabId: number
}

type TabContent = { tabTitle: string, content: string[] }

const tabsState = new State<TabsState>();
tabsState.subscribe(populateTabsSelection)
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

    const contents = await prepareContent()

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

async function prepareContent(): Promise<TabContent[]> {
    const tabIdsSet = new Set(tabsState.state.tabs.filter(({ selected }) => selected).map(({ id }) => id));
    tabIdsSet.add(tabsState.state.activeTabId);
    const content: TabContent[] = [];
    for (const tabId of tabIdsSet) {
        const [{ result: tabContent }] = await chrome.scripting.executeScript({
            target: { tabId },
            func: extractTabTextContent
        });
        const tabTitle = tabsState.state.tabs.find(({ id }) => id === tabId).title
        content.push({ tabTitle, content: tabContent })
    }

    return content;
}

async function onAddTabsButtonClick(e: MouseEvent) {
    e.stopPropagation();
    const tabsSelectionContainer = document.getElementById('tabs-selection')
    tabsSelectionContainer.classList.toggle('hidden')
}

function onTabChecked(tabId: number, e: MouseEvent) {
    e.stopPropagation();
    const tab = tabsState.state.tabs.find(({ id }) => id === tabId);
    tab.selected = !tab.selected
    tabsState.setState(tabsState.state)
}

function populateTabsSelection(tabsState: TabsState) {
    console.log('populating tabs selection')
    const tabsSelectionContainer = document.getElementById('tabs-selection')
    const openTabISelectionItems = tabsState.tabs.map(({ id: tabId, favIconUrl: iconUrl, selected, title }) => {
        const isActiveTab = tabId === tabsState.activeTabId
        const openTabSelectionItem = document.createElement('div');
        openTabSelectionItem.innerHTML += `<div
                class="flex items-center h-8 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded-xl gap-2 cursor-pointer select-none p-2">
                <input id="${tabId}" type="checkbox" ${selected || isActiveTab ? "checked" : ""}>
                <label for="${tabId}" class="flex items-center h-8 w-50 gap-1">
                    <img src="${iconUrl}" class="w-5 align-top" />
                    <span class="truncate" title="${title}">
                        ${title}
                    </span>
                </label>
            </div>`

        return openTabSelectionItem
    })
    tabsSelectionContainer.innerHTML = ''
    tabsSelectionContainer.append(...openTabISelectionItems)
    tabsState.tabs.forEach(({ id }) => {
        setupTabCheckbox(id, onTabChecked)
    })
}

document.addEventListener('click', outsideClickListener)

document.addEventListener('keydown', (e: KeyboardEvent) => {
    const tabsSelectionContainer = document.getElementById('tabs-selection')
    const customPrompt = document.getElementById('custom-prompt') as HTMLTextAreaElement
    if (e.key === 'Escape') {
        if (!tabsSelectionContainer.classList.contains('hidden')) {
            tabsSelectionContainer.classList.add('hidden')
            customPrompt.focus();
        }
    }
})

document.addEventListener('DOMContentLoaded', async () => {
    const tabs = await getOpenTabs();
    const activeTab = await getCurrentTab();
    tabsState.setState({ tabs: tabs.map(({ id, title, favIconUrl }) => ({ id, title, favIconUrl, selected: false })), activeTabId: activeTab.id })
    setupMagicButton(onMagicButtonClick)
    setupNewConversationButton(resetResultDiv)
    setupAddTabsButton(onAddTabsButtonClick)
});

const textArea = document.getElementById('custom-prompt') as HTMLInputElement;
textArea.addEventListener("input", () => {
    const submitButton = document.getElementById('magic-btn') as HTMLButtonElement;
    submitButton.disabled = textArea.value.trim() === "";
});

function outsideClickListener(e: MouseEvent) {
    const tabsSelectionContainer = document.getElementById('tabs-selection')
    if (!tabsSelectionContainer.contains(e.target as Node)) {
        tabsSelectionContainer.classList.add('hidden')
    }
}

chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
    tabsState.setState({ activeTabId: tabId })
});

chrome.tabs.onUpdated.addListener((tabId, changedInfo, tab) => {
    if (changedInfo.status === 'complete') {
        const tabs = tabsState.state.tabs;
        const updatedTab = tabs.find(({ id }) => id === tabId);
        if (!updatedTab) {
            tabs.push({ id: tab.id, favIconUrl: tab.favIconUrl, title: tab.title, selected: false })
        } else {
            updatedTab.favIconUrl = tab.favIconUrl;
            updatedTab.title = tab.title
        }
        tabsState.setState({ tabs })

    }
})

chrome.tabs.onRemoved.addListener((tabId) => {
    const filteredTabs = tabsState.state.tabs.filter(({ id }) => id !== tabId)
    tabsState.setState({ tabs: filteredTabs })
})