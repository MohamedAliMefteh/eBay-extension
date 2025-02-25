let refreshIntervalId;

function loadTab(message) {
    chrome.tabs.update(message.tabId, { url: message.url }, () => {
        console.log('Navigated to eBay search page.');
    });
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background script received message:', message);

    if (message.action === 'startSearch') {
        loadTab(message);
        refreshIntervalId = setInterval(() => loadTab(message), 10000);
    }

    if (message.action === 'stopSearch') {
        console.log('Stopping search.');
        clearInterval(refreshIntervalId);
    }
});