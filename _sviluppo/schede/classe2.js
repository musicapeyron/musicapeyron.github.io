/* Schede della classe 2ª — I primi segni e le prime note (sol, mi, la, poi fa e si) */
(function () {
  "use strict";
  const S = Schede, M = Modelli, { el, img, nota, COLORI, NOMI } = S, mm = M.mm;
  const C = 2;
  const sch = (meta, f) => S.scheda(C, meta, f);

  S.titoloClasse(C, {
    sottotitolo: "I primi segni e le prime note: il pentagramma, la chiave di violino, sol, mi, la, fa, si, ta e ti-ti.",
    guida: "<b>Per l'insegnante.</b> Le schede seguono l'ordine del percorso: grafia, note, ritmo, ascolto. Ogni segno nuovo si mostra prima alla LIM, " +
      "poi si ripassa sul tratteggio e infine si scrive a mano libera. Le soluzioni sono in un fascicolo a parte."
  });

  /* ---------------- GRAFIA ---------------- */
  sch({ codice: "2G-01", titolo: "Righi e spazi", consegna: "Il pentagramma ha 5 <b>righi</b> e 4 <b>spazi</b>. Si contano dal basso. Scrivi i numeri nelle caselle.", sol: true }, (corpo, a) => {
    const riga = el("div", { class: "riga", style: { gap: "5mm", alignItems: "center" } });
    corpo.appendChild(riga);
    const sx = el("div"); riga.appendChild(sx);
    const P = S.pentagramma(sx, { larg: mm(120), spazio: mm(14), sopra: 1.2, sotto: 0.8 });
    for (let i = 0; i < 5; i++) {
      const b = S.scritta(P, P.W - 4, P.yRigo(i), a.sol ? String(i + 1) : "", { width: mm(12) + "px", height: mm(10) + "px", lineHeight: mm(10) + "px" });
      b.className = "sopra box-risposta"; b.style.left = (P.px(P.W) + mm(11)) + "px";
      b.style.minWidth = mm(12) + "px";
    }
    for (let i = 0; i < 4; i++) {
      const b = S.scritta(P, P.W - 4, (P.yRigo(i) + P.yRigo(i + 1)) / 2, a.sol ? String(i + 1) : "");
      b.className = "sopra box-risposta"; b.style.left = (P.px(P.W) + mm(30)) + "px"; b.style.minWidth = mm(12) + "px"; b.style.height = mm(10) + "px"; b.style.lineHeight = mm(10) + "px";
    }
    [["righi", 17], ["spazi", 36]].forEach(([t, d]) => { const e = S.scritta(P, P.W, P.yRigo(4) - 9, t, { fontSize: "13pt", fontWeight: 600, color: "var(--inch)" }); e.style.left = (P.px(P.W) + mm(d)) + "px"; });
    M.consiglio(corpo, "Si conta <b>dal basso</b>, come i piani di una casa: il 1° rigo è quello più in basso.", "casa");
    M.etichetta && corpo.appendChild(M.etichetta("Ripassa con un pastello:"));
    const lav = [["il 1° rigo", 0, "rigo"], ["il 2° spazio", 1, "spazio"], ["il 5° rigo", 4, "rigo"]];
    const g = el("div", { class: "riga", style: { gap: "6mm" } }); corpo.appendChild(g);
    lav.forEach(([t, i, tipo]) => {
      const c = el("div", { style: { flex: 1 } }, el("div", { class: "testo centro" }, t));
      g.appendChild(c);
      const Q = S.pentagramma(c, { larg: mm(56), spazio: mm(6), sopra: 1, sotto: 1 });
      if (a.sol) {
        if (tipo === "rigo") Q.add("line", { x1: 0, x2: Q.W, y1: Q.yRigo(i), y2: Q.yRigo(i), stroke: "#c00", "stroke-width": 2.2 });
        else Q.add("rect", { x: 0, y: Q.yRigo(i + 1), width: Q.W, height: 10, fill: "#c00", opacity: 0.35 });
      }
    });
  });

  function righeTesteTraccia(corpo, passi, sol) {
    /* riga 1: tutte tratteggiate; riga 2: una sì e una no; riga 3: solo un puntino guida */
    ["traccia", "alterna", "puntino"].forEach(modo => {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(9), sopra: 1.4, sotto: 1.4 });
      M.posti(P, passi.length, 6).forEach((x, i) => {
        const st = sol ? "piena" : modo === "traccia" ? "traccia" : modo === "alterna" ? (i % 2 ? "puntino" : "traccia") : "puntino";
        S.testa(P, x, passi[i], st);
      });
    });
  }
  sch({ codice: "2G-02", titolo: "Teste di nota sul rigo", consegna: "Ripassa le teste di nota, poi disegnale tu dove vedi il puntino." }, (corpo) => {
    M.consiglio(corpo, "La testa <b>sul rigo</b> è tagliata a metà dal rigo, come una polpetta infilzata sullo spiedino.", "gufo");
    righeTesteTraccia(corpo, [0, 2, 4, 6, 8, 8, 6, 4, 2, 0]);
  });
  sch({ codice: "2G-03", titolo: "Teste di nota nello spazio", consegna: "Ripassa le teste di nota, poi disegnale tu dove vedi il puntino." }, (corpo) => {
    M.consiglio(corpo, "La testa <b>nello spazio</b> sta seduta tra due righi e li tocca appena, come in un'amaca.", "gufo");
    righeTesteTraccia(corpo, [1, 3, 5, 7, 7, 5, 3, 1, 1, 3]);
  });

  sch({ codice: "2G-04", titolo: "Rigo o spazio?", consegna: "Sotto ogni nota fai una crocetta: <b>R</b> se è sul rigo, <b>S</b> se è nello spazio.", sol: true }, (corpo, a) => {
    const passi = a.rnd.serie([0, 1, 2, 3, 4, 5, 6, 7, 8], 16);
    for (let r = 0; r < 2; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(7), chiave: "nera", sopra: 1.4, sotto: 4 });
      M.posti(P, 8, 36).forEach((x, i) => {
        const p = passi[r * 8 + i];
        S.testa(P, x, p, "piena");
        const d = S.scritta(P, x, P.yRigo(0) + 26, ""); d.innerHTML = ""; d.appendChild(M.caselle(["R", "S"], p % 2 ? "S" : "R", a.sol));
      });
    }
    corpo.appendChild(M.etichetta("Disegna una testa di nota dove ti dice la scritta:"));
    const b = el("div"); corpo.appendChild(b);
    const P = S.pentagramma(b, { spazio: mm(7), chiave: "nera", sopra: 3.2, sotto: 1.6 });
    const chi = [[2, "2° rigo"], [3, "2° spazio"], [8, "5° rigo"], [1, "1° spazio"], [4, "3° rigo"], [7, "4° spazio"]];
    M.posti(P, chi.length, 36).forEach((x, i) => {
      S.scritta(P, x, P.yRigo(4) - 18, chi[i][1], { fontSize: "13pt", fontWeight: 600 });
      if (a.sol) S.testa(P, x, chi[i][0], "piena", "#c00");
    });
  });

  sch({ codice: "2G-05", titolo: "Teste vuote e teste piene", consegna: "Ripassa le teste vuote. Poi ripassa le teste piene e <b>colorale dentro</b>." }, (corpo) => {
    corpo.appendChild(M.etichetta("Teste <b>vuote</b>: un ovale leggero, un po' inclinato."));
    for (let r = 0; r < 2; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(8), sopra: 1.3, sotto: 1.3 });
      const passi = [0, 1, 2, 3, 4, 5, 6, 7, 8, 7];
      M.posti(P, 10, 6).forEach((x, i) => S.testa(P, x, passi[i], r === 0 || i % 2 === 0 ? "traccia" : "puntino"));
    }
    corpo.appendChild(M.etichetta("Teste <b>piene</b>: lo stesso ovale, poi lo coloro tutto di nero."));
    for (let r = 0; r < 2; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(8), sopra: 1.3, sotto: 1.3 });
      const passi = [8, 7, 6, 5, 4, 3, 2, 1, 0, 1];
      M.posti(P, 10, 6).forEach((x, i) => S.testa(P, x, passi[i], r === 0 || i % 2 === 0 ? "traccia" : "puntino"));
    }
  });

  function righeGambi(corpo, passi, su, sol, modelli) {
    for (let r = 0; r < 3; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(7), sopra: su ? 4 : 1.2, sotto: su ? 1.2 : 4 });
      M.posti(P, passi.length, 6).forEach((x, i) => {
        S.testa(P, x, passi[i], "piena");
        if (r === 0 && i < modelli) S.gambo(P, x, passi[i], su, "traccia");
        else if (r === 0 || sol) S.gambo(P, x, passi[i], su, sol && !(r === 0) ? "nero" : "traccia");
      });
    }
  }
  sch({ codice: "2G-06", titolo: "Gambi in su", consegna: "Ripassa i gambi. Poi aggiungi tu il gambo a ogni testa." }, (corpo) => {
    M.consiglio(corpo, "Il gambo <b>in su</b> parte dal lato <b>destro</b> della testa e sale dritto, lungo come tre spazi.", "gufo");
    righeGambi(corpo, [0, 1, 2, 3, 2, 1, 0, -1, 0, 2], true, false, 10);
  });
  sch({ codice: "2G-07", titolo: "Gambi in giù", consegna: "Ripassa i gambi. Poi aggiungi tu il gambo a ogni testa." }, (corpo) => {
    M.consiglio(corpo, "Il gambo <b>in giù</b> parte dal lato <b>sinistro</b> della testa e scende dritto, lungo come tre spazi.", "gufo");
    righeGambi(corpo, [8, 7, 6, 5, 4, 5, 6, 7, 8, 9], false, false, 10);
  });

  sch({ codice: "2G-08", titolo: "La regola del 3° rigo", consegna: "Aggiungi il gambo a ogni testa: <b>in su</b> o <b>in giù</b>? Guarda il 3° rigo.", sol: true }, (corpo, a) => {
    const b0 = el("div", { class: "riga", style: { gap: "5mm" } }); corpo.appendChild(b0);
    const sx = el("div"); b0.appendChild(sx);
    const P0 = S.pentagramma(sx, { larg: mm(100), spazio: mm(5.5), sopra: 4, sotto: 4 });
    P0.add("line", { x1: 0, x2: P0.W, y1: P0.yRigo(2), y2: P0.yRigo(2), stroke: S.col() ? "#009C95" : "#000", "stroke-width": 2.2 });
    [[1, true], [2, true], [3, true], [4, false], [5, false], [6, false], [7, false]].forEach(([p, su], i) => { S.figura(P0, 12 + i * 15, p, "4", "piena", su); });
    b0.appendChild(el("div", { class: "testo", style: { fontSize: "13pt" }, html: "Sotto il 3° rigo: gambo <b>in su</b>, a destra.<br>Sopra il 3° rigo: gambo <b>in giù</b>, a sinistra.<br>Sul 3° rigo: di solito <b>in giù</b>." }));
    const passi = a.rnd.serie([-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 20);
    for (let r = 0; r < 2; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(5.8), sopra: 4, sotto: 4 });
      M.posti(P, 10, 6).forEach((x, i) => {
        const p = passi[r * 10 + i];
        S.testa(P, x, p, "piena");
        if (a.sol) S.gambo(P, x, p, p < 4, "nero");
      });
    }
  });

  sch({ codice: "2G-09", titolo: "La chiave di violino", consegna: "Metti il dito sul puntino <b>1</b> e segui i numeri. Poi ripassa con la matita, piano piano." , icona: "matita" }, (corpo) => {
    const b = el("div", { class: "riga", style: { justifyContent: "center", gap: "4mm", alignItems: "center" } }); corpo.appendChild(b);
    const sx = el("div"); b.appendChild(sx);
    const P = S.pentagramma(sx, { larg: mm(100), spazio: mm(15), sopra: 2.2, sotto: 3.2, inizioChiave: 8, chiave: "fantasma" });
    P.add("line", { x1: 0, x2: P.W, y1: P.yRigo(1), y2: P.yRigo(1), stroke: S.col() ? "#009C95" : "#000", "stroke-width": S.col() ? 1.6 : 2 });
    S.disegnaChiave(P, 8, "puntini");
    S.scritta(P, P.W - 13, P.yRigo(1) - 3.5, "rigo del sol", { fontSize: "11pt", color: S.col() ? "#007a74" : "#000", fontWeight: 600 });
    const dx = el("div", { class: "riquadro tinta", style: { width: "68mm", fontSize: "13pt", lineHeight: "1.45" }, html:
      "<b>Filastrocca della chiave</b><br>Parto dal rigo del sol,<br>giro in tondo come un girasol,<br>salgo in alto fino in cima,<br>scendo giù dritto come prima,<br>in fondo un ricciolino:<br>la chiave di violino!" });
    b.appendChild(dx);
    M.consiglio(corpo, "La chiave di violino si chiama anche <b>chiave di sol</b>: il suo ricciolo abbraccia il 2° rigo, il rigo del sol.", "violino");
  });

  sch({ codice: "2G-10", titolo: "Chiavi sempre più piccole", consegna: "Ripassa la prima chiave di ogni riga, poi disegnane altre tre uguali." }, (corpo) => {
    [8, 6.5, 5, 4].forEach((sp, r) => {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(sp), sopra: 1.8, sotto: 2.9 });
      S.disegnaChiave(P, 6, "traccia");
      if (r < 2) S.disegnaChiave(P, P.W * 0.36, "fantasma");
    });
  });

  sch({ codice: "2G-11", titolo: "Ogni pentagramma ha la sua chiave", consegna: "Disegna la chiave di violino all'inizio di ogni pentagramma. La prima è da ripassare." }, (corpo) => {
    for (let r = 0; r < 6; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(4), sopra: 1.8, sotto: 2.9 });
      if (r === 0) S.disegnaChiave(P, 4, "traccia");
      else S.partenza(P, 22.5, P.yRigo(1) + 2.5);
    }
  });

  sch({ codice: "2G-12", titolo: "Stanghetta e doppia stanghetta", consegna: "Ripassa le stanghette tratteggiate. Poi disegna tu quelle che mancano." }, (corpo) => {
    const b0 = el("div"); corpo.appendChild(b0);
    const out = S.battute(b0, { spazio: mm(5.5), misure: ["q:g4 q:a4 h:g4", "q:e4 q:g4 h:a4", "q:g4 q:g4 h:e4"], sopra: 4.5, sotto: 4 });
    const st = out.staves;
    out.scritta(st[0].getX() + st[0].getWidth(), st[0].getYForLine(4) + 18, "↑ stanghetta", { fontSize: "12pt", fontWeight: 600, color: "var(--inch)" });
    out.scritta(st[2].getX() + st[2].getWidth() + 1, st[2].getYForLine(4) + 18, "doppia stanghetta finale ↑", { fontSize: "12pt", fontWeight: 600, color: "var(--inch)", transform: "translate(-100%,-50%)" });
    M.consiglio(corpo, "La <b>stanghetta</b> divide la musica in battute. La <b>doppia stanghetta</b> finale (una sottile e una grossa) dice: <i>fine!</i>", "gufo");
    for (let r = 0; r < 3; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(7), sopra: 1.2, sotto: 1.2 });
      const xs = M.posti(P, 9, 6);
      xs.forEach((x, i) => {
        const fine = i === 8;
        if (r === 0 || i < 2) S.stanghetta(P, fine ? P.W - 3 : x, fine ? "fine" : "semplice", "traccia");
        else if (r === 1 && i % 2 === 0) S.stanghetta(P, fine ? P.W - 3 : x, fine ? "fine" : "semplice", "traccia");
      });
    }
  });

  sch({ codice: "2G-13", titolo: "Semiminima e due crome", consegna: "Ripassa le figure tratteggiate. Nella riga vuota disegnale tu." }, (corpo) => {
    corpo.appendChild(M.etichetta("La <b>semiminima</b>: testa piena + gambo."));
    for (let r = 0; r < 2; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(5.5), sopra: 3.8, sotto: 1 });
      const passi = [2, 3, 1, 2, 0, 2, 3, 1, 2, 0];
      M.posti(P, 10, 6).forEach((x, i) => { if (r === 0 || i < 2) S.figura(P, x, passi[i], "4", "traccia", true); });
    }
    corpo.appendChild(M.etichetta("Le <b>due crome</b>: due semiminime che si tengono per mano con una trave."));
    for (let r = 0; r < 2; r++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(5.5), sopra: 3.8, sotto: 1 });
      const xs = M.posti(P, 10, 6);
      for (let i = 0; i < 10; i += 2) if (r === 0 || i < 2) S.coppiaCrome(P, xs[i], xs[i + 1] - 4, [2, 1, 3, 0, 2][i / 2], [2, 1, 3, 0, 2][i / 2], "traccia");
    }
  });

  sch({ codice: "2G-14", titolo: "La pausa di semiminima", consegna: "Parti dal puntino <b>1</b> e segui il tratteggio. Poi ripassa le pause più piccole." }, (corpo) => {
    const b = el("div", { class: "riga", style: { justifyContent: "center", gap: "8mm", alignItems: "center" } }); corpo.appendChild(b);
    const sx = el("div"); b.appendChild(sx);
    const P = S.pentagramma(sx, { larg: mm(70), spazio: mm(15), sopra: 0.8, sotto: 0.8 });
    S.pausaTraccia(P, 22, "puntini");
    b.appendChild(el("div", { class: "riquadro tinta", style: { width: "75mm", fontSize: "14pt", lineHeight: "1.5" }, html:
      "<b>Filastrocca della pausa</b><br>Scendo di sbieco, poi zig e zag,<br>una pancina, un ricciolin:<br>sono la pausa, non suono niente,<br>ssst! zitto zitto anche il tamburin." }));
    M.consiglio(corpo, "La <b>pausa di semiminima</b> vale un battito di silenzio: come una semiminima, ma senza suono.", "silenzio");
    [9, 7].forEach((sp, r) => {
      const bb = el("div"); corpo.appendChild(bb);
      const Q = S.pentagramma(bb, { spazio: mm(sp), sopra: 1, sotto: 1 });
      M.posti(Q, r ? 10 : 8, 6).forEach((x, i) => { if (r === 0 || i < 3) S.pausaTraccia(Q, x, "traccia"); });
    });
  });

  sch({ codice: "2G-15", titolo: "La minima", consegna: "La minima ha la <b>testa vuota</b> e il gambo. Ripassa, poi disegna tu." }, (corpo) => {
    for (let r = 0; r < 4; r++) {
      const b = el("div"); corpo.appendChild(b);
      const su = r % 2 === 0;
      const P = S.pentagramma(b, { spazio: mm(5.5), sopra: su ? 3.8 : 1, sotto: su ? 1 : 3.8 });
      const passi = su ? [0, 1, 2, 3, 2, 1, 0, 2] : [8, 7, 6, 5, 4, 5, 6, 8];
      M.posti(P, 8, 6).forEach((x, i) => { if (r < 2 || i < 2) S.figura(P, x, passi[i], "2", "traccia", su); else S.testa(P, x, passi[i], "puntino"); });
    }
    M.consiglio(corpo, "Ricorda: gambo <b>in su a destra</b>, gambo <b>in giù a sinistra</b>.", "gufo");
  });

  /* ---------------- NOTE ---------------- */
  sch({ codice: "2N-01", titolo: "Il sol", consegna: "Il sol abita sul <b>2° rigo</b>. Ripassa i sol e poi disegnane altri.", sol: true }, (corpo, a) => {
    M.presentaNota(corpo, "g", 4, "Abita sul <b>2° rigo</b>, il rigo abbracciato dal ricciolo della chiave di violino. Per questo la chiave si chiama anche <b>chiave di sol</b>.", a.sol);
  });
  sch({ codice: "2N-02", titolo: "Caccia al sol", consegna: "Trova tutti i <b>sol</b> e colorali. Poi contali.", icona: "lente", sol: true }, (corpo, a) => {
    M.legenda(corpo, ["g"]);
    const note = a.rnd.serie(["g4", "g4", "e4", "a4", "f4", "b4", "g4"], 32);
    M.righeNote(corpo, note, { perRiga: 8, spazio: 6.2, risposta: "nessuna", sol: a.sol, colora: ["g"], sopra: 1.6, sotto: 1.6 });
    const n = note.filter(x => x === "g4").length;
    corpo.appendChild(el("div", { class: "testo centro" }, "Quanti sol hai trovato? ", el("span", { class: "box-risposta" }, a.sol ? String(n) : "")));
  });
  sch({ codice: "2N-03", titolo: "Il mi", consegna: "Il mi abita sul <b>1° rigo</b>. Ripassa i mi e poi disegnane altri.", sol: true }, (corpo, a) => {
    M.presentaNota(corpo, "e", 4, "Abita sul <b>1° rigo</b>, il primo dal basso: è il piano terra del pentagramma.", a.sol);
  });
  sch({ codice: "2N-04", titolo: "Sol o mi?", consegna: "Colora ogni nota con il suo colore.", icona: "pastello", sol: true }, (corpo, a) => {
    M.legenda(corpo, ["e", "g"]);
    M.righeNote(corpo, a.rnd.serie(["g4", "e4"], 32), { perRiga: 8, spazio: 6.2, risposta: "nessuna", sol: a.sol, colora: ["g", "e"], sopra: 1.6, sotto: 1.6 });
  });
  sch({ codice: "2N-05", titolo: "Il la", consegna: "Il la abita nel <b>2° spazio</b>. Ripassa i la e poi disegnane altri.", sol: true }, (corpo, a) => {
    M.presentaNota(corpo, "a", 4, "Abita nel <b>2° spazio</b>, proprio sopra il sol: è il suo vicino di casa del piano di sopra.", a.sol);
  });
  sch({ codice: "2N-06", titolo: "Come si chiama?", consegna: "Scrivi il nome sotto ogni nota: <b>sol</b>, <b>la</b> o <b>mi</b>.", sol: true }, (corpo, a) => {
    M.righeNote(corpo, a.rnd.serie(["g4", "a4", "e4"], 21), { perRiga: 7, spazio: 6.5, stile: "piena", sol: a.sol, sotto: 3.4, sopra: 1.4 });
  });
  sch({ codice: "2N-07", titolo: "Disegna la nota", consegna: "Leggi il nome e disegna la nota al posto giusto.", sol: true }, (corpo, a) => {
    M.disegnaNote(corpo, a.rnd.serie(["g4", "a4", "e4"], 18), { perRiga: 6, spazio: 7, sol: a.sol });
  });

  sch({ codice: "2N-08", titolo: "Il labirinto dei sol", consegna: "Aiuta il pulcino a tornare a casa: può camminare <b>solo sui sol</b>. Colora la strada.", icona: "pulcino", sol: true }, (corpo, a) => {
    const R = 5, Cn = 6;
    /* strada da in alto a sinistra a in basso a destra */
    const strada = new Set(["0,0"]); let r = 0, c = 0;
    while (r < R - 1 || c < Cn - 1) {
      if (r === R - 1) c++; else if (c === Cn - 1) r++; else if (a.rnd.r() < 0.55) c++; else r++;
      strada.add(r + "," + c);
    }
    const altre = ["e4", "a4", "f4", "b4"];
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: `repeat(${Cn}, 1fr)`, gap: "2mm" } });
    corpo.appendChild(el("div", { class: "riga", style: { gap: "2mm" } }, img("pulcino", 13), el("span", { class: "testo" }, "Partenza")));
    corpo.appendChild(g);
    for (let i = 0; i < R; i++) for (let j = 0; j < Cn; j++) {
      const sulla = strada.has(i + "," + j);
      const cella = el("div", { class: "riquadro", style: { padding: "1.5mm", display: "flex", justifyContent: "center" } });
      if (a.sol && sulla) cella.style.background = S.col() ? "#d6f2ef" : "#ddd";
      g.appendChild(cella);
      const P = S.pentagramma(cella, { larg: mm(26), spazio: mm(4.3), chiave: "nera", sopra: 1.6, sotto: 1.6 });
      S.testa(P, 44, nota(sulla ? "g4" : a.rnd.pick(altre)).passo, "piena");
    }
    corpo.appendChild(el("div", { class: "riga", style: { gap: "2mm", justifyContent: "flex-end" } }, el("span", { class: "testo" }, "Arrivo"), img("casa", 13)));
  });

  sch({ codice: "2N-09", titolo: "Carte giganti: sol, la, mi", consegna: "Ritaglia la carta e piegala a metà: davanti la nota, dietro il nome.", icona: "forbici" }, (corpo, a) => {
    const fai = (cp, s) => {
      const n = nota(s);
      cp.classList.add("alto");
      const box = el("div", { style: { flex: 1, border: ".5mm dashed #999", borderRadius: "4mm", display: "flex", flexDirection: "column" } });
      cp.appendChild(box);
      const su = el("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" } });
      const giu = el("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", borderTop: ".5mm dashed #999", position: "relative" } });
      box.append(su, giu);
      const P = S.pentagramma(su, { larg: mm(150), spazio: mm(13), chiave: "nera", sopra: 1.2, sotto: 1.2 });
      S.testa(P, 70, n.passo, S.col() ? "colore" : "piena", COLORI[n.l]);
      giu.appendChild(el("div", { style: { transform: "rotate(180deg)", fontSize: "110pt", fontWeight: 600, color: S.col() ? S.scuro(COLORI[n.l], n.l === "e" ? 0.8 : 1) : "#000" } }, n.nome));
      giu.appendChild(el("div", { class: "piccolo", style: { position: "absolute", top: "-4mm", left: "50%", transform: "translateX(-50%)", background: "#fff", padding: "0 2mm" } }, "piega qui"));
    };
    fai(corpo, "g4"); fai(a.altraPagina("2"), "a4"); fai(a.altraPagina("3"), "e4");
  });

  sch({ codice: "2N-10", titolo: "Sale, scende o resta uguale?", consegna: "Guarda le due note: la melodia <b>sale</b>, <b>scende</b> o resta <b>uguale</b>? Fai una crocetta.", icona: "occhi", sol: true }, (corpo, a) => {
    const pool = ["e4", "f4", "g4", "a4", "b4"];
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(3, 1fr)", gap: "4mm" } });
    corpo.appendChild(el("div", { class: "riga", style: { justifyContent: "center", gap: "8mm", fontSize: "13pt" } },
      el("span", null, "↗ sale"), el("span", null, "↘ scende"), el("span", null, "→ uguale")));
    corpo.appendChild(g);
    for (let i = 0; i < 12; i++) {
      let x1 = a.rnd.pick(pool), x2 = a.rnd.r() < 0.18 ? x1 : a.rnd.pick(pool);
      const n1 = nota(x1), n2 = nota(x2);
      const giusta = n2.passo > n1.passo ? "↗" : n2.passo < n1.passo ? "↘" : "→";
      const c = el("div", { class: "riquadro", style: { padding: "2mm", display: "flex", flexDirection: "column", alignItems: "center", gap: "2mm" } });
      g.appendChild(c);
      const P = S.pentagramma(c, { larg: mm(50), spazio: mm(4.5), chiave: "nera", sopra: 1.4, sotto: 1.4 });
      S.testa(P, 52, n1.passo, "piena"); S.testa(P, 82, n2.passo, "piena");
      c.appendChild(M.caselle(["↗", "↘", "→"], giusta, a.sol));
    }
  });

  sch({ codice: "2N-11", titolo: "Arrivano il fa e il si", consegna: "Il <b>fa</b> abita nel 1° spazio, il <b>si</b> sul 3° rigo. Ripassa e poi disegna tu.", sol: true }, (corpo, a) => {
    [["f", "Il <b>fa</b> abita nel <b>1° spazio</b>, tra il mi e il sol."], ["b", "Il <b>si</b> abita sul <b>3° rigo</b>, il rigo di mezzo."]].forEach(([l, frase]) => {
      const n = nota(l + "4");
      const testa = el("div", { class: "riga", style: { gap: "5mm" } },
        el("div", { style: { fontSize: "34pt", fontWeight: 600, width: "22mm", color: S.col() ? S.scuro(COLORI[l], 0.9) : "#000" } }, n.nome.toUpperCase()),
        el("div", { class: "testo", html: frase }));
      corpo.appendChild(testa);
      for (let r = 0; r < 2; r++) {
        const b = el("div"); corpo.appendChild(b);
        const P = S.pentagramma(b, { spazio: mm(6.5), chiave: "nera", sopra: 1.4, sotto: 1.4 });
        if (r === 0) { const evid = S.col() ? COLORI[l] : "#bbb"; S.testa(P, 52, n.passo, S.col() ? "colore" : "piena", evid); }
        M.posti(P, r === 0 ? 7 : 8, r === 0 ? 70 : 36).forEach((x, i) => S.testa(P, x, n.passo, r === 0 ? "traccia" : (a.sol ? "piena" : (i === 0 ? "traccia" : "puntino"))));
      }
    });
  });

  sch({ codice: "2N-12", titolo: "Le note dal mi al si", consegna: "Colora ogni nota con il suo colore.", icona: "pastello", sol: true }, (corpo, a) => {
    M.legenda(corpo, ["e", "f", "g", "a", "b"]);
    M.righeNote(corpo, a.rnd.serie(["e4", "f4", "g4", "a4", "b4"], 32), { perRiga: 8, spazio: 6.2, risposta: "nessuna", sol: a.sol, colora: ["e", "f", "g", "a", "b"], sopra: 1.6, sotto: 1.6 });
  });

  /* ---------------- RITMO ---------------- */
  function figuraSola(cont, tipo, larg, spazio, stile) {
    const P = S.pentagramma(cont, { larg: mm(larg), spazio: mm(spazio), linee: "nessuna", sopra: 3.5, sotto: 0.5 });
    if (tipo === "88") S.coppiaCrome(P, P.W / 2 - 9, P.W / 2 + 9, 2, 2, stile);
    else if (tipo === "r") S.pausa(P, P.W / 2, "4", stile === "traccia" ? S.GRIGIO_FANTASMA : null);
    else S.figura(P, P.W / 2 - 3, 2, tipo, stile, true);
    return P;
  }
  function presentaFigura(corpo, icone, sillaba, tipo, frase) {
    const r = el("div", { class: "riga", style: { gap: "6mm", justifyContent: "center" } }); corpo.appendChild(r);
    const i1 = el("div", { class: "riga", style: { gap: "1mm" } }); icone.forEach(n => i1.appendChild(img(n, 22))); r.appendChild(i1);
    r.appendChild(el("div", { style: { fontSize: "30pt" } }, "="));
    r.appendChild(el("div", { style: { fontSize: "34pt", fontWeight: 600, color: "var(--inch)" } }, sillaba));
    r.appendChild(el("div", { style: { fontSize: "30pt" } }, "="));
    const f = el("div"); r.appendChild(f); figuraSola(f, tipo, 30, 9, "piena");
    M.testo(corpo, frase, { textAlign: "center" });
  }
  sch({ codice: "2R-01", titolo: "Ta: la semiminima", consegna: "Una mela, un battito: <b>ta</b>. Ripassa le semiminime e poi scrivile sotto le mele.", icona: "mela" }, (corpo) => {
    presentaFigura(corpo, ["mela"], "TA", "4", "La <b>semiminima</b> dura <b>un battito</b>.");
    const b = el("div"); corpo.appendChild(b);
    const P = S.pentagramma(b, { spazio: mm(8), linee: "nessuna", sopra: 4.2, sotto: 0.6 });
    M.posti(P, 10, 6).forEach(x => S.figura(P, x, 2, "4", "traccia", true));
    const mele = el("div", { class: "riga", style: { justifyContent: "space-around" } }); for (let i = 0; i < 8; i++) mele.appendChild(img("mela", 15));
    corpo.appendChild(mele);
    const vuoti = el("div", { class: "riga", style: { justifyContent: "space-around" } });
    for (let i = 0; i < 8; i++) vuoti.appendChild(el("div", { style: { width: "17mm", height: "26mm", border: ".4mm dashed #aaa", borderRadius: "2mm" } }));
    corpo.appendChild(vuoti);
  });
  sch({ codice: "2R-02", titolo: "Ti-ti: due crome", consegna: "Due ciliegie in un battito: <b>ti-ti</b>. Ripassa le crome e poi scrivile sotto le ciliegie.", icona: "ciliegie" }, (corpo) => {
    presentaFigura(corpo, ["ciliegie"], "TI-TI", "88", "Le <b>due crome</b> stanno insieme in <b>un battito</b>: due suoni veloci.");
    const b = el("div"); corpo.appendChild(b);
    const P = S.pentagramma(b, { spazio: mm(8), linee: "nessuna", sopra: 4.2, sotto: 0.6 });
    const xs = M.posti(P, 10, 6); for (let i = 0; i < 10; i += 2) S.coppiaCrome(P, xs[i], xs[i + 1] - 4, 2, 2, "traccia");
    const c = el("div", { class: "riga", style: { justifyContent: "space-around" } }); for (let i = 0; i < 6; i++) c.appendChild(img("ciliegie", 15));
    corpo.appendChild(c);
    const vuoti = el("div", { class: "riga", style: { justifyContent: "space-around" } });
    for (let i = 0; i < 6; i++) vuoti.appendChild(el("div", { style: { width: "24mm", height: "26mm", border: ".4mm dashed #aaa", borderRadius: "2mm" } }));
    corpo.appendChild(vuoti);
  });

  /* ritmi casuali: battiti per misura, figure ammesse */
  function ritmo(rnd, battiti, figure) {
    const out = []; let t = 0, pause = 0;
    while (t < battiti) {
      const f = rnd.pick(figure.filter(x => (x === "h" ? 2 : 1) <= battiti - t && !(x === "r" && (pause >= 1 || t === 0 && battiti > 2 && rnd.r() < 0.5))));
      if (f === "r") pause++;
      out.push(f === "q" ? "q:x" : f === "88" ? "8:x 8:x" : f === "r" ? "q:r" : "h:x");
      t += f === "h" ? 2 : 1;
    }
    return out.join(" ");
  }
  sch({ codice: "2R-03", titolo: "Leggi e batti", consegna: "Batti le mani a tempo e dì le sillabe: <b>ta</b> e <b>ti-ti</b>. I cuori sono i battiti.", icona: "mani" }, (corpo, a) => {
    const righe = []; for (let i = 0; i < 5; i++) righe.push([ritmo(a.rnd, 4, ["q", "q", "88"]), ritmo(a.rnd, 4, ["q", "88", "88"])]);
    M.righeRitmo(corpo, righe, { spazio: 5.6 });
  });
  sch({ codice: "2R-04", titolo: "Dalle sillabe alle figure", consegna: "Sotto ogni sillaba disegna la figura giusta: <b>ta</b> = semiminima, <b>ti-ti</b> = due crome.", sol: true }, (corpo, a) => {
    for (let r = 0; r < 7; r++) {
      const f = []; for (let i = 0; i < 4; i++) f.push(a.rnd.pick(["q", "88"]));
      const riga = el("div", { class: "riga", style: { gap: "3mm", justifyContent: "space-around" } });
      riga.appendChild(el("div", { style: { fontSize: "14pt", fontWeight: 600, width: "6mm", color: "var(--inch)" } }, String(r + 1)));
      f.forEach(x => {
        const c = el("div", { class: "riquadro", style: { width: "38mm", padding: "1mm 2mm", textAlign: "center" } },
          el("div", { style: { fontSize: "17pt", fontWeight: 600 } }, x === "q" ? "ta" : "ti - ti"));
        const sp = el("div", { style: { height: "17mm", display: "flex", justifyContent: "center" } }); c.appendChild(sp);
        if (a.sol) figuraSola(sp, x === "q" ? "4" : "88", 28, 4.6, "piena");
        riga.appendChild(c);
      });
      corpo.appendChild(riga);
    }
  });
  sch({ codice: "2R-05", titolo: "Filastrocche ritmate", consegna: "Dì la filastrocca battendo le mani. Sotto ogni battito scrivi la figura: una sillaba = <b>ta</b>, due sillabe = <b>ti-ti</b>.", icona: "bocca", sol: true }, (corpo, a) => {
    const fil = [["TOC", "TOC", "CHI", "C'È?"], ["SO-LE", "SO-LE", "SPLEN-DI", "QUI"], ["UN", "DUE", "TRE", "STEL-LA"],
      ["SAL-TA", "SAL-TA", "LA", "RA-NA"], ["DIN", "DON", "SUO-NA", "DAN"], ["PIO-VE", "PIO-VE", "SUL", "TET-TO"]];
    fil.forEach((r, i) => {
      const riga = el("div", { class: "riga", style: { gap: "3mm", justifyContent: "space-around" } });
      riga.appendChild(el("div", { style: { fontSize: "14pt", fontWeight: 600, width: "6mm", color: "var(--inch)" } }, String(i + 1)));
      r.forEach(s => {
        const c = el("div", { class: "riquadro", style: { width: "38mm", padding: "1mm 2mm", textAlign: "center" } },
          el("div", { style: { fontSize: "16pt", fontWeight: 600 } }, s));
        const sp = el("div", { style: { height: "17mm", display: "flex", justifyContent: "center" } }); c.appendChild(sp);
        if (a.sol) figuraSola(sp, s.includes("-") ? "88" : "4", 28, 4.6, "piena");
        riga.appendChild(c);
      });
      corpo.appendChild(riga);
    });
  });
  sch({ codice: "2R-06", titolo: "Il silenzio che conta", consegna: "Leggi e batti. Sulla pausa <b>non batti</b>: apri le mani e dici <b>sst</b> sottovoce.", icona: "silenzio" }, (corpo, a) => {
    M.consiglio(corpo, "Anche il silenzio ha il suo battito: la pausa si conta, ma non si suona.", "silenzio");
    const righe = []; for (let i = 0; i < 5; i++) righe.push([ritmo(a.rnd, 4, ["q", "88", "r"]), ritmo(a.rnd, 4, ["q", "88", "r", "q"])]);
    M.righeRitmo(corpo, righe, { spazio: 5.2 });
  });
  sch({ codice: "2R-07", titolo: "La minima: ta-a", consegna: "La minima dura <b>due battiti</b>: ta-a. Leggi e batti, poi scrivi quanti battiti dura ogni riga.", sol: true }, (corpo, a) => {
    presentaFigura(corpo, ["cuore", "cuore"], "TA - A", "2", "La <b>minima</b> ha la testa vuota e dura <b>due battiti</b>.");
    for (let i = 0; i < 4; i++) {
      const m = ritmo(a.rnd, 4, ["q", "88", "h", "h"]) + " " + ritmo(a.rnd, 2, ["q", "h", "88"]);
      const riga = el("div", { class: "riga", style: { gap: "3mm" } }); corpo.appendChild(riga);
      const b = el("div"); riga.appendChild(b);
      S.battute(b, { larg: mm(150), spazio: mm(5.2), unaLinea: true, chiave: false, cuori: true, misure: [m], sopra: 3.4, sotto: 0 });
      riga.appendChild(el("div", { class: "testo" }, "battiti: ", el("span", { class: "box-risposta" }, a.sol ? "6" : "")));
    }
  });

  /* ---------------- ASCOLTO ---------------- */
  sch({ codice: "2A-01", titolo: "Sale o scende?", consegna: "L'insegnante suona due note: <b>sol</b> e <b>mi</b>. Se la melodia sale cerchia l'uccellino, se scende cerchia l'orso.", icona: "orecchio", sol: true }, (corpo, a) => {
    const seq = a.rnd.serie(["su", "giu"], 12);
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(3, 1fr)", gap: "5mm" } }); corpo.appendChild(g);
    seq.forEach((x, i) => {
      const c = el("div", { class: "riquadro riga", style: { justifyContent: "space-around" } },
        el("span", { style: { fontSize: "18pt", fontWeight: 600, color: "var(--inch)" } }, String(i + 1)));
      const u = img("uccellino", 16), o = img("orso", 16);
      [[u, "su"], [o, "giu"]].forEach(([im, v]) => { const w = el("div", { style: { position: "relative", padding: "1.5mm" } }, im); if (a.sol && v === x) w.appendChild(el("div", { style: { position: "absolute", inset: 0, border: ".7mm solid #c00", borderRadius: "50%" } })); c.appendChild(w); });
      g.appendChild(c);
    });
    if (a.sol) corpo.appendChild(el("div", { class: "testo sol" }, "Da suonare: " + seq.map((x, i) => `${i + 1}) ${x === "su" ? "mi → sol" : "sol → mi"}`).join(" · ")));
    else M.consiglio(corpo, "Per l'insegnante: la sequenza da suonare è nel fascicolo delle soluzioni.", "gufo", { fontSize: "11pt" });
  });
  sch({ codice: "2A-02", titolo: "Quale riga ho suonato?", consegna: "Ascolta il ritmo e fai una crocetta sulla riga giusta: <b>A</b>, <b>B</b> o <b>C</b>.", icona: "orecchio", sol: true }, (corpo, a) => {
    const giuste = [];
    for (let gr = 0; gr < 3; gr++) {
      const box = el("div", { class: "riquadro", style: { padding: "1mm 3mm" } }); corpo.appendChild(box);
      box.appendChild(el("div", { style: { fontWeight: 600, color: "var(--inch)" } }, "Ascolto " + (gr + 1)));
      const giusta = a.rnd.int(0, 2); giuste.push("ABC"[giusta]);
      const usati = new Set();
      for (let k = 0; k < 3; k++) {
        let m; do { m = ritmo(a.rnd, 4, ["q", "88", "r"]); } while (usati.has(m)); usati.add(m);
        const riga = el("div", { class: "riga", style: { gap: "3mm" } }); box.appendChild(riga);
        riga.appendChild(M.caselle(["ABC"[k]], a.sol && k === giusta ? "ABC"[k] : null, a.sol));
        const b = el("div"); riga.appendChild(b);
        S.battute(b, { larg: mm(160), spazio: mm(3.6), unaLinea: true, chiave: false, misure: [m], sopra: 2.2, sotto: 0 });
      }
    }
    if (!a.sol) M.consiglio(corpo, "Per l'insegnante: le righe da suonare sono nel fascicolo delle soluzioni.", "gufo", { fontSize: "11pt" });
  });

  /* ---------------- STRUMENTI ---------------- */
  sch({ codice: "2S-01", titolo: "Note o ritmo?", consegna: "Alcuni strumenti suonano le <b>note</b> (una melodia), altri fanno solo il <b>ritmo</b>. Fai una crocetta.", icona: "orecchio", sol: true }, (corpo, a) => {
    const str = [["tastiera", "note", "tastiera"], ["tamburo", "ritmo", "tamburo"], ["violino", "note", "violino"], ["maracas", "ritmo", "maracas"],
      ["flauto", "note", "flauto"], ["tamburo-lungo", "ritmo", "tamburo lungo"], ["chitarra", "note", "chitarra"], ["tromba", "note", "tromba"], ["arpa", "note", "arpa"]];
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(3, 1fr)", gap: "5mm" } }); corpo.appendChild(g);
    str.forEach(([im, giusta, nome]) => {
      g.appendChild(el("div", { class: "riquadro centro", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5mm" } },
        img(im, 30), el("div", { class: "testo" }, nome), M.caselle(["note", "ritmo"].map(x => x), giusta, a.sol)));
    });
    g.querySelectorAll(".riga > div").forEach(d => { d.style.width = "17mm"; d.style.fontSize = "11pt"; });
  });

  /* ---------------- RITAGLIA E GIOCA ---------------- */
  sch({ codice: "2X-01", titolo: "Memory delle note", consegna: "Ritaglia le carte. Girale coperte e trova le coppie: la nota e il suo nome.", icona: "forbici" }, (corpo) => {
    const lista = [];
    ["g4", "a4", "e4", "f4", "b4"].forEach(s => { lista.push(["nota", s]); lista.push(["nome", s]); });
    lista.push(["chiave"], ["chiave"]);
    M.carte(corpo, 3, 4, (c, i) => {
      const [t, s] = lista[i];
      if (t === "nota") M.notaInCarta(c, s, 52, 5);
      else if (t === "nome") c.appendChild(el("div", { style: { fontSize: "36pt", fontWeight: 600 } }, nota(s).nome));
      else { const P = S.pentagramma(c, { larg: mm(52), spazio: mm(5), sopra: 2.5, sotto: 3 }); S.disegnaChiave(P, P.W / 2 - 14, "nera"); }
    });
  });
  sch({ codice: "2X-02", titolo: "Domino del ritmo", consegna: "Ritaglia le tessere. Avvicina ogni figura alla sua sillaba: ta, ti-ti, ta-a, sst.", icona: "forbici" }, (corpo, a) => {
    const tipi = ["4", "88", "2", "r"], sill = { "4": "ta", "88": "ti-ti", "2": "ta-a", "r": "sst" };
    const seq = a.rnd.serie(tipi, 12);
    M.carte(corpo, 2, 6, (c, i) => {
      c.style.flexDirection = "row"; c.style.justifyContent = "space-around";
      const sx = el("div", { style: { flex: 1, display: "flex", justifyContent: "center", alignItems: "center" } });
      const dx = el("div", { style: { flex: 1, display: "flex", justifyContent: "center", alignItems: "center", borderLeft: ".5mm solid #999", height: "80%", fontSize: "26pt", fontWeight: 600 } }, sill[seq[(i + 1) % 12]]);
      c.append(sx, dx); figuraSola(sx, seq[i], 30, 4, "piena");
    }, { gap: 0 });
  });
  sch({ codice: "2X-03", titolo: "Le carte delle sette note", consegna: "Ritaglia le carte e tienile nella busta: serviranno anche nei prossimi anni.", icona: "forbici" }, (corpo) => {
    const tutte = ["c4", "d4", "e4", "f4", "g4", "a4", "b4"];
    M.carte(corpo, 2, 4, (c, i) => {
      if (i === 7) { c.appendChild(img("note", 30)); c.appendChild(el("div", { class: "testo centro" }, "Le mie note")); return; }
      const n = nota(tutte[i]);
      if (S.col()) c.style.borderColor = COLORI[n.l];
      c.style.borderWidth = "1mm"; c.style.borderStyle = S.col() ? "solid" : "dashed";
      M.notaInCarta(c, tutte[i], 70, 4.8, { colore: true });
      c.appendChild(el("div", { style: { fontSize: "30pt", fontWeight: 600, color: S.col() ? S.scuro(COLORI[n.l], n.l === "e" ? 0.75 : 0.95) : "#000" } }, n.nome));
    }, { gap: 0 });
  });

  /* ---------------- VERIFICA ---------------- */
  sch({ codice: "2V-01", titolo: "Che cosa ho imparato", consegna: "Fai tutti gli esercizi con calma. Alla fine colora la stella!", icona: "stella", sol: true }, (corpo, a) => {
    corpo.classList.add("alto");
    corpo.appendChild(M.etichetta("1. Scrivi il nome delle note."));
    M.righeNote(corpo, ["g4", "e4", "a4", "f4", "b4", "g4", "a4"], { perRiga: 7, spazio: 5.2, stile: "piena", sol: a.sol, sotto: 3.4, sopra: 1.4 });
    corpo.appendChild(M.etichetta("2. Ripassa la chiave e poi aggiungi il gambo alle note."));
    const b = el("div"); corpo.appendChild(b);
    const P = S.pentagramma(b, { spazio: mm(5), sopra: 3.8, sotto: 3.8 });
    S.disegnaChiave(P, 4, "traccia");
    [1, 3, 6, 7, 0, 5].forEach((p, i) => { const x = 50 + i * ((P.W - 60) / 6); S.testa(P, x, p, "piena"); if (a.sol) S.gambo(P, x, p, p < 4, "nero"); });
    corpo.appendChild(M.etichetta("3. Quanti battiti dura?"));
    const r = el("div", { class: "riga", style: { justifyContent: "space-around" } }); corpo.appendChild(r);
    [["4", 1], ["88", 1], ["2", 2], ["r", 1]].forEach(([t, v]) => {
      const c = el("div", { class: "riquadro riga", style: { gap: "2mm" } }); r.appendChild(c);
      const f = el("div"); c.appendChild(f); figuraSola(f, t, 22, 4.6, "piena");
      c.appendChild(el("span", { class: "box-risposta", style: { minWidth: "11mm" } }, a.sol ? String(v) : ""));
    });
    const st = el("div", { class: "riga", style: { justifyContent: "center", marginTop: "3mm" } }, img("stella", 26)); corpo.appendChild(st);
  });
  sch({ codice: "2V-02", titolo: "Diploma della chiave di violino", consegna: false }, (corpo) => {
    M.diploma(corpo, "Diploma della chiave di violino", "perché sa disegnare la chiave di violino, conosce il pentagramma e legge le note <b>sol, la, mi, fa, si</b>.", "violino");
  });
})();
