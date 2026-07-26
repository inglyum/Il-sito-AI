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

async function send(form, key, okMsg){
  const url=endpoint(key);
  if(!url){ toast(T('formsOff')); return }
  const btn=form.querySelector('button[type="submit"],button:not([type])');
  const label=btn?btn.textContent:'';
  if(btn){ btn.disabled=true; btn.textContent='…' }
  try{
    const data=new FormData(form);
    data.append('_subject','INGLY — nuova richiesta dal sito');
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
  if(q) q.addEventListener('submit',e=>{
    e.preventDefault();
    const urg=document.querySelector('#urgRow .pill.on');
    if(urg && !q.querySelector('[name="urgenza"]')){
      const h=document.createElement('input'); h.type='hidden'; h.name='urgenza'; h.value=urg.textContent; q.appendChild(h);
    }
    send(q,'formspreePreventivo',T('qOk'));
  });
}
