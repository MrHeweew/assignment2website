/* ==========================================================
   sound.js
   Ambient music + sound effects, all SYNTHESISED with the Web
   Audio API. That means: no audio files, no backend, no downloads.

   Browsers block audio until the visitor interacts, so sound
   starts from a click ("Enter with sound" or the speaker button).
   The choice is remembered in localStorage.

   Other files call:  SITE.sfx.hover() / tick() / click() /
                      whoosh() / success() / error()
   ========================================================== */
(function(){
  let ctx, music, sfxBus, on = false;
  try { on = localStorage.sound === 'on'; } catch(e){}

  /* Create the audio engine (only once, after a user gesture) */
  function init(){
    if(ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    music = ctx.createGain(); music.gain.value = 0; music.connect(ctx.destination);   // ambient volume
    sfxBus = ctx.createGain(); sfxBus.gain.value = .0; sfxBus.connect(ctx.destination); // effects volume
    pad();
  }

  /* AMBIENT PAD: a soft, slowly breathing chord (A minor add9 feel).
     Each note = two slightly detuned oscillators; a low-pass filter
     is slowly opened and closed by an LFO so the sound "breathes". */
  function pad(){
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650; lp.connect(music);
    const lfo = ctx.createOscillator(), depth = ctx.createGain();
    lfo.frequency.value = .07; depth.gain.value = 280; lfo.connect(depth); depth.connect(lp.frequency); lfo.start();
    [110, 164.81, 220, 261.63, 329.63].forEach((hz, i) => [-5, 5].forEach(det => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = hz; o.detune.value = det;
      g.gain.value = .045; o.connect(g); g.connect(lp); o.start();
    }));
  }

  /* One short synthesized note: frequency, length, wave, volume, optional pitch slide */
  function tone(f, len, type, vol, slideTo){
    if(!on || !ctx) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + len);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + len);
    o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + len + .05);
  }

  /* Whoosh: filtered noise sweeping upward (used when diving into a page) */
  function whoosh(){
    if(!on || !ctx) return;
    const t = ctx.currentTime, len = .9, n = ctx.createBuffer(1, ctx.sampleRate*len, ctx.sampleRate);
    const d = n.getChannelData(0); for(let i = 0; i < d.length; i++) d[i] = Math.random()*2-1;
    const s = ctx.createBufferSource(); s.buffer = n;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3500, t + len);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.5, t + .35); g.gain.linearRampToValueAtTime(0, t + len);
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t);
  }

  /* The sound effects other files can use */
  window.SITE.sfx = {
    tick:    () => tone(1400, .05, 'sine', .08),                       // tiny hover tick
    hover:   () => { tone(660, .25, 'sine', .14); tone(990, .3, 'sine', .07); }, // soft chime on a hotspot
    click:   () => tone(520, .12, 'triangle', .18, 300),                // button press
    whoosh,
    success: () => [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, .5, 'sine', .16), i*110)), // rising arpeggio
    error:   () => tone(180, .3, 'sawtooth', .08, 120)                  // low buzz
  };

  /* Turn sound on/off (with a gentle fade) and update the speaker button */
  function set(v){
    on = v; try { localStorage.sound = v ? 'on' : 'off'; } catch(e){}
    if(v){ init(); ctx.resume(); }
    if(ctx){
      music.gain.setTargetAtTime(v ? .55 : 0, ctx.currentTime, .6);
      sfxBus.gain.setTargetAtTime(v ? .8 : 0, ctx.currentTime, .05);
    }
    const b = document.getElementById('sound');
    if(b){ b.innerHTML = SITE.icon(v ? 'sound-on' : 'sound-off'); /* speaker icon (SVG) */ b.setAttribute('aria-pressed', v); b.setAttribute('aria-label', v ? 'Mute sound' : 'Turn sound on'); }
  }
  window.SITE.sound = { set, toggle: () => set(!on), isOn: () => on, refresh: () => set(on) };

  /* If the visitor chose sound earlier, resume it on their first interaction on this page */
  if(on){
    const resume = () => { set(true); ['pointerdown','keydown'].forEach(e => removeEventListener(e, resume)); };
    ['pointerdown','keydown'].forEach(e => addEventListener(e, resume));
  }

  /* Loading-screen buttons: they unlock audio AND close the loader */
  document.addEventListener('click', e => {
    const id = e.target.id;
    if(id !== 'enter-sound' && id !== 'enter-silent') return;
    set(id === 'enter-sound'); if(on) window.SITE.sfx.success();
    try { sessionStorage.entered = '1'; } catch(err){}
    document.getElementById('loader').classList.add('done');
  });
})();
