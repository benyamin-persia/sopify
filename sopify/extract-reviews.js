const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv');

puppeteer.use(StealthPlugin());

(async () => {
  const url = 'https://hemloya.com/products/starling-button-up-shirt';
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle2' });

  // Wait for the 'Read More Reviews' popup button and click it
  const popupBtnSelector = 'a.jdgm-btn.jdgm-btn--dark[role="button"]';
  await page.waitForSelector(popupBtnSelector, { timeout: 15000 });
  await page.click(popupBtnSelector);

  // Wait for the reviews popup to appear
  await page.waitForSelector('.jdgm-rev', { timeout: 15000 });

  let allReviews = [];
  let pageNum = 1;
  while (true) {
    // 1. Expand all truncated reviews by clicking 'Read more' in each card
    const readMoreBtns = await page.$$('a.jdgm-rev__body-read-more');
    for (const btn of readMoreBtns) {
      try { await btn.click(); await new Promise(resolve => setTimeout(resolve, 100)); } catch (e) { /* ignore */ }
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for text to expand

    // 2. Extract all review data from each card
    const reviews = await page.$$eval('div.jdgm-rev.jdgm-divider-top.jdgm--done-setup', cards => cards.map(card => {
      const getText = (sel) => {
        const el = card.querySelector(sel);
        return el ? el.textContent.trim() : '';
      };
      const getAttr = (sel, attr) => {
        const el = card.querySelector(sel);
        return el ? el.getAttribute(attr) : '';
      };
      const getImgs = () => {
        return Array.from(card.querySelectorAll('.jdgm-rev__pic-img')).map(img => img.src || img.getAttribute('data-src'));
      };
      return {
        review_id: card.getAttribute('data-review-id'),
        author: getText('.jdgm-rev__author'),
        location: getText('.jdgm-rev__location'),
        date: getAttr('.jdgm-rev__timestamp', 'data-content') || getText('.jdgm-rev__timestamp'),
        rating: getAttr('.jdgm-rev__rating', 'data-score'),
        title: getText('.jdgm-rev__title'),
        body: getText('.jdgm-rev__body'),
        images: getImgs().join(';'),
      };
    }));
    allReviews.push(...reviews);
    console.log(`Extracted ${reviews.length} reviews from page ${pageNum}`);

    // 3. Paginate by clicking 'Load More' until no more reviews
    const loadMoreBtn = await page.$('a.jdgm-btn.jdgm-btn--solid.jdgm-paginate__load-more');
    if (loadMoreBtn) {
      await loadMoreBtn.click();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for new reviews to load
      pageNum++;
    } else {
      break;
    }
  }

  // 4. Save all reviews to a CSV file
  const csv = parse(allReviews, { fields: ['review_id', 'author', 'location', 'date', 'rating', 'title', 'body', 'images'] });
  const outPath = path.join(__dirname, 'reviews.csv');
  fs.writeFileSync(outPath, csv);
  console.log(`Saved ${allReviews.length} reviews to reviews.csv`);

  // 5. Keep browser open until manually closed
  console.log('Extraction complete. Browser will remain open. Close manually when done.');
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
})(); 