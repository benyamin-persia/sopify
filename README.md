# Shopify Review Extractor

This project is a Node.js automation tool that extracts all customer reviews from a specific Shopify product page using Puppeteer and the Stealth plugin. It is designed to work with review popups and paginated review lists, saving all extracted data to a CSV file for easy analysis.

## Features
- Automates browser actions using Puppeteer with stealth mode to avoid detection
- Clicks 'Read More Reviews' and expands all truncated reviews
- Extracts reviewer name, location, date, rating, title, full review text, and images
- Handles pagination by clicking 'Load More' until all reviews are collected
- Saves all reviews to a `reviews.csv` file
- Keeps the browser open for manual inspection until you close it

## Requirements
- Node.js (v16 or higher recommended)
- npm (Node Package Manager)

## Setup
1. **Clone the repository:**
   ```sh
   git clone https://github.com/benyamin-persia/sopify.git
   cd sopify
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```

## Usage
1. **Run the extractor script:**
   ```sh
   node sopify/extract-reviews.js
   ```
2. The script will:
   - Open the browser in visible (headed) mode
   - Navigate to the target Shopify product page
   - Open the reviews popup and extract all reviews (including paginated ones)
   - Save the results to `sopify/reviews.csv`
   - Keep the browser open until you close it manually

## Configuration
- To change the target Shopify product, edit the `url` variable at the top of `sopify/extract-reviews.js`.

## License
This project is licensed under the MIT License. 