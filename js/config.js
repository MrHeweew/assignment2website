/* ==========================================================
   config.js  (loaded FIRST)
   The one place to tweak the 3D experience.
   ========================================================== */
window.SITE = {
  // Your Sketchfab model: "Balance Scale" by Jean-Francois Bonin (CC-BY 4.0).
  // If the file is missing, a built-in copper scales is used so the site never breaks.
  modelPath: 'models/balance_scale.glb',
  modelHeight: 5,        // model is auto-resized to this height

  /* HOTSPOTS = the 3 clickable points on the balance.
     part : which PART of the model the dot sticks to. scene.js finds these parts
            by name inside the 3D file and measures them, so the dots land exactly
            on the object:  'top' = the figure on top, 'left' / 'right' = the two pans.
     x, y : only a FALLBACK (used if the parts can't be found, e.g. a different model).
            x: -0.5 (far left) .. +0.5 (far right),  y: 0 (bottom) .. 1 (top) */
  hotspots: [
    { label: 'Meet the Lawyer', href: 'meet.html',      page: 'meet',      part: 'top',   x:  0.00, y: 0.95 },
    { label: 'Expertise',       href: 'expertise.html', page: 'expertise', part: 'left',  x: -0.33, y: 0.30 },
    { label: 'Articles',        href: 'articles.html',  page: 'articles',  part: 'right', x:  0.33, y: 0.30 }
  ],

  /* ICONS: every icon on the site is an inline SVG drawn here (no emoji, no icon fonts).
     Use  SITE.icon('arrow')  anywhere in JS; the HTML pages contain the same markup. */
  icons: {
    'arrow':     '<path d="M4 12h15M13 6l6 6-6 6"/>',
    'sound-on':  '<path d="M4 9.5v5h4l5 4v-13l-5 4H4z"/><path d="M16.5 9a4.5 4.5 0 010 6M19.2 6.5a8.3 8.3 0 010 11"/>',
    'sound-off': '<path d="M4 9.5v5h4l5 4v-13l-5 4H4z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/>',
    'moon':      '<path d="M20 14.2A8 8 0 019.8 4 8 8 0 1020 14.2z"/>',
    'sun':       '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    'menu':      '<path d="M4 8h16M4 16h16"/>',
    'close':     '<path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/>',
    'phone':     '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
    'mail':      '<rect x="3" y="5" width="18" height="14"/><path d="M3 7l9 6 9-6"/>',
    'pin':       '<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    'check':     '<path d="M5 12.5l4.5 4.5L19 7.5"/>'
  },
  icon(name) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + this.icons[name] + '</svg>'; },

  /* Page setup functions. Because pages now load WITHOUT a full reload (so the music
     never stops), anything a page needs on arrival is registered here and re-run
     after every page change:  SITE.pageInits.push(function(){ ... }) */
  pageInits: [],
  runInits() { this.pageInits.forEach(f => f()); }
};
