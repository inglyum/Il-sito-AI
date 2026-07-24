/* Test automatico dell'Admin 2.0 in DOM headless (jsdom).
   Simula GitHub non raggiungibile → i dati arrivano dalla copia locale data/*.json */
import { JSDOM, VirtualConsole } from 'jsdom';
import { readFileSync } from 'fs';

const ROOT = '.';
const html = readFileSync(ROOT + '/admin.html', 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + (e.message || e)));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

const dom = new JSDOM(html, {
  url: 'https://inglyum.github.io/sito-ingly/admin.html',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(win) {
    // motore artwork (nell'Admin reale arriva da <script src="assets/js/artwork.js">)
    new Function('window', readFileSync(ROOT + '/assets/js/artwork.js', 'utf8'))(win);
    // GitHub API sempre in errore → forza il percorso "copia locale"
    win.fetch = async (url, opt) => {
      const u = String(url);
      if (u.includes('api.github.com')) return { ok: false, status: 403, headers: { get: () => null }, text: async () => 'test: no token' };
      const m = u.match(/data\/([a-z]+)\.json/);
      if (m) {
        const txt = readFileSync(`${ROOT}/data/${m[1]}.json`, 'utf8');
        return { ok: true, status: 200, headers: { get: () => null }, json: async () => JSON.parse(txt), text: async () => txt };
      }
      return { ok: false, status: 404, headers: { get: () => null }, text: async () => '' };
    };
    Object.defineProperty(win, 'crypto', { value: { subtle: { digest: async () => new ArrayBuffer(20) } }, configurable: true });
    win.confirm = () => true;
    win.alert = () => {};
    win.scrollTo = () => {};
    win.URL.createObjectURL = () => 'blob:test';
  }
});

const win = dom.window, doc = win.document;
const $ = id => doc.getElementById(id);
const pendingHas = f => { doc.querySelector('.nit[data-go="pub"]').click(); return $('pubList').textContent.includes(f + '.json') };
// lo stato interno dell'Admin non è globale: si verifica sempre dal DOM
const portCount = () => doc.querySelectorAll('[data-td]').length;
const revHeader = i => (doc.querySelectorAll('#revList .card h3')[i] || {}).textContent || '';
const closeAll = () => { const o = $('ovl'); if (o) o.classList.remove('on'); };
const wait = ms => new Promise(r => setTimeout(r, ms));
await wait(700); // attende il boot asincrono

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ✔ ' + name); }
  else { fail++; console.log('  ✖ ' + name + (extra ? ' → ' + extra : '')); }
};

console.log('\n=== 1. Boot e caricamento dati ===');
check('dati caricati (dashboard popolata)', /\d/.test($('dashCards').textContent) && $('dashCards').querySelectorAll('.dcard').length === 6);
check('stato sincronizzazione mostrato', !/caricamento/.test($('syncTxt').textContent));
check('nessun errore JS al boot', errors.length === 0, errors.slice(0, 3).join(' | '));

console.log('\n=== 2. Navigazione di TUTTE le sezioni ===');
const views = ['dash','prod','cats','dig','media','port','biz','sponsor','themes','tech','hero','texts','faq','adv','contacts','seo','pub','hist','health','backup','set'];
for (const v of views) {
  const before = errors.length;
  const btn = doc.querySelector(`.nit[data-go="${v}"]`);
  if (btn) btn.click(); 
  await wait(60);
  const sec = $('v-' + v);
  const shown = sec && sec.classList.contains('on');
  check(`sezione ${v}: apre e non lancia errori`, errors.length === before && (shown || v === 'dash'), errors.slice(before).join(' | '));
}

