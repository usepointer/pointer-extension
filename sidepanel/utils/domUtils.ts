// DOM manipulation helpers
export function resetResultDiv(resultDiv: HTMLElement | null) {
    if (resultDiv) {
        resultDiv.style.display = '';
        resultDiv.textContent = '';
        resultDiv.classList.remove('has-data', 'loading');
    }
}

export async function handleNoContent(resultDiv: HTMLElement) {
    resultDiv.textContent = '';
    resultDiv.classList.remove('has-data', 'loading');
    resultDiv.style.display = '';
}

export function setButtonLoadingState(isLoading: boolean) {
    const btn = document.getElementById('magic-btn') as HTMLButtonElement | null;
    if (!btn) return;
    const loadingDots = btn.querySelector('.loading-dots') as HTMLElement | null;
    const wandIcon = btn.querySelector('img') as HTMLElement | null;
    const btnText = btn.querySelector('.btn-text') as HTMLElement | null;
    if (loadingDots) loadingDots.style.display = isLoading ? 'inline-block' : 'none';
    if (wandIcon) wandIcon.style.display = isLoading ? 'none' : '';
    if (btnText) btnText.style.display = isLoading ? 'none' : '';
    btn.disabled = isLoading;
}

export function setupMagicButton(onClick: () => void) {
    const btn = document.getElementById('magic-btn');
    if (btn) {
        btn.addEventListener('click', onClick);
    }
}
