/* ============ PANNELLO «SEO & AI ENGINE» ============
   Modulo dell'Admin tenuto FUORI da admin.html.

   admin.html è già a 241 KB con tutto dentro: HTML, CSS e circa 4.000 righe di
   JavaScript in un unico ambito condiviso. Aggiungerci i pannelli dei moduli
   previsti lo renderebbe impossibile da mantenere. Da qui in avanti ogni nuovo
   pannello vive in un file suo; il monolite non cresce più.

   Come si aggancia: è uno script classico (non un modulo), quindi vede le
   variabili globali dell'Admin — S, markDirty, toast, esc, $ — senza bisogno di
   un'impalcatura. Il motore SEO, che è un modulo ES, viene caricato con un
   import dinamico. */
(function(){
  'use strict';

  let ENG = null;                       /* motore SEO, caricato una volta sola */
  const VIEW_ID = 'seoai';

  const seo  = () => (S.CONFIG.seo = S.CONFIG.seo || {});
  const tmpl = () => (seo().template   = seo().template   || {});
  const rob  = () => (seo().robots     = seo().robots     || {});

  /* Un prodotto vero per l'anteprima: mostrare come verrà un titolo reale è più
     utile di un esempio inventato, perché fa emergere subito i casi storti. */
  function prodottoCampione(){
    const P = (S.P || []).filter(p => !p.hidden);
    return P.find(p => p.desc && p.desc.it) || P[0] || null;
  }

  function contesto(p){
    const cat  = (S.CATS || []).find(c => c.id === (p && p.cat));
    const MATN = (S.C && S.C.MATN) || {};
    return {
      L: 'it',
      azienda:   seo().azienda || 'INGLY DESIGN',
      citta:     seo().citta   || '',
      categoria: (cat && cat.n && cat.n.it) || '',
      materiale: (MATN[p && p.mat] && MATN[p.mat].it) || (p && p.mat) || '',
    };
  }

  /* Anteprima: com'è il risultato su Google + cosa non va */
  function anteprima(){
    const box = document.getElementById('se_prev');
    if(!box || !ENG) return;
    const p = prodottoCampione();
    if(!p){ box.innerHTML = '<span class="hint">Nessun prodotto disponibile per l\'anteprima.</span>'; return }

    const ctx = contesto(p);
    const t = ENG.titoloProdotto(p, seo(), ctx);
    const d = ENG.descrizioneProdotto(p, seo(), ctx);
    const dom = (seo().dominio || 'https://www.inglydesign.it').replace(/\/+$/, '');
    const problemi = ENG.diagnosi(t, d);

    const colore = n => n > ENG.LIMITI.titoloMax ? 'var(--warn)' : 'var(--ok)';
    box.innerHTML =
      `<div style="font-size:12px;color:#9aa3c7;margin-bottom:2px">${esc(dom)}/product?id=${p.id}</div>
       <div style="color:#8ab4f8;font-size:17px;line-height:1.3">${esc(t)}</div>
       <div style="color:#bdc1c6;font-size:13px;line-height:1.5;margin-top:3px">${esc(d)}</div>
       <div class="hint" style="margin-top:9px">
         titolo <b style="color:${colore(t.length)}">${t.length}</b>/${ENG.LIMITI.titoloMax} ·
         descrizione <b style="color:${d.length > ENG.LIMITI.descrizioneMax ? 'var(--warn)' : 'var(--ok)'}">${d.length}</b>/${ENG.LIMITI.descrizioneMax}
         · esempio dal prodotto #${p.id}
       </div>` +
      (problemi.length
        ? `<div style="margin-top:9px;display:flex;flex-direction:column;gap:4px">` +
          problemi.map(x => `<span style="font-size:12px;color:${x.gravita === 'errore' ? 'var(--err)' : 'var(--warn)'}">${x.gravita === 'errore' ? '✖' : '⚠'} ${esc(x.testo)}</span>`).join('') +
          `</div>`
        : `<div style="margin-top:9px;font-size:12px;color:var(--ok)">✔ Nessun problema rilevato</div>`);
  }

  /* Quanti prodotti finirebbero con lo STESSO titolo: è il difetto che il
     motore esiste per evitare, quindi va mostrato come numero, non a parole. */
  function controlloDuplicati(){
    const box = document.getElementById('se_dup');
    if(!box || !ENG) return;
    const P = (S.P || []).filter(p => !p.hidden);
    const conta = new Map();
    P.forEach(p => {
      const t = p.seoTitolo || ENG.titoloProdotto(p, seo(), contesto(p));
      conta.set(t, (conta.get(t) || 0) + 1);
    });
    const dup = [...conta.entries()].filter(([, n]) => n > 1);
    box.innerHTML = dup.length
      ? `<span style="color:var(--warn)">⚠ ${dup.length} titol${dup.length === 1 ? 'o ripetuto' : 'i ripetuti'} su ${P.length} prodotti:</span>
         <div class="hint" style="margin-top:5px">${dup.slice(0, 5).map(([t, n]) => `«${esc(t)}» ×${n}`).join('<br>')}</div>`
      : `<span style="color:var(--ok)">✔ Tutti i ${P.length} prodotti visibili hanno un titolo diverso</span>`;
  }

  function aggiorna(){ anteprima(); controlloDuplicati() }

  function render(){
    const v = document.getElementById('v-' + VIEW_ID);
    if(!v) return;
    if(!ENG){
      v.innerHTML = '<div class="card hint">Caricamento del motore SEO…</div>';
      import('../seo-engine.js')
        .then(m => { ENG = m; render() })
        .catch(e => { v.innerHTML = '<div class="card" style="color:var(--err)">Motore SEO non caricato: ' + esc(String(e.message || e)) + '</div>' });
      return;
    }

    const T = tmpl(), R = rob(), pagine = R.pagine || {};
    const PAGINE = [['home','Home'],['shop','Catalogo'],['product','Schede prodotto'],['digital','Digitale'],
                    ['business','B2B'],['portfolio','Portfolio'],['about','Chi siamo'],['faq','FAQ'],['quote','Preventivo']];

    v.innerHTML = `
      <div class="card">
        <h3>🧠 Modelli di titolo e descrizione</h3>
        <div class="hint" style="margin-bottom:12px">
          I segnaposto vengono sostituiti a ogni pagina. Disponibili:
          <span class="mono">{prodotto}</span> <span class="mono">{materiale}</span>
          <span class="mono">{materialeSe}</span> <span class="mono">{categoria}</span>
          <span class="mono">{descrizione}</span> <span class="mono">{prezzo}</span>
          <span class="mono">{giorni}</span> <span class="mono">{azienda}</span>
          <span class="mono">{citta}</span> <span class="mono">{pagina}</span> <span class="mono">{claim}</span>.
          <br><b>{materialeSe}</b> aggiunge «in &lt;materiale&gt;» solo se il nome non lo dice già:
          evita titoli come «Etichetta in Pelle in Pelle».
        </div>
        <label>Titolo delle schede prodotto</label>
        <input type="text" id="se_tp" value="${esc(T.titoloProdotto || ENG.DEFAULTS.titoloProdotto)}">
        <label>Descrizione delle schede prodotto</label>
        <textarea id="se_dp">${esc(T.descrizioneProdotto || ENG.DEFAULTS.descrizioneProdotto)}</textarea>
        <div class="row c2">
          <div><label>Titolo delle altre pagine</label>
            <input type="text" id="se_tpg" value="${esc(T.titoloPagina || ENG.DEFAULTS.titoloPagina)}"></div>
          <div><label>Titolo della home</label>
            <input type="text" id="se_th" value="${esc(T.titoloHome || ENG.DEFAULTS.titoloHome)}"></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
          <button class="btn" id="se_reset">↺ Riporta ai modelli predefiniti</button>
        </div>
      </div>

      <div class="card">
        <h3>👁 Anteprima su Google</h3>
        <div id="se_prev" style="background:#0d1122;border:1px solid var(--line);border-radius:10px;padding:12px 14px;max-width:620px"></div>
        <hr class="hr">
        <h3 style="font-size:13.5px">Titoli duplicati</h3>
        <div id="se_dup"></div>
      </div>

      <div class="card">
        <h3>🤖 Indicizzazione</h3>
        <div class="hint" style="margin-bottom:10px">
          Decide quali pagine possono comparire nei motori di ricerca.
          In caso di dubbio lascia tutto indicizzabile: una pagina esclusa per errore
          sparisce da Google e può volerci molto perché rientri.
        </div>
        <label style="display:flex;gap:8px;align-items:flex-start;padding:10px 12px;border:1px solid ${R.tuttoNoindex ? 'var(--err)' : 'var(--line)'};border-radius:9px;background:${R.tuttoNoindex ? 'rgba(255,90,90,.10)' : 'transparent'}">
          <input type="checkbox" id="se_allno" style="width:auto;margin-top:2px" ${R.tuttoNoindex ? 'checked' : ''}>
          <span><b>Escludi TUTTO il sito dai motori di ricerca</b>
          <br><span class="hint">Da usare solo per un sito non ancora pronto. Se resta acceso, il sito sparisce da Google.</span></span>
        </label>
        <div style="margin-top:14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px">
          ${PAGINE.map(([id, nome]) => `
            <label style="display:flex;gap:8px;align-items:center;padding:8px 10px;border:1px solid var(--line);border-radius:8px">
              <input type="checkbox" data-se-noidx="${id}" style="width:auto" ${pagine[id] === 'noindex' ? 'checked' : ''}>
              <span>Escludi <b>${esc(nome)}</b></span>
            </label>`).join('')}
        </div>
      </div>`;

    /* --- collegamenti --- */
    const salva = (id, chiave) => {
      const el = document.getElementById(id);
      if(!el) return;
      el.oninput = () => {
        const val = el.value.trim();
        if(val) tmpl()[chiave] = val; else delete tmpl()[chiave];
        markDirty(); aggiorna();
      };
    };
    salva('se_tp',  'titoloProdotto');
    salva('se_dp',  'descrizioneProdotto');
    salva('se_tpg', 'titoloPagina');
    salva('se_th',  'titoloHome');

    document.getElementById('se_reset').onclick = () => {
      if(!confirm('Riportare i quattro modelli ai valori predefiniti?')) return;
      delete seo().template;
      markDirty(); render();
      toast('Modelli riportati ai valori predefiniti');
    };

    document.getElementById('se_allno').onchange = e => {
      if(e.target.checked && !confirm(
        'Stai per escludere TUTTO il sito dai motori di ricerca.\n\n' +
        'Dopo la pubblicazione il sito sparirà da Google e dagli altri motori.\n\nProcedere?')){
        e.target.checked = false; return;
      }
      if(e.target.checked) rob().tuttoNoindex = true; else delete rob().tuttoNoindex;
      markDirty(); render();
    };

    v.querySelectorAll('[data-se-noidx]').forEach(cb => {
      cb.onchange = () => {
        const id = cb.dataset.seNoidx;
        rob().pagine = rob().pagine || {};
        if(cb.checked) rob().pagine[id] = 'noindex'; else delete rob().pagine[id];
        if(!Object.keys(rob().pagine).length) delete rob().pagine;
        markDirty();
      };
    });

    aggiorna();
  }

  /* Aggancio al router dell'Admin senza modificarne il codice: si avvolge go(),
     che è una funzione globale, e si disegna il pannello quando è la sua vista. */
  function aggancia(){
    if(typeof window.go !== 'function'){ setTimeout(aggancia, 60); return }
    if(window.__seoaiHooked) return;
    window.__seoaiHooked = true;
    const orig = window.go;
    window.go = function(v){
      const r = orig.apply(this, arguments);
      if(v === VIEW_ID) render();
      return r;
    };
  }

  if(document.readyState === 'loading') addEventListener('DOMContentLoaded', aggancia);
  else aggancia();
})();
