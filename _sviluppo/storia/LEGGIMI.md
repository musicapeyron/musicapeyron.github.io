# Storia della musica — come si prepara un'epoca (modello: il Medioevo)

Metodo messo a punto con Cristiano nell'ottobre 2026 su `storia-medioevo.html`.
Per le altre epoche si copia il Medioevo e si cambiano solo i dati.

## Le scelte di Cristiano (ottobre 2026): da rispettare in ogni epoca
- **Percorso guidato**: un capitolo per ogni ascolto. Il primo è un'introduzione all'epoca con un ascolto accattivante,
  poi in ordine cronologico. L'introduzione dice che cosa c'è da sapere sull'epoca (date con «d.C.» se servono,
  società, dove si fa musica); l'ultimo capitolo è «Ricapitoliamo» (linea del tempo + tutte le parole).
- **Capitoli a pagine**: 1–2 paragrafi brevi per pagina, ognuno con un'immagine d'epoca pertinente e la sua didascalia;
  si va avanti con la freccia; poi la pagina «Ascoltiamo» (video, cosa ascoltare, «Lo sapevi?», «Ascolta anche» per un
  secondo ascolto, che gli piace molto), poi «Parole da ricordare» con gli strumenti del capitolo.
- **Tutto in una schermata** su LIM e PC (zoom di adatta-schermo), il telefono scorre in verticale.
- **Banner** come prima ma da bordo a bordo dello schermo.
- **Colori**: capitoli e numeri viola = musica sacra, arancio = profana (se l'epoca ha un'altra divisione, due colori
  con lo stesso senso). Capitoli con sfondo leggermente colorato; esercizi con lo sfondo del sito.
- **Niente emoji**, tranne nei pulsanti delle schede in alto (Il percorso, Strumenti, Da suonare, Mappa concettuale,
  Esercizi, Schede) e nelle etichette del banner, che vanno bene così. Altrove: piccole icone disegnate.
- **Strumenti**: in «Che strumento è?» ogni strumento ha l'immagine d'epoca (`img`, o `epoca` se diversa) e una foto
  (`foto`: ricostruzione o strumento da museo, licenza libera, oggetto intero). Se nell'immagine d'epoca ci sono più
  strumenti, `cerchio` = ovale rosso sottile su quello giusto (coordinate su 640x400).
- **Verifica**: fronte e retro, A e B diverse e nuove a ogni apertura della pagina, «punteggio» (mai «voto»),
  soluzioni su un foglio a parte. Vero o falso stampabile in ordine sempre diverso.
- **Versione breve** solo per scheda riassuntiva e racconto completo: davvero breve e a caratteri grandi.
- **Scheda d'ascolto**: se non si può sapere dal video com'è l'esecuzione (voci sole o con strumenti...), accettare
  più risposte e dirlo a Cristiano, che può ascoltare e decidere.
