# Storia della musica — come si prepara un'epoca (modello: il Medioevo)

Metodo messo a punto con Cristiano nell'ottobre 2026 su `storia-medioevo.html`.
Per le altre epoche si copia il Medioevo e si cambiano solo i dati.

## Com'è fatta la pagina
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

Dentro `ATTIVITA`:
- `mappa`: due rami (sacra/profana o quelli giusti per l'epoca), ogni nodo con `titolo`, `cap` (id del capitolo) e `parole`;
  `mappaBuchi` / `mappaBuchiBreve` (parole da nascondere, scritte uguali a quelle della mappa), `mappaDistrattori`.
- `vf`: `[frase, vera?, spiegazione, nella versione breve?]` (15–20 frasi).
- `personaggi`: `[nome, cosa ha fatto]` (almeno 7). Le parole da collegare e gli strumenti vengono dai capitoli.
- `cruciverba`: `[PAROLA, definizione, nella versione breve?]` (10–14 parole, senza spazi né accenti).
- `ascolto`: `criteri` (domande con opzioni), `breve` (criteri della versione breve), `brani` (un elemento per
  capitolo con le risposte giuste come indici; più indici = vanno bene tutte; `nota` facoltativa).
- `riassunto`: testo, 4 immagini piccole, punti per la scheda riassuntiva.
- `verifica`: indici delle frasi vero/falso, parole da collegare, domande a scelta multipla `[domanda, opzioni, indice giusta]`,
  domande aperte `[domanda, punti, cosa dovrebbe esserci]`, e le liste per la versione breve.
Le verifiche A e B hanno le stesse domande in ordine diverso (sempre lo stesso ordine a ogni stampa).

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
