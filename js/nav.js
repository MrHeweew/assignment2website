/* ==========================================================
   nav.js   (loaded LAST)
   Page changes WITHOUT a full reload ("single-page" navigation).
   Why: a normal link reloads everything, which would restart the
   music and the 3D scene. Here we swap only the <main> content and
   keep the 3D balance + music running.

   Two ways to get the next page's content:
     1) Live Server / real web server -> fetch the .html file with AJAX
     2) Double-clicked file (file://)  -> browsers block AJAX, so we use the
        copy bundled in js/pages.js (made by build-pages.js)
   Either way the page never reloads, so the music never stops.
   ========================================================== */
$(function(){
  const $body = $('body');
  const FILE  = location.protocol === 'file:';          // opened without a web server?
  const fileOf = u => new URL(u, location.href).pathname.split('/').pop() || 'index.html';
  let busy = false, current = fileOf(location.href), skipHash = false;

  function closeMenu(){
    $('#menu').removeClass('open'); $body.removeClass('menu-open'); $('#burger').attr('aria-expanded', false).html(SITE.icon('menu'));
  }

  /* Put the new content on screen (called after the fade-out) */
  function show(data, name, url, push){
    $('#main').html(data.html);                                         // swap ONLY the page content
    document.title = data.title;
    $body.attr('data-page', data.page);
    current = name;
    if(push){
      if(FILE){ skipHash = true; location.hash = '/' + name; }          // file:// can't pushState: use the #hash
      else history.pushState({}, '', url);
    }
    scrollTo({top: 0, behavior: 'instant'});
    closeMenu();
    SITE.runInits();                                                    // re-run this page's setup
    const hash = new URL(url, location.href).hash;                      // e.g. expertise.html#family
    if(hash.length > 1 && !hash.startsWith('#/')) setTimeout(() => { const el = document.getElementById(hash.slice(1)); if(el) el.scrollIntoView({behavior: 'smooth'}); }, 350);
    SITE.flyOut();
    $body.removeClass('leaving');                                       // fade back in
    busy = false;
  }

  function go(url, push){
    if(busy) return;
    const name = fileOf(url), bundled = window.SITE_PAGES && SITE_PAGES[name];
    busy = true;
    $body.addClass('leaving');                                          // fade out
    if($body.attr('data-page') === 'home') SITE.flyIn();                // camera dives in from the home scene
    const t0 = Date.now(), wait = () => Math.max(0, 450 - (Date.now() - t0));
    const fallback = () => {                                            // AJAX blocked or failed
      if(bundled) setTimeout(() => show(bundled, name, url, push), wait());
      else location.href = url;                                         // last resort: normal navigation
    };
    if(FILE){ fallback(); return; }                                     // no web server: use the bundle straight away
    $.ajax({url: url, dataType: 'html'})
      .done(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html'), main = doc.querySelector('main');
        if(!main){ fallback(); return; }
        setTimeout(() => show({title: doc.title, page: doc.body.dataset.page, html: main.innerHTML}, name, url, push), wait());
      })
      .fail(fallback);
  }

  SITE.navigate = u => go(new URL(u, location.href).href, true);       // used by the 3D hotspots

  // Intercept clicks on normal links to our own .html pages
  $(document).on('click', 'a[href]', function(e){
    if(e.ctrlKey || e.metaKey || e.shiftKey || e.which > 1 || this.target || this.hasAttribute('download')) return;
    const raw = this.getAttribute('href') || '';
    if(raw.startsWith('#')){                                                   // in-page anchor (process stages, skip link...)
      const el = raw.length > 1 && document.getElementById(raw.slice(1));
      if(el){ e.preventDefault(); el.scrollIntoView({behavior: 'smooth', block: 'center'}); }   // scroll only: the address bar (page route) stays untouched
      return;
    }
    const u = new URL(this.href, location.href);
    if(u.origin !== location.origin || !/\.html$/.test(u.pathname)) return;
    e.preventDefault();
    if(fileOf(u.href) === current){                                       // already on this page: just scroll
      closeMenu();
      const el = u.hash.length > 1 && document.getElementById(u.hash.slice(1));
      if(el) el.scrollIntoView({behavior: 'smooth'}); else scrollTo({top: 0, behavior: 'smooth'});
      return;
    }
    go(u.href, true);
  });

  // Browser back / forward
  addEventListener('popstate', () => { if(!FILE) go(location.href, false); });
  addEventListener('hashchange', () => {                                // file:// mode keeps the page in the #hash
    if(!FILE) return;
    if(skipHash){ skipHash = false; return; }                           // that change was ours
    if(!/^#\/.+\.html$/.test(location.hash)) return;                    // not a page route (e.g. #stage2): ignore it
    go(new URL(location.hash.replace(/^#\/?/, '') || 'index.html', location.href).href, false);
  });

  SITE.runInits();                                                    // first page load
  if(FILE && /^#\/.+\.html$/.test(location.hash)) go(new URL(location.hash.slice(2), location.href).href, false);  // reload on a #/page
});