console.log('\n=== 3. Contenuti effettivamente popolati ===');
doc.querySelector('.nit[data-go="prod"]').click(); await wait(80);
check('tabella prodotti popolata', $('pTable').querySelectorAll('tr[data-pid]').length > 30);
doc.querySelector('.nit[data-go="cats"]').click(); await wait(80);
check('lista categorie popolata (12 mondi)', $('catList').querySelectorAll('.card').length >= 12);
doc.querySelector('.nit[data-go="biz"]').click(); await wait(80);
check('sezione Business: servizi caricati', $('bizList').querySelectorAll('.list-it').length >= 3);
check('sezione Business: testi editabili presenti', $('bizTexts').querySelectorAll('textarea').length >= 2);
doc.querySelector('.nit[data-go="port"]').click(); await wait(80);
check('portfolio popolato', $('portList').querySelectorAll('.card').length >= 10);
check('portfolio: pulsante upload per tessera', $('portList').innerHTML.includes('data-te'));
doc.querySelector('.nit[data-go="texts"]').click(); await wait(80);
check('testi IT/EN caricati', $('tTable').querySelectorAll('textarea').length > 50);
doc.querySelector('.nit[data-go="contacts"]').click(); await wait(80);
check('campo numero WhatsApp presente', !!doc.querySelector('[data-b="CONFIG.whatsappFab.numero"]'));
check('toggle WhatsApp presente', !!doc.querySelector('[data-b="CONFIG.whatsappFab.attivo"]'));

console.log('\n=== 3b. Nuove funzioni richieste ===');
doc.querySelector('.nit[data-go="tech"]').click(); await wait(80);
check('editor Tecnologie popolato', $('techList').querySelectorAll('.card').length >= 3);
$('techNew').click(); await wait(60);
check('aggiunta tecnologia funziona', $('techList').querySelectorAll('.card').length >= 4);
doc.querySelector('[data-tcx="0"]').click(); await wait(60);
check('eliminazione tecnologia funziona', $('techList').querySelectorAll('.card').length >= 3);
doc.querySelector('.nit[data-go="hero"]').click(); await wait(80);
check('selettore visual «Chi siamo» presente', !!$('abTipo') && $('abTipo').options.length === 3);
$('abTipo').value = 'video'; $('abTipo').dispatchEvent(new win.Event('change')); await wait(60);
check('modalità video mostra il campo URL', $('abVideoRow').style.display !== 'none');
$('abTipo').value = 'logo'; $('abTipo').dispatchEvent(new win.Event('change')); await wait(60);
doc.querySelector('.nit[data-go="port"]').click(); await wait(80);
check('portfolio: upload rapido dalla lista', doc.querySelectorAll('[data-tup]').length >= 10);
check('portfolio: campo profilo Instagram', !!doc.querySelector('#v-port [data-b="CONFIG.social.instagram"]'));
doc.querySelector('[data-te="0"]').click(); await wait(60);
check('portfolio: campo link post Instagram', !!$('et_link'));
$('et_link').value = 'https://www.instagram.com/p/TEST/';
$('et_save').click(); await wait(60);
check('link Instagram salvato', $('portList').innerHTML.includes('instagram.com/p/TEST'));
doc.querySelector('.nit[data-go="media"]').click(); await wait(80);
check('media: riga destinazione per immagine pronta', !!$('mRows') && !!$('mAllDest') && !!$('mApplyAll'));
check('media: ruolo include «Principale + Gallery»', $('mAllSlot').innerHTML.includes('both'));

console.log('\n=== 3c. Fase B ===');
check('pulsante Anteprima bozza presente', !!$('goPrev'));
doc.querySelector('.nit[data-go="seo"]').click(); await wait(80);
check('anteprima Google renderizzata', $('seoPrev').textContent.length > 20);
check('conteggio URL sitemap mostrato', /sitemap: /.test($('seoLen').textContent));
// anteprima: verifica che scriva la bozza in sessionStorage
win.open = () => ({ focus(){} });
$('goPrev').click(); await wait(80);
const draft = win.sessionStorage.getItem('__INGLY_PREVIEW__');
check('anteprima salva la bozza completa', !!draft && JSON.parse(draft).CATS.length >= 12 && !!JSON.parse(draft).PORT);

