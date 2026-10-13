"""Fa un reel dall'inizio alla fine, a partire dal suo file reels/<reel>.json.

Uso (dalla cartella del sito):
    python3 _sviluppo/reel/reel.py <reel>                registra le clip che mancano e fa tutto il resto
    python3 _sviluppo/reel/reel.py <reel> --clip         registra di nuovo tutte le clip
    python3 _sviluppo/reel/reel.py <reel> --clip=a,b     registra di nuovo solo le clip a e b
    python3 _sviluppo/reel/reel.py --libreria            rifà i mini-schermi del sito (quando il sito cambia)
    python3 _sviluppo/reel/reel.py --libreria storia     rifà solo alcuni mini-schermi

Risultato in lavoro/<reel>/:
    reel.mp4          il reel da caricare (con l'audio, se il file del reel ne indica uno)
    reel-B.mp4 ...    le varianti (per esempio un altro testo d'apertura), se ci sono
    copertina.jpg     la copertina 1080x1920 (il riquadro 3:4 centrale è quello della griglia)
    anteprima.jpg     un fotogramma al secondo con le zone coperte da Instagram, più la copertina:
                      basta un'occhiata per controllare tutto
    didascalia.txt    didascalia pronta da incollare, con al massimo 5 hashtag, e testo alternativo

Cosa c'è nel file del reel: vedi LEGGIMI.md (e reels/test-ingresso.json come esempio).
"""
import asyncio, json, os, shutil, subprocess, sys
from pathlib import Path
from urllib.parse import quote, urlencode
from PIL import Image, ImageDraw, ImageFont

import grafiche, monta, registra

BASE = Path(__file__).resolve().parent
SITO = BASE.parent.parent
L = BASE / "lavoro"
FONT = SITO / "fonts" / "inter.woff"
CHIUSURA = "👉 Il link è nella bio: musicascuole.it"
MAX_HASHTAG = 5   # limite di Instagram da dicembre 2025
VIETATE = r"\bvot[oi]\b"   # scelta di Cristiano: nei reel non si citano mai i voti


def controlla_testi(d):
    """Ferma il reel se testi, copertina o didascalia citano parole vietate (vedi VIETATE)."""
    import re
    from urllib.parse import unquote
    testi = [unquote(x["hash"]) for x in d["schermate"]]
    testi += [unquote(x["hash"]) for v in d.get("varianti", {}).values() for x in v.get("schermate", [])]
    testi += [json.dumps(d.get("copertina", {}), ensure_ascii=False), json.dumps(d.get("didascalia", {}), ensure_ascii=False)]
    trovati = [t for t in testi if re.search(VIETATE, t, re.I)]
    if trovati:
        raise SystemExit("Nei reel non si citano i voti; da cambiare:\n  " + "\n  ".join(trovati))


def durata(f):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
                       capture_output=True, text=True)
    return float(r.stdout.strip())


def clip(d, rifai):
    """Registra le clip che mancano (o quelle da rifare)."""
    da_fare = [n for n in d["clip"] if rifai is True or n in (rifai or []) or not (L / "clip" / f"{n}.mp4").exists()]
    if not da_fare:
        print("Clip: già registrate (per rifarle: --clip)"); return
    print("Clip da registrare:", ", ".join(da_fare))
    (L / "clip").mkdir(parents=True, exist_ok=True)
    srv = registra.server()
    try:
        for n in da_fare:
            registra.registra(n, d["clip"][n])
    finally:
        srv.terminate()


# Mini-schermi del sito: ogni pagina della libreria esiste in tre versioni, una per dispositivo.
DISPOSITIVI = {"telefono": ("telefono", "", "360:640"), "tablet": ("tablet", "-tablet", "480:640"),
               "lim": ("lim", "-lim", "640:360")}


def file_libreria(nome, disp="telefono"):
    return BASE / "libreria" / "scorrimenti" / f"{nome}{DISPOSITIVI[disp][1]}.mp4"


