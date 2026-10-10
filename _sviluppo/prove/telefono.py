"""Controlla che sul telefono una pagina sia IDENTICA alla versione di riferimento (pixel per pixel).

Uso (dalla cartella del sito, server acceso su 127.0.0.1:8765):
    python3 _sviluppo/prove/telefono.py <commit_di_riferimento> pagina1 [pagina2 ...]
es. python3 _sviluppo/prove/telefono.py main nomina-intervalli dettato-melodico
(i nomi delle pagine senza .html)

Prende la pagina com'era nel commit indicato (git show), la salva per un momento come _orig_<pagina>.html,
la fotografa intera con le animazioni spente accanto alla versione attuale, a 390x844 (telefono in
verticale) e 932x430 (telefono in orizzontale), poi cancella la copia. Stampa IDENTICO oppure il
riquadro dove cambia qualcosa, più errori JavaScript e richieste a siti esterni.
Una differenza voluta (es. lo sfondo comune) va guardata a occhio: le immagini restano in /tmp.
"""
import asyncio, os, subprocess, sys
from playwright.async_api import async_playwright
from PIL import Image, ImageChops

rif, pagine = sys.argv[1], sys.argv[2:]


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for f in pagine:
            orig = f"_orig_{f}.html"
            with open(orig, "w", encoding="utf-8") as fh:
                fh.write(subprocess.run(["git", "show", f"{rif}:{f}.html"], capture_output=True, text=True, check=True).stdout)
            try:
                for w, h in [(390, 844), (932, 430)]:
                    foto = []
                    for pre in ["_orig_", ""]:
                        pg = await b.new_page(viewport={"width": w, "height": h})
                        err, ext = [], []
                        pg.on("pageerror", lambda e: err.append(str(e)[:80]))
                        pg.on("request", lambda r: ext.append(r.url) if not r.url.startswith(("http://127.0.0.1", "data:", "blob:")) else None)
                        await pg.add_init_script("Math.random=(()=>{let s=11;return()=>{s=(s*16807)%2147483647;return (s-1)/2147483646}})();")
                        await pg.goto(f"http://127.0.0.1:8765/{pre}{f}.html")
                        await pg.add_style_tag(content="*,*::before,*::after{animation:none!important;transition:none!important}")
                        await pg.wait_for_timeout(1200)
                        path = f"/tmp/tel-{pre}{f}-{w}.png"
                        await pg.screenshot(path=path, full_page=True)
                        foto.append(path)
                        if pre == "":
                            print(f, w, "errori", err, "esterne", ext[:3])
                        await pg.close()
                    a, c = Image.open(foto[0]).convert("RGB"), Image.open(foto[1]).convert("RGB")
                    if a.size != c.size:
                        print(f, w, "DIVERSO: altezza", a.size, "->", c.size)
                    else:
                        box = ImageChops.difference(a, c).getbbox()
                        print(f, w, "IDENTICO" if box is None else f"diverso nel riquadro {box}")
            finally:
                os.remove(orig)
        await b.close()

asyncio.run(main())
