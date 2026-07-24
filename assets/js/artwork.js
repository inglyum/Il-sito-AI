/* ============================================================
   INGLY ARTWORK ENGINE
   Genera sfondi vettoriali (SVG) a partire dalla palette di un tema.
   Nessuna immagine da caricare: pochi KB, nitidi a qualsiasi dimensione,
   coerenti col brand perché costruiti sui colori del tema stesso.
   Usato sia dal sito sia dall'Admin (unica fonte).
   ============================================================ */
(function (root) {
  'use strict';

  /* generatore pseudo-casuale deterministico: stesso seed → stesso disegno */
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
  }
  function hash(str) { let h = 2166136261; for (let i = 0; i < String(str).length; i++) { h ^= String(str).charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }

  const W = 1600, H = 1000;
  const P = (pal, i, fb) => (pal && pal[i]) || fb;

  /* ---------- i 15 stili ---------- */
  const PATTERNS = {
    aurora: { n: { it: 'Aurora', en: 'Aurora' }, d: (p, r) => {
      let o = '';
      for (let i = 0; i < 5; i++) {
        const cx = r() * W, cy = r() * H, rx = 260 + r() * 420, c = i % 2 ? P(p, 2, '#FACC15') : P(p, 1, '#1E3A8A');
        o += `<ellipse cx="${cx | 0}" cy="${cy | 0}" rx="${rx | 0}" ry="${(rx * .7) | 0}" fill="${c}" opacity="${(.10 + r() * .16).toFixed(2)}" filter="url(#b)"/>`;
      } return o } },

    laser: { n: { it: 'Raggio laser', en: 'Laser beam' }, d: (p, r) => {
      const a = P(p, 2, '#FACC15');
      let o = `<path d="M${W * .95} 0 L${W} 0 L${W * .28} ${H} L${W * .16} ${H}Z" fill="${a}" opacity=".13" filter="url(#b)"/>
      <path d="M${W * .9} 0 L${W * .93} 0 L${W * .3} ${H} L${W * .26} ${H}Z" fill="${a}" opacity=".3"/>`;
      for (let i = 0; i < 26; i++) { const t = r(); o += `<circle cx="${(W * .92 - t * W * .62 + (r() - .5) * 90) | 0}" cy="${(t * H) | 0}" r="${(1 + r() * 3.2).toFixed(1)}" fill="${a}" opacity="${(.25 + r() * .6).toFixed(2)}"/>` }
      return o } },

    grid: { n: { it: 'Griglia tecnica', en: 'Technical grid' }, d: (p, r) => {
      const a = P(p, 2, '#FACC15'), b = P(p, 1, '#1E3A8A');
      let o = `<g stroke="${b}" stroke-width="1" opacity=".33">`;
      for (let x = 0; x <= W; x += 64) o += `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`;
      for (let y = 0; y <= H; y += 64) o += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
      o += '</g>';
      for (let i = 0; i < 7; i++) o += `<circle cx="${(r() * W) | 0}" cy="${(r() * H) | 0}" r="${(3 + r() * 4) | 0}" fill="${a}" opacity="${(.4 + r() * .5).toFixed(2)}"/>`;
      o += `<ellipse cx="${W * .74}" cy="${H * .3}" rx="420" ry="300" fill="${a}" opacity=".1" filter="url(#b)"/>`;
      return o } },

    bokeh: { n: { it: 'Luci sfocate', en: 'Bokeh lights' }, d: (p, r) => {
      let o = ''; const a = P(p, 2, '#FACC15');
      for (let i = 0; i < 22; i++) { const rr = 12 + r() * 70; o += `<circle cx="${(r() * W) | 0}" cy="${(r() * H) | 0}" r="${rr | 0}" fill="${a}" opacity="${(.06 + r() * .2).toFixed(2)}" filter="url(#b2)"/>` }
      return o } },

    waves: { n: { it: 'Onde', en: 'Waves' }, d: (p, r) => {
      let o = ''; const cols = [P(p, 1, '#1E3A8A'), P(p, 2, '#FACC15')];
      for (let i = 0; i < 6; i++) {
        const y = H * (.25 + i * .13), amp = 40 + r() * 70, c = cols[i % 2];
        o += `<path d="M0 ${y | 0} C ${W * .25} ${(y - amp) | 0}, ${W * .5} ${(y + amp) | 0}, ${W} ${(y - amp * .4) | 0}" stroke="${c}" stroke-width="${(1.2 + r() * 2.4).toFixed(1)}" fill="none" opacity="${(.16 + r() * .3).toFixed(2)}"/>`;
      } return o } },

    topo: { n: { it: 'Curve di livello', en: 'Topographic' }, d: (p, r) => {
      let o = ''; const a = P(p, 1, '#1E3A8A');
      for (let i = 0; i < 13; i++) {
        const rx = 90 + i * 78, cx = W * .72, cy = H * .48;
        o += `<ellipse cx="${cx}" cy="${cy}" rx="${rx | 0}" ry="${(rx * .62) | 0}" fill="none" stroke="${i % 4 === 0 ? P(p, 2, '#FACC15') : a}" stroke-width="${i % 4 === 0 ? 1.8 : 1}" opacity="${(.4 - i * .022).toFixed(2)}"/>`;
      } return o } },

    rays: { n: { it: 'Raggi', en: 'Rays' }, d: (p, r) => {
      let o = ''; const a = P(p, 2, '#FACC15'), ox = W * .88, oy = -60;
      for (let i = 0; i < 16; i++) { const ang = (-15 + i * 8) * Math.PI / 180, L = 1500;
        o += `<path d="M${ox} ${oy} L${(ox + Math.cos(ang + 1.6) * L) | 0} ${(oy + Math.sin(ang + 1.6) * L) | 0} L${(ox + Math.cos(ang + 1.66) * L) | 0} ${(oy + Math.sin(ang + 1.66) * L) | 0}Z" fill="${a}" opacity="${(.03 + r() * .07).toFixed(3)}"/>` }
      o += `<circle cx="${ox}" cy="${oy}" r="320" fill="${a}" opacity=".16" filter="url(#b)"/>`;
      return o } },

    particles: { n: { it: 'Particelle', en: 'Particles' }, d: (p, r) => {
      let o = ''; const a = P(p, 2, '#FACC15'), b = P(p, 1, '#1E3A8A');
      for (let i = 0; i < 90; i++) o += `<circle cx="${(r() * W) | 0}" cy="${(r() * H) | 0}" r="${(.8 + r() * 2.6).toFixed(1)}" fill="${r() > .3 ? b : a}" opacity="${(.2 + r() * .6).toFixed(2)}"/>`;
      o += `<ellipse cx="${W * .8}" cy="${H * .25}" rx="380" ry="260" fill="${b}" opacity=".2" filter="url(#b)"/>`;
      return o } },

    marble: { n: { it: 'Marmo', en: 'Marble' }, d: (p, r) => {
      let o = ''; const a = P(p, 2, '#FACC15');
      for (let i = 0; i < 9; i++) {
        const y = r() * H;
        o += `<path d="M0 ${y | 0} C ${W * .3} ${(y + (r() - .5) * 260) | 0}, ${W * .65} ${(y + (r() - .5) * 260) | 0}, ${W} ${(y + (r() - .5) * 180) | 0}" stroke="${a}" stroke-width="${(.6 + r() * 2).toFixed(1)}" fill="none" opacity="${(.12 + r() * .22).toFixed(2)}"/>`;
      } return o } },

    circuit: { n: { it: 'Circuito', en: 'Circuit' }, d: (p, r) => {
      let o = `<g stroke="${P(p, 1, '#1E3A8A')}" stroke-width="1.6" fill="none" opacity=".5">`;
      for (let i = 0; i < 16; i++) {
        let x = (r() * W) | 0, y = (r() * H) | 0, d = `M${x} ${y}`;
        for (let s = 0; s < 4; s++) { const len = 60 + r() * 190; if (r() > .5) { x += r() > .5 ? len : -len } else { y += r() > .5 ? len : -len } d += ` L${x | 0} ${y | 0}` }
        o += `<path d="${d}"/>`;
      }
      o += '</g>';
      for (let i = 0; i < 12; i++) o += `<circle cx="${(r() * W) | 0}" cy="${(r() * H) | 0}" r="3.4" fill="${P(p, 2, '#FACC15')}" opacity=".75"/>`;
      return o } },

    snow: { n: { it: 'Neve', en: 'Snow' }, d: (p, r) => {
      let o = ''; const a = P(p, 2, '#E6EEF8');
      for (let i = 0; i < 70; i++) { const s = 2 + r() * 6; o += `<circle cx="${(r() * W) | 0}" cy="${(r() * H) | 0}" r="${s.toFixed(1)}" fill="${a}" opacity="${(.15 + r() * .5).toFixed(2)}"/>` }
      o += `<ellipse cx="${W * .78}" cy="${H * .2}" rx="400" ry="280" fill="${a}" opacity=".08" filter="url(#b)"/>`;
      return o } },

    confetti: { n: { it: 'Coriandoli', en: 'Confetti' }, d: (p, r) => {
      let o = ''; const cs = [P(p, 1, '#1E3A8A'), P(p, 2, '#FACC15'), '#ffffff'];
      for (let i = 0; i < 55; i++) { const x = (r() * W) | 0, y = (r() * H) | 0, w = 6 + r() * 16, h = 4 + r() * 9;
        o += `<rect x="${x}" y="${y}" width="${w | 0}" height="${h | 0}" rx="2" fill="${cs[(r() * 3) | 0]}" opacity="${(.3 + r() * .55).toFixed(2)}" transform="rotate(${(r() * 360) | 0} ${x} ${y})"/>` }
      return o } },

    mesh: { n: { it: 'Sfumatura morbida', en: 'Soft mesh' }, d: (p, r) => {
      let o = ''; const cs = [P(p, 1, '#1E3A8A'), P(p, 2, '#FACC15'), P(p, 0, '#111827')];
      for (let i = 0; i < 4; i++) o += `<ellipse cx="${(r() * W) | 0}" cy="${(r() * H) | 0}" rx="${(400 + r() * 380) | 0}" ry="${(340 + r() * 300) | 0}" fill="${cs[i % 3]}" opacity="${(.2 + r() * .22).toFixed(2)}" filter="url(#b)"/>`;
      return o } },

    arcs: { n: { it: 'Archi', en: 'Arcs' }, d: (p, r) => {
      let o = ''; const a = P(p, 2, '#FACC15'), b = P(p, 1, '#1E3A8A');
      for (let i = 0; i < 8; i++) { const rr = 140 + i * 105;
        o += `<circle cx="${W * .84}" cy="${H * .74}" r="${rr}" fill="none" stroke="${i % 3 === 0 ? a : b}" stroke-width="${i % 3 === 0 ? 2.2 : 1.2}" opacity="${(.42 - i * .04).toFixed(2)}" stroke-dasharray="${i % 2 ? '18 14' : ''}"/>` }
      return o } },

    beams: { n: { it: 'Fasci di luce', en: 'Light beams' }, d: (p, r) => {
      let o = ''; const a = P(p, 2, '#FACC15');
      for (let i = 0; i < 6; i++) { const x = W * (.35 + i * .13), w = 40 + r() * 120;
        o += `<path d="M${x | 0} -50 L${(x + w) | 0} -50 L${(x + w - 220) | 0} ${H + 50} L${(x - 220) | 0} ${H + 50}Z" fill="${a}" opacity="${(.04 + r() * .07).toFixed(3)}" filter="url(#b2)"/>` }
      return o } }
  };

  const LIST = Object.keys(PATTERNS);

  /* ---------- costruzione dell'SVG ---------- */
  function svg(pattern, palette, seed) {
    const pat = PATTERNS[pattern] || PATTERNS.aurora;
    const r = rng(typeof seed === 'number' ? seed : hash(seed || pattern));
    const c0 = P(palette, 0, '#111827'), c1 = P(palette, 1, '#1E3A8A');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">`
      + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
      + `<stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></linearGradient>`
      + `<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="90"/></filter>`
      + `<filter id="b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="26"/></filter></defs>`
      + `<rect width="${W}" height="${H}" fill="url(#g)"/>`
      + pat.d(palette || [], r)
      + `<rect width="${W}" height="${H}" fill="url(#g)" opacity=".18"/>`
      + `</svg>`;
  }

  function dataUri(pattern, palette, seed) {
    return 'data:image/svg+xml,' + encodeURIComponent(svg(pattern, palette, seed))
      .replace(/'/g, '%27').replace(/"/g, '%22');
  }

  root.INGLY_ART = {
    patterns: LIST,
    label: k => (PATTERNS[k] || {}).n || { it: k, en: k },
    svg: svg,
    dataUri: dataUri,
    /* apici SINGOLI: il valore finisce dentro style="..." e le doppie troncherebbero l'attributo.
       dataUri() codifica già ogni apice singolo come %27, quindi la delimitazione è sicura. */
    css: (pattern, palette, seed) => `url('${dataUri(pattern, palette, seed)}')`
  };
})(typeof window !== 'undefined' ? window : globalThis);
