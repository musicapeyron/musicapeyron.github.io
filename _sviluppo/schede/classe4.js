/* Schede della classe 4ª — Segni nuovi, alterazioni e primo strumento */
(function () {
  "use strict";
  const S = Schede, M = Modelli, { el, img, nota, COLORI, NOMI } = S, mm = M.mm;
  const C = 4;
  const sch = (meta, f) => S.scheda(C, meta, f);
  const ESTESA = ["c4", "d4", "e4", "f4", "g4", "a4", "b4", "c5", "d5", "e5", "f5", "g5"];

  S.titoloClasse(C, {
    sottotitolo: "Segni nuovi e primo strumento: croma, punto, legatura, diesis e bemolle, dinamiche, note acute e flauto dolce.",
    guida: "<b>Per l'insegnante.</b> In quarta arrivano i segni che servono per suonare davvero. Le schede di strumento usano i <b>Brani propedeutici</b> " +
      "di musicascuole.it (con basi audio sul sito) e la diteggiatura tedesca del flauto dolce."
  });

  const VAL = { q: 1, "88": 1, h: 2, w: 4, r: 1, "h.": 3, "8r": 1, "r8": 1, "q.8": 2 };
  const TOK = { q: "q:x", "88": "8:x 8:x", h: "h:x", w: "w:x", r: "q:r", "h.": "h.:x", "8r": "8:x 8:r", "r8": "8:r 8:x", "q.8": "q.:x 8:x" };
  function battuta(rnd, battiti, figure) {
    let out = [];
    for (let k = 0; k < 60; k++) {
      out = []; let t = 0;
      while (t < battiti) { const f = rnd.pick(figure.filter(x => VAL[x] <= battiti - t)); out.push(f); t += VAL[f]; }
      if (out.filter(x => x === "r").length <= 1 && out.length > 1) break;
    }
    return out;
  }
  const comeToken = f => f.map(x => TOK[x]).join(" ");
  const riquadroNum = (i) => el("div", { style: { fontSize: "14pt", fontWeight: 600, width: "6mm", color: "var(--inch)" } }, String(i));

  /* ---------------- GRAFIA ---------------- */
  sch({ codice: "4G-01", titolo: "La croma da sola", consegna: "Quando è da sola, la croma ha la <b>coda</b>. Ripassa le crome e poi disegnale tu." }, (corpo) => {
    M.consiglio(corpo, "La coda (la bandierina) va <b>sempre a destra</b> del gambo, sia che il gambo vada su, sia che vada giù.", "gufo");
    for (let r = 0; r < 4; r++) {
      const su = r % 2 === 0;
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(5.8), sopra: su ? 3.8 : 1, sotto: su ? 1 : 3.8 });
      const passi = su ? [0, 1, 2, 3, 2, 1, 0, 1, 2, 3] : [5, 6, 7, 8, 7, 6, 5, 6, 7, 8];
      M.posti(P, 10, 6).forEach((x, i) => { if (r < 2 || i < 2) S.figura(P, x, passi[i], "8", "traccia", su); else S.testa(P, x, passi[i], "puntino"); });
    }
  });
  sch({ codice: "4G-02", titolo: "La pausa di croma", consegna: "La pausa di croma è un <b>puntino con un ricciolo</b> che scende. Ripassa e poi disegna." }, (corpo) => {
    const b0 = el("div", { class: "riga", style: { gap: "8mm", justifyContent: "center" } }); corpo.appendChild(b0);
    const c = el("div", { class: "riquadro centro" }); b0.appendChild(c);
    const P0 = S.pentagramma(c, { larg: mm(50), spazio: mm(11), sopra: 0.6, sotto: 0.6 }); S.pausa(P0, P0.W / 2, "8");
    b0.appendChild(el("div", { class: "testo", html: "Vale <b>mezzo battito</b> di silenzio,<br>come una croma senza suono.<br>Spesso sta vicino a una croma: <b>ti-sst</b>." }));
    for (let r = 0; r < 4; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(7), sopra: 0.8, sotto: 0.8 });
      M.posti(P, 12, 6).forEach((x, i) => { if (r < 2 || i < 2) S.pausa(P, x + 2, "8", S.GRIGIO_FANTASMA); });
    }
  });
  sch({ codice: "4G-03", titolo: "Il punto di valore", consegna: "Ripassa i punti. Poi aggiungi il punto dove manca: sempre <b>nello spazio</b>, a destra della testa.", sol: true }, (corpo, a) => {
    const puntoY = (P, p) => P.y(p % 2 === 0 ? p + 1 : p);
    M.consiglio(corpo, "Se la nota è <b>sul rigo</b>, il punto sale nello <b>spazio sopra</b>: non sta mai sul rigo.", "gufo");
    for (let r = 0; r < 3; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(6.5), sopra: 3.8, sotto: 1.6 });
      const passi = a.rnd.serie([0, 1, 2, 3, 4, 5, 6], 8);
      M.posti(P, 8, 6).forEach((x, i) => {
        const p = passi[i]; S.figura(P, x, p, i % 2 ? "4" : "2", "piena", p < 4);
        const y = puntoY(P, p);
        if (r < 1 || i < 2) P.add("circle", { cx: x + 11, cy: y, r: 2, fill: "none", stroke: S.GRIGIO_TRACCIA, "stroke-width": 0.8, "stroke-dasharray": "1.4 1" });
        else if (a.sol) P.add("circle", { cx: x + 11, cy: y, r: 1.8, fill: "#c00" });
      });
    }
  });
  sch({ codice: "4G-04", titolo: "La legatura di valore", consegna: "La legatura unisce <b>due note uguali</b>: si suona una nota sola, lunga quanto tutte e due. Ripassa e poi disegna.", sol: true }, (corpo, a) => {
    const arco = (P, x1, x2, p, su, stile) => {
      const y = P.y(p) + (su ? 6 : -6), h = su ? 9 : -9;
      P.add("path", { d: `M${x1 + 3} ${y} Q${(x1 + x2) / 2} ${y + h} ${x2 - 3} ${y}`, fill: "none", stroke: stile === "traccia" ? S.GRIGIO_TRACCIA : "#c00", "stroke-width": 1.2, "stroke-dasharray": stile === "traccia" ? "2 1.5" : "none" });
    };
    M.consiglio(corpo, "La curva va dalla parte <b>opposta ai gambi</b> e collega le teste, non i gambi.", "gufo");
    for (let r = 0; r < 3; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(6.5), sopra: 3.8, sotto: 2.4 });
      const xs = M.posti(P, 8, 6);
      for (let i = 0; i < 8; i += 2) {
        const p = a.rnd.pick([0, 1, 2, 3, 5, 6, 7]);
        const su = p < 4;
        S.figura(P, xs[i], p, "2", "piena", su); S.figura(P, xs[i + 1], p, "4", "piena", su);
        if (r < 1 || i === 0) arco(P, xs[i], xs[i + 1], p, su, "traccia"); else if (a.sol) arco(P, xs[i], xs[i + 1], p, su, "nero");
      }
    }
  });
  sch({ codice: "4G-05", titolo: "Diesis, bemolle, bequadro", consegna: "Ripassa i segni. Poi scrivi il segno indicato <b>prima</b> di ogni nota, alla sua stessa altezza.", sol: true }, (corpo, a) => {
    const segni = [["accidentalSharp", "diesis ♯", "alza la nota di un semitono"], ["accidentalFlat", "bemolle ♭", "abbassa la nota di un semitono"], ["accidentalNatural", "bequadro ♮", "toglie il diesis o il bemolle"]];
    segni.forEach(([g, nome, cosa]) => {
      const r = el("div", { class: "riga", style: { gap: "3mm" } }); corpo.appendChild(r);
      r.appendChild(el("div", { style: { width: "42mm" }, html: `<b style="font-size:14pt">${nome}</b><br><span class="piccolo">${cosa}</span>` }));
      const b = el("div"); r.appendChild(b);
      const P = S.pentagramma(b, { larg: mm(140), spazio: mm(5.5), sopra: 1.4, sotto: 1.4 });
      M.posti(P, 8, 4).forEach((x, i) => { if (i < 6) S.glifo(P, x - 3, P.y([1, 3, 5, 7, 2, 4][i]), g, S.GRIGIO_FANTASMA); });
    });
    corpo.appendChild(M.etichetta("Ora tocca a te: scrivi il segno davanti alla nota."));
    for (let r = 0; r < 2; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(6), sopra: 3.2, sotto: 1.6 });
      M.posti(P, 6, 6).forEach((x, i) => {
        const [g, t] = a.rnd.pick([["accidentalSharp", "♯"], ["accidentalFlat", "♭"], ["accidentalNatural", "♮"]]);
        const p = a.rnd.pick([0, 1, 2, 3, 4, 5, 6, 7]);
        S.scritta(P, x, P.yRigo(4) - 18, t, { fontSize: "17pt", fontWeight: 600, fontFamily: "Inter" });
        S.testa(P, x + 6, p, "vuota");
        if (a.sol) S.glifo(P, x - 9, P.y(p), g, "#c00");
      });
    }
  });
  sch({ codice: "4G-06", titolo: "Piano e forte", consegna: "Ripassa i segni della dinamica. Poi unisci ogni segno al suo animale.", sol: true }, (corpo, a) => {
    const voci = [[["dynamicPiano"], "p", "piano"], [["dynamicMezzo", "dynamicForte"], "mf", "mezzo forte"], [["dynamicForte"], "f", "forte"]];
    voci.forEach(([gl, s, nome]) => {
      const r = el("div", { class: "riga", style: { gap: "3mm" } }); corpo.appendChild(r);
      r.appendChild(el("div", { style: { width: "36mm", fontSize: "14pt" }, html: `<b>${s}</b> = ${nome}` }));
      const b = el("div"); r.appendChild(b);
      const P = S.pentagramma(b, { larg: mm(144), spazio: mm(7), linee: "nessuna", sopra: 1.5, sotto: 0.2 });
      M.posti(P, 5, 4).forEach((x, i) => { if (i < 4) gl.forEach((g, k) => S.glifo(P, x - (gl.length > 1 ? 14 : 6) + k * 17, P.yRigo(1), g, S.GRIGIO_FANTASMA, 60)); });
    });
    const forc = el("div", { class: "riga", style: { gap: "3mm" } }); corpo.appendChild(forc);
    forc.appendChild(el("div", { style: { width: "36mm", fontSize: "13pt" }, html: "<b>crescendo</b> e <b>diminuendo</b>: piano piano più forte, piano piano più piano" }));
    const T = el("div", { html: `<svg viewBox="0 0 144 20" style="width:144mm;height:20mm"><path d="M4 10 L64 3 M4 10 L64 17 M80 3 L140 10 L80 17" fill="none" stroke="#9aa0ad" stroke-width="0.6" stroke-dasharray="1.8 1.3"/></svg>` });
    forc.appendChild(T);
    M.collega(corpo, ["p", "f", "<", "mf"].map(t => el("div", { style: { fontSize: "26pt", fontWeight: 700, fontStyle: "italic", fontFamily: "Georgia, serif", width: "16mm" } }, t)),
      [img("leone", 16), img("topolino", 16), el("div", { class: "riga" }, img("topolino", 10), img("cane", 13), img("leone", 16)), img("muso-gatto", 14)], [[0, 1], [1, 0], [2, 2], [3, 3]], a.sol);
  });

  sch({ codice: "4G-07", titolo: "Ricopia il brano", consegna: "Ricopia il brano sui pentagrammi vuoti, battuta per battuta. Poi suonalo con il flauto!" }, async (corpo) => {
    await M.brano(corpo, 3, { interna: 600, perRiga: 4 });
    for (let r = 0; r < 3; r++) { const v = el("div"); corpo.appendChild(v); S.pentagramma(v, { spazio: mm(4.6), sopra: 2.2, sotto: 2.2 }); }
    M.consiglio(corpo, "È il brano <b>Si e La a passeggio</b> dei <i>Brani propedeutici</i> di musicascuole.it: sul sito c'è anche la base per suonarlo.", "flauto", { fontSize: "11.5pt" });
  });

  sch({ codice: "4G-08", titolo: "Caccia agli errori", consegna: "In questa melodia ci sono <b>5 errori</b> di scrittura. Cerchiali e scrivi sotto che cosa non va.", icona: "lente", sol: true }, (corpo, a) => {
    const b = el("div"); corpo.appendChild(b);
    const P = S.pentagramma(b, { spazio: mm(5.6), chiave: "nera", tempo: "4/4", sopra: 4, sotto: 3.6 });
    const x0 = 62, dx = (P.W - x0 - 8) / 10;
    const X = i => x0 + dx * (i + 0.5);
    const errori = [];
    S.figura(P, X(0), 2, "4", "piena", true);
    S.testa(P, X(1), 3, "piena"); P.add("line", { x1: X(1) - 5.75, x2: X(1) - 5.75, y1: P.y(3) - 1, y2: P.y(3) - 34, stroke: "#111", "stroke-width": 1.3 }); errori.push([X(1), P.y(3) - 14, "gambo in su a sinistra"]);
    S.figura(P, X(2), 4, "2", "piena", false);
    S.stanghetta(P, X(2) + dx * 0.6, "semplice");
    S.figura(P, X(3) + 4, 1, "4", "piena", true); S.glifo(P, X(3) + 12, P.y(1), "accidentalSharp"); errori.push([X(3) + 14, P.y(1), "il diesis va prima della nota"]);
    S.figura(P, X(4) + 6, 0, "4", "piena", true);
    S.figura(P, X(5), 6, "2", "piena", false); P.add("circle", { cx: X(5) + 10, cy: P.y(6), r: 1.7, fill: "#111" }); errori.push([X(5) + 10, P.y(6), "il punto va nello spazio"]);
    S.stanghetta(P, X(5) + dx * 0.7, "semplice");
    S.figura(P, X(6) + 4, 1, "4", "piena", true);
    P.add("ellipse", { cx: X(7) + 4, cy: P.y(-2), rx: 6.3, ry: 4.6, transform: `rotate(-22 ${X(7) + 4} ${P.y(-2)})`, fill: "#111" }); S.gambo(P, X(7) + 4, -2, true); errori.push([X(7) + 4, P.y(-2), "manca il taglio del do"]);
    S.figura(P, X(8) + 4, 2, "4", "piena", true);
    S.testa(P, X(9) + 2, 3, "piena"); P.add("line", { x1: X(9) + 7.75, x2: X(9) + 7.75, y1: P.y(3) - 1, y2: P.y(3) - 13, stroke: "#111", "stroke-width": 1.3 }); errori.push([X(9) + 6, P.y(3) - 7, "gambo troppo corto"]);
    S.stanghetta(P, P.W - 3, "fine");
    if (a.sol) errori.forEach(([x, y]) => P.add("circle", { cx: x, cy: y, r: 11, fill: "none", stroke: "#c00", "stroke-width": 1.3 }));
    for (let i = 0; i < 5; i++) corpo.appendChild(el("div", { class: "riga", style: { gap: "2mm" } }, el("b", null, (i + 1) + "."),
      el("div", { class: a.sol ? "sol" : "", style: { flex: 1, borderBottom: ".3mm solid #999", minHeight: "9mm", fontSize: "13pt" } }, a.sol ? errori[i][2] : "")));
  });

  /* ---------------- NOTE ---------------- */
  sch({ codice: "4N-01", titolo: "Le note acute", consegna: "Sopra il do acuto la scala continua: <b>re, mi, fa, sol</b>. Ripassa e poi scrivi il nome.", sol: true }, (corpo, a) => {
    const b = el("div"); corpo.appendChild(b);
    const P = S.pentagramma(b, { spazio: mm(7.5), chiave: "nera", sopra: 1.8, sotto: 2.4 });
    ESTESA.forEach((k, i) => {
      const x = 40 + i * ((P.W - 46) / 12) + 6, n = nota(k);
      S.testa(P, x, n.passo, i >= 8 ? (S.col() ? "colore" : "piena") : "grigia", COLORI[n.l]);
      S.scritta(P, x, P.yRigo(0) + 21, n.nome, { fontSize: i >= 8 ? "13pt" : "10pt", fontWeight: i >= 8 ? 700 : 400 });
    });
    M.consiglio(corpo, "<b>re</b> sul 4° rigo · <b>mi</b> nel 4° spazio · <b>fa</b> sul 5° rigo · <b>sol</b> appeso sopra il 5° rigo.", "gufo");
    M.righeNote(corpo, a.rnd.serie(ESTESA.slice(6), 24), { perRiga: 8, spazio: 5.4, stile: "piena", sol: a.sol, sotto: 3.4, sopra: 1.8 });
  });
  sch({ codice: "4N-02", titolo: "Lettura veloce", consegna: "Leggi ogni riga ad alta voce, prima piano piano come la tartaruga, poi veloce come il coniglio.", icona: "occhi" }, (corpo, a) => {
    for (let r = 0; r < 6; r++) {
      const riga = el("div", { class: "riga", style: { gap: "2mm" } }, img(r < 2 ? "tartaruga" : r < 4 ? "coniglio" : "razzo", 11)); corpo.appendChild(riga);
      const b = el("div"); riga.appendChild(b);
      const P = S.pentagramma(b, { larg: S.LARGHEZZA - mm(14), spazio: mm(4.8), chiave: "nera", sopra: 1.8, sotto: 2.4 });
      let p = a.rnd.int(0, 6); const seq = [];
      for (let i = 0; i < 12; i++) { seq.push(p); p = Math.max(-2, Math.min(9, p + a.rnd.pick(r < 2 ? [-1, 1, 0] : [-2, -1, 1, 2, 3, -3]))); }
      M.posti(P, 12, 36).forEach((x, i) => S.testa(P, x, seq[i], "piena"));
    }
  });
  sch({ codice: "4N-03", titolo: "Fa diesis e si bemolle", consegna: "Il diesis e il bemolle cambiano il suono della nota. Scrivi il nome completo: per esempio <b>fa♯</b> o <b>si♭</b>.", sol: true }, (corpo, a) => {
    const r0 = el("div", { class: "riga", style: { justifyContent: "space-around" } }); corpo.appendChild(r0);
    [["f#4", "fa diesis", "un po' più acuto del fa"], ["bb4", "si bemolle", "un po' più grave del si"]].forEach(([k, nome, frase]) => {
      const c = el("div", { class: "riquadro centro" }); r0.appendChild(c);
      S.battute(c, { larg: mm(60), spazio: mm(7), misure: ["w:" + k], fine: false, senzaStanghette: true, sopra: 1.2, sotto: 1.6 });
      c.appendChild(el("div", { class: "testo", html: `<b>${nome}</b><br>${frase}` }));
    });
    const pool = ["f#4", "bb4", "f4", "b4", "g4", "e4", "f#5", "a4", "c5", "bb4", "f#4"];
    for (let r = 0; r < 3; r++) {
      const b = el("div"); corpo.appendChild(b);
      const seq = a.rnd.serie(pool, 6);
      const out = S.battute(b, { spazio: mm(6), misure: seq.map(k => "q:" + k), fine: false, senzaStanghette: true, sopra: 1.4, sotto: 3.8, proporzionale: false });
      out.note.forEach((q, i) => {
        const n = nota(seq[i]);
        const d = out.scritta(q.x, out.yRigo0 + 25, a.sol ? n.nome + (n.alt === "#" ? "♯" : n.alt === "b" ? "♭" : "") : "");
        d.className = "sopra linea-risposta"; d.style.width = mm(18) + "px";
      });
    }
  });
  sch({ codice: "4N-04", titolo: "Tasti bianchi e tasti neri", consegna: "Su ogni tastiera colora il tasto della nota scritta sopra. I tasti neri sono i diesis e i bemolle.", icona: "tastiera", sol: true }, (corpo, a) => {
    M.consiglio(corpo, "Il tasto nero <b>a destra</b> di una nota è il suo <b>diesis</b>; quello <b>a sinistra</b> è il suo <b>bemolle</b>. Lo stesso tasto può avere due nomi: fa♯ = sol♭.", "gufo");
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "5mm" } }); corpo.appendChild(g);
    [["fa♯", "f#4"], ["si♭", "a#4"], ["do♯", "c#4"], ["mi", "e4"], ["sol♯", "g#4"], ["mi♭", "d#4"], ["la", "a4"], ["re♯", "d#4"]].forEach(([t, k]) => {
      const c = el("div", { class: "riquadro centro" }, el("div", { style: { fontSize: "18pt", fontWeight: 600 } }, t)); g.appendChild(c);
      const w = el("div", { style: { display: "flex", justifyContent: "center" } }); c.appendChild(w);
      M.tastiera(w, "c4", "b4", { larg: 70, alto: 30, segna: a.sol ? [k] : [] });
    });
  });
  sch({ codice: "4N-05", titolo: "Vicine o lontane?", consegna: "Le due note sono <b>vicine</b> (una dopo l'altra, grado congiunto) o fanno un <b>salto</b>? Fai una crocetta.", icona: "occhi", sol: true }, (corpo, a) => {
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "4mm" } }); corpo.appendChild(g);
    for (let i = 0; i < 15; i++) {
      const p1 = a.rnd.int(-2, 8), salto = a.rnd.r() < 0.5, p2 = salto ? p1 + a.rnd.pick([-4, -3, -2, 2, 3, 4]) : p1 + a.rnd.pick([-1, 1]);
      const c = el("div", { class: "riquadro", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1mm", padding: "1.5mm" } }); g.appendChild(c);
      const P = S.pentagramma(c, { larg: mm(50), spazio: mm(3.8), chiave: "nera", sopra: 1.4, sotto: 2.4 });
      S.testa(P, 55, p1, "piena"); S.testa(P, 85, p2, "piena");
      const cs = M.caselle(["vicine", "salto"], salto ? "salto" : "vicine", a.sol);
      cs.querySelectorAll(":scope > div").forEach(d => { d.style.width = "17mm"; d.style.fontSize = "10pt"; });
      c.appendChild(cs);
    }
  });
  sch({ codice: "4N-06", titolo: "Toni e semitoni", consegna: "Tra due tasti bianchi vicini c'è un tasto nero? Allora è un <b>tono</b> (T). Se non c'è, è un <b>semitono</b> (S). Scrivi T o S.", icona: "tastiera", sol: true }, (corpo, a) => {
    const t = el("div", { style: { display: "flex", justifyContent: "center" } }); corpo.appendChild(t);
    const k = M.tastiera(t, "c4", "c5", { larg: 176, alto: 70, nomi: true });
    const tipi = ["T", "T", "S", "T", "T", "T", "S"];
    const r = el("div", { style: { position: "relative", width: "176mm", height: "16mm", margin: "0 auto" } }); corpo.appendChild(r);
    tipi.forEach((tp, i) => {
      const x = (i + 1) * k.w;
      r.appendChild(el("div", { class: "box-risposta", style: { position: "absolute", left: (x - 6) + "mm", top: "2mm", minWidth: "12mm", width: "12mm" } }, a.sol ? tp : ""));
    });
    M.consiglio(corpo, "La scala di do ha due semitoni: tra <b>mi e fa</b> e tra <b>si e do</b>. Tutti gli altri passi sono toni.", "gufo");
    corpo.appendChild(M.etichetta("Ora completa: tra queste note c'è un tono o un semitono?"));
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "3mm" } }); corpo.appendChild(g);
    [["do", "re", "T"], ["mi", "fa", "S"], ["sol", "la", "T"], ["si", "do", "S"], ["fa", "sol", "T"], ["la", "si", "T"], ["re", "mi", "T"], ["mi", "fa", "S"]].forEach(([x, y, tp]) => {
      g.appendChild(el("div", { class: "riquadro riga", style: { justifyContent: "space-between" } }, el("span", { class: "testo" }, `${x} – ${y}`), el("span", { class: "box-risposta", style: { minWidth: "10mm" } }, a.sol ? tp : "")));
    });
  });

  /* ---------------- RITMO ---------------- */
  function righeRitmo(corpo, a, tempo, figure, righe, opz) {
    const b = +tempo.split("/")[0];
    for (let i = 0; i < righe; i++) {
      const misure = Array.from({ length: b === 4 ? 2 : b === 3 ? 3 : 4 }, (_, k) => (opz && opz.forza && (k + i) % 2 === 1) ? TOK[opz.forza] : comeToken(battuta(a.rnd, b, figure)));
      const riga = el("div", { class: "riga", style: { gap: "2mm" } }, riquadroNum(i + 1));
      const box = el("div"); riga.appendChild(box); corpo.appendChild(riga);
      const o2 = Object.assign({}, opz || {}); delete o2.forza;
      S.battute(box, Object.assign({ larg: S.LARGHEZZA - mm(9), spazio: mm(4.6), unaLinea: true, chiave: false, tempo, misure, sopra: 2.4, sotto: 0, battitiMisura: b }, o2));
    }
  }
  function spiega(corpo, figura, sillaba, testo) {
    const r = el("div", { class: "riquadro tinta riga", style: { gap: "5mm", justifyContent: "center" } }); corpo.appendChild(r);
    const f = el("div"); r.appendChild(f); M.figuraSola(f, figura, 30, 6, "piena");
    r.appendChild(el("div", { style: { fontSize: "24pt", fontWeight: 600, color: "var(--inch)" } }, sillaba));
    r.appendChild(el("div", { class: "testo", html: testo }));
  }
  sch({ codice: "4R-01", titolo: "La minima puntata", consegna: "Leggi e batti in 3/4. La minima puntata dura tutta la battuta: <b>ta-a-a</b>.", icona: "mani" }, (corpo, a) => {
    spiega(corpo, "2.", "TA-A-A", "minima (2) + punto (1) = <b>3 battiti</b>.<br>Il punto aggiunge metà del valore della nota.");
    righeRitmo(corpo, a, "3/4", ["q", "q", "88", "h"], 5, { cuori: true, sopra: 3.4, forza: "h." });
  });
  sch({ codice: "4R-02", titolo: "Croma e pausa di croma", consegna: "Leggi e batti. Dove c'è la pausa di croma, apri le mani: <b>ti-sst</b> oppure <b>sst-ti</b>.", icona: "mani" }, (corpo, a) => {
    spiega(corpo, "r8", "SST", "La pausa di croma dura <b>mezzo battito</b>.<br>Croma + pausa di croma = 1 battito.");
    righeRitmo(corpo, a, "4/4", ["q", "88", "8r", "r8", "h"], 5, { cuori: true, sopra: 3.4 });
  });
  sch({ codice: "4R-03", titolo: "Conta la legatura", consegna: "La legatura unisce due note: suoni una nota sola e conti tutti i battiti. Quanti battiti dura la nota legata?", icona: "matita", sol: true }, (corpo, a) => {
    const casi = [["h:g4", "q:g4", 3], ["q:a4", "h:a4", 3], ["h:b4", "h:b4", 4], ["q:g4", "q:g4", 2], ["h.:a4", "q:a4", 4], ["q:b4", "w:b4", 5], ["h:g4", "h.:g4", 5], ["w:a4", "q:a4", 5]];
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "4mm" } }); corpo.appendChild(g);
    casi.forEach(([t1, t2, v], i) => {
      const c = el("div", { class: "riquadro riga", style: { gap: "2mm" } }); g.appendChild(c);
      const b = el("div"); c.appendChild(b);
      const m1 = t1, m2 = t2;
      const pausa = r => ["", "q:r", "h:r", "h.:r"][Math.round(r)];
      const resto1 = 4 - S.valore(S.token(m1)), resto2 = 4 - S.valore(S.token(m2));
      const prima = (resto1 >= 1 ? pausa(resto1) + " " : "") + m1, dopo = m2 + (resto2 >= 1 ? " " + pausa(resto2) : "");
      const out = S.battute(b, { larg: mm(64), spazio: mm(3.8), misure: [prima, dopo], tempo: "4/4", sopra: 2, sotto: 1.6, legature: [], battitiMisura: 4 });
      const i1 = out.note.filter(n => n.misura === 0).length - 1, i2 = i1 + 1;
      new Vex.Flow.StaveTie({ first_note: out.note[i1].sn, last_note: out.note[i2].sn, first_indices: [0], last_indices: [0] }).setContext(out.ctx).draw();
      c.appendChild(el("span", { class: "box-risposta", style: { minWidth: "11mm" } }, a.sol ? String(v) : ""));
    });
    M.consiglio(corpo, "Le pause servono solo a completare la battuta: conta solo la nota legata.", "gufo", { fontSize: "11.5pt" });
  });
  sch({ codice: "4R-04", titolo: "Completa le battute", consegna: "Ogni battuta deve avere i battiti giusti. Disegna la figura che manca nella casella.", icona: "matita", sol: true }, (corpo, a) => {
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "4mm 5mm" } }); corpo.appendChild(g);
    ["3/4", "4/4", "2/4", "3/4", "4/4", "4/4", "3/4", "2/4", "4/4", "3/4"].forEach(tempo => {
      const b = +tempo.split("/")[0];
      let figs, cand; do { figs = battuta(a.rnd, b, ["q", "88", "h", "h.", "r"]); cand = figs.map((f, j) => j).filter(j => ["q", "h", "h."].includes(figs[j])); } while (figs.length < 2 || !cand.length);
      const j = a.rnd.pick(cand);
      let idx = 0; figs.slice(0, j).forEach(f => idx += TOK[f].split(" ").length);
      const c = el("div", { class: "riquadro", style: { padding: "1mm 2mm" } }); g.appendChild(c);
      const out = S.battute(c, { larg: mm(84), spazio: mm(4.4), unaLinea: true, chiave: false, tempo, misure: [comeToken(figs)], sopra: 2.4, sotto: 0, nascondi: [idx], battitiMisura: b });
      const q = out.note.find(n => n.sn._indice === idx);
      if (q) { const d = out.scritta(q.x, out.yLinea - 9, ""); Object.assign(d.style, { width: mm(10) + "px", height: mm(16) + "px", border: ".4mm dashed #888", borderRadius: "1.5mm" }); }
    });
  });
  sch({ codice: "4R-05", titolo: "Ritmo a due voci", consegna: "La classe si divide in due gruppi: il gruppo A legge la riga di sopra, il gruppo B quella di sotto. Insieme!", icona: "mani" }, (corpo, a) => {
    for (let s = 0; s < 4; s++) {
      const box = el("div", { class: "riquadro", style: { padding: "1mm 3mm" } }); corpo.appendChild(box);
      ["A", "B"].forEach((v, k) => {
        const r = el("div", { class: "riga", style: { gap: "2mm" } }, el("b", { style: { width: "6mm", fontSize: "14pt" } }, v)); box.appendChild(r);
        const b = el("div"); r.appendChild(b);
        const fig = k === 0 ? ["q", "88", "h", "r"] : ["h", "q", "w", "h"];
        S.battute(b, { larg: mm(168), spazio: mm(4.4), unaLinea: true, chiave: false, tempo: "4/4", misure: Array.from({ length: 2 }, () => comeToken(battuta(a.rnd, 4, fig))), sopra: 2.4, sotto: 0, battitiMisura: 4 });
      });
    }
  });

  /* ---------------- STRUMENTI ---------------- */
  sch({ codice: "4S-01", titolo: "Il flauto dolce", consegna: "Conosci il tuo flauto: leggi i nomi delle parti e colora il disegno.", icona: "flauto" }, (corpo) => {
    const r = el("div", { class: "riga", style: { gap: "8mm", alignItems: "center", justifyContent: "center" } }); corpo.appendChild(r);
    const fori = [66, 82, 98, 124, 140, 158, 178];
    const c = S.col() ? "#e9c99a" : "#fff";
    let s = `<path d="M44 8 Q50 2 56 8 L58 40 L42 40 Z" fill="${c}" stroke="#222" stroke-width="1"/><rect x="47" y="12" width="6" height="2.5" rx="1" fill="#222"/>` +
      `<rect x="41" y="40" width="18" height="6" fill="${S.col() ? "#d9b27c" : "#fff"}" stroke="#222" stroke-width="1"/><rect x="42" y="46" width="16" height="150" fill="${c}" stroke="#222" stroke-width="1"/>` +
      `<path d="M42 196 L40 214 Q50 220 60 214 L58 196 Z" fill="${S.col() ? "#d9b27c" : "#fff"}" stroke="#222" stroke-width="1"/><rect x="47" y="24" width="6" height="4" fill="#222"/>`;
    fori.forEach((y, i) => { s += i >= 5 ? `<circle cx="47.3" cy="${y}" r="1.7" fill="#fff" stroke="#222" stroke-width="0.8"/><circle cx="52.7" cy="${y}" r="1.7" fill="#fff" stroke="#222" stroke-width="0.8"/>` : `<circle cx="50" cy="${y}" r="3" fill="#fff" stroke="#222" stroke-width="0.9"/>`; });
    s += `<circle cx="50" cy="54" r="3" fill="none" stroke="#222" stroke-width="0.9" stroke-dasharray="1.2 1"/>`;
    const et = [[10, "bocchino: tra le labbra, senza morderlo"], [26, "finestrella: qui nasce il suono"], [54, "foro del pollice (dietro)"], [82, "mano sinistra: indice, medio, anulare"], [150, "mano destra: indice, medio, anulare, mignolo"], [178, "fori doppi"], [205, "piede (si può girare)"]];
    et.forEach(([y, t]) => { s += `<path d="M62 ${y} H80" stroke="#888" stroke-width="0.5"/><text x="82" y="${y + 1.8}" font-family="Fredoka" font-size="5.6">${t}</text>`; });
    r.appendChild(el("div", { html: `<svg viewBox="0 0 200 222" style="width:150mm;height:166mm">${s}</svg>` }));
    M.consiglio(corpo, "<b>Mano sinistra in alto</b>, destra in basso. Soffia piano piano, come se dicessi <b>«du»</b> sottovoce. Copri bene i fori con i polpastrelli.", "flauto");
  });
  sch({ codice: "4S-02", titolo: "Si, la, sol sul flauto", consegna: "Ecco le prime tre note: il pallino nero è il foro da chiudere. Prova a suonarle e colora le carte.", icona: "flauto" }, (corpo) => {
    const r = el("div", { class: "riga", style: { justifyContent: "space-around", alignItems: "stretch" } }); corpo.appendChild(r);
    ["b4", "a4", "g4"].forEach(k => M.cartaFlauto(r, k, { larg: 46, schema: 18 }));
    M.consiglio(corpo, "Il <b>si</b> usa il pollice e un dito; il <b>la</b> aggiunge il medio; il <b>sol</b> anche l'anulare. Più dita chiudi, più la nota scende.", "gufo");
  });
  sch({ codice: "4S-03", titolo: "Primi brani con tre note", consegna: "Suona il brano con il flauto. Sul sito musicascuole.it trovi la base per suonare insieme.", icona: "flauto" }, async (corpo, a) => {
    corpo.classList.add("alto");
    await M.brano(corpo, 5, { colori: true, interna: 520, schema: true, larghSchema: 70 });
    const p2 = a.altraPagina("2"); p2.classList.add("alto");
    await M.brano(p2, 6, { colori: true, interna: 560, schema: true, larghSchema: 78 });
  });
  sch({ codice: "4S-04", titolo: "Tutti i do della tastiera", consegna: "Colora di un colore tutti i <b>do</b> e di un altro tutti i <b>fa</b>.", icona: "tastiera", sol: true }, (corpo, a) => {
    M.consiglio(corpo, "Il <b>do</b> è a sinistra dei <b>due</b> tasti neri. Il <b>fa</b> è a sinistra dei <b>tre</b> tasti neri.", "gufo");
    [["c3", "b4"], ["c4", "b5"]].forEach(([da, aa]) => {
      const t = el("div", { style: { display: "flex", justifyContent: "center" } }); corpo.appendChild(t);
      M.tastiera(t, da, aa, { larg: 176, alto: 52, segna: a.sol ? ["c3", "c4", "c5", "f3", "f4", "f5"] : [] });
    });
    const t = el("div", { style: { display: "flex", justifyContent: "center" } }); corpo.appendChild(t);
    M.tastiera(t, "c4", "c5", { larg: 176, alto: 52, nomi: true, colori: true });
  });

  /* ---------------- ASCOLTO ---------------- */
  sch({ codice: "4A-01", titolo: "Dettato con cinque note", consegna: "L'insegnante suona una melodia con <b>do re mi fa sol</b>. Scrivi le note sulle righe ritmiche già pronte.", icona: "orecchio", sol: true }, (corpo, a) => {
    const N5 = ["c4", "d4", "e4", "f4", "g4"];
    for (let d = 0; d < 4; d++) {
      let p = 0; const seq = ["c4"];
      for (let i = 1; i < 7; i++) { p = Math.max(0, Math.min(4, p + a.rnd.pick([-1, 1, 1, -1, 2, 0]))); seq.push(N5[p]); }
      seq[7] = "c4";
      corpo.appendChild(el("div", { class: "testo", style: { fontWeight: 500 } }, `Dettato ${d + 1}` + (a.sol ? " — " + seq.map(k => nota(k).nome).join(" ") : "")));
      const b = el("div"); corpo.appendChild(b);
      const misure = ["q:" + seq.slice(0, 4).join(" q:"), "q:" + seq.slice(4, 7).join(" q:") + " q:c4"];
      const out = S.battute(b, { spazio: mm(5.6), tempo: "4/4", misure, sopra: 1.4, sotto: 2.4, nascondi: a.sol ? [] : [1, 2, 3, 4, 5, 6] });
      if (!a.sol) out.note.slice(1, 7).forEach(q => out.ctx.svg.appendChild(S.sv("circle", { cx: q.x, cy: out.yRigo0 + 16, r: 1.6, fill: "#6b7280" })));
    }
    M.consiglio(corpo, "La prima e l'ultima nota sono il <b>do</b>. Ogni nota dura un battito.", "orecchio");
  });
  sch({ codice: "4A-02", titolo: "Riconosci lo strumento", consegna: "Ascolta e scrivi il nome dello strumento. Puoi usare il gioco <b>Riconosci lo strumento</b> di musicascuole.it alla LIM.", icona: "orecchio" }, (corpo) => {
    const banca = el("div", { class: "riquadro tinta riga", style: { justifyContent: "space-around", flexWrap: "wrap" } }); corpo.appendChild(banca);
    ["violino", "flauto", "tromba", "chitarra", "arpa", "tamburo", "sassofono", "tastiera", "trombone", "fisarmonica"].forEach(n => banca.appendChild(el("div", { class: "centro piccolo" }, img(n, 12), el("div", null, n))));
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "4mm 8mm" } }); corpo.appendChild(g);
    for (let i = 0; i < 12; i++) g.appendChild(el("div", { class: "riga", style: { gap: "2mm" } }, el("b", { style: { width: "8mm", fontSize: "14pt" } }, (i + 1) + "."), el("div", { style: { flex: 1, borderBottom: ".35mm solid #999", height: "10mm" } })));
  });

  /* ---------------- CREATIVITÀ ---------------- */
  sch({ codice: "4C-01", titolo: "La mia prima melodia", consegna: "Componi quattro battute con <b>do re mi fa sol</b>. Usa il ritmo che preferisci, poi suonala e dalle un titolo.", icona: "lampadina" }, (corpo) => {
    corpo.appendChild(el("div", { class: "testo" }, "Titolo: ", el("span", { style: { display: "inline-block", width: "120mm", borderBottom: ".4mm solid #999" } })));
    const b = el("div"); corpo.appendChild(b);
    S.battute(b, { spazio: mm(7), tempo: "4/4", misure: ["", ""], sopra: 2.6, sotto: 3, fine: false });
    const b2 = el("div"); corpo.appendChild(b2);
    S.battute(b2, { spazio: mm(7), chiave: true, misure: ["", ""], sopra: 2.6, sotto: 3 });
    const chk = el("div", { class: "riquadro tinta", style: { fontSize: "13pt", lineHeight: "1.6" }, html:
      "<b>Controlla la tua melodia</b><br>☐ ogni battuta ha 4 battiti<br>☐ la melodia comincia e finisce con il <b>do</b><br>☐ i gambi sono dalla parte giusta<br>☐ alla fine c'è la doppia stanghetta" });
    corpo.appendChild(chk);
  });

  /* ---------------- RITAGLIA E GIOCA ---------------- */
  sch({ codice: "4X-01", titolo: "Domino delle figure", consegna: "Ritaglia le tessere. Avvicina ogni figura al numero dei suoi battiti.", icona: "forbici" }, (corpo, a) => {
    const tipi = [["1", "4"], ["2", "2"], ["4", "1"], ["88", "1"], ["2.", "3"], ["r2", "2"], ["r4", "1"], ["r1", "4"]];
    const seq = a.rnd.mescola(tipi.concat(tipi.slice(0, 4)));
    M.carte(corpo, 2, 6, (c, i) => {
      c.style.flexDirection = "row";
      const sx = el("div", { style: { flex: 1, display: "flex", justifyContent: "center", alignItems: "center" } });
      const dx = el("div", { style: { flex: 1, display: "flex", justifyContent: "center", alignItems: "center", borderLeft: ".5mm solid #999", height: "80%", fontSize: "28pt", fontWeight: 600 } }, seq[(i + 1) % 12][1]);
      c.append(sx, dx); M.figuraSola(sx, seq[i][0], 30, 4, "piena");
    }, { gap: 0 });
  });
  sch({ codice: "4X-02", titolo: "Il gioco dell'oca musicale", consegna: "Tira il dado e avanza. Sulle caselle speciali segui le regole qui sotto. Vince chi arriva per primo!", icona: "dado" }, (corpo, a) => {
    const R = 5, Cc = 6, tot = R * Cc;
    const spec = { 5: "nota", 9: "nota", 14: "nota", 19: "nota", 23: "nota", 27: "nota", 7: "ritmo", 12: "ritmo", 21: "ritmo", 25: "ritmo", 4: "oca", 11: "oca", 17: "oca", 29: "oca", 16: "pausa", 26: "indietro" };
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: `repeat(${Cc}, minmax(0,1fr))`, gap: "1.5mm" } }); corpo.appendChild(g);
    const celle = [];
    for (let i = 1; i <= tot; i++) celle.push(i);
    const ordine = [];
    for (let r = 0; r < R; r++) { const fila = celle.slice(r * Cc, r * Cc + Cc); ordine.push(...(r % 2 ? fila.reverse() : fila)); }
    ordine.forEach(n => {
      const c = el("div", { class: "riquadro", style: { padding: "1mm", height: "29mm", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" } });
      c.appendChild(el("div", { style: { position: "absolute", top: "0.5mm", left: "1.5mm", fontWeight: 600, color: "var(--inch)" } }, String(n)));
      const t = spec[n];
      if (n === 1) c.appendChild(el("div", { class: "centro" }, img("pulcino", 13), el("div", { class: "piccolo" }, "partenza")));
      else if (n === tot) c.appendChild(el("div", { class: "centro" }, img("coppa", 14), el("div", { class: "piccolo" }, "arrivo")));
      else if (t === "nota") M.notaInCarta(c, a.rnd.pick(ESTESA), 26, 2.6);
      else if (t === "ritmo") { const b = el("div"); c.appendChild(b); S.battute(b, { larg: mm(26), spazio: mm(2.2), unaLinea: true, chiave: false, misure: [comeToken(battuta(a.rnd, 4, ["q", "88", "h", "r"]))], sopra: 2.2, sotto: 0, battitiMisura: 4 }); }
      else if (t === "oca") c.appendChild(img("oca", 15));
      else if (t === "pausa") { const f = el("div"); c.appendChild(f); M.figuraSola(f, "r1", 22, 3.2, "piena"); }
      else if (t === "indietro") c.appendChild(img("lumaca", 14));
      if (S.col() && t) c.style.background = { nota: "#eef6ff", ritmo: "#fff4e5", oca: "#eefbea", pausa: "#f5f5f5", indietro: "#fdeef0" }[t];
      g.appendChild(c);
    });
    corpo.appendChild(el("div", { class: "riquadro tinta", style: { fontSize: "11pt", lineHeight: "1.45" }, html:
      "<b>Nota</b>: dì il nome della nota; se sbagli torni indietro di una casella. <b>Ritmo</b>: batti il ritmo; se sbagli resti fermo. " +
      "<b>Oca</b>: tira di nuovo il dado. <b>Pausa di semibreve</b>: stai fermo un giro. <b>Lumaca</b>: torna indietro di 3 caselle." }));
  });

  /* ---------------- VERIFICA ---------------- */
  sch({ codice: "4V-01", titolo: "Che cosa ho imparato", consegna: "Fai tutti gli esercizi con calma. Alla fine colora la stella!", icona: "stella", sol: true }, (corpo, a) => {
    corpo.classList.add("alto");
    corpo.appendChild(M.etichetta("1. Scrivi il nome delle note (attento ai diesis e ai bemolle)."));
    const b = el("div"); corpo.appendChild(b);
    const seq = ["e5", "f#4", "g5", "bb4", "d5", "c4", "f5", "a4"];
    const out = S.battute(b, { spazio: mm(5), misure: seq.map(k => "q:" + k), fine: false, senzaStanghette: true, sopra: 1.4, sotto: 3.6, proporzionale: false });
    out.note.forEach((q, i) => { const n = nota(seq[i]); const d = out.scritta(q.x, out.yRigo0 + 24, a.sol ? n.nome + (n.alt === "#" ? "♯" : n.alt === "b" ? "♭" : "") : ""); d.className = "sopra linea-risposta"; d.style.width = mm(15) + "px"; });
    corpo.appendChild(M.etichetta("2. Aggiungi il punto e la legatura dove indicato."));
    const b2 = el("div"); corpo.appendChild(b2);
    const P = S.pentagramma(b2, { spazio: mm(5.5), sopra: 3.8, sotto: 2.4 });
    const xs = M.posti(P, 6, 6);
    [[2, "punto"], [4, "punto"], [1, "legatura"]].forEach(([p, cosa], i) => {
      S.figura(P, xs[i * 2], p, "2", "piena", p < 4); S.scritta(P, xs[i * 2] + 18, P.yRigo(0) + 22, cosa, { fontSize: "11pt" });
      if (cosa === "legatura") { S.figura(P, xs[i * 2 + 1], p, "4", "piena", true); if (a.sol) P.add("path", { d: `M${xs[i * 2] + 3} ${P.y(p) + 6} Q${(xs[i * 2] + xs[i * 2 + 1]) / 2} ${P.y(p) + 15} ${xs[i * 2 + 1] - 3} ${P.y(p) + 6}`, fill: "none", stroke: "#c00", "stroke-width": 1.2 }); }
      else if (a.sol) P.add("circle", { cx: xs[i * 2] + 11, cy: P.y(p % 2 ? p : p + 1), r: 1.8, fill: "#c00" });
    });
    corpo.appendChild(M.etichetta("3. Quanti battiti?"));
    const r = el("div", { class: "riga", style: { justifyContent: "space-around" } }); corpo.appendChild(r);
    [["2.", 3], ["r8", "½"], ["1", 4], ["r2", 2]].forEach(([t, v]) => {
      const c = el("div", { class: "riquadro riga", style: { gap: "2mm" } }); r.appendChild(c);
      const f = el("div"); c.appendChild(f); M.figuraSola(f, t, 20, 4.4, "piena");
      c.appendChild(el("span", { class: "box-risposta", style: { minWidth: "11mm" } }, a.sol ? String(v) : ""));
    });
    corpo.appendChild(M.etichetta("4. Tono (T) o semitono (S)?"));
    const r2 = el("div", { class: "riga", style: { justifyContent: "space-around" } }); corpo.appendChild(r2);
    [["mi – fa", "S"], ["do – re", "T"], ["si – do", "S"], ["sol – la", "T"]].forEach(([t, v]) => r2.appendChild(el("div", { class: "riquadro riga", style: { gap: "3mm" } }, el("span", { class: "testo" }, t), el("span", { class: "box-risposta", style: { minWidth: "10mm" } }, a.sol ? v : ""))));
  });
  sch({ codice: "4V-02", titolo: "Diploma del flautista", consegna: false }, (corpo) => {
    M.diploma(corpo, "Diploma del flautista", "perché suona le prime note sul flauto dolce, conosce diesis e bemolle, il punto, la legatura e i segni della dinamica.", "flauto");
  });
})();
