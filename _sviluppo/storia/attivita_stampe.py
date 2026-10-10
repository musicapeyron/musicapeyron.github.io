import asyncio, sys
from playwright.async_api import async_playwright
import os; U="http://127.0.0.1:8765/"+os.environ.get("PAGINA","storia-medioevo.html")  # PAGINA=storia-<epoca>.html
# (nome, opzioni js, bottone i.j)
LAV=[("riassunto","",(0,0)),("riassunto-breve","document.querySelector('.a-scelta[data-o=\"riassunto\"][data-k=\"breve\"] button[data-v=\"1\"]').click()",(0,0)),
     ("completa","",(1,0)),("completa-breve","document.querySelector('.a-scelta[data-o=\"completa\"][data-k=\"breve\"] button[data-v=\"1\"]').click()",(1,0)),
     ("completa-breve-noimg","document.querySelector('.a-scelta[data-o=\"completa\"][data-k=\"breve\"] button[data-v=\"1\"]').click();document.querySelector('.a-scelta[data-o=\"completa\"][data-k=\"img\"] button[data-v=\"0\"]').click()",(1,0)),
     ("vf","",(2,1)),("mappa","",(3,1)),("ascolto","",(4,1)),("cruci","",(5,1)),("verificaA","",(6,0)),("verificaB","",(6,1))]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for nome,js,(i,j) in LAV:
            if len(sys.argv)>1 and nome not in sys.argv[1:]: continue
            pg=await b.new_page(viewport={"width":1366,"height":657}); err=[]
            pg.on("pageerror",lambda e: err.append(str(e)))
            await pg.goto(U); await pg.wait_for_timeout(300)
            await pg.evaluate("window.print=()=>{window.__stampato=1}")
            await pg.click('[data-scheda="schede"]')
            if js: await pg.evaluate(js)
            await pg.click(f'#vistaSchede .a-bot[data-i="{i}"][data-j="{j}"]')
            await pg.wait_for_function("window.__stampato===1", timeout=15000)
            await pg.emulate_media(media="print")
            ori = await pg.evaluate("document.getElementById('stampaPagina').textContent.includes('landscape')")
            await pg.pdf(path=os.environ.get("CARTELLA",".")+f"/s-{nome}.pdf", prefer_css_page_size=True, print_background=True)
            print(nome, "orizzontale" if ori else "", err)
            await pg.close()
        await b.close()
asyncio.run(main())
