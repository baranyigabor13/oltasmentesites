(function () {
  var buttons = document.querySelectorAll('.copy-btn[data-copy-target]');
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-copy-target');
      var target = document.getElementById(targetId);
      if (!target) return;
      var text = target.innerText || target.textContent;
      var label = btn.querySelector('[data-copy-label]');
      var original = label ? label.textContent : '';
      var setState = function (state, message) {
        btn.setAttribute('data-state', state);
        if (label) label.textContent = message;
        var box = btn.closest('.template-box');
        if (box) box.setAttribute('data-state', state);
        window.setTimeout(function () {
          btn.removeAttribute('data-state');
          if (box) box.removeAttribute('data-state');
          if (label) label.textContent = original;
        }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          setState('success', 'Másolva');
        }).catch(function () {
          setState('error', 'Nem sikerült');
        });
      } else {
        try {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.position = 'absolute';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          setState('success', 'Másolva');
        } catch (e) {
          setState('error', 'Nem sikerült');
        }
      }
    });
  });
})();
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
        const btn = document.querySelector(`.filter-btn[data-filter-type="category"][data-filter-val="${cat}"]`);
        if (btn) {
          btn.classList.add('is-active');
          activeFilters.category = cat;
        }
      } else if (hash.startsWith('#institution-')) {
        const ins = decodeURIComponent(hash.substring(13));
        const btn = document.querySelector(`.filter-btn[data-filter-type="institution"][data-filter-val="${ins}"]`);
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
