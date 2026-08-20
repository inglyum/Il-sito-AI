/* Inietta dizionario e motore multilingua dentro il file standalone.
   Il file deve restare autosufficiente — si apre con un doppio clic, senza
   server — quindi il dizionario non può stare in un JSON a parte: va cucito
   dentro. Questo script lo fa in modo ripetibile, fra due marcatori, così
   rilanciarlo aggiorna invece di duplicare. */
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(RADICE, 'INGLY-OS-v52-STANDALONE.html');
const APRI = '<!-- INGLY-LINGUA:INIZIO -->';
const CHIUDI = '<!-- INGLY-LINGUA:FINE -->';

const catalogo = JSON.parse(await readFile(join(RADICE,'data','os-i18n.json'),'utf8'));
const dizionario = Object.fromEntries(Object.entries(catalogo.it_en).filter(([,v]) => v));

const MOTORE = String.raw`
<script>
/* ══════════════════ INGLY OS · LINGUA ══════════════════
   Traduzione del DOM già disegnato.

   Perché non le chiamate t('chiave') sparse nel codice: le 123 viste nascono
   da template literal dentro un file unico da 107.000 righe. Metterci una
   chiamata su ognuna delle ~2.900 stringhe vorrebbe dire toccare 2.900 punti
   in un file senza test — e ogni tocco è un'occasione di romperne uno.

   Qui il dizionario mappa la frase italiana ESATTA alla sua traduzione, e la
   sostituzione avviene solo sulle corrispondenze INTERE. Quello che non è nel
   dizionario resta com'è: un numero, un codice, il nome di un cliente non
   possono essere tradotti per sbaglio. È la proprietà che rende sicuro
   applicarlo a un'app grande senza riscriverla.

   Le viste si ridisegnano in continuazione: un MutationObserver ripassa solo
   sui rami cambiati, non su tutta la pagina. */
(function(){
  'use strict';
  var DIZ = __DIZIONARIO__;
  var CHIAVE = 'ingly_os_lingua';
  var lingua = 'it';
  try { lingua = localStorage.getItem(CHIAVE) || 'it'; } catch(e){}

  /* Attributi che l'utente legge davvero. Il resto non si tocca. */
  var ATTR = ['placeholder','title','aria-label','alt'];
  /* Rami dove non si entra mai: dentro c'è codice, non testo da leggere. */
  var VIETATI = { SCRIPT:1, STYLE:1, TEXTAREA:1, CODE:1, PRE:1 };

  /* Le etichette a schermo raramente sono la frase nuda: hanno emoji davanti
     ("🎨 Template Documenti"), stelline dei preferiti dietro ("Smart Quoter☆☆"),
     o tutti e due. Cercare solo la corrispondenza esatta lasciava metà menu in
     italiano. Qui si stacca la cornice, si traduce il nocciolo e si rimette la
     cornice com'era — senza mai toccare quello che non è nel dizionario. */
  var CORNICE = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u;

  function traduciTesto(t){
    var s = t.trim();
    if(!s) return null;
    var v = DIZ[s];
    if(v) return t.replace(s, v);
    var m = CORNICE.exec(s);
    if(!m || !m[2]) return null;
    var nocciolo = m[2].trim();
    var tr = DIZ[nocciolo];
    if(!tr) return null;
    return t.replace(s, m[1] + tr + m[3]);
  }

  function passa(radice){
    if(lingua === 'it' || !radice) return;
    var camm = document.createTreeWalker(radice, NodeFilter.SHOW_TEXT, {
      acceptNode: function(n){
        if(n.parentNode && VIETATI[n.parentNode.nodeName]) return NodeFilter.FILTER_REJECT;
        return n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var n, cambi = [];
    while((n = camm.nextNode())){
      var nuovo = traduciTesto(n.nodeValue);
      if(nuovo !== null && nuovo !== n.nodeValue) cambi.push([n, nuovo]);
    }
    for(var i=0;i<cambi.length;i++) cambi[i][0].nodeValue = cambi[i][1];

    var elems = radice.querySelectorAll ? radice.querySelectorAll('[placeholder],[title],[aria-label],[alt]') : [];
    for(var j=0;j<elems.length;j++){
      for(var k=0;k<ATTR.length;k++){
        var a = ATTR[k], val = elems[j].getAttribute(a);
        if(!val) continue;
        var t = DIZ[val.trim()];
        if(t) elems[j].setAttribute(a, t);
      }
    }
  }

  /* Le viste si ridisegnano di continuo: si ripassa solo sul ramo cambiato. */
  var osserva = null;
  function accendiOsservatore(){
    if(osserva || !window.MutationObserver) return;
    osserva = new MutationObserver(function(muta){
      if(lingua === 'it') return;
      for(var i=0;i<muta.length;i++){
        var m = muta[i];
        for(var j=0;j<m.addedNodes.length;j++){
          var n = m.addedNodes[j];
          if(n.nodeType === 1) passa(n);
          else if(n.nodeType === 3){
            var v = traduciTesto(n.nodeValue);
            if(v !== null) n.nodeValue = v;
          }
        }
      }
    });
    osserva.observe(document.body, { childList:true, subtree:true });
  }

  function imposta(l){
    var cambiata = l !== lingua;
    lingua = (l === 'en') ? 'en' : 'it';
    try { localStorage.setItem(CHIAVE, lingua); } catch(e){}
    document.documentElement.setAttribute('lang', lingua);
    var b = document.getElementById('ingly-lingua-btn');
    if(b) b.textContent = lingua === 'en' ? '🇬🇧 EN' : '🇮🇹 IT';
    /* Tornare all'italiano richiede il testo originale: si ricarica.
       È il prezzo onesto della traduzione a valle — e succede una volta. */
    if(cambiata && lingua === 'it') { location.reload(); return; }
    passa(document.body);
    accendiOsservatore();
  }

  function pulsante(){
    if(document.getElementById('ingly-lingua-btn')) return;
    var b = document.createElement('button');
    b.id = 'ingly-lingua-btn';
    b.type = 'button';
    b.setAttribute('aria-label','Cambia lingua / Switch language');
    b.style.cssText = 'position:fixed;bottom:16px;left:16px;z-index:99998;' +
      'background:var(--bg-card,#1a1f2e);color:var(--text,#e6e9ef);' +
      'border:1px solid var(--border,#2a3142);border-radius:99px;' +
      'padding:7px 14px;font-size:12px;font-weight:800;cursor:pointer;' +
      'box-shadow:0 4px 14px rgba(0,0,0,.35);font-family:inherit';
    b.textContent = lingua === 'en' ? '🇬🇧 EN' : '🇮🇹 IT';
    b.onclick = function(){ imposta(lingua === 'en' ? 'it' : 'en'); };
    document.body.appendChild(b);
  }

  window.INGLYLingua = {
    imposta: imposta,
    attuale: function(){ return lingua; },
    copertura: function(){
      var tot = 0, viste = {};
      var c = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      var n; while((n = c.nextNode())){
        var s = n.nodeValue.trim();
        if(s.length > 2 && !VIETATI[n.parentNode.nodeName]){ tot++; if(DIZ[s]) viste[s] = 1; }
      }
      return { visibili: tot, nelDizionario: Object.keys(viste).length,
               dizionario: Object.keys(DIZ).length };
    }
  };

  function avvia(){ pulsante(); if(lingua === 'en'){ passa(document.body); accendiOsservatore(); } }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia);
  else avvia();
})();
</script>`;

