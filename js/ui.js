/* ==========================================================
   ui.js
   Site-wide interface: navigation, footer, dark/light toggle,
   back-to-top, scroll-reveal, animated counters, slider.
   Uses jQuery ($).
   ========================================================== */
$(function(){
  const page = document.body.dataset.page;          // which page are we on?
  const links = [['index.html','home','Home'],['meet.html','meet','Meet the Lawyer'],
                 ['expertise.html','expertise','Expertise'],['articles.html','articles','Articles'],['contact.html','contact','Contact Us']];

  /* Header & footer are written once here, so every page stays identical */
  /* HEADER. Links 1-4 get a small number (01, 02...) like ario.law */
  const num = (l, i) => (i ? '<i>0' + i + '</i>' : '') + l[2];
  $('#nav').html(`<header><div class="wrap bar">
    <a class="logo" href="index.html" aria-label="Abdallah, home"><img class="logo-mark" src="images/favicon.png" width="34" height="34" alt="">Abdallah<small>Consultancy firm</small></a>
    <nav aria-label="Main"><ul id="menu">
      ${links.map((l,i)=>`<li><a href="${l[0]}" data-p="${l[1]}" class="${l[1]===page?'on':''}">${num(l,i)}</a></li>`).join('')}
      <li class="tools"><button class="ib" id="sound" aria-label="Turn sound on" aria-pressed="false">${SITE.icon('sound-off')}</button>
      <button class="ib" id="theme" aria-label="Switch between light and dark theme">${SITE.icon('moon')}</button></li></ul></nav>
    <button class="ib" id="burger" aria-label="Open menu" aria-expanded="false">${SITE.icon('menu')}</button></div></header>`);

  /* FOOTER: one call-to-action, three columns, giant wordmark, disclaimer + model credit */
  $('#foot').html(`<footer><div class="wrap">
    <div class="foot-cta"><h2>Let's talk about your matter</h2><a class="btn" href="contact.html">Schedule a legal consultation ${SITE.icon('arrow')}</a></div>
    <div class="foot-grid">
      <div><h3>Navigation</h3><ul>${links.map(l=>`<li><a href="${l[0]}">${l[2]}</a></li>`).join('')}</ul></div>
      <div><h3>Contacts</h3><ul>
        <li class="li">${SITE.icon('phone')}<a href="tel:+23057995620">+230 57995620</a></li>
        <li class="li">${SITE.icon('mail')}<a href="mailto:abdallah@gmail.com">abdallah@gmail.com</a></li>
        <li class="li">${SITE.icon('pin')}<span>Cyber Tower 1, Quatre Bornes, Mauritius</span></li></ul></div>
      <div><h3>Legal</h3><p>Legal services with high professionalism and outstanding results.</p></div></div>
    <p class="mark" aria-hidden="true">Abdallah</p>
    <p class="disc">Information on this website is general in nature and does not constitute legal advice.</p>
    <p class="disc" style="border:0;padding-top:.2rem">3D model: <a href="https://sketchfab.com/3d-models/balance-scale-c880997ff2b3438c8e26600b57cf406b">"Balance Scale"</a> by Jean-Francois Bonin on Sketchfab, licensed <a href="http://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.</p></div></footer>`);

  /* Sound: speaker button + tiny hover/click effects (all synthesized, see sound.js) */
  SITE.sound.refresh();                                            // set the speaker icon
  $(document).on('click', '#sound', () => { SITE.sound.toggle(); SITE.sfx.click(); });
  $(document).on('mouseenter', '.btn, nav a, .card, .ib, summary', () => SITE.sfx.tick());
  $(document).on('click', '.btn, nav a, summary, #theme', () => SITE.sfx.click());

  /* Mobile menu: burger toggles a full-screen panel. Esc or a link click closes it. */
  const closeMenu = () => { $('#menu').removeClass('open'); $('body').removeClass('menu-open'); $('#burger').attr('aria-expanded', false).html(SITE.icon('menu')); };
  $('#burger').on('click', function(){
    const o = $('#menu').toggleClass('open').hasClass('open');
    $('body').toggleClass('menu-open', o); $(this).attr('aria-expanded', o).html(SITE.icon(o ? 'close' : 'menu'));
  });
  $(document).on('click', '#menu a', closeMenu);
  $(document).on('keydown', e => { if(e.key === 'Escape') closeMenu(); });
  $(window).on('resize', () => { if(innerWidth >= 820) closeMenu(); });   // desktop never keeps it open

  /* Dark / light theme (remembered between visits) */
  const setTheme = t => { document.documentElement.dataset.theme = t; $('#theme').html(SITE.icon(t === 'dark' ? 'sun' : 'moon')); try{ localStorage.theme2 = t }catch(e){} };
  setTheme((()=>{ try{ return localStorage.theme2 }catch(e){} })() || 'light');
  $(document).on('click', '#theme', () => setTheme(document.documentElement.dataset.theme==='dark' ? 'light' : 'dark'));

  /* Back-to-top button */
  $('#top').on('click', () => scrollTo({top:0, behavior:'smooth'}));
  $(window).on('scroll', () => $('#top').toggleClass('show', scrollY > 500));

  /* ---- Things each PAGE needs (re-run after every page change, see nav.js) ---- */
  // Scroll-reveal + counters: IntersectionObserver fires when an element enters the screen
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if(!e.isIntersecting) return;
    $(e.target).addClass('in');
    $(e.target).find('[data-n]').each(function(){            // count up to data-n
      const el = this, to = +el.dataset.n; let c = 0;
      const id = setInterval(() => { c += Math.ceil(to/40); if(c>=to){ c=to; clearInterval(id) } el.textContent = c+'+'; }, 35);
    });
    io.unobserve(e.target);
  }), {threshold:.2});

  SITE.pageInits.push(() => {
    const here = document.body.dataset.page;
    $('#menu a').removeClass('on').filter('[data-p="'+here+'"]').addClass('on');   // highlight current page in the menu
    $('.reveal').each((_, e) => io.observe(e));
    SITE.reveal = () => $('.reveal:not(.in)').each((_, e) => io.observe(e));   // lets late-added content (articles) fade in too

    // Testimonial slider (auto-advances every 5.5s, dots are clickable)
    clearInterval(SITE._slider);
    const $s = $('.slide');
    if($s.length){
      let i = 0;
      const go = n => { i = n; $s.removeClass('on').eq(i).addClass('on'); $('#dots button').removeClass('on').eq(i).addClass('on'); };
      $s.each(n => $('#dots').append(`<button aria-label="Review ${n+1}"></button>`));
      $('#dots button').on('click', function(){ go($(this).index()); }).first().addClass('on');
      SITE._slider = setInterval(() => go((i+1) % $s.length), 5500);
    }
  });
});
