#!/usr/bin/env python3
"""Rigenera le immagini degli schemi in media/schemi/ (pagina schemi-strumenti.html):

  schema-accordi-chitarra.png, schema-accordi-ukulele.png, schema-accordi-tastiera.png
  schema-note-tastiera.png (note dal Do centrale al Mi del quarto spazio)

Le diteggiature degli accordi di chitarra e ukulele stanno in motore-schemi.js (ACCORDI):
per aggiungere un accordo si aggiunge lì e in ORDINE_ACCORDI / NOTE_ACCORDI qui sotto.

Uso (dalla cartella del repo):  python3 _sviluppo/schemi/genera_schemi.py
Richiede Playwright con Chromium.
"""
import json, pathlib
from playwright.sync_api import sync_playwright

REPO = pathlib.Path(__file__).resolve().parents[2]
USCITA = REPO / "media" / "schemi"

ORDINE_ACCORDI = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si", "Rem", "Mim", "Fam", "Lam", "Sim", "Re7", "Sol7", "La7"]
# note degli accordi sulla tastiera (dal Do centrale)
NOTE_ACCORDI = {
    "Do": ["c4", "e4", "g4"], "Re": ["d4", "f#4", "a4"], "Mi": ["e4", "g#4", "b4"], "Fa": ["f4", "a4", "c5"],
    "Sol": ["g4", "b4", "d5"], "La": ["a4", "c#5", "e5"], "Si": ["b4", "d#5", "f#5"],
    "Rem": ["d4", "f4", "a4"], "Mim": ["e4", "g4", "b4"], "Fam": ["f4", "ab4", "c5"], "Lam": ["a4", "c5", "e5"],
    "Sim": ["b4", "d5", "f#5"], "Re7": ["d4", "f#4", "a4", "c5"], "Sol7": ["g4", "b4", "d5", "f5"],
    "La7": ["a4", "c#5", "e5", "g5"],
}
# note dello schema della tastiera: nota scritta sul pentagramma + nome
NOTE_TASTIERA = [
    ("c4", "Do"), ("c#4", "Do♯/Re♭"), ("d4", "Re"), ("d#4", "Re♯/Mi♭"), ("e4", "Mi"), ("f4", "Fa"),
    ("f#4", "Fa♯/Sol♭"), ("g4", "Sol"), ("g#4", "Sol♯/La♭"), ("a4", "La"), ("a#4", "La♯/Si♭"), ("b4", "Si"),
    ("c5", "Do"), ("c#5", "Do♯/Re♭"), ("d5", "Re"), ("d#5", "Re♯/Mi♭"), ("e5", "Mi"),
]

LEGENDE = {
    "chitarra": ["○ corda a vuoto &nbsp;&nbsp;&nbsp; ✕ corda da non suonare",
                 "il numero nel pallino è il dito: 1 indice, 2 medio, 3 anulare, 4 mignolo",
                 "corde in numeri, da 1 (Mi cantino, in alto) a 6 (Mi basso) &nbsp;·&nbsp; tasti in numeri romani &nbsp;·&nbsp; capotasto a sinistra"],
    "ukulele": ["○ corda a vuoto",
                "il numero nel pallino è il dito: 1 indice, 2 medio, 3 anulare, 4 mignolo",
                "accordatura Sol-Do-Mi-La &nbsp;·&nbsp; corde in numeri, da 1 (La, in alto) a 4 (Sol) &nbsp;·&nbsp; tasti in numeri romani &nbsp;·&nbsp; capotasto a sinistra"],
    "tastiera": ["premi insieme i tasti colorati &nbsp;&nbsp;·&nbsp;&nbsp; la tastiera parte dal Do centrale"],
    "note-tastiera": ["i tasti neri sono i diesis e i bemolli: ogni tasto nero ha due nomi"],
}

