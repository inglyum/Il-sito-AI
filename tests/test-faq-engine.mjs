/* Test del motore FAQ.
   Il rischio più serio qui non è l'HTML rotto: è generare una risposta
   INVENTATA. Una FAQ che dichiara un prezzo o un tempo che il prodotto non ha
   è un'informazione falsa pubblicata sul sito. Diversi test servono proprio a
   verificare che, senza il dato, la domanda non venga proprio generata. */
import * as F from '../assets/js/faq-engine.js';

let ok = 0, ko = 0;
const check = (n, c) => { if(c){ ok++; console.log('  ✔ ' + n) } else { ko++; console.log('  ✖ ' + n) } };

const completo = {
  id: 7, n: { it: 'Cake Topper Matrimonio' }, price: 34.99, prod: 3,
  misure: [['Larghezza', '20 cm'], ['Altezza', '15 cm']],
};
const opt = { L: 'it', materiale: 'Plexiglass', categoria: 'Eventi', azienda: 'INGLY DESIGN' };
const testoDi = a => JSON.stringify(a);

console.log('\n=== 1. Domande generate dai dati ===');
const auto = F.automatiche(completo, opt);
check('genera più domande', auto.length >= 5);
check('ogni voce è domanda + risposta', auto.every(f => f.length === 2 && f[0] && f[1]));
check('nomina il prodotto', auto.every(f => f[0].includes('Cake Topper Matrimonio')));
check('dichiara il materiale reale', testoDi(auto).includes('Plexiglass'));
check('dichiara il prezzo reale', testoDi(auto).includes('€34,99'));
check('dichiara i giorni reali', testoDi(auto).includes('3 giorni'));
check('riporta le misure reali', testoDi(auto).includes('20 cm'));

console.log('\n=== 2. Senza dato, nessuna domanda inventata ===');
const scarno = { id: 9, n: { it: 'Targa Semplice' } };
const autoScarno = F.automatiche(scarno, { L: 'it' });
check('senza prezzo non parla di prezzo', !/costa|€/i.test(testoDi(autoScarno)));
check('senza tempi non parla di tempi', !/giorni lavorativi/i.test(testoDi(autoScarno)));
check('senza misure non parla di misure', !/misure ha/i.test(testoDi(autoScarno)));
check('senza materiale non lo dichiara', !/materiale è/i.test(testoDi(autoScarno)));
check('resta comunque la personalizzazione', autoScarno.some(f => /personalizzare/i.test(f[0])));
check('prezzo a zero non genera la domanda',
  !/costa/i.test(testoDi(F.automatiche({ id: 1, n: { it: 'X' }, price: 0 }, {}))));
check('senza nome non genera nulla', F.automatiche({ id: 1 }, {}).length === 0);
check('un giorno solo è al singolare',
  /1 giorno lavorativo/.test(testoDi(F.automatiche({ id: 1, n: { it: 'X' }, prod: 1 }, {}))));

console.log('\n=== 3. Precedenze e doppioni ===');
const conManuali = {
  ...completo,
  faq: [[{ it: 'Di che materiale è Cake Topper Matrimonio?' }, { it: 'Risposta scritta a mano.' }],
        [{ it: 'Domanda solo mia?' }, { it: 'Sì.' }]],
};
const globali = [[{ it: 'Quanto dura la spedizione?' }, { it: '2-5 giorni.' }],
                 [{ it: 'Domanda solo mia?' }, { it: 'Duplicato da scartare.' }]];
const tutte = F.perProdotto(conManuali, globali, { ...opt, max: 20 });
check('la risposta scritta a mano vince',
  tutte.find(f => /Di che materiale/.test(f[0]))[1] === 'Risposta scritta a mano.');
check('le domande manuali vengono prima', tutte[0][1] === 'Risposta scritta a mano.');
check('include anche le generali', tutte.some(f => /spedizione/i.test(f[0])));
check('nessuna domanda ripetuta',
  new Set(tutte.map(f => f[0].toLowerCase())).size === tutte.length);
check('rispetta il numero massimo',
  F.perProdotto(conManuali, globali, { ...opt, max: 3 }).length === 3);
check('senza FAQ globali funziona lo stesso', F.perProdotto(completo, [], opt).length > 0);
check('scarta le voci incomplete',
  !F.perProdotto({ ...completo, faq: [[{ it: 'Senza risposta' }, { it: '' }]] }, [], opt)
    .some(f => f[0] === 'Senza risposta'));

console.log('\n=== 4. Dati strutturati ===');
const s = F.schema(tutte, { url: 'https://x/product/7/' });
check('è una FAQPage', s['@type'] === 'FAQPage');
check('ogni voce è una Question', s.mainEntity.every(q => q['@type'] === 'Question'));
check('ogni domanda ha una risposta accettata',
  s.mainEntity.every(q => q.acceptedAnswer['@type'] === 'Answer' && q.acceptedAnswer.text));
check('dichiara un @id ancorato alla pagina', s['@id'] === 'https://x/product/7/#faq');
check('senza domande non produce nulla', F.schema([]) === null);
check('scarta le voci senza risposta', F.schema([['D', '']]) === null);

console.log('\n=== 5. Blocco leggibile ===');
const h = F.html(tutte);
check('usa details/summary', h.includes('<details>') && h.includes('<summary>'));
check('una voce per domanda', (h.match(/<details>/g) || []).length === tutte.length);
check('ha un titolo di sezione', /<h2>Domande frequenti<\/h2>/.test(h));
check('senza domande non produce nulla', F.html([]) === '');

console.log('\n=== 6. Protezione del testo ===');
const cattivo = F.html([['<script>alert(1)</script>', '"><img onerror=x>']]);
check('niente script iniettabili', !/<script/i.test(cattivo));
check('le virgolette sono protette', !/"><img/.test(cattivo));
const sCattivo = F.schema([['<b>D</b>', '<i>R</i>']]);
check('il markup viene tolto dalle domande dello schema',
  !/[<>]/.test(F.perProdotto({ n: { it: 'X' }, faq: [[{ it: '<b>D</b>' }, { it: '<i>R</i>' }]] }, [], {})[0][0]));
check('lo schema resta JSON valido', typeof JSON.stringify(sCattivo) === 'string');

console.log(`\n=========== FAQ ENGINE: ${ok} passati, ${ko} falliti ===========\n`);
process.exit(ko ? 1 : 0);
