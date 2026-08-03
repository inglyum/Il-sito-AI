/* ============ SFONDI DEL SITO ============
   Tre sfondi per il tema chiaro e tre per quello scuro, scelti dall'Admin.

   Il pannello «Sfondo Sito» esisteva già e salvava la scelta in
   CONFIG.siteBg — ma nessuno la leggeva: cambiare sfondo non cambiava niente
   sul sito. Qui la scelta diventa reale, e diventa una per tema: chiaro e
   scuro sono due ambienti diversi e uno sfondo che sta bene su uno può
   rendere illeggibile il testo sull'altro.

   Perché non Vanta.js o simili: quelle librerie animano con WebGL e si
   portano dietro three.js — oltre mezzo megabyte, da un server esterno, con
   la GPU che gira a vuoto anche sui telefoni. Abbiamo appena tolto 87KB di
   JavaScript morto: rimetterne sei volte tanto per uno sfondo sarebbe un
   pessimo scambio. Questi sfondi sono CSS puro, pesano qualche riga e non
   scaricano niente.

   Regola di sicurezza: un valore sconosciuto, vuoto o rotto ricade sempre
   sullo sfondo attuale. Chi non sceglie non vede cambiare nulla.

   Funzioni pure: nessun DOM. Verificabili in tests/test-sfondi.mjs. */

/* Il catalogo. `id` finisce in un attributo HTML, `anima` dice se il fondo si
   muove — serve all'Admin per avvisare, e a noi per spegnerlo quando il
   sistema chiede meno animazioni. */
export const SFONDI = {
  scuro: [
    { id: 'default', nome: 'Notte profonda', anima: false,
      descrizione: 'Lo sfondo attuale: blu profondo, fermo. Il più leggibile di tutti.' },
    { id: 'aurora', nome: 'Aurora', anima: true,
      descrizione: 'Due veli di luce che scorrono lentamente, come un\'aurora. Molto lento: si nota senza distrarre.' },
    { id: 'nebbia', nome: 'Nebbia luminosa', anima: true,
      descrizione: 'Banchi di foschia che respirano piano, illuminati dal basso.' },
  ],
  chiaro: [
    { id: 'default', nome: 'Carta', anima: false,
      descrizione: 'Lo sfondo attuale: bianco caldo, fermo.' },
    { id: 'alba', nome: 'Alba', anima: true,
      descrizione: 'Sfumature calde che si muovono appena, come la luce del mattino.' },
    { id: 'nuvole', nome: 'Nuvole', anima: true,
      descrizione: 'Nuvole chiare che attraversano la pagina molto lentamente.' },
  ],
};

/* I due temi che esistono. Scritto una volta sola perché non si sfilaccino
   stringhe 'chiaro'/'scuro' in mezzo al codice. */
export const TEMI = ['chiaro', 'scuro'];

export function elenco(tema){
  return SFONDI[tema] || [];
}

/* Uno sfondo esiste per quel tema? */
export function valido(tema, id){
  return elenco(tema).some(s => s.id === id);
}

export function info(tema, id){
  return elenco(tema).find(s => s.id === id) || elenco(tema)[0] || null;
}

/* La scelta buona, comunque siano fatti i dati.
   Accetta anche il vecchio formato — CONFIG.siteBg era una stringa sola,
   senza distinzione di tema — così una configurazione salvata prima non
   manda in bianco il sito. */
export function scelta(config = {}){
  const s = config.sfondi;
  const preso = t => {
    const v = s && typeof s === 'object' ? s[t] : null;
    return valido(t, v) ? v : 'default';
  };
  return { chiaro: preso('chiaro'), scuro: preso('scuro') };
}

/* Gli attributi da mettere su <html>. Sono due, non uno, perché il tema si
   cambia dal sito con l'interruttore: entrambi devono essere già lì, pronti,
   altrimenti al primo scambio lo sfondo resterebbe indietro. */
export function attributi(config = {}){
  const s = scelta(config);
  return { 'data-sfondo-chiaro': s.chiaro, 'data-sfondo-scuro': s.scuro };
}
