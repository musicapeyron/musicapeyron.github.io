#!/usr/bin/env python3
"""
Trascrizione automatica (OMR) delle lezioni del Bona da archive.org.

Fonte: https://archive.org/details/completemethodfo00bona
(Pasquale Bona, Complete Method for Rhythmical Articulation, 4ª ed. italiana, White-Smith 1905: pubblico dominio)

Uso:
    python3 bona_omr.py bona.pdf PAGINA_PDF PRIMA_LEZIONE cartella_uscita
    es. python3 bona_omr.py bona.pdf 20 30 uscita/      -> lezioni 30, 31, ... della pagina 20 del PDF

Cosa fa:
  1. dal PDF estrae solo lo strato nero delle note (archive.org lo salva separato: macchie e ingiallimento spariscono);
  2. lo fa leggere ad Audiveris (OMR open source, https://github.com/Audiveris/audiveris),
     installato da: https://github.com/Audiveris/audiveris/releases/download/5.11.0/Audiveris-5.11.0-ubuntu24.04-x86_64.deb
     (dpkg -i ...; l'errore finale sul menu del desktop si può ignorare: il programma va in /opt/audiveris);
  3. divide la pagina in lezioni: nel Bona ogni lezione ricomincia con l'indicazione del tempo;
  4. sistema i dettagli fissi del Bona: corona sull'ultima nota o pausa, doppia barra finale;
  5. controlla che ogni battuta sia piena secondo il tempo e stampa le battute sospette, da guardare a mano.
Escono un file MusicXML per lezione (bona-030.musicxml, ...) e l'immagine pulita della pagina.
"""
import copy, glob, os, subprocess, sys, tempfile
from PIL import Image, ImageOps
import music21 as m21

AUDIVERIS = "/opt/audiveris/bin/Audiveris"


def pagina_pulita(pdf, pagina, dest):
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["pdfimages", "-f", str(pagina), "-l", str(pagina), "-png", pdf, os.path.join(tmp, "i")], check=True)
        # lo strato delle note è l'immagine a 1 bit (maschera) più grande della pagina
        cand = [Image.open(f) for f in sorted(glob.glob(os.path.join(tmp, "i-*.png")))]
        maschera = max((c for c in cand if c.mode == "1"), key=lambda c: c.size[0] * c.size[1])
        im = ImageOps.invert(maschera.convert("L"))
        w, h = im.size
        im = im.crop((int(w * 0.025), 0, int(w * 0.967), h))   # via i bordi neri della scansione
        im.save(dest, dpi=(350, 350))


def riconosci(png, cartella):
    subprocess.run([AUDIVERIS, "-batch", "-export", "-output", cartella, png],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return sorted(glob.glob(os.path.join(cartella, "*.mxl")))


def lezioni(file_mxl):
    """Divide in lezioni: una nuova lezione comincia dove compare l'indicazione del tempo."""
    gruppi = []
    for f in file_mxl:
        parte = m21.converter.parse(f).parts[0]
        for mis in parte.getElementsByClass(m21.stream.Measure):
            if mis.getElementsByClass(m21.meter.TimeSignature) or not gruppi:
                gruppi.append([])
            gruppi[-1].append(mis)
    return gruppi


def costruisci(misure, numero):
    s = m21.stream.Score()
    s.metadata = m21.metadata.Metadata()
    s.metadata.movementName = f"Lezione {numero}"
    s.metadata.composer = "Pasquale Bona"
    p = m21.stream.Part()
    tempo = None
    sospette = []
    for i, mis in enumerate(misure, 1):
        nuova = copy.deepcopy(mis)
        nuova.number = i
        for el in list(nuova.getElementsByClass(m21.layout.LayoutBase)):
            nuova.remove(el)
        # le macchioline della carta diventano staccati, dinamiche o scritte: nella prima parte del Bona
        # non ce ne sono, quindi si tolgono tutte (resta solo la corona finale)
        for el in list(nuova.recurse().getElementsByClass((m21.dynamics.Dynamic, m21.expressions.TextExpression,
                                                          m21.dynamics.DynamicWedge, m21.spanner.Slur))):
            el.activeSite.remove(el)
        for n in nuova.notesAndRests:
            n.articulations = []
            n.expressions = [e for e in n.expressions if isinstance(e, m21.expressions.Fermata)]
        ts = nuova.getElementsByClass(m21.meter.TimeSignature)
        if ts: tempo = ts[0]
        if i == 1 and not nuova.getElementsByClass(m21.clef.Clef):
            nuova.insert(0, m21.clef.TrebleClef())
        atteso = tempo.barDuration.quarterLength if tempo else 4
        durata = sum(n.quarterLength for n in nuova.notesAndRests)
        if abs(durata - atteso) > 1e-6:
            sospette.append((i, durata, atteso))
        # niente gruppi irregolari nel Bona (prima parte): li segnala comunque
        if any(n.duration.tuplets for n in nuova.notesAndRests):
            sospette.append((i, "terzine?", atteso))
        p.append(nuova)
    ultima = p.getElementsByClass(m21.stream.Measure)[-1]
    fine = list(ultima.notesAndRests)[-1]
    if not any(isinstance(e, m21.expressions.Fermata) for e in fine.expressions):
        fine.expressions.append(m21.expressions.Fermata())
    ultima.rightBarline = m21.bar.Barline("final")
    s.insert(0, p)
    return s, sospette


def main():
    pdf, pagina, prima, uscita = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
    os.makedirs(uscita, exist_ok=True)
    png = os.path.join(uscita, f"pagina-{pagina:03d}.png")
    pagina_pulita(pdf, pagina, png)
    with tempfile.TemporaryDirectory() as tmp:
        gruppi = lezioni(riconosci(png, tmp))
    for k, misure in enumerate(gruppi):
        n = prima + k
        s, sospette = costruisci(misure, n)
        dest = os.path.join(uscita, f"bona-{n:03d}.musicxml")
        s.write("musicxml", fp=dest)
        stato = "ok" if not sospette else "DA CONTROLLARE: " + ", ".join(f"battuta {b} ({d} invece di {a})" for b, d, a in sospette)
        print(f"Lezione {n}: {len(misure)} battute — {stato}")


if __name__ == "__main__":
    main()
