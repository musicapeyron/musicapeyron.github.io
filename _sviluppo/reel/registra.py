"""Registra le clip dei giochi per i reel Instagram.

Di solito non si lancia da solo: lo usa reel.py. Si può però usare per
rifare solo alcune clip di un reel:
      python3 _sviluppo/reel/registra.py test-ingresso            (tutte le clip del reel)
      python3 _sviluppo/reel/registra.py primo leggi rap          (solo alcune)

Le clip sono descritte nel file del reel (reels/<reel>.json, voce "clip"):
  - a PASSI (il modo normale): pagina, dispositivo e una lista di azioni
    (tocca, attendi, scorri, rispondi...) -> vedi esegui() qui sotto;
  - oppure con una FUNZIONE scritta qui (per i casi complicati, come il test
    d'ingresso, dove i giochi cambiano da soli).

Avvia da solo un server locale sulla cartella del sito, apre i giochi in
Chromium (Playwright) e registra lo schermo con lo screencast di Chrome:
fotogrammi nitidi alla risoluzione finale, poi un .mp4 per clip in
lavoro/clip/. I tocchi sono simulati e mostrati con un cerchio bianco.

Telefono: emulazione vera (Pixel 7: tocco, browser mobile, densità 2.625),
verticale 412x732 -> 1080x1920, orizzontale 732x412 -> 1920x1080.
LIM: 1920x1080 con il mouse.
"""
import asyncio, base64, json, os, shutil, subprocess, sys, time
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
        self.segni = {}   # momenti notevoli -> <nome>.json, letti da monta.py
    def segna(self, nome):
        self.segni[nome] = time.time()
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
        asyncio.ensure_future(self._ack(ev["sessionId"]))
    async def _ack(self, sid):
        try:  # dopo la chiusura del browser l'ultima conferma non trova più la pagina: va bene così
            await self.cdp.send("Page.screencastFrameAck", {"sessionId": sid})
        except Exception:
            pass
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
        if self.segni:  # secondi dall'inizio del video (i tempi dei fotogrammi sono in secondi epoch)
            segni = {k: round(t - fr[0][1], 3) for k, t in self.segni.items()}
            self.dir.with_suffix(".json").write_text(json.dumps(segni, indent=1))
        print(f"{self.dir.name}: {len(fr)} fotogrammi, {fr[-1][1]-fr[0][1]:.1f} s -> {mp4.name}")


async def tap(page, locator):
    await page.evaluate(TAP_JS)
    box = await locator.bounding_box()
    vp = page.viewport_size
    if box and (box["y"] < 0 or box["y"] + box["height"] > vp["height"]):
        # fuori schermo: prima ci si scorre sopra, come farebbe una persona
        await locator.evaluate("e=>e.scrollIntoView({block:'center',behavior:'smooth'})")
        await page.wait_for_timeout(700)
        box = await locator.bounding_box()
    x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    await page.evaluate(f"window.__tap({x},{y})")
    if getattr(page, "_touch", False):
        await page.touchscreen.tap(x, y)
    else:
        await page.mouse.move(x, y); await page.mouse.click(x, y)


# Audio del gioco: ogni AudioContext della pagina manda il suo suono anche a un registratore
# (MediaRecorder), che parte quando il contesto nasce. L'istante di partenza (in ms epoch) serve
# a mettere il suono in sincrono con i fotogrammi.
AUDIO_JS = """
(() => {
  if (!window.AudioNode || window.__reelAudio) return; window.__reelAudio = [];
  const conn = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...resto) {
    const r = conn.call(this, dest, ...resto);
    try {
      if (dest instanceof AudioDestinationNode) {
        const ctx = this.context;
        if (!ctx.__reel) {
          const out = ctx.createMediaStreamDestination(), rec = new MediaRecorder(out.stream), pezzi = [];
          rec.ondataavailable = e => pezzi.push(e.data);
          ctx.__reel = {out, rec, pezzi, inizio: performance.timeOrigin + performance.now()};
          rec.start(); window.__reelAudio.push(ctx.__reel);
        }
        conn.call(this, ctx.__reel.out);
      }
    } catch (e) {}
    return r;
  };
})();
"""

RACCOGLI_AUDIO = """async () => Promise.all((window.__reelAudio || []).map(a => new Promise(ok => {
  a.rec.onstop = () => { const fr = new FileReader();
    fr.onload = () => ok({inizio: a.inizio, dati: fr.result.split(',')[1]});
    fr.readAsDataURL(new Blob(a.pezzi, {type: a.rec.mimeType})); };
  a.rec.stop(); })))"""


async def audio_gioco(pg, r):
    """Raccoglie il suono registrato nella pagina e scrive lavoro/clip/<clip>.wav, in sincrono col video."""
    tracce = await pg.evaluate(RACCOGLI_AUDIO)
    return tracce


