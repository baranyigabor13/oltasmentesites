const fs = require('fs');
const path = require('path');
const { buildHandbook } = require('./handbook/build-handbook');

// Target directory
const DIST_DIR = path.join(__dirname, 'public');
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// 1. Read files
const contentMarkdown = fs.readFileSync(path.join(__dirname, 'content.md'), 'utf8');
const designHtml = fs.readFileSync(path.join(__dirname, 'design.html'), 'utf8');

// 2. Extract CSS and JS from design.html
const styleMatch = designHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/);
let css = styleMatch ? styleMatch[1].trim() : '';

// Add custom style helper for search/filter and styling refinements
css += `
/* Interactive Search & Filter CSS */
.filter-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--r-lg);
  padding: var(--sp-5);
  margin-bottom: var(--sp-6);
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  box-shadow: var(--shadow-md);
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.filter-group__label {
  font-family: var(--font-mono);
  font-size: var(--fs-micro);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--color-text-subtle);
  font-weight: 600;
}
.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
.filter-btn {
  padding: 6px 12px;
  font-family: var(--font-sans);
  font-size: var(--fs-micro);
  font-weight: 600;
  border-radius: var(--r-pill);
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--d-fast) var(--ease-out);
}
.filter-btn:hover {
  color: var(--color-text);
  border-color: var(--color-border-strong);
}
.filter-btn.is-active {
  background: var(--color-accent-bg);
  color: var(--color-accent);
  border-color: var(--color-accent-soft);
}
.search-box {
  position: relative;
}
.search-box__input {
  width: 100%;
  padding: var(--sp-3) var(--sp-4);
  font-family: var(--font-sans);
  font-size: var(--fs-body);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--r-md);
  color: var(--color-text);
  transition: all var(--d-fast) var(--ease-out);
}
.search-box__input:focus {
  outline: none;
  border-color: var(--color-accent-soft);
  box-shadow: var(--glow-accent);
}
.is-hidden {
  display: none !important;
}
.no-results {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--sp-6);
  color: var(--color-text-muted);
  font-style: italic;
  border: 1px dashed var(--color-border);
  border-radius: var(--r-lg);
  background: var(--color-surface);
}
.tudastar-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-5);
}
.tudastar-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--r-lg);
  padding: var(--sp-5);
}
.tudastar-card h2 {
  font-size: var(--fs-h3);
  margin-bottom: var(--sp-4);
  color: var(--color-accent);
}
`;

css += `
/* Shared entry point for the handbook. */
.handbook-entry { display: grid; grid-template-columns: 1fr auto; gap: 32px; align-items: center; padding: clamp(28px, 5vw, 56px); margin-block: 32px 56px; border: 1px solid var(--color-accent-soft); background: var(--color-accent-bg); color: var(--color-text); }
.handbook-entry h2 { font-size: clamp(1.7rem, 4vw, 3rem); line-height: 1.1; letter-spacing: -.04em; max-width: 20ch; margin-bottom: 16px; }
.handbook-entry p { color: var(--color-text-muted); }
.handbook-entry > span { color: var(--color-accent); font-size: 48px; }
.handbook-entry:hover { border-color: var(--color-accent); color: var(--color-text); }
@media (max-width: 1100px) { .hdr__nav { display: none; } .hdr__menu-btn { display: inline-flex; } }
@media (max-width: 480px) { .handbook-entry { gap: 16px; } .handbook-entry > span { font-size: 32px; } }
`;
fs.writeFileSync(path.join(DIST_DIR, 'styles-v2.css'), css);

// Extract copy button JS script
const scriptMatch = designHtml.match(/<script[^>]*>([\s\S]*?)<\/script>\s*<\/body>/);
let js = scriptMatch ? scriptMatch[1].trim() : '';

// Add search and filter interaction to JS
js += `
// Search & Filter functionality for index.html
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search-input');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.ev-card');
  const noResults = document.getElementById('no-results');
  
  if (!searchInput || cards.length === 0) return;

  let activeFilters = {
    category: '',
    institution: '',
    severity: '',
    search: ''
  };

  function updateCards() {
    let visibleCount = 0;
    
    cards.forEach(card => {
      const title = card.querySelector('.ev-card__title').textContent.toLowerCase();
      const desc = card.querySelector('.ev-card__desc').textContent.toLowerCase();
      const id = card.querySelector('.ev-card__id').textContent.toLowerCase();
      const categories = card.getAttribute('data-categories').split(',');
      const institution = card.getAttribute('data-institution');
      const severity = card.getAttribute('data-severity');
      
      const matchSearch = !activeFilters.search || 
        title.includes(activeFilters.search) || 
        desc.includes(activeFilters.search) || 
        id.includes(activeFilters.search);
        
      const matchCategory = !activeFilters.category || categories.includes(activeFilters.category);
      const matchInstitution = !activeFilters.institution || institution === activeFilters.institution;
      const matchSeverity = !activeFilters.severity || severity === activeFilters.severity;

      if (matchSearch && matchCategory && matchInstitution && matchSeverity) {
        card.classList.remove('is-hidden');
        visibleCount++;
      } else {
        card.classList.add('is-hidden');
      }
    });

    if (noResults) {
      if (visibleCount === 0) {
        noResults.classList.remove('is-hidden');
      } else {
        noResults.classList.add('is-hidden');
      }
    }
  }

  // Handle Search Input
  searchInput.addEventListener('input', function(e) {
    activeFilters.search = e.target.value.toLowerCase().trim();
    updateCards();
  });

  // Handle Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const type = btn.getAttribute('data-filter-type');
      const val = btn.getAttribute('data-filter-val');
      
      // Get all siblings in same filter group
      const groupBtns = btn.parentElement.querySelectorAll('.filter-btn');
      
      if (btn.classList.contains('is-active')) {
        // Deactivate
        btn.classList.remove('is-active');
        activeFilters[type] = '';
      } else {
        // Activate this and deactivate others
        groupBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        activeFilters[type] = val;
      }
      
      updateCards();
    });
  });

  // Pre-filter if URL hash contains filter info (e.g. #category-Eljárás)
  function checkHash() {
    const hash = window.location.hash;
    if (hash.startsWith('#category-') || hash.startsWith('#institution-')) {
      // Reset all other filters
      activeFilters = {
        category: '',
        institution: '',
        severity: '',
        search: ''
      };
      if (searchInput) searchInput.value = '';
      filterBtns.forEach(b => b.classList.remove('is-active'));

      if (hash.startsWith('#category-')) {
        const cat = decodeURIComponent(hash.substring(10));
        const btn = document.querySelector(\`.filter-btn[data-filter-type="category"][data-filter-val="\${cat}"]\`);
        if (btn) {
          btn.classList.add('is-active');
          activeFilters.category = cat;
        }
      } else if (hash.startsWith('#institution-')) {
        const ins = decodeURIComponent(hash.substring(13));
        const btn = document.querySelector(\`.filter-btn[data-filter-type="institution"][data-filter-val="\${ins}"]\`);
        if (btn) {
          btn.classList.add('is-active');
          activeFilters.institution = ins;
        }
      }
      
      updateCards();

      // Smooth scroll to events section
      const eventsSec = document.getElementById('events');
      if (eventsSec) {
        eventsSec.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  // Listen for hash changes live
  window.addEventListener('hashchange', checkHash);

  // Robustly handle tile clicks even if the hash is already set
  const tiles = document.querySelectorAll('.cat-tile, .ins-tile');
  tiles.forEach(tile => {
    tile.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        if (window.location.hash !== href) {
          // Use hash assignment instead of pushState to avoid SecurityError on file://
          window.location.hash = href;
        }
        checkHash();
      }
    });
  });

  // Check on load
  if (window.location.hash) {
    setTimeout(checkHash, 100);
  }
});
`;