- Lavoro grosso (un'epoca nuova): ramo di prova, schermate a Cristiano, poi su `main`. Ritocchi: subito su `main`.

## Come si comincia un'epoca nuova
1. Leggere la pagina attuale dell'epoca (`storia-<epoca>.html`): ascolti, video, strumenti, crediti già scelti
   (sono buoni punti di partenza; si possono riordinare o cambiare).
2. Copiare `storia-medioevo.html` come base e sostituire: banner, frase d'atmosfera, testi e dati di `CAPITOLI`, `LINEA`,
   `STRUMENTI`, `SUONARE`, `CREDITI_IMG`, `CREDITI_PAGINE`, `ATTIVITA`, cartella `IMG`, e nella chiamata
   `StoriaPercorso.avvia` epoca, date e `prossima` (l'epoca successiva). La pagina contiene **solo dati e testi**:
   tutto il codice è nei file comuni `storia-percorso.js/css` (indice, capitoli, strumenti, banner) e
   `storia-attivita.js/css` (mappa, esercizi, schede). Una modifica lì vale per tutte le epoche.
3. Far partire subito in sottofondo la ricerca e lo scaricamento delle immagini (è la parte più lenta), e intanto
   scrivere i testi delle pagine e i dati degli esercizi.
4. Prove (sotto) e schermate a Cristiano.

## Com'è fatta la pagina
- File comuni: `storia-percorso.css` + `storia-percorso.js` (percorso) e `storia-attivita.css` + `storia-attivita.js`
  (mappa, esercizi, schede). La pagina li carica e chiama `StoriaPercorso.avvia({...})` (vedi il commento in cima a
  `storia-percorso.js`); il capitolo e la finestra degli strumenti li crea lo script.
- In alto il banner da bordo a bordo; sotto le schede (Il percorso, Strumenti, Da suonare, ...).
- `CAPITOLI`: un capitolo per ogni ascolto, in ordine. Ogni capitolo ha `pagine` (una diapositiva per
  1–2 paragrafi: `{ img, did, t: [paragrafi] }`), poi l'ascolto (`brano`, `yt`, `punti`, `sapevi`,
  `altri` per il pulsante «Ascolta anche»), poi `parole` e `strumenti` (pagina «Da ricordare»).
  L'ultimo capitolo ha `riepilogo: true` (linea del tempo + tutte le parole).
- PC e LIM: blocco `@media (min-width: 900px) and (min-height: 560px)` + `adatta-schermo.js`
  (`data-schermate="#cTelaio, #contenuto"`). La diapositiva è 1280x650, l'indice 1400 di larghezza.
- Crediti: `CREDITI_IMG` (immagini «vecchie») e `CREDITI_PAGINE` (immagini delle pagine), generati.

## Mappa concettuale, Esercizi, Schede (motore comune)
`storia-attivita.js` + `storia-attivita.css` (nella radice del sito) sono **uguali per tutte le epoche**.
La pagina dell'epoca:
1. carica `storia-attivita.css` dopo `comune.css` e `<script src="storia-attivita.js"></script>` prima del suo script;
2. ha le schede `data-scheda="mappa" | "esercizi" | "schede"` e i contenitori
   `<section class="vista vista-alta" id="vistaMappa|vistaEsercizi|vistaSchede" hidden>`;
3. definisce `ATTIVITA` (vedi il Medioevo: è commentato) e chiama
   `StoriaAttivita.avvia({ epoca, date, img, capitoli, strumenti, linea, attivita, apriCapitolo, preparaSchermo })`;
4. in `adatta-schermo.js` mette `data-schermate="#cTelaio, #aTelaio, #contenuto"`.

Dentro `ATTIVITA` (niente emoji: Cristiano le vuole solo nei pulsanti delle schede in alto):
- `mappa`: mappa concettuale «alla Novak» su un foglio di W x H px: `nodi` (riquadri con x, y, w, h, testo `t`, sottotitolo `s`,
  `tipo` = radice | quadro | sacro | profano | c-sacro | c-profano | dettaglio, `cap` = capitolo da aprire) e `archi`
  (frecce `da` → `a` con la parola-legame `l`; `forma`: normale (scende ad angolo), "orizz", "curva" tratteggiata;
  `lato: "padre"` mette la parola vicino al riquadro di partenza). Le parole chiave si scrivono `[[così]]`.
  Nel pannello la mappa è piccola («Tocca per ingrandire») e si apre a schermo intero.
  `mappaBuchi` (parole `[[...]]` da nascondere nell'esercizio e nella stampa) e `mappaDistrattori`.
- `vf`: `[frase, vera?, spiegazione]` (circa 20). La stampa le rimescola ogni volta.
- `personaggi`: `[nome, cosa ha fatto]` (almeno 7). Le parole da collegare e gli strumenti vengono dai capitoli
  («Che strumento è?» mostra gli strumenti uno alla volta).
- `cruciverba`: `[PAROLA, definizione]` (10–14 parole, senza spazi né accenti).
- `ascolto`: `criteri` (domande con opzioni) e `brani` (risposte giuste come indici; più indici = vanno bene tutte; `nota` facoltativa).
  Serve sia per «Esercizi di ascolto» sia per la scheda d'ascolto da stampare.
- `riassunto` (testo, 4 immagini, punti) e `riassuntoBreve` (testo, 5 date, 8 parole) per la scheda riassuntiva;
  `raccontoBreve` (2–3 frasi per capitolo) per il racconto in versione breve (stampato a caratteri grandi).
- `verifica`: `quanti` (quante domande pescare per tipo), `scelte` `[domanda, opzioni, indice giusta]`, `frasi` da completare
  (con la parola `[[così]]`), `frasiDistrattori`, `aperte` `[domanda, punti, cosa dovrebbe esserci]`.
  A ogni apertura della pagina si pescano le domande e si creano A e B: stesso contenuto, ordine diverso di esercizi,
  domande e risposte. Deve stare su **due facciate**: controllare con `attivita_stampe.py` più volte (pagina 3 = soluzioni).

Prove: `attivita_prove.py` (schermate e misure di mappa/esercizi/schede), `attivita_gioca.py` (risolve ogni esercizio),
`attivita_stampe.py` (fa i PDF di tutte le schede; poi `pdftoppm -r 50 -png` per guardarli).

## Le immagini delle pagine (la parte lenta)
Regole: pubblico dominio o licenze libere, **nessuna nudità** (attenzione a Purgatorio/Inferno,
Adamo ed Eva, putti, bagni, morti avvolti nei sudari...), iconografia d'epoca.

Strumenti (in questa cartella; si lavora in una cartella di appoggio fuori dal sito, es. `/tmp/epoca/`):
1. `python3 titoli.py "parole" "altre parole" ...` — cerca su Wikimedia Commons e stampa solo i nomi
   dei file (veloce, non scarica nulla). Commons a volte risponde 429 (troppe richieste): lo script
   riprova da solo.
2. `bash scarica.sh "Nome file.jpg" ...` — scarica da Commons la versione larga 960 px, con pause e
   nuovi tentativi in caso di 429. **Un solo scarica.sh alla volta** (in parallelo peggiora i blocchi).
   Conviene farlo partire in sottofondo (`nohup bash scarica.sh ... > log &`) e intanto lavorare ai testi.
3. `python3 cerca_met.py "query" nome` — cerca al Met (Open Access), fa un foglio di provini.
   L'immagine grande del Met è nel campo `primaryImage` del .json.
4. `python3 provini.py foglio.jpg file1 file2 ...` — foglio di provini per **guardare tutte le immagini**
   (e ingrandire i dettagli sospetti prima di usarli).
5. `medioevo/prepara.py` — elenco `pagina -> (file, ritaglio)`; ritaglia e riduce a 1000x667 in `pagine/`.
   Poi si copiano in `media/storia/<epoca>/p-<capitolo>-<n>.jpg`.
6. `medioevo/didascalie.json` + `medioevo/didascalie.py` — scrive immagini e didascalie nella pagina
   (numera le pagine di ogni capitolo in ordine).
7. `medioevo/crediti.py` — legge da Commons autore e licenza di ogni file (`crediti.json`);
   da lì si genera l'elenco `CREDITI_PAGINE`.

## Prove
Server locale dalla cartella del sito: `python3 -m http.server 8765 --bind 127.0.0.1`.
- `python3 tutte.py storia-<epoca>.html` — sfoglia tutte le pagine di tutti i capitoli a LIM, PC e
  telefono: niente che esce dalla diapositiva, zoom sempre uguale, immagini caricate, nessun errore,
  nessuna richiesta esterna.
- `python3 foto.py prefisso indice,c1p1,c5p5 storia-<epoca>.html` — schermate (cNpM = capitolo N, pagina M);
  poi `../prove/mosaico.py` per unirle e mandarle a Cristiano.
