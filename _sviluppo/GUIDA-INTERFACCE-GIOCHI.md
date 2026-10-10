# Guida alle interfacce dei giochi

Come si progetta, si sistema e si prova l'aspetto di un gioco o di un'app del sito.
Raccoglie il metodo messo a punto con Cristiano nell'ottobre 2026 (branch `migliora-design`).
**Leggila prima di creare un gioco nuovo o di toccare l'impaginazione di uno esistente.**

---

## 1. Cosa vuole Cristiano

- **LIM prima di tutto.** Ogni schermata (menu, partita, risposta giusta e sbagliata, finestre, tutorial,
  riepilogo) deve stare **tutta in una pagina, senza scorrere**, sulla LIM e sul PC.
- **Usare davvero lo spazio.** Non basta "non scorre": se il gioco occupa un rettangolino in mezzo a uno
  schermo enorme è sbagliato. Pentagrammi, pulsanti e testi devono essere grandi e leggibili da lontano.
  (La prima passata, fatta solo per "non scorrere", è stata bocciata proprio per questo.)
- **Migliorare, non ridisegnare.** Stessi colori, caratteri, schede, stile del sito. Niente redesign.
- **Il telefono non cambia.** Né in verticale né girato in orizzontale.
- **Stabilità.** La schermata non deve cambiare dimensione mentre si gioca (fra una domanda e l'altra,
  fra un passo e l'altro del tutorial, quando si apre un'opzione).
- **Si lavora a piccoli passi**: vedi il punto 7.

Giochi che restano come sono, per scelta di Cristiano: **Imita il ritmo**, **Le note sul pianoforte**
(versione originale), **Scarta la nota**, **Memory note**, **Memory strumenti**.

---

## 2. Misure di riferimento

| Nome | Finestra del browser | Cosa rappresenta |
|---|---|---|
| `tuo` | 1920×915 | schermo di Cristiano / LIM |
| `pc` | 1366×657 | PC portatile piccolo |
| `portatile` | 1536×730 | portatile medio |
| telefono | 390×844 e 932×430 | verticale e orizzontale |

Sono le misure **reali** della finestra (tolte barre del browser e di Windows).

---

## 3. La disposizione tipo (da copiare)

Su PC e LIM quasi tutti i giochi seguono lo stesso schema, in **orizzontale**:

```
┌──────────────── titolo + sottotitolo ────────────────┐
│ statistiche (5 caselle)  │  livello (barra)          │
├──────────────────────────┼───────────────────────────┤
│                          │  pulsante ascolto (se c'è)│
│   PENTAGRAMMA grande     │  RISPOSTE grandi,         │
│   (riquadro di misura    │  in griglia               │
│    fissa)                │  Invia / messaggio        │
├──────────────────────────┼───────────────────────────┤
│ Menu / Termina / Ricomincia │       volume / ⚙️       │
└──────────────────────────────────────────────────────┘
```

- Larghezza del gioco **fissa**: ~1100–1240 px (es. colonne `480px 680px` o `460px 680px`).
- Pulsanti di risposta: in **griglia** con larghezza fissa (es. `flex: 0 0 158px` per 4 per riga,
  `260px` per 2×2), carattere ~1–1.3rem, `padding` 15–28px. Mai una riga che va a capo a caso.
- Riquadro del pentagramma con **altezza fissa** (es. `height: 380–400px`), anche quando il pentagramma
  compare solo dopo la risposta: così il gioco non "salta".
- Pentagramma SVG con **larghezza fissa** (`width: 420px !important; height: auto !important`).
- Menu iniziali: titolo sopra e, se le opzioni sono tante, **due colonne** (opzioni a sinistra, modalità a destra).
- Tutorial: testo a sinistra, figure a destra; **altezza minima** della scheda uguale al passo più alto,
  così l'ingrandimento è lo stesso per tutti i passi (es. Identifica la tonalità: 31 passi, uno zoom solo).
- Schermate di scelta (spunte, gruppi): griglie da 4 colonne.

Esempi riusciti da guardare: `acuto-o-grave.html` (il primo, "pilota"), `nomina-intervalli.html`,
`ascolta-intervalli.html`, `identifica-tonalita.html` (anche tutorial e statistiche), `ascolta-accordi.html`,
`riconosci-lo-strumento.html`, `costruttore-di-battute.html`.

---

## 4. Come si fa (tecnica)