fs.writeFileSync(path.join(DIST_DIR, 'script-v3.js'), js);

// 3. Parser logic
// Helper to strip markdown bold, links, lists and convert to plain text or simple HTML
function mdToHtml(md) {
  if (!md) return '';
  let text = md.trim();
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
  // Inline Code
  text = text.replace(/`(.*?)`/g, '<code class="mono">$1</code>');
  // Links
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  return text;
}

// Parse lines into list items or paragraphs
function parseContentBlock(blockText) {
  const lines = blockText.split('\n').map(l => l.trim()).filter(l => l !== '');
  const items = [];
  let isList = false;

  for (let line of lines) {
    if (line.startsWith('- ') || line.startsWith('* ')) {
      isList = true;
      items.push({ type: 'li', text: mdToHtml(line.substring(2)) });
    } else if (line.match(/^\d+\.\s/)) {
      isList = true;
      const cleanLine = line.replace(/^\d+\.\s/, '');
      items.push({ type: 'li', text: mdToHtml(cleanLine) });
    } else {
      items.push({ type: 'p', text: mdToHtml(line) });
    }
  }
  return { isList, items };
}

// 4. Split and parse sections
const rawSections = ('\n' + contentMarkdown).split(/\n#\s+/);
const parsedSections = [];

// Header block is the first split item
const introHtml = mdToHtml(rawSections[0]);

for (let i = 1; i < rawSections.length; i++) {
  const sectionText = rawSections[i];
  const lines = sectionText.split('\n');
  const sectionTitleRaw = lines[0].trim();
  const restOfSection = lines.slice(1).join('\n');

  let sectionId = '';
  let sectionTitle = sectionTitleRaw;

  // Check if starts with a number (e.g. "0. Alapkeret..." or "1. Kórház...")
  const mainSecMatch = sectionTitleRaw.match(/^(\d+)\.\s+(.*)$/);
  if (mainSecMatch) {
    sectionId = mainSecMatch[1];
    sectionTitle = mainSecMatch[2];
  } else if (sectionTitleRaw === 'Figyelmeztetés!') {
    sectionId = 'warning';
    sectionTitle = 'Figyelmeztetés!';
  }

  const sectionObj = {
    id: sectionId,
    title: sectionTitle,
    rawTitle: sectionTitleRaw,
    events: [],
    generalSubsections: [],
    rawContent: restOfSection
  };

  // Split into subsections by "## "
  const subSectionsRaw = ('\n' + restOfSection).split(/\n##\s+/);
  
  // First item is preamble before any subheading
  const preambleText = subSectionsRaw[0].trim();
  sectionObj.preamble = preambleText ? mdToHtml(preambleText) : '';

  for (let j = 1; j < subSectionsRaw.length; j++) {
    const subText = subSectionsRaw[j];
    const subLines = subText.split('\n');
    const subTitleRaw = subLines[0].trim();
    const subContentRaw = subLines.slice(1).join('\n').trim();

    // Check if it's an event (e.g., "2.1. Esemény: ...")
    const eventMatch = subTitleRaw.match(/^(\d+\.\d+)\.\s*(?:Esemény:)?\s*(.*)$/i);
    if (eventMatch && parseInt(sectionId) >= 1 && parseInt(sectionId) <= 14) {
      const eventId = eventMatch[1];
      const eventTitle = eventMatch[2];

      const eventObj = {
        id: eventId,
        title: eventTitle,
        subSections: []
      };

      // Split event details by "### "
      let cleanSubContent = subContentRaw.trim();
      if (cleanSubContent.endsWith('---')) {
        cleanSubContent = cleanSubContent.substring(0, cleanSubContent.length - 3).trim();
      }

      const blocksRaw = ('\n' + cleanSubContent).split(/\n###\s+/);
      for (let k = 1; k < blocksRaw.length; k++) {
        const blockText = blocksRaw[k];
        const blockLines = blockText.split('\n');
        const blockTitle = blockLines[0].trim();
        const blockBody = blockLines.slice(1).join('\n').trim();

        eventObj.subSections.push({
          title: blockTitle,
          body: blockBody,
          parsed: parseContentBlock(blockBody)
        });
      }
      sectionObj.events.push(eventObj);
    } else {
      // General subsection
      let cleanSubContent = subContentRaw.trim();
      if (cleanSubContent.endsWith('---')) {
        cleanSubContent = cleanSubContent.substring(0, cleanSubContent.length - 3).trim();
      }
      sectionObj.generalSubsections.push({
        title: subTitleRaw,
        body: cleanSubContent,
        parsed: parseContentBlock(cleanSubContent)
      });
    }
  }

  parsedSections.push(sectionObj);
}

// 5. Gather all events for listing & filter/classify
const allEvents = [];
parsedSections.forEach(sec => {
  sec.events.forEach(ev => {
    allEvents.push(ev);
  });
});

console.log(`Parsed ${parsedSections.length} sections in total.`);
console.log(`Parsed ${allEvents.length} events in total (should be 34).`);

// Helper function to map tag/classification
function classifyEvent(ev) {
  const id = ev.id;
  
  // Severity defaults
  let severity = 'Közepes';
  // Institution defaults
  let institution = 'NNK · Népegészségügy';
  // Category defaults
  let categories = ['Eljárás'];

  // Manual explicit mapping based on content and Section 16/18 classifications
  if (id === '1.1') {
    severity = 'Kritikus';
    institution = 'Háziorvos / Iskolaorvos';
    categories = ['Eljárás', 'Tájékoztatás'];
  } else if (id.startsWith('2.')) {
    institution = 'Védőnő';
    if (id === '2.1') {
      severity = 'Közepes';
      categories = ['Kommunikáció'];
    } else if (id === '2.2') {
      severity = 'Magas';
      categories = ['Iratkezelés', 'Határidő'];
    } else if (id === '2.3') {
      severity = 'Magas';
      categories = ['Eljárás'];
    }
  } else if (id.startsWith('3.')) {
    if (id === '3.1') {
      severity = 'Közepes';
      institution = 'Iskola / Óvoda';
      categories = ['Adatvédelem', 'Iratkezelés'];
    } else if (id === '3.2') {
      severity = 'Közepes';
      institution = 'Iskola / Óvoda';
      categories = ['Kommunikáció', 'Tájékoztatás'];
    } else if (id === '3.3') {
      severity = 'Közepes';
      institution = 'Háziorvos / Iskolaorvos';
      categories = ['Tájékoztatás', 'Kommunikáció'];
    }
  } else if (id.startsWith('4.')) {
    institution = 'Háziorvos / Iskolaorvos';
    if (id === '4.1') {
      severity = 'Magas';
      categories = ['Tájékoztatás'];
    } else if (id === '4.2') {
      severity = 'Magas';
      categories = ['Iratkezelés'];
    } else if (id === '4.3') {
      severity = 'Magas';
      categories = ['Eljárás'];
    }
  } else if (id.startsWith('5.')) {
    if (id === '5.1') {
      severity = 'Közepes';
      institution = 'Háziorvos / Iskolaorvos';
      categories = ['Eljárás'];
    } else if (id === '5.2') {
      severity = 'Közepes';
      institution = 'NNK · Népegészségügy';
      categories = ['Eljárás'];
    } else if (id === '5.3') {
      severity = 'Közepes';
      institution = 'NNK · Népegészségügy';
      categories = ['Eljárás'];
    }
  } else if (id.startsWith('6.')) {
    institution = 'Háziorvos / Iskolaorvos';
    if (id === '6.1') {
      severity = 'Kritikus';
      categories = ['Eljárás'];
    } else if (id === '6.2') {
      severity = 'Közepes';
      categories = ['Tájékoztatás'];
    }
  } else if (id.startsWith('7.')) {
    institution = 'NNK · Népegészségügy';
    if (id === '7.1') {
      severity = 'Kritikus';
      categories = ['Eljárás'];
    } else if (id === '7.2') {
      severity = 'Magas';
      categories = ['Tájékoztatás'];
    } else if (id === '7.3') {
      severity = 'Kritikus';
      categories = ['Iratkezelés'];
    }
  } else if (id.startsWith('8.')) {
    institution = 'Családsegítő';
    if (id === '8.1') {
      severity = 'Közepes';
      categories = ['Kommunikáció'];
    } else if (id === '8.2') {
      severity = 'Magas';
      categories = ['Eljárás'];
    } else if (id === '8.3') {
      severity = 'Magas';
      categories = ['Iratkezelés'];
    }
  } else if (id.startsWith('9.')) {
    institution = 'Gyámhivatal';
    if (id === '9.1') {
      severity = 'Magas';
      categories = ['Eljárás'];
    } else if (id === '9.2') {
      severity = 'Kritikus';
      categories = ['Iratkezelés'];
    } else if (id === '9.3') {
      severity = 'Kritikus';
      categories = ['Eljárás'];
    } else if (id === '9.4') {
      severity = 'Kritikus';
      categories = ['Kommunikáció'];
    }
  } else if (id.startsWith('10.')) {
    institution = 'NNK · Népegészségügy';
    if (id === '10.1') {
      severity = 'Magas';
      categories = ['Iratkezelés'];
    } else if (id === '10.2') {
      severity = 'Kritikus';
      categories = ['Határidő'];
    } else if (id === '10.3') {
      severity = 'Magas';
      categories = ['Iratkezelés'];
    }
  } else if (id.startsWith('11.')) {
    institution = 'NAV';
    if (id === '11.1') {
      severity = 'Kritikus';
      categories = ['Eljárás'];
    } else if (id === '11.2') {
      severity = 'Kritikus';
      categories = ['Eljárás'];
    }
  } else if (id.startsWith('12.')) {
    institution = 'Bíróság';
    if (id === '12.1') {
      severity = 'Kritikus';
      categories = ['Eljárás'];
    } else if (id === '12.2') {
      severity = 'Kritikus';
      categories = ['Kommunikáció'];
    }
  } else if (id.startsWith('13.')) {
    severity = 'Magas';
    institution = 'NNK · Népegészségügy';
    categories = ['Eljárás'];
  } else if (id.startsWith('14.')) {
    severity = 'Magas';
    institution = 'NNK · Népegészségügy';
    categories = ['Adatvédelem'];
  }

  return { severity, institution, categories };
}

// 6. Templates
function getHeader(activePage = '') {
  return `
<header class="hdr" role="banner">
  <div class="container hdr__inner">
    <a href="/" class="hdr__brand" aria-label="Eljárási Térkép - kezdőlap">
      <span class="hdr__brand-glyph" aria-hidden="true">É</span>
      <span>Eljárási Térkép</span>
    </a>
    <nav class="hdr__nav" aria-label="Fő navigáció">
      <a href="/" ${activePage === 'home' ? 'aria-current="page"' : ''}>Kezdőlap</a>
      <a href="/#events" ${activePage === 'events' ? 'aria-current="page"' : ''}>Eseménytérkép</a>
      <a href="/alapkeret" ${activePage === 'alapkeret' ? 'aria-current="page"' : ''}>Alapkeret</a>
      <a href="/akcioterv" ${activePage === 'akcioterv' ? 'aria-current="page"' : ''}>Akcióterv</a>
      <a href="/alapmondatok" ${activePage === 'alapmondatok' ? 'aria-current="page"' : ''}>Alapmondatok</a>
      <a href="/tudastar" ${activePage === 'tudastar' ? 'aria-current="page"' : ''}>Tudástár</a>
      <a href="/manipulacio-anatomiaja" ${activePage === 'handbook' ? 'aria-current="page"' : ''}>Kézikönyv</a>
    </nav>
    <button class="hdr__menu-btn" type="button" aria-label="Menü megnyitása" aria-expanded="false" onclick="toggleMenu()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M3 6h18M3 12h18M3 18h18"/>
      </svg>
    </button>
  </div>
  <div id="mobile-nav" class="is-hidden" style="background: var(--color-surface-2); border-bottom: 1px solid var(--color-border); padding: var(--sp-4);">
    <div style="display: flex; flex-direction: column; gap: var(--sp-3);">
      <a href="/" style="color: var(--color-text); font-weight: 500;">Kezdőlap</a>
      <a href="/#events" style="color: var(--color-text); font-weight: 500;">Eseménytérkép</a>
      <a href="/alapkeret" style="color: var(--color-text); font-weight: 500;">Alapkeret</a>
      <a href="/akcioterv" style="color: var(--color-text); font-weight: 500;">Akcióterv</a>
      <a href="/alapmondatok" style="color: var(--color-text); font-weight: 500;">Alapmondatok</a>
      <a href="/tudastar" style="color: var(--color-text); font-weight: 500;">Tudástár</a>
      <a href="/manipulacio-anatomiaja" ${activePage === 'handbook' ? 'aria-current="page"' : ''} style="color: var(--color-text); font-weight: 500;">Kézikönyv</a>
    </div>
  </div>
  <script>
    function toggleMenu() {
      const m = document.getElementById('mobile-nav');
      m.classList.toggle('is-hidden');
      const open = !m.classList.contains('is-hidden');
      const button = document.querySelector('.hdr__menu-btn');
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    }
  </script>
</header>
`;
}

function getFooter() {
  return `
<footer class="ftr" role="contentinfo">
  <div class="container">
    <div class="ftr__grid">
      <div class="ftr__col ftr__about">
        <h4>Az oldalról</h4>
        <p>Tájékoztató jellegű, közérthető nyelven írt eljárási útmutató szülőknek, kötelező védőoltási ügyekre. Nem minősül jogi tanácsadásnak.</p>
        <span class="status-pill"><span class="pulse-dot" aria-hidden="true"></span>AKTÍV</span>
      </div>
      <div class="ftr__col">
        <h4>Tartalom</h4>
        <ul>
          <li><a href="/#events">Események</a></li>
          <li><a href="/alapkeret">Alapkeret</a></li>
          <li><a href="/akcioterv">Akcióterv</a></li>
          <li><a href="/alapmondatok">Alapmondatok</a></li>
          <li><a href="/tudastar">Tudástár</a></li>
          <li><a href="/manipulacio-anatomiaja">Kézikönyv</a></li>
        </ul>
      </div>
      <div class="ftr__col">
        <h4>Segítség</h4>
        <ul>
          <li><a href="/#categories">Kategóriák</a></li>
          <li><a href="/#institutions">Intézmények</a></li>
          <li><a href="/tudastar#sulyossag">Súlyosságok</a></li>
        </ul>
      </div>
      <div class="ftr__col">
        <h4>Verzió</h4>
        <ul>
          <li><span class="mono" style="color: var(--color-text-subtle);">v2.0.0</span></li>
          <li><span class="mono" style="color: var(--color-text-subtle);">Build 2026.06.02</span></li>
        </ul>
      </div>
    </div>
    <div class="ftr__bottom">
      <span>© 2026 Eljárási Térkép</span>
      <span>Utolsó frissítés: 2026-06-02</span>
    </div>
  </div>
</footer>
`;
}

function getBaseTemplate(title, bodyContent, activePage = '') {
  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} · Eljárási Térkép</title>
<meta name="description" content="Szülői kötelező védőoltási eljárási térkép és információs oldal. Bizonyítható, jogszerű írásos együttműködés szülőknek.">
<meta name="theme-color" content="#0F0F0F">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles-v2.css">
</head>
<body>

<a href="#main" class="skip-link">Ugrás a tartalomra</a>

${getHeader(activePage)}

<main id="main">
${bodyContent}
</main>

${getFooter()}

<script src="/script-v3.js"></script>
</body>
</html>
`;
}

// 7. Write index.html
const indexHtmlContent = `
<section class="ds-hero" aria-labelledby="ds-title" style="position: relative; overflow: hidden; padding-block: clamp(4rem, 12vw, 8rem) clamp(3rem, 8vw, 6rem);">
  <!-- SaaS style background glowing orbs -->
  <div style="position: absolute; top: -10%; left: 50%; transform: translateX(-50%); width: 80vw; height: 80vw; max-width: 600px; max-height: 600px; background: radial-gradient(circle, var(--color-accent-soft) 0%, transparent 70%); opacity: 0.5; z-index: -1; pointer-events: none; mix-blend-mode: screen;"></div>
  
  <div class="container ds-hero__inner" style="text-align: center; max-width: 850px; display: flex; flex-direction: column; align-items: center; gap: var(--sp-5);">
    
    <!-- Top badge (SaaS style) -->
    <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 100px; background: var(--color-surface-2); border: 1px solid var(--color-border); font-family: var(--font-mono); font-size: var(--fs-micro); color: var(--color-text-muted);">
      <span class="status-pill" style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 100px; background: var(--color-success-bg); color: var(--color-success); font-weight: 600; font-size: 10px; letter-spacing: 0.5px;">
        <span class="pulse-dot" aria-hidden="true" style="margin-right: 4px;"></span>AKTÍV
      </span>
      <span>Verzió 2.0.0</span>
    </div>

    <h1 id="ds-title" class="ds-hero__title" style="font-size: clamp(3rem, 8vw, 5.5rem); line-height: 1.1; margin: 0; font-weight: 800; letter-spacing: -0.03em; background: linear-gradient(135deg, var(--color-text) 30%, var(--color-accent) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
      Oltásmentesítés gyakorlatban
    </h1>
    
    <p class="ds-hero__sub" style="margin-inline: auto; font-size: clamp(1.125rem, 2.5vw, 1.375rem); line-height: 1.6; color: var(--color-text-muted); max-width: 60ch; margin-bottom: var(--sp-2);">
      Hogyan folytassunk jogszerű, írásbeli és igazolható kommunikációt az egészségügyi és hatósági szereplőkkel? Teljes körű eljárási útmutató szülőknek.
    </p>
    
    <div class="btn-row" style="justify-content: center; gap: var(--sp-4); margin-top: var(--sp-2);">
      <a href="#events" class="btn btn--primary" style="padding: 14px 28px; font-size: 1rem; border-radius: 100px; font-weight: 600; box-shadow: 0 4px 24px -6px var(--color-accent);">Eseménytérkép megnyitása</a>
      <a href="/alapmondatok" class="btn btn--secondary" style="padding: 14px 28px; font-size: 1rem; border-radius: 100px; font-weight: 600;">Másolható levelek</a>
    </div>
  </div>
</section>

<aside class="disclaimer" role="note" aria-label="Fontos jogi figyelmeztetés" style="margin-top: -1px; position: relative; z-index: 2; background: oklch(0.15 0.02 240); border-top: 1px solid oklch(0.25 0.04 240); border-bottom: 1px solid oklch(0.25 0.04 240);">
  <div class="container disclaimer__inner" style="max-width: 900px; margin-inline: auto;">
    <span class="disclaimer__glyph" aria-hidden="true" style="background: var(--color-accent); color: var(--color-text-inverse);">!</span>
    <p class="disclaimer__body" style="color: oklch(0.85 0.02 240);"><strong>Ez az oldal nem nyújt jogi tanácsadást.</strong> A leírt eljárások és javasolt mondatok tájékoztató jellegűek, nem helyettesítik az ügyvédi szakvéleményt. Minden hivatalos levelezést írásban, igazolható módon folytasson.</p>
  </div>
</aside>

<section class="ds-section" id="events" aria-labelledby="events-section-title">
  <div class="container">
    <a class="handbook-entry" href="/manipulacio-anatomiaja">
      <div><h2>A MANIPULÁCIÓ ANATÓMIÁJA</h2><p>Szülői kézikönyv az oltásrendszerhez</p></div>
      <span aria-hidden="true">↗</span>
    </a>
    <header class="ds-section__head">
      <span class="eyebrow">// ESEMÉNYEK ÉS LÉPÉSEK</span>
      <h2 id="events-section-title" class="ds-section__title">Eseménytérkép</h2>
      <p class="ds-section__desc">Keresd ki az aktuális élethelyzetednek megfelelő eseményt. Szűrd a lépéseket kategória, eljáró intézmény vagy súlyosság szerint.</p>
    </header>

    <!-- Search & Filter Controls -->
    <div class="filter-section">
      <div class="search-box">
        <input type="text" id="search-input" class="search-box__input" placeholder="Keresés az események címe, leírása vagy száma alapján (pl. '2.2', 'védőnő', 'bírság')...">
      </div>
      
      <div class="filter-group">
        <span class="filter-group__label">Kategóriák</span>
        <div class="filter-buttons">
          <button type="button" class="filter-btn" data-filter-type="category" data-filter-val="Tájékoztatás">Tájékoztatás</button>
          <button type="button" class="filter-btn" data-filter-type="category" data-filter-val="Iratkezelés">Iratkezelés</button>
          <button type="button" class="filter-btn" data-filter-type="category" data-filter-val="Eljárás">Eljárás</button>
          <button type="button" class="filter-btn" data-filter-type="category" data-filter-val="Kommunikáció">Kommunikáció</button>
          <button type="button" class="filter-btn" data-filter-type="category" data-filter-val="Határidő">Határidő</button>
          <button type="button" class="filter-btn" data-filter-type="category" data-filter-val="Adatvédelem">Adatvédelem</button>
        </div>
      </div>

      <div class="filter-group">
        <span class="filter-group__label">Intézmények</span>
        <div class="filter-buttons">
          <button type="button" class="filter-btn" data-filter-type="institution" data-filter-val="Védőnő">Védőnő</button>
          <button type="button" class="filter-btn" data-filter-type="institution" data-filter-val="Háziorvos / Iskolaorvos">Háziorvos / Iskolaorvos</button>
          <button type="button" class="filter-btn" data-filter-type="institution" data-filter-val="NNK · Népegészségügy">NNK · Népegészségügy</button>
          <button type="button" class="filter-btn" data-filter-type="institution" data-filter-val="Családsegítő">Családsegítő</button>
          <button type="button" class="filter-btn" data-filter-type="institution" data-filter-val="Gyámhivatal">Gyámhivatal</button>
          <button type="button" class="filter-btn" data-filter-type="institution" data-filter-val="NAV">NAV</button>
          <button type="button" class="filter-btn" data-filter-type="institution" data-filter-val="Bíróság">Bíróság</button>
          <button type="button" class="filter-btn" data-filter-type="institution" data-filter-val="Iskola / Óvoda">Iskola / Óvoda</button>
        </div>
      </div>

      <div class="filter-group">
        <span class="filter-group__label">Súlyosság</span>
        <div class="filter-buttons">
          <button type="button" class="filter-btn" data-filter-type="severity" data-filter-val="Alacsony">Alacsony</button>
          <button type="button" class="filter-btn" data-filter-type="severity" data-filter-val="Közepes">Közepes</button>
          <button type="button" class="filter-btn" data-filter-type="severity" data-filter-val="Magas">Magas</button>
          <button type="button" class="filter-btn" data-filter-type="severity" data-filter-val="Kritikus">Kritikus</button>
        </div>
      </div>
    </div>

    <!-- Event Grid -->
    <div class="event-grid">
      ${allEvents.map(ev => {
        const cls = classifyEvent(ev);
        const severityClassMap = {
          'Alacsony': 'badge--sev-low',
          'Közepes': 'badge--sev-med',
          'Magas': 'badge--sev-high',
          'Kritikus': 'badge--sev-crit'
        };
        const sevClass = severityClassMap[cls.severity];
        
        // Find description (usually first points in "Mi történhet?" or similar)
        let firstPoints = '';
        const miTortenhetBlock = ev.subSections.find(s => s.title.includes('történhet') || s.title.includes('Mire kell') || s.title.includes('Minden szülő'));
        if (miTortenhetBlock && miTortenhetBlock.parsed.items.length > 0) {
          const listItems = miTortenhetBlock.parsed.items.filter(it => it.type === 'li').slice(0, 2);
          firstPoints = listItems.map(it => it.text).join(' ');
        }
        if (!firstPoints) {
          // fallback to first section text
          firstPoints = ev.subSections[0] ? ev.subSections[0].parsed.items.map(it => it.text).slice(0, 2).join(' ') : 'Eljárási részletek...';
        }
        // strip HTML tags for card description limit
        let plainDesc = firstPoints.replace(/<\/?[^>]+(>|$)/g, "");
        if (plainDesc.length > 150) {
          plainDesc = plainDesc.substring(0, 147) + '...';
        }

        return `
      <a href="/event-${ev.id.replace(/\./g, '-')}" class="ev-card" data-categories="${cls.categories.join(',')}" data-institution="${cls.institution}" data-severity="${cls.severity}">
        <span class="ev-card__id">§ ${ev.id}</span>
        <div class="ev-card__badges">
          <span class="badge ${sevClass}"><span class="badge__dot" aria-hidden="true"></span>${cls.severity}</span>
          <span class="badge badge--ins">${cls.institution}</span>
          ${cls.categories.map(c => `<span class="badge badge--cat">${c}</span>`).join('')}
        </div>
        <h3 class="ev-card__title">${ev.title}</h3>
        <p class="ev-card__desc">${plainDesc}</p>
        <span class="ev-card__cta">Részletek</span>
      </a>
      `;
      }).join('\n')}
      
      <div id="no-results" class="no-results is-hidden">
        Sajnos nincs a keresési feltételeknek megfelelő esemény. Próbáld más szűrőkkel vagy kulcsszavakkal!
      </div>
    </div>
  </div>
</section>

<section class="ds-section" id="categories" aria-labelledby="cat-title">
  <div class="container">
    <header class="ds-section__head">
      <span class="eyebrow">// TÉMAKÖRÖK</span>
      <h2 id="cat-title" class="ds-section__title">Kategóriák</h2>
      <p class="ds-section__desc">Kategóriák szerinti szűréshez kattints az alábbi csempék egyikére.</p>
    </header>

    <div class="cat-grid">
      <a href="#category-Tájékoztatás" class="cat-tile">
        <span class="cat-tile__glyph" aria-hidden="true">T</span>
        <span class="cat-tile__name">Tájékoztatás</span>
        <span class="cat-tile__count">${allEvents.filter(e => classifyEvent(e).categories.includes('Tájékoztatás')).length}</span>
      </a>
      <a href="#category-Iratkezelés" class="cat-tile">
        <span class="cat-tile__glyph" aria-hidden="true">I</span>
        <span class="cat-tile__name">Iratkezelés</span>
        <span class="cat-tile__count">${allEvents.filter(e => classifyEvent(e).categories.includes('Iratkezelés')).length}</span>
      </a>
      <a href="#category-Eljárás" class="cat-tile">
        <span class="cat-tile__glyph" aria-hidden="true">E</span>
        <span class="cat-tile__name">Eljárás</span>
        <span class="cat-tile__count">${allEvents.filter(e => classifyEvent(e).categories.includes('Eljárás')).length}</span>
      </a>
      <a href="#category-Kommunikáció" class="cat-tile">
        <span class="cat-tile__glyph" aria-hidden="true">K</span>
        <span class="cat-tile__name">Kommunikáció</span>
        <span class="cat-tile__count">${allEvents.filter(e => classifyEvent(e).categories.includes('Kommunikáció')).length}</span>
      </a>
      <a href="#category-Határidő" class="cat-tile">
        <span class="cat-tile__glyph" aria-hidden="true">H</span>
        <span class="cat-tile__name">Határidő</span>
        <span class="cat-tile__count">${allEvents.filter(e => classifyEvent(e).categories.includes('Határidő')).length}</span>
      </a>
      <a href="#category-Adatvédelem" class="cat-tile">
        <span class="cat-tile__glyph" aria-hidden="true">A</span>
        <span class="cat-tile__name">Adatvédelem</span>
        <span class="cat-tile__count">${allEvents.filter(e => classifyEvent(e).categories.includes('Adatvédelem')).length}</span>
      </a>
    </div>
  </div>
</section>

<section class="ds-section" id="institutions" aria-labelledby="ins-title">
  <div class="container">
    <header class="ds-section__head">
      <span class="eyebrow">// SZEREPLŐK</span>
      <h2 id="ins-title" class="ds-section__title">Intézmények</h2>
      <p class="ds-section__desc">Az eljárás résztvevői és feladatköreik. Kattints az intézmény nevére az ahhoz kapcsolódó események szűréséhez.</p>
    </header>

    <div class="ins-grid">
      <a href="#institution-Védőnő" class="ins-tile" style="text-decoration: none; color: inherit;">
        <span class="ins-tile__name">Védőnő</span>
        <span class="ins-tile__role">Családlátogatás, oltási nyomon követés, jelzés a népegészségügy felé.</span>
      </a>
      <a href="#institution-Háziorvos / Iskolaorvos" class="ins-tile" style="text-decoration: none; color: inherit;">
        <span class="ins-tile__name">Háziorvos / Iskolaorvos</span>
        <span class="ins-tile__role">Oltás beadása, egyéniesített tájékoztatás, betegkarton vezetése.</span>
      </a>
      <a href="#institution-NNK · Népegészségügy" class="ins-tile" style="text-decoration: none; color: inherit;">
        <span class="ins-tile__name">NNK · Népegészségügy</span>
        <span class="ins-tile__role">Hatósági eljárás, felszólítás, határozat, bírság.</span>
      </a>
      <a href="#institution-Családsegítő" class="ins-tile" style="text-decoration: none; color: inherit;">
        <span class="ins-tile__name">Családsegítő</span>
        <span class="ins-tile__role">Környezettanulmány, jelzés a gyámhivatalnak, gondozási terv.</span>
      </a>
      <a href="#institution-Gyámhivatal" class="ins-tile" style="text-decoration: none; color: inherit;">
        <span class="ins-tile__name">Gyámhivatal</span>
        <span class="ins-tile__role">Védelembe vétel, ideiglenes hatályú elhelyezés, határozat.</span>
      </a>
      <a href="#institution-NAV" class="ins-tile" style="text-decoration: none; color: inherit;">
        <span class="ins-tile__name">NAV</span>
        <span class="ins-tile__role">Eljárási bírság, végrehajtás, behajtás.</span>
      </a>
      <a href="#institution-Bíróság" class="ins-tile" style="text-decoration: none; color: inherit;">
        <span class="ins-tile__name">Bíróság</span>
        <span class="ins-tile__role">Közigazgatási per, azonnali jogvédelem, jogerős döntés.</span>
      </a>
      <a href="#institution-Iskola / Óvoda" class="ins-tile" style="text-decoration: none; color: inherit;">
        <span class="ins-tile__name">Iskola / Óvoda</span>
        <span class="ins-tile__role">Beiratkozás, KRÉTA-üzenet, kampányoltás szervezése.</span>
      </a>
    </div>
  </div>
</section>

<!-- SUPPORT AND LINKS SECTION -->
<section class="ds-section" aria-labelledby="support-links-title" style="background: var(--color-surface-2); border-top: 1px solid var(--color-border); margin-top: var(--sp-6);">
  <div class="container">
    <h2 id="support-links-title" class="sr-only">Hasznos linkek és Támogatás</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--sp-6);">
      
      <!-- Oszlop 1: Hasznos linkek -->
      <div style="display: flex; flex-direction: column; gap: var(--sp-4);">
        <h3 class="h4" style="margin: 0; color: var(--color-text);">Hasznos linkek</h3>
        
        <a href="https://www.facebook.com/groups/1997084810767425" target="_blank" rel="noopener noreferrer" class="ins-tile" style="text-decoration: none; color: inherit; align-items: center; display: flex; padding: var(--sp-3) var(--sp-4); gap: var(--sp-3);">
          <div style="flex: 1;">
            <span class="ins-tile__name" style="font-size: var(--fs-small);">Soha többé kötelező oltás mozgalom</span>
            <span class="ins-tile__role">Facebook csoport</span>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-muted);"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </a>

        <a href="https://www.facebook.com/groups/gyerekoltasok/" target="_blank" rel="noopener noreferrer" class="ins-tile" style="text-decoration: none; color: inherit; align-items: center; display: flex; padding: var(--sp-3) var(--sp-4); gap: var(--sp-3);">
          <div style="flex: 1;">
            <span class="ins-tile__name" style="font-size: var(--fs-small);">Oltás mellékhatások gyerekeknél</span>
            <span class="ins-tile__role">Facebook csoport</span>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-muted);"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </a>

        <a href="https://bellatrixprogram.hu/" target="_blank" rel="noopener noreferrer" class="ins-tile" style="text-decoration: none; color: inherit; align-items: center; display: flex; padding: var(--sp-3) var(--sp-4); gap: var(--sp-3);">
          <div style="flex: 1;">
            <span class="ins-tile__name" style="font-size: var(--fs-small);">BellaTrix Program</span>
            <span class="ins-tile__role">Weboldal</span>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-muted);"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </a>
      </div>

      <!-- Oszlop 2: Támogatás -->
      <div style="display: flex; flex-direction: column; gap: var(--sp-4);">
        <h3 class="h4" style="margin: 0; color: var(--color-text);">Támogasd az ügyünk!</h3>
        <p style="color: var(--color-text-muted); font-size: var(--fs-small); line-height: 1.6; margin: 0;">Ha szeretnéd támogatni a harcoló szülőket, akkor azt az alábbi módon tudod megtenni:</p>
        
        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--r-md); padding: var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-4); box-shadow: var(--shadow-sm); height: 100%;">
          
          <div>
            <div style="font-size: var(--fs-micro); color: var(--color-text-subtle); text-transform: uppercase; letter-spacing: var(--tracking-wide); margin-bottom: 2px;">Kedvezményezett</div>
            <div style="font-weight: 600; color: var(--color-text);">Lisai Elek János Alapítvány</div>
          </div>
          
          <div>
            <div style="font-size: var(--fs-micro); color: var(--color-text-subtle); text-transform: uppercase; letter-spacing: var(--tracking-wide); margin-bottom: 6px;">IBAN / bankszámlaszám</div>
            <div style="display: flex; gap: var(--sp-2); align-items: center; flex-wrap: wrap;">
              <code id="iban-szam" style="font-family: var(--font-mono); font-size: clamp(0.9rem, 2vw, 1.05rem); color: var(--color-accent); font-weight: 700; background: var(--color-surface-2); padding: 6px 10px; border-radius: var(--r-sm); border: 1px solid var(--color-border); margin: 0; flex-grow: 1;">HU68120231320183245100100001</code>
              <button type="button" class="btn btn--secondary btn--sm copy-btn" data-copy-target="iban-szam" style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; margin: 0; min-width: 100px; justify-content: center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span data-copy-label>Másolás</span>
              </button>
            </div>
          </div>
          
          <div>
            <div style="font-size: var(--fs-micro); color: var(--color-text-subtle); text-transform: uppercase; letter-spacing: var(--tracking-wide); margin-bottom: 2px;">Közlemény</div>
            <div style="font-weight: 600; color: var(--color-text);">BellaTrix</div>
          </div>

        </div>
      </div>

    </div>
  </div>
