'use strict';

window.onload = function () {
    let updateInterval = this.document.getElementById('updateInterval');

    updateInterval.onchange = () => chrome.storage.local.set({ updateInterval: updateInterval.value });

    chrome.storage.local.get(['updateInterval'], res => {
        let value = res.updateInterval || 1;
        if (value < 0 || value > 99) {
            value = 1;
        }
        updateInterval.value = value;
    })
}