def scrivi_audio(r, tracce):
    if not tracce: print("  (nessun suono registrato)"); return
    t0 = r.frames[0][1]
    ins, filtri = [], []
    for i, t in enumerate(tracce):
        f = r.dir.parent / f"{r.dir.name}_audio{i}.webm"; f.write_bytes(base64.b64decode(t["dati"]))
        rit = max(0, int(round((t["inizio"] / 1000 - t0) * 1000)))
        ins += ["-i", str(f)]; filtri.append(f"[{i}:a]adelay={rit}:all=1[a{i}]")
    mix = "".join(f"[a{i}]" for i in range(len(tracce)))
    subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex",
                    ";".join(filtri) + f";{mix}amix=inputs={len(tracce)}:normalize=0[o]", "-map", "[o]",
                    "-ar", "48000", "-ac", "2", str(r.dir.with_suffix(".wav"))], check=True)
    print(f"  {r.dir.name}: audio del gioco -> {r.dir.name}.wav")


async def telefono(p, pagina, orizzontale=False, audio=False):
    b = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
    vp = {"width": 732, "height": 412} if orizzontale else {"width": 412, "height": 732}
    ctx = await b.new_context(viewport=vp, screen=vp, device_scale_factor=2.625,
                              is_mobile=True, has_touch=True, user_agent=PIXEL_UA)
    if audio: await ctx.add_init_script(AUDIO_JS)
    pg = await ctx.new_page(); pg._touch = True
    await pg.goto(U + pagina); await pg.wait_for_timeout(1500); await pg.evaluate(TAP_JS)
    return b, pg, ((1920, 1080) if orizzontale else (1080, 1920))


TABLET_UA = ("Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 "
             "(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36")


async def tablet(p, pagina, audio=False):
    """Tablet in verticale (768x1024, tocco, browser da tablet) -> 1080x1440."""
    b = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
    vp = {"width": 768, "height": 1024}
    ctx = await b.new_context(viewport=vp, screen=vp, device_scale_factor=1.40625,
                              is_mobile=True, has_touch=True, user_agent=TABLET_UA)
    if audio: await ctx.add_init_script(AUDIO_JS)
    pg = await ctx.new_page(); pg._touch = True
    await pg.goto(U + pagina); await pg.wait_for_timeout(1500); await pg.evaluate(TAP_JS)
    return b, pg, (1080, 1440)


async def lim(p, pagina, w=1920, h=1080, dsf=1, audio=False):
    b = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
    ctx = await b.new_context(viewport={"width": w, "height": h}, device_scale_factor=dsf)
    if audio: await ctx.add_init_script(AUDIO_JS)
    pg = await ctx.new_page(); await pg.goto(U + pagina); await pg.wait_for_timeout(1200)
    await pg.evaluate(TAP_JS)
    return b, pg, (int(w * dsf), int(h * dsf))


# porta i pulsanti di risposta al 74% dello schermo: sotto resta la zona
# coperta dai comandi di Instagram
SCROLL = ("(sel)=>{const a=document.querySelector(sel).getBoundingClientRect();"
          "window.scrollBy({top:a.bottom-0.74*innerHeight,behavior:'smooth'});}")


# ---------------- clip descritte a passi ----------------

# Risposta giusta di ogni gioco: espressione JS che restituisce il pulsante giusto
# (o null se ora non si può rispondere). Si leggono le variabili globali dei giochi:
# se un gioco cambia nome a queste variabili, aggiornare qui.
# Per un gioco nuovo: python3 _sviluppo/reel/esplora.py <pagina>.html elenca variabili e pulsanti.
RISPOSTE = {
    "leggi-la-nota": "answering && !finished && document.querySelector(`.answers button[data-note=\"${currentNote.name}\"]`)",
    "figure-ritmiche": "document.querySelector(`.answers button[data-key=\"${currentQuestion.key}\"]`)",
    "tastierapianoforte": "document.querySelector(`button.answer[data-note=\"${expectedAnswerForKeyId(currentKey, gameMode)}\"]`)",
    "acuto-o-grave": "answering && !finished && !isPlaying && document.querySelector(`.answers button[data-choice=\"${currentQuestion.correctChoice}\"]`)",
    "test-ingresso": """(() => { const k = GAME_ORDER[currentGameIndex];
        if (k==='acuto') return acutoAnswering && document.querySelector('.answers .answer.'+acutoQuestion.correctChoice);
        if (k==='tastiera') return tastieraAnswering && document.querySelector('.answers .answer.'+TASTIERA_CLASSES[tastieraCurrentKey]);
        if (k==='figure') return figureAnswering && answersBox.children[FIGURES.findIndex(f=>f.key===figureCurrentQuestion.key)];
        return leggiAnswering && document.querySelector('.answers .answer.'+LEGGI_NOTE_CLASSES[leggiCurrentNote.name]); })()""",
}

