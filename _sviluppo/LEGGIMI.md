# Musica Peyron — guida per chi lavora sul sito

> **Per Claude (o per chiunque riprenda il lavoro):** leggi questo file prima di modificare il sito.
> Qui c'è come funziona il motore degli spartiti, come aggiungere brani, raccolte ed epoche di storia,
> e le regole decise con l'autore. La cartella `_sviluppo` non viene pubblicata (GitHub Pages ignora
> le cartelle che iniziano con `_`).

Autore: **Cristiano Arata**. Dominio previsto: **musicascuole.it** (senza www). Sito statico su GitHub Pages,
caricato dall'interfaccia web di GitHub (Add file → Upload files → Commit; massimo 25 MB per volta;
gli zip vanno estratti prima; non cancellare il file `CNAME`).

---

## 1. Regole fisse

- **Colori delle note** (ovunque: giochi, pulsanti, carte, spartiti):
  do `#E21C48` · re `#F99D1C` · mi `#FFF428` · fa `#BED958` · sol `#009C95` · la `#5E50A1` · si `#CF3E96`.
- **Privacy:** nessun cookie, nessuna statistica, nessun servizio esterno. Caratteri, immagini, spartiti e basi
  stanno nel sito. Unica eccezione: i video YouTube delle pagine di storia, caricati **solo quando si preme play**
  (youtube-nocookie). Le preferenze vanno solo in `localStorage`, sempre dentro try/catch.
- **Licenze:** contenuti CC BY-NC-SA 4.0; basi audio CC BY-SA 3.0; codice MIT (© 2026 Cristiano Arata);
  i materiali di terzi tengono la loro licenza → vanno citati in `crediti.html` (e in fondo alle pagine di storia).
