#!/usr/bin/env python3
"""
Risparmio energetico per i telefoni (ottobre 2026).

Toglie dalle pagine gli effetti grafici che obbligano il telefono a ridisegnare
tutto lo schermo a ogni scorrimento:
  1. sfondo con "background-attachment: fixed"  -> diventa uno strato fisso a parte (body::after),
     che il telefono disegna una volta sola;
  2. "mix-blend-mode" sulla trama di puntini dello sfondo -> tolto (la trama è quasi invisibile);
  3. "backdrop-filter: blur()" su schede e barre che scorrono sopra lo sfondo -> tolto
     (sopra uno sfondo sfumato la sfocatura non si vede; le barre fisse diventano un po' più piene);
  4. animazioni decorative infinite (il badge che galleggia) -> si fermano dopo 3 giri.
Le finestre a comparsa (trofei, opzioni, popup) tengono la sfocatura: sono ferme, costano poco.

Lo script si può rilanciare: le pagine già sistemate vengono saltate.
Uso (dalla cartella del sito):  python3 _sviluppo/risparmio_energetico.py
"""
import glob, os, re, sys

SITO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEGNO = "/* ===== risparmio energetico (telefoni)"
ESCLUSE = {"costruttore-di-battute-originale.html"}   # vecchia versione, non collegata dal sito
# elementi che scorrono sopra lo sfondo: la sfocatura va ricalcolata a ogni fotogramma
SENZA_SFOCATURA = [".brano-card", ".level-box", ".setup-card", ".listen-panel", ".legend-panel", ".training-bar",
                   ".panel", ".final-card", ".tavolozza", ".footer-bar", ".note-popup-card"]
BARRE_FISSE = {".barra-fissa": "rgba(15, 23, 42, 0.97)", ".strumenti-bar": "rgba(15, 23, 42, 0.97)", ".casetta": "rgba(15, 23, 42, 0.92)"}
ANIMAZIONI = {"heroBadgeFloat": ".hero-badge", "heroFloat": ".hero-badge", "menuFloat": ".menu .menu-logo"}


def sistema(nome):
    p = os.path.join(SITO, nome); s = open(p, encoding="utf8").read()
    if SEGNO in s: return "già fatto"
    note, extra = [], []
    # 1. sfondo fisso
    m = re.search(r"background-attachment:\s*fixed;?", s)
    if m:
        a = s.rfind("{", 0, m.start()); z = s.find("}", m.end())
        sel = s[s.rfind("}", 0, a) + 1:a]; sel = re.sub(r"/\*.*?\*/", "", sel, flags=re.S).replace("<style>", "").strip()
        blocco = s[a:z]
        if sel == "body" and "body::after" not in s:
            bg = re.search(r"(\n\s*)background:\s*(.*?);", blocco, re.S)
            valore = bg.group(2).strip()
            base = (re.search(r"linear-gradient\([^#]*(#[0-9a-fA-F]{3,6})", valore) or re.search(r"(#[0-9a-fA-F]{6})", valore)).group(1)
            nuovo = blocco.replace(bg.group(0), f"{bg.group(1)}background: {base};", 1)
            nuovo = re.sub(r"\n?\s*background-attachment:\s*fixed;?", "", nuovo, count=1)
            s = s[:a] + nuovo + s[z:]
            extra.append("  /* lo sfondo sfumato sta su uno strato fisso a parte: il telefono lo disegna una volta sola */\n"
                         f"  body::after {{ content: \"\"; position: fixed; inset: 0; z-index: -1; pointer-events: none;\n    background: {valore}; }}")
            note.append("sfondo fisso")
        else:
            note.append(f"ATTENZIONE sfondo fisso non sistemato (selettore {sel!r})")
    # 2. fusione dei colori sulla trama
    n0 = len(s); s = re.sub(r"\n\s*mix-blend-mode:\s*overlay;", "", s, count=1)
    if len(s) != n0: note.append("trama senza fusione")
    # 3. sfocature
    tolte = [x for x in SENZA_SFOCATURA if re.search(re.escape(x) + r"\s*\{[^}]*backdrop-filter", s)]
    barre = [x for x in BARRE_FISSE if re.search(re.escape(x) + r"\s*\{[^}]*backdrop-filter", s)]
    if tolte: extra.append(f"  {', '.join(tolte)} {{ -webkit-backdrop-filter: none; backdrop-filter: none; }}")
    for b in barre: extra.append(f"  {b} {{ -webkit-backdrop-filter: none; backdrop-filter: none; background: {BARRE_FISSE[b]}; }}")
    if tolte or barre: note.append("sfocature: " + " ".join(tolte + barre))
    # 4. animazioni infinite decorative
    for anim, sel in ANIMAZIONI.items():
        if re.search(anim + r"\s[^;]*infinite", s):
            extra.append(f"  {sel} {{ animation-iteration-count: 3; }}   /* il badge galleggia per qualche secondo, poi sta fermo */"); note.append("animazione " + anim)
    if not extra: return "niente da fare"
    blocco = f"\n  {SEGNO}: vedi _sviluppo/risparmio_energetico.py ===== */\n" + "\n".join(extra) + "\n"
    i = s.find("</style>"); s = s[:i] + blocco + s[i:]
    open(p, "w", encoding="utf8").write(s)
    return ", ".join(note)


if __name__ == "__main__":
    for f in sorted(glob.glob(os.path.join(SITO, "*.html"))):
        n = os.path.basename(f)
        if n in ESCLUSE: continue
        r = sistema(n)
        if r != "niente da fare": print(f"{n:34} {r}")
