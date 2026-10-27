const fs = require('node:fs');
const path = require('node:path');

const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = text => escape(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

function buildCourse(output, template) {
  const titles = [];
  fs.mkdirSync(path.join(output, 'tanfolyam'), { recursive: true });
  for (const number of [1, 2, 3, 4]) {
  const source = fs.readFileSync(path.join(__dirname, `fejezet-${number}.md`), 'utf8');
  const blocks = source.trim().split(/\r?\n\s*\r?\n/);
  const title = blocks[2].replace(/^# /, '');
  titles.push(title);
  const contents = [];
  let section = 0;
  const article = blocks.map((block, index) => {
    if (block === '---') return '<hr>';
    const heading = block.match(/^(#{1,3}) (.*)$/s);
    if (heading) {
      const [, marks, text] = heading;
      let tag = marks.length === 1 ? 'h2' : marks.length === 2 ? 'h3' : 'h4';
      let attr = '';
      if (index === 0 || index === 1 || index === 3) tag = 'p';
      if (index === 2) tag = 'h1';
      if (index > 3 && marks.length === 1) {
        attr = ` id="resz-${++section}"`;
        contents.push(`<li><a href="#resz-${section}">${escape(text)}</a></li>`);
      }
      return `<${tag}${attr} data-course-source="${index}">${inline(text)}</${tag}>`;
    }
    if (block.startsWith('> ')) return `<blockquote data-course-source="${index}">${block.replace(/^> ?/gm, '').split(/\r?\n\s*\r?\n/).map(part => /^[*-] /.test(part) ? `<ul>${part.split(/\r?\n/).map(line => `<li>${inline(line.slice(2))}</li>`).join('')}</ul>` : `<p>${inline(part)}</p>`).join('')}</blockquote>`;
    if (block.startsWith('* ') || (number >= 4 && block.startsWith('- '))) return `<ul data-course-source="${index}">${block.split(/\r?\n/).map(line => `<li>${inline(line.slice(2))}</li>`).join('')}</ul>`;
    return `<p data-course-source="${index}">${inline(block)}</p>`;
  }).join('\n');
  const videoId = { 1: 'BFwtI9GyZQs', 2: '7rR-xmfOXms', 3: 'P9NZVqIfESw', 4: 'bia9TKjyTwQ' }[number];
  const video = `<section class="course-video" aria-label="${number}. fejezet videós összefoglalója"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="K.O. Szülői Jogi Önvédelmi Akadémia – ${number}. fejezet videós összefoglaló" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer">Videó megnyitása a YouTube-on ↗</a></section>`;
  fs.writeFileSync(path.join(output, `tanfolyam/${number}-fejezet.html`), template(`${number}. fejezet – ${title}`, `
    <div class="container course-reader"><a class="course-back" href="/tanfolyam">← A tanfolyam fejezetei</a>
    ${video}<div class="course-layout"><aside class="course-sidebar"><details open><summary>${{ 1: 'Az első', 2: 'A második', 3: 'A harmadik', 4: 'A negyedik' }[number]} fejezet tartalma</summary><nav aria-label="Fejezet tartalomjegyzéke"><ol>${contents.join('')}</ol></nav></details></aside>
    <article class="course-prose">${article}<a class="course-back" href="/tanfolyam">← A tanfolyam fejezetei</a></article></div></div>`, 'course'));
  }
  const chapters = Array.from({ length: 10 }, (_, i) => i < titles.length
    ? `<li><a href="/tanfolyam/${i + 1}-fejezet"><span>${i + 1}. fejezet</span><strong>${escape(titles[i])}</strong><span class="course-status">Olvasás →</span></a></li>`
    : `<li class="course-pending"><span>${i + 1}. fejezet</span><span>Hamarosan</span></li>`).join('');
  fs.mkdirSync(path.join(output, 'tanfolyam'), { recursive: true });
  fs.writeFileSync(path.join(output, 'tanfolyam.html'), template('Tanfolyam', `
    <div class="container course-index"><p class="course-kicker">Tanfolyam · 10 fejezet</p>
    <h1>K.O. SZÜLŐI JOGI ÖNVÉDELMI AKADÉMIA</h1>
    <p class="course-intro">A tanfolyam fejezetei</p><ol class="course-chapters">${chapters}</ol></div>`, 'course'));
}
module.exports = { buildCourse };
