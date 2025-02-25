console.log('Content script is running!');

function extractPrices() {
    console.log('Extracting prices...');
    const items = [];
    const itemContainers = document.querySelectorAll('.s-item__info');

    if (itemContainers.length === 0) {
        console.error('No items found on the page. Check the selectors.');
        return;
    }

    itemContainers.forEach((item, index) => {
        const name = item.querySelector('.s-item__title')?.textContent;
        const price = item.querySelector('.s-item__price')?.textContent;
        if (name && price) {
            items.push({
                name: name.replace(/\n/g, ' ').trim(),
                price: price.replace(/\$/, '').trim()
            });
        } else {
            console.warn(`Item ${index + 1} has missing name or price.`);
        }
    });

    console.log('Extracted items:', items);
    chrome.runtime.sendMessage({
        action: 'updateResults',
        data: items.slice(0, 10)
    });
}

// Waiting for page to load
setTimeout(extractPrices, 2000);