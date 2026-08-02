/* ============ FORMS (modulo) ============
   Preventivo e newsletter: invio REALE via Formspree quando configurato
   nell'admin (Contatti → Moduli). Senza ID configurato mostrano un avviso. */
import { $, T, toast, L } from './utils.js';
import { fromRef, myRef } from './referral.js';
const { D, CONFIG } = window.INGLY;

export function renderUrg(){
  $('urgRow').innerHTML=D[L].urg.map((u,i)=>`<button type="button" class="pill ${i===0?'on':''}" data-action="pill">${u}</button>`).join('');
}

const endpoint = k => {
  const id=((CONFIG.moduli||{})[k]||'').trim();
  if(!id) return null;
  return id.startsWith('http') ? id : 'https://formspree.io/f/'+id;
};

async function send(form, key, okMsg, oggetto){
  const url=endpoint(key);
  if(!url){ toast(T('formsOff')); return }
  const btn=form.querySelector('button[type="submit"],button:not([type])');
  const label=btn?btn.textContent:'';
  if(btn){ btn.disabled=true; btn.textContent='…' }
  try{
    const data=new FormData(form);
    data.append('_subject', oggetto || 'INGLY — nuova richiesta dal sito');
    const r=await fetch(url,{method:'POST',body:data,headers:{Accept:'application/json'}});
    if(!r.ok) throw 0;
    toast(okMsg); form.reset();
  }catch(e){ toast(T('formsErr')) }
  if(btn){ btn.disabled=false; btn.textContent=label }
}

async function sendBrevo(email, segment=''){
  const b=CONFIG.brevo||{};
  if(!b.apiKey||!b.listId) return false;
  try{
    const payload={email,listIds:[+b.listId],updateEnabled:true};
    /* segmento opzionale via Brevo attributes */
    if(segment) payload.attributes={SEGMENT:segment};
    /* referral tracking */
    const ref=fromRef(); if(ref) payload.attributes={...payload.attributes||{},REF_BY:ref,REF_SELF:myRef()};
    const r=await fetch('https://api.brevo.com/v3/contacts',{method:'POST',
      headers:{'Content-Type':'application/json','api-key':b.apiKey},
      body:JSON.stringify(payload)});
    return r.ok||r.status===204;
  }catch(e){return false}
}

/* ===== PREVENTIVO: privato o azienda =====
   Un ristorante che chiede 200 menu QR e un privato che vuole una targa non
   compilano lo stesso modulo. Qui si cambia la faccia del form senza cambiare
   pagina, e — punto importante — i campi nascosti vengono DISATTIVATI:
   un campo con display:none resta comunque nel FormData e arriva vuoto nella
   mail, e resta raggiungibile con il tasto Tab da chi naviga da tastiera.
   Disattivandolo sparisce da entrambi. */
export function initModoPreventivo(form){
  const bottoni=document.querySelectorAll('[data-qmode]');
  if(!bottoni.length) return;

  const applica=modo=>{
    form.dataset.modo=modo;
    const tipo=form.querySelector('#qTipo');
    if(tipo) tipo.value = modo==='azienda' ? 'Azienda' : 'Privato';

    bottoni.forEach(b=>{
      const attivo=b.dataset.qmode===modo;
      b.classList.toggle('on',attivo);
      b.setAttribute('aria-selected',String(attivo));
    });
    /* campi fuori scena: né inviati né raggiungibili */
    form.querySelectorAll('.q-az, .q-priv').forEach(box=>{
      const suo = box.classList.contains(modo==='azienda' ? 'q-az' : 'q-priv');
      box.querySelectorAll('input,select,textarea').forEach(el=>{ el.disabled=!suo });
    });
    /* la ragione sociale è obbligatoria solo per le aziende */
    const rag=form.querySelector('#cri');
    if(rag) rag.required = modo==='azienda';
    try{ localStorage.setItem('ingly_qmodo',modo) }catch(e){}
  };

  bottoni.forEach(b=>b.addEventListener('click',()=>applica(b.dataset.qmode)));

  /* Chi arriva dai pulsanti della pagina Business è un'azienda. Il router usa
     pushState, che non emette popstate: intercettare il clic è più diretto —
     e più solido — che spiare l'indirizzo dopo il cambio pagina. */
  document.addEventListener('click',e=>{
    const el=e.target.closest && e.target.closest('[data-search]');
    if(el && /tipo=azienda/.test(el.dataset.search||'')) applica('azienda');
  });

  /* chi è già venuto come azienda lo ritrova come l'aveva lasciato */
  let iniziale='privato';
  try{ if(localStorage.getItem('ingly_qmodo')==='azienda') iniziale='azienda' }catch(e){}
  /* arrivando dalla pagina Business la richiesta è quasi certamente aziendale */
  if(/[?&]tipo=azienda\b/.test(location.search)) iniziale='azienda';
  applica(iniziale);
}

export function initForms(){
  document.querySelectorAll('form.nform').forEach(f=>f.addEventListener('submit',async e=>{
    e.preventDefault();
    const email=(f.querySelector('[type=email]')||{}).value||'';
    /* legge segmento dal data attribute del form (es. data-segment="b2b") */
    const segment=f.dataset.segment||'prospect';
    if(email&&CONFIG.brevo&&CONFIG.brevo.apiKey){
      const ok=await sendBrevo(email, segment);
      if(ok){
        /* double opt-in UX: mostra messaggio specifico */
        toast(L==='it'?'✉ Controlla la tua email per confermare!':'✉ Check your email to confirm!');
        f.reset(); return;
      }
    }
    send(f,'formspreeNewsletter',T('nlOk'));
  }));
  const q=document.querySelector('form.quote-form');
  if(q){
    initModoPreventivo(q);
    q.addEventListener('submit',e=>{
      e.preventDefault();
      const urg=document.querySelector('#urgRow .pill.on');
      if(urg && !q.querySelector('[name="urgenza"]')){
        const h=document.createElement('input'); h.type='hidden'; h.name='urgenza'; h.value=urg.textContent; q.appendChild(h);
      }
      /* Le richieste delle aziende vanno in una casella loro: hanno tempi,
         linguaggio e priorità diversi, e mescolarle a quelle dei privati
         significa perderle in mezzo. Se la casella dedicata non è ancora
         configurata si usa quella generale — meglio una richiesta nel posto
         sbagliato che una richiesta persa. */
      const azienda = q.dataset.modo === 'azienda';
      const chiave = azienda && endpoint('formspreePreventivoB2B')
        ? 'formspreePreventivoB2B' : 'formspreePreventivo';
      send(q, chiave, T('qOk'), azienda ? 'INGLY — richiesta AZIENDA dal sito' : null);
    });
  }
}
