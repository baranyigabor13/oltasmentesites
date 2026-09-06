const fs = require('node:fs');
const path = require('node:path');

const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = text => escape(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

// This renderer deliberately handles the handbook independently of the event parser.
// Each source block has an identity so preservation can be checked in the browser.
function parse(source) {
  const blocks = source.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/);
  let index = 0;
  return blocks.flatMap(block => {
    if (/^---$/.test(block)) return [{ kind: 'rule' }];
    if (/^[*] /.test(block)) return block.split('\n').map(line => ({ kind: 'ul', text: line.slice(2), index: index++ }));
    const number = block.match(/^(\d+)\. ([\s\S]*)$/);
    if (number) return [{ kind: 'ol', number: Number(number[1]), text: number[2], index: index++ }];
    const heading = block.match(/^(#{1,3}) ([\s\S]*)$/);
    if (heading) return [{ kind: 'heading', level: heading[1].length, text: heading[2], index: index++ }];
    if (block.startsWith('> ')) return [{ kind: 'quote', text: block.replace(/^> /gm, ''), index: index++ }];
    return [{ kind: 'paragraph', text: block, index: index++ }];
  });
}

function blockHtml(block, extra = '') {
  if (block.kind === 'rule') return '';
  const attr = `data-source="${block.index}"`;
  const text = inline(block.text);
  if (block.kind === 'heading') {
    const tag = block.level === 1 ? 'p' : `h${block.level + 1}`;
    return `<${tag} ${attr} class="${block.level === 1 ? 'hb-statement' : 'hb-subheading'} ${extra}">${text}</${tag}>`;
  }
  if (block.kind === 'quote') return `<blockquote ${attr} ${extra ? `class="${extra}"` : ''}>${text}</blockquote>`;
  if (block.kind === 'ul' || block.kind === 'ol') return `<li ${attr}${block.number ? ` value="${block.number}"` : ''}>${text}</li>`;
  return `<p ${attr}${extra ? ` class="${extra}"` : ''}>${text}</p>`;
}

function renderBlocks(blocks) {
  let html = '', list = '';
  for (const block of blocks) {
    const next = ['ul', 'ol'].includes(block.kind) ? block.kind : '';
    if (list && list !== next) html += `</${list}>`;
    if (next && list !== next) html += `<${next}${next === 'ol' ? ` start="${block.number}"` : ''}>`;
    html += blockHtml(block);
    list = next;
  }
  return html + (list ? `</${list}>` : '');
}

function splitChapters(tokens) {
  const chapters = [];
  let chapter;
  for (const token of tokens.slice(3)) {
    const roman = token.kind === 'heading' && token.level === 1 && token.text.match(/^([IVXLCDM]+)\. /);
    const isBoundary = roman || (token.kind === 'heading' && ['BEVEZETÉS', 'ZÁRÓ GONDOLAT'].includes(token.text));
    if (isBoundary) {
      chapter = { heading: token, roman: roman ? roman[1] : '', id: roman ? `fejezet-${roman[1].toLowerCase()}` : token.text === 'BEVEZETÉS' ? 'bevezetes' : 'zaro-gondolat', blocks: [] };
      chapters.push(chapter);
    } else if (chapter) chapter.blocks.push(token);
  }
  return chapters;
}

const sceneTypes = { II: 'planes', III: 'chain', XII: 'documents', XLI: 'stop', LVII: 'resolve' };

function diagram(chapter) {
  let labels = [];
  if (chapter.roman === 'II') labels = chapter.blocks.filter(b => b.kind === 'heading' && b.level === 2).map(b => b.text);
  if (chapter.roman === 'III') labels = chapter.blocks.find(b => b.text?.startsWith('**GYERMEK**')).text.split('\n↓\n').map(text => text.replace(/\*\*/g, ''));
  if (chapter.roman === 'XII') labels = ['„További tájékoztatást kérek.”', '„Szülő bizonytalan.”', '„Szülő nem kívánja az oltást.”', '„Oltás megtagadása.”', '„Veszélyeztető körülmény.”'];
  if (chapter.roman === 'XLI') labels = ['S', 'T', 'O', 'P'];
  if (chapter.roman === 'LVII') labels = chapter.blocks.filter(b => b.kind === 'heading' && b.level === 3).map(b => b.text.replace(/^\d+\. /, ''));
  return `<div class="hb-diagram hb-diagram--${sceneTypes[chapter.roman]}" aria-hidden="true">
    <div class="hb-diagram-axis"></div>
    ${labels.map((label, i) => `<div class="hb-diagram-part" style="--i:${i}" data-diagram-part><span>${escape(label).replace(/\n/g, '<br>')}</span><i></i></div>`).join('')}
    <svg class="hb-orbit" viewBox="0 0 320 320" fill="none"><circle cx="160" cy="160" r="147"/><circle cx="160" cy="160" r="110"/><path d="M0 160h320M160 0v320"/></svg>
  </div>`;
}

function chapterHtml(chapter, i) {
  const scene = sceneTypes[chapter.roman];
  const close = chapter.id === 'zaro-gondolat';
  const classes = ['hb-chapter', scene ? 'hb-scene' : '', close ? 'hb-close' : '', ['IV', 'XXIII', 'XLVI', 'LV'].includes(chapter.roman) ? 'hb-chapter--emphasis' : '', i % 3 === 1 ? 'hb-chapter--offset' : ''].filter(Boolean).join(' ');
  const title = chapter.heading.text;
  // Roman numerals remain inside the canonical heading, styled independently.
  const headingHtml = chapter.roman ? `<span class="hb-roman">${chapter.roman}.</span> ${escape(title.slice(chapter.roman.length + 2))}` : escape(title);
  let prose = renderBlocks(chapter.blocks);
  if (chapter.roman === 'XLVIII') {
    const first = chapter.blocks.findIndex(b => b.kind === 'heading');
    const second = chapter.blocks.findIndex((b, index) => index > first && b.kind === 'heading');
    prose = renderBlocks(chapter.blocks.slice(0, first)) + `<div class="hb-comparison"><div>${renderBlocks(chapter.blocks.slice(first, second))}</div><div>${renderBlocks(chapter.blocks.slice(second, second + 2))}</div></div>` + renderBlocks(chapter.blocks.slice(second + 2));
  }
  return `<section id="${chapter.id}" class="${classes}" aria-labelledby="${chapter.id}-title"${scene ? ` data-sc-act="flow" data-scene="${scene}"` : ''}>
    <div class="hb-chapter-grid">
      <div class="hb-chapter-side">
        <h2 id="${chapter.id}-title" data-source="${chapter.heading.index}">${headingHtml}</h2>
        ${scene ? diagram(chapter) : '<span class="hb-side-rule" aria-hidden="true"></span>'}
      </div>
      <div class="hb-prose">${prose}</div>
    </div>
  </section>`;
}

function buildHandbook({ dist, getBaseTemplate }) {
  const source = fs.readFileSync(path.join(__dirname, 'source.md'), 'utf8');
  const tokens = parse(source);
  const chapters = splitChapters(tokens);
  if (chapters.filter(c => c.roman).length !== 57) throw new Error('Expected 57 numbered handbook chapters');
  const title = tokens[0], subtitle = tokens[1], description = tokens[2];
  const hero = `<section class="hb-hero" id="kezikonyv" data-sc-act="flow" aria-labelledby="hb-title">
    <div class="hb-hero-art" aria-hidden="true"><div class="hb-paper hb-paper--back"></div><div class="hb-paper hb-paper--middle"></div><div class="hb-paper hb-paper--front"><svg viewBox="0 0 320 450" fill="none"><path d="M35 60h160M35 80h105M35 155h250M35 177h250M35 199h190M35 280h250M35 302h150M35 382h65"/><circle cx="238" cy="371" r="43"/><path d="m215 371 16 16 31-34"/></svg></div><span class="hb-cross hb-cross--one">+</span><span class="hb-cross hb-cross--two">+</span></div>
    <div class="hb-hero-copy">
      <h1 id="hb-title" data-source="${title.index}">A <span>MANIPULÁCIÓ</span> ANATÓMIÁJA</h1>
      <p class="hb-subtitle" data-source="${subtitle.index}">${inline(subtitle.text)}</p>
      <p class="hb-description" data-source="${description.index}">${inline(description.text)}</p>
      <a class="hb-start" href="#bevezetes">Olvasás megkezdése <span aria-hidden="true">↗</span></a>
    </div>
    <div class="hb-hero-baseline" aria-hidden="true"><span></span><i></i><span></span></div>
  </section>`;
  const toolbar = `<div class="hb-tools" aria-label="Olvasási beállítások">
    <details class="hb-index"><summary>Tartalomjegyzék <span aria-hidden="true">+</span></summary><nav aria-label="A kézikönyv fejezetei"><a href="#kezikonyv">${escape(title.text)}</a>${chapters.map(c => `<a href="#${c.id}">${escape(c.heading.text)}</a>`).join('')}</nav></details>
    <span class="hb-location" aria-hidden="true">BEVEZETÉS</span>
    <button class="hb-motion" type="button" aria-pressed="false" hidden>Mozgás kikapcsolása</button>
    <div class="hb-progress" aria-hidden="true"><span></span></div>
  </div>`;
  const body = `${toolbar}<article class="hb-article" aria-labelledby="hb-title">${hero}${chapters.map(chapterHtml).join('')}</article><div class="hb-end"><a href="#kezikonyv">Vissza az elejére ↗</a><a href="index.html">Vissza a kezdőlapra ↗</a></div>`;
  let html = getBaseTemplate(title.text, body, 'handbook');
  html = html.replace('<body>', '<body class="hb-page">').replace('</head>', '<link rel="stylesheet" href="handbook.css">\n</head>')
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escape(subtitle.text)}">`)
    .replace('</body>', '<script src="handbook-scrollcraft.js"></script>\n<script src="handbook.js"></script>\n</body>');
  fs.writeFileSync(path.join(dist, 'manipulacio-anatomiaja.html'), html);
  for (const file of ['handbook.css', 'handbook.js']) fs.copyFileSync(path.join(__dirname, file), path.join(dist, file));
  fs.copyFileSync(path.join(__dirname, 'vendor/scrollcraft.js'), path.join(dist, 'handbook-scrollcraft.js'));
}

module.exports = { buildHandbook, parse, splitChapters };
