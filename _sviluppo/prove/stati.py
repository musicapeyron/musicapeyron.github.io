"""Scatta una schermata per ogni stato di un gioco, a tre misure di finestra, e dice se qualcosa scorre.

Uso (dalla cartella del sito, con il server acceso: python3 -m http.server 8765 --bind 127.0.0.1):
    python3 _sviluppo/prove/stati.py <pagina.html> <cartella_uscita> <prefisso> <azioni.json>

azioni.json = lista di [nome_stato, [passi...]]; un passo è uno di:
    ["click", "#selettore"]   ["wait", millisecondi]   ["js", "codice"]   ["key", "Enter"]
Esempio: _sviluppo/prove/esempio-azioni.json

Per ogni stato stampa: giu/lato = px di scorrimento della pagina (devono essere 0),
zoom = ingrandimento scelto da adatta-schermo.js, interni = riquadri interni che scorrono,
fuori = elementi fissi che escono dallo schermo, e gli eventuali errori JavaScript.
Misure: tuo 1920x915 (LIM/schermo grande), pc 1366x657, portatile 1536x730.
"""
import sys, asyncio, json
from playwright.async_api import async_playwright

pagina, out, pref, af = sys.argv[1:5]
AZ = json.load(open(af, encoding="utf-8"))
MISURE = [(1920, 915, "tuo"), (1366, 657, "pc"), (1536, 730, "portatile")]
CONTROLLO = """(()=>{const d=document.documentElement;let inn=[];
for(const e of document.querySelectorAll('*')){const cs=getComputedStyle(e);
 if(/(auto|scroll)/.test(cs.overflowY+cs.overflowX)&&e.offsetParent!==null&&(e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2))
  inn.push((e.id||e.className||e.tagName).toString().slice(0,20)+':'+(e.scrollHeight-e.clientHeight))}
let fuori=[];for(const e of document.querySelectorAll('*')){const cs=getComputedStyle(e);
 if(cs.position==='fixed'&&cs.display!=='none'&&cs.visibility!=='hidden'&&parseFloat(cs.opacity)>0.05){
  for(const c of [e,...e.children]){const r=c.getBoundingClientRect();
   if(r.width>0&&(r.bottom>innerHeight+1||r.right>innerWidth+1||r.top<-1||r.left<-1))fuori.push((c.id||c.className||c.tagName).toString().slice(0,18))}}}
return {giu:d.scrollHeight-innerHeight,lato:d.scrollWidth-innerWidth,zoom:document.body.style.zoom||'-',interni:inn,fuori:fuori}})()"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h, t in MISURE:
            pg = await b.new_page(viewport={"width": w, "height": h})
            err = []
            pg.on("pageerror", lambda e: err.append(str(e)[:90]))
            # stesso "caso" a ogni prova, così le schermate prima/dopo sono confrontabili
            await pg.add_init_script("Math.random=(()=>{let s=11;return()=>{s=(s*16807)%2147483647;return (s-1)/2147483646}})();")
            await pg.goto("http://127.0.0.1:8765/" + pagina)
            await pg.wait_for_timeout(900)
            for nome, passi in AZ:
                for ps in passi:
                    try:
                        if ps[0] == "click": await pg.click(ps[1], force=True, timeout=3000)
                        elif ps[0] == "wait": await pg.wait_for_timeout(ps[1])
                        elif ps[0] == "js": await pg.evaluate(ps[1])
                        elif ps[0] == "key": await pg.keyboard.press(ps[1])
                    except Exception as e:
                        err.append(f"passo {ps}: {str(e)[:60]}")
                d = await pg.evaluate(CONTROLLO)
                await pg.screenshot(path=f"{out}/{pref}-{t}-{nome}.png")
                print(t, nome, d, err if err else "")
                err.clear()
            await pg.close()
        await b.close()

asyncio.run(main())
