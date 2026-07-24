# Da qui ad Awwwards — piano realistico

La lista che hai inviato contiene oltre 200 voci. Alcune sono già fatte, molte sono ottime idee
realizzabili, altre **non sono possibili su un sito statico** e alcune non converrebbero comunque.
Questa è la lettura onesta, divisa per fattibilità.

---

## ✅ Già fatto (v3.2)
Barra di avanzamento scroll · navbar con sfondo sfocato · animazioni di sezione con ingresso scaglionato ·
transizioni di pagina · reveal on scroll · rispetto di `prefers-reduced-motion` · ricerca con suggerimenti ·
filtri condivisibili nell'URL · lightbox con tastiera · WhatsApp flottante · portfolio indipendente dal
catalogo · recensioni con stelle, foto e verifica · sponsor con livelli e `rel="sponsored"` ·
Media Library con doppioni e orfane · WebP + varianti responsive · punto focale · 103 temi con sfondi
generati · fascia promozionale programmata · scala tipografica · sitemap e robots automatici ·
pubblicazione atomica con validazione, anteprima e cronologia.

---

## 🎯 Fattibile e ad alto valore — nell'ordine che consiglio

**1. Portfolio come progetto completo** (2–3 giorni)
Oggi una tessera ha titolo, foto e link. Diventerebbe: più immagini, prima/dopo, video, cliente, data,
materiali, tecnologie, macchina usata, durata, settore, tag, progetto in evidenza, prodotti e recensioni
collegati, link social, e il **racconto del progetto**. È la cosa che distingue davvero uno studio premium
da un catalogo: la storia del lavoro fatto.

**2. Galleria portfolio in masonry con filtri animati** (1–2 giorni)
Layout a mattoncini, filtri per materiale/tecnologia/settore, lightbox a schermo intero con swipe,
segnaposto sfocato durante il caricamento.

**3. Command palette (Ctrl+K) + "visti di recente"** (1 giorno)
Ricerca istantanea di prodotti, categorie e pagine da tastiera. È il dettaglio che fa dire «questo sito
è fatto bene» a chi se ne intende, e su mobile non intralcia.

**4. Schema.org completo** (mezza giornata)
Product, Review, LocalBusiness, Organization, FAQ, Breadcrumb, ImageObject. Si traduce in stelle e
informazioni ricche nei risultati Google: è SEO che si vede.

**5. Configuratore con anteprima dell'incisione** (3–4 giorni)
Il cliente scrive il testo, sceglie il font e vede l'anteprima sul materiale. Alza moltissimo la
conversione sulle personalizzazioni ed è tutto realizzabile nel browser con canvas.

**6. PWA + Service Worker** (1 giorno)
Installabile, funzionante offline, caricamenti istantanei alla seconda visita.

**7. Wishlist, confronto, viste recenti, quick view** (2 giorni)
Tutto in `localStorage`, nessun server necessario.

**8. Admin: annulla/ripristina, salvataggio automatico, scorciatoie, tabelle ordinabili** (2 giorni)
Il pannello è già solido; questi dettagli lo rendono piacevole da usare tutti i giorni.

**9. Accessibilità WCAG AA verificata** (1 giorno)
Contrasti, focus visibili, ARIA, navigazione completa da tastiera. Va misurata, non dichiarata.

**10. AVIF oltre a WebP** (mezza giornata)
Il browser sceglie da solo il formato più leggero.

---

## ⚠️ Possibile ma con riserve

**Video di sfondo nella hero** — bellissimo, ma pesa. Da fare solo con video corto, compresso, senza
audio, disattivato su mobile e con `prefers-reduced-motion`. Altrimenti si perde in prestazioni ciò che
si guadagna in effetto.

**Feed Instagram automatico** — richiede account Business e un token da rinnovare ogni 60 giorni tramite
GitHub Action. Fattibile, ma è manutenzione ricorrente: valuta se ne vale la pena rispetto a caricare le
foto migliori a mano.

**Mega menu** — con 12 categorie e 42 prodotti il menu attuale basta. Diventa utile oltre le ~100 voci.

**Modalità chiara** — l'identità INGLY è scura. Servirebbe soprattutto per la stampa dei preventivi.

---

## ❌ Non possibile su GitHub Pages (serve un backend)
Visitatori di oggi e analytics proprie · contatore clic sugli sponsor · ordini · chat dal vivo ·
ruoli, permessi e scadenza sessione · email automatiche · Lighthouse 100 garantito su tutto ·
anteprima AR e visore 360° (richiedono modelli 3D per ogni prodotto, non solo codice) ·
rimozione EXIF lato server · generazione automatica dei testi alternativi.

Diverse di queste diventano possibili spostando il sito su **Cloudflare Pages** o **Vercel** (gratuiti
per questi volumi), mantenendo gli stessi JSON: analytics, contatore clic, email, ruoli reali.
È il passo naturale quando serviranno pagamenti e area clienti.

---

## Una nota che conta più delle funzioni
Nessuna di queste voci vale quanto **fotografie coerenti dei lavori reali**. Un sito con animazioni
perfette e foto disomogenee sembra un template; un sito semplice con fotografia impeccabile sembra
un laboratorio di alta gamma. Fondo scuro, una sola luce laterale, stessa inquadratura, stesso rapporto.
È l'investimento con il ritorno più alto che puoi fare, e non dipende dal codice.