def libreria(servono=None, rifai=False):
    """Mini-schermi che scorrono le pagine del sito, per telefono, tablet e LIM
    (libreria/scorrimenti.json -> libreria/scorrimenti/<nome>.mp4, <nome>-tablet.mp4, <nome>-lim.mp4).
    Sono salvati nel repository (piccoli) così si riusano in tutti i reel; si rifanno quando il sito cambia.
    servono: coppie (nome, dispositivo); None = tutte."""
    lib = json.loads((BASE / "libreria" / "scorrimenti.json").read_text())["scorrimenti"]
    (BASE / "libreria" / "scorrimenti").mkdir(parents=True, exist_ok=True)
    if servono is None: servono = [(n, dsp) for n in lib for dsp in DISPOSITIVI]
    da_fare = [(n, dsp) for n, dsp in servono if rifai or not file_libreria(n, dsp).exists()]
    if not da_fare: return
    sconosciuti = sorted({n for n, _ in da_fare if n not in lib})
    if sconosciuti: raise SystemExit(f"Scorrimenti non definiti in libreria/scorrimenti.json: {sconosciuti}")
    print("Mini-schermi da registrare:", ", ".join(f"{n} ({dsp})" for n, dsp in da_fare))
    (L / "clip").mkdir(parents=True, exist_ok=True)
    srv = registra.server()
    try:
        for n, dsp in da_fare:
            tipo, _, misura = DISPOSITIVI[dsp]
            nome_clip = f"scorr_{n}{DISPOSITIVI[dsp][1]}"
            registra.registra(nome_clip, {**lib[n], "dispositivo": tipo})
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(L / "clip" / f"{nome_clip}.mp4"), "-an",
                            "-vf", f"scale={misura}:flags=lanczos", "-c:v", "libx264", "-crf", "26",
                            "-pix_fmt", "yuv420p", str(file_libreria(n, dsp))], check=True)
    finally:
        srv.terminate()


def attacchi(clip, da, a):
    """Istanti (in secondi dall'inizio del pezzo) in cui partono i suoni del gioco, dall'audio registrato."""
    import re
    wav = L / "clip" / f"{clip}.wav"
    r = subprocess.run(["ffmpeg", "-ss", f"{da:.3f}", "-t", f"{a - da:.3f}", "-i", str(wav), "-af",
                        "silencedetect=n=-40dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True)
    fini = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    inizio_rumoroso = not re.search(r"silence_start: 0(\.0+)?\b", r.stderr)
    return ([0.0] if inizio_rumoroso else []) + fini


def con_suoni(schermate):
    """Le schermate con "suoni": {"clip", "da", "tocco"} ricevono gli istanti delle bolle (n) e del tocco (f)."""
    fuori = []
    for x in schermate:
        su = x.get("suoni")
        if su:
            da, tocco = monta.tempo(su["da"], su["clip"]), monta.tempo(su["tocco"], su["clip"])
            n = [t for t in attacchi(su["clip"], da, tocco) if t < tocco - da][:2]
            if su.get("distanza") and n:   # i suoni si sovrappongono: il secondo parte a distanza fissa dal primo
                n = [n[0], n[0] + su["distanza"]]
            x = {**x, "hash": x["hash"] + f"&n={','.join(f'{t:.2f}' for t in n)}&f={tocco - da:.2f}"}
        fuori.append(x)
    return fuori


def copertina(d, cart):
    """Aggiunge alle schermate quella della copertina, con un fotogramma della clip scelta."""
    c = d.get("copertina")
    if not c: return []
    par = {"t": "copertina", "l": c["titolo"], "c": c.get("colore", "mi")}
    if c.get("sottotitolo"): par["s"] = c["sottotitolo"]
    if c.get("ritaglio"): par["r"] = c["ritaglio"]   # 0.6 = solo il 60% in alto del fotogramma
    if c.get("clip"):
        foto = cart / "copertina-fotogramma.png"
        t = monta.tempo(c.get("istante", 1), c["clip"])
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(L / "clip" / f"{c['clip']}.mp4"),
                        "-frames:v", "1", str(foto)], check=True)
        par["img"] = foto.as_uri() + f"?{foto.stat().st_mtime_ns}"
    return [{"name": "copertina", "hash": urlencode(par, quote_via=quote, safe="|/:?"), "dur": 0.04}]


def atempo(vel):
    """Filtro di velocità per l'audio (atempo accetta solo 0,5-2: si concatena)."""
    f, v = [], float(vel)
    while v > 2: f.append("atempo=2"); v /= 2
    while v < 0.5: f.append("atempo=0.5"); v /= 0.5
    if abs(v - 1) > 1e-3: f.append(f"atempo={v:.4f}")
    return ("," + ",".join(f)) if f else ""


