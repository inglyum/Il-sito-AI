# Il catalogo derivato dal parco macchine

> Versione leggibile: https://claude.ai/code/artifact/1ada3728-b7d7-44d0-a515-93dd90ed336a
> Dati: `data/macchine.json` (capacità) e `data/famiglie.json` (26 famiglie).
> Specifiche xTool verificate ad agosto 2026 sulle schede del produttore.

## Tre macchine, tre mestieri

| | Ruolo | Fa | Non fa |
|---|---|---|---|
| **Laser CO2** (10.600 nm) | La forma | Taglia e incide legno, compensato, plexiglass, pelle, sughero, carta, tessuto, ardesia; satina il vetro. L'unica che sagoma e l'unica in grande formato | Metallo nudo. Colore: brucia, non stampa |
| **xTool F2 Ultra** (MOPA 60 W + diodo 40 W) | Il metallo, e il colore sul metallo | Inox e ottone fino a 2 mm, alluminio 1 mm. **100+ colori per ossidazione** su inox e titanio. 15.000 mm/s, 0,2 mm. Diodo: legno fino a 23 mm | Oltre 220 × 220 mm. Vetro, pietra |
| **xTool O1 Omni Dual UV** (CMYK + bianco rigido/flessibile + vernice) | Il colore su qualunque cosa | Vetro, metallo, plexiglass, legno, pelle, ceramica, plastica, tessuto. A3+ (330×420×150). **Rotativo per cilindri** | Tagliare o sagomare. Fuori da A3+ |

**La tesi:** il CO2 fa la forma, la F2 fa il metallo, la UV fa il colore. Nessuna
sa fare il mestiere delle altre — per questo insieme valgono più di tre volte una.

## Il vantaggio: metà catalogo è impreventivabile per la concorrenza

Quasi tutti i laboratori italiani hanno **una** macchina. Quando un prodotto
richiede due o tre lavorazioni, il concorrente mono-macchina non può abbassare
il prezzo: **non può fare il pezzo**. Deve subappaltare, e perde su tempi,
margine e controllo. Non è un vantaggio di prezzo, è un vantaggio di esistenza.

- **26 famiglie** realizzabili con il parco attuale
- **13** richiedono 2 o 3 macchine
- **273 configurazioni vendibili** da **72 scatti** → resa **3,8×**

**L'esempio più chiaro:** un cartello UNI EN ISO 7010 *deve* essere rosso, giallo,
verde o blu — il colore è la norma, non l'estetica. Chi ha il solo CO2 taglia la
sagoma perfetta e non può renderla conforme. Voi tagliate al CO2 e stampate i
colori normati in UV, stesso giorno, stessa officina.

## Vincoli che decidono cosa non promettere

| Macchina | Area utile | Conseguenza |
|---|---|---|
| xTool F2 Ultra | 220 × 220 mm | Metallo solo di piccolo formato: targhette, medagliette, biglietti, targhe fino a 20 cm |
| xTool O1 Omni Dual UV | 330 × 420 × 150 mm | A3+ e oggetti spessi fino a 15 cm; cilindri col rotativo |
| Laser CO2 | **da confermare** | **L'unico dato mancante.** Decide se tableau, misuratori d'altezza e insegne grandi entrano a catalogo |

Le famiglie che dipendono da questo dato sono marcate `grandeFormato: true` in
`data/famiglie.json`, così non vengono pubblicate prima della conferma.

## Materiali da non lavorare mai

Non è una preferenza: è sicurezza e integrità della macchina.

| Materiale | Perché |
|---|---|
| **PVC e vinile** | Libera cloro gassoso: tossico e corrosivo per ottica e guide. Il materiale che ha ucciso più macchine |
| **Policarbonato (Lexan)** | Brucia e ingiallisce sul bordo, non taglia mai pulito |
| **ABS** | Fonde invece di vaporizzare, fumi nocivi |
| **PTFE (Teflon)** | Composti fluorurati pericolosi |
| **Fibra di carbonio, vetroresina** | Polveri e resine dannose, taglio scadente |
| **Pelle conciata al cromo** | Cromo esavalente. Solo conciata al vegetale |

Da **pubblicare come pagina**, non solo rispettare: chi cerca «si può incidere il
PVC» va aiutato con una risposta vera, e chi la scrive diventa la fonte. È fra le
pagine più citate dagli assistenti AI in questo settore.

## Le cinque famiglie da fare per prime

1. **Portamenu da tavolo** (CO2 + UV) — porta d'ingresso all'HORECA. Nessun
   concorrente col solo CO2 mette il logo a colori. Il ristoratore torna 4 volte
   l'anno.
2. **Premi e trofei** (tutte e tre) — margine più alto del catalogo e
   dimostrazione visibile del vantaggio: base CO2 + targhetta F2 + logo UV.
3. **Medagliette per animali** (F2) — ciò che la F2 fa meglio di ogni altra
   macchina: pezzo piccolo, metallo, colore, 15.000 mm/s. Canale B2B naturale
   (veterinari, toelettature) che nessuno presidia.
4. **Calici e bottiglie** (UV rotativo) — capacità rara in zona. Enoteche,
   birrifici e cantine ordinano per stagione e ripetono. In terra di Sangiovese
   è il canale più corto che avete.
5. **Ritratto sagomato dal tuo disegno** (CO2 + UV) — sostituisce i prodotti a
   tema Marvel e Ghibli: stessa lavorazione, stesso prezzo, nessun rischio, e
   nessuno lo può copiare perché il soggetto non esiste finché non arriva
   l'ordine.

## Prossimo passo

Serve un dato: **potenza e dimensione del piano del CO2**. Sblocca le ultime due
famiglie di grande formato e completa `data/macchine.json`.
