# Trascrivere spartiti stampati in MusicXML (Bona e simili) — procedura completa

Tutto ciò che serve è in questa cartella `_sviluppo/omr/`. Una nuova sessione di Claude deve solo leggere questo file.
(La cartella `_sviluppo` non viene pubblicata sul sito: inizia con "_".)

## Strumenti in questa cartella
| File | A cosa serve |
|---|---|
| `estrai_pagine.py PDF PRIMA ULTIMA cartella/` | pagine del PDF → immagini pulite `pNN.png` (gestisce scansioni archive.org e PDF 1-bit di IMSLP) |
| `bozza.py cartella/pNN.png [bozze/]` | lettura automatica con Audiveris → bozza battuta per battuta con durata in quarti (sbaglia spesso!) |
| `zoom.py pagina.png Y0 Y1 [X0 X1] [out.png]` | ritaglio ingrandito per leggere a occhio (un rigo, mezzo rigo alla volta) |
| `bona_omr.py scrivi file.txt cartella/` | file di testo controllato → un MusicXML per lezione (`bona-NNN.musicxml`), con avvisi se una battuta non torna |
| `bona_omr.py leggi PDF PAGINA PRIMA cartella/` | (vecchio metodo, scansione archive.org) bozza di una pagina già in formato testo |
| `confronta.py pagina.png cartella_xml/ out.png N1 N2…` | controllo finale: pagina del libro accanto alle lezioni disegnate dal motore del sito |
| `ISTRUZIONI.md` | istruzioni per chi trascrive (formato dei file di testo, regole) — da dare agli assistenti in parallelo |
| `testi/` | **i testi controllati di tutte le lezioni fatte (1–100)**: sono la fonte "vera", da qui si rigenerano i MusicXML |

## Programmi necessari (nell'ambiente di lavoro di Claude)
- **Audiveris 5.11** (riconoscimento ottico della musica):
  `curl -sSL -o aud.deb https://github.com/Audiveris/audiveris/releases/download/5.11.0/Audiveris-5.11.0-ubuntu24.04-x86_64.deb && dpkg -i aud.deb`
  (l'errore finale sul menu del desktop si ignora; il programma è in `/opt/audiveris/bin/Audiveris`). Serve Java (già presente).
- Python con Pillow e music21 (`pip install --break-system-packages music21`), poppler-utils (`pdfimages`, `pdftoppm`), Playwright+Chromium (già presenti).

## Fonti del Bona
- Lezioni 1–85: Internet Archive, ed. White-Smith 1905 (pubblico dominio):
  https://ia800802.us.archive.org/3/items/completemethodfo00bona/completemethodfo00bona.pdf  — pagina PDF = pagina libro + 8.
- Lezioni 86–100 (e successive): IMSLP, ed. Mangione (De Benedictis), stampa moderna pulita, OMR molto migliore:
  https://s9.imslp.org/files/imglnks/usimg/3/31/IMSLP756392-PMLP419777-405318960-Benedictis-Savino-P-Bona-metodo-completo-para-divisao-pdf.pdf
  Stessa numerazione delle lezioni. Pagine PDF: 24 (fine 85, 86) · 25 (87–88) · 26 (89–90) · 27 (91) · 28 (92) · 29 (93) · 30 (94) · 31 (95) ·
  32 (96) · 33 (97–98) · 34 (fine 98) · 35 (Terza parte, 99) · 36 (100) · 37 (101) · 38 (102) · 39 (103) · 40 (104) … fino a p. 60.
  Dalla 99 (Terza parte) molti abbellimenti: il formato attuale non li disegna (vanno annotati in "# nota:").

## Procedura che ha funzionato (lezioni 86–100, ~15 lezioni in una volta)
1. `python3 _sviluppo/omr/estrai_pagine.py mangione.pdf 37 45 lavoro/pg/` (scaricare prima il PDF con curl).
2. Copiare `ISTRUZIONI.md` nella cartella di lavoro, sistemando i percorsi.
3. Lanciare **più assistenti in parallelo** (uno per 1–3 lezioni/pagine). A ciascuno: "Leggi e segui ISTRUZIONI.md; trascrivi le lezioni X–Y
   dalla pagina pNN.png; lavora nota per nota con zoom un rigo alla volta; verifica con bona_omr.py scrivi; consegna i file ok4/lNNN.txt
   e l'elenco dei punti incerti."
4. Generare i MusicXML: `python3 _sviluppo/omr/bona_omr.py scrivi lNNN.txt media/solfeggio/bona/` (per ogni file).
5. `confronta.py` per ogni pagina e controllare a occhio; mandare le immagini di confronto a Cristiano.
6. Copiare i testi in `_sviluppo/omr/testi/`, aggiungere le lezioni a `ARGOMENTI` in `solfeggio-parlato.html`
   (la Parte seconda è divisa per tempo: 4/4, ¢, 2/4, 3/8, 3/4, 6/8, 9/8, 12/8).
7. GitHub accetta max 100 file per caricamento: dividere gli zip se servono più file.

## Cose da sapere
- Il motore disegna: chiave di violino, armature, tempi semplici/composti/¢, terzine, legature di valore, punto e doppio punto, fino alle biscrome.
  Non disegna ancora: chiave di basso, abbellimenti (appoggiature, gruppetti), corone a metà brano, quintine/sestine vere (approssimate).
- Il metronomo della pagina segue il tempo: semiminima; minima nel ¢; semiminima puntata in 6/8, 9/8, 12/8, 3/8.