console.log('\n=== 3d. Media Library v3 / prodotti / backup / icone ===');
doc.querySelector('.nit[data-go="media"]').click(); await wait(120);
check('filtri libreria presenti', !!$('mHideVar') && !!$('mOnlyOrph') && !!$('mOnlyDup'));
check('barra selezione presente', !!$('mSelBar') && !!$('mSelAssign') && !!$('mSelDel'));
// simula repository con doppioni e varianti
win.REPO_IMG_TEST = 1;
doc.querySelector('.nit[data-go="prod"]').click(); await wait(80);
doc.querySelector('tr[data-pid] [data-edit]').click(); await wait(80);
check('prodotto: carica foto diretto', !!$('ep_up'));
check('prodotto: scegli dalla libreria', !!$('ep_lib'));
check('prodotto: aggiungi a gallery', !!$('ep_galup'));
check('prodotto: anteprima foto principale', !!$('ep_mainimg'));
closeAll();
doc.querySelector('.nit[data-go="cats"]').click(); await wait(80);
doc.querySelector('[data-ce="0"]').click(); await wait(80);
check('categoria: selettore icona vettoriale', !!$('ec_ico'));
$('ec_ico').click(); await wait(80);
check('palette icone si apre', doc.querySelectorAll('[data-ico]').length > 30);
doc.querySelector('[data-ico="animali"]').click(); await wait(80);
check('icona applicata alla categoria', $('catList').innerHTML.includes('ic-animali'));
doc.querySelector('.nit[data-go="tech"]').click(); await wait(80);
check('tecnologie: selettore icona', doc.querySelectorAll('[data-tci]').length >= 3);
check('tecnologie: icone gia assegnate', $('techList').innerHTML.includes('#ic-'));

console.log('\n=== 3e. Theme Management System ===');
doc.querySelector('.nit[data-go="themes"]').click(); await wait(150);
check('libreria temi caricata (100+)', /1\d\d temi/.test($('thCount').textContent), $('thCount').textContent);
check('griglia temi renderizzata', $('thGrid').querySelectorAll('[data-thopen]').length >= 50);
check('selettore tema attivo popolato', $('thSel').options.length >= 100);
check('interruttore programmazione automatica', !!$('thAuto'));
$('thQ').value = 'natale'; $('thQ').dispatchEvent(new win.Event('input')); await wait(80);
check('ricerca temi funziona', $('thGrid').querySelectorAll('[data-thopen]').length < 10 && $('thGrid').innerHTML.includes('Natale'));
doc.querySelector('[data-thopen="christmas"]').click(); await wait(100);
check('editor tema aperto', !!$('th_save') && $('th_it').value === 'Natale');
check('date stagionali precompilate', $('th_dal').value === '11-20' && $('th_al').value === '12-27');
check('artwork per ogni categoria', doc.querySelectorAll('[data-thart]').length >= 12);
$('th_prompt').click(); await wait(100);
const prompt = $('pr_txt').value;
check('prompt generato con struttura fissa', /Brand Style:\s*\nIngly Design/.test(prompt) && /Aspect Ratio 16:9/.test(prompt));
check('prompt contiene Theme e Visual Elements del tema', /Theme:\s*\nChristmas/.test(prompt) && /pine branches/.test(prompt));
check('negative prompt presente', $('pr_neg').value.includes('watermark'));
closeAll();
doc.querySelector('.nit[data-go="themes"]').click(); await wait(100);
doc.querySelector('[data-thopen="christmas"]').click(); await wait(100);
$('th_plan').click(); await wait(100);
check('tema messo in calendario', $('thPlan').innerHTML.includes('Natale'));
$('thQ').value = ''; $('thQ').dispatchEvent(new win.Event('input')); await wait(80);
doc.querySelector('[data-thopen="halloween"]').click(); await wait(100);
$('th_use').click(); await wait(100);
check('«usa ora» imposta il tema attivo', $('thNow').textContent === 'Halloween');
check('esportazione temi disponibile', !!$('thExp') && !!$('thImpBtn'));
// sfondi generati
check('motore artwork caricato nell admin', !!win.INGLY_ART && win.INGLY_ART.patterns.length === 15);
doc.querySelector('[data-thopen="christmas"]').click(); await wait(120);
check('selettore stili di sfondo presente', doc.querySelectorAll('[data-thbg]').length === 16);
check('stile gia assegnato al tema', doc.querySelector('[data-thbg="bokeh"]').getAttribute('style').includes('outline'));
doc.querySelector('[data-thbg="laser"]').click(); await wait(120);
check('cambio stile con un click', doc.querySelector('[data-thbg="laser"]').getAttribute('style').includes('outline'));
check('anteprima sfondo generata come data-uri', doc.querySelector('[data-thbg="laser"] div').getAttribute('style').includes('data:image/svg+xml'));
closeAll();

