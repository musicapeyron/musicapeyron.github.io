#!/usr/bin/env python3
"""
Solfège des solfèges (Lemoine-Carulli, ed. Danhauser-Lemoine-Lavignac, Lemoine 1923, pubblico dominio):
lezioni per canto e pianoforte, trascritte a mano in un file di testo -> MusicXML a due parti (Canto, Pianoforte).

Uso:
  python3 carulli.py scrivi lezioni.txt cartella/        -> cartella/carulli-NNN.musicxml (+ avvisi se le battute non tornano)
  python3 carulli.py disegna lezioni.txt cartella_png/   -> un'immagine per lezione (con Verovio), per confrontarla col libro

Formato (vedi ISTRUZIONI-CARULLI.md):
  # Lezione 11 | Le semibrevi e le pause | armatura=0 tempo=4/4 andamento=Moderato autore=Henry Lemoine
  V: g4w | a4w | ...          canto (chiave di violino)
  D: [c4e4g4]w | ...          pianoforte, mano destra (chiave di violino)
  S: c3q e3q g3q c4q | ...    pianoforte, mano sinistra (chiave di basso)
Più righe V:/D:/S: si accodano (una per sistema). Note come nel Bona (c4q, f#5h., rq, ~ legatura, t terzina),
accordi tra quadre [c4e4g4]h (legatura: [c4e4]h~ tutto l'accordo, oppure [c4~e4]h solo il do),
due voci nella stessa mano separate da " & " dentro la battuta, "s" + durata = spazio vuoto in una voce (es. sh).
"""
import os, re, sys
from fractions import Fraction

QL = {"w": Fraction(4), "h": Fraction(2), "q": Fraction(1), "8": Fraction(1, 2), "16": Fraction(1, 4), "32": Fraction(1, 8)}
TIPO = {"w": "whole", "h": "half", "q": "quarter", "8": "eighth", "16": "16th", "32": "32nd"}
DIV = 24
NOTA = r"[a-g][#bn]?\d~?"
TOK = re.compile(rf"^(?:(?P<acc>\[(?:{NOTA})+\])|(?P<nota>[a-g][#bn]?\d)|(?P<pausa>r)|(?P<spazio>s))(?P<d>w|h|q|8|16|32)(?P<punti>\.*)(?P<t>t?)(?P<lega>~?)$")


def analizza(tok, dove):
    m = TOK.match(tok)
    if not m:
        raise ValueError(f"{dove}: segno non valido «{tok}»")
    g = m.groupdict()
    nominale = QL[g["d"]] * (2 - Fraction(1, 2 ** len(g["punti"])))
    dur = nominale * (Fraction(2, 3) if g["t"] else 1)
    if g["acc"]:
        note = [(n[:-1] if n.endswith("~") else n, n.endswith("~") or bool(g["lega"])) for n in re.findall(NOTA, g["acc"])]
        tipo = "nota"
    elif g["nota"]:
        note, tipo = [(g["nota"], bool(g["lega"]))], "nota"
    else:
        note, tipo = [], "pausa" if g["pausa"] else "spazio"
    return {"tipo": tipo, "note": note, "d": g["d"], "punti": len(g["punti"]), "terz": bool(g["t"]), "dur": dur, "nominale": nominale}


def lezioni_da_testo(testo):
    out, cur = [], None
    for riga in testo.splitlines():
        riga = riga.strip()
        m = re.match(r"#\s*Lezione\s+(\d+)\s*\|\s*([^|]*)\|?\s*(.*)", riga)
        if m:
            opz = dict(p.split("=", 1) for p in re.split(r"\s+(?=\w+=)", m.group(3).strip()) if "=" in p)
            opz = {k: v.strip() for k, v in opz.items()}
            cur = {"numero": int(m.group(1)), "titolo": m.group(2).strip(), "opz": opz, "V": [], "D": [], "S": []}
            out.append(cur)
            continue
        m = re.match(r"([VDS]):\s*(.*)", riga)
        if m and cur is not None:
            cur[m.group(1)] += [b.strip() for b in m.group(2).split("|") if b.strip()]
    return out


def lung_battuta(opz):
    t = opz.get("tempo", "4/4").replace("C|", "4/4").replace("2/2", "4/4")
    b, d = (int(v) for v in t.split("/"))
    return Fraction(b * 4, d)


