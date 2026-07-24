/* ============ FORMS (modulo) ============
   Preventivo e newsletter: invio REALE via Formspree quando configurato
   nell'admin (Contatti → Moduli). Senza ID configurato mostrano un avviso. */
import { $, T, toast, L } from './utils.js';
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

export function initForms(){
  document.querySelectorAll('form.nform').forEach(f=>f.addEventListener('submit',e=>{
    e.preventDefault(); send(f,'formspreeNewsletter',T('nlOk'));
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