def audio(d, segmenti, muto, finale):
    """Colonna sonora del reel:
      - la base del sito ("audio": file, da, volume, credito), con dissolvenza alla fine;
      - con "gioco": true, il suono registrato dei giochi (clip con "audio": true) sotto i loro pezzi,
        alla velocità del pezzo; la base lì si abbassa a "sotto" (di serie 0: tace, per sentire bene il gioco).
    Un pezzo con "muto": true non porta il suono del suo gioco; "vol": 3 lo alza (per i giochi che suonano piano)."""
    a = d.get("audio") or {}
    segs = sorted(Path(segmenti).glob("[0-9]*.mp4"))
    durs = [durata(f) for f in segs]
    D = sum(durs)
    inizi = [sum(durs[:i]) for i in range(len(durs))]
    ins, filtri, uscite, finestre = [], [], [], []
    if a.get("gioco"):
        for i, p in enumerate(d["scaletta"]):
            if p.get("tipo") == "pila": p = {**p["righe"][0], "vol": p.get("vol", 1)}   # suono della prima riga
            wav = L / "clip" / f"{p.get('clip')}.wav"
            if not p.get("clip") or p.get("muto") or not wav.exists(): continue
            t1, t2 = monta.tempo(p["da"], p["clip"]), monta.tempo(p["a"], p["clip"])
            k = n_in = len(ins) // 2 + 1; ins += ["-i", str(wav)]
            ms = int(round(inizi[i] * 1000))
            filtri.append(f"[{k}:a]atrim={t1:.3f}:{t2:.3f},asetpts=PTS-STARTPTS{atempo(p.get('vel', 1))},"
                          f"afade=t=in:d=0.04,afade=t=out:st={max(0, durs[i]-0.08):.3f}:d=0.08,volume={p.get('vol', 1)},"
                          f"adelay={ms}:all=1[g{i}]")
            uscite.append(f"[g{i}]"); finestre.append((inizi[i], inizi[i] + durs[i]))
    if a.get("file"):
        k = len([x for x in ins if x == "-i"]) + 1; ins += ["-ss", str(a.get("da", 0)), "-i", str(SITO / a["file"])]
        V, sotto = a.get("volume", 1.0), a.get("sotto", 0.0)
        livello = f"{V}"
        if finestre:   # la base si abbassa (con 0,3 s di raccordo) dove suonano i giochi
            dentro = "+".join(f"clip((t-({s0-0.3:.3f}))/0.3,0,1)*clip(({s1+0.3:.3f}-t)/0.3,0,1)" for s0, s1 in finestre)
            livello = f"'{V}*({sotto}+(1-{sotto})*(1-min(1,{dentro})))'"
        filtri.append(f"[{k}:a]atrim=0:{D:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.25,"
                      f"afade=t=out:st={max(0, D-1.6):.3f}:d=1.6,volume={livello}:eval=frame[mus]")
        uscite.append("[mus]")
    if not uscite:
        shutil.copy(muto, finale); return
    mix = f"{''.join(uscite)}amix=inputs={len(uscite)}:normalize=0:duration=longest,alimiter=limit=0.95[a]" \
        if len(uscite) > 1 else f"{uscite[0]}alimiter=limit=0.95[a]"
    monta.run(f"ffmpeg -y -loglevel error -i {muto} {' '.join(ins)} -filter_complex \"{';'.join(filtri)};{mix}\" "
              f"-map 0:v -map [a] -c:v copy -c:a aac -b:a 192k -t {D:.3f} {finale}")


