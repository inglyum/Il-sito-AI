/* ============ NAVIGATION (modulo) ============
   Router History API (pushState): URL puliti senza #.
   Compatibilità GitHub Pages: 404.html decodifica /shop → /?/shop → qui ripristinato. */
import { observeAll } from './animations.js';
import { F, renderRV, renderChips, renderShop, currentProduct } from './products.js';
import { updateSeo } from './seo.js';
import { L, T } from './utils.js';

export const PAGES=['home','shop','product','digital','business','portfolio','about','faq','quote'];

export function currentPage(){
  const p=location.pathname.replace(/^\/+/,'').split('?')[0].split('/')[0]||'home';
  return PAGES.includes(p)?p:'home';
}

/* Estrai ?id=xxx dal pathname o dalla query string */
export function currentSearch(){
  const qs=location.search||'';
  const params=new URLSearchParams(qs);
  return params.get('id')||null;
}

let _leaveTimer=null;
const reduceMotion=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

export function show(page){
  const next=document.getElementById('page-'+page);
  if(!next) return;
  const cur=document.querySelector('.page.active');
  if(_leaveTimer){clearTimeout(_leaveTimer);_leaveTimer=null;
    document.querySelectorAll('.page.leaving').forEach(x=>x.classList.remove('leaving'));}

  const finish=()=>{
    document.querySelectorAll('.page').forEach(x=>x.classList.remove('active','leaving'));
    next.classList.add('active');
    document.querySelectorAll('.nav-links [data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===page));
    toggleMenu(false);
    document.body.classList.toggle('on-product',page==='product');
    window.scrollTo({top:0,behavior:'instant'});
    if(page==='shop')renderRV();
    updateSeo(page,L,T,page==='product'?currentProduct():null);
    observeAll();
  };

  if(cur&&cur!==next&&!reduceMotion()){
    cur.classList.add('leaving');
    _leaveTimer=setTimeout(()=>{_leaveTimer=null;finish();},180);
  } else {
    finish();
  }
}

export function go(page,search){
  const url='/'+page+(search?'?'+search:'');
  if(location.pathname.replace(/^\/+/,'')===page&&!search){show(page);return;}
  history.pushState({page,search:search||null},'',(url));
  show(page);
}

export function goShop(cat){F.cat.clear();F.sub.clear();F.mat.clear();if(cat)F.cat.add(cat);renderChips();renderShop();go('shop')}
export function toggleMenu(open){document.getElementById('mm').classList.toggle('open',open)}

export function initNav(){
  /* Gestisci pulsanti Avanti/Indietro del browser */
  addEventListener('popstate',()=>show(currentPage()));

  /* Intercetta tutti i click su <a href="/..."> interni per usare pushState */
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');
    if(!a)return;
    const href=a.getAttribute('href');
    if(!href||href.startsWith('http')||href.startsWith('mailto')||href.startsWith('tel')||href.startsWith('wa.'))return;
    const clean=href.replace(/^#\//,'/').replace(/^#/,'/');
    const page=clean.replace(/^\/+/,'').split('?')[0]||'home';
    if(!PAGES.includes(page))return;
    e.preventDefault();
    go(page,clean.includes('?')?clean.split('?')[1]:null);
  },true);
}