def controlla(lez):
    """Restituisce l'elenco degli avvisi (battute che non tornano, numero di battute diverso fra le parti)."""
    avvisi, L = [], lung_battuta(lez["opz"])
    n = len(lez["V"])
    for parte in "VDS":
        if len(lez[parte]) != n:
            avvisi.append(f"{parte}: {len(lez[parte])} battute, il canto ne ha {n}")
        for i, b in enumerate(lez[parte], 1):
            for k, voce in enumerate(b.split("&"), 1):
                try:
                    tot = sum((analizza(t, f"{parte} battuta {i}")["dur"] for t in voce.split()), Fraction(0))
                except ValueError as e:
                    avvisi.append(str(e)); continue
                ok = tot == L or (i == 1 and tot < L) or (i == len(lez[parte]) and tot < L)
                if not ok:
                    avvisi.append(f"{parte} battuta {i}{' voce ' + str(k) if '&' in b else ''}: {float(tot):g} quarti invece di {float(L):g}")
    # anacrusi: prima e ultima battuta corte devono essere corte allo stesso modo in tutte le parti
    return avvisi


def xml_nota(ev, voce, staff, lega_aperte, ultima_canto=False, alt_battuta=None):
    """Note di un evento (accordo = più <note>). lega_aperte: insieme delle altezze legate dalla nota precedente (stessa voce)."""
    out = []
    dur = int(ev["dur"] * DIV)
    tm = '<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>' if ev["terz"] else ''
    tipo = f'<type>{TIPO[ev["d"]]}</type>' + '<dot/>' * ev["punti"]
    vs = f'<voice>{voce}</voice>'
    st = f'<staff>{staff}</staff>' if staff else ''
    if ev["tipo"] == "spazio":
        return [f'<forward><duration>{dur}</duration>{vs}{st}</forward>'], set()
    if ev["tipo"] == "pausa":
        return [f'<note><rest/><duration>{dur}</duration>{vs}{tipo}{tm}{st}</note>'], set()
    nuove = set()
    for k, (n, lega) in enumerate(ev["note"]):
        passo, alt, ott = n[0], n[1:-1], n[-1]
        acc = {"#": 1, "b": -1}.get(alt, 0)
        legature = (["stop"] if (passo + str(acc) + ott) in lega_aperte else []) + (["start"] if lega else [])
        segno = ""
        if alt_battuta is not None:   # alterazione da disegnare: diversa da quella in vigore (armatura o battuta)
            chiave_n = passo + ott
            if alt_battuta.get(chiave_n, alt_battuta["_arm"].get(passo, 0)) != acc and "stop" not in legature:
                segno = '<accidental>' + {1: "sharp", -1: "flat", 0: "natural"}[acc] + '</accidental>'
            alt_battuta[chiave_n] = acc
        if lega:
            nuove.add(passo + str(acc) + ott)
        notaz = ''.join(f'<tied type="{t}"/>' for t in legature) + ('<fermata type="upright"/>' if ultima_canto else '')
        out.append('<note>' + ('<chord/>' if k else '') + f'<pitch><step>{passo.upper()}</step>' + (f'<alter>{acc}</alter>' if acc else '')
                   + f'<octave>{ott}</octave></pitch><duration>{dur}</duration>' + ''.join(f'<tie type="{t}"/>' for t in legature)
                   + vs + tipo + segno + tm + st + (f'<notations>{notaz}</notations>' if notaz else '') + '</note>')
    return out, nuove


def alt_armatura(armatura):
    d = {l: 1 for l in "fcgdaeb"[:max(0, armatura)]}
    d.update({l: -1 for l in "beadgcf"[:max(0, -armatura)]})
    return d


