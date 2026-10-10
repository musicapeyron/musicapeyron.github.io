import asyncio, sys
from playwright.async_api import async_playwright
U="http://127.0.0.1:8765/storia-medioevo.html"
# (nome, opzioni js, bottone i.j)
LAV=[("riassunto","",(0,0)),("riassunto-noimg","document.querySelector('#sImg button[data-v=\"0\"]').click()",(0,0)),("completa","",(1,0)),
     ("vf","",(2,1)),("mappa","",(3,1)),("mappa-breve","document.querySelector('#sVers button[data-v=\"1\"]').click()",(3,1)),("ascolto","",(4,1)),
     ("cruci","",(5,1)),("verificaA","",(6,0)),("verificaB","",(6,1)),("verificaA-breve","document.querySelector('#sVers button[data-v=\"1\"]').click()",(6,0))]
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
            await pg.pdf(path=f"s-{nome}.pdf", prefer_css_page_size=True, print_background=True)
            print(nome, "orizzontale" if ori else "", err)
            await pg.close()
        await b.close()
asyncio.run(main())
