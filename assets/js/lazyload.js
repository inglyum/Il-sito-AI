/* ============ LAZYLOAD (modulo) ============
   Foto prodotto: loading="lazy" nativo (imgTag in utils) + fallback
   delegato: se una foto manca, l'elemento sparisce e resta il segnaposto. */
export function initLazy(){
  document.addEventListener('error',e=>{
    const t=e.target;
    if(!(t&&t.matches&&t.matches('img.pimgph')))return;
    if(t.src.endsWith('.webp')){ t.src=t.src.replace(/\.webp$/,'.jpg') }  // prova il JPG
    else t.remove();                                                        // poi resta il segnaposto
  },true);
  addEventListener('load',()=>document.querySelectorAll('img').forEach(i=>{i.decoding='async'}));
}
