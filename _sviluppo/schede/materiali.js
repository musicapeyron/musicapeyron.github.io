/* Materiali per tutti gli anni (volume "classe 0"): cartelloni, copertina, pentagrammi vuoti, autovalutazione */
(function () {
  "use strict";
  const S = Schede, M = Modelli, { el, img, nota, COLORI, NOMI } = S, mm = M.mm;
  const C = 0;
  S.stato.schede[0] = S.stato.schede[0] || [];
  const sch = (meta, f) => S.scheda(C, meta, f);
  S.titoloClasse(C, {
    sottotitolo: "Materiali per tutto il percorso: cartelloni da appendere, copertina del quaderno, pentagrammi vuoti e schede «Ora so…».",
    guida: "<b>Per l'insegnante.</b> I cartelloni si possono stampare in A4 oppure ingrandire in A3. I pentagrammi vuoti sono in tre grandezze: " +
      "grande per la 1ª e la 2ª, media per la 3ª, normale per la 4ª e la 5ª."
  });

  sch({ codice: "M-01", senzaNome: true, titolo: "I colori delle note", consegna: "Cartellone da appendere in classe: ogni nota ha il suo colore, lo stesso in tutti i giochi di musicascuole.it.", icona: "tavolozza" }, (corpo) => {
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "5mm" } }); corpo.appendChild(g);
    S.ORDINE.forEach(l => {
      const c = el("div", { class: "riquadro riga", style: { gap: "6mm", padding: "4mm 6mm" } });
      c.appendChild(el("div", { class: "pallino", style: { width: "24mm", height: "24mm", background: S.col() ? COLORI[l] : "#fff", borderColor: S.col() ? S.scuro(COLORI[l], 0.6) : "#000", borderWidth: ".7mm" } }));
      c.appendChild(el("div", { style: { fontSize: "40pt", fontWeight: 600, color: S.col() ? S.scuro(COLORI[l], l === "e" ? 0.72 : 0.95) : "#000" } }, NOMI[l]));
      g.appendChild(c);
    });
    g.appendChild(el("div", { class: "riquadro centro", style: { display: "flex", alignItems: "center", justifyContent: "center" } }, img("note", 28)));
  });
  sch({ codice: "M-02", senzaNome: true, titolo: "Le note sul pentagramma", consegna: "Cartellone: dove abita ogni nota, dal do sotto il pentagramma al sol sopra.", icona: "nota" }, (corpo) => {
    const tutte = ["c4", "d4", "e4", "f4", "g4", "a4", "b4", "c5", "d5", "e5", "f5", "g5"];
    [tutte.slice(0, 6), tutte.slice(6)].forEach(gr => {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(11), chiave: "nera", sopra: 2.2, sotto: 3.4 });
      M.posti(P, 6, 40).forEach((x, i) => {
        const n = nota(gr[i]);
        S.testa(P, x, n.passo, S.col() ? "colore" : "piena", COLORI[n.l]);
        S.scritta(P, x, P.yRigo(0) + 27, n.nome, { fontSize: "22pt", fontWeight: 600, color: S.col() ? S.scuro(COLORI[n.l], n.l === "e" ? 0.72 : 0.95) : "#000" });
      });
    });
  });
  sch({ codice: "M-03", senzaNome: true, titolo: "Le figure e le pause", consegna: "Cartellone: quanto dura ogni figura e la sua pausa.", icona: "sveglia" }, (corpo) => {
    const righe = [["1", "r1", "semibreve", "4"], ["2", "r2", "minima", "2"], ["2.", null, "minima col punto", "3"], ["4", "r4", "semiminima", "1"], ["8", "r8", "croma", "½"], ["88", null, "due crome", "1"]];
    const t = el("div", { style: { display: "grid", gridTemplateColumns: "34mm 34mm 1fr 30mm", alignItems: "center", gap: "2mm 4mm" } }); corpo.appendChild(t);
    ["figura", "pausa", "nome", "battiti"].forEach(h => t.appendChild(el("div", { style: { fontWeight: 600, color: "var(--inch)", fontSize: "13pt" } }, h)));
    righe.forEach(([f, p, nome, v]) => {
      const a = el("div"); t.appendChild(a); M.figuraSola(a, f, 32, 4.2, "piena");
      const b = el("div"); t.appendChild(b); if (p) M.figuraSola(b, p, 32, 4.2, "piena");
      t.appendChild(el("div", { style: { fontSize: "18pt", fontWeight: 600 } }, nome));
      t.appendChild(el("div", { style: { fontSize: "26pt", fontWeight: 700, color: "var(--inch)" } }, v));
    });
  });
  sch({ codice: "M-04", senzaNome: true, titolo: "Copertina del quaderno", consegna: "Colora la copertina e incollala sul quaderno di musica.", icona: "pastello" }, (corpo) => {
    corpo.classList.add("alto");
    const d = el("div", { style: { flex: 1, border: ".6mm solid #333", borderRadius: "6mm", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-evenly", textAlign: "center" } }); corpo.appendChild(d);
    d.append(el("div", { style: { fontSize: "40pt", fontWeight: 700, color: "#fff", WebkitTextStroke: "0.5mm #333" } }, "QUADERNO DI MUSICA"));
    const r = el("div", { class: "riga", style: { gap: "6mm" } }); ["violino", "flauto", "tamburo", "tromba", "chitarra"].forEach(n => r.appendChild(img(n, 22))); d.appendChild(r);
    const b = el("div", { style: { width: "150mm" } }); d.appendChild(b);
    const P = S.pentagramma(b, { larg: mm(150), spazio: mm(7), chiave: "nera", sopra: 1.2, sotto: 2.6 });
    ["c4", "d4", "e4", "f4", "g4", "a4", "b4", "c5"].forEach((k, i) => S.testa(P, 52 + i * 21, nota(k).passo, "bianca"));
    d.append(el("div", { style: { fontSize: "18pt" } }, "Nome ", el("span", { style: { display: "inline-block", width: "100mm", borderBottom: ".4mm solid #555" } })),
      el("div", { style: { fontSize: "18pt" } }, "Classe ", el("span", { style: { display: "inline-block", width: "30mm", borderBottom: ".4mm solid #555" } }), "  Anno ", el("span", { style: { display: "inline-block", width: "40mm", borderBottom: ".4mm solid #555" } })));
  });
  [["M-05", "Pentagrammi grandi (1ª e 2ª)", 9, 4], ["M-06", "Pentagrammi medi (3ª)", 6.5, 5], ["M-07", "Pentagrammi normali (4ª e 5ª)", 4.5, 8]].forEach(([cod, tit, sp, n]) => {
    sch({ codice: cod, titolo: tit, consegna: false, senzaNome: true }, (corpo) => {
      for (let i = 0; i < n; i++) { const b = el("div"); corpo.appendChild(b); S.pentagramma(b, { spazio: mm(sp), sopra: 0.9, sotto: 0.9 }); }
    });
  });
  const ORA_SO = {
    1: ["Distinguo il suono dal silenzio", "Riconosco forte e piano", "Riconosco acuto e grave", "Tengo il battito con le mani e con i piedi", "Leggo una partitura di segni", "Traccio linee, ovali e riccioli"],
    2: ["So che il pentagramma ha 5 righi e 4 spazi", "Disegno la chiave di violino", "Leggo sol, la, mi, fa, si", "Disegno teste e gambi al posto giusto", "Leggo ta, ti-ti, ta-a e la pausa", "Sento se una melodia sale o scende"],
    3: ["Leggo tutte le note da do a do", "Scrivo il taglio addizionale", "So quanti battiti vale ogni figura", "Metto le stanghette in 2/4, 3/4, 4/4", "Riconosco le famiglie dell'orchestra", "Invento un ritmo di quattro battute"],
    4: ["Leggo le note fino al sol acuto", "Uso il punto e la legatura", "Conosco diesis, bemolle e bequadro", "Suono si, la, sol sul flauto", "Distinguo toni e semitoni", "Leggo p, mf, f, crescendo e diminuendo"],
    5: ["Leggo un brano con il diesis in chiave", "Leggo semiminima puntata, semicrome e sincope", "Riconosco l'anacrusi", "Suono un brano intero con il flauto", "Riconosco la forma A-B-A", "Compongo e scrivo un brano di otto battute"]
  };
  [1, 2, 3, 4, 5].forEach(cl => {
    sch({ codice: "M-" + String(7 + cl).padStart(2, "0"), titolo: `Ora so… (classe ${cl}ª)`, consegna: "Leggi ogni frase e colora la faccina che ti somiglia di più.", icona: "sorriso" }, (corpo) => {
      ORA_SO[cl].forEach(t => {
        const r = el("div", { class: "riquadro riga", style: { justifyContent: "space-between", gap: "4mm" } }); corpo.appendChild(r);
        r.appendChild(el("div", { style: { fontSize: "15pt", flex: 1, textTransform: cl === 1 ? "uppercase" : "none" } }, t));
        const f = el("div", { class: "riga", style: { gap: "3mm" } });
        [["M8 15 q4 4 8 0", "sì"], ["M8 15 H16", "quasi"], ["M8 17 q4 -4 8 0", "non ancora"]].forEach(([bocca, n]) => f.appendChild(el("div", { class: "centro piccolo" },
          el("div", { html: `<svg viewBox="0 0 24 24" style="width:13mm;height:13mm"><circle cx="12" cy="12" r="10.5" fill="#fff" stroke="#333" stroke-width="1"/><circle cx="8.5" cy="9.5" r="1.3"/><circle cx="15.5" cy="9.5" r="1.3"/><path d="${bocca}" fill="none" stroke="#333" stroke-width="1.2" stroke-linecap="round"/></svg>` }), el("div", null, n))));
        r.appendChild(f);
      });
    });
  });
})();
