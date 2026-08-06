# Fonti dei disegni, strumenti e regole di licenza

> Versione leggibile: https://claude.ai/code/artifact/fa296863-c620-4610-bb8a-3de97ab69952
> Licenze verificate ad agosto 2026. **Cambiano**: riverificare prima di un uso
> commerciale continuativo.

## Regola unica

Se non si può risalire a **chi** ha disegnato un file e con **quale** licenza,
il file non entra in produzione. Una licenza inesistente non è una difesa: la
responsabilità di chi vende il prodotto finale resta nostra.

Studiare i concorrenti su Etsy (volumi, prezzi, titoli, stagionalità) è ricerca
di mercato ed è legittima. Scaricarne i file e rivenderli, anche modificati, è
opera derivata: rimozione e sospensione su una singola segnalazione valida.

## Livello A — pubblico dominio / CC0 · rischio zero

| Fonte | Contenuto | Licenza |
|---|---|---|
| [Smithsonian Open Access](https://www.si.edu/openaccess) | 4,5 M immagini, API + dataset su AWS | CC0 |
| [Met Open Access](https://www.metmuseum.org/art/collection) | opere PD del Metropolitan, API | CC0 |
| [Biodiversity Heritage Library](https://www.biodiversitylibrary.org/) | 150.000+ tavole botaniche (Flickr) | PD / CC0 |
| [Rawpixel Public Domain](https://www.rawpixel.com/public-domain) | scansioni di libri antichi, PNG scontornati | CC0 |
| [Wikimedia Commons](https://commons.wikimedia.org/) | stemmi, mappe storiche, simboli | **varia, leggere per file** |
| [NYPL Digital Collections](https://digitalcollections.nypl.org/) · [Digital Commonwealth](https://www.digitalcommonwealth.org/) | archivi storici, mappe di città | PD (filtro dedicato) |

### Caratteri tipografici — il rischio più sottovalutato
Il prodotto **è** il carattere con cui è inciso, e le fonderie controllano.
Usare solo font [SIL Open Font License](https://openfontlicense.org/), che
consente esplicitamente l'incorporazione in prodotti venduti:
[Google Fonts](https://fonts.google.com/) (OFL o Apache 2.0),
[Fontshare](https://www.fontshare.com/), [Velvetyne](https://velvetyne.fr/).

**Da fare:** fissare 12–15 caratteri approvati e non usare altro.

## Livello B — abbonamenti con licenza commerciale · rischio basso

Vincolo comune: si può vendere **l'oggetto**, non si può rivendere **il file**.

| Fonte | Prodotto fisico | Note |
|---|---|---|
| [Creative Fabrica](https://www.creativefabrica.com/) | sì, POD completo, vendite illimitate | ricamo escluso ([licenza](https://www.creativefabrica.com/subscription-license/)) |
| [Design Bundles](https://designbundles.net/) · [So Fontsy](https://sofontsy.com/) | sì | 700+ file gratuiti già con licenza commerciale |
| [Envato Elements](https://elements.envato.com/) | sì | serve registrare la licenza per progetto |
| [Vecteezy](https://www.vecteezy.com/) · [Freepik](https://www.freepik.com/) | sì nel piano a pagamento | nel gratuito l'attribuzione è obbligatoria |

## Livello C — librerie dei costruttori · verificare

Il valore vero non è il disegno: sono i **parametri di potenza e velocità per
materiale**, che risparmiano giornate di prove.

- [Epilog Sample Club](https://www.epiloglaser.com/laser-sample-club/) — progetti con note di lavorazione
- [Trotec Laser Projects](https://www.troteclaser.com/en/laser-projects) — ottimi, **licenza non dichiarata**: imparare sì, vendere no senza chiedere
- [xTool](https://www.xtool.com/) · [Glowforge](https://glowforge.com/) — legate all'acquisto macchina

## Livello D — da evitare

Gli aggregatori «migliaia di file laser gratis per uso commerciale» in larga
parte raccolgono materiale altrui senza autorizzazione. Non hanno titolo per
concedere una licenza che non possiedono.

## Strumenti

### Geometria generata (niente disegno)
- [boxes.py](https://festi.info/boxes.py/) — open source, generatori parametrici, incastri, export LightBurn, estensione Inkscape
- [MakerCase](https://en.makercase.com/) — scatole con anteprima 3D
- [Deepnest](https://deepnest.io/) — nesting open source; **su produzione B2B ripetitiva è la voce che sposta il margine**

### Da immagine a vettore
- [Vectorizer.AI](https://vectorizer.ai/) — migliore qualità, pochi nodi, export DXF
- [Inkscape](https://inkscape.org/) + Potrace — gratuito, strumento di pulizia quotidiano
- [Recraft](https://www.recraft.ai/) — genera SVG da testo
- Illustrator *Image Trace* — il più controllabile a mano

**Cautela AI:** ottimo punto di partenza, pessimo punto di arrivo (linee
sovrapposte, spessori incoerenti, dettagli che a 3 mm diventano poltiglia).
Va sempre ridisegnato sopra — anche perché in Italia la tutela di un'opera
puramente generata è incerta: serve un contributo creativo umano.

### Ricerca di mercato
| Strumento | Forte in | Costo |
|---|---|---|
| [eRank](https://erank.com/) | parole chiave, piano gratuito usabile | 0–10 €/m |
| [EverBee](https://everbee.io/) | stima vendite per inserzione | ~30 €/m |
| [Alura](https://www.alura.io/) | analisi di un negozio concorrente | ~20 €/m |
| [Sale Samurai](https://salesamurai.io/) | etichette, concorrenza per nicchia | ~10 €/m |
| [Google Trends](https://trends.google.it/trends/) · [Pinterest Trends](https://trends.pinterest.com/) | stagionalità (Pinterest anticipa di 2–3 mesi) | gratis |

**Metodo:** un mese di EverBee sulle 47 voci della lista; tenere solo quelle con
prezzo medio **sopra i 25 €**. Sotto, con i costi italiani, il laser lavora per
la spedizione.
