/* Schede della classe 5ª — Consolidare e prepararsi alle medie */
(function () {
  "use strict";
  const S = Schede, M = Modelli, { el, img, nota, COLORI, NOMI } = S, mm = M.mm;
  const C = 5;
  const sch = (meta, f) => S.scheda(C, meta, f);
  const ESTESA = ["c4", "d4", "e4", "f4", "g4", "a4", "b4", "c5", "d5", "e5", "f5", "g5"];

  S.titoloClasse(C, {
    sottotitolo: "Consolidare e prepararsi alle medie: brani veri, diesis in chiave, figure puntate, anacrusi, sincope e composizione.",
    guida: "<b>Per l'insegnante.</b> In quinta si legge e si scrive musica vera. La verifica finale «Pronto per le medie» si può affiancare al " +
      "<b>Test d'ingresso</b> di musicascuole.it, pensato per l'inizio della scuola media."
  });

  const VAL = { q: 1, "88": 1, h: 2, w: 4, r: 1, "h.": 3, "q.8": 2, "16": 1, "8q8": 2, "8.16": 1 };
  const TOK = { q: "q:x", "88": "8:x 8:x", h: "h:x", w: "w:x", r: "q:r", "h.": "h.:x", "q.8": "q.:x 8:x", "16": "16:x 16:x 16:x 16:x", "8q8": "8:x q:x 8:x" };
  function battuta(rnd, battiti, figure, deve) {
    let out = [];
    for (let k = 0; k < 80; k++) {
      out = []; let t = 0;
      while (t < battiti) { const f = rnd.pick(figure.filter(x => VAL[x] <= battiti - t)); out.push(f); t += VAL[f]; }
      if (out.filter(x => x === "r").length <= 1 && out.length > 1 && (!deve || out.includes(deve))) break;
    }
    return out;
  }
  const comeToken = f => f.map(x => TOK[x]).join(" ");
  const num = i => el("div", { style: { fontSize: "14pt", fontWeight: 600, width: "6mm", color: "var(--inch)" } }, String(i));
  function righe(corpo, a, tempo, figure, quante, deve, opz) {
    const b = +tempo.split("/")[0];
    for (let i = 0; i < quante; i++) {
      const n = b === 4 ? 2 : b === 3 ? 3 : 4;
      const misure = Array.from({ length: n }, (_, k) => comeToken(battuta(a.rnd, b, figure, k % 2 === 0 ? deve : null)));
      const r = el("div", { class: "riga", style: { gap: "2mm" } }, num(i + 1)); corpo.appendChild(r);
      const box = el("div"); r.appendChild(box);
      S.battute(box, Object.assign({ larg: S.LARGHEZZA - mm(9), spazio: mm(4.6), unaLinea: true, chiave: false, tempo, misure, sopra: 2.4, sotto: 0, battitiMisura: b }, opz || {}));
    }
  }
  function spiega(corpo, html, figure, sillaba) {
    const r = el("div", { class: "riquadro tinta riga", style: { gap: "5mm", justifyContent: "center" } }); corpo.appendChild(r);
    const b = el("div"); r.appendChild(b);
    S.battute(b, { larg: mm(46), spazio: mm(5.5), unaLinea: true, chiave: false, misure: [figure], sopra: 2.6, sotto: 0, fine: false, senzaStanghette: true });
    if (sillaba) r.appendChild(el("div", { style: { fontSize: "22pt", fontWeight: 600, color: "var(--inch)" } }, sillaba));
    r.appendChild(el("div", { class: "testo", html }));
  }
  const nomeAlt = n => n.nome + (n.alt === "#" ? "♯" : n.alt === "b" ? "♭" : "");

  /* ---------------- GRAFIA ---------------- */
  sch({ codice: "5G-01", titolo: "Ricopia un brano intero", consegna: "Ricopia il brano con tutti i segni: chiave, tempo, note, pause, ritornelli e doppia stanghetta." }, async (corpo) => {
    await M.brano(corpo, 8, { interna: 700, perRiga: 4 });
    for (let r = 0; r < 3; r++) { const v = el("div"); corpo.appendChild(v); S.pentagramma(v, { spazio: mm(4.4), sopra: 2.2, sotto: 2.2 }); }
  });
  sch({ codice: "5G-02", titolo: "La chiave di basso", consegna: "La chiave di basso parte dal <b>4° rigo</b> (il rigo del fa) e ha due puntini intorno a quel rigo. Ripassa e disegna." }, (corpo) => {
    const b0 = el("div", { class: "riga", style: { gap: "6mm", justifyContent: "center" } }); corpo.appendChild(b0);
    const sx = el("div"); b0.appendChild(sx);
    const P0 = S.pentagramma(sx, { larg: mm(60), spazio: mm(11), sopra: 0.6, sotto: 0.8 });
    P0.add("line", { x1: 0, x2: P0.W, y1: P0.yRigo(3), y2: P0.yRigo(3), stroke: S.col() ? "#BED958" : "#000", "stroke-width": 1.6 });
    S.glifo(P0, 10, P0.yRigo(3), "fClef"); S.partenza(P0, 13, P0.yRigo(3), 1);
    b0.appendChild(el("div", { class: "testo", html: "Si chiama anche <b>chiave di fa</b>.<br>Serve per le note gravi:<br>violoncello, contrabbasso, fagotto,<br>la mano sinistra del pianoforte." }));
    for (let r = 0; r < 4; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(5.5), sopra: 1, sotto: 1.6 });
      M.posti(P, 7, 4).forEach((x, i) => {
        if (r < 2 || i === 0) S.glifo(P, x - 8, P.yRigo(3), "fClef", S.GRIGIO_FANTASMA);
        else S.partenza(P, x - 5, P.yRigo(3));
      });
    }
  });
  sch({ codice: "5G-03", titolo: "Il correttore di bozze", consegna: "In ogni riquadro c'è un errore. Cerchialo e scrivi come si corregge.", icona: "lente", sol: true }, (corpo, a) => {
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "5mm" } }); corpo.appendChild(g);
    const casi = [
      ["Troppi battiti: in 3/4 ne servono 3", c => { const o = S.battute(c, { larg: mm(80), spazio: mm(4.4), tempo: "3/4", misure: ["q:g4 q:a4 q:b4 q:c5"], sopra: 2.4, sotto: 2, proporzionale: false }); return o; }],
      ["Il bemolle va prima della nota", c => { const P = S.pentagramma(c, { larg: mm(80), spazio: mm(4.4), chiave: "nera", sopra: 2.4, sotto: 2 }); S.figura(P, 60, 4, "4", "piena", false); S.glifo(P, 70, P.y(4), "accidentalFlat"); S.figura(P, 110, 3, "4", "piena", true); return { P, x: 74, y: P.y(4) }; }],
      ["La coda della croma va a destra", c => { const P = S.pentagramma(c, { larg: mm(80), spazio: mm(4.4), chiave: "nera", sopra: 4, sotto: 2 }); S.figura(P, 60, 1, "8", "piena", true); S.testa(P, 100, 2, "piena"); const g2 = S.gambo(P, 100, 2, true); P.add("path", { d: `M${g2.x} ${g2.y} c -1 6 -9 8 -8 18`, fill: "none", stroke: "#111", "stroke-width": 2.2 }); return { P, x: 98, y: g2.y + 9 }; }],
      ["La pausa di minima sta sopra il 3° rigo", c => { const P = S.pentagramma(c, { larg: mm(80), spazio: mm(4.4), chiave: "nera", sopra: 2.4, sotto: 2 }); S.figura(P, 60, 2, "2", "piena", true); P.add("rect", { x: 96, y: P.yRigo(2), width: 10, height: 5, fill: "#111" }); return { P, x: 101, y: P.yRigo(2) + 2 }; }],
      ["Mancano battiti: in 4/4 ne servono 4", c => { const o = S.battute(c, { larg: mm(80), spazio: mm(4.4), tempo: "4/4", misure: ["q:e4 q:g4 q:c5"], sopra: 2.4, sotto: 2, proporzionale: false }); return o; }],
      ["Il punto va nello spazio, non sul rigo", c => { const P = S.pentagramma(c, { larg: mm(80), spazio: mm(4.4), chiave: "nera", sopra: 2.4, sotto: 2 }); S.figura(P, 70, 2, "2", "piena", true); P.add("circle", { cx: 81, cy: P.y(2), r: 1.6, fill: "#111" }); return { P, x: 81, y: P.y(2) }; }]
    ];
    casi.forEach(([spieg, f], i) => {
      const c = el("div", { class: "riquadro" }); g.appendChild(c);
      c.appendChild(el("div", { style: { fontWeight: 600, color: "var(--inch)" } }, String(i + 1)));
      const r = f(c);
      if (a.sol && r && r.P) r.P.add("circle", { cx: r.x, cy: r.y, r: 11, fill: "none", stroke: "#c00", "stroke-width": 1.2 });
      c.appendChild(el("div", { class: a.sol ? "sol" : "", style: { borderBottom: ".3mm solid #999", minHeight: "8mm", fontSize: "11pt" } }, a.sol ? spieg : ""));
    });
  });
  sch({ codice: "5G-04", titolo: "Come si scrive bene la musica", consegna: "Ritaglia la mini guida e incollala nel quaderno di musica. Ce ne sono due: una è per un compagno!", icona: "forbici" }, (corpo) => {
    corpo.classList.add("alto");
    const regole = [["violino", "La <b>chiave</b> all'inizio di ogni pentagramma; il <b>tempo</b> solo nel primo."],
      ["matita", "Le <b>teste</b>: sul rigo tagliate a metà, nello spazio tra due righi."],
      ["pollice", "<b>Gambi</b>: sotto il 3° rigo in su a destra, sopra in giù a sinistra. Lunghi tre spazi."],
      ["nota", "<b>Code</b> sempre a destra; crome unite a gruppi di un battito."],
      ["lente", "<b>♯ ♭ ♮</b> prima della nota, alla stessa altezza. Il <b>punto</b> sempre in uno spazio."],
      ["sveglia", "In ogni <b>battuta</b> i battiti giusti. Alla fine la <b>doppia stanghetta</b>."]];
    for (let k = 0; k < 2; k++) {
      const box = el("div", { class: "carta", style: { flex: 1, padding: "4mm 6mm", alignItems: "stretch", justifyContent: "flex-start", gap: "1.8mm" } }); corpo.appendChild(box);
      box.appendChild(el("div", { style: { fontSize: "16pt", fontWeight: 600, color: "var(--inch)" } }, "Mini guida: scrivere bene la musica"));
      regole.forEach(([ic, t]) => box.appendChild(el("div", { class: "riga", style: { gap: "3mm", fontSize: "12pt", lineHeight: 1.25 } }, img(ic, 8), el("span", { html: t }))));
    }
  });

  /* ---------------- NOTE ---------------- */
  sch({ codice: "5N-01", titolo: "Tutte le note", consegna: "Scrivi il nome di ogni nota, dal do grave al sol acuto. Prova a farlo sempre più velocemente!", sol: true }, (corpo, a) => {
    M.righeNote(corpo, a.rnd.serie(ESTESA, 40), { perRiga: 10, spazio: 4.8, stile: "piena", sol: a.sol, sotto: 3.6, sopra: 1.8 });
  });
  const MELODIA_SOL = ["q:g4 q:a4 q:b4 q:g4", "q:f#4 q:g4 h:a4", "q:b4 q:c5 q:d5 q:b4", "q:a4 q:f#4 h:g4", "q:d5 q:c5 q:b4 q:a4", "q:g4 q:f#4 q:e4 q:f#4", "q:g4 q:b4 q:a4 q:f#4", "w:g4"];
  sch({ codice: "5N-02", titolo: "A caccia di fa diesis", consegna: "In questo brano cerchia tutti i <b>fa♯</b>. Poi suonalo con il flauto!", icona: "lente", sol: true }, (corpo, a) => {
    for (let r = 0; r < 3; r++) {
      const b = el("div"); corpo.appendChild(b);
      const out = S.battute(b, { spazio: mm(5.4), tempo: r === 0 ? "4/4" : null, misure: MELODIA_SOL.slice(r * 3, r * 3 + 3), sopra: 2.4, sotto: 2.6, fine: r === 2 });
      if (a.sol) out.note.forEach(q => { if (q.t.n && q.t.n.l === "f") out.ctx.svg.appendChild(S.sv("circle", { cx: q.x, cy: q.sn.getYs()[0], r: 11, fill: "none", stroke: "#c00", "stroke-width": 1.4 })); });
    }
    const n = MELODIA_SOL.join(" ").split(" ").filter(t => t.includes("f#")).length;
    corpo.appendChild(el("div", { class: "testo centro" }, "Quanti fa♯ hai trovato? ", el("span", { class: "box-risposta" }, a.sol ? String(n) : "")));
    const r = el("div", { class: "riga", style: { justifyContent: "center", gap: "8mm" } }); corpo.appendChild(r);
    M.cartaFlauto(r, "f#4", { larg: 36, schema: 14 });
    r.appendChild(el("div", { class: "testo", html: "Sul flauto il <b>fa♯</b> si fa<br>così: guarda lo schema." }));
  });
  sch({ codice: "5N-03", titolo: "Il diesis in chiave", consegna: "Il diesis scritto <b>vicino alla chiave</b> vale per tutto il brano: ogni fa diventa fa♯. Scrivi il nome delle note.", sol: true }, (corpo, a) => {
    M.consiglio(corpo, "Il diesis in chiave sta sul <b>5° rigo</b>, il rigo del fa: vale per tutti i fa, in ogni battuta, anche se non c'è scritto.", "gufo");
    for (let r = 0; r < 3; r++) {
      const b = el("div"); corpo.appendChild(b);
      const mis = MELODIA_SOL.slice(r * 3, r * 3 + 3);
      const out = S.battute(b, { spazio: mm(5), armatura: "G", tempo: r === 0 ? "4/4" : null, misure: mis, sopra: 2.2, sotto: 4, fine: r === 2 });
      out.note.forEach(q => { if (!q.t.n) return; const d = out.scritta(q.x, out.yRigo0 + 26, a.sol ? nomeAlt(q.t.n) : ""); d.className = "sopra linea-risposta"; d.style.minWidth = mm(11) + "px"; d.style.fontSize = "12pt"; });
    }
  });

  /* ---------------- RITMO ---------------- */
  sch({ codice: "5R-01", titolo: "Semiminima puntata e croma", consegna: "Leggi e batti: <b>ta-a-i ti</b>. La semiminima puntata dura un battito e mezzo.", icona: "mani" }, (corpo, a) => {
    spiega(corpo, "semiminima (1) + punto (½) = <b>1 battito e ½</b>.<br>Con la croma fa 2 battiti.", "q.:x 8:x", "TA-A-I TI");
    righe(corpo, a, "4/4", ["q", "88", "h", "q.8"], 3, "q.8", { cuori: true, sopra: 3.4 });
    righe(corpo, a, "3/4", ["q", "88", "h", "q.8"], 2, "q.8", { cuori: true, sopra: 3.4 });
  });
  sch({ codice: "5R-02", titolo: "Le semicrome", consegna: "Quattro semicrome in un battito: <b>ti-ri-ti-ri</b>. Leggi e batti, prima piano piano.", icona: "mani" }, (corpo, a) => {
    spiega(corpo, "<b>4 semicrome = 1 battito</b>.<br>Hanno due travi: sono velocissime!", "16:x 16:x 16:x 16:x", "TI-RI-TI-RI");
    righe(corpo, a, "2/4", ["q", "88", "16", "h"], 6, "16", { sopra: 2.6 });
  });
  sch({ codice: "5R-03", titolo: "L'anacrusi", consegna: "Alcuni brani cominciano <b>prima del primo battito</b>: è l'anacrusi. Su quale battito comincia ogni riga?", icona: "orecchio", sol: true }, (corpo, a) => {
    M.consiglio(corpo, "Esempio: in 3/4 la melodia parte sul <b>3° battito</b>. L'ultima battuta del brano «restituisce» i battiti che mancano all'inizio.", "gufo");
    const casi = [["3/4", ["q:x"], 3], ["4/4", ["q:x"], 4], ["4/4", ["8:x 8:x"], 4], ["2/4", ["q:x"], 2], ["3/4", ["8:x 8:x"], 3], ["4/4", ["q:x q:x"], 3]];
    casi.forEach(([tempo, ana, giusto], i) => {
      const b = +tempo.split("/")[0];
      const r = el("div", { class: "riga", style: { gap: "2mm" } }, num(i + 1)); corpo.appendChild(r);
      const box = el("div"); r.appendChild(box);
      const misure = [ana[0], comeToken(battuta(a.rnd, b, ["q", "88", "h"])), comeToken(battuta(a.rnd, b, ["q", "88", "h"]))];
      S.battute(box, { larg: mm(140), spazio: mm(4.4), unaLinea: true, chiave: false, tempo, misure, sopra: 2.4, sotto: 0, battitiMisura: b, anacrusi: true });
      r.appendChild(el("span", { class: "piccolo" }, "battito:"));
      r.appendChild(el("span", { class: "box-risposta", style: { minWidth: "10mm" } }, a.sol ? String(giusto) : ""));
    });
  });
  sch({ codice: "5R-04", titolo: "La sincope", consegna: "Nella sincope l'accento arriva <b>tra un battito e l'altro</b>: <b>ti-ta-ti</b>. Leggi e batti tenendo il battito con il piede.", icona: "mani" }, (corpo, a) => {
    spiega(corpo, "croma + semiminima + croma = <b>2 battiti</b>.<br>La semiminima in mezzo è «a cavallo» del battito.", "8:x q:x 8:x", "TI-TA-TI");
    righe(corpo, a, "4/4", ["q", "88", "h", "8q8"], 3, "8q8", { cuori: true, sopra: 3.4 });
    righe(corpo, a, "2/4", ["q", "88", "8q8"], 2, "8q8", { cuori: true, sopra: 3.4 });
  });
  sch({ codice: "5R-05", titolo: "Il ritmo delle parole", consegna: "Dì la frase battendo le mani: ogni sillaba è un suono. Scrivi il ritmo sulla riga. Il primo è già fatto.", icona: "bocca" }, (corpo) => {
    const frasi = ["Can-ta can-ta la ci-ca-la", "Nel bo-sco c'è un gu-fo", "Pio-ve sul ve-tro", "Ca-val-li-no ar-ri", "Tre pul-ci-ni gial-li", "Fi-nal-men-te è sa-ba-to!"];
    frasi.forEach((f, i) => {
      corpo.appendChild(el("div", { class: "testo", style: { fontWeight: 500 } }, `${i + 1}. ${f}`));
      const b = el("div"); corpo.appendChild(b);
      S.battute(b, { spazio: mm(4.4), unaLinea: true, chiave: false, tempo: "4/4", misure: i === 0 ? ["8:x 8:x 8:x 8:x q:x 8:x 8:x", "h:x h:r"] : ["", ""], sopra: 3, sotto: 0, battitiMisura: 4, stile: i === 0 ? "grigio" : null });
    });
  });

  /* ---------------- STRUMENTI ---------------- */
  sch({ codice: "5S-01", titolo: "Nuove note sul flauto", consegna: "Il <b>do acuto</b>, il <b>re acuto</b>, il <b>fa♯</b> e il <b>si♭</b>: guarda le diteggiature e prova a suonarle.", icona: "flauto" }, (corpo) => {
    const r = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "4mm" } }); corpo.appendChild(r);
    [["c5", true], ["d5", true], ["f#4"], ["bb4"]].forEach(([k, ac]) => M.cartaFlauto(r, k, { larg: 36, schema: 14, acuto: ac }));
    M.consiglio(corpo, "Per il <b>re acuto</b> si stacca anche il pollice: soffia ancora più piano.", "flauto");
    M.consiglio(corpo, "Il <b>si♭</b> si suona con le «forchette»: pollice, indice e poi due dita più in basso, saltando il medio.", "gufo");
  });
  sch({ codice: "5S-02", titolo: "Brani da suonare", consegna: "Suona i brani con il flauto. Sul sito musicascuole.it trovi la base per suonare insieme.", icona: "flauto" }, async (corpo, a) => {
    corpo.classList.add("alto");
    await M.brano(corpo, 19, { colori: true, interna: 640, schema: true, larghSchema: 90 });
    const p2 = a.altraPagina("2"); p2.classList.add("alto");
    await M.brano(p2, 24, { colori: true, interna: 640, schema: true, larghSchema: 90 });
  });
  sch({ codice: "5S-03", titolo: "Carta d'identità dello strumento", consegna: "Scegli uno strumento dell'orchestra, cerca le informazioni e compila la sua carta d'identità.", icona: "violino" }, (corpo) => {
    corpo.classList.add("alto");
    for (let k = 0; k < 2; k++) {
      const c = el("div", { class: "riquadro", style: { flex: 1, display: "grid", gridTemplateColumns: "1fr 58mm", gap: "3mm 6mm" } }); corpo.appendChild(c);
      const campi = el("div", { style: { display: "flex", flexDirection: "column", justifyContent: "space-between" } });
      ["Nome", "Famiglia", "Materiale", "Come si suona", "Suono (acuto, grave…)", "Un brano in cui si sente"].forEach(t =>
        campi.appendChild(el("div", { class: "riga", style: { gap: "2mm", fontSize: "12pt" } }, el("b", { style: { whiteSpace: "nowrap" } }, t + ":"), el("div", { style: { flex: 1, borderBottom: ".3mm solid #999", height: "7mm" } }))));
      c.appendChild(campi);
      c.appendChild(el("div", { style: { border: ".4mm dashed #999", borderRadius: "3mm", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "2mm", color: "var(--grigio)", fontSize: "11pt" } }, "disegno"));
    }
  });

  /* ---------------- ASCOLTO ---------------- */
  sch({ codice: "5A-01", titolo: "Dettato ritmico", consegna: "L'insegnante batte un ritmo due volte. Scrivilo nelle battute: prima in 2/4, poi in 4/4.", icona: "orecchio", sol: true }, (corpo, a) => {
    [["2/4", 4], ["2/4", 4], ["2/4", 4], ["4/4", 2], ["4/4", 2], ["4/4", 2]].forEach(([tempo, n], i) => {
      const b = +tempo.split("/")[0];
      const misure = Array.from({ length: n }, () => comeToken(battuta(a.rnd, b, ["q", "88", "h", "r"])));
      corpo.appendChild(el("div", { class: "testo", style: { fontWeight: 500 } }, `Dettato ${i + 1}`));
      const box = el("div"); corpo.appendChild(box);
      S.battute(box, { spazio: mm(4.6), unaLinea: true, chiave: false, tempo, misure: a.sol ? misure : misure.map(() => ""), sopra: 2.4, sotto: 0, battitiMisura: b });
    });
  });
  sch({ codice: "5A-02", titolo: "Ascolto guidato: la forma A-B-A", consegna: "Ascolta un brano in tre parti. In ogni riquadro scrivi che cosa senti: strumenti, piano o forte, veloce o lento, carattere.", icona: "orecchio" }, (corpo) => {
    corpo.appendChild(el("div", { class: "testo" }, "Titolo del brano: ", el("span", { style: { display: "inline-block", width: "120mm", borderBottom: ".4mm solid #999" } })));
    ["A", "B", "A"].forEach((l, i) => {
      const c = el("div", { class: "riquadro riga", style: { gap: "4mm", alignItems: "stretch" } }); corpo.appendChild(c);
      c.appendChild(el("div", { style: { fontSize: "34pt", fontWeight: 700, color: "var(--inch)", width: "14mm", display: "flex", alignItems: "center" } }, l));
      const campi = el("div", { style: { flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2mm 5mm", fontSize: "11.5pt" } });
      ["Strumenti", "Piano o forte?", "Veloce o lento?", "Carattere (allegro, triste…)"].forEach(t => campi.appendChild(el("div", null, el("b", null, t), el("div", { style: { borderBottom: ".3mm solid #999", height: "8mm" } }))));
      c.appendChild(campi);
      c.appendChild(el("div", { style: { width: "34mm", border: ".4mm dashed #999", borderRadius: "3mm", color: "var(--grigio)", fontSize: "10pt", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "1mm" } }, "disegno o colore"));
    });
    M.consiglio(corpo, "La parte <b>A</b> torna alla fine: che cosa è uguale? Che cosa cambia? Molti minuetti, marce e canzoni hanno questa forma.", "gufo");
  });

  /* ---------------- CREATIVITÀ ---------------- */
  sch({ codice: "5C-01", titolo: "Il mio brano", consegna: "Componi un brano di <b>8 battute</b> per flauto. Scegli il tempo, scrivi il titolo e il tuo nome come compositore.", icona: "lampadina" }, (corpo) => {
    corpo.appendChild(el("div", { class: "riga", style: { gap: "6mm", fontSize: "14pt" } }, el("span", null, "Titolo ", el("span", { style: { display: "inline-block", width: "80mm", borderBottom: ".4mm solid #999" } })),
      el("span", null, "di ", el("span", { style: { display: "inline-block", width: "55mm", borderBottom: ".4mm solid #999" } }))));
    for (let r = 0; r < 2; r++) { const b = el("div"); corpo.appendChild(b); S.battute(b, { spazio: mm(6.2), misure: ["", "", "", ""], sopra: 2.8, sotto: 3, fine: r === 1 }); }
    corpo.appendChild(el("div", { class: "riquadro tinta", style: { fontSize: "12.5pt", lineHeight: "1.6" }, html:
      "<b>Prima di consegnare</b><br>☐ il tempo è scritto all'inizio e ogni battuta ha i battiti giusti<br>☐ uso solo note che so suonare (sol la si do re, fa♯, si♭)<br>" +
      "☐ la melodia finisce sulla nota da cui è partita<br>☐ c'è almeno una figura puntata e una pausa<br>☐ ho suonato il brano a un compagno" }));
  });
  sch({ codice: "5C-02", titolo: "Dalla filastrocca al ritmo", consegna: "Leggi la filastrocca battendo le mani, poi scrivi il ritmo di ogni verso sulla riga sotto.", icona: "bocca" }, (corpo) => {
    const versi = ["Sotto il pon-te pas-sa l'ac-qua", "Por-ta via la fo-glia gial-la", "Gi-ra gi-ra il mu-li-no", "Fa la fa-ri-na per il pa-ni-no"];
    corpo.appendChild(el("div", { class: "riquadro tinta testo centro", style: { lineHeight: 1.6 } }, ...versi.map(v => el("div", null, v.replace(/-/g, "")))));
    versi.forEach(v => {
      corpo.appendChild(el("div", { class: "testo", style: { fontWeight: 500 } }, v));
      const b = el("div"); corpo.appendChild(b);
      S.battute(b, { spazio: mm(4.6), unaLinea: true, chiave: false, tempo: "4/4", misure: ["", ""], sopra: 2.6, sotto: 0, battitiMisura: 4 });
    });
  });

  /* ---------------- RITAGLIA E GIOCA ---------------- */
  sch({ codice: "5X-01", titolo: "Tombola delle note (difficile)", consegna: "Ritaglia le cartelle. L'insegnante dice il nome di una nota, anche con ♯ o ♭: se c'è, coprila!", icona: "forbici" }, (corpo) => {
    const tutte = ESTESA.concat(["f#4", "bb4", "f#5", "c#5"]);
    M.carte(corpo, 2, 2, (c, i) => {
      const r = S.caso("5X-01-" + i);
      const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(3, 1fr)", gap: "1.2mm", width: "94%" } });
      r.mescola(tutte).slice(0, 9).forEach(k => { const cc = el("div", { style: { border: ".3mm solid var(--bordo)", borderRadius: "2mm", display: "flex", justifyContent: "center" } }); g.appendChild(cc); M.notaInCarta(cc, k, 27, 2.4); });
      c.appendChild(g);
    }, { gap: 3 });
  });
  sch({ codice: "5X-02", titolo: "Quiz a squadre", consegna: "Ritaglia le carte. A turno una squadra pesca e legge la domanda all'altra. La risposta è capovolta in basso.", icona: "forbici" }, (corpo) => {
    const qa = [["Quanti righi ha il pentagramma?", "5"], ["Quanti battiti vale la minima puntata?", "3"], ["Che cosa fa il diesis?", "alza di un semitono"], ["Dove sta il sol in chiave di violino?", "2° rigo"],
      ["Quante semicrome in un battito?", "4"], ["Tra mi e fa c'è un tono o un semitono?", "semitono"], ["Che cosa vuol dire «f»?", "forte"], ["Come si chiama la nota sotto il pentagramma con il taglio?", "do"],
      ["In 3/4 quanti battiti per battuta?", "3"], ["Che cosa unisce la legatura di valore?", "due note uguali"], ["Che famiglia è la tromba?", "ottoni"], ["Il punto allunga la nota di…", "metà del suo valore"]];
    M.carte(corpo, 3, 4, (c, i) => {
      c.style.justifyContent = "space-between"; c.style.padding = "3mm";
      c.appendChild(el("div", { style: { fontSize: "13pt", fontWeight: 600, textAlign: "center", marginTop: "3mm" } }, qa[i][0]));
      c.appendChild(el("div", { style: { fontSize: "10pt", color: "var(--grigio)", transform: "rotate(180deg)", borderTop: ".3mm dashed #bbb", paddingTop: "1mm", width: "100%", textAlign: "center" } }, qa[i][1]));
    }, { gap: 0 });
  });

  /* ---------------- VERIFICA ---------------- */
  sch({ codice: "5V-01", titolo: "Pronto per le medie", consegna: "L'ultima verifica della primaria: fai con calma e ricontrolla. In bocca al lupo!", icona: "stella", sol: true }, (corpo, a) => {
    corpo.classList.add("alto");
    corpo.appendChild(M.etichetta("1. Scrivi il nome delle note (c'è il diesis in chiave!)."));
    const b = el("div"); corpo.appendChild(b);
    const out = S.battute(b, { spazio: mm(5), armatura: "G", tempo: "3/4", misure: ["q:g4 q:f#4 q:a4", "h:d5 q:c5", "q:b4 q:e5 q:f#5", "h.:g4"], sopra: 1.8, sotto: 3.6 });
    out.note.forEach(q => { const d = out.scritta(q.x, out.yRigo0 + 24, a.sol ? nomeAlt(q.t.n) : ""); d.className = "sopra linea-risposta"; d.style.minWidth = mm(11) + "px"; d.style.fontSize = "12pt"; });
    corpo.appendChild(M.etichetta("2. Metti le stanghette (tempo 4/4)."));
    const b2 = el("div"); corpo.appendChild(b2);
    const toks = "q.:x 8:x q:x q:x 8:x q:x 8:x h:x 16:x 16:x 16:x 16:x q:x h:x";
    const o2 = S.battute(b2, { spazio: mm(4.4), unaLinea: true, chiave: false, tempo: "4/4", misure: [toks], sopra: 2.4, sotto: 0, battitiMisura: 12 });
    if (a.sol) { const m = o2.misure[0]; [4, 8].forEach(k => { const x = m.x0 + (k / 12) * m.larg - 4; o2.ctx.svg.appendChild(S.sv("line", { x1: x, x2: x, y1: o2.yLinea - 12, y2: o2.yLinea + 12, stroke: "#c00", "stroke-width": 1.4 })); }); }
    corpo.appendChild(M.etichetta("3. Quanti battiti?"));
    const r = el("div", { class: "riga", style: { justifyContent: "space-around" } }); corpo.appendChild(r);
    [["q.:x 8:x", "2"], ["16:x 16:x 16:x 16:x", "1"], ["8:x q:x 8:x", "2"], ["h.:x", "3"]].forEach(([t, v]) => {
      const c = el("div", { class: "riquadro riga", style: { gap: "1mm", padding: "2mm" } }); r.appendChild(c);
      const f = el("div"); c.appendChild(f); S.battute(f, { larg: mm(22), spazio: mm(3.4), unaLinea: true, chiave: false, misure: [t], sopra: 2.4, sotto: 0, fine: false, senzaStanghette: true });
      c.appendChild(el("span", { class: "box-risposta", style: { minWidth: "10mm" } }, a.sol ? v : ""));
    });
    corpo.appendChild(M.etichetta("4. Vero o falso?"));
    const vf = [["Il bequadro toglie il diesis o il bemolle.", "V"], ["Il flauto dolce è un ottone.", "F"], ["Tra si e do c'è un semitono.", "V"], ["L'anacrusi è la nota più acuta del brano.", "F"]];
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "2mm 5mm" } }); corpo.appendChild(g);
    vf.forEach(([t, v]) => g.appendChild(el("div", { class: "riga", style: { justifyContent: "space-between", fontSize: "12pt" } }, el("span", null, t), M.caselle(["V", "F"], v, a.sol))));
  });
  sch({ codice: "5V-02", titolo: "Diploma di musica della primaria", consegna: false }, (corpo) => {
    M.diploma(corpo, "Diploma di musica", "perché in questi cinque anni ha imparato ad ascoltare, leggere, scrivere e suonare la musica. Ora è pronto per le medie!", "coppa");
  });
})();
