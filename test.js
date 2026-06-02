const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto(`file://${__dirname.replace(/\\/g, '/')}/public/index.html`, { waitUntil: 'networkidle0' });

  console.log('Page loaded. Clicking .cat-tile (Tájékoztatás)...');
  
  // Click the first category tile
  await page.click('.cat-tile');
  
  // Wait a little bit to let hashchange fire
  await new Promise(r => setTimeout(r, 1000));
  
  // Check the URL hash
  const hash = await page.evaluate(() => window.location.hash);
  console.log('URL Hash after click:', hash);
  
  // Check if events section is scrolled into view (we can just check active filters)
  const activeFilters = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.filter-btn.is-active')).map(el => el.textContent);
  });
  console.log('Active filters:', activeFilters);

  console.log('Taking screenshot...');
  await page.screenshot({ path: 'screenshot.png' });
  
  // Also check viewport scroll position
  const scrollY = await page.evaluate(() => window.scrollY);
  console.log('Window Scroll Y:', scrollY);

  await browser.close();
})();
