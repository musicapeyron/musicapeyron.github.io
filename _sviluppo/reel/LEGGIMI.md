# Reel Instagram per musicascuole.it

Strumenti per fare reel verticali (1080x1920) che mostrano i giochi del sito.
Il primo reel è di ottobre 2026: 30 secondi, muto.

## In tre comandi (dalla cartella del sito)

```
python3 _sviluppo/reel/registra.py   # registra le clip dei giochi -> lavoro/clip/
python3 _sviluppo/reel/grafiche.py   # disegna le schermate        -> lavoro/grafiche/
python3 _sviluppo/reel/monta.py      # monta il reel               -> lavoro/reel.mp4
```

Servono Playwright con Chromium, ffmpeg e Pillow. `lavoro/` non va nel repository (vedi `.gitignore`).

## Le scelte di Cristiano

- **Hook** nel primo secondo: gratis, niente registrazione, niente login. Il testo sta sopra un gioco che si muove, non su sfondo vuoto.
- Si **alternano** schermate di testo (una per concetto, sfondo nel colore di una nota) e riprese dei giochi.
- **Chiusura**: "Un progetto collaborativo" (= mandateci idee e segnalazioni), poi logo musicascuole.it con le note colorate e **info@musicascuole.it**.
- **Logo**: ripreso dall'immagine di anteprima della home (`media/condivisione.jpg`): scritta bianca + pastiglie do re mi fa sol la si.
- Riprese **come da un vero telefono** (non solo la misura dello schermo): il sito è fatto per PC, telefono e LIM. Formato **misto**: quasi tutto da telefono, più una scena sulla LIM incorniciata.
- Giochi del primo reel: Leggi la nota, Rappa le note, Brani propedeutici, Le note sul pianoforte, Figure ritmiche, Storia della musica (Barocco).
- Niente volti né voci di alunni. Musica: si aggiunge su Instagram al caricamento.

## Scaletta del primo reel (circa 30 s)

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

## Trucchi imparati

- **Registrazione**: `Page.startScreencast` di Chrome via Playwright, non `record_video` (che esce sfocato). I fotogrammi arrivano solo quando la pagina cambia: i loro istanti finiscono in un file ffconcat, così i tempi restano veri.
- **Telefono vero**: Pixel 7 emulato (`is_mobile`, `has_touch`, user agent Android, densità 2.625). Verticale 412x732 dà esattamente 1080x1920.
- **Risposte giuste**: si leggono dalle variabili dei giochi (`currentNote.name`, `currentQuestion.key`, `expectedAnswerForKeyId(currentKey, gameMode)`). Se cambiano nome nel gioco, aggiornare `registra.py`.
- **Tocchi visibili**: un cerchio bianco che si espande dove si tocca.
- **Zone sicure di Instagram**: niente di importante sopra y=250 o sotto y=1500. Per questo i pulsanti di risposta vengono portati al 74% dello schermo.
- **Rappa le note**: su telefono va in orizzontale. Ci sono circa 10 secondi di conto alla rovescia prima che le carte si accendano. Nel montaggio un ritaglio di 5 carte segue la carta accesa.
- **Schermate animate**: le animazioni CSS vengono fermate e portate a ogni fotogramma (`getAnimations().currentTime`), quindi il risultato è sempre identico.
- Le schermate si cambiano in `grafiche/schermate.json` (testi, colori, durate); l'aspetto in `grafiche/grafiche.html`.

## Problemi del sito trovati registrando (ottobre 2026)

- Figure ritmiche su telefono (verticale e orizzontale): la fila dei pulsanti di risposta è più larga dello schermo; semibreve e minima restano fuori a sinistra e non si possono toccare.
- Le note sul pianoforte, versione PC: a 1920x1080 sta in una schermata; a 1280x800 e 1600x900 i pulsanti delle note finiscono sotto la tastiera.
