/* ==========================================================
   effects.js
   The "premium" polish, inspired by the sites on threejs.org
   (Lusion, igloo.inc, Bruno Simon...). Everything here is optional
   decoration: if it fails, the site still works.
     1. Scroll progress bar
     2. Custom cursor ring (desktop only) that grows over clickable things
     3. Magnetic buttons (they lean toward the pointer)
     4. Headings that rise word by word
     5. A big "Next page" link at the bottom of each inner page
   ========================================================== */
$(function(){
  const fine   = matchMedia('(hover:hover) and (pointer:fine)').matches;   // mouse, not touch
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* 1. SCROLL PROGRESS BAR (thin blue line at the very top) */
  $('body').append('<div id="progress" aria-hidden="true"></div>');
  const bar = document.getElementById('progress');
  const prog = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? scrollY/h : 0) + ')'; };
  addEventListener('scroll', prog, {passive:true}); addEventListener('resize', prog);

  /* 2. CUSTOM CURSOR: a ring that trails the mouse and grows on links/buttons/dots */
  if(fine && !reduce){
    $('body').append('<div id="cursor" aria-hidden="true"></div>');
    const c = document.getElementById('cursor'); let x = -50, y = -50, cx = -50, cy = -50;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; c.classList.add('on'); });
    document.addEventListener('mouseleave', () => c.classList.remove('on'));
    $(document).on('mouseover', 'a,button,summary,input,select,textarea,.card', () => c.classList.add('hot'))
               .on('mouseout',  'a,button,summary,input,select,textarea,.card', () => c.classList.remove('hot'));
    (function move(){ cx += (x-cx)*.18; cy += (y-cy)*.18; c.style.transform = 'translate('+cx+'px,'+cy+'px)'; requestAnimationFrame(move); })();

    /* 3. MAGNETIC BUTTONS: while the pointer is over a button it leans toward it (via CSS variables) */
    $(document).on('mousemove', '.btn:not(.home-cta)', function(e){
      const r = this.getBoundingClientRect();
      this.style.setProperty('--mx', ((e.clientX - r.left - r.width/2)*.25) + 'px');
      this.style.setProperty('--my', ((e.clientY - r.top  - r.height/2)*.35) + 'px');
    }).on('mouseleave', '.btn', function(){ this.style.removeProperty('--mx'); this.style.removeProperty('--my'); });
  }

  /* Things below run on every page (first load AND after each page change) */
  const order = [['meet','meet.html','Meet the Lawyer'],['expertise','expertise.html','Expertise'],['articles','articles.html','Articles'],['contact','contact.html','Contact Us']];
  SITE.pageInits.push(() => {
    prog();

    /* 4. WORD-BY-WORD HEADINGS: wrap each word of every .display headline so CSS can animate it.
          (An accent-coloured .a part moves as ONE piece.) */
    $('.display').not('[data-split]').each(function(){
      let n = 0; const w = t => '<span class="w"><span style="--i:' + (n++) + '">' + t + '</span></span>';
      $(this).attr('data-split', 1).html($.map(this.childNodes, node =>
        node.nodeType === 3 ? node.textContent.split(/(\s+)/).map(p => /\S/.test(p) ? w(p) : ' ').join('') : w(node.outerHTML)).join(''));
    });

    /* 5. NEXT PAGE link at the bottom of each inner page (a gentle guided tour, like a story) */
    $('.next-page').remove();
    const here = document.body.dataset.page, i = order.findIndex(o => o[0] === here);
    if(i >= 0){
      const nx = order[i+1] || ['home','index.html','Back to the balance'];
      $('#main').append('<a class="next-page" href="' + nx[1] + '"><small>Next</small><b>' + nx[2] + ' ' + SITE.icon('arrow') + '</b></a>');
    }
  });
});
