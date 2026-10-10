# python3 foto.py prefisso  -> schermate di indice e pagine a tuo/pc/tel
import sys, asyncio
from playwright.async_api import async_playwright
P = sys.argv[1]; U = "http://127.0.0.1:8765/" + (sys.argv[3] if len(sys.argv) > 3 else "storia-medioevo.html")
MIS = {"tuo": (1920, 915), "pc": (1366, 657), "tel": (390, 844)}
STATI = sys.argv[2].split(",") if len(sys.argv) > 2 else ["indice", "strum", "c1p1", "c1p4", "c5p5", "c6p6", "c11p4", "c11p5"]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for nome, (w, h) in MIS.items():
            pg = await b.new_page(viewport={"width": w, "height": h})
            err = []; ext = []
            pg.on("pageerror", lambda e: err.append(str(e)))
            pg.on("request", lambda r: ext.append(r.url) if "127.0.0.1" not in r.url and not r.url.startswith("data:") else None)
            for st in STATI:
                await pg.goto(U); await pg.wait_for_timeout(400)
                if st == "strum": await pg.click('[data-scheda="strumenti"]')
                elif st.startswith("c"):
                    c, k = st[1:].split("p")
                    await pg.evaluate(f"location.hash='#capitolo-{c}'"); await pg.wait_for_timeout(200)
                    for _ in range(int(k) - 1): await pg.click("#cSucc")
                await pg.wait_for_timeout(500)
                info = await pg.evaluate("""() => { const d=document.documentElement, c=document.getElementById('capitolo'), di=document.getElementById('cDiapo');
                  return {zoom: document.body.style.zoom, sh: d.scrollHeight - innerHeight, sw: d.scrollWidth - innerWidth,
                    cap: c.hidden ? '' : (c.scrollHeight - c.clientHeight), diapo: di ? di.scrollHeight - di.clientHeight : ''} }""")
                print(nome, st, info)
                await pg.screenshot(path=f"{P}-{nome}-{st}.png")
            if err: print("ERRORI", nome, err)
            if ext: print("ESTERNE", nome, ext[:5])
        await b.close()
asyncio.run(main())
