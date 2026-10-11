"""Monta il reel 1080x1920 dalle clip (registra.py) e dalle schermate (grafiche.py).

Uso:  python3 _sviluppo/reel/monta.py                 (primo reel -> lavoro/reel.mp4)
      python3 _sviluppo/reel/monta.py test-ingresso   (-> lavoro/reel-test-ingresso.mp4)
Il reel è muto: la musica si aggiunge su Instagram, dalla sua libreria
di brani già autorizzati.

Ogni reel ha la sua SCALETTA qui sotto (elenco SCALETTE): ordine, tagli
(secondi dentro ogni clip) e posizione. Le clip registrate con dei "segni"
(registra.py -> lavoro/clip/<clip>.json) si tagliano a partire da quelli,
così la scaletta resta giusta anche se si registra di nuovo. Zone sicure di Instagram: tenere testi e cose importanti tra
y=250 e y=1500 (sopra ci sono i nomi, sotto didascalia e pulsanti).
"""
import json, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw

BASE = Path(__file__).resolve().parent
L = BASE / "lavoro"; CLIP = L / "clip"; GR = L / "grafiche"; SEG = L / "segmenti"
ENC = "-c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p -r 30"


def segni(clip):
    """Momenti notevoli di una clip, in secondi dall'inizio (scritti da registra.py)."""
    return json.loads((CLIP / f"{clip}.json").read_text())


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


def scaletta_primo():
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


def scaletta_test_ingresso():
    """Reel 2 (ottobre 2026): il test d'ingresso, i cinque mini-giochi e il riepilogo finale."""
    s = segni("test")
    apertura("01_home", "test", s["home"], s["home"] + 3.6, "hook")          # Comincia arriva a ~2 s
    schermata("02_card1", "card1")
    a = s["acuto_0"]; intera("03_acuto", "test", a - 0.55, a + 1.45, "lab_acuto")
    a = s["tastiera_0"]; intera("04_tast", "test", a - 0.5, a + 2.36, "lab_tast", vel=1.3)
    a = s["figure_1"]; intera("05_fig", "test", a - 0.35, a + 2.64, "lab_fig", vel=1.3)
    a = segni("test_lim")["nota_0"]
    incorniciata("06_lim", "test_lim", a - 0.4, a + 2.6, "bg_lim", "lab_violino", 60, 690, 960, 540)
    a = s["leggiBasso_1"]; intera("07_basso", "test", a - 0.35, a + 1.93, "lab_basso", vel=1.2)
    schermata("08_card2", "card2")
    a = s["finale"]; intera("09_finale", "test", a - 0.1, a + 3.1, "lab_finale")
    schermata("10_card3", "card3")
    schermata("11_card4", "card4")
    schermata("12_end", "end")


SCALETTE = {"primo": scaletta_primo, "test-ingresso": scaletta_test_ingresso}

if __name__ == "__main__":
    reel = sys.argv[1] if len(sys.argv) > 1 else "primo"
    if reel != "primo":   # gli altri reel lavorano in lavoro/<reel>/; le clip restano in comune
        GR, SEG = L / reel / "grafiche", L / reel / "segmenti"
    finale = L / ("reel.mp4" if reel == "primo" else f"reel-{reel}.mp4")
    SEG.mkdir(parents=True, exist_ok=True)
    for f in SEG.glob("*.mp4"): f.unlink()
    SCALETTE[reel]()
    segs = sorted(SEG.glob("*.mp4"))
    (SEG / "lista.txt").write_text("".join(f"file '{s}'\n" for s in segs))
    run(f"ffmpeg -y -loglevel error -f concat -safe 0 -i {SEG}/lista.txt -c copy {finale}")
    print("Fatto:", finale)
