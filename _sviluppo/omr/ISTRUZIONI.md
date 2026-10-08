# Trascrizione lezioni del Bona (Metodo completo per la divisione) — istruzioni per chi trascrive

Cartella di lavoro: /tmp/claude-0/-home-claude/d579e4e1-f205-5a3d-9bff-63792b564f16/scratchpad/bona2
(lancia i comandi da lì; usa percorsi assoluti se la shell cambia cartella).

Fonte: immagini pulite a 300 dpi delle pagine, `pg/pNN.png` (NN = pagina del PDF, 22–40).
Ogni lezione è una sola voce in chiave di violino. Le note sono di Pasquale Bona; ignora testi e annotazioni del curatore
("Ton. de ...", note a piè di pagina, "3 ou 9/8" ecc.): trascrivi solo le note scritte sul pentagramma.

## Strumenti
- `python3 bozza.py NN` — fa leggere la pagina ad Audiveris (riconoscimento automatico) e stampa una BOZZA battuta per battuta
  con la durata totale in quarti. È utile come punto di partenza ma sbaglia spesso (battute fuse, durate, alterazioni, terzine):
  NON fidarti, controlla tutto sull'immagine.
- `python3 zoom.py NN Y0 Y1 [X0 X1] [nome.png]` — ritaglia la pagina (frazioni 0–1 di altezza e larghezza) in `zoom/nome.png`;
  poi guardala con lo strumento Read. Usa nomi file tuoi (es. `zoom/p26_a.png`) perché altri lavorano in parallelo.
  Per leggere bene: un rigo per volta (Y0..Y1 ≈ 0.07 di altezza), metà rigo per volta (X 0–0.55 e 0.45–1).
- Controllo: `python3 /home/claude/repo/musicapeyron.github.io-main/_sviluppo/omr/bona_omr.py scrivi ok4/lNNN.txt /tmp/claude-0/prova_NNN`
  stampa il numero di battute e "ATTENZIONE battute [...] non piene" se qualche battuta non torna col tempo. Correggi finché
  non ci sono avvisi (unica eccezione accettabile: anacrusi iniziale e battuta finale che la completa).

## Formato del file (uno per lezione): ok4/lNNN.txt  (es. ok4/l087.txt)
```
# Lezione 87 | Moderato assai · do maggiore, 9/8 | armatura=0 tempo=9/8
g4q. c5q. e5q. | d5h.~ d5q. | ...
```
- Intestazione: numero | andamento scritto sopra il rigo (in italiano, minuscolo dopo la prima lettera) · tonalità in italiano, tempo |
  armatura=N (diesis positivi, bemolli negativi: sol=1, re=2, la=3, mi=4; fa=-1, sib=-2, mib=-3, lab=-4; tonalità minori come la
  relativa maggiore: la minore = 0, mi minore = 1...) tempo=4/4, 3/4, 2/4, 3/8, 6/8, 9/8, 12/8, 2/2... (per il ¢ scrivi tempo=C|).
- Corpo: le battute separate da " | " (anche su più righe: ogni riga che non inizia con # è musica).
- Nota = nome + ottava + durata: c4 = do centrale; b3 sotto; c5 il do nel terzo spazio; durate w h q 8 16 32
  (semibreve, minima, semiminima, croma, semicroma, biscroma). Esempi: c4q, f#5h, bb48, eb516.
- Punto: "." dopo la durata (q. = semiminima puntata; q.. doppio punto). Pausa: r + durata (rq, r8, rh., rw ...).
- Altezza VERA della nota, sempre con le sue alterazioni effettive: in fa maggiore il si è bb4 (non b4); un bequadro che annulla
  la chiave si scrive col nome semplice (in fa maggiore "b4" = si naturale). Ricorda che un'alterazione accidentale vale fino alla
  fine della battuta.
- Legatura di valore (stessa nota legata alla seguente): "~" in fondo, es. d5h.~ d5q. Le legature di portamento (fra note diverse) NON si scrivono.
- Terzine: "t" dopo la durata (e il punto se c'è): c58t d58t e58t. Il gruppo si chiude da solo quando le note fanno 3 volte la più
  breve (quindi anche e48t f416t... funziona). Sestina di semicrome = due terzine di semicrome consecutive. Altri gironi (5, 7...):
  approssima nel modo più sensato e scrivilo in una riga "# nota: ...".
- Pausa di un'intera battuta: scrivi la pausa con la durata della battuta (rh. in 3/4, rw in 4/4, rq. in 3/8...).
- NON si scrivono: corona (viene messa da sola sull'ultima nota), dinamiche, staccati, acciaccature/abbellimenti, segni di ritornello.
  Se ci sono abbellimenti o ritornelli scrivi una riga di commento, es. "# nota: battuta 5 appoggiatura re prima del do" o
  "# nota: ritornello battute 1–8" (in quel caso trascrivi la musica una volta sola, come è stampata).

## Consegna
Alla fine, per ogni lezione: file ok4/lNNN.txt scritto e verificato (nessun ATTENZIONE). Nel messaggio finale elenca le lezioni fatte,
il numero di battute di ciascuna e i punti in cui non eri sicuro (battuta + motivo). Non modificare altri file.