def anteprima(video, cop, out):
    """Un fotogramma al secondo, con le zone dove Instagram mette i suoi comandi, più la copertina."""
    tmp = out.parent / "_anteprima"; shutil.rmtree(tmp, ignore_errors=True); tmp.mkdir()
    subprocess.run(["ffmpeg", "-v", "error", "-i", str(video), "-vf", "fps=1,scale=270:480",
                    str(tmp / "%03d.png")], check=True)
    fot = sorted(tmp.glob("*.png"))
    k = 270 / 1080
    try: fnt = ImageFont.truetype(str(FONT), 18)
    except Exception: fnt = ImageFont.load_default()

    def zone(im):
        z = Image.new("RGBA", im.size, (0, 0, 0, 0)); g = ImageDraw.Draw(z)
        g.rectangle([0, 0, 270, 250 * k], fill=(226, 28, 72, 70))            # nome, audio
        g.rectangle([0, 1500 * k, 270, 480], fill=(226, 28, 72, 70))         # didascalia
        g.rectangle([0, 1250 * k, 270, 1500 * k], fill=(249, 157, 28, 45))  # didascalia lunga
        g.rectangle([(1080 - 140) * k, 1000 * k, 270, 1500 * k], fill=(249, 157, 28, 45))  # pulsanti a destra
        return Image.alpha_composite(im.convert("RGBA"), z).convert("RGB")

    col = 8
    celle = [(zone(Image.open(f)), f"{i}s") for i, f in enumerate(fot)]
    if cop and cop.exists():
        c = Image.open(cop).convert("RGB").resize((270, 480))
        ImageDraw.Draw(c).rectangle([0, 240 * k, 269, 1680 * k], outline=(255, 244, 40), width=3)
        celle.append((c, "copertina (riquadro giallo = griglia)"))
    righe = (len(celle) + col - 1) // col
    tav = Image.new("RGB", (col * 280 + 10, righe * 516 + 10), (24, 22, 48))
    g = ImageDraw.Draw(tav)
    for i, (im, et) in enumerate(celle):
        x, y = 10 + (i % col) * 280, 10 + (i // col) * 516
        tav.paste(im, (x, y)); g.text((x + 2, y + 484), et, font=fnt, fill=(220, 218, 255))
    tav.save(out, quality=88)
    shutil.rmtree(tmp)


def didascalia(d, out):
    t = d.get("didascalia")
    if not t: return
    tag = t.get("hashtag", [])
    if len(tag) > MAX_HASHTAG:
        raise SystemExit(f"Troppi hashtag ({len(tag)}): Instagram ne accetta al massimo {MAX_HASHTAG}")
    righe = [t["testo"].strip(), "", t.get("chiusura", CHIUSURA)]
    if d.get("audio", {}).get("credito"): righe += ["", "🎵 " + d["audio"]["credito"]]
    if tag: righe += ["", " ".join("#" + h.lstrip("#") for h in tag)]
    testo = "\n".join(righe)
    if len(testo) > 2200: raise SystemExit("Didascalia troppo lunga per Instagram (massimo 2200 caratteri)")
    alt = t.get("alt", "")
    out.write_text(testo + ("\n\n--- Testo alternativo (Impostazioni avanzate > Accessibilità) ---\n" + alt if alt else "") + "\n")


def variante(d, nome, v, cart, base_gr):
    """Stesso reel con alcune schermate diverse (es. un altro testo d'apertura, per i Trial Reels)."""
    vc = cart / "varianti" / nome; gr = vc / "grafiche"; gr.mkdir(parents=True, exist_ok=True)
    cambiate = {s["name"] for s in v.get("schermate", [])}
    for s in d["schermate"]:
        dst = gr / s["name"]
        if s["name"] not in cambiate and not dst.exists():
            dst.symlink_to(base_gr / s["name"], target_is_directory=True)
    asyncio.run(grafiche.disegna_tutte(con_suoni(v["schermate"]), gr))
    muto = vc / "reel-muto.mp4"
    monta.monta(d["scaletta"], gr, vc / "segmenti", muto)
    audio(d, vc / "segmenti", muto, cart / f"reel-{nome}.mp4")
    return cart / f"reel-{nome}.mp4"


def main():
    if len(sys.argv) < 2: raise SystemExit(__doc__)
    if sys.argv[1] == "--libreria":   # rifà tutti i mini-schermi (o solo quelli nominati)
        os.chdir(SITO)
        libreria([(n, dsp) for n in sys.argv[2:] for dsp in DISPOSITIVI] or None, rifai=True); return
    nome = sys.argv[1]
    rifai = None
    for a in sys.argv[2:]:
        if a == "--clip": rifai = True
        elif a.startswith("--clip="): rifai = a[7:].split(",")
    d = json.loads((BASE / "reels" / f"{nome}.json").read_text())
    controlla_testi(d)
    cart = L / nome; cart.mkdir(parents=True, exist_ok=True)
    os.chdir(SITO)

    clip(d, rifai)
    libreria(sorted({(n, dsp) for p in d["scaletta"] for dsp, n in p.get("dispositivi", {}).items()}))
    print("Schermate…")
    cop = copertina(d, cart)
    gr = cart / "grafiche"
    asyncio.run(grafiche.disegna_tutte(con_suoni(d["schermate"]) + cop, gr))
    print("Montaggio…")
    monta.monta(d["scaletta"], gr, cart / "segmenti", cart / "reel-muto.mp4")
    audio(d, cart / "segmenti", cart / "reel-muto.mp4", cart / "reel.mp4")
    fatti = [cart / "reel.mp4"]
    for vn, v in d.get("varianti", {}).items():
        print(f"Variante {vn}…")
        fatti.append(variante(d, vn, v, cart, gr))
    cj = None
    if cop:
        cj = cart / "copertina.jpg"
        Image.open(gr / "copertina" / "0000.png").convert("RGB").save(cj, quality=92)
    anteprima(cart / "reel.mp4", cj, cart / "anteprima.jpg")
    didascalia(d, cart / "didascalia.txt")

    D = durata(cart / "reel.mp4")
    print(f"\nFatto: {nome}, {D:.1f} s")
    if D > 90: print("  ATTENZIONE: oltre 90 s i reel vengono mostrati meno a chi non ti segue")
    for f in fatti + [cj, cart / "anteprima.jpg", cart / "didascalia.txt"]:
        if f and f.exists(): print("  ", f.relative_to(SITO))


if __name__ == "__main__":
    main()
