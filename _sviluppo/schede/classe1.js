/* Schede della classe 1ª — Il suono e i primi segni (prima della notazione).
   In prima le consegne sono in stampato maiuscolo (classe .maiuscolo sulla pagina). */
(function () {
  "use strict";
  const S = Schede, M = Modelli, { el, img } = S, mm = M.mm;
  const C = 1;
  const sch = (meta, f) => S.scheda(C, meta, f);
  const NS = "http://www.w3.org/2000/svg";
  const TRACCIA = 'stroke="#8f95a3" stroke-width="0.8" stroke-dasharray="2.4 1.8" stroke-linecap="round" fill="none"';
  const VERDE = () => S.col() ? "#16a34a" : "#000";

  S.titoloClasse(C, {
    sottotitolo: "Il suono e i primi segni: ascoltare, muoversi a tempo, preparare la mano alla scrittura musicale.",
    guida: "<b>Per l'insegnante.</b> In prima si parte dall'esperienza: ascoltare, muoversi, suonare con il corpo. Le schede di grafia preparano la mano " +
      "ai segni del pentagramma (linee, ovali, gambi, riccioli). Le consegne sono in stampato maiuscolo e vanno lette insieme."
  });

  /* tela in millimetri per i tracciati liberi */
  function tela(cont, altezza, larghezza) {
    const L = larghezza || 184;
    const d = el("div", { html: `<svg xmlns="${NS}" viewBox="0 0 ${L} ${altezza}" style="width:${L}mm;height:${altezza}mm;display:block;overflow:visible"></svg>` });
    cont.appendChild(d);
    const svg = d.firstChild;
    return { svg, W: L, H: altezza, add: html => svg.insertAdjacentHTML("beforeend", html) };
  }
  const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${VERDE()}"/>`;
  const riga = (...x) => el("div", { class: "riga", style: { gap: "3mm" } }, ...x);

  /* ---------------- GRAFIA ---------------- */
  sch({ codice: "1G-01", titolo: "Le linee lunghe", consegna: "Parti dal puntino verde e ripassa la linea fino all'amico che ti aspetta.", icona: "matita" }, (corpo) => {
    [["pulcino", "casa"], ["ape", "albero"], ["muso-gatto", "topolino"], ["rana", "goccia"], ["uccellino", "albero"], ["lumaca", "casa"]].forEach(([a, b], i) => {
      const t = el("div", { style: { flex: 1 } });
      corpo.appendChild(riga(img(a, 16), t, img(b, 16)));
      const T = tela(t, 12, 140);
      T.add(`<path d="M3 6 H137" ${TRACCIA}/>` + dot(3, 6));
    });
    M.consiglio(corpo, "Queste linee diventeranno i <b>righi del pentagramma</b>: dritte, da sinistra a destra.", "gufo");
  });

  sch({ codice: "1G-02", titolo: "Tanti piccoli ovali", consegna: "Ripassa gli ovali, poi disegnali tu sui puntini. Gira sempre nello stesso verso.", icona: "matita" }, (corpo) => {
    [7, 5.5, 4.5, 3.6].forEach((r, k) => {
      for (let tipo = 0; tipo < 2; tipo++) {
        const T = tela(corpo, r * 2.6 + 4);
        const n = Math.floor(176 / (r * 3.4)), passo = 176 / n;
        for (let i = 0; i < n; i++) {
          const x = 6 + passo * (i + 0.5), y = T.H / 2;
          if (tipo === 0 || i === 0) T.add(`<ellipse cx="${x}" cy="${y}" rx="${r * 1.2}" ry="${r * 0.9}" transform="rotate(-20 ${x} ${y})" ${TRACCIA}/>`);
          else T.add(`<circle cx="${x}" cy="${y}" r="0.7" fill="#6b7280"/>`);
        }
      }
    });
    M.consiglio(corpo, "Gli ovali diventeranno le <b>teste delle note</b>: rotondi e un po' inclinati, come un uovo sdraiato.", "pulcino");
  });

  sch({ codice: "1G-03", titolo: "La pioggia dritta", consegna: "Dalla nuvola cade la pioggia: ripassa le gocce dall'alto in basso, ben dritte.", icona: "matita" }, (corpo) => {
    [32, 24, 16].forEach((h, k) => {
      const t = el("div", { style: { flex: 1 } });
      corpo.appendChild(riga(img("pioggia", 16), t));
      const T = tela(t, h + 4, 160);
      for (let i = 0; i < 18; i++) {
        const x = 5 + i * 8.8;
        if (i < 12) T.add(`<path d="M${x} 2 V${h + 2}" ${TRACCIA}/>` + dot(x, 2));
        else T.add(`<circle cx="${x}" cy="2" r="0.8" fill="#6b7280"/>`);
      }
    });
    M.consiglio(corpo, "Queste righe dritte diventeranno i <b>gambi delle note</b> e le <b>stanghette</b>.", "gufo");
  });

  sch({ codice: "1G-04", titolo: "Onde e zig-zag", consegna: "Ripassa le onde del mare e i lampi del temporale. Poi continua tu.", icona: "matita" }, (corpo) => {
    const onda = (x0, x1, y, a, l) => { let d = `M${x0} ${y}`; for (let x = x0; x < x1 - 0.1; x += l) d += ` q${l / 4} ${-a} ${l / 2} 0 t${l / 2} 0`; return d; };
    const zig = (x0, x1, y, a, l) => { let d = `M${x0} ${y + a}`; let s = -1; for (let x = x0 + l / 2; x <= x1 + 0.1; x += l / 2) { d += ` L${x} ${y + s * a}`; s = -s; } return d; };
    [["pesce", "onda"], ["pesce", "onda"], ["temporale", "zig"], ["temporale", "zig"]].forEach(([ic, tipo], k) => {
      const t = el("div", { style: { flex: 1 } });
      corpo.appendChild(riga(img(ic, 16), t));
      const T = tela(t, 26, 160);
      const meta = k % 2 ? 60 : 156;
      const d = tipo === "onda" ? onda(4, meta, 13, 8, 18) : zig(4, meta, 13, 8, 14);
      T.add(`<path d="${d}" ${TRACCIA}/>` + dot(4, tipo === "onda" ? 13 : 21));
    });
    M.consiglio(corpo, "Con lo zig-zag la mano si allena per la <b>pausa</b>, che scende proprio così.", "gufo");
  });

  sch({ codice: "1G-05", titolo: "Riccioli e chiocciole", consegna: "Ripassa i riccioli e le chiocciole. Gira piano, senza staccare la matita.", icona: "matita" }, (corpo) => {
    const riccioli = (x0, n, y, h, w) => { let d = `M${x0} ${y}`; for (let i = 0; i < n; i++) { const x = x0 + i * w; d += ` C${x + w * 0.9} ${y} ${x + w * 0.9} ${y - h} ${x + w * 0.5} ${y - h} C${x + w * 0.1} ${y - h} ${x + w * 0.2} ${y} ${x + w} ${y}`; } return d; };
    const spirale = (cx, cy, r) => { let d = ""; for (let t = 0; t <= 6 * Math.PI; t += 0.25) { const rr = r * t / (6 * Math.PI); const x = cx + rr * Math.cos(t), y = cy + rr * Math.sin(t); d += (d ? " L" : "M") + x.toFixed(2) + " " + y.toFixed(2); } return d; };
    for (let k = 0; k < 2; k++) {
      const t = el("div", { style: { flex: 1 } });
      corpo.appendChild(t);
      const T = tela(t, 30, 180);
      T.add(`<path d="${riccioli(4, k ? 4 : 9, 26, 20, 19)}" ${TRACCIA}/>` + dot(4, 26));
    }
    for (let k = 0; k < 2; k++) {
      const t = el("div", { style: { flex: 1 } });
      corpo.appendChild(riga(img("lumaca", 16), t));
      const T = tela(t, 34, 160);
      const n = k ? 2 : 5;
      for (let i = 0; i < n; i++) T.add(`<path d="${spirale(18 + i * 30, 17, 14)}" ${TRACCIA}/>` + dot(18 + i * 30, 17));
    }
    M.consiglio(corpo, "Il ricciolo e la chiocciola preparano la <b>chiave di violino</b>, che parte proprio con un giro.", "violino");
  });

  sch({ codice: "1G-06", titolo: "Il pentagramma gigante", consegna: "Ripassa le cinque righe dal puntino verde. Sono come i fili della luce dove si posano gli uccellini.", icona: "uccellino" }, (corpo) => {
    for (let k = 0; k < 2; k++) {
      const b = el("div"); corpo.appendChild(b);
      const P = S.pentagramma(b, { spazio: mm(15), linee: "tratteggiate", sopra: 0.6, sotto: 0.6 });
      for (let i = 0; i < 5; i++) S.partenza(P, 2.2, P.yRigo(i));
      if (k === 0) [[30, 4], [62, 2], [95, 3], [120, 1]].forEach(([x, r]) => {
        const d = el("div", { class: "sopra" }); d.appendChild(img("uccellino", 11));
        d.style.left = P.px(x) + "px"; d.style.top = (P.px(P.yRigo(r)) - mm(5)) + "px"; P.wrap.appendChild(d);
      });
    }
  });

  sch({ codice: "1G-07", titolo: "Righi e spazi", consegna: "Colora i righi con un pastello e gli spazi con un altro. Poi contali.", icona: "pastello", sol: true }, (corpo, a) => {
    const b = el("div"); corpo.appendChild(b);
    const P = S.pentagramma(b, { spazio: mm(20), linee: "solide", sopra: 0.3, sotto: 0.3 });
    if (a.sol) for (let i = 0; i < 4; i++) P.add("rect", { x: 0, y: P.yRigo(i + 1), width: P.W, height: 10, fill: S.col() ? "#fde68a" : "#ddd" });
    corpo.appendChild(riga(el("span", { class: "testo maiu" }, "Quanti righi?"), el("span", { class: "box-risposta" }, a.sol ? "5" : ""),
      el("span", { style: { width: "15mm" } }), el("span", { class: "testo maiu" }, "Quanti spazi?"), el("span", { class: "box-risposta" }, a.sol ? "4" : "")));
    M.consiglio(corpo, "Il pentagramma ha <b>5 righi</b> e <b>4 spazi</b>. Penta vuol dire cinque!", "gufo");
  });

  /* ---------------- ASCOLTO E SUONO ---------------- */
  sch({ codice: "1A-01", titolo: "Suono o silenzio?", consegna: "Che cosa fa rumore? Colora le cose che suonano e fai una X su quelle silenziose.", icona: "orecchio", sol: true }, (corpo, a) => {
    const lista = [["campana", 1], ["libro", 0], ["sveglia", 1], ["farfalla", 0], ["cane", 1], ["albero", 0], ["tamburo", 1], ["lumaca", 0],
      ["telefono", 1], ["sole", 0], ["auto", 1], ["dorme", 0]];
    const ord = a.rnd.mescola(lista);
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "5mm" } }); corpo.appendChild(g);
    ord.forEach(([n, suona]) => {
      const c = el("div", { class: "riquadro centro", style: { position: "relative", display: "flex", justifyContent: "center", padding: "4mm" } }, img(n, 30));
      if (a.sol) c.appendChild(el("div", { class: "sol", style: { position: "absolute", top: "1mm", right: "2mm", fontSize: "13pt" } }, suona ? "SUONA" : "X"));
      g.appendChild(c);
    });
    M.consiglio(corpo, "Chiudete gli occhi per un minuto: quali suoni sentite in classe? E fuori dalla finestra?", "orecchio");
  });

  sch({ codice: "1A-02", titolo: "Forte o piano?", consegna: "Ascolta: se il suono è <b>forte</b> cerchia il leone, se è <b>piano</b> cerchia il topolino.", icona: "orecchio", sol: true }, (corpo, a) => {
    corpo.appendChild(riga(img("leone", 18), el("span", { class: "testo maiu" }, "= forte"), el("span", { style: { width: "18mm" } }), img("topolino", 18), el("span", { class: "testo maiu" }, "= piano")));
    M.ascoltoScelta(corpo, a, ["leone", "topolino"], 12, 3, { leone: "forte", topolino: "piano" });
  });
  sch({ codice: "1A-03", titolo: "Alto o basso?", consegna: "Ascolta: se il suono è <b>acuto</b> (alto) cerchia l'uccellino, se è <b>grave</b> (basso) cerchia l'orso.", icona: "orecchio", sol: true }, (corpo, a) => {
    corpo.appendChild(riga(img("uccellino", 18), el("span", { class: "testo maiu" }, "= acuto"), el("span", { style: { width: "18mm" } }), img("orso", 18), el("span", { class: "testo maiu" }, "= grave")));
    M.ascoltoScelta(corpo, a, ["uccellino", "orso"], 12, 3, { uccellino: "acuto", orso: "grave" });
  });
  sch({ codice: "1A-04", titolo: "Lungo o corto?", consegna: "Ascolta: se il suono è <b>lungo</b> cerchia la linea, se è <b>corto</b> cerchia il puntino.", icona: "orecchio", sol: true }, (corpo, a) => {
    const seq = a.rnd.serie(["lungo", "corto"], 12);
    corpo.appendChild(riga(M.simbolo("lungo", 18), el("span", { class: "testo maiu" }, "= lungo"), el("span", { style: { width: "18mm" } }), M.simbolo("piano", 18), el("span", { class: "testo maiu" }, "= corto")));
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "4mm" } }); corpo.appendChild(g);
    seq.forEach((x, i) => {
      const c = el("div", { class: "riquadro riga", style: { justifyContent: "space-between", padding: "2mm 3mm" } }, el("span", { style: { fontSize: "18pt", fontWeight: 600, color: "var(--inch)" } }, String(i + 1)));
      ["lungo", "piano"].forEach(t => { const w = el("div", { style: { position: "relative", padding: "1.5mm" } }, M.simbolo(t, 15)); if (a.sol && (t === "lungo") === (x === "lungo")) w.appendChild(el("div", { style: { position: "absolute", inset: 0, border: ".7mm solid #c00", borderRadius: "50%" } })); c.appendChild(w); });
      g.appendChild(c);
    });
    if (a.sol) corpo.appendChild(el("div", { class: "testo sol", style: { fontSize: "12pt" } }, "Sequenza: " + seq.map((x, i) => `${i + 1}) ${x}`).join(" · ")));
    else M.consiglio(corpo, "Per l'insegnante: un suono lungo si tiene con la voce o con il triangolo; uno corto è un colpo secco sui legnetti.", "gufo", { fontSize: "11pt" });
  });
  sch({ codice: "1A-05", titolo: "Veloce o lento?", consegna: "Ascolta: se la musica è <b>veloce</b> cerchia il coniglio, se è <b>lenta</b> cerchia la tartaruga.", icona: "orecchio", sol: true }, (corpo, a) => {
    corpo.appendChild(riga(img("coniglio", 18), el("span", { class: "testo maiu" }, "= veloce"), el("span", { style: { width: "18mm" } }), img("tartaruga", 18), el("span", { class: "testo maiu" }, "= lento")));
    M.ascoltoScelta(corpo, a, ["coniglio", "tartaruga"], 12, 3, { coniglio: "veloce", tartaruga: "lento" });
  });

  sch({ codice: "1A-06", titolo: "Chi fa questo verso?", consegna: "Unisci con una linea ogni animale al suo verso. Poi fate i versi tutti insieme!", icona: "matita", sol: true }, (corpo, a) => {
    const an = [["muso-cane", "BAU BAU"], ["muso-gatto", "MIAO"], ["muso-mucca", "MUU"], ["gallo", "CHICCHIRICHÌ"], ["rana", "CRA CRA"], ["pecora", "BEE"], ["ape", "ZZZ"]];
    const destra = a.rnd.mescola(an.map((x, i) => [x[1], i]));
    M.collega(corpo, an.map(x => img(x[0], 20)), destra.map(x => el("div", { style: { fontSize: "18pt", fontWeight: 600 } }, x[0])),
      an.map((x, i) => [i, destra.findIndex(d => d[1] === i)]), a.sol);
  });

  const LEGENDA_SIMBOLI = [["forte", "un colpo forte"], ["piano", "un colpo piano"], ["lungo", "un suono lungo"], ["onda", "un suono che trema"], ["silenzio", "silenzio"]];
  function legendaSimboli(corpo) {
    const g = el("div", { class: "riquadro tinta", style: { display: "flex", flexWrap: "wrap", justifyContent: "space-around", gap: "2mm 5mm" } });
    LEGENDA_SIMBOLI.forEach(([s, t]) => g.appendChild(el("span", { class: "riga", style: { gap: "1.5mm" } }, M.simbolo(s, 11), el("span", { class: "maiu", style: { fontSize: "11.5pt" } }, t))));
    corpo.appendChild(g);
  }
  sch({ codice: "1A-07", titolo: "La partitura dei segni", consegna: "Ogni segno è un suono. Leggi da sinistra a destra e suona con la voce, le mani o uno strumento.", icona: "occhi" }, (corpo, a) => {
    legendaSimboli(corpo);
    const tipi = ["forte", "piano", "lungo", "onda", "silenzio"];
    for (let r = 0; r < 5; r++) {
      const seq = a.rnd.serie(tipi, 8);
      const g = el("div", { class: "riquadro riga", style: { justifyContent: "space-around", padding: "2mm" } }, el("span", { style: { fontSize: "16pt", fontWeight: 600, color: "var(--inch)" } }, String(r + 1)));
      seq.forEach(t => g.appendChild(M.simbolo(t, 17)));
      corpo.appendChild(g);
    }
  });
  sch({ codice: "1A-08", titolo: "Inventa la tua partitura", consegna: "Disegna un segno in ogni casella. Poi fai suonare la tua partitura a un compagno.", icona: "lampadina" }, (corpo) => {
    legendaSimboli(corpo);
    for (let r = 0; r < 4; r++) {
      const g = el("div", { class: "riga", style: { justifyContent: "space-between" } }, el("span", { style: { fontSize: "16pt", fontWeight: 600, color: "var(--inch)", width: "6mm" } }, String(r + 1)));
      for (let i = 0; i < 6; i++) g.appendChild(el("div", { style: { width: "26mm", height: "26mm", border: ".4mm dashed #999", borderRadius: "3mm" } }));
      corpo.appendChild(g);
    }
  });
  sch({ codice: "1A-09", titolo: "Il musicogramma", consegna: "Ascolta un brano in tre parti: A, B, A. Segui con il dito e colora le forme mentre la musica suona.", icona: "orecchio" }, (corpo) => {
    const parti = [["A", "forte", "Prima parte"], ["B", "onda", "Parte di mezzo"], ["A", "forte", "Torna la prima parte"]];
    parti.forEach(([l, s, t]) => {
      const g = el("div", { class: "riquadro riga", style: { gap: "4mm" } }, el("div", { style: { fontSize: "30pt", fontWeight: 700, color: "var(--inch)", width: "14mm" } }, l));
      const forme = el("div", { class: "riga", style: { flex: 1, justifyContent: "space-around" } });
      for (let i = 0; i < 6; i++) {
        const k = el("span", { class: "img", html: s === "forte"
          ? `<svg viewBox="0 0 40 40" width="100%" height="100%"><circle cx="20" cy="20" r="${i % 2 ? 9 : 15}" fill="#fff" stroke="#222" stroke-width="1.4"/></svg>`
          : `<svg viewBox="0 0 40 40" width="100%" height="100%"><path d="M3 20 q4.25 -12 8.5 0 t8.5 0 t8.5 0 t8.5 0" fill="none" stroke="#222" stroke-width="1.6"/></svg>` });
        k.style.width = "22mm"; k.style.height = "22mm"; forme.appendChild(k);
      }
      g.appendChild(forme);
      corpo.appendChild(el("div", { class: "piccolo maiu" }, t));
      corpo.appendChild(g);
    });
    M.consiglio(corpo, "Per l'insegnante: va bene qualsiasi brano in forma A-B-A, per esempio una marcia o un minuetto. Nella parte A i cerchi grandi e piccoli seguono i passi; nella B le onde seguono la melodia.", "gufo", { fontSize: "11pt" });
  });

  /* ---------------- RITMO ---------------- */
  sch({ codice: "1R-01", titolo: "Il cuore della musica", consegna: "Mentre cantiamo una canzone, tocca un cuore per ogni battito. Poi colorali.", icona: "cuore" }, (corpo) => {
    M.consiglio(corpo, "Il <b>battito</b> (la pulsazione) è il cuore della musica: va sempre avanti, regolare, come un orologio.", "sveglia");
    for (let r = 0; r < 5; r++) {
      const g = el("div", { class: "riga", style: { justifyContent: "space-around" } });
      for (let i = 0; i < 8; i++) g.appendChild(M.cuoreVuoto(17, false));
      corpo.appendChild(g);
    }
  });
  sch({ codice: "1R-02", titolo: "Chi cammina a tempo?", consegna: "Guarda le impronte. In ogni riquadro cerchia la lettera della fila <b>regolare</b>, sempre con lo stesso passo.", icona: "occhi", sol: true }, (corpo, a) => {
    for (let k = 0; k < 4; k++) {
      const giusta = a.rnd.int(0, 1);
      const box = el("div", { class: "riquadro", style: { display: "flex", flexDirection: "column", gap: "2mm" } }); corpo.appendChild(box);
      for (let j = 0; j < 2; j++) {
        const reg = j === giusta;
        const fila = el("div", { style: { position: "relative", height: "15mm" } });
        const pos = []; let x = 2;
        const salti = a.rnd.mescola([9, 27, 13, 31, 11, 24, 8, 29]); for (let i = 0; i < 9; i++) { pos.push(x); x += reg ? 19 : salti[i % 8]; }
        pos.filter(p => p < 165).forEach((p, i) => { const im = img("impronte", 11); im.style.position = "absolute"; im.style.left = p + "mm"; im.style.top = (i % 2 ? 0 : 4) + "mm"; fila.appendChild(im); });
        const r = el("div", { class: "riga", style: { gap: "2mm" } }, el("span", { style: { width: "6mm", fontWeight: 600, fontSize: "14pt" } }, "ABCDEFGH"[k * 2 + j]), el("div", { style: { flex: 1 } }, fila));
        if (a.sol && reg) r.style.outline = ".6mm solid #c00";
        box.appendChild(r);
      }
    }
  });
  sch({ codice: "1R-03", titolo: "Suoniamo con il corpo", consegna: "Leggi da sinistra a destra ed esegui: <b>mani</b>, <b>gambe</b>, <b>piedi</b>. Un disegno per ogni battito.", icona: "mani" }, (corpo, a) => {
    corpo.appendChild(el("div", { class: "riquadro tinta riga", style: { justifyContent: "space-around" } },
      riga(img("mani", 13), el("span", { class: "maiu" }, "batti le mani")), riga(img("gamba", 13), el("span", { class: "maiu" }, "batti sulle gambe")), riga(img("piede", 13), el("span", { class: "maiu" }, "batti il piede"))));
    const righe = [["mani", "mani", "mani", "mani", "gamba", "gamba", "gamba", "gamba"], ["mani", "gamba", "mani", "gamba", "mani", "gamba", "mani", "gamba"],
      ["piede", "piede", "mani", "mani", "piede", "piede", "mani", "mani"], ["gamba", "gamba", "mani", "-", "gamba", "gamba", "mani", "-"],
      ["piede", "gamba", "mani", "-", "piede", "gamba", "mani", "-"]];
    righe.forEach((r, i) => {
      const g = el("div", { class: "riga", style: { justifyContent: "space-between" } }, el("span", { style: { fontSize: "15pt", fontWeight: 600, color: "var(--inch)", width: "6mm" } }, String(i + 1)));
      r.forEach(x => g.appendChild(el("div", { style: { width: "19mm", height: "19mm", border: ".35mm solid var(--bordo)", borderRadius: "3mm", display: "flex", alignItems: "center", justifyContent: "center" } }, x === "-" ? img("silenzio", 12) : img(x, 15))));
      corpo.appendChild(g);
    });
    M.consiglio(corpo, "La faccina <b>sst</b> è un battito di silenzio: si conta, ma non si suona.", "silenzio", { fontSize: "12pt" });
  });
  sch({ codice: "1R-04", titolo: "Uno o due suoni?", consegna: "In ogni battito c'è una mela (un suono) o due ciliegie (due suoni veloci). Leggi e batti le mani.", icona: "mani", sol: true }, (corpo, a) => {
    const casella = (x, vuota) => el("div", { style: { width: "19mm", height: "19mm", border: ".35mm solid var(--bordo)", borderRadius: "3mm", display: "flex", alignItems: "center", justifyContent: "center" } }, vuota ? null : img(x, x === "mela" ? 13 : 15));
    for (let r = 0; r < 3; r++) {
      const g = el("div", { class: "riga", style: { justifyContent: "space-between" } }, el("span", { style: { fontSize: "15pt", fontWeight: 600, color: "var(--inch)", width: "6mm" } }, String(r + 1)));
      Array.from({ length: 8 }, () => a.rnd.pick(["mela", "mela", "ciliegie"])).forEach(x => g.appendChild(casella(x)));
      corpo.appendChild(g);
    }
    corpo.appendChild(el("div", { class: "testo maiu", style: { fontWeight: 500 } }, "Ora ascolta l'insegnante e disegna tu: una mela o due ciliegie?"));
    const dett = [];
    for (let r = 0; r < 2; r++) {
      const seq = a.rnd.serie(["mela", "ciliegie"], 8); dett.push(seq);
      const g = el("div", { class: "riga", style: { justifyContent: "space-between" } }, el("span", { style: { fontSize: "15pt", fontWeight: 600, color: "var(--inch)", width: "6mm" } }, String(r + 4)));
      seq.forEach(x => g.appendChild(casella(x, !a.sol)));
      corpo.appendChild(g);
    }
  });

  /* ---------------- STRUMENTI ---------------- */
  sch({ codice: "1S-01", titolo: "Gli strumenti della classe", consegna: "Colora gli strumenti e ripassa il loro nome.", icona: "pastello" }, (corpo) => {
    const lista = [["tamburello", "tamburello"], ["triangolo", "triangolo"], ["legnetti", "legnetti"], ["maracas", "maracas"], ["tamburo", "tamburo"], ["metallofono", "metallofono"]];
    const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "6mm" } }); corpo.appendChild(g);
    lista.forEach(([f, n]) => g.appendChild(el("div", { class: "riquadro centro", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "2mm" } },
      M.figura(f, 38), el("div", { style: { fontSize: "26pt", fontWeight: 600, color: "#fff", WebkitTextStroke: "0.35mm #8f95a3", letterSpacing: "1mm", textTransform: "uppercase" } }, n))));
  });
  sch({ codice: "1S-02", titolo: "Come si suona?", consegna: "Unisci ogni strumento a come si suona: si <b>percuote</b>, si <b>scuote</b>, si <b>sfrega</b>.", icona: "matita", sol: true }, (corpo, a) => {
    const str = [["tamburo", 0], ["maracas", 1], ["guiro", 2], ["legnetti", 0], ["campanelli", 1], ["triangolo", 0]];
    const modi = [["si percuote", "mani"], ["si scuote", "maracas"], ["si sfrega", "guiro"]];
    M.collega(corpo, str.map(x => M.figura(x[0], 24)), modi.map(([t, i]) => el("div", { class: "riga", style: { gap: "2mm" } }, el("span", { class: "maiu", style: { fontSize: "17pt", fontWeight: 600 } }, t))),
      str.map((x, i) => [i, x[1]]), a.sol);
  });

  /* ---------------- RITAGLIA E GIOCA ---------------- */
  const SUONI_TOMBOLA = ["campana", "sveglia", "muso-cane", "muso-gatto", "mucca", "gallo", "rana", "ape", "telefono", "auto", "treno", "tamburo", "pioggia", "temporale", "violino", "tromba"];
  sch({ codice: "1X-01", titolo: "Tombola dei suoni", consegna: "Ritaglia le cartelle. L'insegnante fa sentire un suono: se è sulla tua cartella, coprilo con un tappo!", icona: "forbici" }, (corpo, a) => {
    M.carte(corpo, 2, 2, (c, i) => {
      const scelti = caso(a, i).mescola(SUONI_TOMBOLA).slice(0, 9);
      const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5mm", width: "86%" } });
      scelti.forEach(n => g.appendChild(el("div", { style: { border: ".3mm solid var(--bordo)", borderRadius: "2mm", display: "flex", justifyContent: "center", padding: "1.5mm" } }, img(n, 17))));
      c.appendChild(g);
    }, { gap: 3 });
    function caso(api, i) { return S.caso("1X-01-" + i); }
  });
  sch({ codice: "1X-02", titolo: "Le carte dei contrasti", consegna: "Ritaglia le carte. Pesca una carta e muoviti come dice: forte, piano, veloce, lento…", icona: "forbici" }, (corpo) => {
    const carte = [["leone", "forte"], ["topolino", "piano"], ["uccellino", "acuto"], ["orso", "grave"], ["coniglio", "veloce"], ["tartaruga", "lento"], ["treno", "lungo"], ["goccia", "corto"]];
    M.carte(corpo, 2, 4, (c, i) => { c.appendChild(img(carte[i][0], 32)); c.appendChild(el("div", { style: { fontSize: "24pt", fontWeight: 600, textTransform: "uppercase", marginTop: "2mm" } }, carte[i][1])); }, { gap: 0 });
  });

  /* ---------------- VERIFICA ---------------- */
  sch({ codice: "1V-01", titolo: "So ascoltare", consegna: "Ascolta l'insegnante e cerchia il disegno giusto.", icona: "stella", sol: true }, (corpo, a) => {
    const gruppi = [["forte o piano?", ["leone", "topolino"]], ["acuto o grave?", ["uccellino", "orso"]], ["veloce o lento?", ["coniglio", "tartaruga"]]];
    const tutte = [];
    gruppi.forEach(([t, coppia]) => {
      corpo.appendChild(el("div", { class: "testo maiu", style: { fontWeight: 500 } }, t));
      const g = el("div", { class: "griglia", style: { gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "4mm" } }); corpo.appendChild(g);
      for (let i = 0; i < 3; i++) {
        const x = a.rnd.pick(coppia); tutte.push(x);
        g.appendChild(el("div", { class: "riquadro" }, M.sceltaImmagini(coppia, x, a.sol, 15)));
      }
    });
    corpo.appendChild(el("div", { class: "riga", style: { justifyContent: "center" } }, img("stella", 22)));
    if (a.sol) corpo.appendChild(el("div", { class: "testo sol", style: { fontSize: "11pt" } }, "Sequenza: " + tutte.map(x => ({ leone: "forte", topolino: "piano", uccellino: "acuto", orso: "grave", coniglio: "veloce", tartaruga: "lento" })[x]).join(" · ")));
  });
  sch({ codice: "1V-02", titolo: "Diploma \"Orecchie attente\"", consegna: false }, (corpo) => {
    M.diploma(corpo, "Orecchie attente", "perché sa ascoltare i suoni, riconosce forte e piano, acuto e grave, e tiene il battito della musica.", "orecchio");
  });
})();