</section>
`;

fs.writeFileSync(
  path.join(DIST_DIR, 'index.html'),
  getBaseTemplate('Kezdőlap', indexHtmlContent, 'home')
);

// 8. Write event details pages (event-[id].html)
buildHandbook({ dist: DIST_DIR, getBaseTemplate });
allEvents.forEach((ev, evIdx) => {
  const cls = classifyEvent(ev);
  const severityClassMap = {
    'Alacsony': 'badge--sev-low',
    'Közepes': 'badge--sev-med',
    'Magas': 'badge--sev-high',
    'Kritikus': 'badge--sev-crit'
  };
  const sevClass = severityClassMap[cls.severity];
  
  // Find related events (simple similarity check or adjacent events in same section)
  const related = allEvents
    .filter(other => other.id !== ev.id && (other.id.split('.')[0] === ev.id.split('.')[0] || classifyEvent(other).institution === cls.institution))
    .slice(0, 3);
  
  // Generate detail layout sections (numbered 01 to N)
  let sectionIndex = 0;
  
  const detailBody = `
<section class="ds-section">
  <div class="container">
    <article class="ev-detail">
      <header class="ev-detail__header">
        <nav class="ev-detail__crumbs" aria-label="Breadcrumb">
          <a href="/">Kezdőlap</a> · <a href="/#events">Események</a> · <span aria-current="page">§ ${ev.id}</span>
        </nav>
        <h1 class="ev-detail__title">${ev.title}</h1>
        <div class="ev-detail__badges">
          <span class="badge ${sevClass}"><span class="badge__dot" aria-hidden="true"></span>${cls.severity} súlyosság</span>
          <span class="badge badge--ins">${cls.institution}</span>
          ${cls.categories.map(c => `<span class="badge badge--cat">${c}</span>`).join('')}
        </div>
      </header>

      <div class="ev-detail__body">
        ${ev.subSections.map(subSec => {
          const isJavasoltMondat = subSec.title.includes('Javasolt mondat') || subSec.title.includes('Javasolt válasz');
          
          if (isJavasoltMondat) {
            sectionIndex++;
            const templateId = `template-text-${ev.id.replace(/\./g, '-')}-${sectionIndex}`;
            return `
        <section class="ev-detail__section" aria-labelledby="ed-${sectionIndex}">
          <div class="ev-detail__section-num" aria-hidden="true">${String(sectionIndex).padStart(2, '0')}</div>
          <div style="width: 100%;">
            <h3 id="ed-${sectionIndex}">${subSec.title}</h3>
            <div class="template-box" data-template>
              <div class="template-box__head">
                <span class="template-box__label">Másolható mondat</span>
                <button type="button" class="copy-btn" data-copy-target="${templateId}" aria-label="Mondat másolása">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  <span data-copy-label>Másolás</span>
                </button>
              </div>
              <p class="template-box__text" id="${templateId}">${subSec.body}</p>
            </div>
          </div>
        </section>
            `;
          }

          // Otherwise render standard detailed list / content block
          sectionIndex++;
          return `
        <section class="ev-detail__section" aria-labelledby="ed-${sectionIndex}">
          <div class="ev-detail__section-num" aria-hidden="true">${String(sectionIndex).padStart(2, '0')}</div>
          <div>
            <h3 id="ed-${sectionIndex}">${subSec.title}</h3>
            ${subSec.parsed.isList ? `
            <ul class="ev-detail__list">
              ${subSec.parsed.items.map(it => `<li>${it.text}</li>`).join('\n')}
            </ul>
            ` : `
            ${subSec.parsed.items.map(it => `<p style="margin-bottom: var(--sp-3); line-height: var(--lh-prose); color: var(--color-text-muted);">${it.text}</p>`).join('\n')}
            `}
          </div>
        </section>
          `;
        }).join('\n')}

        ${related.length > 0 ? `
        <section class="ev-detail__section" aria-labelledby="ed-related">
          <div class="ev-detail__section-num" aria-hidden="true">${String(sectionIndex + 1).padStart(2, '0')}</div>
          <div>
            <h3 id="ed-related">Kapcsolódó események</h3>
            <div class="related-row">
              ${related.map(r => {
                const rCls = classifyEvent(r);
                const rSevClass = severityClassMap[rCls.severity];
                return `
              <a href="/event-${r.id.replace(/\./g, '-')}" class="ev-card" style="margin-top: var(--sp-2);">
                <span class="ev-card__id">§ ${r.id}</span>
                <div class="ev-card__badges">
                  <span class="badge ${rSevClass}"><span class="badge__dot" aria-hidden="true"></span>${rCls.severity}</span>
                </div>
                <h3 class="ev-card__title" style="font-size: var(--fs-small); margin-top: var(--sp-1);">${r.title}</h3>
                <span class="ev-card__cta" style="margin-top: auto;">Részletek</span>
              </a>
                `;
              }).join('\n')}
            </div>
          </div>
        </section>
        ` : ''}

      </div>
    </article>
  </div>
