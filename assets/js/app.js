/* ============ APP BOOTSTRAP ============
   Carica i dati (JSON con versioning) e poi avvia il sito. */
window.__INGLY_ESM__ = true;
import { loadData } from './data-loader.js';
loadData().then(()=>import('./main.js')).catch(err=>{
  console.error(err);
  const l=document.getElementById('loader');
  if(l) l.innerHTML='<div class="lin"><span style="font-family:sans-serif;color:#9aa3c7;max-width:420px;text-align:center;line-height:1.6">⚠️ Impossibile caricare i dati del sito.<br>'+ (err&&err.message||'') +'</span></div>';
});
