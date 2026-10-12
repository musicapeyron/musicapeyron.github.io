/* Modelli di scheda riutilizzabili (usati dai file classeN.js). */
(function (global) {
  "use strict";
  const S = global.Schede;
  const { el, img, MM, LARGHEZZA, COLORI, NOMI, nota } = S;
  const mm = v => v * MM;

  /* riquadro con un consiglio del gufo */
  function consiglio(corpo, html, icona, stile) {
    const d = el("div", { class: "riquadro riga", style: Object.assign({ fontSize: "13pt", lineHeight: "1.3", gap: "3mm" }, stile || {}) },
      img(icona || "gufo", 11), el("div", { html }));
    corpo.appendChild(d); return d;
  }
  function testo(corpo, html, stile) { const d = el("div", { class: "testo", html, style: stile || {} }); corpo.appendChild(d); return d; }
  function etichetta(html, stile) { return el("div", { class: "testo", html, style: Object.assign({ fontWeight: 500 }, stile || {}) }); }

  /* posizioni equidistanti sul pentagramma */
  function posti(P, n, inizio, fine) {
    const a = inizio == null ? 10 : inizio, b = (fine == null ? P.W : fine) - 4;
    const passo = (b - a) / n;
    return Array.from({ length: n }, (_, i) => a + passo * (i + 0.5));
  }

  /* legenda dei colori delle note */
  function legenda(corpo, lettere, opz) {
    const d = el("div", { class: "legenda" });
    lettere.forEach(l => {
      const p = el("span", { class: "pallino" });
      if (S.col()) { p.style.background = COLORI[l]; p.style.borderColor = S.scuro(COLORI[l], 0.6); }
      d.appendChild(el("span", { class: "voce" }, p, NOMI[l]));
    });
    if (!S.col()) d.appendChild(el("span", { class: "piccolo", style: { flexBasis: "100%", textAlign: "center" } }, "Scegli un pastello per ogni nota e colora il pallino."));
    corpo.appendChild(d); return d;
  }

  /* righe di note: per "scrivi il nome", "colora", "cerchia"…
     note: array di "g4"; opz: perRiga, spazio(mm), chiave, stile ("vuota"|"piena"|"bianca"), risposta ("linea"|"nessuna"), sol, colora */
  function righeNote(corpo, note, opz) {
    opz = Object.assign({ perRiga: 8, spazio: 7, chiave: "nera", stile: "bianca", risposta: "linea", sol: false, colora: false, sotto: 2.6, sopra: 2.2 }, opz);
    const righe = [];
    for (let i = 0; i < note.length; i += opz.perRiga) righe.push(note.slice(i, i + opz.perRiga));
    righe.forEach(r => {
      const blocco = el("div");
      corpo.appendChild(blocco);
      const P = S.pentagramma(blocco, { spazio: mm(opz.spazio), chiave: opz.chiave, sopra: opz.sopra, sotto: opz.sotto });
      const xs = posti(P, opz.perRiga, opz.chiave ? 36 : 6);
      r.forEach((s, k) => {
        const n = nota(s);
        const colore = opz.sol && opz.colora && opz.colora.includes(n.l) ? (S.col() ? COLORI[n.l] : "#555") : null;
        S.testa(P, xs[k], n.passo, colore ? "bianca" : opz.stile, colore || undefined);
        if (opz.cerchia && opz.sol && opz.cerchia.includes(s)) P.add("circle", { cx: xs[k], cy: P.y(n.passo), r: 10, fill: "none", stroke: "#c00", "stroke-width": 1.2 });
        if (opz.risposta === "linea") {
          const t = S.scritta(P, xs[k], P.yRigo(0) + 19, opz.sol ? n.nome : "", { width: mm(17) + "px" });
          t.className = "sopra linea-risposta";
        }
      });
      righe.P = P;
    });
  }

  /* pentagrammi con nomi sopra: il bambino disegna la nota (soluzione: le note) */
  function disegnaNote(corpo, note, opz) {
    opz = Object.assign({ perRiga: 6, spazio: 8, chiave: "nera", sol: false }, opz);
    for (let i = 0; i < note.length; i += opz.perRiga) {
      const r = note.slice(i, i + opz.perRiga);
      const blocco = el("div"); corpo.appendChild(blocco);
      const P = S.pentagramma(blocco, { spazio: mm(opz.spazio), chiave: opz.chiave, sopra: 3.2, sotto: 2 });
      const xs = posti(P, opz.perRiga, opz.chiave ? 36 : 6);
      r.forEach((s, k) => {
        const n = nota(s);
        const t = S.scritta(P, xs[k], P.yRigo(4) - 20, n.nome, { fontSize: "16pt", fontWeight: 600, color: S.col() ? "var(--inch)" : "#000" });
        if (opz.sol) S.testa(P, xs[k], n.passo, "bianca", S.col() ? COLORI[n.l] : "#888");
        if (k > 0) P.add("line", { x1: (xs[k] + xs[k - 1]) / 2, x2: (xs[k] + xs[k - 1]) / 2, y1: P.yRigo(4) - 26, y2: P.yRigo(4) - 14, stroke: "#c7cbd6", "stroke-width": 0.6 });
      });
    }
  }

  /* pagina di presentazione di una nota: dove abita + ripassa + scrivi */
  function presentaNota(corpo, l, o, frase, sol) {
    const n = nota(l + o);
    const box = el("div", { class: "riga", style: { gap: "6mm", alignItems: "center" } });
    corpo.appendChild(box);
    const sx = el("div", { style: { flex: "none" } }); box.appendChild(sx);
    const P = S.pentagramma(sx, { larg: mm(95), spazio: mm(10), chiave: "nera", sopra: 2.3, sotto: 2.3 });
    /* il rigo o lo spazio della nota, evidenziato */
    const evid = S.col() ? COLORI[n.l] : "#000";
    if (n.passo % 2 === 0 && n.passo >= 0 && n.passo <= 8) P.add("line", { x1: 30, x2: P.W - 2, y1: P.y(n.passo), y2: P.y(n.passo), stroke: evid, "stroke-width": 2.4, opacity: S.col() ? 0.85 : 0.6 });
    else if (n.passo > -2 && n.passo < 9) P.add("rect", { x: 30, y: P.y(n.passo + 1), width: P.W - 32, height: 10, fill: S.col() ? COLORI[n.l] : "#ddd", opacity: 0.35 });
    S.testa(P, 64, n.passo, S.col() ? "colore" : "piena", COLORI[n.l]);
    const dx = el("div", { style: { flex: 1 } }); box.appendChild(dx);
    dx.appendChild(el("div", { style: { fontSize: "44pt", fontWeight: 600, color: S.col() ? S.scuro(COLORI[n.l], n.l === "e" ? 0.75 : 0.9) : "#000", lineHeight: 1 } }, n.nome.toUpperCase()));
    dx.appendChild(el("div", { class: "testo", html: frase, style: { marginTop: "2mm" } }));
    /* ripassa */
    corpo.appendChild(etichetta("Ripassa le note tratteggiate:"));
    const b1 = el("div"); corpo.appendChild(b1);
    const P1 = S.pentagramma(b1, { spazio: mm(8), chiave: "nera", sopra: 1.8, sotto: 1.8 });
    posti(P1, 8, 36).forEach(x => S.testa(P1, x, n.passo, "traccia"));
    corpo.appendChild(etichetta(`Ora disegna tu tanti ${n.nome}:`));
    const b2 = el("div"); corpo.appendChild(b2);
    const P2 = S.pentagramma(b2, { spazio: mm(8), chiave: "nera", sopra: 1.8, sotto: 1.8 });
    posti(P2, 8, 36).forEach((x, i) => { if (sol || i === 0) S.testa(P2, x, n.passo, sol ? "piena" : "traccia"); else S.testa(P2, x, n.passo, "puntino"); });
  }

  /* righe ritmiche (una linea) con cuori opzionali */
  function righeRitmo(corpo, righe, opz) {
    opz = Object.assign({ spazio: 5.6, unaLinea: true, chiave: false, cuori: true, sopra: 3.4, sotto: 0, tempo: null, fine: true }, opz);
    if (!opz.unaLinea) { if (opz.sopra === 3.4) opz.sopra = opz.cuori ? 4.2 : 2.6; if (!opz.sotto) opz.sotto = 1.6; }
    righe.forEach((misure, i) => {
      const riga = el("div", { class: "riga", style: { gap: "2mm", alignItems: "center" } });
      if (opz.numeri !== false) riga.appendChild(el("div", { style: { fontSize: "14pt", fontWeight: 600, width: "7mm", color: "var(--inch)" } }, String(i + 1)));
      const b = el("div"); riga.appendChild(b); corpo.appendChild(riga);
      S.battute(b, Object.assign({}, opz, { larg: LARGHEZZA - mm(9), misure, spazio: mm(opz.spazio) }));
    });
  }

  /* griglia di carte ritagliabili */
  function carte(corpo, colonne, righe, riempi, opz) {
    opz = opz || {};
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: `repeat(${colonne}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${righe}, 1fr)`, flex: 1, gap: (opz.gap || 0) + "mm" } });
    corpo.classList.add("alto"); corpo.appendChild(g);
    for (let i = 0; i < colonne * righe; i++) {
      const c = el("div", { class: "carta" });
      if (!opz.senzaForbici && i === 0) c.appendChild(el("img", { class: "taglia", src: `img/${S.stato.modo}/forbici.svg` }));
      g.appendChild(c); riempi(c, i);
    }
    return g;
  }
  /* una nota su un piccolo pentagramma dentro una carta */
  function notaInCarta(c, s, larg, spazio, opz) {
    opz = opz || {};
    const n = nota(s);
    const P = S.pentagramma(c, { larg: mm(larg), spazio: mm(spazio), chiave: "nera", sopra: 2.2, sotto: 2.2 });
    S.testa(P, P.W * 0.66, n.passo, opz.colore && S.col() ? "colore" : "piena", opz.colore && S.col() ? COLORI[n.l] : undefined);
    return P;
  }

  function diploma(corpo, titolo, frase, icona) {
    corpo.classList.add("alto");
    const d = el("div", { style: { flex: 1, border: S.col() ? "2.5mm solid #f2c94c" : "1.5mm solid #000", borderRadius: "6mm", padding: "10mm",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-evenly", textAlign: "center", outline: "0.6mm solid var(--bordo)", outlineOffset: "-5mm" } });
    corpo.appendChild(d);
    d.append(img(icona || "coppa", 40),
      el("div", { style: { fontSize: "36pt", fontWeight: 700, color: "var(--inch)" } }, titolo),
      el("div", { class: "testo", style: { fontSize: "18pt" } }, "consegnato a"),
      el("div", { style: { width: "130mm", borderBottom: ".5mm solid #888", height: "14mm" } }),
      el("div", { class: "testo", style: { fontSize: "17pt", maxWidth: "150mm" }, html: frase }),
      el("div", { class: "riga", style: { justifyContent: "space-between", width: "150mm", fontSize: "13pt" } },
        el("span", null, "Data ________________"), el("span", null, "L'insegnante ________________")));
  }

  /* due colonne di caselle "R" / "S" ecc. */
  function caselle(etichette, scelta, sol) {
    const d = el("div", { class: "riga", style: { gap: "1.5mm", justifyContent: "center" } });
    etichette.forEach(t => {
      const b = el("div", { style: { width: "7.2mm", height: "7.2mm", border: ".4mm solid #888", borderRadius: "1.5mm", fontSize: "11pt",
        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, position: "relative" } }, t);
      if (sol && scelta === t) b.appendChild(el("div", { style: { position: "absolute", inset: "-1.6mm", border: ".6mm solid #c00", borderRadius: "50%" } }));
      d.appendChild(b);
    });
    return d;
  }

  global.Modelli = { consiglio, testo, etichetta, posti, legenda, righeNote, disegnaNote, presentaNota, righeRitmo, carte, notaInCarta, diploma, caselle, mm };
})(window);
