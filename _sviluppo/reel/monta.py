"""Monta il reel 1080x1920 dalle clip (registra.py) e dalle schermate (grafiche.py).

Di solito lo usa reel.py; da solo:  python3 _sviluppo/reel/monta.py <reel>

La scaletta sta nel file del reel (reels/<reel>.json, voce "scaletta"): un
elenco di pezzi, ognuno con un "tipo" (vedi PEZZI qui sotto). I tempi dentro
le clip si scrivono in secondi (2.8) oppure a partire da un segno registrato
("acuto_0-0.55", "finale+3.1"): così la scaletta resta giusta anche quando
si registra di nuovo e le domande escono diverse. Zone sicure di Instagram: tenere testi e cose importanti tra
y=250 e y=1500 (sopra ci sono i nomi, sotto didascalia e pulsanti).
"""
import json, re, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw

BASE = Path(__file__).resolve().parent
L = BASE / "lavoro"; CLIP = L / "clip"
SCORRIMENTI = BASE / "libreria" / "scorrimenti"   # mini-schermi del sito che scorrono (reel.py --libreria)
GR = SEG = None   # cartelle del reel in lavorazione: le imposta monta()
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


# Mini-telefoni sotto le schermate colorate: schermo 270x480 (9:16), cornice scura con ombra.
TEL_W, TEL_H, TEL_M = 270, 480, 40        # schermo e margine dell'immagine della cornice (per l'ombra)
TEL_Y, TEL_SU, TEL_GAP = 1000, 40, 40      # in alto a y=1000 (sotto i testi, sopra la didascalia); il centrale più su


def posizioni_telefoni(n):
    """Angolo in alto a sinistra dello schermo di ogni telefono (1-3 telefoni, centrati)."""
    tot = n * TEL_W + (n - 1) * TEL_GAP; x0 = (1080 - tot) // 2
    return [(x0 + i * (TEL_W + TEL_GAP), TEL_Y - (TEL_SU if n == 3 and i == 1 else 0)) for i in range(n)]


def cornice_telefono():
    """cornice.png (telefono scuro con ombra) e schermo.png (maschera ad angoli arrotondati), fatte una volta."""
    from PIL import ImageFilter
    c, m = L / "telefono_cornice.png", L / "telefono_schermo.png"
    if c.exists() and m.exists(): return c, m
    W, H = TEL_W + 2 * TEL_M, TEL_H + 2 * TEL_M
    ombra = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(ombra).rounded_rectangle([TEL_M - 6, TEL_M + 10, W - TEL_M + 6, H - TEL_M + 22], radius=40, fill=(0, 0, 0, 150))
    ombra = ombra.filter(ImageFilter.GaussianBlur(14))
    d = ImageDraw.Draw(ombra)
    d.rounded_rectangle([TEL_M - 11, TEL_M - 11, W - TEL_M + 11, H - TEL_M + 11], radius=40, fill=(11, 10, 31, 255),
                        outline=(255, 255, 255, 60), width=3)
    ombra.save(c)
    mk = Image.new("L", (TEL_W, TEL_H), 0)
    ImageDraw.Draw(mk).rounded_rectangle([0, 0, TEL_W - 1, TEL_H - 1], radius=30, fill=255)
    mk.save(m)
    return c, m


def schermata_telefoni(out, nome, telefoni, inizio=0.8, ritardo=0.12):
    """Schermata colorata con 1-3 mini-telefoni che entrano dal basso e scorrono pagine del sito."""
    n = len(telefoni); pos = posizioni_telefoni(n); cor, msk = cornice_telefono()
    dur = len(list((GR / nome).glob("*.png"))) / 30
    ins = " ".join(f"-ss {inizio} -i {SCORRIMENTI}/{t}.mp4" for t in telefoni)
    f = [f"[1:v]format=rgba,split={n}" + "".join(f"[c{i}]" for i in range(n)),
         f"[2:v]format=gray,split={n}" + "".join(f"[m{i}]" for i in range(n))]
    base = "[0:v]"
    for i, (x, y) in enumerate(pos):
        d = 0.15 + i * ritardo   # entrano uno dopo l'altro, con una piccola frenata
        f += [f"[{3+i}:v]fps=30,scale={TEL_W}:{TEL_H},setsar=1,format=rgba[s{i}]",
              f"[s{i}][m{i}]alphamerge[a{i}]",
              f"[c{i}][a{i}]overlay={TEL_M}:{TEL_M}[t{i}]",
              f"{base}[t{i}]overlay=x={x - TEL_M}:y='if(lt(t,{d}),1920,{y - TEL_M}+420*pow(max(0,1-(t-{d})/0.5),3))':eof_action=repeat[b{i}]"]
        base = f"[b{i}]"
    f.append(f"{base}format=yuv420p[o]")
    run(f"ffmpeg -y -loglevel error {seq(nome)} -loop 1 -i {cor} -loop 1 -i {msk} {ins} "
        f"-filter_complex \"{';'.join(f)}\" -map [o] -t {dur:.3f} {ENC} {SEG}/{out}.mp4")


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


