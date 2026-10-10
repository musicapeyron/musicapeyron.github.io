import asyncio
from playwright.async_api import async_playwright
U="http://127.0.0.1:8765/storia-medioevo.html"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={"width":1920,"height":915}); err=[]
        pg.on("pageerror",lambda e: err.append(str(e)))
        await pg.goto(U); await pg.wait_for_timeout(300)
        # collega: risolvi tutte le coppie (ognuna con un errore prima)
        for es in (0,1,2):
            await pg.click('[data-scheda="esercizi"]'); await pg.click(f'#vistaEsercizi .a-carta[data-i="{es}"]'); await pg.wait_for_timeout(200)
            n=await pg.evaluate("document.querySelectorAll('.cl.sx').length")
            for i in range(n):
                sx=pg.locator('.cl.sx:not(.fatto)').first; idx=await sx.get_attribute("data-i")
                await sx.click(); await pg.locator(f'.cl.dx[data-i="{idx}"]').click()
            print("collega",es, await pg.inner_text(".a-msg"))
            await pg.screenshot(path=f"g-collega{es}.png")
            await pg.click("#aChiudi")
        # vero/falso: tutte giuste
        await pg.click('[data-scheda="esercizi"]'); await pg.click('#vistaEsercizi .a-carta[data-i="3"]')
        vf=await pg.evaluate("1")
        for k in range(20):
            frase=await pg.inner_text(".vf .frase")
            # risposta "vera" letta dai dati della pagina non è accessibile: prova VERO e guarda l'esito
            await pg.click(".vf .tasti .v"); 
            await pg.click("#aNav .avanti")
        print("vf", await pg.inner_text(".vf"))
        await pg.screenshot(path="g-vf.png"); await pg.click("#aChiudi")
        # mappa: riempi tutto
        await pg.click('[data-scheda="esercizi"]'); await pg.click('#vistaEsercizi .a-carta[data-i="4"]')
        ws=await pg.evaluate("[...document.querySelectorAll('.m-buco')].map(b=>b.dataset.w)")
        await pg.click('.banca button[data-w="violino"]'); await pg.locator('.m-buco').first.click()
        for w in ws:
            await pg.click(f'.banca button[data-w="{w}"]'); await pg.locator(f'.m-buco[data-w="{w}"]:not(.pieno)').first.click()
        print("mappa", await pg.inner_text("#aNav .c-pallini"))
        await pg.screenshot(path="g-mappa.png"); await pg.click("#aChiudi")
        # cruciverba: scrivi una parola con la tastiera, poi soluzione
        await pg.click('[data-scheda="esercizi"]'); await pg.click('#vistaEsercizi .a-carta[data-i="5"]')
        await pg.locator(".definizioni p").first.click()
        await pg.keyboard.type("ABC")
        await pg.click("#aNav .avanti"); await pg.wait_for_timeout(100)
        await pg.screenshot(path="g-cruci1.png")
        await pg.click("#aNav .c-freccia:first-child"); await pg.wait_for_timeout(100)
        print("cruci", await pg.inner_text(".a-msg"))
        await pg.screenshot(path="g-cruci2.png"); await pg.click("#aChiudi")
        # ascolto
        await pg.click('[data-scheda="schede"]'); await pg.click('#vistaSchede .a-bot[data-i="4"][data-j="0"]')
        for c in await pg.locator(".criterio").all(): await c.locator("button").first.click()
        await pg.click("#aNav .avanti"); await pg.wait_for_timeout(100)
        print("ascolto", await pg.inner_text(".a-msg"))
        await pg.screenshot(path="g-asc.png")
        print("errori", err)
        await b.close()
asyncio.run(main())
