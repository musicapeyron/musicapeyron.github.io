#!/usr/bin/env python3
"""
Estrae le pagine di un PDF di spartiti come immagini pulite in bianco e nero (per Audiveris e per guardarle).

Uso: python3 estrai_pagine.py file.pdf PRIMA ULTIMA cartella/
     -> cartella/p22.png, p23.png ... (numero = pagina del PDF)

Funziona con i due tipi di PDF usati finora:
- scansioni di archive.org (immagine a colori + "maschera" nera a 1 bit): prende la maschera, cioè solo le note;
- PDF di IMSLP già in bianco e nero (1 bit, es. edizione Mangione): prende l'immagine così com'è.
Se il PDF non contiene immagini adatte, rasterizza la pagina a 300 dpi in scala di grigi.
"""
import glob, os, subprocess, sys, tempfile
from PIL import Image, ImageOps

pdf, a, b, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
os.makedirs(out, exist_ok=True)
for p in range(a, b + 1):
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["pdfimages", "-f", str(p), "-l", str(p), "-png", pdf, os.path.join(tmp, "i")], check=True)
        imm = [Image.open(f) for f in sorted(glob.glob(os.path.join(tmp, "i-*.png")))]
        bit = [i for i in imm if i.mode == "1"]
        if len(imm) > 1 and bit:            # archive.org: la maschera ha le note bianche su nero -> invertire
            m = max(bit, key=lambda i: i.size[0] * i.size[1])
            im = ImageOps.invert(m.convert("L"))
            w, h = im.size
            im = im.crop((int(w * 0.025), 0, int(w * 0.967), h))
        elif bit:                            # IMSLP 1 bit: già nero su bianco
            im = bit[0].convert("L")
        else:
            subprocess.run(["pdftoppm", "-r", "300", "-gray", "-png", "-f", str(p), "-l", str(p), pdf, os.path.join(tmp, "r")], check=True)
            im = Image.open(glob.glob(os.path.join(tmp, "r-*.png"))[0])
        dest = os.path.join(out, f"p{p}.png")
        im.save(dest, dpi=(300, 300))
        print(dest, im.size)