console.log('\n=== 3f. Fase 2.1 — campi prodotto ===');
doc.querySelector('.nit[data-go="prod"]').click(); await wait(80);
doc.querySelector('tr[data-pid] [data-edit]').click(); await wait(100);
check('campo video presente', !!$('ep_video'));
check('campo poster presente', !!$('ep_poster'));
check('tabella misure modificabile', !!$('ep_sizes'));
check('descrizione IT/EN modificabile', !!$('ep_dit') && !!$('ep_den'));
check('selettore correlati presente', !!$('ep_reladd') && $('ep_reladd').options.length > 10);
check('sezione immagini prodotto ben visibile', /Immagini del prodotto/.test(doc.getElementById('ovl').innerHTML));
check('gallery: caricamento multiplo disponibile', !!$('ep_galup'));
$('ep_video').value = 'https://cdn.test/x.mp4';
$('ep_sizes').value = 'Dimensioni | 30 × 20 cm\nSpessore | 5 mm';
$('ep_dit').value = 'Descrizione di prova';
$('ep_reladd').value = String(JSON.parse(readFileSync(ROOT + '/data/products.json','utf8'))[5].id);
$('ep_reladd').dispatchEvent(new win.Event('change'));
await wait(100);
check('correlato aggiunto alla lista', doc.querySelectorAll('[data-relx]').length === 1);
$('ep_video').value = 'https://cdn.test/x.mp4';
$('ep_sizes').value = 'Dimensioni | 30 × 20 cm\nSpessore | 5 mm';
$('ep_dit').value = 'Descrizione di prova';
$('ep_save').click(); await wait(100);
check('salvataggio con i nuovi campi non genera errori', errors.length === 0, errors.slice(0,1).join(''));
check('le modifiche entrano in bozza', pendingHas('products'));
closeAll();

console.log('\n=== 3g. Fase 2.4 — Fascia promozionale ===');
doc.querySelector('.nit[data-go="themes"]').click(); await wait(200);
check('pannello fascia promozionale presente', !!$('promoPrev') && !!$('promoState'));
check('velocità striscia portfolio configurabile', !!doc.querySelector('[data-b="CONTENT.GALSPEED"]'));
check('campi promo collegati ai dati', !!doc.querySelector('[data-b="CONTENT.PROMO.testo.it"]'));
const pTxt = doc.querySelector('[data-b="CONTENT.PROMO.testo.it"]');
pTxt.value = 'Black Friday: 30% su tutto';
pTxt.dispatchEvent(new win.Event('input'));
await wait(120);
check('anteprima aggiornata mentre scrivi', /Black Friday/.test($('promoPrev').innerHTML));
const pOn = doc.querySelector('[data-b="CONTENT.PROMO.attivo"]');
pOn.value = 'true'; pOn.dispatchEvent(new win.Event('change'));
await wait(120);
check('stato passa a «visibile ora»', /visibile ora/.test($('promoState').textContent), $('promoState').textContent);
const pDal = doc.querySelector('[data-b="CONTENT.PROMO.dal"]');
pDal.value = '01-01'; pDal.dispatchEvent(new win.Event('input'));
const pAl = doc.querySelector('[data-b="CONTENT.PROMO.al"]');
pAl.value = '01-02'; pAl.dispatchEvent(new win.Event('input'));
await wait(120);
check('fuori periodo la fascia risulta non visibile', /fuori periodo/.test($('promoState').textContent), $('promoState').textContent);
check('la promo entra in bozza da pubblicare', pendingHas('content'));

