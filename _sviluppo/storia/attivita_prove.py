import asyncio, sys
from playwright.async_api import async_playwright
import os; U="http://127.0.0.1:8765/"+os.environ.get("PAGINA","storia-medioevo.html")  # PAGINA=storia-<epoca>.html
STATI=sys.argv[2].split(",")
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for nome,(w,h) in {"tuo":(1920,915),"pc":(1366,657),"tel":(390,844)}.items():
            if len(sys.argv)>3 and nome not in sys.argv[3]: continue
            pg=await b.new_page(viewport={"width":w,"height":h}); err=[]
            pg.on("pageerror",lambda e: err.append(str(e)))
            for st in STATI:
                await pg.goto(U); await pg.wait_for_timeout(300)
                passi=st.split("+")
                for x in passi:
                    if x in ("mappa","esercizi","schede"): await pg.click(f'[data-scheda="{x}"]')
                    elif x.startswith("es"): await pg.click(f'#vistaEsercizi .a-carta[data-i="{x[2:]}"]')
                    elif x.startswith("sc"): i,j=x[2:].split("."); await pg.click(f'#vistaSchede .a-bot[data-i="{i}"][data-j="{j}"]')
                    elif x.startswith("js:"): await pg.evaluate(x[3:])
                    await pg.wait_for_timeout(250)
                info=await pg.evaluate("""()=>{const d=document.documentElement; const a=document.getElementById('aCorpo');
                  return {z:document.body.style.zoom, sh:d.scrollHeight-innerHeight, sw:d.scrollWidth-innerWidth, corpo:a&&!document.getElementById('attivita').hidden? a.scrollHeight-a.clientHeight:'', vm:(()=>{const v=document.querySelector('.vista:not([hidden])'); return v? v.scrollHeight-v.clientHeight:''})()}}""")
                print(nome, st, info)
                await pg.screenshot(path=f"{sys.argv[1]}-{nome}-{st.replace('+','_').replace(':','')[:40]}.png")
            if err: print("ERRORI", nome, err)
        await b.close()
asyncio.run(main())
