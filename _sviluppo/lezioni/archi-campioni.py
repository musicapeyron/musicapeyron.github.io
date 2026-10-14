# Prepara i suoni di violino e violoncello della lezione «Le alterazioni» (passo 10):
# per ogni corda un campione VSCO 2 CE (CC0), reso dolce e con un anello (loop) senza cuciture,
# così la nota dura quanto si tiene premuto il dito. Uscita: media/suoni/archi/*.wav + archi.json (punti dell'anello).
# Uso: python3 archi-campioni.py <cartella VSCO-2-CE> <cartella del sito>
import numpy as np, subprocess, json, sys, os
SR_IN, SR = 44100, 24000
VSCO, SITO = sys.argv[1], sys.argv[2]
SCELTE = {
  "violino":     [("Strings/Solo Violin/Arco Vib/LLVln_ArcoVib_A5_f.wav", 81), ("Strings/Solo Violin/Arco Vib/LLVln_ArcoVib_E5_f.wav", 76),
                  ("Strings/Solo Violin/Arco Vib/LLVln_ArcoVib_G4_f.wav", 67), ("Strings/Solo Violin/Arco Vib/LLVln_ArcoVib_C4_f.wav", 60)],
  "violoncello": [("Strings/Cello Section/susvib/susvib_E3_v1_1.wav", 64), ("Strings/Cello Section/susvib/susvib_A2_v1_1.wav", 57),
                  ("Strings/Cello Section/susvib/susvib_D2_v1_1.wav", 50), ("Strings/Cello Section/susvib/susvib_G1_v1_1.wav", 43)],
}
FILTRI = { "violino": "lowpass=f=4600,equalizer=f=2700:t=q:w=1.2:g=-4,equalizer=f=330:t=q:w=1:g=1.5",
           "violoncello": "lowpass=f=3200,equalizer=f=1800:t=q:w=1.2:g=-3,highpass=f=45" }
def carica(f, filtro):
    raw = subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-af',filtro,'-ar',str(SR),'-f','f32le','-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)
def inviluppo(x, h):
    return np.array([np.sqrt(np.mean(x[i:i+h]**2) + 1e-12) for i in range(0, len(x) - h, h)])
meta = {}
for strum, lista in SCELTE.items():
    meta[strum] = []
    for i, (rel, midi) in enumerate(lista):
        x = carica(os.path.join(VSCO, rel), FILTRI[strum])
        h = int(0.05 * SR); env = inviluppo(x, h)
        # il tratto più regolare lungo 1,2 s, che comincia fra 0,35 e 1,6 s
        L = int(1.2 / 0.05); best = None
        for s in range(int(0.35 / 0.05), int(1.6 / 0.05)):
            w = env[s:s + L]
            if len(w) < L: break
            cv = np.std(w) / np.mean(w)
            if best is None or cv < best[0]: best = (cv, s)
        a = best[1] * h; b = a + L * h; xf = int(0.25 * SR)
        corpo = x[a:b].copy()
        t = np.linspace(0, np.pi / 2, xf)
        corpo[-xf:] = corpo[-xf:] * np.cos(t) + x[a - xf:a] * np.sin(t)      # la fine sfuma in ciò che precede l'inizio dell'anello
        y = np.concatenate([x[:a], corpo])
        # volume regolare dentro l'anello e uguale per tutti i campioni
        rif = np.sqrt(np.mean(corpo ** 2)); y = y * (0.12 / rif)
        f_in = int(0.04 * SR); y[:f_in] *= np.linspace(0, 1, f_in) ** 1.5
        y = np.clip(y, -0.98, 0.98)
        nome = f"{strum}-{i}.wav"
        subprocess.run(['ffmpeg','-v','error','-y','-f','f64le','-ar',str(SR),'-ac','1','-i','-','-c:a','pcm_s16le',os.path.join(SITO,'media/suoni/archi',nome)], input=y.tobytes())
        meta[strum].append({ "file": "media/suoni/archi/" + nome, "midi": midi, "loop": [round(a / SR, 5), round(b / SR, 5)] })
        print(strum, i, midi, f"anello {a/SR:.2f}-{b/SR:.2f} s, regolarità {best[0]:.3f}, durata {len(y)/SR:.2f} s")
json.dump(meta, open(os.path.join(SITO, 'media/suoni/archi/archi.json'), 'w'), indent=1)