</section>
  `;

  fs.writeFileSync(
    path.join(DIST_DIR, `event-${ev.id.replace(/\./g, '-')}.html`),
    getBaseTemplate(`§ ${ev.id} ${ev.title}`, detailBody, 'events')
  );
});

// 9. Write General Pages (alapkeret.html, akcioterv.html, alapmondatok.html, tudastar.html)

// Alapkeret (Section 0)
const sec0 = parsedSections.find(s => s.id === '0');
const alapkeretContent = `
<section class="ds-section">
  <div class="container">
    <div class="terminal" style="margin-bottom: var(--sp-6);">
      <div class="terminal__chrome">
        <span class="terminal__dot" aria-hidden="true"></span>
        <span class="terminal__dot" aria-hidden="true"></span>
        <span class="terminal__dot" aria-hidden="true"></span>
        <span class="terminal__title">eljárási.térkép / alapkeret</span>
      </div>
      <div class="terminal__body">
        <h1 class="ds-section__title" style="margin-bottom: var(--sp-2);">§ 0. ${sec0.title}</h1>
        <p class="ds-hero__sub" style="margin-bottom: 0;">Ismerd meg a helyes kommunikációs keretet, mielőtt bármilyen hatóságnak válaszolnál.</p>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: var(--sp-6);">
      ${sec0.generalSubsections.map(sub => {
        const isJavasoltMondatok = sub.title.includes('Javasolt');
        
        return `
      <div class="tudastar-card">
        <h2>${sub.title}</h2>
        ${isJavasoltMondatok ? `
        <div style="display: flex; flex-direction: column; gap: var(--sp-3); margin-top: var(--sp-3);">
          ${sub.parsed.items.map((it, idx) => {
            const templateId = `template-base-sec0-${idx}`;
            return `
            <div class="template-box" data-template>
              <div class="template-box__head">
                <span class="template-box__label">Javasolt fordulat</span>
                <button type="button" class="copy-btn" data-copy-target="${templateId}">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  <span data-copy-label>Másolás</span>
                </button>
              </div>
              <p class="template-box__text" id="${templateId}">${it.text.replace(/^-\s*/, '')}</p>
            </div>
            `;
          }).join('\n')}
        </div>
        ` : `
        ${sub.parsed.isList ? `
        <ul class="ev-detail__list">
          ${sub.parsed.items.map(it => `<li>${it.text}</li>`).join('\n')}
        </ul>
        ` : `
        ${sub.parsed.items.map(it => `<p style="line-height: var(--lh-prose); color: var(--color-text-muted); margin-bottom: var(--sp-3);">${it.text}</p>`).join('\n')}
        `}
        `}
      </div>
        `;
      }).join('\n')}
    </div>
  </div>
