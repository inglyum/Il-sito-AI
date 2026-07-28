/* ============ FAQ ENGINE ============
   Domande e risposte per ogni prodotto.

   Perché contano più di una descrizione: i motori AI rispondono a domande.
   Quando qualcuno chiede a ChatGPT «di che materiale è una targa incisa» o
   «quanto ci vuole per un cake topper personalizzato», il modello cerca testo
   già in forma di domanda-risposta. Un paragrafo descrittivo copre quelle
   domande molto peggio di una risposta esplicita.

   Le domande automatiche NON inventano nulla: nascono dai dati del prodotto
   (materiale, prezzo, giorni di produzione, misure) e una domanda viene
   generata solo se il dato esiste. Meglio nessuna risposta che una inventata.

   Ordine di precedenza:
     1. le FAQ scritte a mano sul prodotto (p.faq) — hanno sempre ragione
     2. quelle generate dai dati del prodotto
     3. le FAQ generali del sito, come completamento

   Funzioni pure: nessun DOM. Verificabili in tests/test-faq-engine.mjs. */

const esc = t => String(t == null ? '' : t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const pulisci = t => String(t || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const euro = n => '€' + Number(n || 0).toFixed(2).replace('.', ',');

/* Domande costruite sui dati che il prodotto possiede davvero. */
export function automatiche(p = {}, opt = {}){
  const { L = 'it', materiale = '', categoria = '', azienda = 'INGLY DESIGN' } = opt;
  const nome = (p.n && p.n[L]) || '';
  if(!nome) return [];
  const out = [];

  if(materiale){
    out.push([
      `Di che materiale è ${nome}?`,
      `${nome} è realizzato in ${materiale}, lavorato e rifinito a mano nel laboratorio ${azienda} di Cesena.`,
    ]);
  }
  if(p.price != null && p.price > 0){
    out.push([
      `Quanto costa ${nome}?`,
      `${nome} parte da ${euro(p.price)}. Il prezzo comprende la personalizzazione; per quantità elevate si può richiedere un preventivo dedicato.`,
    ]);
  }
  if(p.prod){
    const g = p.prod === 1 ? '1 giorno lavorativo' : `${p.prod} giorni lavorativi`;
    out.push([
      `Quanto tempo serve per realizzare ${nome}?`,
      `La produzione richiede ${g}, a cui si aggiunge la spedizione (2–5 giorni in Italia).`,
    ]);
  }
  if(Array.isArray(p.misure) && p.misure.length){
    const m = p.misure.filter(r => r && r[0] && r[1]).map(r => `${r[0]}: ${r[1]}`).join(', ');
    if(m) out.push([`Che misure ha ${nome}?`, `${m}. Su richiesta si possono realizzare misure diverse.`]);
  }
  out.push([
    `${nome} si può personalizzare?`,
    `Sì. Nome, data, dedica o logo vengono incisi su misura. Prima della lavorazione si riceve una prova grafica da approvare.`,
  ]);
  if(categoria){
    out.push([
      `${nome} è adatto come regalo?`,
      `Sì, rientra nella categoria ${categoria} ed è tra le scelte più richieste come regalo personalizzato.`,
    ]);
  }
  return out;
}

/* Le FAQ complete di un prodotto, senza doppioni. */
export function perProdotto(p = {}, globali = [], opt = {}){
  const { L = 'it', max = 8 } = opt;
  /* Estrae il testo nella lingua richiesta.
     Attenzione al caso limite: con `(v && v[L]) || v` una traduzione VUOTA
     ricadeva sull'oggetto stesso — un oggetto è sempre «vero», quindi una FAQ
     senza risposta superava il controllo e finiva pubblicata mostrando
     [object Object]. Qui una stringa vuota resta vuota e viene scartata. */
  const testo = v => {
    if(v == null) return '';
    if(typeof v === 'string') return v;
    if(typeof v === 'object') return typeof v[L] === 'string' ? v[L] : '';
    return String(v);
  };
  const manuali = (Array.isArray(p.faq) ? p.faq : [])
    .map(f => Array.isArray(f) ? [testo(f[0]), testo(f[1])] : null)
    .filter(f => f && f[0] && f[1]);

  const auto = automatiche(p, opt);
  const gen = (Array.isArray(globali) ? globali : [])
    .map(f => Array.isArray(f) ? [testo(f[0]), testo(f[1])] : null)
    .filter(f => f && f[0] && f[1]);

  const viste = new Set();
  const out = [];
  for(const [d, r] of [...manuali, ...auto, ...gen]){
    const chiave = pulisci(d).toLowerCase();
    if(!chiave || viste.has(chiave)) continue;
    viste.add(chiave);
    out.push([pulisci(d), pulisci(r)]);
    if(out.length >= max) break;
  }
  return out;
}

/* Dati strutturati FAQPage — le domande possono comparire espanse su Google. */
export function schema(faqs = [], opt = {}){
  const lista = (faqs || []).filter(f => f && f[0] && f[1]);
  if(!lista.length) return null;
  const { url = '' } = opt;
  const o = {
    '@type': 'FAQPage',
    mainEntity: lista.map(([d, r]) => ({
      '@type': 'Question',
      name: d,
      acceptedAnswer: { '@type': 'Answer', text: r },
    })),
  };
  if(url) o['@id'] = url + '#faq';
  return o;
}

/* Blocco leggibile per le pagine statiche.
   <details>/<summary> è la forma che i motori riconoscono come domanda-risposta
   e che resta leggibile anche senza CSS e senza JavaScript. */
export function html(faqs = [], opt = {}){
  const lista = (faqs || []).filter(f => f && f[0] && f[1]);
  if(!lista.length) return '';
  const { titolo = 'Domande frequenti' } = opt;
  return '<section><h2>' + esc(titolo) + '</h2>' +
    lista.map(([d, r]) =>
      '<details><summary>' + esc(d) + '</summary><p>' + esc(r) + '</p></details>').join('') +
    '</section>';
}
