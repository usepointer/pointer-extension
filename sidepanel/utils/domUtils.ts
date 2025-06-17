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
    setupButtonClick('magic-btn', onClick)
}

export function setupNewConversationButton(onClick: () => void) {
    setupButtonClick('new-conversation', onClick)
}

export function setupAddTabsButton(onClick: () => void) {
    setupButtonClick('add-tabs', onClick)
}

export function setupButtonClick(buttonId: string, onClick: () => void) {
    const btn = document.getElementById(buttonId);
    if (btn) {
        btn.addEventListener('click', onClick);
    }
}