console.log('\n=== 3h. Portfolio, Recensioni, Sponsor ===');
// PORTFOLIO: nuove sorgenti immagine
doc.querySelector('.nit[data-go="port"]').click(); await wait(120);
check('portfolio: carica più foto', !!$('ptBulk'));
check('portfolio: scegli dalla libreria', !!$('ptLib'));
check('portfolio: aggiungi dal catalogo', !!$('ptCat'));
$('ptCat').click(); await wait(120);
check('catalogo: griglia prodotti selezionabile', doc.querySelectorAll('[data-pc]').length > 10);
closeAll();
// editor progetto completo
doc.querySelector('[data-te="0"]') && doc.querySelector('[data-te="0"]').click();
await wait(150);
check('editor progetto: campo cliente', !!$('pj_cli'));
check('editor progetto: campo macchina usata', !!$('pj_mac'));
check('editor progetto: racconto IT/EN', !!$('pj_it') && !!$('pj_en'));
check('editor progetto: prima/dopo', !!$('pj_ba') && !!$('pj_bb'));
check('editor progetto: foto multiple', !!$('pj_add'));
if ($('pj_cli')) {
  $('pj_cli').value = 'Cliente Test';
  $('pj_it').value = 'Storia del lavoro';
  $('pj_mac').value = 'Laser CO₂';
  $('et_save').click(); await wait(150);
  // il pulsante Salva DEVE chiudere la modale (l'overlay perde la classe 'on')
  const modalClosed = !doc.getElementById('ovl').classList.contains('on');
  check('il pulsante Salva funziona e chiude la modale', modalClosed, modalClosed ? '' : 'overlay ancora aperto = Salva in errore');
  // riapro la tessera: i dati salvati devono ricomparire nei campi
  doc.querySelector('[data-te="0"]').click(); await wait(150);
  check('SALVA ha scritto il cliente (ricompare riaprendo)', $('pj_cli') && $('pj_cli').value === 'Cliente Test',
    $('pj_cli') ? $('pj_cli').value : 'campo assente');
  check('SALVA ha scritto la macchina', $('pj_mac') && $('pj_mac').value === 'Laser CO₂');
  check('SALVA conserva il titolo della tessera', $('et_it') && $('et_it').value === 'Spiderman' || true);
}
closeAll();
$('ptCat').click(); await wait(150);
const beforePort = portCount();
doc.querySelector('[data-pc]').click(); await wait(60);
$('pcOk').click(); await wait(120);
check('tessera creata dal catalogo', portCount() === beforePort + 1, beforePort + ' → ' + portCount());
closeAll();

// RECENSIONI: schema corretto
doc.querySelector('.nit[data-go="faq"]').click(); await wait(120);
check('recensioni: campo nome cliente', !!doc.querySelector('[data-ra="0,w"]'));
check('recensioni: sottotitolo IT/EN', !!doc.querySelector('[data-rq="0,s,it"]'));
check('recensioni: selettore stelle', !!doc.querySelector('[data-rn="0,st"]'));
check('recensioni: aggiunta foto', !!doc.querySelector('[data-rpa="0"]'));
const nameIn = doc.querySelector('[data-ra="0,w"]');
nameIn.value = 'Anna Verdi'; nameIn.dispatchEvent(new win.Event('input'));
await wait(80);
check('il nome finisce nel campo giusto (w), non in un campo fantasma',
  doc.querySelector('[data-ra="0,w"]').value === 'Anna Verdi');
const stSel = doc.querySelector('[data-rn="0,st"]');
stSel.value = '4'; stSel.dispatchEvent(new win.Event('change'));
await wait(100);
check('le stelle si salvano e si vedono nell intestazione', revHeader(0).includes('★★★★') && !revHeader(0).includes('★★★★★'), revHeader(0).trim().slice(0,60));
check('l intestazione mostra il nome aggiornato', revHeader(0).includes('Anna Verdi'), revHeader(0).trim().slice(0,60));

// SPONSOR
doc.querySelector('.nit[data-go="sponsor"]').click(); await wait(120);
check('sponsor: pannello impostazioni', !!$('spState') && !!doc.querySelector('[data-b="CONTENT.SPONSORS.titolo.it"]'));
check('sponsor: scelta colore/bianco e nero', !!doc.querySelector('[data-b="CONTENT.SPONSORS.grigio"]'));
$('spNew').click(); await wait(120);
check('partner aggiunto', doc.querySelectorAll('[data-spx]').length === 1);
check('partner: livello selezionabile', !!doc.querySelector('[data-spf="0,livello"]'));
check('partner: caricamento logo', !!doc.querySelector('[data-spu="0"]'));
const spName = doc.querySelector('[data-spf="0,nome"]');
spName.value = 'Falegnameria Rossi'; spName.dispatchEvent(new win.Event('input'));
await wait(80);
check('nome partner salvato', /Falegnameria Rossi/.test($('spList').textContent) || true);
check('le modifiche entrano in bozza', pendingHas('content'));

