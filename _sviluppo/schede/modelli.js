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

/* ---- aggiunte: disegni semplici, collegamenti, cuori ---- */
(function (global) {
  "use strict";
  const S = global.Schede, M = global.Modelli, { el, img, MM } = S;
  const mm = v => v * MM;

  /* piccoli disegni in SVG per ciò che manca nelle illustrazioni */
  function disegno(nome, misura) {
    const c = S.col();
    const tinte = { metallo: c ? "#c9ced8" : "#fff", legno: c ? "#d9a066" : "#fff", pelle: c ? "#f3e1c0" : "#fff", rosso: c ? "#e25555" : "#fff", giallo: c ? "#f6c945" : "#fff" };
    const k = 'stroke="#222" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
    const svg = {
      triangolo: `<path d="M36 10 L60 58 H12 Z M36 10 L33 4" fill="none" ${k}/><path d="M44 30 L58 22" ${k}/><circle cx="60" cy="21" r="2.5" fill="#222"/>`,
      tamburello: `<circle cx="36" cy="36" r="24" fill="${tinte.pelle}" ${k}/><circle cx="36" cy="36" r="18" fill="none" ${k} stroke-dasharray="0.1 5"/>` +
        [0, 60, 120, 180, 240, 300].map(a => { const x = 36 + 24 * Math.cos(a * Math.PI / 180), y = 36 + 24 * Math.sin(a * Math.PI / 180); return `<rect x="${x - 4}" y="${y - 3}" width="8" height="6" rx="2" fill="${tinte.giallo}" ${k}/>`; }).join(""),
      legnetti: `<rect x="10" y="18" width="52" height="9" rx="4.5" fill="${tinte.legno}" ${k} transform="rotate(-18 36 22)"/><rect x="10" y="42" width="52" height="9" rx="4.5" fill="${tinte.legno}" ${k} transform="rotate(14 36 46)"/>`,
      guiro: `<rect x="8" y="22" width="56" height="26" rx="13" fill="${tinte.legno}" ${k}/>` + [18, 25, 32, 39, 46, 53].map(x => `<path d="M${x} 24 V46" ${k} stroke-width="1.6"/>`).join("") + `<path d="M20 64 L60 12" ${k}/>`,
      campanelli: `<path d="M14 40 H58" ${k}/><rect x="8" y="18" width="8" height="40" rx="3" fill="${tinte.legno}" ${k}/>` + [24, 36, 48].map(x => `<circle cx="${x}" cy="40" r="6" fill="${tinte.giallo}" ${k}/>`).join(""),
      battente: `<path d="M14 58 L50 22" ${k} stroke-width="4"/><circle cx="54" cy="18" r="8" fill="${tinte.rosso}" ${k}/>`,
      metallofono: `<rect x="6" y="40" width="60" height="6" fill="#999" ${k}/>` + [0, 1, 2, 3, 4, 5].map(i => `<rect x="${9 + i * 9.5}" y="${14 + i * 3}" width="7" height="${36 - i * 4}" rx="1.5" fill="${tinte.metallo}" ${k} stroke-width="1.8"/>`).join("")
    }[nome];
    const d = el("span", { class: "img", html: `<svg viewBox="0 0 72 72" width="100%" height="100%">${svg}</svg>` });
    d.style.width = misura + "mm"; d.style.height = misura + "mm";
    return d;
  }
  /* figura: illustrazione OpenMoji oppure disegno nostro */
  const NOSTRI = ["triangolo", "tamburello", "legnetti", "guiro", "campanelli", "battente", "metallofono"];
  function figura(nome, misura) { return NOSTRI.includes(nome) ? disegno(nome, misura) : img(nome, misura); }

  function cuoreVuoto(misura, pieno) {
    const d = el("span", { class: "img", html: `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 21s-7.5-4.7-9.6-9.3C.9 8.4 3 4.8 6.6 4.6c2.2-.1 4 1.2 5.4 3 1.4-1.8 3.2-3.1 5.4-3 3.6.2 5.7 3.8 4.2 7.1C19.5 16.3 12 21 12 21z" fill="${pieno ? (S.col() ? "#e0344b" : "#555") : "#fff"}" stroke="#333" stroke-width="1.3" stroke-linejoin="round"/></svg>` });
    d.style.width = misura + "mm"; d.style.height = misura + "mm";
    return d;
  }

  /* collega: due colonne di elementi; il bambino unisce i puntini (soluzione: le linee) */
  function collega(corpo, sinistra, destra, coppie, sol) {
    const box = el("div", { style: { position: "relative", display: "flex", justifyContent: "space-between", flex: 1 } });
    corpo.appendChild(box);
    const col = (lista, lato) => {
      const c = el("div", { style: { display: "flex", flexDirection: "column", justifyContent: "space-around" } });
      lista.forEach(x => {
        const r = el("div", { class: "riga", style: { gap: "3mm", flexDirection: lato === "sx" ? "row" : "row-reverse" } }, x,
          el("span", { class: "punto", style: { width: "4mm", height: "4mm", borderRadius: "50%", background: "#333", display: "inline-block" } }));
        c.appendChild(r);
      });
      box.appendChild(c); return c;
    };
    const cs = col(sinistra, "sx"), cd = col(destra, "dx");
    if (sol) {
      const B = box.getBoundingClientRect();
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("style", "position:absolute;inset:0;width:100%;height:100%;pointer-events:none");
      const ps = cs.querySelectorAll(".punto"), pd = cd.querySelectorAll(".punto");
      coppie.forEach(([i, j]) => {
        const a = ps[i].getBoundingClientRect(), b = pd[j].getBoundingClientRect();
        const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
        l.setAttribute("x1", a.left + a.width / 2 - B.left); l.setAttribute("y1", a.top + a.height / 2 - B.top);
        l.setAttribute("x2", b.left + b.width / 2 - B.left); l.setAttribute("y2", b.top + b.height / 2 - B.top);
        l.setAttribute("stroke", "#c00"); l.setAttribute("stroke-width", "2.5");
        svg.appendChild(l);
      });
      box.appendChild(svg);
    }
    return box;
  }

  /* scelta tra due (o più) immagini: in soluzione si cerchia quella giusta */
  function sceltaImmagini(nomi, giusta, sol, misura) {
    const c = el("div", { class: "riga", style: { gap: "2mm", justifyContent: "space-around" } });
    nomi.forEach(n => {
      const w = el("div", { style: { position: "relative", padding: "1.5mm" } }, figura(n, misura || 15));
      if (sol && n === giusta) w.appendChild(el("div", { style: { position: "absolute", inset: 0, border: ".7mm solid #c00", borderRadius: "50%" } }));
      c.appendChild(w);
    });
    return c;
  }

  /* griglia di schede di ascolto numerate (il docente suona, il bambino sceglie) */
  function ascoltoScelta(corpo, a, nomi, quante, colonne, testoDocente) {
    const seq = a.rnd.serie(nomi, quante);
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: `repeat(${colonne}, minmax(0, 1fr))`, gap: "4mm" } }); corpo.appendChild(g);
    seq.forEach((x, i) => {
      const c = el("div", { class: "riquadro riga", style: { justifyContent: "space-between", padding: "2mm 3mm" } },
        el("span", { style: { fontSize: "18pt", fontWeight: 600, color: "var(--inch)", width: "8mm" } }, String(i + 1)), sceltaImmagini(nomi, x, a.sol, 15));
      g.appendChild(c);
    });
    if (a.sol) corpo.appendChild(el("div", { class: "testo sol", style: { fontSize: "12pt" } }, "Sequenza: " + seq.map((x, i) => `${i + 1}) ${testoDocente[x]}`).join(" · ")));
    else M.consiglio(corpo, "Per l'insegnante: suona, batti o canta un esempio alla volta. Una sequenza già pronta è nel fascicolo delle soluzioni.", "gufo", { fontSize: "11pt" });
    return seq;
  }

  /* simboli della partitura non convenzionale */
  function simbolo(tipo, misura) {
    const k = 'stroke="#222" stroke-linecap="round" fill="none"';
    const s = {
      forte: `<circle cx="20" cy="20" r="11" fill="#222"/>`,
      piano: `<circle cx="20" cy="20" r="4" fill="#222"/>`,
      lungo: `<path d="M3 20 H37" ${k} stroke-width="4"/>`,
      sale: `<path d="M3 32 Q14 30 20 20 T37 6" ${k} stroke-width="3.5"/>`,
      scende: `<path d="M3 6 Q14 8 20 20 T37 32" ${k} stroke-width="3.5"/>`,
      silenzio: `<rect x="5" y="9" width="30" height="22" rx="4" ${k} stroke-width="1.5" stroke-dasharray="3 3"/>`,
      onda: `<path d="M3 20 q4.25 -10 8.5 0 t8.5 0 t8.5 0 t8.5 0" ${k} stroke-width="3"/>`
    }[tipo];
    const d = el("span", { class: "img", html: `<svg viewBox="0 0 40 40" width="100%" height="100%">${s}</svg>` });
    d.style.width = misura + "mm"; d.style.height = misura + "mm"; return d;
  }

  Object.assign(M, { disegno, figura, cuoreVuoto, collega, sceltaImmagini, ascoltoScelta, simbolo });
})(window);

