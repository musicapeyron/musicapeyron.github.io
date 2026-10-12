"""Prepara una registrazione per la Pregrafia musicale: estratto, sfumature, battiti.

Uso:
  python3 _sviluppo/pregrafia/prepara_brano.py FILE NOME --da 12.5 --a 55 [--bpm 70] [--metro 4] [--salta 0]

  FILE    registrazione originale (ogg, mp3, flac…)
  NOME    chiave del brano (es. danubio): esce media/pregrafia/NOME.mp3 e la voce NOME in pregrafia/battiti.js
  --da/--a    inizio e fine dell'estratto, in secondi nella registrazione originale
  --bpm       tempo indicativo (aiuta a trovare i battiti giusti, non il doppio o la metà)
  --salta     quanti battiti trovati saltare all'inizio: il battito 0 è quello da cui partono le linee
  --sfuma     secondi di sfumatura all'inizio e alla fine (default 1.5 e 3)

Scrive anche _sviluppo/pregrafia/controllo-NOME.png: l'energia degli attacchi con i battiti trovati,
per controllare a occhio che siano giusti.
"""
import argparse, json, pathlib, subprocess, tempfile
import numpy as np
import librosa

QUI = pathlib.Path(__file__).resolve().parent
RADICE = QUI.parent.parent
USCITA = RADICE / "media" / "pregrafia"
BATTITI = RADICE / "pregrafia" / "battiti.js"


def leggi_battiti():
    try:
        testo = BATTITI.read_text(encoding="utf-8")
        return json.loads(testo.split("=", 1)[1].strip().rstrip(";"))
    except Exception:
        return {}


def scrivi_battiti(d):
    BATTITI.parent.mkdir(exist_ok=True)
    righe = ",\n".join(f'  "{k}": [{", ".join(f"{t:.3f}" for t in v)}]' for k, v in sorted(d.items()))
    BATTITI.write_text("/* battiti delle registrazioni (secondi dall'inizio dell'estratto), scritti da _sviluppo/pregrafia/prepara_brano.py */\n"
                       "window.BATTITI = {\n" + righe + "\n};\n", encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file"); ap.add_argument("nome")
    ap.add_argument("--da", type=float, default=0); ap.add_argument("--a", type=float, default=None)
    ap.add_argument("--bpm", type=float, default=None); ap.add_argument("--salta", type=int, default=0)
    ap.add_argument("--sfuma", type=float, nargs=2, default=[1.5, 3.0])
    ap.add_argument("--stretto", type=float, default=100, help="quanto i battiti devono restare regolari (librosa tightness)")
    a = ap.parse_args()

    USCITA.mkdir(parents=True, exist_ok=True)
    durata = (a.a - a.da) if a.a else None
    mp3 = USCITA / f"{a.nome}.mp3"
    fi, fo = a.sfuma
    filtro = f"afade=t=in:st=0:d={fi}" + (f",afade=t=out:st={max(0, durata - fo):.2f}:d={fo}" if durata else "") + ",loudnorm=I=-16:TP=-1.5:LRA=11"
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-ss", str(a.da)] + (["-t", f"{durata:.3f}"] if durata else []) + \
          ["-i", a.file, "-af", filtro, "-ac", "2", "-ar", "44100", "-b:a", "128k", str(mp3)]
    subprocess.run(cmd, check=True)

    y, sr = librosa.load(str(mp3), sr=22050, mono=True)
    onset = librosa.onset.onset_strength(y=y, sr=sr, aggregate=np.median)
    kw = dict(onset_envelope=onset, sr=sr, tightness=a.stretto, trim=False)
    if a.bpm:
        kw["start_bpm"] = a.bpm
    tempo, frames = librosa.beat.beat_track(**kw)
    tempi = librosa.frames_to_time(frames, sr=sr)[a.salta:]
    d = leggi_battiti(); d[a.nome] = [round(float(t), 3) for t in tempi]; scrivi_battiti(d)

    iv = np.diff(tempi)
    print(f"{mp3.name}: {len(y) / sr:.1f} s, {len(tempi)} battiti, tempo medio {60 / np.median(iv):.1f} bpm "
          f"(min {60 / iv.max():.1f}, max {60 / iv.min():.1f}); primo battito a {tempi[0]:.2f} s")

    try:
        import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
        t = librosa.times_like(onset, sr=sr)
        fig, ax = plt.subplots(figsize=(18, 3.2))
        ax.plot(t, onset, lw=0.8, color="#555")
        for k, b in enumerate(tempi):
            ax.axvline(b, color="#E21C48" if k % 4 == 0 else "#F99D1C", lw=1 if k % 4 else 1.6, alpha=0.8)
        ax.set_xlim(0, t[-1]); ax.set_title(f"{a.nome}: attacchi e battiti (rosso ogni 4)")
        fig.tight_layout(); fig.savefig(QUI / f"controllo-{a.nome}.png", dpi=80)
    except Exception as e:
        print("(grafico non disponibile:", e, ")")


if __name__ == "__main__":
    main()
