/* ==========================================================
   sections.js
   Behaviour for the SERVICES and PROCESS sections (css/08-...).
   Re-runs after every page change (SITE.pageInits, see nav.js).
   ========================================================== */
SITE.pageInits.push(function(){

  /* ---- SERVICES: picking a name (hover, focus or tap) swaps the picture and opens its text ---- */
  $('.sv-wrap').each(function(){
    const $w = $(this), $items = $w.find('.svi'), $imgs = $w.find('.sv-media img'), $count = $w.find('.sv-count');
    const set = i => {
      $items.removeClass('on').find('.sv').attr('aria-expanded', false);
      $items.eq(i).addClass('on').find('.sv').attr('aria-expanded', true);
      $imgs.removeClass('on').eq(i).addClass('on');
      $count.text(String(i + 1).padStart(2, '0') + ' / ' + String($items.length).padStart(2, '0'));
    };
    const canHover = matchMedia('(hover:hover)').matches;              // mouse: hover works. Touch: tap works.
    $items.each(function(i){
      const $b = $(this).find('.sv');
      $b.on('click focus', () => set(i));
      if(canHover) $b.on('mouseenter', () => set(i));
    });
    set(0);
  });

  /* ---- PROCESS: highlight the stage in the middle of the screen, update the big counter ---- */
  const $stages = $('.stage');
  if($stages.length){
    const $no = $('#stage-no'), $ticks = $('.ticks li');
    const mark = i => { $stages.removeClass('on').eq(i).addClass('on'); $ticks.removeClass('on').eq(i).addClass('on');
                        $no.text(String(i + 1).padStart(2, '0')); };
    mark(0);
    const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting) mark($stages.index(e.target)); }),
                                        {rootMargin: '-40% 0px -45% 0px'});   // fires when a stage crosses the middle band
    $stages.each((_, el) => io.observe(el));
  }
});