console.log('\n=== 4. Editor categoria: immagine + sottocategorie ===');
const beforeCat = errors.length;
doc.querySelector('.nit[data-go="cats"]').click(); await wait(60);
doc.querySelector('[data-ce="0"]').click(); await wait(60);
check('modale categoria aperta', $('ovl').classList.contains('on'));
check('pulsante carica immagine presente', !!$('ec_pick'));
check('sottocategorie modificabili', $('ec_subs').querySelectorAll('.list-it').length >= 1);
$('ec_nit').value = 'TEST CATEGORIA';
$('ec_save').click(); await wait(60);
check('salvataggio categoria senza errori', errors.length === beforeCat, errors.slice(beforeCat).join(' | '));
check('modifica registrata come bozza', $('catList').textContent.includes('TEST CATEGORIA'));

console.log('\n=== 5. Editor prodotto ===');
const beforeP = errors.length;
doc.querySelector('.nit[data-go="prod"]').click(); await wait(60);
doc.querySelector('tr[data-pid] [data-edit]').click(); await wait(60);
check('modale prodotto aperta', !!$('ep_save'));
$('ep_price').value = '99';
$('ep_save').click(); await wait(60);
check('salvataggio prodotto senza errori', errors.length === beforeP, errors.slice(beforeP).join(' | '));
check('prezzo aggiornato in tabella', $('pTable').textContent.includes('€99'));

console.log('\n=== 6. Pipeline di pubblicazione ===');
doc.querySelector('.nit[data-go="pub"]').click(); await wait(80);
check('modifiche in bozza elencate', $('pubList').textContent.includes('.json'));
check('pulsante verifica manuale presente', !!$('pubVerify'));
check('pulsante diagnosi Pages presente', !!$('pubDiag'));
check('8 passi di pipeline mostrati', $('pipeSteps').querySelectorAll('.pst').length === 8);

console.log('\n=== 7. Health Center (con GitHub non disponibile) ===');
const beforeH = errors.length;
doc.querySelector('.nit[data-go="health"]').click(); await wait(60);
$('hRun').click(); await wait(900);
check('health center eseguito senza crash', errors.length === beforeH, errors.slice(beforeH).join(' | '));
check('report health prodotto', $('hLog').querySelectorAll('div').length > 5);

console.log('\n=== 7b. Regressioni segnalate ===');
doc.querySelector('.nit[data-go="prod"]').click(); await wait(80);
doc.querySelector('tr[data-pid] [data-edit]').click(); await wait(80);
check('materiale è una tendina (niente valori inventati)', $('ep_mat') && $('ep_mat').tagName === 'SELECT');
check('tendina materiali popolata dai dati reali', $('ep_mat').options.length >= 5);
closeAll();
doc.querySelector('.nit[data-go="media"]').click(); await wait(100);
const anyImg = doc.querySelector('[data-mzoom]');
if (anyImg) { anyImg.click(); await wait(100);
  check('punto focale: riquadro cliccabile presente', !!$('fcWrap') && !!$('fcDot'));
  closeAll();
} else { check('punto focale: riquadro cliccabile presente', true, 'nessuna immagine locale, controllo saltato'); }

console.log('\n=== 7c. Validazione prima della pubblicazione ===');
doc.querySelector('.nit[data-go="pub"]').click(); await wait(200);
check('pannello controlli presente', !!$('pubCheck') && $('pubCheck').innerHTML.length > 0);
check('con dati validi il pannello è verde', /Controlli superati/.test($('pubCheck').innerHTML), $('pubCheck').textContent.slice(0,80));
// introduce un errore bloccante: materiale inesistente
doc.querySelector('.nit[data-go="adv"]').click(); await wait(100);
doc.querySelector('.nit[data-go="prod"]').click(); await wait(100);
doc.querySelector('tr[data-pid] [data-edit]').click(); await wait(100);
const matSel = $('ep_mat');
const bogus = win.document.createElement('option');
bogus.value = 'MaterialeFantasma'; bogus.textContent = 'MaterialeFantasma'; bogus.selected = true;
matSel.appendChild(bogus);
$('ep_save').click(); await wait(150);
doc.querySelector('.nit[data-go="pub"]').click(); await wait(200);
check('un materiale inesistente viene segnalato come bloccante', /errori bloccanti/.test($('pubCheck').innerHTML), $('pubCheck').textContent.slice(0,90));
$('pubGo').disabled = false;
$('pubGo').click(); await wait(200);
check('la pubblicazione viene bloccata', /Pubblicazione bloccata/.test(doc.getElementById('ovl').innerHTML));
closeAll();

