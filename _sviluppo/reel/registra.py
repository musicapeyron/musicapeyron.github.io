"""Registra le clip dei giochi per i reel Instagram.

Uso:  python3 _sviluppo/reel/registra.py            (tutte le clip)
      python3 _sviluppo/reel/registra.py leggi rap  (solo alcune)

Avvia da solo un server locale sulla cartella del sito, apre i giochi in
Chromium (Playwright) e registra lo schermo con lo screencast di Chrome:
fotogrammi nitidi alla risoluzione finale, poi un .mp4 per clip in
lavoro/clip/. I tocchi sono simulati e mostrati con un cerchio bianco.

Telefono: emulazione vera (Pixel 7: tocco, browser mobile, densità 2.625),
verticale 412x732 -> 1080x1920, orizzontale 732x412 -> 1920x1080.
LIM: 1920x1080 con il mouse.
"""
import asyncio, base64, os, shutil, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

BASE = Path(__file__).resolve().parent
SITO = BASE.parent.parent
CLIP = BASE / "lavoro" / "clip"
PORTA = 8765
U = f"http://localhost:{PORTA}/"

TAP_JS = """
(() => {
 if (window.__tapInstalled) return; window.__tapInstalled = true;
 const st = document.createElement('style');
 st.textContent = `.__tap{position:fixed;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;
 background:rgba(255,255,255,.55);border:3px solid rgba(255,255,255,.95);pointer-events:none;z-index:2147483647;
 animation:__tapA .55s ease-out forwards}@keyframes __tapA{from{transform:scale(.4);opacity:1}to{transform:scale(1.5);opacity:0}}`;
 document.documentElement.appendChild(st);
 window.__tap = (x,y) => { const d=document.createElement('div'); d.className='__tap'; d.style.left=x+'px'; d.style.top=y+'px';
   document.body.appendChild(d); setTimeout(()=>d.remove(),700); };
})();
"""
PIXEL_UA = ("Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36")


class Rec:
    """Registra con Page.startScreencast; i fotogrammi arrivano solo quando
    la pagina cambia, con il loro istante: il file ffconcat ne conserva i tempi."""
    def __init__(self, page, nome, w, h):
        self.page, self.dir, self.w, self.h = page, CLIP / nome, w, h
        self.frames = []
    async def start(self):
        if self.dir.exists(): shutil.rmtree(self.dir)
        self.dir.mkdir(parents=True)
        self.cdp = await self.page.context.new_cdp_session(self.page)
        self.cdp.on("Page.screencastFrame", self._on)
        await self.cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 92,
                            "maxWidth": self.w, "maxHeight": self.h, "everyNthFrame": 1})
    def _on(self, ev):
        p = self.dir / f"f{len(self.frames):05d}.jpg"
        p.write_bytes(base64.b64decode(ev["data"]))
        self.frames.append((p, ev["metadata"]["timestamp"]))
        asyncio.ensure_future(self.cdp.send("Page.screencastFrameAck", {"sessionId": ev["sessionId"]}))
    async def stop(self):
        await self.cdp.send("Page.stopScreencast")
        fr, righe = self.frames, ["ffconcat version 1.0"]
        for k, (p, t) in enumerate(fr):
            d = (fr[k + 1][1] - t) if k + 1 < len(fr) else 0.5
            righe += [f"file '{p}'", f"duration {max(d, 0.001):.4f}"]
        righe.append(f"file '{fr[-1][0]}'")
        txt = self.dir.with_suffix(".txt"); txt.write_text("\n".join(righe))
        mp4 = self.dir.with_suffix(".mp4")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(txt),
                        "-vf", f"scale={self.w}:{self.h}:flags=lanczos,fps=30,format=yuv420p",
                        "-c:v", "libx264", "-crf", "17", str(mp4)], check=True)
        print(f"{self.dir.name}: {len(fr)} fotogrammi, {fr[-1][1]-fr[0][1]:.1f} s -> {mp4.name}")


async def tap(page, locator):
    await page.evaluate(TAP_JS)
    box = await locator.bounding_box()
    x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    await page.evaluate(f"window.__tap({x},{y})")
    if getattr(page, "_touch", False):
        await page.touchscreen.tap(x, y)
    else:
        await page.mouse.move(x, y); await page.mouse.click(x, y)


async def telefono(p, pagina, orizzontale=False):
    b = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
    vp = {"width": 732, "height": 412} if orizzontale else {"width": 412, "height": 732}
    ctx = await b.new_context(viewport=vp, screen=vp, device_scale_factor=2.625,
                              is_mobile=True, has_touch=True, user_agent=PIXEL_UA)
    pg = await ctx.new_page(); pg._touch = True
    await pg.goto(U + pagina); await pg.wait_for_timeout(1500); await pg.evaluate(TAP_JS)
    return b, pg, ((1920, 1080) if orizzontale else (1080, 1920))


async def lim(p, pagina, w=1920, h=1080, dsf=1):
    b = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
    ctx = await b.new_context(viewport={"width": w, "height": h}, device_scale_factor=dsf)
    pg = await ctx.new_page(); await pg.goto(U + pagina); await pg.wait_for_timeout(1200)
    await pg.evaluate(TAP_JS)
    return b, pg, (int(w * dsf), int(h * dsf))


# porta i pulsanti di risposta al 74% dello schermo: sotto resta la zona
# coperta dai comandi di Instagram
SCROLL = ("(sel)=>{const a=document.querySelector(sel).getBoundingClientRect();"
          "window.scrollBy({top:a.bottom-0.74*innerHeight,behavior:'smooth'});}")