PAGINA = """<!doctype html><html><head><meta charset="utf-8">
<script src="vexflow.js"></script><script src="motore-schemi.js"></script>
<style>
  body { margin: 0; background: #fff; font-family: 'DejaVu Sans', Verdana, sans-serif; }
  #foglio { display: inline-block; padding: 12px 12px 6px; background: #fff; }
  .griglia { display: grid; gap: 14px; }
  .carta { border: 1.6px solid #dfe5ee; border-radius: 14px; padding: 10px 14px 14px; text-align: center; background: #fff; }
  .nome { font-weight: 700; font-size: 34px; line-height: 1.05; paint-order: stroke; -webkit-text-stroke: 1.3px var(--bordo); color: var(--col); }
  .nome.lungo { font-size: 17px; line-height: 2.1; -webkit-text-stroke-width: 0.8px; }
  .rigo { margin: -38px 0 -8px;  }
  .sigla { color: #5f7089; font-size: 17px; margin: 2px 0 8px; }
  .schema { margin: 0 auto; }
  .legenda { color: #5f7089; font-size: 16px; line-height: 1.75; padding: 12px 6px 0; }
</style></head><body><div id="foglio"></div>
<script>
const MS = window.MotoreSchemi;
const scur = (hex, f) => { const n = parseInt(hex.slice(1), 16);
  return "#" + [16, 8, 0].map(s => Math.round(((n >> s) & 255) * f).toString(16).padStart(2, "0")).join(""); };
const midi = k => { const m = /^([a-g])(b|#)?(\\d)$/.exec(k);
  return 12 * (+m[3] + 1) + {c:0,d:2,e:4,f:5,g:7,a:9,b:11}[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0); };
/* tastiera con tasti accesi: bianchi = elenco di tasti bianchi, accesi = numeri midi */
function svgTasti(bianchi, accesi, col) {
  const lb = 20, hb = 100, ln = 12, hn = 63, bordo = scur(col, 0.62);
  let s = "";
  bianchi.forEach((k, i) => { const on = accesi.includes(midi(k));
    s += `<rect x="${i*lb}" y="0" width="${lb}" height="${hb}" fill="${on ? col : "#fff"}" stroke="${on ? bordo : "#8592a3"}" stroke-width="1.2"/>`; });
  bianchi.forEach((k, i) => { if (i === bianchi.length - 1 || /^[eb]/.test(k)) return;
    const on = accesi.includes(midi(k) + 1);
    s += `<rect x="${(i+1)*lb - ln/2}" y="0" width="${ln}" height="${hn}" fill="${on ? col : "#1d232b"}" stroke="${on ? bordo : "#1d232b"}" stroke-width="1"/>`; });
  s += `<rect x="0" y="0" width="${bianchi.length*lb}" height="${hb}" fill="none" stroke="#8592a3" stroke-width="1.6"/>`;
  return `<svg viewBox="-1 -1 ${bianchi.length*lb + 2} ${hb + 2}" style="display:block;width:100%;height:auto">${s}</svg>`;
}
function bianchiDa(da, a) { const L = "cdefgab", out = []; let l = L.indexOf(da[0]), o = +da[1];
  while (true) { const k = L[l] + o; out.push(k); if (k === a) return out; l++; if (l === 7) { l = 0; o++; } } }

function cartaAccordo(strumento, nome, noteTastiera) {
  const col = MS.COLORI[MS.LETTERA_ACCORDO[nome.replace(/m$|7$/, "")]];
  const d = document.createElement("div"); d.className = "carta";
  d.style.setProperty("--col", col); d.style.setProperty("--bordo", scur(col, 0.45));
  const schema = strumento === "tastiera"
    ? svgTasti(bianchiDa("c4", "g5"), noteTastiera.map(midi), col)
    : MS.svgAccordo(strumento, nome);
  const largh = { chitarra: "74%", ukulele: "82%", tastiera: "86%" }[strumento];
  d.innerHTML = `<div class="nome">${nome}</div><div class="sigla">${MS.SIGLE[nome]}</div><div class="schema" style="width:${largh}">${schema}</div>`;
  return d;
}
function cartaNota(chiave, nome) {
  const n = MS.analizza(chiave), col = MS.COLORI[n.lettera];
  const d = document.createElement("div"); d.className = "carta"; d.style.padding = "6px 10px 14px";
  d.style.setProperty("--col", col); d.style.setProperty("--bordo", scur(col, 0.45));
  d.innerHTML = `<div class="rigo"></div><div class="nome ${nome.length > 4 ? "lungo" : ""}" style="margin:2px 0 8px">${nome}</div>` +
    `<div class="schema" style="width:86%">${svgTasti(bianchiDa("c4", "e5"), [midi(chiave)], col)}</div>`;
  MS.rigoNota(d.querySelector(".rigo"), n);
  return d;
}
window.disegna = function (cosa, dati) {
  const foglio = document.getElementById("foglio"); foglio.innerHTML = "";
  const g = document.createElement("div"); g.className = "griglia";
  g.style.gridTemplateColumns = `repeat(${dati.colonne}, ${dati.larghCarta}px)`;
  if (cosa === "note-tastiera") dati.note.forEach(([k, nome]) => g.appendChild(cartaNota(k, nome)));
  else dati.ordine.forEach(nome => g.appendChild(cartaAccordo(cosa, nome, dati.noteAccordi[nome])));
  foglio.appendChild(g);
  const leg = document.createElement("div"); leg.className = "legenda"; leg.innerHTML = dati.legenda.join("<br>");
  foglio.appendChild(leg);
};
</script></body></html>"""


def main():
    pagina = REPO / "_genera_schemi_tmp.html"
    pagina.write_text(PAGINA, encoding="utf-8")
    try:
        with sync_playwright() as p:
            b = p.chromium.launch()
            pg = b.new_page(viewport={"width": 2400, "height": 1600}, device_scale_factor=3)
            errori = []
            pg.on("pageerror", lambda e: errori.append(str(e)))
            pg.goto(pagina.as_uri())
            lavori = [
                ("chitarra", {"colonne": 5, "larghCarta": 240}),
                ("ukulele", {"colonne": 5, "larghCarta": 240}),
                ("tastiera", {"colonne": 5, "larghCarta": 240}),
                ("note-tastiera", {"colonne": 6, "larghCarta": 200}),
            ]
            for cosa, dati in lavori:
                dati.update(ordine=ORDINE_ACCORDI, noteAccordi=NOTE_ACCORDI, note=NOTE_TASTIERA, legenda=LEGENDE[cosa])
                pg.evaluate("([c, d]) => disegna(c, d)", [cosa, dati])
                nome = "schema-note-tastiera.png" if cosa == "note-tastiera" else f"schema-accordi-{cosa}.png"
                pg.locator("#foglio").screenshot(path=str(USCITA / nome))
                print("scritto", nome)
            b.close()
            if errori:
                raise SystemExit("errori JavaScript: " + json.dumps(errori))
    finally:
        pagina.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
