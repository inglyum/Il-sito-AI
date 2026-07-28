/* ============ REFERRAL SYSTEM ============
   Ogni utente ha un codice referral univoco (localStorage).
   URL condivisibile: ?ref=XXXXXX
   Al checkout WhatsApp il ref viene incluso nel messaggio.
   Nessun server necessario — tutto localStorage + WhatsApp. */
import { $, T, toast, L } from './utils.js';

const REF_MY_KEY  = 'ingly_ref_my';    /* mio codice */
const REF_FROM_KEY= 'ingly_ref_from';  /* chi mi ha referenziato */
const REF_STATS_KEY='ingly_ref_stats'; /* { clicks: n, orders: n } */

/* Impostazioni gestite dall'Admin (data/config.json → referral).
   Se la sezione manca, valgono questi valori: il comportamento resta identico
   a prima, quindi nessun sito esistente cambia da solo. */
const RCFG = () => Object.assign({
  attivo:true, prefisso:'', codiceFisso:'',
  titolo:{it:'Invita un amico',en:'Refer a friend'},
  sottotitolo:{it:'Condividi INGLY e ottieni vantaggi esclusivi',en:'Share INGLY and get exclusive perks'},
}, ((window.INGLY&&window.INGLY.CONFIG&&window.INGLY.CONFIG.referral)||{}));

/* genera 6 caratteri alfanumerici maiuscoli, con l'eventuale prefisso del brand
   (es. «INGLY-4XZK»): un codice riconoscibile si condivide più volentieri di
   una sigla casuale. */
function genCode(){
  const base=Math.random().toString(36).substring(2,8).toUpperCase();
  const p=String(RCFG().prefisso||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  return p ? p+'-'+base.slice(0,4) : base;
}

/* restituisce (o crea) il mio codice referral.
   ATTENZIONE: il codice è PER VISITATORE, non del negozio. Serve a distinguere
   chi ha invitato chi: un codice unico uguale per tutti renderebbe impossibile
   sapere da chi arriva un cliente. Per questo dall'Admin si sceglie il formato
   (prefisso), non il codice di ogni visitatore.
   «codiceFisso» esiste per il caso diverso di una campagna a codice unico. */
export function myRef(){
  const cfg=RCFG();
  const fisso=String(cfg.codiceFisso||'').trim().toUpperCase();
  if(fisso) return fisso;
  let c; try{ c=localStorage.getItem(REF_MY_KEY) }catch(e){}
  if(!c){ c=genCode(); try{ localStorage.setItem(REF_MY_KEY,c) }catch(e){} }
  return c;
}

/* URL condivisibile con il mio codice.
   Prima finiva con '#/shop': un residuo del vecchio router a cancelletto.
   Con gli indirizzi puliti quel frammento veniva ignorato e chi apriva il link
   arrivava sulla home invece che sul catalogo. */
export function refUrl(){
  const dir=location.pathname.replace(/[^/]*$/,'');   /* regge anche una sottocartella */
  return location.origin + dir + 'shop?ref=' + encodeURIComponent(myRef());
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
  if(RCFG().attivo===false) return;          /* disattivato dall'Admin */
  const ft=document.querySelector('footer .ft-inner, footer, #page-about');
  if(!ft || document.getElementById('ref-widget')) return;
  const div=document.createElement('div');
  div.id='ref-widget';
  div.className='ref-widget reveal in';
  div.innerHTML=`
    <div class="ref-inner">
      <span class="ref-icon">🎁</span>
      <div class="ref-body">
        <b>${(RCFG().titolo||{})[L]||(L==='it'?'Invita un amico':'Refer a friend')}</b>
        <span>${(RCFG().sottotitolo||{})[L]||''}</span>
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
