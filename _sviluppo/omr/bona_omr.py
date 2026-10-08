#!/usr/bin/env python3
"""
Trascrizione automatica (OMR) delle lezioni del Bona da archive.org.

Fonte: https://archive.org/details/completemethodfo00bona
(Pasquale Bona, Complete Method for Rhythmical Articulation, 4ª ed. italiana, White-Smith 1905: pubblico dominio)
Pagina del PDF = pagina del libro + 8.

Due passaggi, con in mezzo un file di testo facile da correggere a mano:

  1) python3 bona_omr.py leggi bona.pdf PAGINA_PDF PRIMA_LEZIONE cartella/
     -> cartella/pagina-020.png  (solo lo strato nero delle note: niente macchie)
        cartella/pagina-020.txt  (le lezioni in forma di testo, con le battute sospette segnalate)

  2) python3 bona_omr.py scrivi cartella/pagina-020.txt cartella/
     -> un MusicXML per lezione (bona-030.musicxml, ...) per il sito e per MuseScore

Il file di testo:
    # Lezione 30 | Salti di decima
    c4h e5h | d4h f5h | ... | c5w
  una battuta tra due "|"; ogni nota è nome+ottava+durata: c4 = do centrale; durata w h q 8 16
  (semibreve, minima, semiminima, croma, semicroma), "." per il punto; pausa = r + durata (rh, rq ...);
  diesis/bemolle: c#5q, bb4q. Le righe che iniziano con "!" sono avvisi dello script (battute che non tornano).
  La corona sull'ultima nota/pausa e la doppia barra finale vengono aggiunte da sole.

Audiveris (OMR open source): https://github.com/Audiveris/audiveris — installato da
https://github.com/Audiveris/audiveris/releases/download/5.11.0/Audiveris-5.11.0-ubuntu24.04-x86_64.deb
(dpkg -i ...; l'errore finale sul menu del desktop si ignora: il programma va in /opt/audiveris).
"""
import glob, os, re, subprocess, sys, tempfile, zipfile
import xml.etree.ElementTree as ET
from fractions import Fraction
from PIL import Image, ImageOps

AUDIVERIS = "/opt/audiveris/bin/Audiveris"
DUR = {"whole": "w", "half": "h", "quarter": "q", "eighth": "8", "16th": "16", "32nd": "32"}
QL = {"w": Fraction(4), "h": Fraction(2), "q": Fraction(1), "8": Fraction(1, 2), "16": Fraction(1, 4), "32": Fraction(1, 8)}
TIPO = {v: k for k, v in DUR.items()}


# ---------------------------------------------------------------- 1) lettura
def pagina_pulita(pdf, pagina, dest):
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["pdfimages", "-f", str(pagina), "-l", str(pagina), "-png", pdf, os.path.join(tmp, "i")], check=True)
        cand = [Image.open(f) for f in sorted(glob.glob(os.path.join(tmp, "i-*.png")))]
        maschera = max((c for c in cand if c.mode == "1"), key=lambda c: c.size[0] * c.size[1])
        im = ImageOps.invert(maschera.convert("L"))
        w, h = im.size
        im.crop((int(w * 0.025), 0, int(w * 0.967), h)).save(dest, dpi=(350, 350))


