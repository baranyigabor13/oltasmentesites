const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const puppeteer = require('puppeteer');
const { createServer } = require('./preview');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'scrollcraft/builds/handbook/evidence');
const normalize = text => text.replace(/\s+/g, ' ').trim();
const sourceBuffer = fs.readFileSync(path.join(__dirname, 'source.md'));
const source = sourceBuffer.toString('utf8');
// Pinned to the original attachment, independently of the production parser.
assert.equal(crypto.createHash('sha256').update(sourceBuffer).digest('hex'), '771f10d6f2a81ca3e645500137495fc6e60dceb6f831e1a970a008c2f3552f37');
const plainSource = normalize(source.replace(/^---\s*$/gm, '').replace(/^\d+\. /gm, '').replace(/^#{1,3} /gm, '').replace(/^[*>] /gm, '').replace(/\*\*/g, ''));
const expectedBlocks = source.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/).filter(block => block !== '---')
  .flatMap(block => block.startsWith('* ') ? block.split('\n') : [block])
  .map(block => normalize(block.replace(/^\d+\. /, '').replace(/^#{1,3} /, '').replace(/^[*>] /gm, '').replace(/\*\*/g, '')));

async function canonical(page) {
  return page.$$eval('[data-source]', nodes => nodes.map(node => {
    const clone = node.cloneNode(true);
    clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    return clone.textContent;
  }).join('\n'));
}
async function geometry(page) {
  return page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    hidden: [...document.querySelectorAll('[data-source]')].filter(n => {
      for (let el = n; el; el = el.parentElement) {
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < .99) return true;
      }
      return n.getBoundingClientRect().height === 0;
    }).map(n => n.dataset.source),
  }));
}
async function capture(page, name) {
  await page.screenshot({ path: path.join(out, `${name}.png`) });
}
async function jump(page, id, fraction = 0) {
  await page.evaluate(({ id, fraction }) => {
    const el = document.getElementById(id), r = el.getBoundingClientRect();
    scrollTo({ top: scrollY + r.top - 72 + Math.max(0, r.height - innerHeight + 72) * fraction, behavior: 'instant' });
  }, { id, fraction });
  await new Promise(resolve => setTimeout(resolve, 100));
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const before = fs.readdirSync(path.join(root, 'public')).map(name => [name, fs.readFileSync(path.join(root, 'public', name))]);
  execFileSync(process.execPath, ['build.js'], { cwd: root });
  for (const [name, data] of before) assert.ok(data.equals(fs.readFileSync(path.join(root, 'public', name))), `Rebuild changed ${name}`);
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await puppeteer.launch({ ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}), headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // A scroll experience must not capture the user's pointer during verification.
  await page.evaluateOnNewDocument(() => {
    Element.prototype.requestPointerLock = () => Promise.resolve();
    Element.prototype.setPointerCapture = () => {};
  });
  try {
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(`${base}/manipulacio-anatomiaja`, { waitUntil: 'networkidle0' });
    assert.equal(normalize(await canonical(page)), plainSource, 'Article must match the complete original text in order');
    const actualBlocks = await page.$$eval('[data-source]', nodes => nodes.map(node => {
      const copy = node.cloneNode(true); copy.querySelectorAll('br').forEach(br => br.replaceWith('\n')); return copy.textContent.replace(/\s+/g, ' ').trim();
    }));
    assert.deepEqual(actualBlocks, expectedBlocks, 'Every paragraph, heading, quotation, and list item must retain its original boundary');
    assert.equal(await page.$$eval('.hb-chapter', n => n.length), 59);
    assert.equal(await page.$$eval('.hb-article h1', n => n.length), 1);
    assert.equal(await page.$$eval('#fejezet-xliii li', n => n.length), 40);
    assert.equal(await page.$$eval('#fejezet-lvi li', n => n.length), 15);
    const numbers = await page.$$eval('.hb-prose ol li', ns => ns.map(n => n.value));
    assert.deepEqual(numbers, [...source.matchAll(/^(\d+)\. /gm)].map(m => Number(m[1])));
    const scenes = ['kezikonyv', 'fejezet-ii', 'fejezet-iii', 'fejezet-xii', 'fejezet-xli', 'fejezet-lvii', 'zaro-gondolat'];
    for (const [name, width, height] of [['desktop',1440,1000], ['tablet',768,1024], ['phone',390,844], ['small-phone',320,740]]) {
      await page.setViewport({ width, height });
      await jump(page, 'kezikonyv');
      assert.deepEqual(await geometry(page), { overflow: false, hidden: [] }, `${name} must expose the complete article without overflow`);
      await capture(page, `${name}-hero`);
      if (name === 'desktop' || name === 'phone') {
        for (const fraction of [.25, .6, .15]) {
          await page.evaluate(fraction => scrollTo({ top: document.querySelector('.hb-hero').offsetHeight * fraction, behavior: 'instant' }), fraction);
          await new Promise(resolve => setTimeout(resolve, 100));
          await capture(page, `${name}-hero-${fraction}`);
        }
        for (const id of scenes.slice(1)) {
          for (const fraction of [0, .4, .8, .2]) {
            await jump(page, id, fraction);
            await capture(page, `${name}-${id}-${fraction}`);
            assert.equal((await geometry(page)).overflow, false, `${name} ${id} overflow`);
          }
        }
      }
    }
    console.log('PASS source hash, exact text, chapter structure, lists, rebuild, four viewport sizes, forward/reverse scene captures');

    await page.setViewport({ width: 1440, height: 1000 });
    await jump(page, 'fejezet-xii', .5);
    const moving = await page.$eval('.hb-diagram--documents', el => [...el.children].filter(n=>n.matches('[data-diagram-part]')).map(n => getComputedStyle(n).transform));
    await jump(page, 'fejezet-xii', .05);
    const earlier = await page.$eval('.hb-diagram--documents', el => [...el.children].filter(n=>n.matches('[data-diagram-part]')).map(n => getComputedStyle(n).transform));
    assert.notDeepEqual(moving, earlier, 'The document stack must visibly respond to scrolling');
    for (let step = 0; step < 4; step++) {
      await page.evaluate(step => {
        const cue = document.querySelectorAll('#fejezet-xli .hb-prose h4')[step];
        scrollTo({ top: scrollY + cue.getBoundingClientRect().top - innerHeight * .3, behavior: 'instant' });
      }, step);
      await new Promise(resolve => setTimeout(resolve, 100));
      assert.equal(await page.$eval('.hb-diagram--stop .is-active', el => el.textContent.trim()), 'STOP'[step], 'S.T.O.P. letter must match the original instruction in view');
    }
    await page.click('.hb-index summary');
    await page.click('.hb-index a[href="#fejezet-xli"]');
    await new Promise(resolve => setTimeout(resolve, 300));
    assert.equal(await page.evaluate(() => location.hash), '#fejezet-xli');
    assert.equal(await page.$eval('.hb-index', el => el.open), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'fejezet-xli');
    await page.click('.hb-index summary');
    await page.keyboard.press('Escape');
    assert.equal(await page.$eval('.hb-index', el => el.open), false);
    await page.click('.hb-index summary');
    await page.click('.hb-index a[href="#fejezet-lvii"]');
    await page.goBack();
    assert.equal(await page.evaluate(() => location.hash), '#fejezet-xli');
    await page.goForward();
    assert.equal(await page.evaluate(() => location.hash), '#fejezet-lvii');
    await page.click('.hb-motion');
    assert.equal(await page.$eval('body', el => el.classList.contains('hb-motion-off')), true);
    assert.equal(await page.$eval('.hb-scene .hb-chapter-side', el => getComputedStyle(el).position), 'static');
    assert.deepEqual(await geometry(page), { overflow: false, hidden: [] });
    await page.reload({ waitUntil: 'networkidle0' });
    assert.equal(await page.$eval('.hb-motion', el => el.getAttribute('aria-pressed')), 'true');
    await page.click('.hb-motion');
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await capture(page, 'reduced-motion');
    assert.equal(await page.$eval('.hb-motion', el => el.disabled), true);
    assert.deepEqual(await geometry(page), { overflow: false, hidden: [] });
    await page.emulateMediaFeatures([]);
    console.log('PASS reversible animation, chapter navigation, keyboard focus, Escape, history, motion persistence and live reduced-motion preference');

    // Browser zoom halves the CSS viewport and doubles the pixel ratio. CSS zoom
    // on body is not equivalent: it does not cause responsive media queries to reflow.
    await page.setViewport({ width: 720, height: 500, deviceScaleFactor: 2 });
    await jump(page, 'fejezet-xii', .3);
    assert.deepEqual(await geometry(page), { overflow: false, hidden: [] }, '200% zoom');
    await capture(page, 'zoom-200');
    await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
    const contrastFailures = await page.evaluate(() => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const rgba = color => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data]; };
      const luminance = rgb => rgb.slice(0,3).map(c => c / 255).map(c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4).reduce((v,c,i) => v + c*[.2126,.7152,.0722][i],0);
      return [...document.querySelectorAll('[data-source], [data-source] strong, .hb-diagram-part, .hb-motion, .hb-index summary')].flatMap(el => {
        const s = getComputedStyle(el), fg = rgba(s.color);
        let node = el, bg = [255,255,255,255];
        while(node) { const c = rgba(getComputedStyle(node).backgroundColor); if(c[3] === 255) { bg = c; break; } node = node.parentElement; }
        const a = luminance(fg), b = luminance(bg), ratio = (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        const large = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && parseInt(s.fontWeight) >= 700);
        return ratio < (large ? 3 : 4.5) ? [{ text: el.textContent.slice(0,60), ratio }] : [];
      });
    });
    assert.deepEqual(contrastFailures, [], 'Text contrast against its rendered solid surface');

    await page.emulateMediaType('print');
    assert.equal(normalize(await canonical(page)), plainSource);
    assert.deepEqual(await geometry(page), { overflow: false, hidden: [] });
    await page.pdf({ path: path.join(out, 'handbook-print.pdf'), format: 'A4', margin: { top: '16mm', bottom: '16mm', left: '18mm', right: '18mm' } });
    await page.emulateMediaType('screen');
    await page.setJavaScriptEnabled(false);
    await page.reload({ waitUntil: 'networkidle0' });
    assert.equal(normalize(await canonical(page)), plainSource);
    assert.deepEqual(await geometry(page), { overflow: false, hidden: [] });
    await jump(page, 'fejezet-lvii');
    await capture(page, 'no-javascript');
    await page.setJavaScriptEnabled(true);
    console.log('PASS 200% zoom, print PDF and complete no-JavaScript fallback');

    await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
    assert.equal(await page.$$eval('.handbook-entry', nodes => nodes.length), 1);
    await page.type('#search-input', 'védőnő');
    const count = await page.$$eval('.ev-card', nodes => nodes.filter(n => !n.classList.contains('is-hidden')).length);
    assert.ok(count > 0 && count < 34, 'Existing homepage filtering remains functional');
    await page.setViewport({ width: 390, height: 844 });
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.click('.hdr__menu-btn');
    assert.equal(await page.$eval('.hdr__menu-btn', n => n.getAttribute('aria-expanded')), 'true');
    await page.click('#mobile-nav a[href="/manipulacio-anatomiaja"]');
    await page.waitForSelector('.hb-article');
    assert.ok(page.url().endsWith('/manipulacio-anatomiaja'));
    assert.deepEqual(errors, [], 'No browser errors');
    console.log('PASS homepage entry, existing filtering, mobile navigation and browser errors');
    const sheet = await browser.newPage();
    for (const kind of ['desktop', 'phone']) {
      const files = fs.readdirSync(out).filter(name => name.startsWith(`${kind}-`) && name.endsWith('.png') && !name.includes('contact-sheet'));
      const width = kind === 'desktop' ? 360 : 195;
      const columns = kind === 'desktop' ? 4 : 6;
      const rows = Math.ceil(files.length / columns);
      const height = kind === 'desktop' ? 250 : 422;
      await sheet.setViewport({ width: width * columns, height: (height + 24) * rows, deviceScaleFactor: 1 });
      await sheet.setContent(`<html><body style="margin:0;background:#202020;display:grid;grid-template-columns:repeat(${columns},${width}px);font:10px monospace;color:white">${files.map(file => `<div><div style="height:24px;display:flex;align-items:center">${file}</div><img style="display:block;width:${width}px;height:${height}px" src="data:image/png;base64,${fs.readFileSync(path.join(out,file)).toString('base64')}"></div>`).join('')}</body></html>`);
      await sheet.evaluate(() => Promise.all([...document.images].map(img => img.decode())));
      await sheet.screenshot({ path: path.join(out, `${kind}-contact-sheet.png`) });
    }
    await sheet.close();
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ passed: true, sourceBlocks: 927, numberedChapters: 57, screenshots: fs.readdirSync(out).filter(f=>f.endsWith('.png')).length, browser: await browser.version(), errors }, null, 2));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
