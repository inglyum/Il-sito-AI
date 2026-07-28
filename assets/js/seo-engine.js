/* ============ SEO ENGINE ============
   Genera title, description e direttive per i motori di ricerca partendo da
   MODELLI configurabili dall'Admin, invece che da testo scritto nel codice.

   Perché a modelli: con 55 prodotti visibili, scrivere a mano titolo e
   descrizione per ognuno non è sostenibile e in pratica non viene fatto — il
   risultato sono decine di pagine con lo stesso title, che Google tratta come
   duplicati e declassa. Un modello garantisce che ogni pagina abbia un titolo
   unico e sensato dal primo giorno, restando modificabile caso per caso.

   Questo file NON tocca il DOM: sono funzioni pure, verificabili con
   tests/test-seo-engine.mjs senza browser. */

/* Modelli predefiniti: valgono finché l'Admin non li cambia.
   Senza questi, un campo vuoto produrrebbe pagine senza titolo. */
export const DEFAULTS = {
  titoloProdotto:      '{prodotto}{materialeSe} — {azienda}',
  titoloPagina:        '{pagina} — {azienda}',
  titoloHome:          '{azienda} — {claim}',
  descrizioneProdotto: '{prodotto}{materialeSe}. {descrizione} Produzione in {giorni} giorni, spedizione da {citta}.',
  descrizionePagina:   '{descrizione}',
  separatore:          ' — ',
};

/* Limiti oltre i quali Google tronca nei risultati di ricerca.
   Non sono regole assolute: servono a segnalare, non a bloccare. */
export const LIMITI = { titoloMax: 60, descrizioneMax: 155, titoloMin: 15, descrizioneMin: 70 };

/* Sostituisce i segnaposto {nome}. Un segnaposto senza valore sparisce, così
   un dato mancante non lascia mai "{materiale}" visibile nei risultati Google. */
export function applica(modello, valori){
  if(!modello) return '';
  return String(modello)
    .replace(/\{(\w+)\}/g, (_, k) => {
      const v = valori[k];
      return (v === undefined || v === null || v === '') ? '' : String(v);
    })
    .replace(/\s{2,}/g, ' ')            /* spazi doppi lasciati da un segnaposto vuoto */
    .replace(/\s+([,.;:])/g, '$1')      /* spazio prima della punteggiatura */
    .replace(/([,;:])\s*\1+/g, '$1')    /* punteggiatura doppia */
    .replace(/^[\s\-—·|,.;:]+|[\s\-—·|,.;:]+$/g, '')  /* separatori orfani a inizio/fine */
    .trim();
}

/* Taglia senza spezzare le parole e senza lasciare punteggiatura penzolante. */
export function tronca(testo, max){
  const t = String(testo || '').trim();
  if(t.length <= max) return t;
  const taglio = t.slice(0, max);
  const spazio = taglio.lastIndexOf(' ');
  return (spazio > max * 0.6 ? taglio.slice(0, spazio) : taglio)
    .replace(/[\s\-—·|,.;:]+$/, '') + '…';
}

/* Il nome del prodotto contiene già questa parola? Confronto senza accenti né
   maiuscole, così "Pelle" e "pelle" contano come la stessa parola. */
export function contiene(testo, parola){
  if(!testo || !parola) return false;
  const norm = s => String(s).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   /* via gli accenti */
    .replace(/[^a-z0-9]+/g, ' ').trim();
  const t = ' ' + norm(testo) + ' ';
  /* un materiale può essere composto ("PLA/PETG"): basta che una parte compaia */
  return norm(parola).split(' ').filter(w => w.length > 2).some(w => t.includes(' ' + w + ' '));
}

/* Contesto di una pagina prodotto, pronto per i modelli.
   `materialeSe` è il materiale SOLO se il nome non lo dice già: senza questo
   si ottenevano titoli come «Etichetta Bagaglio in Pelle in Pelle», che sono
   il segnale tipico di una scheda generata a macchina — Google li penalizza e
   il cliente li legge come trascuratezza. */
