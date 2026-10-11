"""Studia una pagina del sito prima di farne un reel.

Uso:  python3 _sviluppo/reel/esplora.py memory-strumenti.html

In lavoro/esplora/<pagina>/ scrive:
  schermi.png    la pagina su telefono (in piedi e girato), PC 1366x768 e LIM 1920x1080,
                 per scegliere su quale dispositivo riprenderla
  sommario.txt   pulsanti e link visibili (i testi da usare nei passi "tocca": "testo:...")
                 e le variabili globali del gioco (per scrivere la sua voce in RISPOSTE,
                 in registra.py, così il reel può rispondere da solo)
"""
import asyncio, re, subprocess, sys, time
from pathlib import Path
from PIL import Image, ImageDraw
from playwright.async_api import async_playwright

import registra

BASE = Path(__file__).resolve().parent
SITO = BASE.parent.parent

SCHERMI = [("telefono", 412, 732, True), ("telefono girato", 732, 412, True),
           ("PC 1366x768", 1366, 768, False), ("LIM 1920x1080", 1920, 1080, False)]

ELENCA = """() => [...document.querySelectorAll('button, a, [role=button], .card, .mode-button')]
  .filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height && getComputedStyle(e).visibility !== 'hidden'; })
  .map(e => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).join('.') : '')
      + '  «' + (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' ').slice(0, 50) + '»'))
  .slice(0, 60)"""


async def main(pagina):
    out = BASE / "lavoro" / "esplora" / pagina.removesuffix(".html"); out.mkdir(parents=True, exist_ok=True)
    righe = [f"Pagina: {pagina}", ""]
    imgs = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for nome, w, h, tel in SCHERMI:
            ctx = await b.new_context(viewport={"width": w, "height": h}, screen={"width": w, "height": h},
                                      is_mobile=tel, has_touch=tel, user_agent=registra.PIXEL_UA if tel else None)
            pg = await ctx.new_page(); errori = []
            pg.on("pageerror", lambda e: errori.append(str(e)))
            await pg.goto(registra.U + pagina); await pg.wait_for_timeout(1200)
            f = out / f"{nome.replace(' ', '_')}.png"; await pg.screenshot(path=str(f)); imgs.append((nome, f))
            if nome == "LIM 1920x1080":
                righe += ["Pulsanti e link visibili (schermo LIM):"] + ["  " + x for x in await pg.evaluate(ELENCA)] + [""]
            if errori: righe += [f"ERRORI JavaScript ({nome}): " + "; ".join(errori), ""]
            await ctx.close()
        await b.close()
    # variabili globali dichiarate negli script della pagina
    html = (SITO / pagina).read_text()
    script = "\n".join(re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", html, re.S))
    nomi = re.findall(r"^(?:let|const|var)\s+(\w+)", script, re.M)
    funz = re.findall(r"^(?:async\s+)?function\s+(\w+)", script, re.M)
    interessanti = [n for n in nomi if re.search(r"current|answer|correct|question|level|mode|index|note|key|score", n, re.I)]
    righe += ["Variabili globali che di solito dicono la risposta giusta:", "  " + ", ".join(interessanti or ["(nessuna trovata)"]), "",
              "Tutte le variabili globali:", "  " + ", ".join(nomi), "",
              "Funzioni (cerca check..., answer..., next...):", "  " + ", ".join(funz), ""]
    (out / "sommario.txt").write_text("\n".join(righe))
    # tavola con i quattro schermi
    H = 520; celle = []
    for nome, f in imgs:
        im = Image.open(f); k = H / im.height; celle.append((nome, im.resize((int(im.width * k), H))))
    tav = Image.new("RGB", (sum(c.width for _, c in celle) + 20 * (len(celle) + 1), H + 60), (24, 22, 48))
    g = ImageDraw.Draw(tav); x = 20
    for nome, c in celle:
        tav.paste(c, (x, 40)); g.text((x, 12), nome, fill=(220, 218, 255)); x += c.width + 20
    tav.save(out / "schermi.png")
    print("\n".join(righe)); print("Schermi:", out / "schermi.png")


if __name__ == "__main__":
    if len(sys.argv) < 2: raise SystemExit(__doc__)
    srv = registra.server()
    try:
        asyncio.run(main(sys.argv[1]))
    finally:
        srv.terminate()
