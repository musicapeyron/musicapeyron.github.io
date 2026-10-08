#!/usr/bin/env python3
"""
Controllo finale: disegna le lezioni con il motore del sito e le mette accanto alla pagina del libro.

Uso (dalla cartella principale del sito):
  python3 _sviluppo/omr/confronta.py pagina.png cartella_musicxml/ uscita.png 87 88
  -> uscita.png: a sinistra la pagina, a destra le lezioni 87 e 88 come le disegna il sito.
Serve Playwright con Chromium (già presente nell'ambiente di lavoro di Claude).
"""
import http.server, os, socketserver, sys, threading, shutil, tempfile
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

pagina, cart, uscita, numeri = sys.argv[1], sys.argv[2], sys.argv[3], [int(n) for n in sys.argv[4:]]
sito = os.getcwd()
tmp = tempfile.mkdtemp()
for f in ("vexflow.js", "motore-schemi.js"): shutil.copy(os.path.join(sito, f), tmp)
for n in numeri: shutil.copy(os.path.join(cart, f"bona-{n:03d}.musicxml"), tmp)
open(os.path.join(tmp, "v.html"), "w").write("""<!doctype html><meta charset="utf-8"><body style="margin:0;background:#fff"><div id="z"></div>
<script src="vexflow.js"></script><script src="motore-schemi.js"></script><script>
(async()=>{for(const n of %s){const t=await (await fetch('bona-'+String(n).padStart(3,'0')+'.musicxml')).text();
const b=MotoreSchemi.leggiMusicXML(t);const d=document.createElement('div');d.id='l'+n;d.style.width='1000px';document.getElementById('z').appendChild(d);
MotoreSchemi.disegnaBrano(d,b,{strumento:'flauto',larghezza:1000,perRiga:4,titolo:false,schema:false,testi:false});}document.title='ok';})();
</script>""" % numeri)
class Zitto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(("127.0.0.1", 0), lambda *a: Zitto(*a, directory=tmp)); porta = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    br = p.chromium.launch(); pg = br.new_page(viewport={"width": 1000, "height": 900})
    pg.goto(f"http://127.0.0.1:{porta}/v.html"); pg.wait_for_function("document.title==='ok'", timeout=30000)
    for n in numeri: pg.locator(f"#l{n}").screenshot(path=os.path.join(tmp, f"r{n}.png"))
    br.close()
srv.shutdown()
F = ImageFont.load_default()
pag = Image.open(pagina).convert("RGB"); pag = pag.resize((900, int(pag.height * 900 / pag.width)))
parti = []
for n in numeri:
    r = Image.open(os.path.join(tmp, f"r{n}.png")).convert("RGB")
    e = Image.new("RGB", (r.width, 30), (235, 235, 248)); ImageDraw.Draw(e).text((8, 8), f"Lezione {n}", fill=(40, 40, 90), font=F)
    parti += [e, r]
H = sum(x.height for x in parti); dx = Image.new("RGB", (1000, H), "white"); y = 0
for x in parti: dx.paste(x, (0, y)); y += x.height
out = Image.new("RGB", (1920, max(pag.height, H)), "white"); out.paste(pag, (0, 0)); out.paste(dx, (920, 0)); out.save(uscita)
print(uscita, out.size)
