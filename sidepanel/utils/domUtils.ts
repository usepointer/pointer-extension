// DOM manipulation helpers
export function resetResultDiv(resultDiv: HTMLElement | null) {
    if (resultDiv) {
        resultDiv.style.display = '';
        resultDiv.textContent = '';
        resultDiv.classList.remove('has-data', 'loading');
    }
}

export function resetPromptInput(textArea: HTMLTextAreaElement) {
    textArea.value = ''
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
    const btn = document.getElementById('magic-btn');
    if (btn) {
        btn.addEventListener('click', onClick);
    }
}