### 4.1 Le regole "larghe" e lo script che ingrandisce
1. Tutte le regole per PC/LIM stanno in **un solo blocco** in fondo allo `<style>`:
   ```css
   @media (min-width: 900px) and (min-height: 560px) { ... }
   ```
   La condizione `min-height: 560px` è **obbligatoria**: tiene fuori i telefoni girati in orizzontale
   (larghi ~930 px ma alti ~430). Un blocco con solo `min-width: 900px` cambia il telefono orizzontale.
   (Eccezione: se quel blocco c'era già nella versione originale del gioco, va lasciato com'è.)
2. Dentro il blocco si usano **misure fisse in px**, non `vh`/`vw`/`clamp(...vh...)`.
3. In fondo alla pagina, prima di `</body>`:
   ```html
   <script src="adatta-schermo.js" data-schermate="#homeScreen, #gameContainer"></script>
   ```
   `data-schermate` elenca le schermate principali (menu, scelta, gioco, tutorial...). Lo script prende
   quella visibile e ingrandisce tutta la pagina (zoom del body, tra 0.65 e 2.2) finché riempie la
   finestra senza scorrere. Si ricalcola da solo quando si cambia schermata o la schermata cambia misura.
   Sul telefono non fa nulla.

### 4.2 Attenzioni con lo zoom
- **`vh` crescono con lo zoom.** Finestre e pannelli con `max-height` in vh, nel blocco largo:
  `max-height: calc((100vh - 40px) / var(--zoom, 1));`
- **Spostamenti calcolati in JavaScript** (`getBoundingClientRect` usato per `transform`, `left`, `top`,
  coriandoli, carte che volano): dividere la differenza per `window.fattoreSchermo()`.
  Rapporti (posizione/altezza) invece vanno bene così.
- **Niente `min-height: 100vh`** su una schermata dentro il blocco largo: blocca lo zoom a ~1.
- **`display: contents`**: utile per mettere in griglia elementi di gruppi diversi, ma attenzione alla
  specificità (`#gameContainer .game-col` batte `#nomeSezione`): ripetere l'id del contenitore.
- Se lo zoom di uno stato è molto più basso degli altri, c'è un elemento troppo alto o troppo largo:
  trovarlo e ridurlo, non accettarlo.

### 4.3 Pulsanti: il problema del "bordo alto"
Mai `transform: translateY(...)` o `scale(...)` su `:hover`/`:active` dei pulsanti di gioco
(risposte, note, frecce, ascolto, Invia). Il pulsante si sposta sotto il dito/mouse e un clic vicino al
bordo **non conta**, anche se parte l'animazione. Usare:
```css
.answer:hover  { filter: brightness(1.1); }
.answer:active { filter: brightness(0.92); }
```
Le animazioni di risposta giusta/sbagliata (`@keyframes`) vanno bene: partono dopo il clic.

### 4.4 Sfondo
Non mettere `html { background: ... }`: copre lo sfondo sfumato comune (`comune.css`) e il gioco sembra
diverso dagli altri. Lo sfondo lo dà `comune.css`.

### 4.5 Altre regole del sito (da CLAUDE.md e LEGGIMI)
- Colori delle note: do `#E21C48`, re `#F99D1C`, mi `#FFF428`, fa `#BED958`, sol `#009C95`, la `#5E50A1`, si `#CF3E96`
  (in CSS `var(--do)` ecc. da `comune.css`). Se un gioco ha l'opzione "Colori", deve essere attiva di default.
- Niente microfono, fotocamera, raccolta dati, cookie, servizi esterni.
- Telefoni che non si scaldano: niente `background-attachment: fixed`, `backdrop-filter` su cose che
  scorrono, animazioni infinite; al resize si ridisegna solo se cambia la larghezza.
- Commenti nel CSS in italiano, brevi.
- I file dei giochi sono grandi (audio/immagini in base64, fino a 1,3 MB): non leggerli interi né
  riscriverli da un output letto; cercare con `grep -n` e fare sostituzioni mirate che verificano
  (con `assert`) che il testo da sostituire esista una volta sola.

---

## 5. Come si prova (sempre, prima di mostrare)

Server locale dalla cartella del sito: `python3 -m http.server 8765 --bind 127.0.0.1`
(se le prove dicono "connection refused", riaccenderlo). Gli strumenti sono in `_sviluppo/prove/`:

| Strumento | A cosa serve |
|---|---|
| `stati.py` | gioca il gioco secondo un file di azioni e, per ogni stato, alle tre misure: scorrimento (deve essere 0), zoom, riquadri interni che scorrono, errori JS, schermata. Esempio di azioni: `esempio-azioni.json` |
| `telefono.py` | confronta pixel per pixel il telefono (verticale e orizzontale) con un commit di riferimento; segnala errori e richieste esterne |
| `tutorial.py` | percorre tutti i passi di un tutorial e mostra altezza e zoom di ognuno |
| `bordo.py` | clicca e tocca a 1–20 px dal bordo alto di un pulsante e controlla che la risposta conti |
| `mosaico.py` | unisce 2–4 schermate in una sola immagine da guardare o mandare |

