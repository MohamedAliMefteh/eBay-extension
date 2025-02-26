let refreshIntervalId;

function loadTab(message) {
    chrome.tabs.update(message.tabId, { url: message.url }, () => {
        console.log('Navigated to:', message.url);
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background script received message:', message);

    if (message.action === 'startSearch') {
        // Clear any existing interval before starting a new one
        if (refreshIntervalId) {
            clearInterval(refreshIntervalId);
        }
        loadTab(message);
        refreshIntervalId = setInterval(() => loadTab(message), 10000);
    }

    if (message.action === 'startPurchase') {
        loadTab(message);
    }

    if (message.action === 'stopSearch') {
        console.log('Stopping search.');
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
        // Send confirmation back to popup if needed
        if (sendResponse) {
            sendResponse({ status: 'stopped' });
        }
    }

    if (message.action === 'buyButtonClicked') {
        console.log('Buy button clicked on:', message.url);
        // Stop the search after initiating purchase
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;

        // Notify popup that purchase process has started
        chrome.runtime.sendMessage({
            action: 'purchaseStarted',
            url: message.url
        });
    }

    if (message.action === 'buyButtonNotFound') {
        console.log('Buy button not found on:', message.url);
        // Notify popup about the issue
        chrome.runtime.sendMessage({
            action: 'purchaseFailed',
            url: message.url,
            reason: 'Buy button not found'
        });
    }

    // Return true to indicate we might respond asynchronously
    return true;
});