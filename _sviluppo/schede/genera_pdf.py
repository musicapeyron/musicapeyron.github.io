"""Genera i PDF delle schede per la primaria (A4), uno per classe e per versione.

Uso:   python3 _sviluppo/schede/genera_pdf.py            tutte le classi
       python3 _sviluppo/schede/genera_pdf.py 2 3        solo alcune classi
Escono in _sviluppo/schede/pdf/:  classe-2-colori.pdf, classe-2-bianco-e-nero.pdf, classe-2-soluzioni.pdf
Serve Playwright con Chromium (già installato nell'ambiente di lavoro).
"""
import sys, pathlib, threading, functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

QUI = pathlib.Path(__file__).resolve().parent
USCITA = QUI / "pdf"
VERSIONI = [("col", "0", "colori"), ("bn", "0", "bianco-e-nero"), ("col", "1", "soluzioni")]


class Silenzioso(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def server():
    """Serve la cartella del sito in locale: le schede leggono i brani (MusicXML) del sito."""
    radice = QUI.parent.parent
    srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Silenzioso, directory=str(radice)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}/_sviluppo/schede/schede.html"


def genera(classi):
    USCITA.mkdir(exist_ok=True)
    srv, indirizzo = server()
    with sync_playwright() as p:
        b = p.chromium.launch()
        for c in classi:
            for modo, sol, nome in VERSIONI:
                pg = b.new_page()
                errori = []
                pg.on("pageerror", lambda e: errori.append(str(e)))
                pg.on("console", lambda m: errori.append(m.text) if m.type == "error" else None)
                pg.goto(indirizzo + f"?classe={c}&modo={modo}&sol={sol}")
                pg.wait_for_function("window.PRONTO === true", timeout=120000)
                pg.wait_for_timeout(500)
                n = pg.evaluate("document.querySelectorAll('.pagina').length")
                adattate = pg.evaluate("Schede.stato.adattate")
                f = USCITA / f"classe-{c}-{nome}.pdf"
                pg.pdf(path=str(f), format="A4", print_background=True, prefer_css_page_size=True)
                print(f"{f.name}: {n} pagine" + (f" · rimpicciolite: {', '.join(adattate)}" if adattate else ""))
                for e in errori:
                    print("   ERRORE:", e)
                pg.close()
        b.close()


if __name__ == "__main__":
    genera([int(x) for x in sys.argv[1:]] or [1, 2, 3, 4, 5])
