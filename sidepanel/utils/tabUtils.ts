// Tab and content extraction helpers
export async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

export async function getOpenTabs(): Promise<chrome.tabs.Tab[]> {
    let queryOptions = { lastFocusedWindow: true }
    const tabs = await chrome.tabs.query(queryOptions);
    return tabs;
}

export function extractTabHTMLContent() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(document.body.outerHTML, 'text/html');

    ['script', 'svg', 'style'].forEach(tag => {
        doc.querySelectorAll(tag).forEach(el => el.remove());
    });

    doc.querySelectorAll('*').forEach(el => {
        [...el.attributes].forEach(attr => {
            if (attr.name !== 'id') {
                el.removeAttribute(attr.name);
            }
        });
    });
    const outerHTML = doc.documentElement.outerHTML;
    return outerHTML
        .replace(/\n/g, '')
        .replace(/\t/g, '')
        .replace(/<div/g, '<d')
        .replace(/<\/div>/g, '</d>')
        .replace(/<span/g, '<s')
        .replace(/<\/span>/g, '</s>');
}

export function extractTabTextContent() {
    const paragraphs = Array.from(document.getElementsByTagName('p'))
        .map(p => p.innerText.trim())
        .filter(text => text.length > 0);
    const spans = Array.from(document.getElementsByTagName('span'))
        .map(p => p.innerText.trim())
        .filter(text => text.length > 0);
    return [...paragraphs, ...spans];
}