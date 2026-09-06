(() => {
  'use strict';
  const body = document.body;
  const article = document.querySelector('.hb-article');
  if (!article) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const button = document.querySelector('.hb-motion');
  const index = document.querySelector('.hb-index');
  const locationLabel = document.querySelector('.hb-location');
  const chapters = [...document.querySelectorAll('.hb-chapter')];
  const links = [...index.querySelectorAll('a')];
  const scenes = [...document.querySelectorAll('[data-scene]')].map(section => ({
    section,
    side: section.querySelector('.hb-chapter-side'),
    diagram: section.querySelector('.hb-diagram'),
    parts: [...section.querySelectorAll('[data-diagram-part]')],
    cues: [...section.querySelectorAll(section.dataset.scene === 'stop' ? '.hb-prose h4.hb-subheading' : '.hb-prose .hb-subheading')],
  }));
  let manualOff = false;
  try { manualOff = localStorage.getItem('handbook-motion') === 'off'; } catch { /* Storage is optional. */ }
  let frame = 0, enabled = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  function measure() {
    const mobile = innerWidth <= 700;
    for (const scene of scenes) {
      const target = mobile ? scene.diagram : scene.side;
      scene.side.classList.toggle('is-pinnable', target.offsetHeight < innerHeight - 120);
    }
    schedule();
  }
  function update() {
    frame = 0;
    const mobile = innerWidth <= 700;
    const bounds = article.getBoundingClientRect();
    document.querySelector('.hb-progress').style.setProperty('--reading-progress', clamp((80 - bounds.top) / Math.max(1, bounds.height - innerHeight + 80)));
    let current = null;
    for (const chapter of chapters) {
      if (chapter.getBoundingClientRect().top <= innerHeight * .35) current = chapter;
      else break;
    }
    const currentId = current?.id || 'kezikonyv';
    locationLabel.textContent = current ? current.querySelector('h2').textContent : 'A MANIPULÁCIÓ ANATÓMIÁJA';
    for (const link of links) {
      if (link.hash === `#${currentId}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    for (const scene of scenes) {
      const rect = scene.section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) continue;
      const progress = enabled ? clamp((innerHeight * .45 - rect.top) / Math.max(1, rect.height - innerHeight * .45)) : 1;
      scene.section.style.setProperty('--diagram-progress', progress);
      let active = Math.min(scene.parts.length - 1, Math.floor(progress * scene.parts.length));
      if (scene.cues.length >= scene.parts.length) {
        active = 0;
        scene.cues.slice(0, scene.parts.length).forEach((cue, i) => {
          if (cue.getBoundingClientRect().top < innerHeight * .35) active = i;
        });
      }
      scene.parts.forEach((part, i) => part.classList.toggle('is-active', !enabled || i === active));
      scene.cues.slice(0, scene.parts.length).forEach((cue, i) => cue.classList.toggle('is-current', enabled && i === active));
      // On phones the diagram releases after a short pin; the article never moves.
      scene.section.classList.toggle('mobile-pin-ended', mobile && rect.top < -innerHeight * 1.2);
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function setMotion() {
    enabled = !manualOff && !preference.matches;
    body.classList.toggle('hb-motion-on', enabled);
    body.classList.toggle('hb-motion-off', !enabled);
    button.textContent = enabled ? 'Mozgás kikapcsolása' : 'Mozgás bekapcsolása';
    button.setAttribute('aria-pressed', String(!enabled));
    // The OS preference always wins, including changes while the page is open.
    button.disabled = preference.matches;
    if (preference.matches) button.textContent = 'Csökkentett mozgás';
    measure();
  }
  button.hidden = false;
  button.addEventListener('click', () => {
    manualOff = !manualOff;
    try { localStorage.setItem('handbook-motion', manualOff ? 'off' : 'on'); } catch { /* Continue without persistence. */ }
    setMotion();
  });
  preference.addEventListener('change', setMotion);
  index.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    index.open = false;
    const target = document.getElementById(link.hash.slice(1));
    if (target) {
      // Preserve native hash history while moving keyboard focus out of the closed index.
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && index.open) {
      index.open = false;
      index.querySelector('summary').focus();
    }
  });
  document.addEventListener('click', event => { if (!index.contains(event.target)) index.open = false; });
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: .05 });
  chapters.forEach(chapter => observer.observe(chapter));
  // The unmodified engine only drives decorative flow progress. It never hides article text.
  if (window.ScrollCraft) window.ScrollCraft.mount(article);
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', measure, { passive: true });
  addEventListener('hashchange', schedule);
  new ResizeObserver(measure).observe(article);
  if (document.fonts) document.fonts.ready.then(measure);
  setMotion();
})();
