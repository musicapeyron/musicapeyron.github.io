# musicascuole.it — regole per lavorare sul sito

Sito gratuito di musica per la scuola media di Cristiano Arata (insegnante, non webmaster).
Pubblicato con GitHub Pages sul dominio **musicascuole.it**. Si parla in italiano.

## Come si lavora
- **Cambia solo ciò che è chiesto.** Se noti qualcosa che si può fare meglio (anche fuori dalla richiesta),
  **segnalalo e chiedi**: non cambiarlo di tua iniziativa.
- Si pubblica direttamente su `main` (il sito si aggiorna in un paio di minuti), sempre dopo aver provato la modifica.
  **Piccole modifiche** (correzioni, testi, un video, ritocchi a una pagina): pubblica subito e poi dillo.
  **Modifiche grosse** (pagine nuove, tante pagine insieme, cambi di struttura o di grafica): mostra le schermate
  e chiedi conferma prima di pubblicare.
  Ogni commit ha una descrizione in italiano che dice cosa cambia per chi usa il sito.
- Quando Cristiano interrompe, fermati e aspetta.
- Per tutto ciò che è esterno (GitHub, Register.it, impostazioni) guidalo **passo passo**, con i nomi esatti dei menu.

## Sicurezza (mai)
- Mai toccare il file `CNAME`, i record DNS o le impostazioni del dominio personalizzato.
- Mai cancellare file senza chiedere.
- Mai dati personali degli studenti nel sito. Niente cookie, tracciatori o servizi esterni caricati all'apertura:
  YouTube solo da `youtube-nocookie.com`, e solo dopo che si preme play (anteprima con immagine nostra).

## Stile
- Colori delle note (giochi, pulsanti, carte): do `#E21C48`, re `#F99D1C`, mi `#FFF428`, fa `#BED958`,
  sol `#009C95`, la `#5E50A1`, si `#CF3E96`.
- Pagine minimali, leggibili sulla LIM e sul telefono, niente muri di testo: frasi brevi, adatte a ragazzi di 11-13 anni.
- Figure femminili benvenute dove storicamente sensato.

## Video e immagini
- Video: ascolti **completi** (brano o movimento intero), audio buono; meglio canali ufficiali e stile "album";
  niente dal vivo con audio scadente, niente interviste o lezioni parlate; per gli strumenti vanno bene
  musicisti che suonano lo strumento d'epoca. Niente "momenti cliccabili". Segnala sempre i canali non ufficiali.
- Immagini: **nessuna nudità**, nemmeno parziale (putti, veli trasparenti, statue comprese); abiti d'epoca vanno bene.
  Solo pubblico dominio o licenze libere (Wikimedia Commons, Met Open Access), con crediti nella pagina.
  Strumenti: foto dell'oggetto intero; brani: iconografia d'epoca.

## Telefoni: non devono scaldarsi
Regole complete in `_sviluppo/LEGGIMI.md` (sezione "Risparmio energetico"). In breve: niente
`background-attachment: fixed`, `mix-blend-mode` a tutto schermo, `backdrop-filter` su cose che scorrono,
animazioni infinite; durante la riproduzione si ridisegna solo quando cambia qualcosa; AudioContext in pausa
quando tace; si ridisegna al resize solo se cambia la larghezza.

## Prove prima di pubblicare
Playwright (Chromium già installato) a 1920x1080 (LIM), 1366x768 e 390x844 (telefono):
nessun errore JavaScript, nessuna richiesta esterna prima del play, schermate guardate davvero.

## Dove sono le cose
- `_sviluppo/LEGGIMI.md`: appunti generali; `_sviluppo/omr/PROCEDURA.md`: trascrizione degli spartiti (Bona).
- Raccolte di spartiti: il modello è `brani-propedeutici.html`; le altre si rigenerano con
  `python3 _sviluppo/genera_raccolte.py` (dopo modifiche a mano: `--salva`).
- Storia della musica: `storia.html` (elenco epoche) e una pagina per epoca (`storia-barocco.html` ecc.),
  cartella immagini `media/storia/<epoca>/`. Classicismo e Romanticismo si dividono Beethoven
  (il giovane nel Classicismo, Quinta e Inno alla gioia nel Romanticismo).
- Stile comune: `comune.css` (sfondo, trama, colori delle note `var(--do)`…): le pagine nuove lo caricano e non ricopiano quelle regole.
- Motore degli spartiti: `motore-schemi.js` (VexFlow); se cambia, aggiorna il `?v=` nelle pagine.
