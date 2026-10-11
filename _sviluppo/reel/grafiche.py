"""Disegna le schermate di un reel (testi colorati, etichette dei giochi, chiusura, copertina).

Di solito lo usa reel.py; da solo:
      python3 _sviluppo/reel/grafiche.py <reel>            (tutte)
      python3 _sviluppo/reel/grafiche.py <reel> card1 hook (solo alcune)

Le schermate sono nel file del reel (reels/<reel>.json, voce "schermate"):
nome, parametri (hash), durata, trasparenza. Le disegna grafiche/grafiche.html,
che usa i caratteri del sito. Le animazioni CSS vengono fermate e portate a ogni
istante, così i fotogrammi PNG (1080x1920, 30 al secondo) sono esatti.
Risultato in lavoro/<reel>/grafiche/<nome>/0000.png ...

Una schermata già disegnata con gli stessi parametri non si ridisegna
(file .firma nella sua cartella): cambiare un testo ridisegna solo quella.

Tipi (parametro t):
  card       sfondo pieno nel colore di una nota (c=do..si), righe l="riga1|riga2", sottotitolo s
  hook       apertura trasparente: a / g / b (di serie "Giochi musicali / GRATIS / per la tua classe");
             con n e f anche le bolle dei suoni (vedi sfida)
  sfida      giochi d'ascolto: bolle "1" e "2" che si accendono quando suonano i due suoni (n=istanti,
             es. n=0.4,2.3), poi la domanda q; tutto sparisce all'istante f (il tocco della risposta).
             Nel file del reel basta "suoni": {"clip", "da", "tocco"}: reel.py ricava n e f dall'audio registrato
             ("distanza": secondi fissi tra i due suoni, se nel gioco si sovrappongono: Acuto o grave 1.9)
             ("distanza": secondi fissi tra i due suoni, se nel gioco si sovrappongono: Acuto o grave 1.9)
  label      etichetta del gioco in alto (l, colore c) e frase sotto (s, all'altezza sy);
             fascia=1 (altezza fh) mette una fascia scura dietro, se sotto c'è già del testo
  bg         sfondo del sito con cornice: k=phone (arrotondata) o k=lim, rettangolo x,y,w,h
  end        chiusura: musicascuole.it, note colorate, frase, info@musicascuole.it
  copertina  titolo l="riga1|riga2", sottotitolo s, colore c, immagine img (fotogramma) in un telefono
             (r=0.6 ne mostra solo il 60% in alto, più grande);
             tutto dentro il riquadro centrale 1080x1440 che si vede nella griglia del profilo
"""
import asyncio, hashlib, json, sys
from pathlib import Path
from playwright.async_api import async_playwright

BASE = Path(__file__).resolve().parent
MODELLO = BASE / "grafiche" / "grafiche.html"
PAGINA = MODELLO.as_uri() + "#"


def firma(s):
    """Cambia se cambiano i parametri della schermata o il modello grafiche.html."""
    return hashlib.sha1((json.dumps(s, sort_keys=True) + MODELLO.read_text()).encode()).hexdigest()[:16]


async def disegna(pg, s, out, fps=30):
    cartella = out / s["name"]; cartella.mkdir(parents=True, exist_ok=True)
    f = cartella / ".firma"
    if f.exists() and f.read_text() == firma(s) and (cartella / "0000.png").exists():
        return False
    for x in cartella.glob("*.png"): x.unlink()
    await pg.goto("about:blank"); await pg.goto(PAGINA + s["hash"]); await pg.wait_for_timeout(400)
    await pg.evaluate("document.fonts.ready")
    await pg.evaluate("Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => i.onload = i.onerror = r)))")
    n = max(1, int(round(s["dur"] * fps)))
    for i in range(n):
        await pg.evaluate(f"document.getAnimations().forEach(a=>{{a.pause();a.currentTime={i*1000/fps}}})")
        await pg.screenshot(path=str(cartella / f"{i:04d}.png"), omit_background=s.get("alpha", False))
    f.write_text(firma(s))
    print(f"  {s['name']}: {n} fotogrammi")
    return True


async def disegna_tutte(schermate, out, scelte=()):
    out.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--allow-file-access-from-files"])
        pg = await b.new_page(viewport={"width": 1080, "height": 1920})
        rifatte = 0
        for s in schermate:
            if not scelte or s["name"] in scelte:
                rifatte += await disegna(pg, s, out)
        await b.close()
    print(f"  schermate: {rifatte} disegnate, {len(schermate) - rifatte} già pronte")


if __name__ == "__main__":
    if len(sys.argv) < 2: raise SystemExit(__doc__)
    reel = sys.argv[1]
    d = json.loads((BASE / "reels" / f"{reel}.json").read_text())
    asyncio.run(disegna_tutte(d["schermate"], BASE / "lavoro" / reel / "grafiche", sys.argv[2:]))