export function contestoProdotto(p, opt = {}){
  const { L = 'it', categoria = '', materiale = '', azienda = '', citta = '' } = opt;
  const nome = (p && p.n && p.n[L]) || '';
  const ripetuto = contiene(nome, materiale);
  return {
    prodotto:    nome,
    descrizione: (p && p.desc && p.desc[L]) || '',
    materiale,
    materialeSe: (materiale && !ripetuto) ? ' in ' + materiale : '',
    categoria, azienda, citta,
    prezzo:      p && p.price != null ? String(p.price).replace('.', ',') : '',
    giorni:      p && p.prod != null ? String(p.prod) : '',
    sku:         (p && p.sku) || '',
  };
}

export function titoloProdotto(p, cfg = {}, ctx = {}){
  const m = (cfg.template && cfg.template.titoloProdotto) || DEFAULTS.titoloProdotto;
  return tronca(applica(m, contestoProdotto(p, ctx)), LIMITI.titoloMax + 15);
}

export function descrizioneProdotto(p, cfg = {}, ctx = {}){
  const m = (cfg.template && cfg.template.descrizioneProdotto) || DEFAULTS.descrizioneProdotto;
  const testo = applica(m, contestoProdotto(p, ctx)).replace(/<[^>]+>/g, '');
  return tronca(testo, LIMITI.descrizioneMax);
}

export function titoloPagina(nomePagina, cfg = {}, ctx = {}){
  const home = nomePagina === 'home';
  const m = home
    ? ((cfg.template && cfg.template.titoloHome) || DEFAULTS.titoloHome)
    : ((cfg.template && cfg.template.titoloPagina) || DEFAULTS.titoloPagina);
  return tronca(applica(m, { pagina: ctx.pagina || '', azienda: ctx.azienda || '', claim: ctx.claim || '' }),
                LIMITI.titoloMax + 15);
}

/* Direttiva robots della pagina.
   noindex è per pagine che non devono comparire su Google (es. un'anteprima):
   il valore predefinito è sempre indicizzabile, perché il danno di un noindex
   lasciato acceso per errore è molto più grande di quello opposto. */
export function robots(page, cfg = {}){
  const r = cfg.robots || {};
  if(r.tuttoNoindex === true) return 'noindex, nofollow';
  const perPagina = (r.pagine || {})[page];
  if(perPagina === 'noindex') return 'noindex, follow';
  if(perPagina === 'nofollow') return 'index, nofollow';
  if(perPagina === 'noindex,nofollow') return 'noindex, nofollow';
  return 'index, follow, max-image-preview:large';
}

/* Diagnosi di un title/description: cosa non va, in italiano.
   Usata dall'anteprima nell'Admin per dare un riscontro immediato. */
export function diagnosi(titolo, descrizione){
  const out = [];
  const t = String(titolo || ''), d = String(descrizione || '');
  if(!t)                        out.push({ gravita: 'errore',  testo: 'Titolo mancante' });
  else if(t.length < LIMITI.titoloMin)  out.push({ gravita: 'avviso', testo: `Titolo molto corto (${t.length} caratteri): stai sprecando spazio utile` });
  else if(t.length > LIMITI.titoloMax)  out.push({ gravita: 'avviso', testo: `Titolo di ${t.length} caratteri: Google lo taglia oltre ~${LIMITI.titoloMax}` });
  if(!d)                        out.push({ gravita: 'errore',  testo: 'Descrizione mancante' });
  else if(d.length < LIMITI.descrizioneMin) out.push({ gravita: 'avviso', testo: `Descrizione corta (${d.length} caratteri): sotto ~${LIMITI.descrizioneMin} convince poco` });
  else if(d.length > LIMITI.descrizioneMax) out.push({ gravita: 'avviso', testo: `Descrizione di ${d.length} caratteri: viene troncata oltre ~${LIMITI.descrizioneMax}` });
  if(/\{\w+\}/.test(t + d))     out.push({ gravita: 'errore',  testo: 'Segnaposto non sostituito: controlla il modello' });
  return out;
}