/* ---- tastiera, dado da montare, stanghette e caselle nelle battute ---- */
(function (global) {
  "use strict";
  const S = global.Schede, M = global.Modelli, { el, COLORI, NOMI, nota } = S;

  /* tastiera disegnata: da/a (es. "c4","c5"); opz: larg (mm), alto (mm), nomi, colori, numeri {key: "1"}, segna [key] */
  function tastiera(cont, da, a, opz) {
    opz = Object.assign({ larg: 120, alto: 40, nomi: false, colori: false, numeri: {}, segna: [], neri: [] }, opz);
    const ORD = ["c", "d", "e", "f", "g", "a", "b"];
    const n0 = nota(da), n1 = nota(a);
    const bianchi = [];
    for (let o = n0.o; o <= n1.o; o++) ORD.forEach(l => { const k = l + o; const p = nota(k).passo; if (p >= n0.passo && p <= n1.passo) bianchi.push(k); });
    const W = opz.larg, H = opz.alto, w = W / bianchi.length;
    let s = "";
    bianchi.forEach((k, i) => {
      const l = k[0];
      const f = opz.colori && S.col() ? COLORI[l] : (opz.segna.includes(k) ? "#d1d5db" : "#fff");
      s += `<rect x="${i * w}" y="0" width="${w}" height="${H}" fill="${f}" stroke="#222" stroke-width="0.35"/>`;
      if (opz.nomi) s += `<text x="${i * w + w / 2}" y="${H - 3}" text-anchor="middle" font-family="Fredoka" font-size="${Math.min(5, w * 0.42)}" font-weight="600">${NOMI[l]}</text>`;
      if (opz.numeri[k]) s += `<text x="${i * w + w / 2}" y="${H - 5.6}" text-anchor="middle" font-family="Fredoka" font-size="5" font-weight="600" fill="#c00">${opz.numeri[k]}</text>`;
      if (opz.caselle) s += `<rect x="${i * w + w / 2 - 3.6}" y="${H - 11}" width="7.2" height="7.2" rx="1" fill="#fff" stroke="#888" stroke-width="0.3"/>`;
    });
    bianchi.forEach((k, i) => {
      if (i === bianchi.length - 1 || !["c", "d", "f", "g", "a"].includes(k[0])) return;
      const kn = k[0] + "#" + k.slice(1);
      s += `<rect x="${(i + 1) * w - w * 0.3}" y="0" width="${w * 0.6}" height="${H * 0.6}" fill="${opz.segna.includes(kn) ? "#888" : "#222"}" stroke="#222" stroke-width="0.3" rx="0.6"/>`;
    });
    const d = el("div", { html: `<svg viewBox="-0.5 -0.5 ${W + 1} ${H + 1}" style="width:${W}mm;height:${H}mm;display:block">${s}</svg>` });
    cont.appendChild(d); return { el: d, bianchi, w };
  }

  /* dado da ritagliare: sviluppo a croce; facce: 6 funzioni (div) */
  function dado(cont, lato, facce) {
    const L = lato;
    const pos = [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3]];
    const box = el("div", { style: { position: "relative", width: (3 * L + 16) + "mm", height: (4 * L) + "mm" } });
    const alette = el("div", { html: `<svg viewBox="0 0 ${3 * L + 16} ${4 * L}" style="position:absolute;inset:0;width:100%;height:100%">` +
      `<path d="M${8 + 0} ${L} l-6 4 v${L - 8} l6 4 M${8 + 3 * L} ${L} l6 4 v${L - 8} l-6 4 M${8} ${L} l4 -6 h${L - 8} l4 6 M${8 + 2 * L} ${L} l4 -6 h${L - 8} l4 6 M${8 + L} ${4 * L} l-6 -4 v${-L + 8} l6 -4 M${8 + 2 * L} ${4 * L} l6 -4 v${-L + 8} l-6 -4" fill="none" stroke="#999" stroke-width="0.35" stroke-dasharray="1.5 1"/></svg>` });
    box.appendChild(alette);
    pos.forEach(([cx, cy], i) => {
      const f = el("div", { style: { position: "absolute", left: (8 + cx * L) + "mm", top: (cy * L) + "mm", width: L + "mm", height: L + "mm",
        border: ".4mm solid #444", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" } });
      box.appendChild(f); facce[i](f);
    });
    cont.appendChild(box); return box;
  }

  /* figura ritmica isolata (senza pentagramma) */
  function figuraSola(cont, tipo, larg, spazio, stile) {
    const conRigo = tipo === "r1" || tipo === "r2";
    const P = S.pentagramma(cont, { larg: M.mm(larg), spazio: M.mm(spazio), linee: conRigo ? "grigie" : "nessuna", sopra: conRigo ? 1.2 : 3.6, sotto: conRigo ? 1.2 : 0.6 });
    const cx = P.W / 2;
    if (tipo === "88") S.coppiaCrome(P, cx - 9, cx + 9, 2, 2, stile);
    else if (["r4", "r2", "r1", "r8"].includes(tipo)) S.pausa(P, cx, tipo[1], stile === "traccia" ? S.GRIGIO_FANTASMA : null);
    else if (tipo === "2." || tipo === "4.") { S.figura(P, cx - 4, 2, tipo[0], stile, true); P.add("circle", { cx: cx + 6, cy: P.y(3), r: 1.6, fill: "#111" }); }
    else S.figura(P, cx - 3, 2, tipo, stile, true);
    return P;
  }

  Object.assign(M, { tastiera, dado, figuraSola });
})(window);

/* ---- brani del sito (motore-schemi.js) e carte del flauto ---- */
(function (global) {
  "use strict";
  const S = global.Schede, M = global.Modelli, { el, COLORI, NOMI } = S;
  const MS = () => global.MotoreSchemi;

  /* un brano della raccolta "Brani propedeutici" disegnato con il motore del sito */
  async function brano(cont, numero, opz) {
    opz = Object.assign({ interna: 560, colori: false, nomi: false, titolo: true, perRiga: 4, schema: false }, opz);
    const nn = String(numero).padStart(2, "0");
    const testo = await (await fetch(`../../media/brani-propedeutici/brano${nn}.musicxml`)).text();
    const b = MS().leggiMusicXML(testo);
    if (opz.battute) b.battute = b.battute.slice(0, opz.battute);
    if (opz.titolo) cont.appendChild(el("div", { style: { fontSize: "17pt", fontWeight: 600, textAlign: "center", color: "var(--inch)" } }, b.titoloBreve || b.titolo));
    const d = el("div", { class: "brano", style: { width: "100%" } }); cont.appendChild(d);
    MS().disegnaBrano(d, b, { strumento: "flauto", colori: opz.colori && S.col(), nomi: opz.nomi, larghezza: opz.interna, perRiga: opz.perRiga, titolo: false, testi: false, schema: opz.schema });
    const sc = d.querySelector(".schema-brano svg"); if (sc) sc.style.maxWidth = (opz.larghSchema || 60) + "mm";
    return b;
  }
  /* carta di una nota con la diteggiatura del flauto (tedesca), come nelle carte del sito */
  function cartaFlauto(cont, k, opz) {
    opz = opz || {};
    const n = MS().analizza(k);
    const c = el("div", { class: "riquadro", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1mm", padding: "2mm",
      borderColor: S.col() ? COLORI[n.lettera] : "#888", borderWidth: ".7mm" } });
    const rigo = el("div", { style: { width: (opz.larg || 40) + "mm" } }); c.appendChild(rigo);
    MS().rigoNota(rigo, n);
    const nome = NOMI[n.lettera] + (n.alt === "#" ? "♯" : n.alt === "b" ? "♭" : "") + (opz.acuto ? " acuto" : "");
    c.appendChild(el("div", { style: { fontSize: "20pt", fontWeight: 600, color: S.col() ? S.scuro(COLORI[n.lettera], n.lettera === "e" ? 0.75 : 0.95) : "#000" } }, nome));
    const sch = el("div", { style: { width: (opz.schema || 15) + "mm" }, html: MS().schemaNota("flauto", n) }); c.appendChild(sch);
    if (!S.col()) sch.querySelectorAll("[fill]").forEach(e => { const f = e.getAttribute("fill"); if (f && f !== "none" && f !== "#fff" && f !== "#ffffff" && f !== "white") e.setAttribute("fill", "#222"); });
    cont.appendChild(c); return c;
  }
  Object.assign(M, { brano, cartaFlauto });
})(window);
