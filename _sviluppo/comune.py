#!/usr/bin/env python3
"""
Sposta nel file comune.css le regole uguali in tutte le pagine (ottobre 2026).

Per ogni pagina: se il suo <style> contiene, a primo livello, una regola identica a quella
di comune.css (stesso selettore, stesse proprietà, spazi a parte), la toglie dalla pagina;
poi aggiunge <link rel="stylesheet" href="comune.css"> prima del primo <style>.
Le regole diverse restano nella pagina (vincono loro, perché vengono dopo).
Si può rilanciare: le pagine già collegate vengono saltate.
"""
import glob, os, re

SITO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LINK = '<link rel="stylesheet" href="comune.css">'
# pagine con una grafica tutta loro: non usano lo sfondo comune
ESCLUSE = {"costruttore-di-battute-originale.html", "crediti.html", "scarta-la-nota.html", "privacy.html", "rap-con-le-note.html",
           "rappa_le_note.html", "recita-le-note.html", "registro-musica-app.html"}


def regole(css):
    """regole di primo livello: (inizio, fine, selettore, corpo)"""
    out, i, depth, start, n = [], 0, 0, 0, len(css)
    while i < n:
        if css.startswith("/*", i):
            j = css.find("*/", i + 2); i = j + 2 if j >= 0 else n; continue
        c = css[i]
        if c == "{":
            if depth == 0: inizio_sel, graffa = start, i
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0: out.append((inizio_sel, i + 1, css[inizio_sel:graffa], css[graffa + 1:i])); start = i + 1
        elif depth == 0 and c == ";": start = i + 1
        i += 1
    return out


def norma_corpo(b, ignora=()):
    b = re.sub(r"/\*.*?\*/", "", b, flags=re.S)
    dich = []
    for x in b.split(";"):
        x = " ".join(x.split())
        if not x: continue
        x = re.sub(r"\s*([(),:/])\s*", r"\1", x)
        if x.split(":")[0] in ignora: continue
        dich.append(x)
    return tuple(sorted(dich))


norma_sel = lambda s: " ".join(re.sub(r"/\*.*?\*/", "", s, flags=re.S).split())


def sistema(nome, comuni):
    p = os.path.join(SITO, nome); s = open(p, encoding="utf8").read()
    if LINK in s: return None
    tolte = []
    def ripulisci(m):
        css = m.group(2)
        for a, z, sel, corpo in reversed(regole(css)):
            k = norma_sel(sel)
            if k not in comuni: continue
            # pointer-events sullo strato dietro a tutto (z-index -1) non cambia niente;
            # mix-blend-mode sulla trama va tolto comunque (risparmio energetico)
            ign = ("pointer-events",) if k == "body::after" else ("mix-blend-mode",) if k == "body::before" else ()
            if norma_corpo(corpo, ign) == norma_corpo(comuni[k], ign):
                # toglie anche il commento e la riga vuota subito prima, se sono suoi
                inizio = a
                prima = css[:a]; mc = re.search(r"\n[ \t]*/\*[^*]*(?:\*(?!/)[^*]*)*\*/[ \t]*\n?[ \t]*$", prima)
                if mc and "\n\n" not in mc.group(0): inizio = mc.start()
                css = css[:inizio] + css[z:]; tolte.append(k)
        return m.group(1) + css + m.group(3)
    s = re.sub(r"(<style[^>]*>)(.*?)(</style>)", ripulisci, s, flags=re.S)
    i = s.find("<style"); s = s[:i] + LINK + "\n" + s[i:]
    open(p, "w", encoding="utf8").write(s)
    return tolte


if __name__ == "__main__":
    comune = open(os.path.join(SITO, "comune.css"), encoding="utf8").read()
    comuni = {norma_sel(sel): corpo for a, z, sel, corpo in regole(comune) if norma_sel(sel) != ":root"}
    for f in sorted(glob.glob(os.path.join(SITO, "*.html"))):
        n = os.path.basename(f)
        if n in ESCLUSE: continue
        r = sistema(n, comuni)
        if r is not None: print(f"{n:36} tolte: {', '.join(sorted(r)) or '—'}")
