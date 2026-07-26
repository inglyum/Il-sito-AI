/* ============ REFERRAL SYSTEM ============
   Ogni utente ha un codice referral univoco (localStorage).
   URL condivisibile: ?ref=XXXXXX
   Al checkout WhatsApp il ref viene incluso nel messaggio.
   Nessun server necessario — tutto localStorage + WhatsApp. */
import { $, T, toast, L } from './utils.js';

const REF_MY_KEY  = 'ingly_ref_my';    /* mio codice */
const REF_FROM_KEY= 'ingly_ref_from';  /* chi mi ha referenziato */
const REF_STATS_KEY='ingly_ref_stats'; /* { clicks: n, orders: n } */

/* genera 6 caratteri alfanumerici maiuscoli */
function genCode(){
  return Math.random().toString(36).substring(2,8).toUpperCase();
}

/* restituisce (o crea) il mio codice referral */
export function myRef(){
  let c; try{ c=localStorage.getItem(REF_MY_KEY) }catch(e){}
  if(!c){ c=genCode(); try{ localStorage.setItem(REF_MY_KEY,c) }catch(e){} }
  return c;
}

/* URL condivisibile con il mio codice */
export function refUrl(){
  return location.origin + location.pathname + '?ref=' + myRef() + '#/shop';
}

/* stats referral */
export function refStats(){
  try{ return JSON.parse(localStorage.getItem(REF_STATS_KEY)||'{"clicks":0,"orders":0}') }catch(e){ return {clicks:0,orders:0} }
}
function bumpStat(key){
  const s=refStats(); s[key]=(s[key]||0)+1;
  try{ localStorage.setItem(REF_STATS_KEY,JSON.stringify(s)) }catch(e){}
}

/* chi mi ha referenziato (letto dall'URL) */
export function fromRef(){
  try{ return localStorage.getItem(REF_FROM_KEY)||'' }catch(e){ return '' }
}

/* init: legge ?ref= dall'URL e lo salva */
export function initReferral(){
  try{
    const sp=new URLSearchParams(location.search);
    const inbound=sp.get('ref');
    if(inbound && inbound!==myRef()){
      /* non auto-referral */
      if(!localStorage.getItem(REF_FROM_KEY)){
        localStorage.setItem(REF_FROM_KEY, inbound);
      }
      /* conta click per chi ha condiviso (best-effort, solo locale) */
      bumpStat('clicks');
    }
  }catch(e){}

  /* Inietta widget referral nella pagina dopo 2s */
  setTimeout(renderRefWidget, 2000);
}

/* piccolo widget share-link iniettato nel footer */
function renderRefWidget(){
  const ft=document.querySelector('footer .ft-inner, footer, #page-about');
  if(!ft || document.getElementById('ref-widget')) return;
  const div=document.createElement('div');
  div.id='ref-widget';
  div.className='ref-widget reveal in';
  div.innerHTML=`
    <div class="ref-inner">
      <span class="ref-icon">🎁</span>
      <div class="ref-body">
        <b>${L==='it'?'Invita un amico':'Refer a friend'}</b>
        <span>${L==='it'?'Condividi INGLY e ottieni vantaggi esclusivi':'Share INGLY and get exclusive perks'}</span>
      </div>
      <div class="ref-actions">
        <code class="ref-code">${myRef()}</code>
        <button class="btn btn-ghost ref-copy" id="refCopyBtn">${L==='it'?'Copia link':'Copy link'}</button>
      </div>
    </div>`;
  ft.insertAdjacentElement('beforebegin', div);
  document.getElementById('refCopyBtn').addEventListener('click', shareRef);
}

export function shareRef(){
  const url=refUrl();
  try{
    if(navigator.share){ navigator.share({title:'INGLY DESIGN',text:L==='it'?'Scopri INGLY!':'Discover INGLY!',url}); return }
    navigator.clipboard.writeText(url);
    toast(L==='it'?'Link referral copiato! 🎁':'Referral link copied! 🎁');
  }catch(e){ toast(url) }
  bumpStat('clicks');
}

/* stringa da aggiungere al messaggio WhatsApp (chiamata da products.js) */
export function refTag(){
  const from=fromRef();
  const my=myRef();
  let tag='';
  if(from) tag+=`\nRef: ${from}`;
  tag+=`\nCodice cliente: ${my}`;
  return tag;
}

/* chiamato dopo un ordine confermato */
export function onOrderPlaced(){
  bumpStat('orders');
}
