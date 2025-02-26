document.getElementById('searchBtn').addEventListener('click', () => {
    const searchTerm = document.getElementById('searchInput').value.trim();
    console.log('Search button clicked. Term:', searchTerm);
    if (searchTerm) {
        // Clear previous results
        document.getElementById('results').innerHTML = 'Searching...';

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
        document.getElementById('results').innerHTML = 'Please enter a search term.';
    }
});

document.getElementById('stopBtn').addEventListener('click', () => {
    console.log('Stop button clicked.');
    // Send stop message to background script
    chrome.runtime.sendMessage({
        action: 'stopSearch'
    }, (response) => {
        console.log('Stop message sent to background script:', response);
    });

    document.getElementById('searchBtn').style.display = 'inline-block';
    document.getElementById('stopBtn').style.display = 'none';
    document.getElementById('results').innerHTML += '<div>Search stopped.</div>';
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateResults') {
        console.log('Received results:', message.data);
        if (message.data.length > 0) {
            const data = message.data;
            const latestItem = data[2]; // Keep using index 2 as specified

            document.getElementById('results').innerHTML =
                `<div class='item'>
                <div class='name'>${latestItem.name}:</div> 
                <div class='price'>$${latestItem.price}</div>
                <a href='https://www.ebay.com/itm/${latestItem.id}' target='_blank'>View item</a>
            </div>`;

            console.log(latestItem.price);

            // Convert price to number for comparison
            const priceValue = parseFloat(latestItem.price.replace(/,/g, ''));

            if (priceValue < 600) {
                document.getElementById('results').innerHTML += '<div>Price match found! Navigating to item page...</div>';

                // Get the currently active tab
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs.length > 0) {
                        const currentTab = tabs[0];
                        // Update the URL of the current tab
                        chrome.tabs.update(currentTab.id, { url: `https://www.ebay.com/itm/${latestItem.id}` }, () => {
                            console.log('Current tab URL updated to:', `https://www.ebay.com/itm/${latestItem.id}`);
                        });
                    } else {
                        console.error('No active tab found.');
                    }
                });
            }
        } else {
            document.getElementById('results').innerHTML = 'No items found.';
        }
    }

    if (message.action === 'purchaseStarted') {
        console.log('Purchase process started:', message.url);
        document.getElementById('results').innerHTML += '<div class="item"><strong>Purchase process started!</strong><br>Clicked Buy button on item page.</div>';
        document.getElementById('searchBtn').style.display = 'inline-block';
        document.getElementById('stopBtn').style.display = 'none';
    }

    if (message.action === 'purchaseFailed') {
        console.log('Purchase process failed:', message.reason);
        document.getElementById('results').innerHTML += `<div class="item"><strong>Purchase process failed:</strong><br>${message.reason}</div>`;
    }
});