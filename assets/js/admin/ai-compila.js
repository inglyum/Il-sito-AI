/* ============ ASSISTENTE AI — COMPILAZIONE SCHEDA ============
   Prepara la richiesta all'AI e interpreta la risposta.

   Due principi, entrambi voluti:
   1. SI SCRIVE SOLO DOVE È VUOTO. Il lavoro fatto a mano non viene mai
      sovrascritto: l'AI è un aiuto per partire, non un correttore che decide
      al posto tuo.
   2. NIENTE DATI INVENTATI. Prezzo, materiale e tempi non si chiedono all'AI:
      sono già nella scheda e vengono passati come contesto. All'AI si chiede
      solo il testo — titolo, descrizione, parole chiave, punti di forza.

   Funzioni pure: nessuna chiamata di rete qui dentro, così sono verificabili.
   La chiamata vera la fa l'Admin con il provider configurato (Gemini è
   gratuito nel suo piano base). */

/* Quali campi mancano davvero e vale la pena chiedere. */
export function campiMancanti(p = {}, opt = {}){
  const { L = 'it' } = opt;
  const vuoto = v => v == null || String(v).trim() === '';
  const out = [];
  if(vuoto((p.desc || {})[L])) out.push('descrizione');
  if(vuoto(p.seoTitolo)) out.push('seoTitolo');
  if(vuoto(p.seoDescrizione)) out.push('seoDescrizione');
  if(!Array.isArray(p.keywords) || !p.keywords.length) out.push('keywords');
  if(!Array.isArray(p.caratteristiche) || !p.caratteristiche.length) out.push('caratteristiche');
  return out;
}

/* La richiesta: dati certi come contesto, campi mancanti come domanda. */
export function prompt(p = {}, opt = {}){
  const { L = 'it', categoria = '', materiale = '', azienda = 'INGLY DESIGN', campi = [] } = opt;
  const fatti = [
    `Nome: ${(p.n && p.n[L]) || ''}`,
    categoria && `Categoria: ${categoria}`,
    materiale && `Materiale: ${materiale}`,
    p.price != null && `Prezzo: €${Number(p.price).toFixed(2)}`,
    p.prod && `Giorni di produzione: ${p.prod}`,
    Array.isArray(p.misure) && p.misure.length &&
      `Misure: ${p.misure.filter(r => r && r[0]).map(r => r[0] + ' ' + (r[1] || '')).join(', ')}`,
    (p.desc && p.desc[L]) && `Descrizione attuale: ${p.desc[L]}`,
  ].filter(Boolean).join('\n');

  const richieste = {
    descrizione:    '"descrizione": testo di 40-70 parole, concreto, senza superlativi né frasi fatte',
    seoTitolo:      '"seoTitolo": massimo 60 caratteri, con il nome del prodotto',
    seoDescrizione: '"seoDescrizione": 140-155 caratteri, invita all\'azione senza esagerare',
    keywords:       '"keywords": 6-10 parole chiave in italiano che una persona digiterebbe su Google',
    caratteristiche:'"caratteristiche": 4-6 punti di forza brevi, uno per voce, basati SOLO sui dati forniti',
  };
  const chiesti = (campi.length ? campi : Object.keys(richieste))
    .filter(c => richieste[c]).map(c => '- ' + richieste[c]).join('\n');

  return `Prodotto artigianale di ${azienda}, laboratorio di incisione laser e stampa personalizzata a Cesena.

DATI CERTI (non contraddirli, non inventarne altri):
${fatti}

Genera SOLO questi campi:
${chiesti}

Regole: scrivi in italiano; non inventare materiali, misure, prezzi o certificazioni che non compaiono nei dati; niente promesse di consegna diverse dai giorni indicati.
Rispondi SOLO con JSON valido, senza testo attorno.`;
}

/* Interpreta la risposta e tiene solo ciò che è utilizzabile. */
export function interpreta(risposta){
  let t = String(risposta || '').trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/,'').trim();
  const i = t.indexOf('{'), j = t.lastIndexOf('}');
  if(i >= 0 && j > i) t = t.slice(i, j + 1);
  let d;
  try{ d = JSON.parse(t) }catch(e){ throw new Error('Risposta AI non leggibile') }
  if(!d || typeof d !== 'object') throw new Error('Risposta AI non leggibile');

  const testo = v => typeof v === 'string' ? v.trim() : '';
  const lista = v => Array.isArray(v)
    ? v.map(x => typeof x === 'string' ? x.trim() : '').filter(Boolean)
    : testo(v) ? testo(v).split(/[,\n]/).map(x => x.trim()).filter(Boolean) : [];

  const out = {};
  if(testo(d.descrizione)) out.descrizione = testo(d.descrizione);
  if(testo(d.seoTitolo)) out.seoTitolo = testo(d.seoTitolo).slice(0, 70);
  if(testo(d.seoDescrizione)) out.seoDescrizione = testo(d.seoDescrizione).slice(0, 165);
  if(lista(d.keywords).length) out.keywords = lista(d.keywords).slice(0, 12);
  if(lista(d.caratteristiche).length) out.caratteristiche = lista(d.caratteristiche).slice(0, 8);
  return out;
}

/* Applica il risultato SENZA toccare i campi già compilati. */
export function applica(p = {}, gen = {}, opt = {}){
  const { L = 'it' } = opt;
  const vuoto = v => v == null || String(v).trim() === '';
  const scritti = [];
  const out = { ...p };
  if(gen.descrizione && vuoto((out.desc || {})[L])){
    out.desc = { ...(out.desc || {}), [L]: gen.descrizione };
    if(!out.desc.en) out.desc.en = gen.descrizione;
    scritti.push('descrizione');
  }
  if(gen.seoTitolo && vuoto(out.seoTitolo)){ out.seoTitolo = gen.seoTitolo; scritti.push('titolo SEO') }
  if(gen.seoDescrizione && vuoto(out.seoDescrizione)){ out.seoDescrizione = gen.seoDescrizione; scritti.push('meta description') }
  if(gen.keywords && (!Array.isArray(out.keywords) || !out.keywords.length)){ out.keywords = gen.keywords; scritti.push('parole chiave') }
  if(gen.caratteristiche && (!Array.isArray(out.caratteristiche) || !out.caratteristiche.length)){ out.caratteristiche = gen.caratteristiche; scritti.push('caratteristiche') }
  return { prodotto: out, scritti };
}
