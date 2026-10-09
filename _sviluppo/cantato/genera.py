#!/usr/bin/env python3
"""
Solfeggio cantato: dal file di testo lezioni.txt ai MusicXML del sito (media/solfeggio/cantato/cantato-NNN.musicxml).

Usa lo stesso formato e lo stesso scrittore del Bona (_sviluppo/omr/bona_omr.py); in più la riga «@» con gli
accordi dell'accompagnamento, che finiscono nel MusicXML come elementi <harmony> (li legge anche MuseScore).
Uso (dalla cartella del sito):  python3 _sviluppo/cantato/genera.py
"""
import os, re, sys
from fractions import Fraction
QUI = os.path.dirname(os.path.abspath(__file__)); SITO = os.path.dirname(os.path.dirname(QUI))
sys.path.insert(0, os.path.join(SITO, "_sviluppo", "omr"))
from bona_omr import lezioni_da_testo, musicxml, durata

DIV = 8
KIND = {"": "major", "m": "minor", "7": "dominant", "m7": "minor-seventh", "maj7": "major-seventh"}


def accordo(tok):
    m = re.fullmatch(r"([A-G])([#b]?)(m7|maj7|m|7|)", tok)
    if not m: raise ValueError(f"accordo non valido «{tok}»")
    alt = {"#": 1, "b": -1}.get(m.group(2), 0)
    return (f'<harmony><root><root-step>{m.group(1)}</root-step>' + (f'<root-alter>{alt}</root-alter>' if alt else '')
            + f'</root><kind>{KIND[m.group(3)]}</kind>')


def genera():
    testo = open(os.path.join(QUI, "lezioni.txt"), encoding="utf8").read()
    blocchi = re.split(r"(?m)^(?=#\s*Lezione)", testo)
    uscita = os.path.join(SITO, "media", "solfeggio", "cantato"); os.makedirs(uscita, exist_ok=True)
    for blocco in blocchi:
        if not re.match(r"#\s*Lezione", blocco): continue
        acc = [b.split() for riga in blocco.splitlines() if riga.strip().startswith("@")
               for b in riga.strip()[1:].split("|") if b.strip()]
        senza = "\n".join(r for r in blocco.splitlines() if not r.strip().startswith("@"))
        (numero, argomento, battute, opz), = lezioni_da_testo(senza)
        b_, t_ = (int(v) for v in opz.get("tempo", "4/4").split("/")); piena = Fraction(4 * b_, t_)
        for i, b in enumerate(battute, 1):
            if sum((durata(t) for t in b), Fraction(0)) != piena: raise SystemExit(f"Lezione {numero}: battuta {i} non piena")
        if len(acc) != len(battute): raise SystemExit(f"Lezione {numero}: {len(battute)} battute ma {len(acc)} accordi")
        x = musicxml(numero, argomento, battute, opz).replace(
            '<creator type="composer">Pasquale Bona</creator>', '<creator type="composer">musicascuole.it</creator>')
        righe = x.split("\n"); out = []; m = 0
        for r in righe:
            out.append(r)
            if r.strip().startswith('<measure number='):
                m += 1; continua = True
            if r.strip().startswith('<measure number=') and m >= 2 or r.strip().startswith('<attributes>'):
                ac = acc[m - 1]; parte = piena / len(ac)
                for k, a in enumerate(ac):
                    off = int(parte * k * DIV)
                    out.append("      " + accordo(a) + (f"<offset>{off}</offset>" if off else "") + "</harmony>")
        open(os.path.join(uscita, f"cantato-{numero:03d}.musicxml"), "w", encoding="utf8").write("\n".join(out))
        print(f"Lezione {numero}: {argomento} — {len(battute)} battute")


if __name__ == "__main__":
    genera()