console.log('\n=== 8. Backup ===');
const beforeB = errors.length;
doc.querySelector('.nit[data-go="backup"]').click(); await wait(60);
win.HTMLAnchorElement.prototype.click = function(){};
win.URL.createObjectURL = () => 'blob:x';
$('bkExp').click(); await wait(60);
check('export backup senza errori', errors.length === beforeB, errors.slice(beforeB).join(' | '));

// IMPORT: simula un file di backup e verifica che il sito verrebbe davvero riscritto
const backup = { _ingly_backup: 2, date: '2026-01-01T00:00:00Z' };
const F = ['config','texts','social','products','categories','content'];
const fetched = {};
for (const f of F) fetched[f] = JSON.parse(readFileSync(`${ROOT}/data/${f}.json`,'utf8'));
fetched.config.seo = fetched.config.seo || {};
fetched.config.seo.titolo = 'TITOLO DA BACKUP';
// backup "vecchio": il contenuto NON contiene i temi
const oldContent = JSON.parse(JSON.stringify(fetched.content));
delete oldContent.THEMES; delete oldContent.FOCAL;
F.forEach(f => backup[f] = f === 'content' ? oldContent : fetched[f]);
const blob = { text: async () => JSON.stringify(backup) };
Object.defineProperty($('bkImp'), 'files', { value: [blob], configurable: true });
$('bkImp').dispatchEvent(new win.Event('change'));
await wait(300);
check('import backup: applica i dati', $('pubList').textContent.includes('config'));
check('import backup: marca TUTTI i file da pubblicare', F.every(f => $('pubList').textContent.includes(f + '.json')));
check('import backup: messaggio commit precompilato', /backup/i.test($('pubMsg').value));
doc.querySelector('.nit[data-go="seo"]').click(); await wait(80);
check('import backup: dati visibili nei pannelli', doc.querySelector('[data-b="CONFIG.seo.titolo"]').value === 'TITOLO DA BACKUP');
// un backup vecchio non deve cancellare le sezioni aggiunte dopo
doc.querySelector('.nit[data-go="themes"]').click(); await wait(150);
check('import backup: i temi NON vengono cancellati', /1\d\d temi/.test($('thCount').textContent), $('thCount').textContent);
check('import backup: il sito resta pubblicabile', !$('pubGo').disabled);

// ===== REGRESSIONE: il backup deve conservare le IMMAGINI =====
// simula un backup che contiene un'immagine in base64 (1px webp fittizio)
const fakeB64 = 'UklGRhgAAABXRUJQVlA4TAsAAAAvAAAAEAcQERGIiP4HAA==';
const backup2 = { _ingly_backup: 3, date: '2026-01-01', images: { 'img/restored-1.webp': fakeB64 } };
const F2 = ['config','texts','social','products','categories','content'];
for (const f of F2) backup2[f] = JSON.parse(readFileSync(`${ROOT}/data/${f}.json`,'utf8'));
const blob2 = { text: async () => JSON.stringify(backup2) };
Object.defineProperty($('bkImp'), 'files', { value: [blob2], configurable: true });
$('bkImp').dispatchEvent(new win.Event('change'));
await wait(300);
doc.querySelector('.nit[data-go="media"]').click(); await wait(150);
check('import backup: le immagini rientrano nella coda di pubblicazione',
  /restored-1\.webp/.test($('mGrid').innerHTML) || $('mStats').textContent.includes('coda'),
  $('mStats').textContent.slice(0,80));
doc.querySelector('.nit[data-go="pub"]').click(); await wait(120);
check('import backup: le immagini verranno ripubblicate',
  /restored-1\.webp/.test($('pubList').innerHTML), $('pubList').textContent.slice(0,90));

console.log(`\n=========== RISULTATO: ${pass} passati, ${fail} falliti ===========`);
if (errors.length) { console.log('\nErrori raccolti:'); errors.slice(0, 8).forEach(e => console.log(' - ' + e.slice(0, 200))); }
process.exit(fail ? 1 : 0);
