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
python3 _sviluppo/reel/reel.py --libreria             # rifà i mini-schermi del sito (quando il sito cambia)
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

- **Mini-telefoni del sito** (`libreria/scorrimenti/`, definiti in `libreria/scorrimenti.json`): video piccoli
  (360x640) di pagine del sito che scorrono su un telefono: index, solfeggio, storia, schemi, brani, spartiti,
  barocco, medioevo, novecento, memory, suono, scale, bona. Sono **salvati nel repository**, così si riusano in
  qualsiasi ordine. In una schermata colorata disegnata con `tel=1` (testi in alto) si aggiungono con
  `"telefoni": ["index", "storia", "brani"]` (da 1 a 3): entrano dal basso uno dopo l'altro e scorrono.
  Quando il sito cambia: `reel.py --libreria` (tutti) o `reel.py --libreria storia scale` (alcuni).
  Per aggiungerne uno: una voce in `scorrimenti.json` (pagina e passi), poi `reel.py --libreria <nome>`.
  Pagine scartate perché sul telefono non scorrono: `giochi.html`, `schemi.html`, `scarta-la-nota` (chiede di girare
  il telefono), `test-ingresso` (menu fermo).
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
- **GRATIS sempre all'inizio**, in grande, nel testo d'apertura.
- **Mai citare i voti** (né nei testi, né nella didascalia, né nelle schermate dei giochi: la registrazione si
  ferma prima delle schermate finali che mostrano un voto).
- Nelle **schermate colorate** di testo: mini-telefoni che scorrono pagine diverse del sito (varie ogni volta).
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
