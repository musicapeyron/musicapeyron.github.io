#!/usr/bin/env python3
"""
Ritaglio ingrandito di una pagina, per leggere le note a occhio.
Uso: python3 zoom.py pagina.png Y0 Y1 [X0 X1] [uscita.png]
     (Y e X in frazioni 0–1 di altezza e larghezza; consiglio: un rigo per volta, Y1-Y0 ≈ 0.07, mezzo rigo per volta in X)
"""
import sys
from PIL import Image
src = sys.argv[1]; y0, y1 = float(sys.argv[2]), float(sys.argv[3])
x0, x1 = (float(sys.argv[4]), float(sys.argv[5])) if len(sys.argv) > 5 else (0, 1)
dest = sys.argv[6] if len(sys.argv) > 6 else "zoom.png"
im = Image.open(src).convert("L"); W, H = im.size
c = im.crop((int(W * x0), int(H * y0), int(W * x1), int(H * y1)))
sc = min(1.0, 1400 / c.width); c = c.resize((int(c.width * sc), int(c.height * sc)))
c.save(dest); print(dest, c.size)
