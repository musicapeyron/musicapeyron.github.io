"""Mette 2 o 4 schermate in un'unica immagine (due colonne), rimpicciolita: comoda da guardare o da mandare.

Uso: python3 _sviluppo/prove/mosaico.py uscita.png schermata1.png schermata2.png [schermata3.png schermata4.png]
"""
import sys
from PIL import Image

out, files = sys.argv[1], sys.argv[2:]
ims = [Image.open(f).convert("RGB") for f in files]
W, H = ims[0].size
righe = (len(ims) + 1) // 2
M = Image.new("RGB", (W * 2, H * righe), "white")
for i, im in enumerate(ims):
    M.paste(im.resize((W, H)), ((i % 2) * W, (i // 2) * H))
M.resize((W, H * righe // 2)).save(out)
