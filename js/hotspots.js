/* ==========================================================
   hotspots.js
   Creates the 3 clickable glowing dots (from SITE.hotspots) and keeps
   them stuck to the 3D balance every frame. They work on EVERY page,
   so the balance is the site's navigator.
   Dots hide themselves when something is in front of the balance
   (the footer, the mobile menu) or when the balance has scrolled away.
   ========================================================== */
(function(){
  // The container is created here so it exists on every page
  let box = document.getElementById('hotspots');
  if(!box){ box = document.createElement('div'); box.id = 'hotspots'; document.body.appendChild(box); }

  const touch = matchMedia('(hover:none)').matches;       // phones / tablets: no hover

  // 1. One <button> per hotspot
  const els = SITE.hotspots.map(h => {
    const b = document.createElement('button');
    b.className = 'hs';
    b.setAttribute('aria-label', 'Go to ' + h.label);   // screen-reader text
    b.innerHTML = '<i></i><span>' + h.label + '</span>';
    const lean = {left: .3, right: -.3, top: 0}[h.part] || 0;                 // hover: the balance turns toward the dot
    b.addEventListener('mouseenter', () => { SITE.lean = lean; SITE.sfx && SITE.sfx.hover(); });   // soft chime
    b.addEventListener('mouseleave', () => { SITE.lean = 0; });
    b.addEventListener('click', () => {
      // On touch screens the first tap only shows the label; the second tap opens the page
      if(touch && !b.classList.contains('active')){
        els.forEach(e => e.classList.remove('active')); b.classList.add('active');
        SITE.sfx && SITE.sfx.hover(); return;
      }
      SITE.sfx && SITE.sfx.whoosh();                 // whoosh as we dive in
      (SITE.navigate || (u => location.href = u))(h.href);   // nav.js swaps the page without reloading
    });
    box.appendChild(b);
    return b;
  });

  // 2. After every page change: mark the dot of the page you are on, update the hint text
  SITE.pageInits.push(() => {
    const here = document.body.dataset.page;
    els.forEach((el, i) => {
      const cur = SITE.hotspots[i].page === here;
      el.classList.toggle('current', cur); el.classList.remove('active');
      if(cur) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
    });
    const hint = document.getElementById('hint');
    if(hint && touch) hint.textContent = 'Tap a glowing point to explore';
  });

  // 3. Every frame: move each dot to where its part of the model appears on screen
  SITE.frameCallbacks.push(() => {
    // Has the written home content scrolled over the 3D intro? Then nothing should float above it.
    const sec = document.getElementById('home-content');
    const covered = document.body.dataset.page === 'home' && sec && sec.getBoundingClientRect().top < innerHeight*.85;
    document.body.classList.toggle('covered', !!covered);   // CSS also fades the hint + button
    els.forEach((el, i) => {
      const p = SITE.project(SITE.hotspots[i]);
      if(!p) return;
      el.style.left = p.x + 'px';
      el.style.top  = p.y + 'px';
      el.classList.toggle('flip', p.x > innerWidth*.6);                 // label opens toward the screen centre
      el.classList.toggle('hidden', !p.facing || !p.visible || covered);
    });
  });
})();
