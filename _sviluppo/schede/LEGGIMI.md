# Schede da stampare per la primaria

Il «quaderno di musica» dalla 1ª alla 5ª: schede A4 generate dal browser e stampate in PDF.

## Come si generano
```
python3 _sviluppo/schede/genera_pdf.py          # tutte (0 = materiali, 1…5 = classi)
python3 _sviluppo/schede/genera_pdf.py 2 3      # solo alcune
```
I PDF escono in `media/primaria/` (pubblicati): per ogni classe `-colori`, `-bianco-e-nero`, `-soluzioni`.
Lo script scrive anche `primaria/pagine.js` (numero della prima pagina di ogni scheda nei PDF), usato dalla pagina del sito.
Avvia un piccolo server locale perché alcune schede leggono i brani MusicXML del sito.
**Dopo ogni modifica alle schede: rigenerare i PDF**, così PDF e pagina del sito restano uguali.

## Sul sito
- `index.html` → card verde «Consigliato per la primaria» → `primaria.html` (card) → `musica-completa.html`.
- `musica-completa.html` disegna le schede dal vivo con lo stesso motore (solo quelle che stanno per comparire),
  con classe, colori / bianco e nero, soluzioni, argomenti a pallini, scheda ingrandita per la LIM e stampa
  di una scheda o di un argomento; i pulsanti gialli scaricano i PDF di `media/primaria/`.

Per guardare le schede nel browser: servire la radice del sito (`python3 -m http.server`) e aprire
`_sviluppo/schede/schede.html?classe=2&modo=col` (oppure `musica-completa.html`) (`modo=bn` bianco e nero, `sol=1` soluzioni, `solo=2G-09` una scheda).

## File (motore in `primaria/`, generatore qui in `_sviluppo/schede/`)
- `schede.html`, `genera_pdf.py` — generatore dei PDF (questa cartella).
- `primaria/motore.js` — pagina A4, testata e piede, modalità colori/bianco e nero, pentagramma "didattico" su VexFlow
  (teste tratteggiate, gambi, chiave a puntini, pause), battute e ritmi con VexFlow (ritmo proporzionale, cuori dei battiti),
  adattamento automatico (se una scheda non sta nella pagina viene rimpicciolita e segnalata).
- `primaria/modelli.js` — modelli riutilizzabili: righe di note, disegna la nota, presentazione di una nota, carte da ritagliare,
  collegamenti, tastiera, dado, diplomi; brani e carte del flauto presi da `motore-schemi.js`.
- `primaria/classe1.js` … `classe5.js`, `materiali.js` — le schede, una funzione per scheda, con il codice del percorso
  (vedi `_sviluppo/idee/idee-sito-primaria.md`, sezione 3).
- `primaria/img/col` e `img/bn` — illustrazioni OpenMoji a colori e al tratto (CC BY-SA 4.0, licenza in `img/LICENZA-OpenMoji.txt`).

## Regole
- Colori delle note quelli del sito; in bianco e nero niente colori: illustrazioni al tratto, pallini da colorare.
- Numeri casuali "ripetibili" (seme = codice della scheda): la scheda esce sempre uguale e le soluzioni coincidono.
- Una scheda con `sol: true` compare anche nel fascicolo delle soluzioni: dentro, `a.sol` dice se disegnare le risposte.
- Prima di consegnare: generare i PDF e guardarli; lo script elenca le schede rimpicciolite (tenerle sopra il 90%).