# ---------------- clip ----------------
# Le risposte giuste si leggono dalle variabili globali dei giochi
# (currentNote, currentQuestion, currentKey...): se un gioco cambia nome
# a queste variabili, aggiornare qui.

async def leggi():
    async with async_playwright() as p:
        b, pg, (W, H) = await telefono(p, "leggi-la-nota.html")
        r = Rec(pg, "leggi", W, H); await r.start(); await pg.wait_for_timeout(500)
        await tap(pg, pg.get_by_text("Allenamento").first); await pg.wait_for_timeout(1500)
        await pg.evaluate(SCROLL, ".answers"); await pg.wait_for_timeout(1000)
        for _ in range(7):
            nome = await pg.evaluate("currentNote.name")
            await tap(pg, pg.locator(f'.answers button[data-note="{nome}"]').first)
            await pg.wait_for_timeout(1150)
        await r.stop(); await b.close()


async def rap():
    # su telefono il gioco chiede di girarlo in orizzontale: lì le carte sono grandi
    async with async_playwright() as p:
        b, pg, (W, H) = await telefono(p, "rap-con-le-note.html", orizzontale=True)
        r = Rec(pg, "rap", W, H); await r.start(); await pg.wait_for_timeout(400)
        loc = pg.get_by_text("Sequenze ascendenti").first
        await loc.evaluate("e=>e.scrollIntoView({block:'center'})"); await pg.wait_for_timeout(300)
        await tap(pg, loc); await pg.wait_for_timeout(20000)  # ~10 s di conto alla rovescia, poi le carte
        await r.stop(); await b.close()


async def brani():
    async with async_playwright() as p:
        b, pg, (W, H) = await telefono(p, "brani-propedeutici.html")
        r = Rec(pg, "brani", W, H); await r.start(); await pg.wait_for_timeout(600)
        await tap(pg, pg.locator('a.ind[data-n="10"]').first); await pg.wait_for_timeout(1400)
        await pg.evaluate(TAP_JS)
        await pg.evaluate("window.scrollBy({top:300,behavior:'smooth'})"); await pg.wait_for_timeout(1500)
        cn = pg.locator("#brano-10").get_by_text("Colori e nomi").first
        await cn.evaluate("e=>e.scrollIntoView({block:'center',behavior:'smooth'})"); await pg.wait_for_timeout(1000)
        await tap(pg, cn); await pg.wait_for_timeout(1000)
        await pg.evaluate("window.scrollBy({top:330,behavior:'smooth'})"); await pg.wait_for_timeout(2200)
        await r.stop(); await b.close()


async def storia():
    async with async_playwright() as p:
        b, pg, (W, H) = await telefono(p, "storia.html")
        r = Rec(pg, "storia", W, H); await r.start(); await pg.wait_for_timeout(700)
        await pg.evaluate("window.scrollBy({top:520,behavior:'smooth'})"); await pg.wait_for_timeout(1300)
        card = pg.get_by_text("Barocco").first
        await card.evaluate("e=>e.scrollIntoView({block:'center',behavior:'smooth'})"); await pg.wait_for_timeout(1000)
        await tap(pg, card); await pg.wait_for_timeout(2300); await pg.evaluate(TAP_JS)
        await pg.evaluate("window.scrollBy({top:420,behavior:'smooth'})"); await pg.wait_for_timeout(2000)
        await r.stop(); await b.close()


async def tastiera():
    async with async_playwright() as p:
        b, pg, (W, H) = await lim(p, "tastierapianoforte.html")
        await pg.get_by_text("Versione PC").first.click(); await pg.wait_for_timeout(1000)
        await pg.evaluate(TAP_JS)
        r = Rec(pg, "tastiera", W, H); await r.start(); await pg.wait_for_timeout(500)
        await tap(pg, pg.get_by_text("Note naturali").first); await pg.wait_for_timeout(1500)
        for _ in range(7):
            nota = await pg.evaluate("expectedAnswerForKeyId(currentKey, gameMode)")
            await tap(pg, pg.locator(f'button.answer[data-note="{nota}"]').first)
            await pg.wait_for_timeout(1300)
        await r.stop(); await b.close()


async def figure():
    # registrata come schermo PC/LIM 1280x800 (16:10): nel montaggio si ritaglia a 16:9.
    # Su telefono, a ottobre 2026, i pulsanti di risposta uscivano dallo schermo.
    async with async_playwright() as p:
        b, pg, (W, H) = await lim(p, "figure-ritmiche.html", 1280, 800, 1.5)
        r = Rec(pg, "figure", W, H); await r.start(); await pg.wait_for_timeout(400)
        await tap(pg, pg.get_by_text("Allenamento").first); await pg.wait_for_timeout(1500)
        for _ in range(7):
            k = await pg.evaluate("currentQuestion.key")
            await tap(pg, pg.locator(f'.answers button[data-key="{k}"]').first)
            await pg.wait_for_timeout(1300)
        await r.stop(); await b.close()


TUTTE = ["leggi", "rap", "brani", "storia", "tastiera", "figure"]

if __name__ == "__main__":
    CLIP.mkdir(parents=True, exist_ok=True)
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORTA)], cwd=SITO,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        for nome in (sys.argv[1:] or TUTTE):
            asyncio.run(globals()[nome]())
    finally:
        srv.terminate()
