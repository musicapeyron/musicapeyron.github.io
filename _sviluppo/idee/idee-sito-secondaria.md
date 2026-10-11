# Idee per il sito – secondaria

Raccolta di idee per nuovi giochi, app e sezioni. Ogni idea: concetto, come funziona, punti di forza didattici.

---

## 1. Grafia musicale – ripasso e regole (versione medie)

**Destinatari:** secondaria di primo grado. Ben distinta dalla versione della primaria (vedi `idee-sito-primaria.md`): stesso principio del tratto animato, ma tono, contenuti e ritmo pensati per ragazzi delle medie.

**Concetto:** ripasso veloce del gesto per chi arriva alle medie senza aver mai scritto musica, e soprattutto le **regole di scrittura corretta** di una partitura.

**Come funziona:**
- Ripasso rapido degli elementi base (teste, gambi, chiave di violino): animazione del tratto più veloce, saltabile, consultabile come scheda.
- Il cuore sono le regole che alle medie si sbagliano spesso:
  - direzione dei gambi rispetto alla terza linea, gambo a destra se va su, a sinistra se va giù;
  - code e travature raggruppate secondo i movimenti della battuta;
  - alterazioni prima della nota e alla stessa altezza; punto di valore nello spazio;
  - legatura di valore e legatura di portamento (differenza);
  - chiave di basso, tagli addizionali, indicazione di tempo, stanghetta finale, segni di ripetizione, dinamiche.
- Esempi "giusto / sbagliato" affiancati: il ragazzo deve trovare l'errore.
- Grafica sobria e da ragazzi più grandi, niente filastrocche.

**Punti di forza didattici:**
- Passa dal *come si traccia* al *perché si scrive così*: la grafia diventa leggibilità e precisione.
- Il confronto giusto/sbagliato allena l'occhio critico, utile anche per correggere i propri compiti e per la lettura.
- Recupera in poco tempo chi ha lacune dalla primaria senza annoiare chi le basi le ha già.

**Note di sviluppo:**
- Una sola schermata su PC e LIM, senza scorrere.
- Nessun microfono/fotocamera, nessuna raccolta dati.
- Il motore di animazione del tratto può essere lo stesso della primaria; cambiano contenuti, grafica e velocità.

---

## 2. Body percussion per imitazione (versione medie)

**Destinatari:** secondaria di primo grado. Ben distinta dalla versione della primaria (vedi `idee-sito-primaria.md`): qui si passa dall'imitazione alla **lettura** con notazione vera.

**Concetto:** imitazione e lettura di pattern di body percussion scritti con **simboli ritmici reali** su un rigo a più linee, una linea per ogni parte del corpo (come nelle partiture per percussioni).

**Come funziona:**
- Partitura "a righe": ogni linea è un suono del corpo (piedi in basso, cosce, petto, mani, schiocco in alto), con una piccola icona a inizio riga come legenda.
- Figure ritmiche vere: semiminime, crome, pause, poi sedicesimi, sincopi, ritmi puntati; tempi in 4/4, 3/4 e 6/8.
- Due modalità:
  - **Eco:** l'app esegue una battuta (suono + nota evidenziata), la classe ripete; la scrittura appare dopo, per collegare ciò che si è fatto a ciò che si legge.
  - **Lettura:** la partitura appare prima, la classe esegue con il metronomo; l'app poi esegue la versione corretta per confronto.
- Gioco d'insieme: ostinato a più parti (gruppi della classe su righe diverse) e canone.
- Tempo regolabile, ripetizione in loop di una battuta.
- L'app **non ascolta** la classe: nessun microfono, la verifica la fa l'insegnante.

**Punti di forza didattici:**
- Collega corpo, orecchio e notazione: la figura ritmica diventa un gesto.
- Dall'imitazione alla lettura autonoma, con difficoltà graduale (fino a sincopi e sedicesimi).
- Polifonia ritmica: ogni gruppo tiene la sua parte ascoltando le altre; ottimo per lavorare in classe alla LIM.
- Si collega a "Imita il ritmo", "Lettura ritmica" e "Figure ritmiche" già presenti nel sito.

**Note di sviluppo:**
- Una sola schermata su PC e LIM, senza scorrere.
- Nessun microfono/fotocamera, nessuna raccolta dati.
- La partitura può usare il motore degli spartiti (VexFlow, rigo percussioni).

---

## 3. Componi a celle (versione medie)

**Destinatari:** secondaria di primo grado. Esiste una versione distinta per il liceo musicale, vedi `idee-sito-liceo-musicale.md`.

**Concetto:** un semplice programma per comporre musica integrato nel sito, basato su una **griglia di celle**: ogni riga è un suono, ogni colonna un momento nel tempo. Si clicca una cella per accenderla e la musica suona in loop.

**Come funziona:**
- Griglia della melodia: 8 righe (do re mi fa sol la si do) con i colori delle note del sito, 16 colonne (4 battute da 4).
- Sotto, righe di percussioni (cassa, rullante, piatto, battito di mani) e una riga di basso con pochi suoni (do, fa, sol).
- Barra che scorre sulla griglia durante la riproduzione; tempo regolabile; tasto play/stop grande.
- Celle lunghe: trascinando si allunga la nota (introduce le durate).
- Scelta del timbro (pianoforte, flauto, marimba…).
- Vista "spartito": la griglia si trasforma nelle note sul pentagramma, per collegare celle e notazione.
- Sfide facoltative: componi una melodia che finisce sul do; crea un ostinato di 1 battuta; fai domanda e risposta.
- Il lavoro si **scarica come file** e si può ricaricare; nessun account, niente salvato online.

**Punti di forza didattici:**
- Chiunque compone subito, anche senza saper leggere la musica o suonare uno strumento: si vede e si sente.
- La griglia rende visibili altezza (in verticale) e tempo (in orizzontale): ottima base per capire il pentagramma.
- Si sperimentano ostinato, melodia e accompagnamento, ripetizione e variazione, forma domanda-risposta.
- Lavoro creativo da fare in coppia o alla LIM con tutta la classe.

**Note di sviluppo:**
- Una sola schermata su PC e LIM, senza scorrere.
- Nessun microfono/fotocamera, nessuna raccolta dati; salvataggi solo come file scaricato o in `localStorage`.
- Audio generato nel browser (Web Audio), AudioContext in pausa quando tace (regole del sito sul risparmio energetico).
- La vista spartito può usare il motore degli spartiti (VexFlow).

---
