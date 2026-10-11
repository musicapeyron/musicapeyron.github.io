"""Disegna le schermate del reel (testi colorati, etichette dei giochi, chiusura).

Uso:  python3 _sviluppo/reel/grafiche.py                    (primo reel, tutte)
      python3 _sviluppo/reel/grafiche.py card1              (solo alcune)
      python3 _sviluppo/reel/grafiche.py test-ingresso      (un altro reel)
      python3 _sviluppo/reel/grafiche.py test-ingresso hook (un altro reel, solo alcune)

Ogni schermata è descritta in grafiche/schermate.json (primo reel) o
grafiche/schermate-<reel>.json (gli altri): nome, parametri,
durata, trasparenza) e disegnata da grafiche/grafiche.html, che usa i
caratteri del sito. Le animazioni CSS vengono fermate e portate a ogni
istante, così i fotogrammi PNG (1080x1920, 30 al secondo) sono esatti.
Risultato in lavoro/grafiche/<nome>/0000.png ... (primo reel)
o lavoro/<reel>/grafiche/<nome>/ (gli altri).

Tipi (parametro t):
  card   sfondo pieno nel colore di una nota (c=do..si), righe l="riga1|riga2", sottotitolo s
  hook   apertura trasparente: a / g / b (di serie "Giochi musicali / GRATIS / per la tua classe")
  label  etichetta del gioco in alto (l, colore c) e frase sotto (s, all'altezza sy)
  bg     sfondo del sito con cornice: k=phone (arrotondata) o k=lim, rettangolo x,y,w,h
  end    chiusura: musicascuole.it, note colorate, frase, info@musicascuole.it
"""
import asyncio, json, sys
from pathlib import Path
from playwright.async_api import async_playwright

BASE = Path(__file__).resolve().parent
PAGINA = (BASE / "grafiche" / "grafiche.html").as_uri() + "#"
OUT = BASE / "lavoro" / "grafiche"


async def disegna(pg, s, out, fps=30):
    cartella = out / s["name"]; cartella.mkdir(parents=True, exist_ok=True)
    for f in cartella.glob("*.png"): f.unlink()
    await pg.goto("about:blank"); await pg.goto(PAGINA + s["hash"]); await pg.wait_for_timeout(400)
    await pg.evaluate("document.fonts.ready")
    n = int(round(s["dur"] * fps))
    for i in range(n):
        await pg.evaluate(f"document.getAnimations().forEach(a=>{{a.pause();a.currentTime={i*1000/fps}}})")
        await pg.screenshot(path=str(cartella / f"{i:04d}.png"), omit_background=s.get("alpha", False))
    print(s["name"], n, "fotogrammi")


async def main(scelte):
    reel = "primo"
    if scelte and (BASE / "grafiche" / f"schermate-{scelte[0]}.json").exists():
        reel, scelte = scelte[0], scelte[1:]
    if reel == "primo":
        schermate, out = json.loads((BASE / "grafiche" / "schermate.json").read_text()), OUT
    else:
        schermate = json.loads((BASE / "grafiche" / f"schermate-{reel}.json").read_text())
        out = BASE / "lavoro" / reel / "grafiche"
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1080, "height": 1920})
        for s in schermate:
            if not scelte or s["name"] in scelte:
                await disegna(pg, s, out)
        await b.close()

if __name__ == "__main__":
    asyncio.run(main(sys.argv[1:]))
