"""Prova il "clic sul bordo alto": clicca (mouse e tocco) a 1, 3, 5, 8 e 20 px dal bordo alto del primo
pulsante di risposta e controlla che la risposta venga contata.

Uso (server acceso su 127.0.0.1:8765):
    python3 _sviluppo/prove/bordo.py <pagina.html> <pulsante_avvio> <selettore_risposte> <id_contatore> [condizione_js_pronto]
es. python3 _sviluppo/prove/bordo.py acuto-o-grave.html '#trainingButton' '#answers .answer' total "answering && !isPlaying"

condizione_js_pronto: espressione JavaScript vera quando il gioco accetta una risposta (molti giochi
ignorano i clic mentre suona l'esempio). Senza, si aspetta solo un po'.
Atteso: tutti "ok". Se compare "NON preso", il pulsante probabilmente si sposta con transform su :hover/:active.
"""
import asyncio, sys
from playwright.async_api import async_playwright

pagina, avvio, risposte, contatore = sys.argv[1:5]
pronto = sys.argv[5] if len(sys.argv) > 5 else None


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for touch in [False, True]:
            ctx = await b.new_context(viewport={"width": 1920, "height": 915}, has_touch=touch)
            pg = await ctx.new_page()
            await pg.goto("http://127.0.0.1:8765/" + pagina)
            await pg.wait_for_timeout(700)
            await pg.click(avvio, force=True)
            await pg.wait_for_timeout(1000)
            ris = []
            for dy in [1, 3, 5, 8, 20]:
                if pronto:
                    await pg.wait_for_function(pronto, timeout=15000)
                else:
                    await pg.wait_for_timeout(1500)
                prima = await pg.evaluate(f"document.getElementById('{contatore}').textContent")
                bb = await pg.locator(risposte + ":visible").first.bounding_box()
                x, y = bb["x"] + bb["width"] / 2, bb["y"] + dy
                if touch:
                    await pg.touchscreen.tap(x, y)
                else:
                    await pg.mouse.move(x, y); await pg.wait_for_timeout(300)
                    await pg.mouse.down(); await pg.wait_for_timeout(150); await pg.mouse.up()
                await pg.wait_for_timeout(1600)
                dopo = await pg.evaluate(f"document.getElementById('{contatore}').textContent")
                ris.append(f"{dy}px:{'ok' if dopo != prima else 'NON preso'}")
            print("tocco" if touch else "mouse", " ".join(ris))
            await ctx.close()
        await b.close()

asyncio.run(main())