</section>
`;
fs.writeFileSync(
  path.join(DIST_DIR, 'alapkeret.html'),
  getBaseTemplate('0. Alapkeret', alapkeretContent, 'alapkeret')
);


// Akcióterv (Section 17)
const sec17 = parsedSections.find(s => s.id === '17');
const akciotervContent = `
<section class="ds-section">
  <div class="container">
    <div class="terminal" style="margin-bottom: var(--sp-6);">
      <div class="terminal__chrome">
        <span class="terminal__dot" aria-hidden="true"></span>
        <span class="terminal__dot" aria-hidden="true"></span>
        <span class="terminal__dot" aria-hidden="true"></span>
        <span class="terminal__title">eljárási.térkép / akcióterv</span>
      </div>
      <div class="terminal__body">
        <h1 class="ds-section__title" style="margin-bottom: var(--sp-2);">§ 17. ${sec17.title}</h1>
        <p class="ds-hero__sub" style="margin-bottom: 0;">Rövid, pontokba szedett teendők arra az esetre, ha felkeres valamilyen szereplő vagy hivatal.</p>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: var(--sp-6);">
      ${sec17.generalSubsections.map(sub => {
        return `
      <div class="tudastar-card">
        <h2>${sub.title}</h2>
        <ul class="ev-detail__list">
          ${sub.parsed.items.map(it => `<li>${it.text}</li>`).join('\n')}
        </ul>
      </div>
        `;
      }).join('\n')}
    </div>
  </div>