- **Immagini:** niente nudo, nemmeno in statue o pitture antiche (scelta dell'autore); gli abiti d'epoca vanno benissimo. Per gli strumenti meglio la foto dell'oggetto, per i brani l'iconografia dell'epoca.
- **Animazioni:** lente, niente lampeggi (sito usato da bambini), rispettare `prefers-reduced-motion`.
- **Stile:** quello della home (`index.html`): sfondo blu notte, card scure con bordo colorato in alto, caratteri
  Manrope (titoli), Inter (testo), Fredoka (titoli grandi). Caratteri locali in `fonts/` (`fonts/caratteri.css`).
- **Livelli P/M/L** (primaria/medie/liceo): esistono nel codice ma sono spenti (`MOSTRA_LIVELLI = false`).
- **Pubblico:** medie, tranne le schede viola (“Intervalli, scale e accordi”) e le future schede rosse di armonia,
  pensate anche per il liceo.
- Prima di consegnare un pacchetto grande, confrontare con lo zip aggiornato del repository di GitHub
  (l'autore a volte modifica o cancella file direttamente su GitHub).

---

## 2. Il motore degli spartiti (`motore-schemi.js`)

Libreria in JavaScript puro, usa **VexFlow 4.2.2** (`vexflow.js`, locale). Espone `window.MotoreSchemi`:

| Funzione | A cosa serve |
|---|---|
| `leggiMusicXML(testo)` | legge un MusicXML e restituisce il brano (battute, eventi, riquadri, titolo…) |
| `disegnaBrano(div, brano, opzioni)` | disegna lo spartito in SVG; `svg._mappa` contiene le posizioni di battute e figure |
| `adattaBrano(div, brano, opzioni, larg, alt)` | sceglie quante battute per riga perché stia nello spazio (schermo intero/LIM) |
| `noteUsate(brano)` / `disegnaCarte(div, strumento, note)` | le carte con lo schema delle note usate |
| `paginaA4`, `stampaPagina`, `salvaPaginaPDF` | stampa e PDF |
| `POSIZIONI` (in cima al file) | diteggiature: flauto (tedesco), chitarra, ukulele, tastiera, basso |

Opzioni principali: `strumento` (flauto, tastiera, chitarra, ukulele), `colori`, `nomi`, `diteggiatura`
(`no` / prima volta / sempre), `pausePiuBattute`.

**Cache del browser:** le pagine caricano `motore-schemi.js?v=AAAA-MM-GG`. Se si modifica il motore,
**cambiare la data in tutte le pagine** che lo includono, altrimenti i browser usano la versione vecchia.

### Cosa legge dal MusicXML (esportato da MuseScore)

- **Una sola parte**, una voce (melodia). Gli accordi e le sigle degli accordi vengono ignorati.
- **Titolo:** `movement-title` nella forma `N. Titolo` (il numero viene tolto) oppure `work-title`.
- **Riquadri "Novità" / "Attenzione":** testo di rigo con **cornice rettangolare** in MuseScore.
  Se comincia con `NOVITÀ:` diventa un riquadro novità, altrimenti “Attenzione”.
- **Andamento e metronomo:** l'indicazione di tempo nella prima battuta.
- **Note colorate** in MuseScore (es. rosso) → note **evidenziate** (rosse nella versione standard, con cerchietto
  rosso nella versione a colori). Usato nelle scale per le note alterate dall'armatura.
- **Gambi e travature:** presi dal file (`<stem>`, `<beam>`): come li imposti in MuseScore, così appaiono.
- Ritornelli, **prima/seconda volta**, **segno**, **D.S.**, **D.C.**, **Fine** (da salti e marcatori di MuseScore),
  doppia stanghetta finale, **corona**, **legature di valore**, **acciaccature**, **dinamiche**, **diteggiature**
  scritte, alterazioni scritte, tempo tagliato/ordinario, chiave di violino ottava.
- L'ordine di esecuzione (ritornelli, volte, salti) è calcolato da `ordineEsecuzione()` nella pagina della raccolta.

---

## 3. Le raccolte di spartiti

Pagine: `brani-propedeutici.html` (**modello**), `primi-brani.html`, `primi-brani-2.html`, `diabelli.html`,
`berens.html`, `scale.html`. Tutte uguali tranne il blocco di configurazione (intorno alla riga 630) e pochi testi.

### Aggiungere un brano a una raccolta esistente

1. Esporta da MuseScore il **MusicXML** (solo la parte melodica) e le **basi mp3**.
2. Nomi dei file, nella cartella `media/<raccolta>/`:

| Raccolta | Spartito | Basi |
|---|---|---|
| Brani propedeutici | `branoNN.musicxml` (NN a due cifre) | `branoNN-completo.mp3`, `branoNN-accompagnamento.mp3`; disegno `disegni/branoNN.svg` |
| Primi brani 1 e 2 | `branoN.musicxml` | `branoN-completo.mp3`, `branoN-accompagnamento.mp3` |
| Diabelli / Berens | `diabelliN.musicxml` / `berensN.musicxml` | `…N-accompagnamento.mp3` (+ `-media`, `-lenta` se ci sono) |
| Scale | `scala-NOME.musicxml` | `scala-NOME-completo.mp3`, `scala-NOME-accompagnamento.mp3` |

3. Nella pagina: aggiungi il numero a `NUMERI`; dove c'è, aggiungi la riga in `AUDIO` (e in `SCALE` per le scale).

### Costanti del modello (solo `brani-propedeutici.html`)

- `SINCRO = { n: secondi }` — per “Segui la base”: secondi di attacco della base **prima della prima battuta**,
  misurati sulla pulsazione. Senza voce in `SINCRO` l'interruttore non compare per quel brano.
- `FESTA = { 21: { da, salto, fine } }` — il finale in discoteca del brano 21 (battute di inizio/salto/fine).
- `NOVITA_AGGIUNTE` — riquadri novità che non sono nel MusicXML (`prima: true` per metterli davanti).
- `PAUSE_RAGGRUPPATE` — brani in cui le battute di pausa consecutive diventano una sola con il numero.
- `DISEGNI` — brani con disegno proprio.

Interruttori nella barra nera, validi per tutti i brani, spenti di base: **Segui la base**
(`propedeutici.segui`) e **Solfeggio** (triangolino; `raccolte.solfeggio`, `raccolte.solfBpm`, `raccolte.solfClic`).
Altre chiavi: `primiBrani.strumento`, `lim.colonnaChiusa`. Un solo audio alla volta.

### Modificare tutte le raccolte insieme

Le raccolte derivano dal modello. Le loro differenze sono salvate in `_sviluppo/patch/`.

```
python3 _sviluppo/genera_raccolte.py            # dopo aver modificato brani-propedeutici.html
python3 _sviluppo/genera_raccolte.py --salva    # dopo aver modificato a mano una singola raccolta
```

Se una patch non si applica, lo script lo segnala e lascia la pagina com'era: si sistema a mano e si lancia `--salva`.
**Attenzione:** se si cambia a mano una raccolta senza poi lanciare `--salva`, alla rigenerazione successiva
quella modifica si perde.

---

## 4. Storia della musica

- `storia.html` — elenco delle epoche (array `EPOCHE`: per attivarne una basta darle `url` e `img`).
- `storia-antichita.html` — Preistoria e antichità (banner: preistoria a sinistra, antichità a destra; il filtro vale anche per gli strumenti). Idee e link dal programma di prima, lezione 31.
- `storia-rinascimento.html` — Rinascimento (banner: Roma a sinistra, Venezia a destra; ogni ascolto è assegnato a una delle due scuole).
- `storia-barocco.html` — Barocco (banner: Teatro Farnese = musica vocale a sinistra, Cremona = musica strumentale a destra; pulsante speciale «La Fuga» con l'oggetto FUGA nello script, stesso schema dell'Orfeo).
- `storia-classicismo.html` — Classicismo (banner: Esterháza = la corte a sinistra, Vienna = la città a destra; pulsante speciale «La forma sonata» con l'oggetto SPECIALE nello script, sulla Sonata K 545 di Mozart). Beethoven è diviso: il giovane qui (Patetica), la Quinta e l'Inno alla gioia andranno nel Romanticismo.
  Ha in più il pulsante speciale **🎭 L'Orfeo** (Monteverdi, 1607, ponte verso il Barocco): video dell'opera intera + mini-schede Il mito / La storia / Curiosità, testi nell'oggetto `ORFEO` dello script. Lo stesso schema si può riusare per altre opere "speciali" (es. Barocco).
- `storia-medioevo.html` — modello di epoca. Doppio banner (profano a sinistra, sacro a destra; toccando una metà
  si filtrano gli ascolti), schede **Ascolti / Strumenti / Da suonare**, finestra con video, gancio, 2–4 punti
  “cosa ascoltare”, “Lo sapevi?”, frecce ← → ed Esc.
- I contenuti sono negli array `ASCOLTI`, `STRUMENTI`, `SUONARE`; i crediti delle immagini in `CREDITI_IMG`.
- Immagini in `media/storia/<epoca>/`, ritagliate 640×400 (card) e 1400×600 (banner), da Wikimedia Commons,
  Web Gallery of Art (dipinti di pubblico dominio) o Metropolitan Museum Open Access (CC0, API
  `collectionapi.metmuseum.org/public/collection/v1.1/search`); citare autore e licenza delle foto CC BY.
  Wikimedia limita i download (errore 429): scaricare le miniature (thumb) piano, una alla volta.
- **Video (scelte dell'autore):**
  - ascolti completi, niente “momenti cliccabili”;
  - per i brani: **tracce d'album con la copertina** (canali “– Topic” o canali ufficiali), **no concerti dal vivo**
    con audio scadente;
  - per gli strumenti vanno bene video di musicisti che li suonano;
  - un video può risultare “non disponibile” se il proprietario lo rende privato o non in elenco
    (è successo con Ut queant laxis): in quel caso si sostituisce. Le tracce dei canali “– Topic” di solito funzionano.
  - lo script `_sviluppo/controlla_video.sh ID1 ID2 …` dà un'indicazione, ma **non è affidabile per i video “Topic”**
    (dai server esterni risultano bloccati anche quando nel browser funzionano): la prova vera è aprirli nel sito.
  - i video possono sparire nel tempo: ogni tanto ricontrollare tutti gli ID con lo script.
- Tono: storia che **incuriosisce**, non accademica; poco testo, tutto cliccabile, deve stare in una schermata LIM.
  Le leggende si raccontano come leggende. Niente riquadri fissi sulle compositrici (scelta dell'autore).
- Il programma dell'autore (pagina nascosta `programma/programma-m1cekg1q.html`, si apre toccando 6 volte la parola
  “la” nel titolo della home) segue: preistoria in prima; Medioevo, Rinascimento in seconda; Barocco, Classicismo,
  Romanticismo, Novecento, jazz in terza.

---

## 5. Solfeggio

- `solfeggio.html` — pagina della quinta card in home (rossa, icona metronomo). Per ora: Lettura ritmica,
  Solfeggio cantato segnati “presto” (Solfeggio parlato è attivo: vedi sotto), più i collegamenti ai giochi già esistenti
  (Imita il ritmo, Dettato ritmico, Dettato melodico). Per attivare una voce: darle `url` nell'array `VOCI`.

### Il Bona (solfeggio parlato) — trascrizione automatica

**→ Procedura completa e aggiornata: `_sviluppo/omr/PROCEDURA.md` (leggere quella; le note qui sotto sono la storia).**

- Fonte scelta da Cristiano: https://archive.org/details/completemethodfo00bona (4ª ed. italiana riveduta da Bona,
  White-Smith 1905, pubblico dominio). Si usa la numerazione originale delle lezioni; la **scelta** delle lezioni
  è nostra (non copiare la selezione di un'edizione moderna in commercio: la raccolta può essere protetta).
  Il testo inglese di Davenport non si usa.
- `_sviluppo/omr/bona_omr.py bona.pdf PAGINA_PDF PRIMA_LEZIONE uscita/` → un MusicXML per lezione (`bona-030.musicxml`…).
  Usa Audiveris 5.11 (`/opt/audiveris/bin/Audiveris`, .deb dalle release GitHub). Prende lo strato nero
  delle note dal PDF (niente macchie), divide le lezioni dove ricompare il tempo, toglie staccati/dinamiche
  finti nati dalle macchioline, mette corona e doppia barra finali, segnala le battute che non tornano.
- Due passaggi: `bona_omr.py leggi bona.pdf PAGINA_PDF PRIMA_LEZIONE cartella/` → un file di testo per pagina
  (una riga per lezione, note tipo `c4h e5q rq`, avvisi `!` sulle battute che non tornano); lo si corregge
  guardando la pagina pulita, poi `bona_omr.py scrivi pagina.txt media/solfeggio/bona/` crea i MusicXML.
  I testi già controllati delle lezioni 1–75 sono in `_sviluppo/omr/testi/` (la fonte "vera": rigenerano i MusicXML).
- Pagina: `solfeggio-parlato.html` (lettore con conteggio, clic, triangolino a tempo, nomi e colori; "Prepara una
  scheda": fogli A4 verticali con 4 battute per riga, stampa o PDF di più pagine). Gli argomenti sono nell'array
  `ARGOMENTI` della pagina; per nuove lezioni: aggiungere i file e i numeri lì.
- 08/10/2026: lezioni 1–40 (pagine PDF 15–21). Pagine pulite: pochi errori, tutti segnalati; pagine 19 e 21 del PDF
  (tagli addizionali, pause) riconosciute male e riscritte a mano dal confronto.
  Pagina PDF = pagina del libro + 8 (la pag. 12 del libro è la 20 del PDF).

## 6. Da fare / in sospeso

- Brani da suonare del Medioevo (In taberna, Sumer is icumen in, Ut queant laxis) e dell'antichità (Epitaffio di Seikilos): servono gli spartiti.
- Solfeggio: Lettura ritmica e Solfeggio cantato ancora da fare. Bona: fatte 1–100. Dalla 86 la fonte è l'edizione Mangione (IMSLP 756392, pagine pulite a 300 dpi): trascrizione in parallelo con più assistenti, istruzioni in _sviluppo/omr/ISTRUZIONI.md.
- Altre epoche di storia.
- Dominio musicascuole.it (DNS su Aruba + dominio personalizzato in GitHub Pages, www → reindirizzo).
- Anteprima dei link (Open Graph), pagina 404, sitemap.
- Pagina “Come usare il sito”, Viaggio del ritmo (parcheggiato), schede rosse di armonia.
- Strumenti persi: lo script di allineamento delle basi non è più disponibile. Per il PDF → MusicXML ora c'è
  `_sviluppo/omr/` (pensato per il Bona, ma funziona per qualsiasi spartito stampato a una voce).

### Note 08/10/2026 (2)
- Metronomo di `solfeggio-parlato.html`: clic programmati sull'orologio dell'audio (precisi), menu suddivisione
  (movimenti / in 2 / in 3 / in 4): primo movimento acuto, movimenti medi, suddivisioni più piane.
- Motore: aggiunte biscrome ("32nd") e doppio punto nella mappa dei tempi. Verificato: i 63 spartiti delle raccolte
  si disegnano identici a prima.
- Dal PDF del Bona, dalla pagina 22 in poi il riconoscimento automatico sbaglia molto: le lezioni 41–75 sono state
  scritte a mano nei file di testo guardando la scansione ad alta risoluzione (pdftoppm -r 400 -gray).

### Note 08/10/2026 (3)
- `bona_omr.py scrivi`: intestazione con tonalità e tempo ("| armatura=-1 tempo=2/4", "tempo=C|" per il ¢) e terzine
  ("t" dopo la durata: e58t d58t c58t; il gruppo si chiude da solo quando fa 3 volte la nota più breve).
- Motore: gruppi irregolari (time-modification + tuplet start/stop del MusicXML) con il 3 sopra/sotto; le terzine di
  crome/semicrome senza parentesi, quelle di semiminime con la parentesi. Verificato: 138 spartiti identici a prima.
- Metronomo del solfeggio: il battito segue il tempo (semiminima; minima nel ¢; semiminima puntata in 6/8, 9/8, 12/8, 3/8).
- Versione del motore nelle pagine: v=2026-10-08c.
