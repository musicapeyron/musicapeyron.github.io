#!/usr/bin/env python3
"""
Bozza automatica di una pagina: la fa leggere ad Audiveris e stampa le battute nel formato dei file di testo,
con la durata di ogni battuta in quarti. La bozza SBAGLIA spesso: serve solo come punto di partenza.

Uso: python3 bozza.py cartella_pagine/p25.png [cartella_bozze/]
"""
import glob, os, subprocess, sys
from fractions import Fraction
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bona_omr as b

png = sys.argv[1]
out = os.path.join(sys.argv[2] if len(sys.argv) > 2 else "bozze", os.path.splitext(os.path.basename(png))[0])
if not glob.glob(out + "/*.mxl"):
    os.makedirs(out, exist_ok=True)
    subprocess.run([b.AUDIVERIS, "-batch", "-export", "-output", out, png], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
k = 0
for f in sorted(glob.glob(out + "/*.mxl")):
    for nuova, note in b.misure_da_mxl(f):
        k += 1
        try: s = float(sum((b.durata(t) for t in note), Fraction(0)))
        except Exception: s = -1
        print(("\n--- nuovo tempo ---\n" if nuova else "") + f"[{k}] ({s:g} quarti) " + " ".join(note))
