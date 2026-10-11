"""Monta il reel 1080x1920 dalle clip (registra.py) e dalle schermate (grafiche.py).

Uso:  python3 _sviluppo/reel/monta.py
Risultato: lavoro/reel.mp4 (muto: la musica si aggiunge su Instagram,
dalla sua libreria di brani già autorizzati).

La SCALETTA qui sotto decide ordine, tagli (secondi dentro ogni clip) e
posizione. Zone sicure di Instagram: tenere testi e cose importanti tra
y=250 e y=1500 (sopra ci sono i nomi, sotto didascalia e pulsanti).
"""
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw

BASE = Path(__file__).resolve().parent
L = BASE / "lavoro"; CLIP = L / "clip"; GR = L / "grafiche"; SEG = L / "segmenti"
ENC = "-c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p -r 30"


def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.returncode:
        print(r.stderr[-1500:]); raise SystemExit(cmd)


def seq(nome): return f"-framerate 30 -i {GR}/{nome}/%04d.png"
def taglio(a, b, vel=1.0): return f"trim={a}:{b},setpts=(PTS-STARTPTS)/{vel},fps=30"


def apertura(out, clip, a, b, overlay, scosta=200):
    """Clip da telefono a schermo intero, spostata in basso di `scosta` px
    per lasciare spazio al testo d'apertura, con la grafica sopra."""
    run(f"ffmpeg -y -loglevel error -i {CLIP}/{clip}.mp4 {seq(overlay)} -f lavfi -i color=c=0x0f0d2a:s=1080x1920:r=30 "
        f"-filter_complex \"[0:v]{taglio(a,b)},scale=1080:1920,setsar=1,crop=1080:{1920-scosta}:0:0[v];"
        f"[2:v][v]overlay=0:{scosta}[b];[b][1:v]overlay=0:0:eof_action=pass,format=yuv420p[o]\" "
        f"-map [o] -t {b-a:.3f} {ENC} {SEG}/{out}.mp4")


def intera(out, clip, a, b, etichetta, vel=1.0):
    """Clip da telefono verticale a schermo intero, con etichetta del gioco."""
    run(f"ffmpeg -y -loglevel error -i {CLIP}/{clip}.mp4 {seq(etichetta)} -filter_complex "
        f"\"[0:v]{taglio(a,b,vel)},scale=1080:1920,setsar=1[v];[v][1:v]overlay=0:0:eof_action=pass,format=yuv420p[o]\" "
        f"-map [o] -t {(b-a)/vel:.3f} {ENC} {SEG}/{out}.mp4")


def schermata(out, nome):
    run(f"ffmpeg -y -loglevel error {seq(nome)} -vf format=yuv420p {ENC} {SEG}/{out}.mp4")


def incorniciata(out, clip, a, b, sfondo, etichetta, x, y, w, h, angoli=0, vel=1.0, filtro=""):
    """Clip orizzontale (telefono girato o LIM) dentro una cornice sullo sfondo del sito.
    `filtro` permette ritagli e panoramiche, es. ",crop=1200:700:'min(720,225*t)':200"."""
    v = f"[0:v]{taglio(a,b,vel)}{filtro},scale={w}:{h},setsar=1,format=rgba[c]"
    maschera = ""
    if angoli:
        m = Image.new("L", (w, h), 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], radius=angoli, fill=255)
        mp = L / f"maschera_{w}x{h}_{angoli}.png"; m.save(mp)
        maschera = f"-loop 1 -i {mp}"
        v += ";[3:v]format=gray[mk];[c][mk]alphamerge[c]"
    run(f"ffmpeg -y -loglevel error -i {CLIP}/{clip}.mp4 -loop 1 -i {GR}/{sfondo}/0000.png {seq(etichetta)} {maschera} "
        f"-filter_complex \"{v};[1:v]format=rgba[b];[b][c]overlay={x}:{y}[bc];"
        f"[bc][2:v]overlay=0:0:eof_action=pass,format=yuv420p[o]\" "
        f"-map [o] -t {(b-a)/vel:.3f} {ENC} {SEG}/{out}.mp4")


def scaletta():
    apertura("01_leggi", "leggi", 2.8, 6.4, "hook")
    schermata("02_card1", "card1")
    # Rappa le note: ritaglio di 5 carte che scorre dietro alla carta accesa
    incorniciata("03_rap", "rap", 10.6, 13.8, "bg_rap", "lab_rap", 40, 660, 1000, 583, angoli=30,
                 filtro=",crop=1200:700:'min(720,225*t)':200")
    schermata("04_card2", "card2")
    intera("05_brani", "brani", 0.6, 6.04, "lab_brani", vel=1.6)
    schermata("06_card3", "card3")
    incorniciata("07_tast", "tastiera", 1.6, 4.2, "bg_lim", "lab_tast", 60, 690, 960, 540)
    incorniciata("08_fig", "figure", 1.7, 4.1, "bg_lim", "lab_fig", 60, 690, 960, 540,
                 filtro=",crop=1920:1080:0:60")
    intera("09_storia", "storia", 0.4, 5.52, "lab_storia", vel=1.6)
    schermata("10_card4", "card4")
    schermata("11_end", "end")


if __name__ == "__main__":
    SEG.mkdir(parents=True, exist_ok=True)
    for f in SEG.glob("*.mp4"): f.unlink()
    scaletta()
    segs = sorted(SEG.glob("*.mp4"))
    (SEG / "lista.txt").write_text("".join(f"file '{s}'\n" for s in segs))
    run(f"ffmpeg -y -loglevel error -f concat -safe 0 -i {SEG}/lista.txt -c copy {L}/reel.mp4")
    print("Fatto:", L / "reel.mp4")
