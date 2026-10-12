/* Schede della classe 3ª — Tutte le note da do a do, la battuta e il tempo */
(function () {
  "use strict";
  const S = Schede, M = Modelli, { el, img, nota, COLORI, NOMI } = S, mm = M.mm;
  const C = 3;
  const sch = (meta, f) => S.scheda(C, meta, f);
  const TUTTE = ["c4", "d4", "e4", "f4", "g4", "a4", "b4", "c5"];

  S.titoloClasse(C, {
    sottotitolo: "Tutte le note da do a do, il taglio addizionale, la battuta e il tempo: 2/4, 3/4, 4/4.",
    guida: "<b>Per l'insegnante.</b> In terza si completa la scala da do a do e si scopre la battuta. Le schede di ritmo usano una sola riga: " +
      "lo spazio tra le note è proporzionale alla durata, così si vede quanto dura ogni figura. Le soluzioni sono in un fascicolo a parte."
  });

  /* ritmi casuali in battute (token per S.battute) */
  const VAL = { q: 1, "88": 1, h: 2, w: 4, r: 1, "h.": 3, rh: 2 };
  const TOK = { q: "q:x", "88": "8:x 8:x", h: "h:x", w: "w:x", r: "q:r", "h.": "h.:x", rh: "h:r" };
  function battuta(rnd, battiti, figure) {
    let out, t;
    for (let k = 0; k < 50; k++) {
      out = []; t = 0;
      while (t < battiti) { const f = rnd.pick(figure.filter(x => VAL[x] <= battiti - t)); out.push(f); t += VAL[f]; }
      const pausa = out.filter(x => x === "r" || x === "rh").reduce((q, x) => q + VAL[x], 0);
      if (out.filter(x => x === "r" || x === "rh").length <= 1 && pausa * 2 < battiti && !(out.length === 1 && battiti > 2 && k < 30)) break;
    }
    return out;
  }
  const comeToken = figs => figs.map(f => TOK[f]).join(" ");

  /* ---------------- GRAFIA ---------------- */
  sch({ codice: "3G-01", titolo: "Il taglio addizionale: il do", consegna: "Il <b>do</b> sta sotto il pentagramma, tagliato da una piccola riga in più. Ripassa e poi disegna tu.", sol: true }, (corpo, a) => {
    M.consiglio(corpo, "Quando le note scendono sotto il pentagramma, si aggiunge un pezzettino di rigo: il <b>taglio addizionale</b>. È corto, solo per quella nota.", "gufo");
    const passo = nota("c4").passo;
    for (let r = 0; r < 4; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(6.5), chiave: "nera", sopra: 1.2, sotto: 2.4 });
      M.posti(P, 8, 36).forEach((x, i) => {
        if (r < 2 || i === 0) S.testa(P, x, passo, "traccia");
        else if (a.sol) S.testa(P, x, passo, "piena");
        else S.testa(P, x, passo, "puntino");
      });
    }
  });
  sch({ codice: "3G-02", titolo: "Il re appeso sotto il pentagramma", consegna: "Il <b>re</b> sta appeso sotto il 1° rigo, senza taglio. Ripassa, poi disegna do e re.", sol: true }, (corpo, a) => {
    const b0 = el("div", { class: "riga", style: { gap: "6mm" } }); corpo.appendChild(b0);
    const sx = el("div"); b0.appendChild(sx);
    const P0 = S.pentagramma(sx, { larg: mm(90), spazio: mm(9), chiave: "nera", sopra: 0.8, sotto: 2.8 });
    S.testa(P0, 50, nota("c4").passo, S.col() ? "colore" : "piena", COLORI.c); S.testa(P0, 72, nota("d4").passo, S.col() ? "colore" : "piena", COLORI.d);
    S.scritta(P0, 50, P0.y(-2) + 13, "do", { fontSize: "15pt", fontWeight: 600 }); S.scritta(P0, 72, P0.y(-1) + 13, "re", { fontSize: "15pt", fontWeight: 600 });
    b0.appendChild(el("div", { class: "testo", html: "Il <b>do</b> ha il taglio in mezzo alla testa.<br>Il <b>re</b> tocca il 1° rigo da sotto, come una goccia appesa." }));
    for (let r = 0; r < 3; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(7), chiave: "nera", sopra: 1.2, sotto: 2.4 });
      const seq = r === 0 ? ["d4", "d4", "d4", "d4", "c4", "d4", "c4", "d4"] : a.rnd.serie(["c4", "d4"], 8);
      M.posti(P, 8, 36).forEach((x, i) => {
        const n = nota(seq[i]);
        if (r === 0) S.testa(P, x, n.passo, "traccia");
        else {
          S.scritta(P, x, P.yRigo(4) - 8, n.nome, { fontSize: "13pt", fontWeight: 600 });
          if (a.sol) S.testa(P, x, n.passo, "piena");
        }
      });
    }
  });
  sch({ codice: "3G-03", titolo: "La semibreve", consegna: "La <b>semibreve</b> è una testa vuota, senza gambo. Ripassa, poi disegnala tu." }, (corpo) => {
    M.consiglio(corpo, "La semibreve è la figura più lunga: dura <b>4 battiti</b>. È un ovale vuoto e un po' più largo.", "gufo");
    for (let r = 0; r < 4; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(7.5), sopra: 1.2, sotto: 1.4 });
      const passi = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7];
      M.posti(P, 10, 6).forEach((x, i) => S.testa(P, x, passi[i], r < 2 || i < 2 ? "traccia" : "puntino"));
    }
  });
  sch({ codice: "3G-04", titolo: "Il cappello e il buco", consegna: "La pausa di <b>minima</b> è un cappello appoggiato sul 3° rigo. La pausa di <b>semibreve</b> è un buco appeso al 4° rigo. Ripassa e disegna." }, (corpo) => {
    const b0 = el("div", { class: "riga", style: { gap: "8mm", justifyContent: "center" } }); corpo.appendChild(b0);
    [["2", "pausa di minima: 2 battiti", "il cappello sta <b>sopra</b> il rigo"], ["1", "pausa di semibreve: 4 battiti", "il buco sta <b>sotto</b> il rigo"]].forEach(([t, nome, frase]) => {
      const c = el("div", { class: "riquadro centro" }); b0.appendChild(c);
      const P = S.pentagramma(c, { larg: mm(60), spazio: mm(10), sopra: 0.7, sotto: 0.7 });
      S.pausa(P, P.W / 2, t);
      c.appendChild(el("div", { class: "testo", html: `<b>${nome}</b><br>${frase}` }));
    });
    ["2", "1"].forEach(t => {
      for (let r = 0; r < 2; r++) {
        const b = el("div"); corpo.appendChild(b);
        const P = S.pentagramma(b, { spazio: mm(6.5), sopra: 1, sotto: 1 });
        M.posti(P, 10, 6).forEach((x, i) => { if (r === 0 || i < 2) S.pausa(P, x + 2, t, S.GRIGIO_FANTASMA); });
      }
    });
  });
  sch({ codice: "3G-05", titolo: "I numeri del tempo", consegna: "Ripassa le indicazioni di tempo, poi scrivile tu all'inizio dei pentagrammi." }, (corpo) => {
    M.consiglio(corpo, "Il numero <b>in alto</b> dice quanti battiti ci sono in ogni battuta. Il <b>4</b> in basso dice che il battito è una semiminima.", "gufo");
    ["2/4", "3/4", "4/4"].forEach(t => {
      for (let r = 0; r < 2; r++) {
        const b = el("div"); corpo.appendChild(b);
        const P = S.pentagramma(b, { spazio: mm(5), chiave: "nera", sopra: 1.2, sotto: 1.6 });
        const [n, d] = t.split("/");
        M.posti(P, 6, 30).forEach((x, i) => {
          if (r === 0 || i === 0) { S.glifo(P, x - 6, P.yRigo(3), "timeSig" + n, S.GRIGIO_FANTASMA); S.glifo(P, x - 6, P.yRigo(1), "timeSig" + d, S.GRIGIO_FANTASMA); }
        });
      }
    });
  });
  sch({ codice: "3G-06", titolo: "Il ritornello", consegna: "I due puntini del <b>ritornello</b> dicono: torna indietro e suona di nuovo! Ripassa i segni e disegnali tu." }, (corpo) => {
    const b0 = el("div"); corpo.appendChild(b0);
    S.battute(b0, { spazio: mm(6), misure: ["q:c4 q:d4 h:e4", "q:e4 q:d4 h:c4"], sopra: 2, sotto: 2.4, ritornello: true });
    const disegnaRit = (P, x, inizio, stile) => {
      const t = P.yRigo(4), bt = P.yRigo(0), c = stile === "traccia" ? S.GRIGIO_FANTASMA : "#111";
      const xs = inizio ? [x, x + 4, x + 8] : [x + 8, x + 4, x];
      P.add("rect", { x: xs[0] - 1.5, y: t, width: 3, height: bt - t, fill: c });
      P.add("line", { x1: xs[1], x2: xs[1], y1: t, y2: bt, stroke: c, "stroke-width": 1 });
      [P.yRigo(2) + 5, P.yRigo(2) - 5].forEach(y => P.add("circle", { cx: xs[2] + (inizio ? 1 : -1), cy: y, r: 1.6, fill: c }));
    };
    M.consiglio(corpo, "Il ritornello ha una stanghetta grossa, una sottile e <b>due puntini</b> negli spazi di mezzo. I puntini guardano verso la musica da ripetere.", "ripeti");
    for (let r = 0; r < 3; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(7.5), sopra: 1, sotto: 1 });
      [10, 50, 90, 130].forEach((x, i) => { if (r < 2 || i === 0) disegnaRit(P, x * P.W / 160, i % 2 === 0, "traccia"); });
    }
  });
  sch({ codice: "3G-07", titolo: "Ricopia la melodia", consegna: "Ricopia la melodia sul pentagramma vuoto, segno per segno. Chiave, tempo, note e stanghette!" }, (corpo, a) => {
    const melodie = [["q:c4 q:d4 q:e4 q:c4", "q:c4 q:d4 q:e4 q:c4", "q:e4 q:f4 h:g4", "q:e4 q:f4 h:g4"],
      ["q:g4 q:a4 q:g4 q:f4", "q:e4 q:d4 h:c4", "q:g4 q:a4 q:g4 q:f4", "q:e4 q:d4 h:c4"]];
    melodie.forEach(m => {
      const b = el("div"); corpo.appendChild(b);
      S.battute(b, { spazio: mm(5.4), tempo: "4/4", misure: m, sopra: 2.4, sotto: 2.6 });
      const v = el("div"); corpo.appendChild(v);
      S.pentagramma(v, { spazio: mm(5.4), sopra: 2.4, sotto: 2.6 });
    });
    M.consiglio(corpo, "Prima guarda bene una battuta, poi scrivila. Controlla i gambi: <b>su a destra</b>, <b>giù a sinistra</b>.", "occhi");
  });
  sch({ codice: "3G-08", titolo: "Trova l'errore", consegna: "In ogni riquadro c'è <b>un errore</b> di scrittura. Cerchialo e scrivi che cosa non va.", icona: "lente", sol: true }, (corpo, a) => {
    const casi = [
      ["Il gambo è dalla parte sbagliata", P => { S.testa(P, 40, 1, "piena"); S.gambo(P, 40, 1, true); S.testa(P, 70, 2, "piena"); P.add("line", { x1: 64.3, x2: 64.3, y1: P.y(2) - 1, y2: P.y(2) - 34, stroke: "#111", "stroke-width": 1.3 }); return [64, P.y(2) - 16]; }],
      ["Il gambo va in giù (la nota è sopra il 3° rigo)", P => { S.testa(P, 40, 2, "piena"); S.gambo(P, 40, 2, true); S.testa(P, 70, 7, "piena"); S.gambo(P, 70, 7, true); return [76, P.y(7) - 16]; }],
      ["Il do ha bisogno del taglio", P => { S.testa(P, 40, 0, "piena"); S.gambo(P, 40, 0, true); P.add("ellipse", { cx: 70, cy: P.y(-2), rx: 6.3, ry: 4.6, transform: `rotate(-22 70 ${P.y(-2)})`, fill: "#111" }); S.gambo(P, 70, -2, true); return [70, P.y(-2)]; }],
      ["La testa non sta né sul rigo né nello spazio", P => { S.testa(P, 40, 3, "piena"); S.gambo(P, 40, 3, true); P.add("ellipse", { cx: 70, cy: P.y(4) + 2.2, rx: 6.3, ry: 4.6, transform: `rotate(-22 70 ${P.y(4) + 2.2})`, fill: "#111" }); return [70, P.y(4) + 2]; }],
      ["Il gambo è troppo corto", P => { S.testa(P, 40, 1, "piena"); S.gambo(P, 40, 1, true); S.testa(P, 70, 1, "piena"); P.add("line", { x1: 75.75, x2: 75.75, y1: P.y(1) - 1, y2: P.y(1) - 14, stroke: "#111", "stroke-width": 1.3 }); return [76, P.y(1) - 8]; }],
      ["La minima ha la testa vuota", P => { S.figura(P, 40, 2, "2", "piena"); S.testa(P, 70, 3, "piena"); S.gambo(P, 70, 3, true); P.add("text", { x: 70, y: P.y(-3), "text-anchor": "middle", "font-size": 6, "font-family": "Fredoka" }).textContent = "(2 battiti)"; return [70, P.y(3)]; }]
    ];
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "5mm" } }); corpo.appendChild(g);
    casi.forEach(([spieg, f], i) => {
      const c = el("div", { class: "riquadro" }); g.appendChild(c);
      c.appendChild(el("div", { style: { fontWeight: 600, color: "var(--inch)" } }, String(i + 1)));
      const P = S.pentagramma(c, { larg: mm(80), spazio: mm(5), sopra: 3.6, sotto: 2.6 });
      const [cx, cy] = f(P);
      if (a.sol) P.add("circle", { cx, cy, r: 11, fill: "none", stroke: "#c00", "stroke-width": 1.2 });
      c.appendChild(el("div", { class: a.sol ? "sol" : "", style: { borderBottom: ".3mm solid #999", minHeight: "8mm", fontSize: "11pt" } }, a.sol ? spieg : ""));
    });
  });

  /* ---------------- NOTE ---------------- */
  sch({ codice: "3N-01", titolo: "Il do e il re", consegna: "Il <b>do</b> ha il taglio addizionale, il <b>re</b> sta appeso sotto il 1° rigo. Ripassa e poi scrivi.", sol: true }, (corpo, a) => {
    M.presentaNota(corpo, "c", 4, "Il <b>do</b> abita sotto il pentagramma, su un piccolo <b>taglio addizionale</b>. Subito sopra c'è il <b>re</b>, appeso al 1° rigo.", a.sol);
  });
  sch({ codice: "3N-02", titolo: "Il do acuto", consegna: "Il <b>do acuto</b> abita nel 3° spazio. Ripassa e poi disegnane altri.", sol: true }, (corpo, a) => {
    M.presentaNota(corpo, "c", 5, "Il <b>do acuto</b> abita nel <b>3° spazio</b>. Ha lo stesso nome del do sotto il pentagramma, ma suona più in alto.", a.sol);
  });
  sch({ codice: "3N-03", titolo: "La scalinata delle note", consegna: "Sali la scala: scrivi il nome su ogni gradino, poi disegna le note sul pentagramma.", icona: "matita", sol: true }, (corpo, a) => {
    const W = 180, H = 92, n = 8, sw = W / n;
    let s = "";
    TUTTE.forEach((k, i) => {
      const x = i * sw, y = H - (i + 1) * (H / n);
      const f = S.col() ? COLORI[k[0]] : "#fff";
      s += `<rect x="${x}" y="${y}" width="${sw}" height="${H - y}" fill="${f}" fill-opacity="${S.col() ? 0.35 : 1}" stroke="#333" stroke-width="0.4"/>`;
      s += `<rect x="${x + sw / 2 - 9}" y="${y + 2}" width="18" height="8" rx="1.5" fill="#fff" stroke="#888" stroke-width="0.3"/>`;
      if (a.sol) s += `<text x="${x + sw / 2}" y="${y + 8}" text-anchor="middle" font-family="Fredoka" font-size="6" font-weight="600" fill="#c00">${NOMI[k[0]]}</text>`;
    });

    corpo.appendChild(el("div", { html: `<svg viewBox="0 0 ${W} ${H}" style="width:${W}mm;height:${H}mm;display:block">${s}</svg>` }));
    const pi = el("div", { class: "riquadro tinta", style: { textAlign: "center" } }, el("span", { class: "testo" }, "Il primo gradino è il ", el("b", null, "do"), ". Poi re, mi… fino al do acuto!"));
    corpo.appendChild(pi);
    const b = el("div"); corpo.appendChild(b);
    const P = S.pentagramma(b, { spazio: mm(7), chiave: "nera", sopra: 1.2, sotto: 2.6 });
    M.posti(P, 8, 36).forEach((x, i) => { if (i === 0 || a.sol) S.testa(P, x, nota(TUTTE[i]).passo, i === 0 && !a.sol ? "traccia" : "piena"); });
  });
  sch({ codice: "3N-04", titolo: "Come si chiama?", consegna: "Scrivi il nome sotto ogni nota.", sol: true }, (corpo, a) => {
    M.righeNote(corpo, a.rnd.serie(TUTTE, 32), { perRiga: 8, spazio: 5.6, stile: "piena", sol: a.sol, sotto: 3.6, sopra: 1.2 });
  });
  sch({ codice: "3N-05", titolo: "Disegna la nota", consegna: "Leggi il nome e disegna la nota al posto giusto. Attento al do: quale dei due?", sol: true }, (corpo, a) => {
    const l = a.rnd.serie(TUTTE.slice(0, 7), 24).map(x => x);
    M.disegnaNote(corpo, l, { perRiga: 8, spazio: 5.8, sol: a.sol });
    M.consiglio(corpo, "In questa scheda il <b>do</b> è sempre quello sotto il pentagramma, con il taglio.", "gufo", { fontSize: "11.5pt" });
  });
  const PAROLE = [["f4", "d4"], ["d4", "e4"], ["c4", "b4"], ["f4", "b4"], ["b4", "d4"], ["e4", "d4"], ["g4", "c5"], ["g4", "f4"]];
  const PAROLA = k => k.map(x => nota(x).nome).join("").toUpperCase();
  sch({ codice: "3N-06", titolo: "Parole fatte di note", consegna: "Leggi le note e scopri la parola nascosta. Scrivila nelle caselle.", icona: "lente", sol: true }, (corpo, a) => {
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "5mm" } }); corpo.appendChild(g);
    PAROLE.forEach(p => {
      const c = el("div", { class: "riquadro", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "2mm" } }); g.appendChild(c);
      const P = S.pentagramma(c, { larg: mm(76), spazio: mm(4.2), chiave: "nera", sopra: 1.4, sotto: 2.4 });
      p.forEach((k, i) => S.testa(P, 55 + i * 30, nota(k).passo, "piena"));
      const w = PAROLA(p);
      const r = el("div", { class: "riga", style: { gap: "1mm" } });
      [...w].forEach(ch => r.appendChild(el("span", { class: "box-risposta", style: { minWidth: "8mm", width: "8mm", height: "9mm", lineHeight: "9mm" } }, a.sol ? ch : "")));
      c.appendChild(r);
    });
  });
  sch({ codice: "3N-07", titolo: "Scrivi le parole con le note", consegna: "Ogni parola è fatta di note. Disegnale sul pentagramma.", icona: "matita", sol: true }, (corpo, a) => {
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "5mm" } }); corpo.appendChild(g);
    a.rnd.mescola(PAROLE).forEach(p => {
      const c = el("div", { class: "riquadro", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1mm" } }); g.appendChild(c);
      c.appendChild(el("div", { style: { fontSize: "18pt", fontWeight: 600, letterSpacing: "1mm" } }, p.map(x => nota(x).nome.toUpperCase()).join(" - ")));
      const P = S.pentagramma(c, { larg: mm(76), spazio: mm(4.2), chiave: "nera", sopra: 1.4, sotto: 2.6 });
      if (a.sol) p.forEach((k, i) => S.testa(P, 55 + i * 30, nota(k).passo, "piena", "#c00"));
    });
  });
  sch({ codice: "3N-08", titolo: "Trova l'intruso", consegna: "In ogni riga tutte le note hanno lo stesso nome, tranne una: l'intruso! Cerchialo.", icona: "lente", sol: true }, (corpo, a) => {
    for (let r = 0; r < 5; r++) {
      const base = TUTTE[a.rnd.int(0, 7)];
      const intr = a.rnd.pick(TUTTE.filter(x => x[0] !== base[0]));
      const pos = a.rnd.int(1, 6);
      const seq = Array.from({ length: 7 }, (_, i) => i === pos ? intr : base);
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(5), chiave: "nera", sopra: 1.4, sotto: 2.6 });
      M.posti(P, 7, 36).forEach((x, i) => { S.testa(P, x, nota(seq[i]).passo, "piena"); if (a.sol && i === pos) P.add("circle", { cx: x, cy: P.y(nota(seq[i]).passo), r: 10, fill: "none", stroke: "#c00", "stroke-width": 1.4 }); });
    }
  });
  sch({ codice: "3N-09", titolo: "Le note gemelle", consegna: "Il do si trova in due posti: sotto (grave) e nel 3° spazio (acuto). Scrivi <b>G</b> sotto il do grave e <b>A</b> sotto il do acuto.", sol: true }, (corpo, a) => {
    const b0 = el("div", { class: "riga", style: { gap: "6mm" } }); corpo.appendChild(b0);
    const sx = el("div"); b0.appendChild(sx);
    const P0 = S.pentagramma(sx, { larg: mm(80), spazio: mm(6.5), chiave: "nera", sopra: 1, sotto: 2.6 });
    S.testa(P0, 50, -2, S.col() ? "colore" : "piena", COLORI.c); S.testa(P0, 78, 5, S.col() ? "colore" : "piena", COLORI.c);
    b0.appendChild(el("div", { class: "testo", html: "Due note con lo <b>stesso nome</b> e un salto grande tra loro: è l'<b>ottava</b>. Il do acuto suona come il do grave, ma più in alto." }));
    const seq = a.rnd.serie(["c4", "c5", "c4", "e4", "c5", "g4"], 24).map((x, i) => i % 3 === 1 ? x : (a.rnd.r() < 0.5 ? "c4" : "c5"));
    for (let r = 0; r < 3; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(5.4), chiave: "nera", sopra: 1.2, sotto: 4 });
      M.posti(P, 8, 36).forEach((x, i) => {
        const k = seq[r * 8 + i]; const n = nota(k);
        S.testa(P, x, n.passo, "piena");
        if (k[0] === "c") { const d = S.scritta(P, x, P.yRigo(0) + 28, a.sol ? (k === "c4" ? "G" : "A") : ""); d.className = "sopra box-risposta"; d.style.minWidth = mm(8) + "px"; d.style.height = mm(8) + "px"; d.style.lineHeight = mm(8) + "px"; }
      });
    }
  });
  sch({ codice: "3N-10", titolo: "Note e tasti", consegna: "Scrivi il numero di ogni nota sul tasto giusto della tastiera.", icona: "tastiera", sol: true }, (corpo, a) => {
    const seq = a.rnd.mescola(TUTTE);
    const b = el("div"); corpo.appendChild(b);
    const P = S.pentagramma(b, { spazio: mm(7), chiave: "nera", sopra: 3, sotto: 2.6 });
    M.posti(P, 8, 36).forEach((x, i) => { S.testa(P, x, nota(seq[i]).passo, "piena"); S.scritta(P, x, P.yRigo(4) - 14, String(i + 1), { fontSize: "15pt", fontWeight: 600, color: "var(--inch)" }); });
    const num = {}; seq.forEach((k, i) => num[k] = String(i + 1));
    const t = el("div", { style: { display: "flex", justifyContent: "center" } }); corpo.appendChild(t);
    M.tastiera(t, "c4", "c5", { larg: 170, alto: 62, caselle: true, numeri: a.sol ? num : {} });
    M.consiglio(corpo, "Il <b>do</b> è il tasto bianco a sinistra dei <b>due</b> tasti neri. Trovalo e poi conta: do, re, mi…", "gufo");
  });
  sch({ codice: "3N-11", titolo: "Il cruciverba delle note", consegna: "Leggi le note di ogni definizione e scrivi la parola nel cruciverba.", icona: "lente", sol: true }, (corpo, a) => {
    const voci = [["SOLFA", 0, 0, "o", ["g4", "f4"], "1"], ["SIRE", 0, 0, "v", ["b4", "d4"], "1"], ["FASI", 0, 3, "v", ["f4", "b4"], "2"],
      ["SOLDO", 2, 3, "o", ["g4", "c5"], "3"], ["DOSI", 2, 6, "v", ["c4", "b4"], "4"], ["REMI", 5, 3, "o", ["d4", "e4"], "5"]];
    const R = 6, Cc = 8, cella = 13;
    const griglia = {};
    voci.forEach(([w, r, c, d]) => [...w].forEach((ch, i) => { griglia[(d === "o" ? r : r + i) + "," + (d === "o" ? c + i : c)] = ch; }));
    let s = "";
    for (let r = 0; r < R; r++) for (let c = 0; c < Cc; c++) {
      const k = r + "," + c;
      if (!griglia[k]) continue;
      s += `<rect x="${c * cella}" y="${r * cella}" width="${cella}" height="${cella}" fill="#fff" stroke="#222" stroke-width="0.45"/>`;
      if (a.sol) s += `<text x="${c * cella + cella / 2}" y="${r * cella + cella * 0.72}" text-anchor="middle" font-family="Fredoka" font-size="7" font-weight="600" fill="#c00">${griglia[k]}</text>`;
    }
    const numerati = {}; voci.forEach(v => { numerati[v[1] + "," + v[2]] = v[5]; });
    Object.entries(numerati).forEach(([k, n]) => { const [r, c] = k.split(",").map(Number); s += `<text x="${c * cella + 1.2}" y="${r * cella + 3.8}" font-family="Fredoka" font-size="3.4" font-weight="600">${n}</text>`; });
    const riga = el("div", { class: "riga", style: { gap: "6mm", alignItems: "flex-start" } }); corpo.appendChild(riga);
    riga.appendChild(el("div", { html: `<svg viewBox="-1 -1 ${Cc * cella + 2} ${R * cella + 2}" style="width:${Cc * cella + 2}mm;height:${R * cella + 2}mm;display:block">${s}</svg>` }));
    const def = el("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: "2mm" } }); riga.appendChild(def);
    ["o", "v"].forEach(d => {
      def.appendChild(el("div", { style: { fontWeight: 600, color: "var(--inch)" } }, d === "o" ? "Orizzontali →" : "Verticali ↓"));
      voci.filter(v => v[3] === d).forEach(v => {
        const r = el("div", { class: "riga", style: { gap: "2mm" } }, el("b", { style: { width: "5mm" } }, v[5]));
        const box = el("div"); r.appendChild(box); def.appendChild(r);
        const P = S.pentagramma(box, { larg: mm(46), spazio: mm(3.6), chiave: "nera", sopra: 1.4, sotto: 2.4 });
        v[4].forEach((k, i) => S.testa(P, 50 + i * 26, nota(k).passo, "piena"));
      });
    });
  });

  /* ---------------- RITMO ---------------- */
  function stanghetteRighe(corpo, a, tempo, righe, figure) {
    const b = +tempo.split("/")[0];
    for (let r = 0; r < righe; r++) {
      const misure = Array.from({ length: b === 4 ? 3 : 4 }, () => battuta(a.rnd, b, figure));
      const tot = misure.length * b;
      const riga = el("div", { class: "riga", style: { gap: "2mm" } }, el("div", { style: { fontSize: "14pt", fontWeight: 600, width: "6mm", color: "var(--inch)" } }, String(r + 1)));
      const box = el("div"); riga.appendChild(box); corpo.appendChild(riga);
      const out = S.battute(box, { larg: S.LARGHEZZA - mm(9), spazio: mm(5.2), unaLinea: true, chiave: false, tempo, misure: [misure.map(comeToken).join(" ")], battitiMisura: tot, sopra: 2.2, sotto: 0 });
      if (a.sol) {
        const m = out.misure[0];
        for (let k = 1; k < misure.length; k++) {
          const x = m.x0 + (k * b / tot) * m.larg - 4;
          out.ctx.svg.appendChild(S.sv("line", { x1: x, x2: x, y1: out.yLinea - 12, y2: out.yLinea + 12, stroke: "#c00", "stroke-width": 1.4 }));
        }
      }
    }
  }
  sch({ codice: "3R-01", titolo: "Le stanghette in 2/4", consegna: "In 2/4 ogni battuta ha <b>2 battiti</b>. Conta e disegna le stanghette che mancano.", icona: "matita", sol: true }, (corpo, a) => {
    M.consiglio(corpo, "Conta i battiti: semiminima = 1, due crome = 1, minima = 2. Ogni 2 battiti, una stanghetta!", "gufo");
    stanghetteRighe(corpo, a, "2/4", 6, ["q", "q", "88", "h", "r"]);
  });
  sch({ codice: "3R-02", titolo: "Le stanghette in 3/4 e 4/4", consegna: "Guarda il numero in alto del tempo: quanti battiti per battuta? Disegna le stanghette.", icona: "matita", sol: true }, (corpo, a) => {
    corpo.appendChild(M.etichetta("Tempo 3/4: tre battiti per battuta"));
    stanghetteRighe(corpo, a, "3/4", 3, ["q", "q", "88", "h", "r"]);
    corpo.appendChild(M.etichetta("Tempo 4/4: quattro battiti per battuta"));
    stanghetteRighe(corpo, a, "4/4", 3, ["q", "88", "h", "r", "w"]);
  });
  sch({ codice: "3R-03", titolo: "Completa la battuta", consegna: "In ogni battuta manca una figura. Disegnala nella casella tratteggiata.", icona: "matita", sol: true }, (corpo, a) => {
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "4mm 5mm" } }); corpo.appendChild(g);
    ["2/4", "3/4", "4/4", "2/4", "3/4", "4/4", "4/4", "3/4", "2/4", "4/4"].forEach((tempo, i) => {
      const b = +tempo.split("/")[0];
      let figs; do { figs = battuta(a.rnd, b, ["q", "88", "h", "r", "w", "h."].filter(f => VAL[f] <= b)); } while (figs.length < 2 || figs.filter(f => f !== "88").length < 1);
      const cand = figs.map((f, j) => j).filter(j => figs[j] !== "88");
      const j = a.rnd.pick(cand);
      let idx = 0; figs.slice(0, j).forEach(f => idx += f === "88" ? 2 : 1);
      const c = el("div", { class: "riquadro", style: { padding: "1mm 2mm" } }); g.appendChild(c);
      const out = S.battute(c, { larg: mm(84), spazio: mm(4.6), unaLinea: true, chiave: false, tempo, misure: [comeToken(figs)], sopra: 2.4, sotto: 0, nascondi: [idx] });
      const q = out.note.find(n => n.sn._indice === idx);
      if (q) { const d = out.scritta(q.x, out.yLinea - 9, ""); Object.assign(d.style, { width: mm(10) + "px", height: mm(16) + "px", border: ".4mm dashed #888", borderRadius: "1.5mm" }); }
    });
  });
  sch({ codice: "3R-04", titolo: "Quanti battiti vale?", consegna: "Scrivi quanti battiti vale ogni figura e ogni pausa.", icona: "matita", sol: true }, (corpo, a) => {
    const voci = [["1", 4, "semibreve"], ["2", 2, "minima"], ["4", 1, "semiminima"], ["88", 1, "due crome"], ["r1", 4, "pausa di semibreve"], ["r2", 2, "pausa di minima"], ["r4", 1, "pausa di semiminima"], ["2.", 3, "minima col punto"]];
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "4mm" } }); corpo.appendChild(g);
    voci.forEach(([t, v, nome]) => {
      const c = el("div", { class: "riquadro riga", style: { gap: "3mm" } }); g.appendChild(c);
      const f = el("div"); c.appendChild(f); M.figuraSola(f, t, 26, t[0] === "r" ? 5.5 : 5.5, "piena");
      c.appendChild(el("div", { style: { flex: 1, fontSize: "13pt" } }, nome));
      c.appendChild(el("span", { class: "box-risposta", style: { minWidth: "12mm" } }, a.sol ? String(v) : ""));
    });
    M.consiglio(corpo, "La <b>pausa</b> vale quanto la sua figura: si conta, ma non si suona.", "silenzio");
  });
  sch({ codice: "3R-05", titolo: "L'albero delle figure", consegna: "Ogni figura si divide in due figure più corte. Ripassa i rami e colora ogni piano di un colore diverso.", icona: "albero" }, (corpo) => {
    const W = 150, HL = 44;
    const box = el("div", { style: { position: "relative", width: W + "mm", height: (HL * 4) + "mm", margin: "0 auto" } }); corpo.appendChild(box);
    const livelli = [[1, "1", "1 semibreve = 4 battiti"], [2, "2", "2 minime"], [4, "4", "4 semiminime"], [8, "8", "8 crome"]];
    let linee = "";
    livelli.forEach(([n, tipo, nome], k) => {
      const xs = Array.from({ length: n }, (_, i) => W * (i + 0.5) / n);
      xs.forEach((x, i) => {
        const f = el("div", { style: { position: "absolute", left: (x - 10) + "mm", top: (k * HL + 4) + "mm", width: "20mm" } });
        box.appendChild(f); M.figuraSola(f, tipo, 20, 5.2, "piena");
        if (k < 3) [2 * i, 2 * i + 1].forEach(j => { const x2 = W * (j + 0.5) / (2 * n); linee += `<path d="M${x} ${k * HL + 31} L${x2} ${(k + 1) * HL + 3}" stroke="#9aa0ad" stroke-width="0.5" stroke-dasharray="1.6 1.2" fill="none"/>`; });
      });
      box.appendChild(el("div", { style: { position: "absolute", left: (W + 3) + "mm", top: (k * HL + 14) + "mm", width: "32mm", fontSize: "11pt", fontWeight: 600, color: "var(--inch)" } }, nome));
    });
    box.insertAdjacentHTML("afterbegin", `<svg viewBox="0 0 ${W} ${HL * 4}" style="position:absolute;inset:0;width:100%;height:100%">${linee}</svg>`);
    box.style.marginLeft = "0";
  });
  sch({ codice: "3R-06", titolo: "Somme ritmiche", consegna: "Quanti battiti fanno in tutto? Scrivi il risultato.", icona: "matita", sol: true }, (corpo, a) => {
    const figs = [["2", 2], ["4", 1], ["88", 1], ["1", 4], ["r4", 1], ["r2", 2], ["2.", 3]];
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "4mm" } }); corpo.appendChild(g);
    for (let i = 0; i < 10; i++) {
      const n = i < 6 ? 2 : 3;
      const scelte = Array.from({ length: n }, () => a.rnd.pick(figs));
      const c = el("div", { class: "riquadro riga", style: { gap: "1mm", justifyContent: "center" } }); g.appendChild(c);
      scelte.forEach(([t], k) => { const f = el("div"); c.appendChild(f); M.figuraSola(f, t, 16, 4.2, "piena"); if (k < n - 1) c.appendChild(el("span", { style: { fontSize: "20pt", fontWeight: 600 } }, "+")); });
      c.appendChild(el("span", { style: { fontSize: "20pt", fontWeight: 600 } }, "="));
      c.appendChild(el("span", { class: "box-risposta", style: { minWidth: "11mm" } }, a.sol ? String(scelte.reduce((q, x) => q + x[1], 0)) : ""));
    }
  });
  sch({ codice: "3R-07", titolo: "Leggi e batti", consegna: "Leggi e batti tenendo il battito con il piede. Sulle pause apri le mani.", icona: "mani" }, (corpo, a) => {
    [["2/4", 2], ["3/4", 3], ["4/4", 4], ["4/4", 4], ["3/4", 3], ["2/4", 2]].forEach(([t, b], i) => {
      const misure = Array.from({ length: b === 4 ? 2 : b === 3 ? 3 : 4 }, () => comeToken(battuta(a.rnd, b, ["q", "q", "88", "88", "h", "r", "h.", "w"].filter(f => VAL[f] <= b))));
      const riga = el("div", { class: "riga", style: { gap: "2mm" } }, el("div", { style: { fontSize: "14pt", fontWeight: 600, width: "6mm", color: "var(--inch)" } }, String(i + 1)));
      const box = el("div"); riga.appendChild(box); corpo.appendChild(riga);
      S.battute(box, { larg: S.LARGHEZZA - mm(9), spazio: mm(4.4), unaLinea: true, chiave: false, tempo: t, misure, sopra: 2.2, sotto: 0, battitiMisura: b });
    });
  });

  /* ---------------- ASCOLTO ---------------- */
  sch({ codice: "3A-01", titolo: "Quale battuta ho suonato?", consegna: "Ascolta e fai una crocetta sulla battuta giusta: A, B o C.", icona: "orecchio", sol: true }, (corpo, a) => {
    const giuste = [];
    for (let gr = 0; gr < 3; gr++) {
      const box = el("div", { class: "riquadro", style: { padding: "1mm 3mm" } }); corpo.appendChild(box);
      box.appendChild(el("div", { style: { fontWeight: 600, color: "var(--inch)" } }, "Ascolto " + (gr + 1)));
      const giusta = a.rnd.int(0, 2); giuste.push("ABC"[giusta]);
      const usati = new Set();
      for (let k = 0; k < 3; k++) {
        let m; do { m = comeToken(battuta(a.rnd, 4, ["q", "88", "h", "r"])) + " | " + comeToken(battuta(a.rnd, 4, ["q", "88", "h"])); } while (usati.has(m)); usati.add(m);
        const riga = el("div", { class: "riga", style: { gap: "3mm" } }); box.appendChild(riga);
        riga.appendChild(M.caselle(["ABC"[k]], a.sol && k === giusta ? "ABC"[k] : null, a.sol));
        const b = el("div"); riga.appendChild(b);
        S.battute(b, { larg: mm(160), spazio: mm(3.6), unaLinea: true, chiave: false, tempo: "4/4", misure: m.split(" | "), sopra: 2.2, sotto: 0, battitiMisura: 4 });
      }
    }
    if (a.sol) corpo.appendChild(el("div", { class: "testo sol" }, "Da suonare: " + giuste.map((g, i) => `${i + 1}) ${g}`).join(" · ")));
  });
  sch({ codice: "3A-02", titolo: "Dettato con tre note", consegna: "L'insegnante suona una melodia con <b>do</b>, <b>re</b> e <b>mi</b>. Scrivi le note sui puntini.", icona: "orecchio", sol: true }, (corpo, a) => {
    for (let d = 0; d < 4; d++) {
      const seq = a.rnd.serie(["c4", "d4", "e4"], 6); seq[0] = "c4";
      corpo.appendChild(el("div", { class: "testo", style: { fontWeight: 500 } }, `Dettato ${d + 1}` + (a.sol ? " — " + seq.map(nomeN).join(" ") : "")));
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(6), chiave: "nera", sopra: 1, sotto: 2.4 });
      M.posti(P, 6, 36).forEach((x, i) => { if (i === 0 || a.sol) S.testa(P, x, nota(seq[i]).passo, "piena", a.sol && i ? "#c00" : undefined); else P.add("circle", { cx: x, cy: P.yRigo(0) + 22, r: 1.6, fill: "#6b7280" }); });
    }
    M.consiglio(corpo, "La prima nota è sempre il <b>do</b>. Ascolta se la melodia sale, scende o resta uguale.", "orecchio");
    function nomeN(k) { return nota(k).nome; }
  });

  /* ---------------- STRUMENTI ---------------- */
  sch({ codice: "3S-01", titolo: "Le famiglie dell'orchestra", consegna: "A quale famiglia appartiene? Fai una crocetta: <b>A</b> archi, <b>L</b> legni, <b>O</b> ottoni, <b>P</b> percussioni.", icona: "violino", sol: true }, (corpo, a) => {
    const fam = el("div", { class: "riquadro tinta", style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1mm 6mm", fontSize: "12pt" }, html:
      "<span><b>A · archi</b>: corde suonate con l'arco</span><span><b>L · legni</b>: si soffia (flauto, clarinetto…)</span><span><b>O · ottoni</b>: si soffia nel bocchino di metallo</span><span><b>P · percussioni</b>: si percuotono</span>" });
    corpo.appendChild(fam);
    const str = [["violino", "A", "violino"], ["tromba", "O", "tromba"], ["flauto", "L", "flauto"], ["tamburo", "P", "tamburo"], ["trombone", "O", "trombone"],
      ["sassofono", "L", "sassofono"], ["metallofono", "P", "metallofono"], ["campana", "P", "campane"], ["triangolo", "P", "triangolo"]];
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "4mm" } }); corpo.appendChild(g);
    str.forEach(([f, giusta, nome]) => g.appendChild(el("div", { class: "riquadro centro", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1mm" } },
      M.figura(f, 26), el("div", { class: "testo" }, nome), M.caselle(["A", "L", "O", "P"], giusta, a.sol))));
    M.consiglio(corpo, "Il sassofono è di metallo ma è un <b>legno</b>: suona con un'ancia di canna, come il clarinetto!", "lampadina", { fontSize: "11.5pt" });
  });
  sch({ codice: "3S-02", titolo: "Di che cosa è fatto?", consegna: "Lo strumento suona grazie al legno, al metallo o a una pelle tesa? Fai una crocetta.", icona: "lente", sol: true }, (corpo, a) => {
    const str = [["tamburo", "pelle"], ["triangolo", "metallo"], ["legnetti", "legno"], ["campana", "metallo"], ["guiro", "legno"], ["metallofono", "metallo"], ["tamburo-lungo", "pelle"], ["flauto", "legno"], ["campanelli", "metallo"]];
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "5mm" } }); corpo.appendChild(g);
    str.forEach(([f, giusta]) => {
      const cs = M.caselle(["legno", "metallo", "pelle"], giusta, a.sol);
      cs.querySelectorAll(":scope > div").forEach(d => { d.style.width = "15mm"; d.style.fontSize = "10pt"; });
      g.appendChild(el("div", { class: "riquadro centro", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "2mm" } }, M.figura(f, 30), cs));
    });
  });

  /* ---------------- CREATIVITÀ ---------------- */
  sch({ codice: "3C-01", titolo: "Inventa il tuo ritmo", consegna: "Scrivi un ritmo in 4/4 usando le figure che conosci. Poi battilo con un compagno.", icona: "lampadina" }, (corpo) => {
    const pal = el("div", { class: "riquadro tinta riga", style: { justifyContent: "space-around" } });
    [["4", "1"], ["88", "1"], ["2", "2"], ["1", "4"], ["r4", "1"], ["r2", "2"]].forEach(([t, v]) => { const c = el("div", { class: "centro" }); const f = el("div"); c.appendChild(f); M.figuraSola(f, t, 18, 4, "piena"); c.appendChild(el("div", { class: "piccolo" }, v + (v === "1" ? " battito" : " battiti"))); pal.appendChild(c); });
    corpo.appendChild(pal);
    for (let r = 0; r < 4; r++) {
      const b = el("div"); corpo.appendChild(b);
      S.battute(b, { spazio: mm(5.6), unaLinea: true, chiave: false, tempo: "4/4", misure: ["", "", "", ""], sopra: 3, sotto: 0, fine: r === 3 });
    }
    M.consiglio(corpo, "Controlla: in ogni battuta devono esserci <b>4 battiti</b>, né uno di più né uno di meno.", "gufo");
  });
  sch({ codice: "3C-02", titolo: "Componi con tre note", consegna: "Usa il ritmo che vedi e scegli tu le note: <b>do</b>, <b>re</b> o <b>mi</b>. Poi suona la tua melodia.", icona: "lampadina" }, (corpo, a) => {
    for (let k = 0; k < 3; k++) {
      const figs = [battuta(a.rnd, 4, ["q", "q", "h"]), battuta(a.rnd, 4, ["q", "h"]), battuta(a.rnd, 4, ["q", "q", "h"]), ["w"]];
      corpo.appendChild(el("div", { class: "testo", style: { fontWeight: 500 } }, `Melodia ${k + 1}`));
      const r = el("div"); corpo.appendChild(r);
      const out = S.battute(r, { spazio: mm(4), unaLinea: true, chiave: false, tempo: "4/4", misure: figs.map(comeToken), sopra: 2.4, sotto: 0, battitiMisura: 4, stile: "grigio" });
      const b = el("div"); corpo.appendChild(b);
      S.battute(b, { spazio: mm(5.6), tempo: "4/4", misure: ["", "", "", ""], sopra: 1.2, sotto: 2.6 });
    }
  });

  /* ---------------- RITAGLIA E GIOCA ---------------- */
  sch({ codice: "3X-01", titolo: "Tombola delle note", consegna: "Ritaglia le cartelle. L'insegnante dice il nome di una nota: se c'è, coprila con un tappo!", icona: "forbici" }, (corpo, a) => {
    M.carte(corpo, 2, 2, (c, i) => {
      const r = S.caso("3X-01-" + i);
      const scelte = r.mescola(TUTTE.concat(TUTTE.slice(1, 7))).slice(0, 6);
      const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5mm", width: "90%" } });
      scelte.forEach(k => { const cc = el("div", { style: { border: ".3mm solid var(--bordo)", borderRadius: "2mm", display: "flex", justifyContent: "center", padding: "0.5mm" } }); g.appendChild(cc); M.notaInCarta(cc, k, 38, 3.4); });
      c.appendChild(g);
    }, { gap: 3 });
  });
  sch({ codice: "3X-02", titolo: "Memory: nota e nome", consegna: "Ritaglia le carte e gioca a memory: trova la nota e il suo nome.", icona: "forbici" }, (corpo) => {
    const scelte = ["c4", "d4", "b4", "c5", "f4", "a4"];
    const lista = []; scelte.forEach(s => { lista.push(["nota", s]); lista.push(["nome", s]); });
    M.carte(corpo, 3, 4, (c, i) => {
      const [t, s] = lista[i];
      if (t === "nota") M.notaInCarta(c, s, 52, 5);
      else c.appendChild(el("div", { style: { fontSize: "34pt", fontWeight: 600 } }, nota(s).nome + (s === "c5" ? " acuto" : "")));
      if (t === "nome" && s === "c5") c.lastChild.style.fontSize = "22pt";
    });
  });
  sch({ codice: "3X-03", titolo: "I dadi del ritmo", consegna: "Ritaglia, piega sulle righe e incolla le alette. Tira i due dadi e batti il ritmo che esce!", icona: "dado" }, (corpo) => {
    const facce = [["4", "88", "2", "r4", "4", "88"], ["88", "4", "1", "88", "r2", "4"]];
    const r = el("div", { class: "riga", style: { justifyContent: "space-around", alignItems: "flex-start" } }); corpo.appendChild(r);
    facce.forEach(ff => {
      const box = el("div"); r.appendChild(box);
      M.dado(box, 27, ff.map(t => f => M.figuraSola(f, t, 24, 4.4, "piena")));
    });
  });

  /* ---------------- VERIFICA ---------------- */
  sch({ codice: "3V-01", titolo: "Che cosa ho imparato", consegna: "Fai tutti gli esercizi con calma. Alla fine colora la stella!", icona: "stella", sol: true }, (corpo, a) => {
    corpo.classList.add("alto");
    corpo.appendChild(M.etichetta("1. Scrivi il nome delle note."));
    M.righeNote(corpo, ["c4", "e4", "g4", "c5", "d4", "a4", "f4", "b4"], { perRiga: 8, spazio: 5, stile: "piena", sol: a.sol, sotto: 3.4, sopra: 1.2 });
    corpo.appendChild(M.etichetta("2. Disegna le note."));
    M.disegnaNote(corpo, ["d4", "g4", "c5", "e4", "a4", "c4", "f4", "b4"], { perRiga: 8, spazio: 5, sol: a.sol });
    corpo.appendChild(M.etichetta("3. Disegna le stanghette (tempo 3/4)."));
    stanghetteRighe(corpo, a, "3/4", 1, ["q", "88", "h"]);
    corpo.appendChild(M.etichetta("4. Quanti battiti?"));
    const r = el("div", { class: "riga", style: { justifyContent: "space-around" } }); corpo.appendChild(r);
    [["1", 4], ["2.", 3], ["r2", 2], ["88", 1]].forEach(([t, v]) => {
      const c = el("div", { class: "riquadro riga", style: { gap: "2mm" } }); r.appendChild(c);
      const f = el("div"); c.appendChild(f); M.figuraSola(f, t, 20, 4.4, "piena");
      c.appendChild(el("span", { class: "box-risposta", style: { minWidth: "11mm" } }, a.sol ? String(v) : ""));
    });
  });
  sch({ codice: "3V-02", titolo: "Diploma \"Lettore di note\"", consegna: false }, (corpo) => {
    M.diploma(corpo, "Lettore di note", "perché legge tutte le note <b>da do a do</b>, conosce la battuta e il tempo e scrive la musica con cura.", "libro");
  });
})();