def riconosci(png, cartella):
    subprocess.run([AUDIVERIS, "-batch", "-export", "-output", cartella, png],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return sorted(glob.glob(os.path.join(cartella, "*.mxl")))


def misure_da_mxl(f):
    """Battute di un file di Audiveris. Le durate si leggono da <type> e dai punti (Audiveris a volte scrive divisions=0)."""
    with zipfile.ZipFile(f) as z:
        nome = [n for n in z.namelist() if n.endswith(".xml") and not n.startswith("META-INF")][0]
        radice = ET.fromstring(z.read(nome))
    for mis in radice.iter("measure"):
        nuova_lezione = mis.find("attributes/time") is not None
        note = []
        for n in mis.findall("note"):
            if n.find("chord") is not None or n.find("grace") is not None:
                continue      # nel Bona non ci sono accordi: sono segni spuri
            t = n.findtext("type")
            if t not in DUR:
                continue
            d = DUR[t] + "." * len(n.findall("dot"))
            if n.find("rest") is not None:
                note.append("r" + d)
            else:
                p = n.find("pitch")
                alt = {"1": "#", "-1": "b"}.get((p.findtext("alter") or "0").strip(), "")
                note.append(p.findtext("step").lower() + alt + p.findtext("octave") + d)
        yield nuova_lezione, note


def durata(tok):
    m = re.fullmatch(r"(?:r|[a-g][#b]?\d)(w|h|q|8|16|32)(\.*)", tok)
    if not m:
        raise ValueError(f"nota non valida: {tok}")
    base = QL[m.group(1)]
    return base * (2 - Fraction(1, 2 ** len(m.group(2))))


def leggi(pdf, pagina, prima, cartella):
    os.makedirs(cartella, exist_ok=True)
    png = os.path.join(cartella, f"pagina-{pagina:03d}.png")
    pagina_pulita(pdf, pagina, png)
    lezioni = []
    with tempfile.TemporaryDirectory() as tmp:
        for f in riconosci(png, tmp):
            for nuova, note in misure_da_mxl(f):
                if nuova or not lezioni:
                    lezioni.append([])
                lezioni[-1].append(note)
    righe = [f"# pagina {pagina} del PDF — controllare con {os.path.basename(png)}", ""]
    for k, battute in enumerate(lezioni):
        righe.append(f"# Lezione {prima + k} | ")
        for i, b in enumerate(battute, 1):
            tot = sum((durata(t) for t in b), Fraction(0))
            if tot != 4:
                righe.append(f"! battuta {i}: {float(tot):g} quarti invece di 4")
        righe.append(" | ".join(" ".join(b) for b in battute))
        righe.append("")
    dest = os.path.join(cartella, f"pagina-{pagina:03d}.txt")
    open(dest, "w", encoding="utf8").write("\n".join(righe))
    print(f"{dest}: lezioni {prima}–{prima + len(lezioni) - 1}")


# ---------------------------------------------------------------- 2) scrittura
def lezioni_da_testo(testo):
    """Restituisce [(numero, argomento, [battute di token])]."""
    out, corrente = [], None
    for riga in testo.splitlines():
        riga = riga.strip()
        m = re.match(r"#\s*Lezione\s+(\d+)\s*\|?\s*(.*)", riga)
        if m:
            corrente = [int(m.group(1)), m.group(2).strip(), []]
            out.append(corrente)
        elif riga and not riga.startswith(("#", "!")) and corrente is not None:
            corrente[2] += [b.split() for b in riga.split("|") if b.strip()]
    return out


def musicxml(numero, argomento, battute):
    DIV = 8
    x = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">',
         '<score-partwise version="4.0">',
         f'  <movement-title>Lezione {numero}</movement-title>',
         '  <identification><creator type="composer">Pasquale Bona</creator>'
         + (f'<miscellaneous><miscellaneous-field name="argomento">{argomento}</miscellaneous-field></miscellaneous>' if argomento else '')
         + '</identification>',
         '  <part-list><score-part id="P1"><part-name>Voce</part-name></score-part></part-list>',
         '  <part id="P1">']
    for i, b in enumerate(battute, 1):
        x.append(f'    <measure number="{i}">')
        if i == 1:
            x.append(f'      <attributes><divisions>{DIV}</divisions><key><fifths>0</fifths></key>'
                     '<time symbol="common"><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>')
        for j, tok in enumerate(b):
            m = re.fullmatch(r"(r|[a-g][#b]?\d)(w|h|q|8|16|32)(\.*)", tok)
            if not m:
                raise ValueError(f"Lezione {numero}, battuta {i}: nota non valida «{tok}»")
            alt, d, punti = m.groups()
            dur = int(durata(tok) * DIV)
            ultima = i == len(battute) and j == len(b) - 1
            if alt == "r":
                testa = '<rest/>'
            else:
                acc = {"#": 1, "b": -1}.get(alt[1] if len(alt) == 3 else "", 0)
                testa = (f'<pitch><step>{alt[0].upper()}</step>' + (f'<alter>{acc}</alter>' if acc else '')
                         + f'<octave>{alt[-1]}</octave></pitch>')
            x.append(f'      <note>{testa}<duration>{dur}</duration><type>{TIPO[d]}</type>'
                     + '<dot/>' * len(punti)
                     + ('<notations><fermata type="upright"/></notations>' if ultima else '') + '</note>')
        if i == len(battute):
            x.append('      <barline location="right"><bar-style>light-heavy</bar-style></barline>')
        x.append('    </measure>')
    x += ['  </part>', '</score-partwise>', '']
    return "\n".join(x)


def scrivi(file_txt, cartella):
    os.makedirs(cartella, exist_ok=True)
    for numero, argomento, battute in lezioni_da_testo(open(file_txt, encoding="utf8").read()):
        sospette = [i for i, b in enumerate(battute, 1) if sum((durata(t) for t in b), Fraction(0)) != 4]
        open(os.path.join(cartella, f"bona-{numero:03d}.musicxml"), "w", encoding="utf8").write(musicxml(numero, argomento, battute))
        print(f"Lezione {numero} ({argomento or 'senza argomento'}): {len(battute)} battute"
              + (f" — ATTENZIONE battute {sospette} non piene" if sospette else ""))


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "leggi":
        leggi(sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5])
    elif len(sys.argv) >= 2 and sys.argv[1] == "scrivi":
        scrivi(sys.argv[2], sys.argv[3])
    else:
        print(__doc__)
