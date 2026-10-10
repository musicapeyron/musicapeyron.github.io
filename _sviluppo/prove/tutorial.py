"""Percorre tutti i passi di un tutorial e dice, per ognuno, quanto è alta la schermata e che zoom riceve.
Serve a controllare che l'ingrandimento NON cambi fra un passo e l'altro (se cambia, la LIM "salta").

Uso (server acceso su 127.0.0.1:8765):
    python3 _sviluppo/prove/tutorial.py <pagina.html> <selettore_pulsante_tutorial> <id_schermata_tutorial> [prefisso_schermate]
es. python3 _sviluppo/prove/tutorial.py identifica-tonalita.html '#tutorialButton' tutorialScreen /tmp/tut

Funziona con i tutorial che hanno T.passi e vaiA(i) (es. Identifica la tonalità). Per gli altri tutorial
(es. Nomina gli intervalli) si va avanti premendo "Avanti" e provando le risposte: vedi la guida.
"""
import sys, asyncio
from playwright.async_api import async_playwright

pagina, avvio, schermata = sys.argv[1:4]
pref = sys.argv[4] if len(sys.argv) > 4 else None


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1920, "height": 915})
        err = []
        pg.on("pageerror", lambda e: err.append(str(e)[:90]))
        await pg.goto("http://127.0.0.1:8765/" + pagina)
        await pg.wait_for_timeout(800)
        await pg.click(avvio)
        await pg.wait_for_timeout(800)
        n = await pg.evaluate("T.passi.length")
        zoom = set()
        for i in range(n):
            await pg.evaluate(f"vaiA({i})")
            await pg.wait_for_timeout(300)
            r = await pg.evaluate(f"[document.getElementById('{schermata}').offsetHeight, document.body.style.zoom||'-']")
            zoom.add(r[1])
            print(i, "altezza", r[0], "zoom", r[1])
            if pref:
                await pg.screenshot(path=f"{pref}-{i:02d}.png")
        print("zoom diversi:", sorted(zoom), "| errori:", err)
        await b.close()

asyncio.run(main())