def musicxml(lez):
    opz = lez["opz"]
    armatura = int(opz.get("armatura", 0))
    ARM = alt_armatura(armatura)
    tempo = opz.get("tempo", "4/4")
    if tempo == "C|":
        beats, bt, simbolo = 4, 4, ' symbol="cut"'
    else:
        beats, bt = (int(v) for v in tempo.split("/"))
        simbolo = ' symbol="common"' if (beats, bt) == (4, 4) else ""
    autore = opz.get("autore", "")
    x = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">',
         '<score-partwise version="4.0">',
         f'  <movement-title>Lezione {lez["numero"]}</movement-title>',
         '  <identification>' + (f'<creator type="composer">{autore}</creator>' if autore else '')
         + '<rights>Solfège des solfèges (Lemoine-Carulli), ed. Lemoine 1923 — pubblico dominio; trascrizione musicascuole.it</rights>'
         + f'<miscellaneous><miscellaneous-field name="argomento">{lez["titolo"]}</miscellaneous-field></miscellaneous></identification>',
         '  <part-list><score-part id="P1"><part-name>Canto</part-name></score-part>'
         '<score-part id="P2"><part-name>Pianoforte</part-name></score-part></part-list>']
    n = len(lez["V"])
    L = lung_battuta(opz)
    attr = lambda chiavi: (f'<attributes><divisions>{DIV}</divisions><key><fifths>{armatura}</fifths></key>'
                           f'<time{simbolo}><beats>{beats}</beats><beat-type>{bt}</beat-type></time>' + chiavi + '</attributes>')
    # canto
    x.append('  <part id="P1">')
    aperte = set()
    for i, b in enumerate(lez["V"], 1):
        x.append(f'    <measure number="{i}">')
        if i == 1:
            x.append('      ' + attr('<clef><sign>G</sign><line>2</line></clef>'))
            if opz.get("andamento"):
                x.append(f'      <direction placement="above"><direction-type><words>{opz["andamento"]}</words></direction-type></direction>')
        toks = b.split()
        ab = {"_arm": ARM}
        for j, t in enumerate(toks):
            ev = analizza(t, f"V battuta {i}")
            righe, aperte = xml_nota(ev, 1, None, aperte, ultima_canto=(i == n and j == len(toks) - 1), alt_battuta=ab)
            x += ['      ' + r for r in righe]
        if i == n:
            x.append('      <barline location="right"><bar-style>light-heavy</bar-style></barline>')
        x.append('    </measure>')
    x.append('  </part>')
    # pianoforte: destra (pentagramma 1, voci 1-2), sinistra (pentagramma 2, voci 5-6)
    x.append('  <part id="P2">')
    aperte = {}
    for i in range(n):
        x.append(f'    <measure number="{i + 1}">')
        if i == 0:
            x.append('      ' + attr('<staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef>'))
        primo = True
        for staff, parte, v0 in ((1, "D", 1), (2, "S", 5)):
            b = lez[parte][i] if i < len(lez[parte]) else ""
            ab = {"_arm": ARM}
            for k, voce in enumerate(b.split("&")):
                toks = voce.split()
                if not toks:
                    continue
                if not primo:
                    x.append(f'      <backup><duration>{int(durata_battuta * DIV)}</duration></backup>')
                durata_battuta = Fraction(0)
                chiave = (staff, k)
                for t in toks:
                    ev = analizza(t, f"{parte} battuta {i + 1}")
                    righe, aperte[chiave] = xml_nota(ev, v0 + k, staff, aperte.get(chiave, set()), alt_battuta=ab)
                    x += ['      ' + r for r in righe]
                    durata_battuta += ev["dur"]
                primo = False
        if i == n - 1:
            x.append('      <barline location="right"><bar-style>light-heavy</bar-style></barline>')
        x.append('    </measure>')
    x += ['  </part>', '</score-partwise>', '']
    return "\n".join(x)


def scrivi(file_txt, cartella):
    os.makedirs(cartella, exist_ok=True)
    tutto_ok = True
    for lez in lezioni_da_testo(open(file_txt, encoding="utf8").read()):
        avvisi = controlla(lez)
        dest = os.path.join(cartella, f"carulli-{lez['numero']:03d}.musicxml")
        if avvisi:
            tutto_ok = False
            print(f"Lezione {lez['numero']}: ATTENZIONE")
            for a in avvisi:
                print("   ", a)
        try:
            open(dest, "w", encoding="utf8").write(musicxml(lez))
            print(f"Lezione {lez['numero']}: {len(lez['V'])} battute -> {dest}")
        except ValueError as e:
            tutto_ok = False
            print(f"Lezione {lez['numero']}: ERRORE {e}")
    return tutto_ok


def disegna(file_txt, cartella):
    """Ridisegna ogni lezione con Verovio (pip install verovio cairosvg) per confrontarla con la pagina del libro."""
    import verovio, cairosvg
    os.makedirs(cartella, exist_ok=True)
    tk = verovio.toolkit()
    tk.setOptions({"pageWidth": 2400, "pageHeight": 6000, "scale": 45, "adjustPageHeight": True, "breaks": "auto",
                   "footer": "none", "header": "none", "systemMaxPerPage": 20})
    for lez in lezioni_da_testo(open(file_txt, encoding="utf8").read()):
        try:
            tk.loadData(musicxml(lez))
        except ValueError as e:
            print(f"Lezione {lez['numero']}: ERRORE {e}"); continue
        for p in range(1, tk.getPageCount() + 1):
            dest = os.path.join(cartella, f"carulli-{lez['numero']:03d}-{p}.png")
            cairosvg.svg2png(bytestring=tk.renderToSVG(p).encode(), write_to=dest, background_color="white", output_width=1600)
            print(dest)


if __name__ == "__main__":
    if len(sys.argv) < 4 or sys.argv[1] not in ("scrivi", "disegna"):
        print(__doc__); sys.exit(1)
    ok = (scrivi if sys.argv[1] == "scrivi" else disegna)(sys.argv[2], sys.argv[3])
    sys.exit(0 if ok in (True, None) else 1)
