/* ============ UTILS (modulo) ============
   Helper condivisi: lingua, traduzioni, prezzi, toast, foto prodotto. */
const { D, CONFIG } = window.INGLY;

export let L = 'it';
export function setL(v){ L = v }

export const $ = id => document.getElementById(id);
export const T = k => D[L][k] || k;
export const eur = n => '€' + n.toFixed(2).replace('.', L==='it' ? ',' : '.');
export const imgV = src => src + (src.includes('?') ? '' : '?v=' + ((window.INGLY && window.INGLY.__v) || 0));
/* srcset: usato solo per le immagini che hanno davvero le varianti (elenco MV) */
/* MV è una mappa percorso → larghezze realmente presenti nel repository, es. {"img/1.webp":[400,800]}.
   Se una variante non esiste NON deve finire nel srcset: il browser la sceglierebbe e otterrebbe un 404,
   lasciando l'immagine vuota. Il vecchio formato ad array viene ignorato di proposito. */
export const variantsOf = src => {
  const mv = window.INGLY && window.INGLY.MV;
  if (!mv || Array.isArray(mv) || typeof mv !== 'object') return [];
  const w = mv[src];
  return Array.isArray(w) ? w.filter(x => x === 400 || x === 800) : [];
};
export const hasVariants = src => variantsOf(src).length > 0;
export const srcsetFor = src => {
  const ws = variantsOf(src);
  if (!ws.length) return '';
  const parts = ws.map(w => `${imgV(src.replace(/\.webp$/, '-' + w + '.webp'))} ${w}w`);
  parts.push(`${imgV(src)} 1600w`);
  return ` srcset="${parts.join(', ')}" sizes="(max-width:640px) 92vw, (max-width:1100px) 46vw, 30vw"`;
};
export const focalOf = src => { const f = window.INGLY && window.INGLY.FOCAL; const v = f && f[src];
  return v ? ` style="object-position:${v}"` : ''; };
export const imgTag = x => { const s = x.img||CONFIG.cartellaImmagini+x.id+'.webp';
  return `<img class="pimgph" src="${imgV(s)}"${srcsetFor(s)}${focalOf(s)} alt="" loading="lazy">` };

let toastT;
export function toast(msg){
  $('toastMsg').textContent = msg;
  const t = $('toast'); t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(()=>t.classList.remove('on'), 2600);
}

/* ===== INGLY ICON SYSTEM =====
   icon('casa') → SVG vettoriale dello sprite. Se il nome non esiste si usa l'emoji di riserva. */
export const ICON_SET = ['home','shop','portfolio','digital','b2b','about','faq','quote','contact','cart','search','user',
 'casa','eventi','animali','accessori','aziendale','bambini','stagionale','digitale','custom','limited',
 'tecnologie','laser','uv','dtf','3d','incisione','taglio','stampa','legno','materiali','metallo',
 'instagram','whatsapp','check','truck','shield'];
export const icon = (name, fallback = '', cls = '') =>
  (name && ICON_SET.includes(name))
    ? `<svg class="ic-svg ${cls}" aria-hidden="true" focusable="false"><use href="assets/icons/ingly-icons.svg#ic-${name}"></use></svg>`
    : (fallback ? `<span class="ic-emoji ${cls}" aria-hidden="true">${fallback}</span>` : '');
