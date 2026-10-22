/* ==========================================================
   scene.js
   Builds the 3D world with Three.js:
   renderer -> lights -> model (GLB or fallback) -> animation loop.
   Scrolling orbits/zooms the camera, like igloo.inc.
   ========================================================== */
(function(){
  const cv = document.getElementById('scene');
  if(!cv || !window.THREE) return;

  const cfg    = window.SITE;
  const isHome = () => document.body.dataset.page === 'home';   // checked live: pages change without reloading
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---- 1. Renderer, scene, camera ---- */
  const renderer = new THREE.WebGLRenderer({canvas:cv, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 100);
  camera.position.set(0, 0.5, 13);

  /* ---- 2. Lights (white key light + blue rim light) ---- */
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8aa0c8, 1.0));
  const key = new THREE.PointLight(0xffffff, 2.4, 80); key.position.set(5, 6, 9);  scene.add(key);
  const rim = new THREE.PointLight(0x4a7bff, 2.0, 80); rim.position.set(-8, 3, 4); scene.add(rim);

  /* Reflections: metal only looks like metal if it has something to reflect.
     We build a tiny 'studio' of bright panels and bake it into an environment map. */
  const studio = new THREE.Scene();
  [[0xffffff,0,8,6,10,3],[0x6f9bff,-10,2,0,3,8],[0xe8eefc,10,4,-4,3,6],[0x9fb2d6,0,-6,4,12,2]].forEach(([c,x,y,z,w,h]) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({color:c, side:THREE.DoubleSide}));
    p.position.set(x,y,z); p.lookAt(0,0,0); studio.add(p);
  });
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studio).texture;

  /* ---- 3. 'rig' holds the model so we can move/rotate it as one ---- */
  const rig = new THREE.Group(); scene.add(rig);
  const model = new THREE.Group(); rig.add(model);   // model sits centred inside rig
  let beam = null, pans = [];                        // only used by the fallback model

  /* Load the Sketchfab GLB. On failure -> build the fallback. */
  const loaderEl = document.getElementById('loader'), fill = loaderEl && loaderEl.querySelector('i');
  const finish = () => {
    if(!loaderEl) return;
    let seen = false; try { seen = sessionStorage.entered === '1'; } catch(e){}
    if(seen) setTimeout(() => loaderEl.classList.add('done'), 300);   // already chose this visit
    else loaderEl.classList.add('ready');                              // show "Enter with/without sound"
  };
  /* Loading order:  1) the .glb file (needs Live Server / a web server)
                     2) the same model embedded as text (works when you double-click index.html)
                     3) the simple built-in scales (last resort) */
  const useGltf  = g => { model.add(g.scene); polish(g.scene); fit(); finish(); };
  const fallback = () => { console.info('Model not available, using built-in scales'); buildFallback(); fit(); finish(); };
  function loadEmbedded(){
    console.info('Loading the embedded copy of the model (opened without a web server)');
    if(fill) fill.style.width = '100%';
    const pc = loaderEl && loaderEl.querySelector('.pct'); if(pc) pc.textContent = 'Loading…';
    const sc = document.createElement('script'); sc.src = cfg.modelPath + '.js';     // models/balance_scale.glb.js
    sc.onload = () => { try{
        const bin = atob(window.SITE_MODEL_B64), buf = new Uint8Array(bin.length);
        for(let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        window.SITE_MODEL_B64 = null;                                               // free the memory
        new THREE.GLTFLoader().parse(buf.buffer, '', useGltf, fallback);
      } catch(e){ fallback(); } };
    sc.onerror = fallback;
    document.head.appendChild(sc);
  }
  if(THREE.GLTFLoader && location.protocol === 'file:') loadEmbedded();      // no web server: skip the blocked request
  else if(THREE.GLTFLoader){
    new THREE.GLTFLoader().load(cfg.modelPath, useGltf,
      e => { if(e.total){ const p = Math.round(e.loaded/e.total*100); if(fill) fill.style.width = p+'%'; const pc = loaderEl && loaderEl.querySelector('.pct'); if(pc) pc.textContent = p+'%'; } },
      loadEmbedded);                                                                // .glb blocked -> try embedded copy
  } else fallback();

  /* The downloaded model has a flat, non-metal bronze material. Keep its shape
     but recolour it to polished steel to match the blue/grey palette. */
  function polish(obj){
    obj.traverse(o => { if(o.isMesh){
      o.material.color.set(0x8fa3c4);  // steel blue-grey tint (original was pinkish bronze)
      o.material.metalness = .9;       // 0 = plastic, 1 = pure metal
      o.material.roughness = .3;       // lower = more mirror-like
      o.material.envMapIntensity = 1.2;
      o.material.needsUpdate = true;
    }});
  }

  /* Centre the model at (0,0,0) and scale it to cfg.modelHeight.
     Also store its size so hotspots can be placed relative to it. */
  function fit(){
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const s = cfg.modelHeight / size.y;
    model.scale.setScalar(s);
    model.position.set(-c.x*s, -c.y*s, -c.z*s);
    cfg.bounds = { w: size.x*s, h: size.y*s, d: size.z*s };
    findAnchors();                                     // measure the parts the dots stick to
    setTimeout(() => resize(), 0);                    // re-fit now that we know the model's size
  }

  /* Find the real positions of the figure on top and the two pans, by reading the
     3D file's own parts (they have names like 'Circle.001'). Positions are stored
     relative to the model, so they follow it as it moves, turns and scales. */
  function findAnchors(){
    model.updateMatrixWorld(true); rig.updateMatrixWorld(true);
    const inv  = new THREE.Matrix4().copy(rig.matrixWorld).invert();
    const norm = s => s.replace(/[^a-z0-9]/gi,'').toLowerCase();            // 'Circle.001' -> 'circle001'
    const pts  = key => { const out = [];                                    // all vertices of the part
      model.traverse(o => { if(!o.isMesh || !(norm(o.name).includes(key) || (o.parent && norm(o.parent.name).includes(key)))) return;
        const a = o.geometry.attributes.position, step = Math.max(1, Math.floor(a.count/3000)), v = new THREE.Vector3();
        for(let i = 0; i < a.count; i += step){ v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).applyMatrix4(inv); out.push(v.clone()); } });
      return out; };
    const centre = p => new THREE.Box3().setFromPoints(p).getCenter(new THREE.Vector3());
    const column = pts('cylinderbronze0'), top = pts('cylinder003'), pans = pts('circle001');
    if(!column.length || !top.length || !pans.length){ console.info('Parts not found: using fallback dot positions'); return; }
    const cx = centre(column).x;                                             // x of the centre column
    cfg.anchors = { top: centre(top),
                    left:  centre(pans.filter(p => p.x <  cx)),              // pans = left / right of the column
                    right: centre(pans.filter(p => p.x >= cx)) };
  }

  /* Simple copper scales made from basic shapes (safety net). */
  function buildFallback(){
    const cu = new THREE.MeshStandardMaterial({color:0x8fa3c4, metalness:.85, roughness:.3});
    const add = (geo,x,y,z,p) => { const m = new THREE.Mesh(geo,cu); m.position.set(x,y,z); (p||model).add(m); return m; };
    add(new THREE.CylinderGeometry(.9,1.15,.35,40), 0,-2.2,0);
    add(new THREE.CylinderGeometry(.14,.2,3.6,24),  0,-.3,0);
    add(new THREE.ConeGeometry(.1,.7,16),           0,2.1,0);
    beam = new THREE.Group(); beam.position.y = 1.6; model.add(beam);
    add(new THREE.SphereGeometry(.24,24,24), 0,0,0,beam);
    add(new THREE.CylinderGeometry(.07,.07,5.2,16), 0,0,0,beam).rotation.z = Math.PI/2;
    pans = [-2.6, 2.6].map(x => {
      const p = new THREE.Group(); p.position.x = x; beam.add(p);
      add(new THREE.CylinderGeometry(1,.7,.12,40), 0,-1.9,0,p);
      const lm = new THREE.LineBasicMaterial({color:0x6f86b3});
      [[-.9,0],[.9,0],[0,.9],[0,-.9]].forEach(([a,b]) => p.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(a,-1.9,b)]), lm)));
      return p;
    });
  }

  /* Floating copper dust for atmosphere */
  const pa = new Float32Array(240*3).map(() => (Math.random()-.5)*30);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pa,3));
  const dust = new THREE.Points(pg, new THREE.PointsMaterial({color:0x5f7fd0, size:.05, transparent:true, opacity:.6}));
  scene.add(dust);

  /* ---- 4. Inputs: mouse parallax + scroll progress ---- */
  let mx = 0, my = 0, sp = 0, flying = false, t = 0, mob = false;
  addEventListener('pointermove', e => { mx = e.clientX/innerWidth-.5; my = e.clientY/innerHeight-.5; });
  addEventListener('scroll', () => {                // sp = 0..1 over the first screens of the page
    sp = Math.min(1, scrollY / Math.max(1, innerHeight*1.8));
  });

  /* ---- 5. Where should the balance be? ----
     HOME:        big, centred, fixed (scroll orbits it).
     OTHER PAGES: it sits inside the #slot area at the top of the page, sized to fit
                  that box, and scrolls away with the page. It is the site navigator.
     Every frame we measure the target and the balance glides there. */
  const target = {sc:1, x:0, y:0, slot:null}; let placed = false, headerH = 72;
  function resize(){ renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  function aim(){
    const w = innerWidth, h = innerHeight, b = cfg.bounds; mob = w < 820;
    if(!b) return;
    const visH = 2*Math.tan(camera.fov*Math.PI/360)*13, visW = visH*camera.aspect;   // what the camera sees at the model's depth
    const hd = document.querySelector('header'); headerH = hd ? hd.offsetHeight : 72;
    if(isHome()){ target.slot = null; target.sc = Math.min(1.15, visW*.78/b.w); target.x = 0; target.y = mob ? .2 : 0; return; }
    const slot = document.getElementById('slot'); target.slot = slot ? slot.getBoundingClientRect() : null;
    const r = target.slot; if(!r) return;
    target.sc = Math.min((r.height*.92/h*visH)/b.h, (Math.min(r.width,820)*.72/w*visW)/b.w);   // fit inside the slot
    target.x  = ((r.left + r.width/2)/w - .5)*visW;                                           // pixel -> 3D units
    target.y  = camera.position.y - ((r.top + r.height/2)/h - .5)*visH;
  }

  /* ---- 6. Public helpers used by hotspots.js / nav.js ---- */
  SITE.flyIn  = () => { flying = true; };           // camera dives into the model
  SITE.flyOut = () => { flying = false; };          // ...and comes back after the page changed
  SITE.frameCallbacks = [];                         // functions run every frame
  SITE.project = hs => {                            // 3D anchor -> screen pixels (+ is it usable?)
    const a = cfg.anchors && cfg.anchors[hs.part];
    const v = a ? a.clone() : (cfg.bounds ? new THREE.Vector3(hs.x*cfg.bounds.w, (hs.y-.5)*cfg.bounds.h, 0) : null);
    if(!v) return null;
    rig.localToWorld(v); v.project(camera);
    const x = (v.x*.5+.5)*innerWidth, y = (-v.y*.5+.5)*innerHeight, r = target.slot;
    // On inner pages a dot only counts while the slot is on screen and not hidden by the header
    const visible = isHome() || (!!r && r.bottom > headerH+20 && r.top < innerHeight-20 && y > headerH+8 && y < innerHeight-8);
    return { x, y, visible, facing: Math.abs(rig.rotation.y) < .9 };
  };

  /* ---- 7. Animation loop ---- */
  function loop(){
    requestAnimationFrame(loop);
    if(!reduce) t += .01;
    aim();
    const home = isHome();
    rig.visible = home || !!target.slot;
    if(cfg.bounds && !placed){ placed = true; rig.scale.setScalar(target.sc); rig.position.set(target.x, target.y, 0); }   // first frame: no gliding
    const k = home ? .05 : .2;                                              // inner pages track the scroll faster
    rig.scale.setScalar(rig.scale.x + (target.sc - rig.scale.x)*k);
    rig.position.x += (target.x - rig.position.x)*k;
    rig.position.y += (target.y + (reduce ? 0 : Math.sin(t)*(home ? .12 : .03)) - rig.position.y)*k;   // gentle float
    // HOME: scroll drives a slow orbit and a zoom. OTHER PAGES: a calm sway.
    const orbit = home ? Math.sin(sp*Math.PI*2)*.7 : Math.sin(t*.5)*.3;
    const zoom  = flying ? 5 : (home ? 13 - Math.sin(sp*Math.PI)*(mob ? 0 : 4) : 13);   // no zoom-in on phones (it would crop the model)
    camera.position.z += (zoom - camera.position.z) * (flying ? .06 : .05);
    rig.rotation.y += (orbit + mx*.5 + (SITE.lean||0) - rig.rotation.y) * .05;   // SITE.lean turns the balance toward a hovered dot
    rig.rotation.x += (my*.2 - rig.rotation.x) * .05;
    if(beam){                                                              // fallback scales balance
      beam.rotation.z = Math.sin(t*1.2)*.07;
      pans.forEach(p => p.rotation.z = -beam.rotation.z);
      pans[0].position.y = -beam.rotation.z*2.6; pans[1].position.y = beam.rotation.z*2.6;
    }
    dust.rotation.y = t*.05;
    SITE.frameCallbacks.forEach(f => f());
    renderer.render(scene, camera);
  }
  loop();
})();