def tempo(v, clip):
    """2.8 -> 2.8;  "acuto_0-0.55" -> istante del segno acuto_0 nella clip, meno 0,55 s."""
    if isinstance(v, (int, float)): return float(v)
    m = re.fullmatch(r"\s*([\w.-]+?)\s*(?:([+-])\s*([\d.]+))?\s*", v)
    if not m: raise SystemExit(f"Tempo non valido: {v}")
    t = segni(clip)[m[1]]
    return t + (float(m[3]) if m[2] == "+" else -float(m[3])) if m[2] else t


def pezzo(n, p):
    """Un pezzo della scaletta -> lavoro/<reel>/segmenti/NN_<tipo>.mp4
    Tipi:
      schermata     {"grafica": "card1"}   con "telefoni": ["index", "storia", "schemi"] (1-3 nomi della
                    libreria/scorrimenti.json) aggiunge i mini-telefoni che scorrono; la card va
                    disegnata con tel=1 (testi in alto, spazio libero sotto)
      apertura      {"clip", "da", "a", "grafica": "hook", "scosta": 200}  clip a schermo intero spostata in basso, testo sopra
      intera        {"clip", "da", "a", "grafica": etichetta, "vel": 1.3}  clip verticale a schermo intero
      incorniciata  {"clip", "da", "a", "sfondo": "bg_lim", "grafica", "x", "y", "w", "h", "angoli", "vel", "filtro"}
                    (per la LIM in un'aula: sfondo disegnato con t=classe, stessi x, y, w, h)
    "vel" accelera (1.3 = 30% più veloce); "filtro" sono filtri ffmpeg in più (ritagli, panoramiche)."""
    out = f"{n:02d}_{p['tipo']}"
    if p["tipo"] == "schermata":
        if p.get("telefoni"):
            return schermata_telefoni(out, p["grafica"], p["telefoni"], p.get("inizio", 0.8))
        return schermata(out, p["grafica"])
    a, b = tempo(p["da"], p["clip"]), tempo(p["a"], p["clip"])
    if p["tipo"] == "apertura":
        apertura(out, p["clip"], a, b, p["grafica"], p.get("scosta", 200))
    elif p["tipo"] == "intera":
        intera(out, p["clip"], a, b, p["grafica"], p.get("vel", 1.0))
    elif p["tipo"] == "incorniciata":
        incorniciata(out, p["clip"], a, b, p["sfondo"], p["grafica"], p["x"], p["y"], p["w"], p["h"],
                     p.get("angoli", 0), p.get("vel", 1.0), p.get("filtro", ""))
    else:
        raise SystemExit(f"Tipo di pezzo sconosciuto: {p['tipo']}")


def monta(scaletta, grafiche, segmenti, finale):
    """Monta tutti i pezzi e li unisce in `finale` (muto)."""
    global GR, SEG
    GR, SEG = Path(grafiche), Path(segmenti)
    SEG.mkdir(parents=True, exist_ok=True)
    for f in SEG.glob("*.mp4"): f.unlink()
    for n, p in enumerate(scaletta, 1):
        pezzo(n, p)
    segs = sorted(SEG.glob("*.mp4"))
    (SEG / "lista.txt").write_text("".join(f"file '{s}'\n" for s in segs))
    run(f"ffmpeg -y -loglevel error -f concat -safe 0 -i {SEG}/lista.txt -c copy {finale}")


if __name__ == "__main__":
    if len(sys.argv) < 2: raise SystemExit(__doc__)
    reel = sys.argv[1]
    d = json.loads((BASE / "reels" / f"{reel}.json").read_text())
    monta(d["scaletta"], L / reel / "grafiche", L / reel / "segmenti", L / reel / "reel-muto.mp4")
    print("Fatto:", L / reel / "reel-muto.mp4")
