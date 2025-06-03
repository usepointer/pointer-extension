chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

let isOpen = false;
chrome.commands.onCommand.addListener(async (command, tab) => {
    if (command === 'toggle-side-panel') {
        if (!isOpen) {
            chrome.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
        } else {
            await chrome.sidePanel.setOptions({ enabled: false });
            await chrome.sidePanel.setOptions({ enabled: true });
        }

        isOpen = !isOpen;
    }
});