# segna il pulsante giusto (data-reel="giusta") e un vicino sbagliato (data-reel="sbagliata")
SEGNA_RISPOSTA = """(espr) => {
  document.querySelectorAll('[data-reel]').forEach(e => e.removeAttribute('data-reel'));
  let ok = null; try { ok = eval(espr); } catch (e) { return false; }
  if (!ok || ok.disabled) return false;
  ok.setAttribute('data-reel', 'giusta');
  const vicini = [...ok.parentElement.children].filter(e => e !== ok && e.tagName === ok.tagName && !e.disabled && e.getClientRects().length);
  if (vicini.length) vicini[0].setAttribute('data-reel', 'sbagliata');
  return true;
}"""


def bersaglio(pg, b):
    """'testo:Allenamento' -> il primo elemento con quel testo; altrimenti un selettore
    Playwright qualsiasi ('#startButton', 'a.ind[data-n=\"10\"]', '#brano-10 >> text=Colori e nomi')."""
    return pg.get_by_text(b[6:]).first if b.startswith("testo:") else pg.locator(b).first


async def esegui(pg, r, passi):
    """Esegue i passi di una clip. Ogni passo è un oggetto con UNA di queste chiavi:
      {"attendi": 1500}                        millisecondi
      {"tocca": "testo:Allenamento"}           tocco (o clic sulla LIM) con il cerchio bianco
      {"clic": "testo:Versione PC"}            clic senza cerchio (per i passi prima della registrazione)
      {"segna": "via"}                         momento notevole, usabile nella scaletta ("via+0.5")
      {"scorri": 300}                          scorre la pagina di tot pixel (anche negativi)
      {"scorri_risposte": ".answers"}          porta quel blocco al 74% dello schermo (sopra i comandi di Instagram)
      {"centra": "testo:Barocco"}              porta un elemento al centro dello schermo
      {"js": "currentGameIndex = 3"}           JavaScript nella pagina
      {"rispondi": "leggi-la-nota", "volte": 7, "pausa": 1150, "errori": [3], "segna": "nota"}
          risponde da solo (vedi RISPOSTE); "errori": quali risposte sbagliare (0 = la prima);
          "segna": prefisso per segnare ogni risposta (nota_0, nota_1...)
    """
    for passo in passi:
        if "rispondi" in passo:
            espr = RISPOSTE[passo["rispondi"]]
            for i in range(passo.get("volte", 5)):
                for _ in range(100):  # aspetta fino a 10 s che si possa rispondere
                    if await pg.evaluate(SEGNA_RISPOSTA, espr): break
                    await pg.wait_for_timeout(100)
                else:
                    print("  nessuna risposta possibile, mi fermo"); break
                quale = "sbagliata" if i in passo.get("errori", []) else "giusta"
                if r and passo.get("segna"): r.segna(f"{passo['segna']}_{i}")
                await tap(pg, pg.locator(f'[data-reel="{quale}"]'))
                await pg.wait_for_timeout(passo.get("pausa", 1200))
        elif "attendi" in passo: await pg.wait_for_timeout(passo["attendi"])
        elif "tocca" in passo: await tap(pg, bersaglio(pg, passo["tocca"]))
        elif "clic" in passo: await bersaglio(pg, passo["clic"]).click()
        elif "segna" in passo:
            if r: r.segna(passo["segna"])
        elif "scorri" in passo:
            await pg.evaluate(f"window.scrollBy({{top:{passo['scorri']},behavior:'smooth'}})")
        elif "scorri_risposte" in passo: await pg.evaluate(SCROLL, passo["scorri_risposte"])
        elif "centra" in passo:
            await bersaglio(pg, passo["centra"]).evaluate("e=>e.scrollIntoView({block:'center',behavior:'smooth'})")
        elif "js" in passo: await pg.evaluate(passo["js"])
        else:
            raise SystemExit(f"Passo sconosciuto: {passo}")


async def clip_a_passi(nome, d):
    """d: {"pagina": "leggi-la-nota.html", "dispositivo": "telefono" | "telefono-orizzontale" | "tablet" | "lim",
           "schermo": [1280, 800], "densita": 1.5   (solo per la LIM, facoltativi),
           "prima": [passi prima di registrare], "passi": [passi registrati],
           "audio": true   (registra anche il suono del gioco -> lavoro/clip/<clip>.wav)}"""
    async with async_playwright() as p:
        disp, au = d.get("dispositivo", "telefono"), d.get("audio", False)
        if disp == "lim":
            w, h = d.get("schermo", [1920, 1080])
            b, pg, (W, H) = await lim(p, d["pagina"], w, h, d.get("densita", 1), audio=au)
        elif disp == "tablet":
            b, pg, (W, H) = await tablet(p, d["pagina"], audio=au)
        else:
            b, pg, (W, H) = await telefono(p, d["pagina"], orizzontale=(disp == "telefono-orizzontale"), audio=au)
        await esegui(pg, None, d.get("prima", []))
        await pg.evaluate(TAP_JS)
        r = Rec(pg, nome, W, H); await r.start(); await pg.wait_for_timeout(400)
        await esegui(pg, r, d["passi"])
        tracce = await audio_gioco(pg, r) if au else None
        await r.stop(); await b.close()
        if au: scrivi_audio(r, tracce)


