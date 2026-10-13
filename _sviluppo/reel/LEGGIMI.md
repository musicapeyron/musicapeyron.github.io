# Reel Instagram per musicascuole.it

Strumenti per fare reel verticali (1080x1920) che mostrano i giochi del sito.
**Cosa funziona su Instagram e perché facciamo i reel così: `GUIDA-REEL.md`.**
Reel pubblicati e risultati: `REGISTRO.md`.

## Un comando solo (dalla cartella del sito)

```
python3 _sviluppo/reel/reel.py test-ingresso          # fa tutto; le clip già registrate non si rifanno
python3 _sviluppo/reel/reel.py test-ingresso --clip   # registra di nuovo tutte le clip
python3 _sviluppo/reel/reel.py primo --clip=rap       # registra di nuovo solo una clip
python3 _sviluppo/reel/esplora.py memory-strumenti.html   # studia un gioco prima di farne un reel
python3 _sviluppo/reel/reel.py --libreria             # rifà i mini-schermi del sito, per telefono, tablet e LIM
```

Risultato in `lavoro/<reel>/`:

| File | Cosa |
|---|---|
| `reel.mp4` | il reel da caricare (con la base del sito come audio, se indicata) |
| `reel-B.mp4` | le varianti, se ci sono (per esempio un altro testo d'apertura) |
| `copertina.jpg` | la copertina; il riquadro 3:4 centrale è quello che si vede nella griglia del profilo |
| `anteprima.jpg` | un fotogramma al secondo con le zone coperte da Instagram (rosso: coperto sempre; arancione: coperto con didascalie lunghe o dai pulsanti a destra) e la copertina. **Si guarda questa prima di pubblicare.** |
| `didascalia.txt` | didascalia pronta (al massimo 5 hashtag, controllato) e testo alternativo |

Tempi: un reel nuovo di circa 30 s si fa in 4-6 minuti di calcolo. Quando si cambia solo un testo, si ridisegna solo quella schermata.

Servono Playwright con Chromium, ffmpeg e Pillow. `lavoro/` non va nel repository (vedi `.gitignore`).

## Il file del reel: `reels/<reel>.json`

Ogni reel è un solo file. Per uno nuovo si copia **`reels/_modello.json`** (un gioco, circa 15 s, con audio) o
`reels/test-ingresso.json` (più giochi, telefono + LIM, variante B). Le voci:

- **`clip`**: le riprese. Normalmente descritte **a passi**: pagina, dispositivo (`telefono`, `telefono-orizzontale`,
  `lim`, con `schermo` e `densita` facoltativi) e azioni: `attendi`, `tocca`, `clic`, `segna`, `scorri`,
  `scorri_risposte`, `centra`, `js`, `rispondi` (spiegate in `esegui()` di `registra.py`).
  `rispondi` gioca da solo, anche con errori voluti: serve la voce del gioco in `RISPOSTE` (`registra.py`);
  oggi ci sono Leggi la nota, Figure ritmiche, Le note sul pianoforte e il Test d'ingresso.
  Per i casi complicati una clip può essere una funzione Python (`{"funzione": "test"}`).
- **`schermate`**: testi e grafiche (tipi `hook`, `card`, `label`, `bg`, `classe`, `end`, descritti in `grafiche.py`).
- **`scaletta`**: i pezzi in ordine (`apertura`, `schermata`, `intera`, `incorniciata`, descritti in `monta.py`).
  I tempi si scrivono a partire dai **segni** registrati, ad esempio `"da": "acuto_0-0.55"`: se si registra di nuovo
  (domande diverse), la scaletta resta giusta.
- **`copertina`**: titolo, sottotitolo, colore, fotogramma di una clip (`clip`, `istante`, `ritaglio`).

## Pezzi riutilizzabili

- **LIM, tablet e telefono del sito** (`libreria/scorrimenti/`, definiti in `libreria/scorrimenti.json`): video
  piccoli di pagine del sito che scorrono, ognuna in tre versioni: telefono (`<nome>.mp4`, 360x640), tablet
  (`<nome>-tablet.mp4`, 480x640) e LIM (`<nome>-lim.mp4`, 640x360). Pagine: index, solfeggio, storia, schemi, brani,
  spartiti, barocco, medioevo, novecento, memory, suono, scale, bona. Sono **salvati nel repository**, così si riusano
  in qualsiasi ordine. Sotto una schermata colorata disegnata con `tel=1` (testi in alto) si mettono con
  `"dispositivi": {"lim": "storia", "tablet": "brani", "telefono": "index"}`: la LIM dietro, il tablet a sinistra,
  il telefono a destra, che entrano dal basso uno dopo l'altro e scorrono (scelta di Cristiano: niente tre telefoni,
  ma i tre dispositivi, per far vedere che il sito va dappertutto).
  Molte pagine su LIM e tablet stanno in una schermata e restano ferme: va bene così (il montaggio parte dall'inizio
  e tiene l'ultima immagine).
  Quando il sito cambia: `reel.py --libreria` (tutti) o `reel.py --libreria storia scale` (alcuni).
  Per aggiungerne uno: una voce in `scorrimenti.json` (pagina e passi), poi `reel.py --libreria <nome>`.
  Pagine scartate perché sul telefono non scorrono: `giochi.html`, `schemi.html`, `scarta-la-nota` (chiede di girare
  il telefono), `test-ingresso` (menu fermo).
- **Il suono dei giochi**: una clip con `"audio": true` registra anche il suono vero del gioco (`lavoro/clip/<clip>.wav`,
  in sincrono col video). Nel reel lo si mette con `"audio": {..., "gioco": true, "sotto": 0}`: il suono del gioco
  va sotto i suoi pezzi (alla loro velocità) e la base tace lì (`sotto` = volume della base sotto i giochi).
  Un pezzo con `"muto": true` non porta il suono.
- **Le bolle dei suoni** (tipo `sfida`, o l'apertura `hook`): nei giochi d'ascolto due bolle "1" e "2" si accendono
  quando suonano i due suoni, poi compare la domanda e tutto sparisce al tocco della risposta: così nei secondi
  d'ascolto lo schermo si muove e si capisce anche senza audio. Nel file del reel basta
  `"suoni": {"clip", "da", "tocco", "distanza"}`: gli istanti si ricavano dall'audio registrato
  (`distanza` = secondi fissi tra i due suoni quando nel gioco si sovrappongono; Acuto o grave: 1.9).
- **Titoli "adesivo"** (tipo `titolo`): da usare al posto di `label` per i titoli sopra i giochi (scelta di Cristiano:
  le etichette semplici sono «anonime e piatte»). Scritta grande su un riquadro colorato inclinato che entra con un
  rimbalzo, sottotitolo evidenziato in giallo; `|` va a capo. Emoji sì, ma solo quelle comuni (🎤 🚀 🎶): alcune
  (🪜 🎼) nel browser delle riprese non si vedono.
- **L'aula con la LIM** (tipo `classe` in `grafiche.html`): un'aula vista dal fondo, con la LIM sul muro, la cattedra,
  la finestra e i banchi con le sedie vuote. **Nessuna persona disegnata** (scelta di Cristiano).
  Si usa come sfondo di un pezzo `incorniciata` con gli stessi `x, y, w, h` della LIM (di serie 130, 480, 820, 461);
  l'etichetta sta sopra, la frase sotto l'etichetta (`sy=392`), non sulla cattedra.
- **`audio`** (facoltativo): una base del sito (`media/...mp3`), da che secondo, volume e credito per la didascalia.
- **`varianti`** (facoltativo): schermate diverse (di solito l'hook) per una seconda versione del reel.
- **`didascalia`**: testo, hashtag (massimo 5), testo alternativo.

## Come aggiungere un gioco nuovo (per `rispondi`)

1. `python3 _sviluppo/reel/esplora.py <pagina>.html` dà pulsanti, variabili globali e schermi (telefono, PC, LIM).
2. Si legge nella pagina la funzione che controlla la risposta (`check...`, `answer...`) e si capisce quale variabile
   dice la risposta giusta.
3. Si aggiunge in `RISPOSTE` un'espressione JS che restituisce **il pulsante giusto** (o `null` se ora non si può rispondere).
   Il pulsante sbagliato (per gli errori voluti) lo sceglie da sé tra i vicini visibili.

## Le scelte di Cristiano

- **Hook** nel primo secondo: gratis, niente registrazione, niente login. Il testo sta sopra un gioco che si muove, non su sfondo vuoto.
- Si **alternano** schermate di testo (una per concetto, sfondo nel colore di una nota) e riprese dei giochi.
- **Chiusura**: "Un progetto collaborativo" (= mandateci idee e segnalazioni), poi logo musicascuole.it con le note colorate e **info@musicascuole.it**.
- **Logo**: ripreso dall'immagine di anteprima della home (`media/condivisione.jpg`): scritta bianca + pastiglie do re mi fa sol la si.
- Riprese **come da un vero telefono** (non solo la misura dello schermo): il sito è fatto per PC, telefono e LIM. Formato **misto**: quasi tutto da telefono, più una scena sulla LIM incorniciata.
- Niente volti né voci di alunni; **nei disegni nessuna persona** (l'aula ha solo banchi e sedie).
- **Niente schermate ripetitive**: ogni schermata deve aggiungere qualcosa; se un titolo ripete quello che la schermata
  prima o dopo dice già, si toglie o si uniscono i testi (scelta di Cristiano, ottobre 2026).
- **GRATIS sempre all'inizio**, in grande, nel testo d'apertura.
- **Mai citare i voti** (né nei testi, né nella didascalia, né nelle schermate dei giochi: la registrazione si
  ferma prima delle schermate finali che mostrano un voto).
- Nelle **schermate colorate** di testo: LIM, tablet e telefono che scorrono pagine diverse del sito (varie ogni volta).
- La **LIM dentro un'aula disegnata**, per far capire le dimensioni.
- Nei reel si mettono in risalto **i vari aspetti del gioco**, uno per pezzo (livelli, aiuti, chiavi, verifica…).
- Vuole che resti tutto ciò che serve per rifare i reel e farne di nuovi.

## I reel fatti

### `primo` (ottobre 2026, circa 30 s, muto)

| # | Cosa | Durata |
|---|------|--------|
| 1 | Leggi la nota + "Giochi musicali GRATIS per la tua classe" | 3,6 s |
| 2 | do: "Niente registrazione. Niente login." | 1,9 s |
| 3 | Rappa le note, telefono in orizzontale | 3,2 s |
| 4 | sol: "Nessun dato raccolto. E nessuna pubblicità." | 1,8 s |
| 5 | Brani propedeutici, brano 10 con "Colori e nomi" | 3,4 s |
| 6 | re: "Apri e usi. Anche sulla LIM." | 1,8 s |
| 7–8 | LIM: Le note sul pianoforte, Figure ritmiche | 5 s |
| 9 | Storia della musica fino al Barocco | 3,2 s |
| 10 | la: "Un progetto collaborativo. Scrivici le tue idee!" | 1,9 s |
| 11 | Chiusura con logo e mail | 4 s |

### `test-ingresso` (ottobre 2026, circa 30 s, muto, con variante B)

| # | Cosa | Durata |
|---|------|--------|
| 1 | Schermata iniziale del test + "Test d'ingresso GRATIS di musica, già pronto", tocco su Comincia | 3,6 s |
| 2 | do: "Niente registrazione. Niente login." | 1,9 s |
| 3–5 | 1/5 Acuto o grave, 2/5 Tastiera, 3/5 Figure ritmiche (telefono) | 6,3 s |
| 6 | LIM: 4/5 Leggi la nota (chiave di violino), "Anche sulla LIM" | 3 s |
| 7 | 5/5 Chiave di basso (telefono) | 1,9 s |
| 8 | re: "Alla fine, i risultati di ogni gioco." | 1,9 s |
| 9 | Il riepilogo finale (tabella con le percentuali) | 3,2 s |
| 10 | sol: "Nessun dato raccolto. I risultati restano sullo schermo." | 1,9 s |
| 11–12 | la: "Un progetto collaborativo", chiusura con logo e mail | 5,9 s |

- Il test si fa **tutto** davvero (le domande sono a caso) con qualche errore voluto (`TEST_ERRORI` in `registra.py`),
  così la tabella finale ha percentuali credibili (88% complessivo) e non tutti 100%.
- Variante B: hook "Primo giorno di musica? TEST PRONTO, gratis, senza login", da provare come Trial Reel.

### `leggi-la-nota` (ottobre 2026, 29 s, con audio e variante B)

Il primo fatto applicando `GUIDA-REEL.md`.

| # | Cosa | Durata |
|---|------|--------|
| 1 | Il gioco già in movimento + "Leggi le note GRATIS per la tua classe" | 3 s |
| 2 | do: "Gratis. Niente login. Nessun dato raccolto, niente pubblicità." + telefoni index, storia, brani | 2,4 s |
| 3 | "17 livelli, uno alla volta": risposte e coriandoli del livello superato | 3,3 s |
| 4 | "Gli aiuti: schema e colori": pannello Opzioni, poi lo schema con i nomi colorati | 3,3 s |
| 5 | re: "Tutorial, allenamento e verifica." + telefoni schemi, scale, Bona | 2,4 s |
| 6 | "Anche in chiave di basso" | 2,8 s |
| 7 | LIM nell'aula: "La verifica, anche mista" (la verifica in corso, senza la schermata finale) | 5,1 s |
| 9 | la: "Mandalo a un collega di musica." + telefoni barocco, memory, suono | 2,6 s |
| 10 | Chiusura con logo e mail | 3,2 s |

- Audio: base del brano 21 dei Brani propedeutici, dal secondo 16 (si cambia in `"audio"`).
- Variante B: apertura a sfida "Che nota è? GRATIS – Leggi la nota, per la LIM".
- Sul telefono il pulsante ⚙️ Opzioni è in fondo alla pagina: `tocca` ora scorre da solo fino a un elemento fuori schermo.

### `acuto-o-grave` (ottobre 2026, 26 s, con il suono del gioco e variante B)

| # | Cosa | Durata |
|---|------|--------|
| 1 | Sfida: "Acuto o grave? GRATIS – Ascolta e indovina 🔊", i due suoni con le bolle 1 e 2, il tocco, le note sul pentagramma | 5,2 s |
| 2 | do: "Gratis. Niente login." + LIM, tablet e telefono | 2,4 s |
| 3 | Seconda sfida, con le bolle | 5,2 s |
| 4 | re: "10 livelli: da due ottave a un semitono. E c'è anche l'unisono." | 2,4 s |
| 5 | LIM nell'aula, col suono: "Poi le note sul pentagramma" | 5,4 s |
| 6 | la: "Mandalo a un collega di musica." | 2,6 s |
| 7 | Chiusura con logo e mail | 3,2 s |

- Il suono è quello vero del gioco (pianoforte Salamander, CC BY 3.0, credito in didascalia); la base di "Su in alto"
  suona solo sulle schermate colorate e sulla chiusura.
- La schermata iniziale del gioco non si mostra: sotto "Verifica" c'è scritto "scopri il tuo voto".
- Variante B: "Quale suono è più acuto? GRATIS – Alza il volume 🔊".

### `primaria` (ottobre 2026, 33 s, con i suoni dei giochi e variante B)

Doppio (in apertura, sotto «Giochi musicali GRATIS per la PRIMARIA»), Memory delle note, Riconosci lo strumento,
Le qualità del suono, Scarta la nota sulla LIM in aula (solo chiave di violino), Memory degli strumenti.
Doppio è registrato nella difficoltà più semplice, che nel reel non si nomina. Scarta la nota e Doppio tengono lo stato
chiuso nella pagina: Scarta usa un aggancio (`AGGANCI` in `registra.py`, solo durante la registrazione) e si gioca
trascinando le carte (`data-reel-su`); Doppio si legge dallo schermo.

### `rappa-le-note` (ottobre 2026, 32 s, con la base rap del gioco e variante B)

Nel reel il gioco si chiama **«Rap con le note!»** (scelta di Cristiano). Cinque riprese: telefono in orizzontale con solo
i nomi (ascendenti), nomi + pentagramma (discendenti), solo pentagramma (salita e discesa); LIM in aula; PC 1366x768.
Versione di ottobre 2026 (39 s): «L'alfabeto musicale a ritmo di rap! GRATIS» · «Si apre e si gioca!» · Rap con le note! ·
passo dopo passo (nomi → nomi + pentagramma → solo pentagramma) · sequenze ascendenti e discendenti · una, due, quattro
note per battito (riprese `rap_x2` e `rap_x4`, col pulsante ♫2 / ♬4 del gioco) · arpeggi e progressioni per terze e
quinte, propedeutica al solfeggio parlato · la LIM in aula · «Mandalo a chi insegna con te».
Novità: il tipo **`pila`** (tre schermi orizzontali uno sopra l'altro, ritagliati sulla fila di carte, con un'etichetta
per riga) per far vedere a colpo d'occhio la progressione e le sequenze; il suono è quello della prima riga.
Le carte si accendono circa 11 s dopo il via (banner e conto alla rovescia): i tagli partono da `via+11`.
**Musica**: la base del gioco suona per tutto il reel (scelta di Cristiano). È dentro la pagina (`BEAT_MP3`, codificata):
estratta in `libreria/basi/rap-con-le-note.mp3` (54 s, 80 battiti al minuto, un battito ogni 0,75 s).

## Tagli a tempo di musica

Con `"audio": {"file": "...", "battito": 0.75}` ogni pezzo deve durare un numero esatto di battiti **e di fotogrammi**
(a 30 fotogrammi al secondo: multipli di 1,5 s, quindi 1,5 / 3 / 4,5 s) e `reel.py` sposta ogni ripresa che ha registrato
la base (`"audio": true`) di meno di un battito, così nel gioco le carte si accendono sul battito della musica del reel.
Serve che la musica del reel sia la stessa base del gioco.

### `_modello` (circa 13 s, con audio)

Leggi la nota con la base di "Su in alto" (Brani propedeutici): è il punto di partenza per i reel nuovi.

## Trucchi imparati

- **Registrazione**: `Page.startScreencast` di Chrome via Playwright, non `record_video` (che esce sfocato). I fotogrammi arrivano solo quando la pagina cambia: i loro istanti finiscono in un file ffconcat, così i tempi restano veri.
- **Telefono vero**: Pixel 7 emulato (`is_mobile`, `has_touch`, user agent Android, densità 2.625). Verticale 412x732 dà esattamente 1080x1920.
- **Tocchi visibili**: un cerchio bianco che si espande dove si tocca.
- **Zone sicure di Instagram**: niente di importante sopra y=250 o sotto y=1500; tra 1250 e 1500 e nella colonna di destra (pulsanti) solo cose secondarie. Per questo i pulsanti di risposta vengono portati al 74% dello schermo (`scorri_risposte`).
- **Etichette** dei giochi con `fascia=1`: una fascia scura copre il titolo della pagina sotto l'etichetta, altrimenti i due testi si sovrappongono.
- **Rappa le note**: su telefono va in orizzontale. Ci sono circa 10 secondi di conto alla rovescia prima che le carte si accendano. Nel montaggio un ritaglio di 5 carte segue la carta accesa.
- **Schermate animate**: le animazioni CSS vengono fermate e portate a ogni fotogramma (`getAnimations().currentTime`), quindi il risultato è sempre identico.
- **Audio**: le basi del sito sono di Cristiano (CC BY-SA 3.0), quindi sono "audio originale" per Instagram; il credito va in didascalia (lo aggiunge `reel.py`).

## Problemi del sito trovati registrando (ottobre 2026)

- Figure ritmiche su telefono (verticale e orizzontale): la fila dei pulsanti di risposta è più larga dello schermo; semibreve e minima restano fuori a sinistra e non si possono toccare.
- Le note sul pianoforte, versione PC: a 1920x1080 sta in una schermata; a 1280x800 e 1600x900 i pulsanti delle note finiscono sotto la tastiera.
