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
  diesis/bemolle: c#5q, bb4q; doppio punto: "q.."; terzina: "t" dopo la durata (e58t d58t c58t); legatura di valore verso la nota seguente: "~" in fondo (c4h~). Le righe che iniziano con "!" sono avvisi dello script (battute che non tornano).
  Tonalità e tempo nell'intestazione: "# Lezione 76 | argomento | armatura=-1 tempo=3/4" (bemolli negativi, diesis
  positivi; tempo=C| per il ¢). Le note si scrivono sempre con l'altezza vera (in fa maggiore il si è "bb4"): il sito mette da solo le alterazioni.
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
            if any(x.get("type") == "start" for x in n.findall("tie")):
                d += "~"   # legatura di valore verso la nota seguente
            if n.find("rest") is not None:
                note.append("r" + d)
            else:
                p = n.find("pitch")
                alt = {"1": "#", "-1": "b"}.get((p.findtext("alter") or "0").strip(), "")
                note.append(p.findtext("step").lower() + alt + p.findtext("octave") + d)
        yield nuova_lezione, note


def durata(tok):
    m = re.fullmatch(r"(?:r|[a-g][#b]?\d)(w|h|q|8|16|32)(\.*)(t?)~?", tok)
    if not m:
        raise ValueError(f"nota non valida: {tok}")
    base = QL[m.group(1)]
    return base * (2 - Fraction(1, 2 ** len(m.group(2)))) * (Fraction(2, 3) if m.group(3) else 1)


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
    """Restituisce [(numero, argomento, [battute di token], opzioni)].
    Intestazione: "# Lezione 76 | argomento | armatura=-1 tempo=3/4" (armatura: bemolli negativi, diesis positivi)."""
    out, corrente = [], None
    for riga in testo.splitlines():
        riga = riga.strip()
        m = re.match(r"#\s*Lezione\s+(\d+)\s*\|?\s*([^|]*)\|?\s*(.*)", riga)
        if m:
            opz = dict(x.split("=", 1) for x in m.group(3).split() if "=" in x)
            corrente = [int(m.group(1)), m.group(2).strip(), [], opz]
            out.append(corrente)
        elif riga and not riga.startswith(("#", "!")) and corrente is not None:
            corrente[2] += [b.split() for b in riga.split("|") if b.strip()]
    return out


def musicxml(numero, argomento, battute, opz=None):
    opz = opz or {}
    DIV = 8
    armatura = int(opz.get("armatura", 0))
    tempo = opz.get("tempo", "4/4")
    if tempo == "C|":   # ¢ (tempo tagliato): si scrive come 4/4 con il simbolo ¢, il battito è la minima
        beats, beat_type, simbolo = 4, 4, ' symbol="cut"'
    else:
        beats, beat_type = (int(v) for v in tempo.split("/"))
        simbolo = ' symbol="common"' if (beats, beat_type) == (4, 4) else ""
    x = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">',
         '<score-partwise version="4.0">',
         f'  <movement-title>Lezione {numero}</movement-title>',
         '  <identification><creator type="composer">Pasquale Bona</creator>'
         + (f'<miscellaneous><miscellaneous-field name="argomento">{argomento}</miscellaneous-field></miscellaneous>' if argomento else '')
         + '</identification>',
         '  <part-list><score-part id="P1"><part-name>Voce</part-name></score-part></part-list>',
         '  <part id="P1">']
    legata_prima = False
    for i, b in enumerate(battute, 1):
        x.append(f'    <measure number="{i}">')
        if i == 1:
            x.append(f'      <attributes><divisions>{DIV}</divisions><key><fifths>{armatura}</fifths></key>'
                     f'<time{simbolo}><beats>{beats}</beats><beat-type>{beat_type}</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>')
        gruppo = []   # terzina in corso: durate nominali delle sue note
        for j, tok in enumerate(b):
            m = re.fullmatch(r"(r|[a-g][#b]?\d)(w|h|q|8|16|32)(\.*)(t?)(~?)", tok)
            if not m:
                raise ValueError(f"Lezione {numero}, battuta {i}: nota non valida «{tok}»")
            alt, d, punti, terz, lega = m.groups()
            dur = int(durata(tok) * DIV)
            ultima = i == len(battute) and j == len(b) - 1
            if alt == "r":
                testa = '<rest/>'
            else:
                acc = {"#": 1, "b": -1}.get(alt[1] if len(alt) == 3 else "", 0)
                testa = (f'<pitch><step>{alt[0].upper()}</step>' + (f'<alter>{acc}</alter>' if acc else '')
                         + f'<octave>{alt[-1]}</octave></pitch>')
            legature = (['stop'] if legata_prima else []) + (['start'] if lega else [])
            tupla = ""
            if terz:   # terzina: si chiude quando le durate nominali fanno 3 volte la più breve
                nominale = QL[d] * (2 - Fraction(1, 2 ** len(punti)))
                inizio = not gruppo; gruppo.append(nominale)
                fine = sum(gruppo) == 3 * min(gruppo)
                if fine: gruppo = []
                tupla = (('<tuplet type="start" bracket="no"/>' if inizio else '') + ('<tuplet type="stop"/>' if fine else ''))
            notazioni = ''.join(f'<tied type="{t}"/>' for t in legature) + tupla + ('<fermata type="upright"/>' if ultima else '')
            x.append(f'      <note>{testa}<duration>{dur}</duration>'
                     + ''.join(f'<tie type="{t}"/>' for t in legature)
                     + f'<type>{TIPO[d]}</type>' + '<dot/>' * len(punti)
                     + ('<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>' if terz else '')
                     + (f'<notations>{notazioni}</notations>' if notazioni else '') + '</note>')
            legata_prima = bool(lega)
        if i == len(battute):
            x.append('      <barline location="right"><bar-style>light-heavy</bar-style></barline>')
        x.append('    </measure>')
    x += ['  </part>', '</score-partwise>', '']
    return "\n".join(x)


def scrivi(file_txt, cartella):
    os.makedirs(cartella, exist_ok=True)
    for numero, argomento, battute, opz in lezioni_da_testo(open(file_txt, encoding="utf8").read()):
        b_, t_ = (int(v) for v in opz.get("tempo", "4/4").replace("C|", "4/4").split("/"))
        piena = Fraction(4 * b_, t_)
        sospette = [i for i, b in enumerate(battute, 1) if sum((durata(t) for t in b), Fraction(0)) != piena]
        open(os.path.join(cartella, f"bona-{numero:03d}.musicxml"), "w", encoding="utf8").write(musicxml(numero, argomento, battute, opz))
        print(f"Lezione {numero} ({argomento or 'senza argomento'}): {len(battute)} battute"
              + (f" — ATTENZIONE battute {sospette} non piene" if sospette else ""))


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "leggi":
        leggi(sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5])
    elif len(sys.argv) >= 2 and sys.argv[1] == "scrivi":
        scrivi(sys.argv[2], sys.argv[3])
    else:
        print(__doc__)
