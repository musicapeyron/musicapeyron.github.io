import asyncio
from playwright.async_api import async_playwright
import sys; U="http://127.0.0.1:8765/" + (sys.argv[1] if len(sys.argv) > 1 else "storia-medioevo.html")
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for nome,(w,h) in {"tuo":(1920,915),"pc":(1366,657),"tel":(390,844),"telo":(932,430)}.items():
            pg=await b.new_page(viewport={"width":w,"height":h}); err=[]; ext=[]
            pg.on("pageerror",lambda e: err.append(str(e))); pg.on("console", lambda m: err.append(m.text) if m.type=="error" else None)
            pg.on("request",lambda r: ext.append(r.url) if "127.0.0.1" not in r.url and not r.url.startswith("data:") else None)
            await pg.goto(U); await pg.wait_for_timeout(500)
            z0=await pg.evaluate("document.body.style.zoom")
            await pg.click("#inizia"); await pg.wait_for_timeout(200)
            prob=[]; zooms=set(); n=0
            for _ in range(80):
                # aspetta (al massimo 2 s) che le immagini della pagina siano caricate: se il computer è lento non è un errore
                try: await pg.wait_for_function("[...document.querySelectorAll('#cDiapo img')].every(i=>i.complete)", timeout=2000)
                except Exception: pass
                r=await pg.evaluate("""()=>{const d=document.getElementById('cDiapo'),c=document.getElementById('capitolo');
                  const imgs=[...d.querySelectorAll('img')].map(i=>i.complete&&i.naturalWidth>0);
                  return {o:d.scrollHeight-d.clientHeight, s:document.documentElement.scrollHeight-innerHeight, z:document.body.style.zoom, t:document.getElementById('cTitolo').textContent, img:imgs.every(x=>x), h:location.hash}}""")
                n+=1; zooms.add(r["z"])
                if (r["o"]>1 and nome in("tuo","pc")) or (r["s"]>0 and nome in("tuo","pc")) or not r["img"]: prob.append((r["t"][:25],r["o"],r["s"],r["img"]))
                if await pg.evaluate("document.getElementById('cNum').textContent==='Fine del percorso' && [...document.querySelectorAll('#cPallini .pallino')].pop().classList.contains('qui')"): break
                await pg.click("#cSucc"); await pg.wait_for_timeout(120)
            # il primo strumento che compare nei capitoli
            await pg.goto(U+"#capitolo-1"); await pg.wait_for_timeout(300)
            for _ in range(40):
                if await pg.locator(".c-strum").count(): break
                await pg.click("#cSucc"); await pg.wait_for_timeout(80)
            await pg.click(".c-strum"); await pg.wait_for_timeout(200)
            vel=await pg.evaluate("document.getElementById('velo').classList.contains('aperto')")
            await pg.keyboard.press("Escape"); await pg.keyboard.press("Escape"); await pg.wait_for_timeout(400)
            z1=await pg.evaluate("[document.body.style.zoom, document.getElementById('capitolo').hidden]")
            print(nome,"pagine",n,"zoom indice",z0,"zoom capitoli",zooms,"strumento",vel,"dopo chiusura",z1,"problemi",prob,"errori",err,"esterne",ext[:3])
        await b.close()
asyncio.run(main())
