// DOM manipulation helpers
export function resetResultDiv() {
    console.log('Reseting conversations')
    const resultDiv = document.getElementById('conversation');
    resultDiv.innerHTML = ''
}

export function resetPromptInput() {
    const textArea = document.getElementById('custom-prompt') as HTMLTextAreaElement
    const submitButton = document.getElementById('magic-btn') as HTMLButtonElement;
    textArea.value = ''
    submitButton.disabled = true;
    textArea.focus()
}

export function getCustomPrompt() {
    const customPromptInput = document.getElementById('custom-prompt') as HTMLTextAreaElement | null;
    return customPromptInput.value || '';
}

export async function handleNoContent(resultDiv: HTMLElement) {
    resultDiv.textContent = '';
    resultDiv.classList.remove('has-data', 'loading');
    resultDiv.style.display = '';
}

export function setButtonLoadingState(isLoading: boolean) {
    const btn = document.getElementById('magic-btn') as HTMLButtonElement | null;
    if (!btn) return;
    btn.disabled = isLoading
}

export function setupMagicButton(onClick: () => void) {
    setupElemenetClick('magic-btn', onClick)
}

export function setupNewConversationButton(onClick: () => void) {
    setupElemenetClick('new-conversation', onClick)
}

export function setupAddTabsButton(onClick: (e: MouseEvent) => void) {
    setupElemenetClick('add-tabs', onClick)
}

export function setupTabCheckbox(tabId: number, onClick: (tabId: number, e: MouseEvent) => void) {
    setupElemenetClick(String(tabId), (e: MouseEvent) => onClick(tabId, e))
}

export function setupElemenetClick(elementId: string, onClick: (...args: any[]) => void) {
    const elemenet = document.getElementById(elementId);
    if (elemenet) {
        elemenet.addEventListener('click', onClick);
    }
}