Passi:
1. **Prima**: schermate di tutti gli stati della versione attuale (per capire cosa c'è e cosa spreca spazio).
2. Modifica.
3. **Dopo**: `stati.py` su **tutti** gli stati che un ragazzo o l'insegnante vede: menu e sotto-menu,
   ogni modalità, partita appena iniziata, risposta sbagliata, risposta giusta, il caso con **più risposte
   possibili** (es. tutti gli accordi), finestre (opzioni ⚙️, aiuto ?, schema, conferma), riepilogo finale,
   tutorial passo per passo, statistiche del tutorial. Leggere il codice per scoprire tutte le schermate
   (e le funzioni da chiamare per arrivarci in fretta).
4. **Guardare davvero le schermate** (non solo i numeri): spazio vuoto, testi piccoli, pulsanti che vanno
   a capo, elementi sovrapposti, centratura.
5. `telefono.py <commit originale> <pagina>`: deve dire IDENTICO. Le sole differenze ammesse sono quelle
   volute (es. lo sfondo comune), da controllare a occhio.
6. Tutorial: `tutorial.py` → uno zoom solo (o differenze piccolissime).
7. Pulsanti: `bordo.py` → tutti "ok".
8. Nessun errore JavaScript, nessuna richiesta esterna.

---

## 6. Errori già fatti (da non ripetere)

- Far stare tutto "rimpicciolendo" con `vh` e `clamp`: non scorre, ma sulla LIM resta piccolo e vuoto.
- Assistenti in parallelo con il solo obiettivo "niente scorrimento": risultato bocciato. Meglio un gioco
  alla volta, con un modello da seguire (il "pilota").
- Media query solo `min-width: 900px` → telefono in orizzontale cambiato senza volerlo.
- Pulsanti che salgono/scendono con `transform` → clic sul bordo alto persi.
- `html { background }` → sfondo diverso dagli altri giochi.
- Zoom che cambia fra un passo e l'altro del tutorial o quando compare il pentagramma → mancavano
  altezze fisse/minime.
- Prove con il server spento: prima di dire "c'è un problema", controllare che il server risponda e
  che il gioco accetti risposte in quel momento (molti ignorano i clic mentre suona).
- Il servizio di anteprima `raw.githack.com` a volte risponde "429": è un limite di richieste, non un
  errore del sito; si aspetta e si preme F5.

---

## 7. Come lavorare con Cristiano

- Si lavora su un **branch di prova** (es. `migliora-design`), mai direttamente su `main` per modifiche
  grosse; si porta su `main` solo dopo il suo ok esplicito.
- **Due giochi alla volta**: si sistemano, si provano, si pubblicano sul branch, si mandano le schermate
  (misura `tuo`, 1920×915, meglio un mosaico) con un riassunto breve, e si **aspetta l'ok** prima di
  passare ai successivi (a meno che dica di procedere da soli).
- Anteprima da mandargli: `https://raw.githack.com/musicapeyron/musicapeyron.github.io/<branch>/<pagina>.html`
- Se interrompe, ci si ferma e si aspetta. Se nota un problema in un gioco già fatto, si sistema subito.
- Cose fuori dalla richiesta: segnalarle e chiedere, non cambiarle di propria iniziativa.
- Commit con descrizione in italiano che dice cosa cambia per chi usa il sito.

---

## 8. Lista di controllo per ogni gioco

- [ ] Blocco `@media (min-width: 900px) and (min-height: 560px)` con misure fisse, niente vh
- [ ] Disposizione orizzontale che usa lo spazio (pentagramma grande, risposte grandi)
- [ ] `adatta-schermo.js` con tutte le schermate in `data-schermate`
- [ ] Finestre con `max-height` divise per `var(--zoom, 1)`; spostamenti JS divisi per `fattoreSchermo()`
- [ ] Riquadri a misura fissa: lo zoom non cambia durante la partita né nel tutorial
- [ ] Pulsanti senza `transform` su hover/active (`bordo.py` tutto ok)
- [ ] Nessun `html { background }`
- [ ] `stati.py`: tutti gli stati a 0 scorrimento, schermate guardate a `tuo` e `pc`
- [ ] `telefono.py`: IDENTICO in verticale e orizzontale
- [ ] Nessun errore JS, nessuna richiesta esterna
- [ ] Commit in italiano sul branch, schermate a Cristiano, attesa dell'ok
