console.log('Content script is running!');

// Determine if we're on a search page or item page
const currentUrl = window.location.href;

if (currentUrl.includes('/sch/')) {
    // We're on a search page
    console.log('On search page - extracting prices...');
    setTimeout(extractPrices, 3000);
} else if (currentUrl.includes('/itm/')) {
    // We're on an item page
    console.log('On item page - looking for Buy button...');
    setTimeout(clickBuyButton, 3000);
}

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
        const priceElement = item.querySelector('.s-item__price');
        const price = priceElement?.textContent;
        const link = item.closest('.s-item')?.querySelector('a')?.href;
        const itemId = link?.match(/\/itm\/(\d+)/)?.[1];

        if (name && price) {
            items.push({
                name: name.replace(/\n/g, ' ').trim(),
                price: price.replace(/\$/g, '').trim(),
                id: itemId
            });
        } else {
            console.warn(`Item ${index + 1} has missing name or price.`);
        }
    });

    console.log('Extracted items:', items);

    chrome.runtime.sendMessage({
        action: 'updateResults',
        data: items.slice(0, 3)
    });
}

function clickBuyButton() {
    console.log('Attempting to click Buy button...');

    // Primary selectors based on the HTML you shared
    const primarySelectors = [
        'a[data-testid="x-bin-action"]',
        'a[id="binBtn_btn_1"]',
        'a[data-testid="ux-call-to-action"]',
        'a.ux-call-to-action.fake-btn.fake-btn--fluid.fake-btn--large.fake-btn--primary',
        'span.ux-call-to-action__text:contains("Buy It Now")',
        'a.btn-small.btn-ter[title*="Buy"]'
    ];

    // Try each selector in order
    for (const selector of primarySelectors) {
        let buyButton;

        if (selector.includes(':contains')) {
            // Handle text content matching (not standard querySelector)
            const parts = selector.split(':contains(');
            const baseSelector = parts[0];
            const textToMatch = parts[1].replace('"', '').replace('")', '');

            // Find all elements matching the base selector
            const elements = document.querySelectorAll(baseSelector);
            for (const element of elements) {
                if (element.textContent.includes(textToMatch)) {
                    buyButton = element.closest('a');
                    break;
                }
            }
        } else {
            buyButton = document.querySelector(selector);
        }

        if (buyButton) {
            console.log(`Buy button found with selector: ${selector}`);

            // Click the closest 'a' element (in case we found a span)
            const clickTarget = buyButton.tagName === 'A' ? buyButton : buyButton.closest('a');

            if (clickTarget) {
                // Wait another second before clicking to ensure page is fully interactive
                setTimeout(() => {
                    console.log('Clicking Buy button:', clickTarget);
                    clickTarget.click();

                    // Notify the background script that we've clicked the Buy button
                    chrome.runtime.sendMessage({
                        action: 'buyButtonClicked',
                        url: window.location.href
                    });
                }, 1000);

                return; // Exit after finding and clicking a button
            }
        }
    }

    // If primary selectors fail, try a more generic approach
    // Look for elements containing "Buy It Now" text
    const allElements = document.querySelectorAll('a, button, span');
    for (const element of allElements) {
        if (element.textContent.includes('Buy It Now')) {
            console.log('Found Buy It Now text in element:', element);

            // Click the element or its parent if it's not clickable
            const clickTarget = element.tagName === 'A' || element.tagName === 'BUTTON'
                ? element
                : element.closest('a, button');

            if (clickTarget) {
                setTimeout(() => {
                    console.log('Clicking generic Buy button:', clickTarget);
                    clickTarget.click();

                    chrome.runtime.sendMessage({
                        action: 'buyButtonClicked',
                        url: window.location.href
                    });
                }, 1000);

                return;
            }
        }
    }

    console.error('No Buy button found. The selectors might need to be updated.');

    // Report the HTML structure for debugging
    const bodyHTML = document.body.innerHTML;
    console.log('Page HTML (partial):', bodyHTML.substring(0, 5000));

    // Notify that we couldn't find a buy button
    chrome.runtime.sendMessage({
        action: 'buyButtonNotFound',
        url: window.location.href
    });
}