const blocco = APRI + MOTORE.replace('__DIZIONARIO__', JSON.stringify(dizionario)) + '\n' + CHIUDI;

let html = await readFile(FILE, 'utf8');
const i = html.indexOf(APRI), j = html.indexOf(CHIUDI);
if(i >= 0 && j > i){
  html = html.slice(0, i) + blocco + html.slice(j + CHIUDI.length);
} else {
  /* ATTENZIONE: nel file ci sono decine di </body> dentro i template literal
     che generano PDF e stampe, e il documento non ne ha uno finale suo: chiude
     direttamente con </html>. Sostituire il primo </body> infila il motore
     dentro una stringa JavaScript, dove non verrà mai eseguito — è successo
     davvero. L'unico ancoraggio univoco è l'ULTIMO </html>. */
  const fine = html.lastIndexOf('</html>');
  if(fine < 0) throw new Error('</html> non trovato: impossibile iniettare il motore');
  html = html.slice(0, fine) + blocco + '\n' + html.slice(fine);
}
await writeFile(FILE, html);

const tot = Object.keys(catalogo.it_en).length;
console.log(`  ✔ motore lingua iniettato · ${Object.keys(dizionario).length} voci tradotte su ${tot} (${Math.round(Object.keys(dizionario).length/tot*100)}%)`);