# ---------------- clip scritte come funzioni ----------------
# Reel "test-ingresso": il test passa da solo da un gioco all'altro, con le schermate
# di spiegazione in mezzo, quindi serve un ciclo che guardi cosa c'è sullo schermo.

# Bottone giusto e uno sbagliato del mini-gioco in corso (null se non si può rispondere).
TEST_RISPOSTA = """() => {
 const k = GAME_ORDER[currentGameIndex];
 let ok = null;
 if (k==='acuto') ok = acutoAnswering && document.querySelector('.answers .answer.'+acutoQuestion.correctChoice);
 else if (k==='tastiera') ok = tastieraAnswering && document.querySelector('.answers .answer.'+TASTIERA_CLASSES[tastieraCurrentKey]);
 else if (k==='figure') ok = figureAnswering && answersBox.children[FIGURES.findIndex(f=>f.key===figureCurrentQuestion.key)];
 else ok = leggiAnswering && document.querySelector('.answers .answer.'+LEGGI_NOTE_CLASSES[leggiCurrentNote.name]);
 if (!ok) return null;
 const tutti = [...answersBox.children], i = tutti.indexOf(ok);
 return {gioco: k, giusto: i + 1, sbagliato: (i + 1) % tutti.length + 1};
}"""
# qualche errore, perché la tabella finale sembri quella di un alunno vero
TEST_ERRORI = {"acuto": [6], "figure": [4, 11, 16], "leggiViolino": [8], "leggiBasso": [3, 7, 10]}


async def test_risposte(pg, r, pausa=900, scorri=True):
    """Risponde a tutto il test (le domande sono a caso), segnando i momenti per il montaggio."""
    contati = {}
    for _ in range(3000):
        if await pg.is_visible("#finalScreen"):
            r.segna("finale"); return
        if await pg.is_visible("#gameIntroStart"):
            k = await pg.evaluate("GAME_ORDER[currentGameIndex]")
            r.segna(k + "_intro"); await pg.wait_for_timeout(1100)
            await tap(pg, pg.locator("#gameIntroStart")); r.segna(k + "_via")
            await pg.wait_for_timeout(700)
            if scorri: await pg.evaluate(SCROLL, ".answers")
            await pg.wait_for_timeout(500); continue
        q = await pg.evaluate(TEST_RISPOSTA)
        if q:
            n = contati.get(q["gioco"], 0); contati[q["gioco"]] = n + 1
            quale = q["sbagliato"] if n in TEST_ERRORI.get(q["gioco"], []) else q["giusto"]
            r.segna(f"{q['gioco']}_{n}")
            await tap(pg, pg.locator(f".answers > .answer:nth-child({quale})"))
            await pg.wait_for_timeout(pausa)
        await pg.wait_for_timeout(120)


async def test():
    async with async_playwright() as p:
        b, pg, (W, H) = await telefono(p, "test-ingresso.html")
        r = Rec(pg, "test", W, H); await r.start(); await pg.wait_for_timeout(600)
        r.segna("home"); await pg.wait_for_timeout(1800)
        await tap(pg, pg.locator("#startButton")); r.segna("comincia"); await pg.wait_for_timeout(600)
        await test_risposte(pg, r)
        await pg.wait_for_timeout(4500)
        await r.stop(); await b.close()


def server():
    """Server locale sulla cartella del sito (lo chiude chi lo ha aperto)."""
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORTA)], cwd=SITO,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    return srv


def registra(nome, d):
    """Registra una clip descritta nel file del reel."""
    if "funzione" in d:
        asyncio.run(globals()[d["funzione"]]())
    else:
        asyncio.run(clip_a_passi(nome, d))


if __name__ == "__main__":
    if len(sys.argv) < 2: raise SystemExit(__doc__)
    reel = json.loads((BASE / "reels" / f"{sys.argv[1]}.json").read_text())
    CLIP.mkdir(parents=True, exist_ok=True)
    srv = server()
    try:
        for nome in (sys.argv[2:] or reel["clip"]):
            registra(nome, reel["clip"][nome])
    finally:
        srv.terminate()
