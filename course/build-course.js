const fs = require('node:fs');
const path = require('node:path');

const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = text => escape(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

function buildCourse(output, template) {
  const source = fs.readFileSync(path.join(__dirname, 'fejezet-1.md'), 'utf8');
  const blocks = source.trim().split(/\r?\n\s*\r?\n/);
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
    if (block.startsWith('* ')) return `<ul data-course-source="${index}">${block.split(/\r?\n/).map(line => `<li>${inline(line.slice(2))}</li>`).join('')}</ul>`;
    return `<p data-course-source="${index}">${inline(block)}</p>`;
  }).join('\n');
  const chapters = Array.from({ length: 10 }, (_, i) => i === 0
    ? '<li><a href="/tanfolyam/1-fejezet"><span>1. fejezet</span><strong>A SZÜLŐI JOGI ÖNVÉDELEM ALAPJAI</strong><span class="course-status">Olvasás →</span></a></li>'
    : `<li class="course-pending"><span>${i + 1}. fejezet</span><span>Hamarosan</span></li>`).join('');
  fs.mkdirSync(path.join(output, 'tanfolyam'), { recursive: true });
  fs.writeFileSync(path.join(output, 'tanfolyam.html'), template('Tanfolyam', `
    <div class="container course-index"><p class="course-kicker">Tanfolyam · 10 fejezet</p>
    <h1>K.O. SZÜLŐI JOGI ÖNVÉDELMI AKADÉMIA</h1>
    <p class="course-intro">A tanfolyam fejezetei</p><ol class="course-chapters">${chapters}</ol></div>`, 'course'));
  fs.writeFileSync(path.join(output, 'tanfolyam/1-fejezet.html'), template('1. fejezet – A szülői jogi önvédelem alapjai', `
    <div class="container course-reader"><a class="course-back" href="/tanfolyam">← A tanfolyam fejezetei</a>
    <div class="course-layout"><aside class="course-sidebar"><details open><summary>Az első fejezet tartalma</summary><nav aria-label="Fejezet tartalomjegyzéke"><ol>${contents.join('')}</ol></nav></details></aside>
    <article class="course-prose">${article}<a class="course-back" href="/tanfolyam">← A tanfolyam fejezetei</a></article></div></div>`, 'course'));
}
module.exports = { buildCourse };
