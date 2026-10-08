#!/usr/bin/env python3
"""
Riscrive a mano una battuta sbagliata dopo l'OMR.

Uso:
    python3 correggi.py bona-035.musicxml 3 "c5:2 r:2"
Ogni elemento è nota:durata (in quarti: 4 = semibreve, 2 = minima, 1 = semiminima, 0.5 = croma)
oppure r:durata per la pausa. Le note seguono la notazione inglese (c d e f g a b) con l'ottava (c4 = do centrale);
diesis e bemolle: c#5, b-4.
Se la battuta è l'ultima, la corona viene rimessa sull'ultimo elemento.
"""
import sys
import music21 as m21

f, num, testo = sys.argv[1], int(sys.argv[2]), sys.argv[3]
s = m21.converter.parse(f)
parte = s.parts[0]
misure = list(parte.getElementsByClass(m21.stream.Measure))
mis = misure[num - 1]
for el in list(mis.notesAndRests):
    mis.remove(el)
pos = 0.0
nuovi = []
for tok in testo.split():
    alt, dur = tok.split(":")
    el = m21.note.Rest() if alt == "r" else m21.note.Note(alt.upper()[0] + alt[1:])
    el.quarterLength = float(dur)
    mis.insert(pos, el)
    pos += float(dur)
    nuovi.append(el)
if mis is misure[-1]:
    nuovi[-1].expressions.append(m21.expressions.Fermata())
s.write("musicxml", fp=f)
print(f"{f}: battuta {num} = {testo}")
