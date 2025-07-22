// Import puppeteer-extra for browser automation and stealth plugin to avoid detection
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs'); // For writing the CSV file
const path = require('path'); // For handling file paths
const { parse } = require('json2csv'); // For converting JSON to CSV

// Enable stealth mode to help bypass bot detection
puppeteer.use(StealthPlugin());

(async () => {
  // The Shopify product page URL to extract reviews from
  const url = 'https://hemloya.com/products/starling-button-up-shirt';

  // Launch Puppeteer in headed mode (browser window visible)
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();

  // Navigate to the product page and wait for the network to be idle
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Wait for the 'Read More Reviews' popup button and click it to open the reviews modal
  const popupBtnSelector = 'a.jdgm-btn.jdgm-btn--dark[role="button"]';
  await page.waitForSelector(popupBtnSelector, { timeout: 15000 });
  await page.click(popupBtnSelector);

  // Wait for the first review card to appear in the popup
  await page.waitForSelector('.jdgm-rev', { timeout: 15000 });

  let allReviews = []; // Array to store all extracted reviews
  let pageNum = 1; // Track the current review page number
  while (true) {
    // 1. Expand all truncated reviews by clicking 'Read more' in each card
    // This ensures we get the full review text, not just the preview
    const readMoreBtns = await page.$$('a.jdgm-rev__body-read-more');
    for (const btn of readMoreBtns) {
      try {
        await btn.click(); // Click to expand
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UI update
      } catch (e) { /* Ignore errors if button is not clickable */ }
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for all text to expand

    // 2. Extract all review data from each card
    // Each review is inside a div with class 'jdgm-rev jdgm-divider-top jdgm--done-setup'
    const reviews = await page.$$eval('div.jdgm-rev.jdgm-divider-top.jdgm--done-setup', cards => cards.map(card => {
      // Helper to get text content from a selector
      const getText = (sel) => {
        const el = card.querySelector(sel);
        return el ? el.textContent.trim() : '';
      };
      // Helper to get attribute value from a selector
      const getAttr = (sel, attr) => {
        const el = card.querySelector(sel);
        return el ? el.getAttribute(attr) : '';
      };
      // Helper to get all image URLs in the review
      const getImgs = () => {
        return Array.from(card.querySelectorAll('.jdgm-rev__pic-img')).map(img => img.src || img.getAttribute('data-src'));
      };
      // Return an object with all relevant review data
      return {
        review_id: card.getAttribute('data-review-id'), // Unique review ID
        author: getText('.jdgm-rev__author'), // Reviewer name
        location: getText('.jdgm-rev__location'), // Reviewer location
        date: getAttr('.jdgm-rev__timestamp', 'data-content') || getText('.jdgm-rev__timestamp'), // Review date
        rating: getAttr('.jdgm-rev__rating', 'data-score'), // Star rating
        title: getText('.jdgm-rev__title'), // Review title
        body: getText('.jdgm-rev__body'), // Full review text
        images: getImgs().join(';'), // Any attached images (semicolon-separated)
      };
    }));
    allReviews.push(...reviews); // Add current page's reviews to the main array
    console.log(`Extracted ${reviews.length} reviews from page ${pageNum}`);

    // 3. Paginate by clicking 'Load More' until no more reviews
    // Look for the 'Load More' button to fetch more reviews
    const loadMoreBtn = await page.$('a.jdgm-btn.jdgm-btn--solid.jdgm-paginate__load-more');
    if (loadMoreBtn) {
      await loadMoreBtn.click(); // Click to load more reviews
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for new reviews to load
      pageNum++;
    } else {
      break; // No more pages, exit loop
    }
  }

  // 4. Save all reviews to a CSV file
  // Convert the array of review objects to CSV format
  const csv = parse(allReviews, { fields: ['review_id', 'author', 'location', 'date', 'rating', 'title', 'body', 'images'] });
  const outPath = path.join(__dirname, 'reviews.csv'); // Output file path
  fs.writeFileSync(outPath, csv); // Write CSV to disk
  console.log(`Saved ${allReviews.length} reviews to reviews.csv`);

  // 5. Keep browser open until manually closed
  // This allows you to inspect the browser or stop the script manually
  console.log('Extraction complete. Browser will remain open. Close manually when done.');
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Infinite wait
  }
})(); 