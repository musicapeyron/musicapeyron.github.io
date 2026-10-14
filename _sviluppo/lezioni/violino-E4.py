# Prepara media/suoni/violino/E4.mp3: MI4 di violino (VSCO 2 CE, CC0, LLVln_ArcoVib_E4_f.wav) reso continuo e più dolce.
# Uso: python3 violino-E4.py uscita.mp3 (il file sorgente va scaricato da github.com/sgossner/VSCO-2-CE)
import numpy as np, subprocess, sys
sr=44100
src="vsco/repo/Strings/Solo Violin/Arco Vib/LLVln_ArcoVib_E4_f.wav"
raw=subprocess.run(['ffmpeg','-v','error','-i',src,'-ac','1','-ar',str(sr),'-f','f32le','-'],capture_output=True).stdout
x=np.frombuffer(raw,dtype=np.float32).astype(np.float64)
# corpo regolare: 0,20 – 1,15 s; si ripete con dissolvenze a potenza costante
a,b=int(0.20*sr),int(1.15*sr); corpo=x[a:b]; xf=int(0.22*sr)
tot=int(7.6*sr); out=np.zeros(tot+len(corpo))
attacco=x[:b]                                   # l'inizio vero (attacco dell'arco) fino a fine corpo
out[:len(attacco)]=attacco; pos=len(attacco)-xf
t=np.linspace(0,np.pi/2,xf); fo, fi = np.cos(t), np.sin(t)
while pos < tot:
    seg=corpo.copy()
    out[pos:pos+xf]=out[pos:pos+xf]*fo+seg[:xf]*fi
    out[pos+xf:pos+len(seg)]=seg[xf:]
    pos+=len(seg)-xf
out=out[:tot]
# volume regolare: si appiattiscono le piccole onde di intensità (finestre di 0,25 s)
h=int(0.25*sr); env=np.array([np.sqrt(np.mean(out[max(0,i-h//2):i+h//2]**2)+1e-9) for i in range(0,tot,h//4)])
env=np.interp(np.arange(tot), np.arange(0,tot,h//4), env); ref=np.median(env[int(0.5*sr):])
g=np.clip(ref/env,0.6,1.6); g[:int(0.15*sr)]=1   # l'attacco resta naturale
out=out*g
# attacco più morbido e coda
fade=int(0.06*sr); out[:fade]*=np.linspace(0,1,fade)**1.5
fo2=int(0.4*sr); out[-fo2:]*=np.linspace(1,0,fo2)
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(sr),'-ac','1','-i','-',
  '-af','lowpass=f=3800,equalizer=f=2600:t=q:w=1.2:g=-4,equalizer=f=320:t=q:w=1:g=1.5,loudnorm=I=-20:TP=-3:LRA=5','-ar','44100','-b:a','112k',sys.argv[1]],
  input=out.astype(np.float32).tobytes())
# controllo: intensità ogni 0,25 s
raw=subprocess.run(['ffmpeg','-v','error','-i',sys.argv[1],'-ac','1','-f','f32le','-'],capture_output=True).stdout
y=np.frombuffer(raw,dtype=np.float32); r=[np.sqrt(np.mean(y[i:i+h]**2)) for i in range(0,len(y)-h,h)]; m=np.median(r)
print(' '.join(f"{v/m:.2f}" for v in r))
