const fs = require('node:fs');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const { createServer } = require('../handbook/preview');
(async () => {
 const server = createServer();
 await new Promise(r => server.listen(0, '127.0.0.1', r));
 const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
 try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const base = `http://127.0.0.1:${server.address().port}`;
  await page.goto(base + '/tanfolyam');
  assert.equal(await page.$$eval('.course-chapters li', x => x.length), 10);
  await page.click('.course-chapters a');
  const source = fs.readFileSync('course/fejezet-1.md', 'utf8');
  const normalize = s => s.replace(/\s+/g, ' ').trim();
  const expected = source.trim().split(/\r?\n\s*\r?\n/).filter(x => x !== '---').map(x => normalize(x.replace(/^#{1,3} /, '').replace(/^\* /gm, '').replace(/\*\*/g, '')));
  const actual = await page.$$eval('[data-course-source]', nodes => nodes.map(n => n.innerText.replace(/\s+/g, ' ').trim()));
  assert.deepEqual(actual, expected);
  assert.equal(await page.$$eval('.course-sidebar a', n => n.length), 19);
  for (const width of [1440, 1024, 768, 390, 320]) {
   await page.setViewport({width, height: 900});
   assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
   if (width === 390) {
    await page.click('.hdr__menu-btn');
    assert.equal(await page.$eval('.hdr__menu-btn', n => n.getAttribute('aria-expanded')), 'true');
    await page.click('.hdr__menu-btn');
   }
   if ([1440, 390].includes(width)) await page.screenshot({path: `course/preview-${width}.png`});
  }
  assert.deepEqual(errors, []);
  console.log(`Verified ${actual.length} unchanged source blocks, 19 section links, 10 chapters, mobile menu and 5 viewport widths.`);
 } finally { await browser.close(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