</section>
`;
fs.writeFileSync(
  path.join(DIST_DIR, 'akcioterv.html'),
  getBaseTemplate('Akcióterv szülőknek', akciotervContent, 'akcioterv')
);


// Alapmondatok (Section 18)
const sec18 = parsedSections.find(s => s.id === '18');
const alapmondatokContent = `
<section class="ds-section">
  <div class="container">
    <div class="terminal" style="margin-bottom: var(--sp-6);">
      <div class="terminal__chrome">
        <span class="terminal__dot" aria-hidden="true"></span>
        <span class="terminal__dot" aria-hidden="true"></span>
        <span class="terminal__dot" aria-hidden="true"></span>
        <span class="terminal__title">eljárási.térkép / alapmondatok</span>
      </div>
      <div class="terminal__body">
        <h1 class="ds-section__title" style="margin-bottom: var(--sp-2);">§ 18. ${sec18.title}</h1>
        <p class="ds-hero__sub" style="margin-bottom: 0;">Azonnal használható, jogilag átgondolt mondatok a különböző eljárási szakaszokra. Kattints a másolás gombra a vágólapra tételhez.</p>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr; gap: var(--sp-5);">
      ${sec18.generalSubsections.map((sub, idx) => {
        const templateId = `template-base-sec18-${idx}`;
        // Clean text (strip leading bullet if it exists or keep as is)
        const rawText = sub.body.replace(/^-\s*/, '').replace(/^„|”$/g, '').trim();
        return `
      <div class="tudastar-card">
        <h2>${sub.title}</h2>
        <div class="template-box" data-template style="margin-top: var(--sp-2);">
          <div class="template-box__head">
            <span class="template-box__label">Másolható fordulat</span>
            <button type="button" class="copy-btn" data-copy-target="${templateId}">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <span data-copy-label>Másolás</span>
            </button>
          </div>
          <p class="template-box__text" id="${templateId}">„${rawText}”</p>
        </div>
      </div>
        `;
      }).join('\n')}
    </div>
  </div>
