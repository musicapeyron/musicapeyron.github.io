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
