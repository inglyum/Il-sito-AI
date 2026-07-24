/* ============ DATA LOADER (modulo) ============
   Fonte di verità: /data/*.json con CACHE-BUSTING automatico.
   1) legge data/version.json (mai in cache) → versione
   2) carica i JSON con ?v=<versione>
   ROBUSTEZZA: se un singolo file manca o è corrotto, NON fallisce tutto:
   recupera solo quel pezzo dai dati di riserva (data/*.js) e segnala l'anomalia.
   Su file:// (doppio click) usa direttamente i dati di riserva. */
const FILES=['config','texts','social','products','categories','content'];
const KEY={config:'CONFIG',texts:'D',social:'SOCIALS',products:'P',categories:'CATS'};

export const dataStatus={mode:'',version:null,missing:[],warnings:[]};

/* Auto-guarigione dei dati: il sito NON deve mai crollare per un valore imperfetto
   (materiale scritto diverso, sottocategoria fuori scala, chiavi mancanti da un backup vecchio).
   Ripara in memoria e segnala in console; la correzione definitiva si fa dall'Admin. */
function healData(e){
  try{
    const heal=[];
    e.MAT_ART=e.MAT_ART||{}; e.MATN=e.MATN||{};
    const mats=Object.keys(e.MAT_ART).filter(k=>k!=='File');
    const first=mats[0]||'Legno';
    if(!e.MAT_ART[first])e.MAT_ART[first]={bg:'#3a2f26,#6b543e'};
    if(!e.MAT_ART.File)e.MAT_ART.File=e.MAT_ART[first];
    if(!e.MATN[first])e.MATN[first]={it:first,en:first};
    (e.P||[]).forEach(p=>{
      if(!e.MAT_ART[p.mat]){
        const ci=mats.find(m=>m.toLowerCase()===String(p.mat||'').toLowerCase());
        heal.push('prodotto #'+p.id+': materiale "'+p.mat+'" -> "'+(ci||first)+'"');
        p.mat=ci||first;
      }
      if(!e.MATN[p.mat])e.MATN[p.mat]={it:p.mat,en:p.mat};
      const c=(e.CATS||[]).find(x=>x.id===p.cat);
      if(c&&(!(p.sub>=1)||p.sub>c.sub.length)){heal.push('prodotto #'+p.id+': sottocategoria fuori scala -> 1');p.sub=1}
      if(!p.n)p.n={it:'Prodotto '+p.id,en:'Product '+p.id};
      if(p.n.en===undefined)p.n.en=p.n.it;
    });
    e.THEMES=(e.THEMES&&Array.isArray(e.THEMES.temi))?e.THEMES:{attivo:'default',auto:true,temi:[]};
    if(!e.MV||Array.isArray(e.MV)||typeof e.MV!=='object')e.MV={};
    e.FOCAL=(e.FOCAL&&typeof e.FOCAL==='object'&&!Array.isArray(e.FOCAL))?e.FOCAL:{};
    ['PORT','TECH','BIZ','FAQS','REVIEWS','STEPS','MATERIALS','DIG'].forEach(k=>{if(!Array.isArray(e[k]))e[k]=[]});
    if(heal.length)console.warn('[INGLY] dati riparati in memoria:',heal.join(' | '));
  }catch(err){console.warn('[INGLY] healData:',err)}
  return e;
}
export async function loadData(){
  if(window.INGLY && window.INGLY.CATS) return healData(window.INGLY);
  /* ANTEPRIMA: se l'Admin ha messo una bozza in sessionStorage, il sito la usa (solo in questa scheda) */
  try{
    if(location.search.includes('__preview=1')){
      const raw=sessionStorage.getItem('__INGLY_PREVIEW__');
      if(raw){ const d=JSON.parse(raw); const I={};
        for(const k of Object.keys(d)) I[k]=d[k];
        healData(I);
        I.__v=Date.now(); I.__preview=true; window.INGLY=I;
        document.documentElement.classList.add('is-preview');
        return I; }
    }
  }catch(e){}
  let v=null;
  try{
    const vr=await fetch('data/version.json?t='+Date.now(),{cache:'no-store'});
    if(vr.ok) v=(await vr.json()).v;
  }catch(e){}

  const I={};
  if(v!=null){
    const res=await Promise.allSettled(FILES.map(f=>
      fetch(`data/${f}.json?v=${v}`).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json() })));
    res.forEach((r,i)=>{
      const f=FILES[i];
      if(r.status==='fulfilled'){
        if(f==='content') Object.assign(I,r.value); else I[KEY[f]]=r.value;
      } else dataStatus.missing.push(f+'.json');
    });
    dataStatus.mode='json'; dataStatus.version=v;
  } else dataStatus.mode='legacy';

  /* pezzi mancanti → riserva (data/*.js), senza sovrascrivere ciò che è arrivato dai JSON */
  const need = dataStatus.mode!=='json' || dataStatus.missing.length;
  if(need){
    const legacy=await loadLegacy().catch(()=>null);
    if(legacy){
      for(const k of Object.keys(legacy)) if(I[k]===undefined) I[k]=legacy[k];
      if(dataStatus.missing.length)
        dataStatus.warnings.push('Dati recuperati dalla riserva per: '+dataStatus.missing.join(', ')+'. Carica questi file nella cartella data/ del repository.');
    }
  }
  if(!I.CATS || !I.P) throw new Error('Dati del sito non trovati (né JSON né riserva).');
  healData(I);
  I.__v=v; I.__status=dataStatus;
  window.INGLY=I;
  if(dataStatus.warnings.length) console.warn('[INGLY]', dataStatus.warnings.join(' | '));
  return I;
}

/* riserva: gli script classici data/*.js (funzionano anche su file://) */
function loadLegacy(){
  const stash=window.INGLY; window.INGLY={};
  return new Promise((res,rej)=>{
    const fl=['config','i18n','socials','catalog']; let i=0;
    const next=()=>{
      if(i>=fl.length){ const got=window.INGLY; window.INGLY=stash; return got.CATS?res(got):rej(new Error('riserva incompleta')) }
      const s=document.createElement('script'); s.src='data/'+fl[i++]+'.js';
      s.onload=next; s.onerror=()=>{ window.INGLY=stash; rej(new Error('File mancante: '+s.src)) };
      document.head.appendChild(s);
    };next();
  });
}