</section>
`;
fs.writeFileSync(
  path.join(DIST_DIR, 'alapmondatok.html'),
  getBaseTemplate('Alapmondatok minden szakaszra', alapmondatokContent, 'alapmondatok')
);


// Tudástár (Sections 15, 16, 19 + warning)
const sec15 = parsedSections.find(s => s.id === '15');
const sec16 = parsedSections.find(s => s.id === '16');
const sec19 = parsedSections.find(s => s.id === '19');
const secWarning = parsedSections.find(s => s.id === 'warning');

const tudastarContent = `
<section class="ds-section">
  <div class="container">
    <div class="terminal" style="margin-bottom: var(--sp-6);">
      <div class="terminal__chrome">
        <span class="terminal__dot" aria-hidden="true"></span>
        <span class="terminal__dot" aria-hidden="true"></span>
        <span class="terminal__dot" aria-hidden="true"></span>
        <span class="terminal__title">eljárási.térkép / tudástár</span>
      </div>
      <div class="terminal__body">
        <h1 class="ds-section__title" style="margin-bottom: var(--sp-2);">Tudástár</h1>
        <p class="ds-hero__sub" style="margin-bottom: 0;">Bizonyítékgyűjtési segédletek, súlyossági besorolások és a térkép stratégiai pontjainak összefoglalása.</p>
      </div>
    </div>

    <div class="tudastar-grid">
      
      <!-- Section 15 -->
      <div class="tudastar-card" id="bizonyitek">
        <h2>§ 15. ${sec15.title}</h2>
        ${sec15.generalSubsections.map(sub => `
        <div style="margin-bottom: var(--sp-4);">
          <h3 class="h4" style="margin-bottom: var(--sp-2); color: var(--color-text);">${sub.title}</h3>
          <ul class="ev-detail__list">
            ${sub.parsed.items.map(it => `<li>${it.text}</li>`).join('\n')}
          </ul>
        </div>
        `).join('\n')}
      </div>

      <!-- Section 16 -->
      <div class="tudastar-card" id="sulyossag">
        <h2>§ 16. ${sec16.title}</h2>
        <p style="color: var(--color-text-muted); margin-bottom: var(--sp-4); line-height: var(--lh-prose);">
          Az eljárások során előforduló helyzetek súlyossági osztályozása. A magas és kritikus szinteknél kiemelten javasolt az azonnali írásbeli reakció és szükség esetén jogi segítség bevonása.
        </p>
        ${sec16.generalSubsections.map(sub => {
          let badgeClass = 'badge--sev-low';
          if (sub.title.includes('Kritikus')) badgeClass = 'badge--sev-crit';
          else if (sub.title.includes('Magas')) badgeClass = 'badge--sev-high';
          else if (sub.title.includes('Közepes')) badgeClass = 'badge--sev-med';
          
          return `
        <div style="margin-bottom: var(--sp-4);">
          <div style="display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-2);">
            <span class="badge ${badgeClass}"><span class="badge__dot" aria-hidden="true"></span>${sub.title.split(' ')[0]}</span>
          </div>
          <ul class="ev-detail__list">
            ${sub.parsed.items.map(it => `<li>${it.text}</li>`).join('\n')}
          </ul>
        </div>
          `;
        }).join('\n')}
      </div>

      <!-- Section 19 -->
      <div class="tudastar-card" id="stratégia">
        <h2>§ 19. ${sec19.title}</h2>
        <p style="color: var(--color-text-muted); margin-bottom: var(--sp-4); line-height: var(--lh-prose);">
          A legfontosabb stratégiai alapvetések, melyeket a védőoltási eljárási vitákban érdemes szem előtt tartani.
        </p>
        <ul class="ev-detail__list">
          ${sec19.generalSubsections[0] ? sec19.generalSubsections[0].parsed.items.map(it => `<li>${it.text}</li>`).join('\n') : ''}
          ${sec19.parsed ? sec19.parsed.items.map(it => `<li>${it.text}</li>`).join('\n') : ''}
        </ul>
      </div>

      <!-- Warning Section -->
      <div class="warn-box warn-box--critical" style="grid-template-columns: 36px 1fr; padding: var(--sp-5);">
        <div class="warn-box__icon" aria-hidden="true">!</div>
        <div class="warn-box__body">
          <span class="warn-box__label">Figyelmeztetés!</span>
          <p class="warn-box__text" style="font-size: var(--fs-body); line-height: var(--lh-prose);">
            ${secWarning.rawContent ? mdToHtml(secWarning.rawContent) : 'Az oldalon szereplő információk kizárólag tájékoztató jellegűek, nem minősülnek jogi vagy egészségügyi tanácsadásnak. Konkrét ügyben minden esetben javasolt ügyvéd, orvos vagy megfelelő szakember bevonása.'}
          </p>
        </div>
      </div>

    </div>
  </div>
</section>
`;
fs.writeFileSync(
  path.join(DIST_DIR, 'tudastar.html'),
  getBaseTemplate('Tudástár és Összefoglalás', tudastarContent, 'tudastar')
);

console.log('Site build completed successfully.');
