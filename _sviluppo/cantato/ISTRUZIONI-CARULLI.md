# Trascrizione del «Solfège des solfèges» (Lemoine-Carulli) — istruzioni per chi trascrive

Fonte: IMSLP #910344, *Solfège des solfèges*, vol. 1A con accompagnamento di pianoforte (Lemoine, Parigi, 1923;
pubblico dominio). Scaricato in `pdf: lavignac_-_solfege_des_solfeges_-_1a_-_piano_-_bw.pdf`. Le pagine sono immagini a 300 dpi,
`pg/p-NNN.png` (NNN = pagina del PDF; la pagina stampata è NNN−2).

Ogni lezione ha tre pentagrammi: **CHANT** (canto, chiave di violino), **PIANO** mano destra (violino) e mano sinistra (basso).
Sulla scansione ci sono **segni a matita** di un vecchio proprietario (X, numeri romani, sigle di accordi, diteggiature scritte a
mano): **ignorali**. Ignora anche le diteggiature stampate (numerini 1–5), le virgole di respiro, dinamiche, legature di portamento,
staccati e i testi ("La Ronde vaut quatre temps"…).

## Strumenti (percorsi assoluti nel sito: `/home/claude/musicapeyron.github.io/_sviluppo/…`)
- `python3 …/omr/zoom.py pg/p-NNN.png Y0 Y1 [X0 X1] zoom/tuonome.png` — ritaglio ingrandito (frazioni 0–1); poi guardalo con Read.
  Per gli accordi serve tanto ingrandimento: **un sistema alla volta, un terzo di larghezza alla volta** (X 0–0.4, 0.35–0.7, 0.65–1),
  e se un accordo è fitto ingrandisci ancora solo quel pentagramma. Conta le righe e gli spazi con cura; i tagli addizionali contano.
  Usa nomi di file tuoi (altri lavorano in parallelo).
- `python3 …/cantato/carulli.py scrivi lNNN.txt prova_NNN/` — controlla: stampa "ATTENZIONE" se una battuta non torna
  o se le tre parti hanno un numero di battute diverso. Correggi finché non ci sono avvisi.
- `python3 …/cantato/carulli.py disegna lNNN.txt prova_NNN/` — ridisegna la lezione (Verovio) in PNG: **guardala accanto
  all'originale e confronta nota per nota**, battuta per battuta, tutte e tre le parti. Questo è il controllo più importante.

## Formato: un file per lezione, `lNNN.txt` (es. `l011.txt`)
```
# Lezione 11 | Le semibrevi e le pause | armatura=0 tempo=4/4 andamento=Moderato autore=Henry Lemoine
V: g4w | a4w | g4w | rw | ...
D: [c4e4g4]w | [c4f4a4]w | ...
S: c2q e2q g2q c3q | f2q a2q c3q f3q | ...
```
- Intestazione: numero | titolo breve in italiano (es. "La scala di do in semibrevi", "Le semibrevi e le pause", "Le minime",
  "Le semiminime", "Salti di terza"…, tradotto dal titolo francese della sezione) | armatura=N (diesis +, bemolli −) tempo=4/4 (3/4,
  2/4, 6/8, C| per il ¢) andamento=come stampato (Lento, Moderato…) autore=nome stampato a sinistra della lezione, se c'è
  (es. "Henry Lemoine", "Rodolphe", "G. Carulli"; per le lezioni senza nome non mettere autore).
- `V:` canto, `D:` mano destra, `S:` mano sinistra. Battute separate da `|`. Puoi scrivere più righe V:/D:/S: (una per sistema):
  si accodano. Consiglio: per ogni sistema scrivi le sue righe V, D, S una sotto l'altra.
- Nota = nome + ottava + durata: c4 = do centrale; nella chiave di basso il do nel secondo spazio dal basso è c3, il sol sul primo
  rigo è g2, il la nel quinto rigo… conta bene: la riga in alto della chiave di basso è a3, quella in basso g2. Nella chiave di
  violino la riga in basso è e4, quella in alto f5. Durate w h q 8 16 32; punto "." dopo la durata; terzina "t".
- **Altezza vera**: scrivi sempre l'alterazione effettiva (in sol maggiore il fa è f#4); un'alterazione accidentale vale fino a fine battuta;
  bequadro = nome semplice.
- Pausa: r + durata (rw = pausa di tutta la battuta in 4/4, rh. in 3/4).
- Accordo: note tra quadre, dal basso in alto, poi la durata: `[c4e4g4]h`. Legatura di valore su tutto l'accordo: `[c4e4]h~`;
  solo su una nota: `[c4~e4]h` (la nota legata deve ricomparire nella nota/accordo seguente della stessa voce).
- Nota singola legata: `d4h~ d4q`.
- **Due voci nella stessa mano** (gambi in su e in giù con ritmi diversi): separale con ` & ` dentro la battuta; ogni voce deve
  riempire la battuta. Nella voce che tace usa le pause stampate, oppure `s` + durata (spazio invisibile, es. `sh`) se la pausa non
  è stampata. Se le due voci hanno lo stesso ritmo scrivile come accordo.
- Ritornelli (`:||` e `||:`): trascrivi la musica una sola volta, come stampata, e aggiungi una riga
  `# nota: ritornello dalla battuta X alla Y` (X = prima battuta ripetuta, 1 se si torna all'inizio; Y = battuta col segno `:||`).
- Prima e seconda volta (parentesi «1.» / «2.» sopra le battute): `# volta: 1 dalla battuta X alla Y` e `# volta: 2 dalla battuta X alla Y`
  (oltre alla riga del ritornello, che finisce sull'ultima battuta della prima volta).
- «FIN» (Fine) e «D.C.» (Da capo al Fine): `# fine: battuta N` (la battuta dove è scritto FIN, alla sua fine) e `# dc: battuta N`
  (l'ultima battuta, dove è scritto D.C.). Trascrivi tutte le battute come stampate, una volta sola.
- Anacrusi (la lezione comincia a battuta incompleta): scrivi la prima battuta corta, uguale in tutte e tre le parti; l'ultima battuta
  di solito la completa ed è corta anch'essa.
- Corona finale: non si scrive (la mette il programma sull'ultima nota del canto, o della battuta del Fine).
- Ignora anche: indicazioni metronomiche (Moderato 88 = ♩: scrivi solo andamento=Moderato), «1re Reprise / 2e Reprise», il segno ⊕ e
  le note a piè di pagina («Après la leçon N° … travailler …»), le legature di portamento, staccati, accenti, dinamiche.
- Abbellimenti (appoggiature, acciaccature, gruppetti, trilli): non si scrivono; aggiungi `# nota: battuta B, parte V/D/S: …`.
- Più di due voci nella stessa mano: riducile a due (accorpando in accordi le note con lo stesso ritmo) senza cambiare i suoni.

## Consegna
Per ogni lezione: `lNNN.txt` senza ATTENZIONE e controllata col disegno. Nel messaggio finale: lezioni fatte, battute di ciascuna,
autore, e l'elenco dei punti incerti (parte + battuta + motivo). Non modificare altri file.
