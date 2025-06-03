"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
let isOpen = false;
chrome.commands.onCommand.addListener((command, tab) => __awaiter(void 0, void 0, void 0, function* () {
    if (command === 'toggle-side-panel') {
        if (!isOpen) {
            chrome.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
        }
        else {
            yield chrome.sidePanel.setOptions({ enabled: false });
            yield chrome.sidePanel.setOptions({ enabled: true });
        }
        isOpen = !isOpen;
    }
}));
