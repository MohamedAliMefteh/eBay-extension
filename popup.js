let refreshIntervalId;
let currentTabId;

document.getElementById('searchBtn').addEventListener('click', () => {
    const searchTerm = document.getElementById('searchInput').value.trim();
    console.log('Search button clicked. Term:', searchTerm);
    if (searchTerm) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.runtime.sendMessage({
                tabId: tabs[0].id,
                action: 'startSearch',
                url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchTerm)}&_sop=10`,
            }, (response) => {
                console.log('Message sent to background script:', response);
            });
        });

        document.getElementById('searchBtn').style.display = 'none';
        document.getElementById('stopBtn').style.display = 'inline-block';
    } else {
        console.log('Search term is empty.');
    }
});

document.getElementById('stopBtn').addEventListener('click', () => {
    console.log('Stop button clicked.');
    clearInterval(refreshIntervalId);
    document.getElementById('searchBtn').style.display = 'inline-block';
    document.getElementById('stopBtn').style.display = 'none';
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateResults') {
        console.log('Received results:', message.data);
        if (message.data.length > 0) {
            document.getElementById('results').innerHTML = message.data
                .map(item => `<div>${item.name}: $${item.price}</div>`)
                .join('');
        } else {
            document.getElementById('results').innerHTML = 'No items found.';
        }
    }
});