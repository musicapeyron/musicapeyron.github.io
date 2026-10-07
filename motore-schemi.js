/* =====================================================================
   MOTORE DEGLI SCHEMI — Musica Medie
   Disegna un pentagramma con le note e, sotto ogni nota, lo schema
   dello strumento (flauto dolce, chitarra, ukulele, tastiera, basso).
   Le posizioni delle note stanno nella tabella POSIZIONI: per aggiungere
   una nota o uno strumento basta aggiungere una riga lì.
   Richiede VexFlow 4 (vexflow.js) per il pentagramma.
   ===================================================================== */
(function (global) {
  "use strict";

  /* ---------- colori ufficiali delle note ---------- */
  const COLORI = { c: "#E21C48", d: "#F99D1C", e: "#FFF428", f: "#BED958", g: "#009C95", a: "#5E50A1", b: "#CF3E96" };
  const NOMI = { c: "do", d: "re", e: "mi", f: "fa", g: "sol", a: "la", b: "si" };
  const GRIGIO = "#97a2b3", GRIGIO_CHIARO = "#cbd5e1", LINEA = "#b8c2cf";

  function scurisci(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* ---------- posizioni delle note sugli strumenti ----------
     Chiave = nota scritta (lettera, alterazione, ottava), es. "g4", "bb4".
     Corde: [corda (1 = I, la più acuta), tasto (0 = a vuoto)].
     Flauto: fori chiusi; "P" pollice, "P½" mezzo pollice, 1-7 fori davanti.
     Tastiera: la nota stessa (si colora il tasto).
     Regola ukulele: se una nota ha due posizioni, si usa quella sulla corda più acuta. */
  const POSIZIONI = {
    flauto: {
      c4: ["P", 1, 2, 3, 4, 5, 6, 7], d4: ["P", 1, 2, 3, 4, 5, 6], e4: ["P", 1, 2, 3, 4, 5], "c#5": [1, 2],
      f4: ["P", 1, 2, 3, 4], g4: ["P", 1, 2, 3], a4: ["P", 1, 2], bb4: ["P", 1, 3, 4], b4: ["P", 1],
      c5: ["P", 2], d5: [2], e5: ["P½", 1, 2, 3, 4, 5], f5: ["P½", 1, 2, 3, 4],
      // note alterate (diteggiatura tedesca, dallo schema cromatico)
      "c#4": ["P", 1, 2, 3, 4, 5, 6, "7½"], db4: ["P", 1, 2, 3, 4, 5, 6, "7½"],
      "d#4": ["P", 1, 2, 3, 4, 5, "6½"], eb4: ["P", 1, 2, 3, 4, 5, "6½"],
      "f#4": ["P", 1, 2, 3, 5, 6, 7], gb4: ["P", 1, 2, 3, 5, 6, 7],
      "g#4": ["P", 1, 2, 4, 5, 6], ab4: ["P", 1, 2, 4, 5, 6], "a#4": ["P", 1, 3, 4],
      db5: [1, 2], "d#5": [2, 3, 4, 5, 6], eb5: [2, 3, 4, 5, 6]
    },
    chitarra: {
      e3: [6, 0], f3: [6, 1], g3: [6, 3], a3: [5, 0], b3: [5, 2], c4: [5, 3], d4: [4, 0], e4: [4, 2],
      f4: [4, 3], g4: [3, 0], a4: [3, 2], bb4: [3, 3], b4: [2, 0], c5: [2, 1], "c#5": [2, 2], d5: [2, 3], e5: [1, 0], f5: [1, 1], g5: [1, 3]
    },
    ukulele: {
      c4: [3, 0], d4: [3, 2], e4: [2, 0],
      f4: [2, 1], g4: [2, 3], a4: [1, 0], bb4: [1, 1], b4: [1, 2], c5: [1, 3], "c#5": [1, 4], d5: [1, 5], e5: [1, 7], f5: [1, 8]
    },
    basso: {
      e2: [4, 0], f2: [4, 1], g2: [4, 3], a2: [3, 0], bb2: [3, 1], b2: [3, 2], c3: [3, 3], d3: [2, 0], e3: [2, 2], f3: [2, 3],
      g3: [1, 0], a3: [1, 2], b3: [1, 4]
    }
  };
  /* posizioni alternative (solo per gli schemi completi): sull'ukulele sol e la si possono suonare anche sulla corda 4 */
  const ALTERNATIVE = { ukulele: { g4: [4, 0], a4: [4, 2] } };
  const CORDE = { chitarra: 6, ukulele: 4, basso: 4 };
  /* accordatura (in note scritte), dalla corda 1 (la più acuta) */
  const ACCORDATURA = { chitarra: [76, 71, 67, 62, 57, 52], ukulele: [69, 64, 60, 67], basso: [55, 50, 45, 40] };
  /* posizione di una nota: dalla tabella, altrimenti la corda più acuta in prima posizione (tasti 0-4) */
  function posCorde(strumento, nota) {
    const t = POSIZIONI[strumento] && POSIZIONI[strumento][nota.chiave];
    if (t) return t;
    const acc = ACCORDATURA[strumento]; if (!acc) return null;
    const m = midi(nota);
    for (let c = 0; c < acc.length; c++) { const f = m - acc[c]; if (f >= 0 && f <= 4) return [c + 1, f]; }
    const possibili = acc.map((a, c) => [c + 1, m - a]).filter(x => x[1] >= 0).sort((x, y) => x[1] - y[1]);
    return possibili[0] || null;
  }
  /* convenzione: corde in numeri (1 = la più acuta), tasti in numeri romani */
  const ROMANI = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  const romano = n => ROMANI[n] || String(n);
  const SEGNI_TASTO = { chitarra: [], ukulele: [3, 5, 7], basso: [3, 5, 7] };

  /* ---------- note: "bb4" -> { lettera, alterazione, ottava } ---------- */
  function analizza(k) {
    const m = /^([a-g])(b|#)?(\d)$/.exec(k);
    return { lettera: m[1], alt: m[2] || "", ottava: +m[3], chiave: k };
  }
  const SEMITONI = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function midi(n) { return 12 * (n.ottava + 1) + SEMITONI[n.lettera] + (n.alt === "#" ? 1 : n.alt === "b" ? -1 : 0); }

  /* ---------- nomi italiani -> note in ordine ascendente ----------
     "fa sol la sib do" -> f4 g4 a4 bb4 c5 (per il basso un'ottava sotto, con ottava di partenza 2) */
  const DA_ITALIANO = { do: "c", re: "d", mi: "e", fa: "f", sol: "g", la: "a", si: "b" };
  function daNomi(nomi, ottavaBase) {
    let ott = ottavaBase, prec = -1;
    return nomi.map(nome => {
      const bem = nome.endsWith("b") && nome !== "b" && DA_ITALIANO[nome.slice(0, -1)] ? "b" : "";
      const dies = nome.endsWith("#") ? "#" : "";
      const base = DA_ITALIANO[bem || dies ? nome.slice(0, -1) : nome];
      let n = analizza(base + (bem || dies) + ott);
      if (prec >= 0 && midi(n) <= prec) { ott += 1; n = analizza(base + (bem || dies) + ott); }
      prec = midi(n);
      return n;
    });
  }

  /* ===================== disegno degli schemi (SVG) ===================== */
  function svgCorde(strumento, nota, cx, top, posizione) {
    const nCorde = CORDE[strumento];
    const pos = posizione || posCorde(strumento, nota);
    if (!pos) return `<text x="${cx}" y="${top + 30}" font-size="10" text-anchor="middle" fill="${GRIGIO}">?</text>`;
    const [corda, tasto] = pos;
    const tasti = Math.max(3, tasto);
    const passo = 15, largTasto = 18, larg = tasti * largTasto, alto = (nCorde - 1) * passo;
    const x0 = cx - larg / 2 + 6, y0 = top;
    const col = COLORI[nota.lettera], bordo = scurisci(col, 0.62);
    let s = "";
    // tasti verticali e corde
    for (let t = 1; t <= tasti; t++) s += `<line x1="${x0 + t * largTasto}" y1="${y0}" x2="${x0 + t * largTasto}" y2="${y0 + alto}" stroke="${LINEA}" stroke-width="1"/>`;
    for (let c = 1; c <= nCorde; c++) {
      const y = y0 + (c - 1) * passo, attiva = c === corda;
      s += `<line x1="${x0}" y1="${y}" x2="${x0 + larg}" y2="${y}" stroke="${attiva ? col : LINEA}" stroke-width="${attiva ? 2.2 : 1}"/>`;
      s += `<text x="${x0 - 22}" y="${y + 3.5}" font-size="10.5" text-anchor="middle" fill="${GRIGIO}" font-family="DejaVu Sans, Verdana, sans-serif" font-weight="400">${c}</text>`;
    }
    // segni di riferimento sulla tastiera (tra le corde centrali)
    for (const f of SEGNI_TASTO[strumento]) if (f <= tasti)
      s += `<circle cx="${x0 + (f - 0.5) * largTasto}" cy="${y0 + alto / 2}" r="2.6" fill="${GRIGIO_CHIARO}"/>`;
    // capotasto
    s += `<line x1="${x0}" y1="${y0 - 1}" x2="${x0}" y2="${y0 + alto + 1}" stroke="#111" stroke-width="3.2"/>`;
    // numeri dei tasti
    for (let t = 1; t <= tasti; t++) s += `<text x="${x0 + (t - 0.5) * largTasto}" y="${y0 + alto + 14}" font-size="9.5" text-anchor="middle" fill="${GRIGIO}" font-family="DejaVu Sans, Verdana, sans-serif" font-weight="400">${romano(t)}</text>`;
    // dito o corda a vuoto
    const y = y0 + (corda - 1) * passo;
    if (tasto === 0) s += `<circle cx="${x0 - 8}" cy="${y}" r="5.2" fill="#fff" stroke="${bordo}" stroke-width="2"/>`;
    else s += `<circle cx="${x0 + (tasto - 0.5) * largTasto}" cy="${y}" r="6.2" fill="${col}" stroke="${bordo}" stroke-width="1"/>`;
    return s;
  }
  function larghezzaCorde(strumento, nota, posizione) {
    const pos = posizione || posCorde(strumento, nota) || [1, 3];
    return Math.max(3, pos[1]) * 18 + 44;
  }

  function svgFlauto(nota, cx, top) {
    const chiusi = POSIZIONI.flauto[nota.chiave];
    if (!chiusi) return "";
    const col = COLORI[nota.lettera], bordo = scurisci(col, 0.62);
    const r = 7.4, passo = 19.5, gap = 8;
    const ys = [0, 1, 2, 3, 4, 5, 6].map(i => top + 11 + i * passo + (i >= 3 ? gap : 0));
    let s = `<rect x="${cx - 12.5}" y="${top}" width="25" height="${ys[6] - top + 11}" rx="12.5" fill="#fff" stroke="${GRIGIO_CHIARO}" stroke-width="1.2"/>`;
    const foro = (x, y, stato) => {
      if (stato === "chiuso") return `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" stroke="${bordo}" stroke-width="1"/>`;
      if (stato === "mezzo") return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${bordo}" stroke-width="1.3"/>` +
        `<path d="M ${x - r} ${y} A ${r} ${r} 0 0 0 ${x + r} ${y} Z" fill="${col}" stroke="${bordo}" stroke-width="1"/>`;
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${GRIGIO}" stroke-width="1.4"/>`;
    };
    const pollice = chiusi.includes("P") ? "chiuso" : chiusi.includes("P½") ? "mezzo" : "aperto";
    s += foro(cx - 24, ys[0], pollice);
    for (let i = 1; i <= 7; i++) s += foro(cx, ys[i - 1], chiusi.includes(i) ? "chiuso" : chiusi.includes(i + "½") ? "mezzo" : "aperto");
    return s;
  }

  /* accordi: per ogni corda (dalla 1 alla più grave) "x" = non suonare, 0 = a vuoto, [tasto, dito] = premuta */
  const ACCORDI = {
    chitarra: {
      Do:   [0, [1, 1], 0, [2, 2], [3, 3], "x"],      Re:   [[2, 2], [3, 3], [2, 1], 0, "x", "x"],
      Mi:   [0, 0, [1, 1], [2, 3], [2, 2], 0],        Fa:   [[1, 1], [1, 1], [2, 2], [3, 3], "x", "x"],
      Sol:  [[3, 3], 0, 0, 0, [2, 1], [3, 2]],        La:   [0, [2, 3], [2, 2], [2, 1], 0, "x"],
      Rem:  [[1, 1], [3, 3], [2, 2], 0, "x", "x"],    Mim:  [0, 0, 0, [2, 3], [2, 2], 0],
      Lam:  [0, [1, 1], [2, 3], [2, 2], 0, "x"],      Re7:  [[2, 3], [1, 1], [2, 2], 0, "x", "x"],
      Sol7: [[1, 1], 0, 0, 0, [2, 2], [3, 3]],        La7:  [0, [2, 2], 0, [2, 1], 0, "x"]
    },
    ukulele: {
      Do:   [[3, 3], 0, 0, 0],             Re:   [0, [2, 3], [2, 2], [2, 1]],
      Mi:   [[2, 2], 0, [4, 4], [1, 1]],   Fa:   [0, [1, 1], 0, [2, 2]],
      Sol:  [[2, 2], [3, 3], [2, 1], 0],   La:   [0, 0, [1, 1], [2, 2]],
      Rem:  [0, [1, 1], [2, 2], [2, 3]],   Mim:  [[2, 1], [3, 2], [4, 3], 0],
      Lam:  [0, 0, 0, [2, 2]],             Re7:  [0, [2, 1], 0, [2, 2]],
      Sol7: [[2, 3], [1, 1], [2, 2], 0],   La7:  [0, 0, [1, 1], 0]
    }
  };
  const SIGLE = { Do: "C", Re: "D", Mi: "E", Fa: "F", Sol: "G", La: "A", Rem: "Dm", Mim: "Em", Lam: "Am", Re7: "D7", Sol7: "G7", La7: "A7" };
  const LETTERA_ACCORDO = { Do: "c", Re: "d", Mi: "e", Fa: "f", Sol: "g", La: "a" };
  function svgAccordo(strumento, nome) {
    const forma = ACCORDI[strumento][nome], nCorde = forma.length;
    const tasti = strumento === "ukulele" ? 5 : 4, passo = 15, largTasto = 19;
    const larg = tasti * largTasto, alto = (nCorde - 1) * passo, x0 = 30, y0 = 8;
    const col = COLORI[LETTERA_ACCORDO[nome.replace(/m$|7$/, "")]], bordo = scurisci(col, 0.62);
    const F = 'font-family="DejaVu Sans, Verdana, sans-serif"';
    let s = "";
    for (let t = 1; t <= tasti; t++) s += `<line x1="${x0 + t * largTasto}" y1="${y0}" x2="${x0 + t * largTasto}" y2="${y0 + alto}" stroke="${LINEA}" stroke-width="1"/>`;
    for (const f of SEGNI_TASTO[strumento]) if (f <= tasti) s += `<circle cx="${x0 + (f - 0.5) * largTasto}" cy="${y0 + alto / 2}" r="2.6" fill="${GRIGIO_CHIARO}"/>`;
    forma.forEach((v, i) => {
      const y = y0 + i * passo, muta = v === "x";
      s += `<line x1="${x0}" y1="${y}" x2="${x0 + larg}" y2="${y}" stroke="${muta ? LINEA : col}" stroke-width="${muta ? 1 : 2.2}"/>`;
      s += `<text x="${x0 - 22}" y="${y + 3.5}" font-size="10.5" text-anchor="middle" fill="${GRIGIO}" ${F}>${i + 1}</text>`;
    });
    s += `<line x1="${x0}" y1="${y0 - 1}" x2="${x0}" y2="${y0 + alto + 1}" stroke="#111" stroke-width="3.2"/>`;
    for (let t = 1; t <= tasti; t++) s += `<text x="${x0 + (t - 0.5) * largTasto}" y="${y0 + alto + 14}" font-size="9.5" text-anchor="middle" fill="${GRIGIO}" ${F}>${romano(t)}</text>`;
    forma.forEach((v, i) => {
      const y = y0 + i * passo;
      if (v === "x") s += `<path d="M${x0 - 12} ${y - 4} l8 8 M${x0 - 4} ${y - 4} l-8 8" stroke="#7b8796" stroke-width="2" stroke-linecap="round"/>`;
      else if (v === 0) s += `<circle cx="${x0 - 8}" cy="${y}" r="5.2" fill="#fff" stroke="${bordo}" stroke-width="2"/>`;
      else {
        const cx = x0 + (v[0] - 0.5) * largTasto;
        s += `<circle cx="${cx}" cy="${y}" r="7" fill="${col}" stroke="${bordo}" stroke-width="1"/>`;
        s += `<text x="${cx}" y="${y + 3.6}" font-size="10" font-weight="700" text-anchor="middle" fill="#fff" stroke="${bordo}" stroke-width="2" paint-order="stroke" ${F}>${v[1]}</text>`;
      }
    });
    const w = x0 + larg + 8, h = y0 + alto + 20;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="display:block;width:100%;height:auto"><g stroke="none">${s}</g></svg>`;
  }

  /* tastiera: da do4 a fa5 (11 tasti bianchi) */
  function svgTastiera(nota, cx, top) {
    const bianchi = ["c4","d4","e4","f4","g4","a4","b4","c5","d5","e5","f5"];
    const lb = 12.5, hb = 54, ln = 7.6, hn = 33;
    const x0 = cx - (bianchi.length * lb) / 2;
    const m = midi(nota), col = COLORI[nota.lettera], bordo = scurisci(col, 0.62);
    let s = "";
    bianchi.forEach((k, i) => {
      const acceso = midi(analizza(k)) === m;
      s += `<rect x="${x0 + i * lb}" y="${top}" width="${lb}" height="${hb}" fill="${acceso ? col : "#fff"}" stroke="${acceso ? bordo : "#8592a3"}" stroke-width="1"/>`;
    });
    bianchi.forEach((k, i) => {
      const n = analizza(k);
      if (i === bianchi.length - 1 || n.lettera === "e" || n.lettera === "b") return;
      const acceso = midi(n) + 1 === m;
      s += `<rect x="${x0 + (i + 1) * lb - ln / 2}" y="${top}" width="${ln}" height="${hn}" fill="${acceso ? col : "#1d232b"}" stroke="${acceso ? bordo : "#1d232b"}" stroke-width="1"/>`;
    });
    s += `<rect x="${x0}" y="${top}" width="${bianchi.length * lb}" height="${hb}" fill="none" stroke="#8592a3" stroke-width="1.2"/>`;
    return s;
  }

  const CELLA = { flauto: 72, chitarra: 106, basso: 100, tastiera: 150 };

  /* ===================== gruppo completo =====================
     disegnaGruppo(elemento, "chitarra", ["sol","la","si","do","re"])
     disegna nel contenitore un SVG con pentagramma + schemi. */
  function disegnaGruppo(contenitore, strumento, nomiOppureNote) {
    const VF = (global.Vex && global.Vex.Flow) ? global.Vex.Flow : global.VexFlow;
    const chiave = strumento === "basso" ? "bass" : "treble";
    const note = typeof nomiOppureNote[0] === "string" ? daNomi(nomiOppureNote, strumento === "basso" ? 2 : 4) : nomiOppureNote;
    const celle = note.map(n => strumento === "ukulele" ? larghezzaCorde("ukulele", n) + 10 : CELLA[strumento]);
    const margineSx = 70, largTot = margineSx + celle.reduce((a, b) => a + b, 0) + 10;
    const altoSchema = { flauto: 172, chitarra: 105, ukulele: 78, basso: 78, tastiera: 62 }[strumento];
    const yRigo = 6, ySchemi = 128, altoTot = ySchemi + altoSchema + 8;

    contenitore.innerHTML = "";
    const S = 1;   // scala del pentagramma rispetto agli schemi (proporzioni come negli originali)
    const renderer = new VF.Renderer(contenitore, VF.Renderer.Backends.SVG);
    renderer.resize(largTot, altoTot);
    const ctx = renderer.getContext();
    const rigo = new VF.Stave(8 / S, yRigo / S, (largTot - 16) / S);
    rigo.setBegBarType(VF.Barline.type.NONE); rigo.setEndBarType(VF.Barline.type.NONE);
    rigo.setStyle({ strokeStyle: "#111", fillStyle: "#111" });
    rigo.addClef(chiave).setContext(ctx).draw();

    const centri = [];
    let x = margineSx;
    note.forEach((n, i) => {
      const centro = x + celle[i] / 2; x += celle[i];
      const sn = new VF.StaveNote({ keys: [n.lettera + n.alt + "/" + n.ottava], duration: "w", clef: chiave });
      if (n.alt) sn.addModifier(new VF.Accidental(n.alt), 0);
      sn.setStave(rigo);
      const tc = new VF.TickContext(); tc.addTickable(sn).preFormat();
      tc.setX(centro / S - rigo.getNoteStartX() - 8.5);
      sn.setContext(ctx).draw();
      centri.push(centro);
    });

    let s = "";
    note.forEach((n, i) => {
      const cx = centri[i];
      if (strumento === "flauto") s += svgFlauto(n, cx + 6, ySchemi - 4);
      else if (strumento === "tastiera") s += svgTastiera(n, cx, ySchemi);
      else s += svgCorde(strumento, n, cx, ySchemi + 6);
    });
    const svg = contenitore.querySelector("svg");
    // raggruppa il disegno di VexFlow e lo ingrandisce
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `scale(${S})`);
    while (svg.firstChild) g.appendChild(svg.firstChild);
    svg.appendChild(g);
    svg.querySelectorAll("path, rect").forEach(el => { if (el.getAttribute("stroke") === "#999999") el.setAttribute("stroke", "#111"); });
    svg.insertAdjacentHTML("beforeend", `<g class="schemi" stroke="none">${s}</g>`);
    svg.setAttribute("style", "background:#fff");
    return svg;
  }

  /* ===================== lettura del MusicXML =====================
     Restituisce { titolo, armatura, tempo:[n,d], battute:[{ eventi, inizioRitornello, fineRitornello, fine }] }
     Ogni evento: { nota:{lettera,alt,ottava,chiave} | pausa:true, durata:"w"|"h"|"q"|"8"|"16", punti, dito? } */
  const TIPI = { whole: "w", half: "h", quarter: "q", eighth: "8", "16th": "16" };
  function leggiMusicXML(testo) {
    const doc = new DOMParser().parseFromString(testo, "application/xml");
    const parte = doc.querySelector("part");
    const brano = { titolo: (doc.querySelector("work-title, movement-title") || {}).textContent || "", armatura: 0, tempo: [4, 4], battute: [], riquadri: [] };
    const mt = doc.querySelector("movement-title");
    brano.titoloBreve = mt ? mt.textContent.replace(/^\s*\d+\.\s*/, "").trim() : brano.titolo;
    parte.querySelectorAll(":scope > measure").forEach(m => {
      const b = { eventi: [] };
      const key = m.querySelector("attributes key fifths"); if (key) brano.armatura = +key.textContent;
      const ott = m.querySelector("attributes clef clef-octave-change"); if (ott && +ott.textContent === 1) brano.chiaveOttava = true;
      const t = m.querySelector("attributes time"); if (t) { brano.tempo = [+t.querySelector("beats").textContent, +t.querySelector("beat-type").textContent]; brano.simboloTempo = t.getAttribute("symbol"); }
      // segno, D.S. / D.C. e Fine: dai simboli e dalle istruzioni di esecuzione del file
      if (m.querySelector("direction-type > segno, barline > segno")) b.segno = true;
      if (m.querySelector("sound[fine]")) b.fineEsecuzione = true;
      if (m.querySelector("sound[dalsegno]")) b.dalSegno = true;
      if (m.querySelector("sound[dacapo]")) b.daCapo = true;
      m.querySelectorAll(":scope > barline").forEach(bl => {
        const r = bl.querySelector("repeat");
        if (r && r.getAttribute("direction") === "forward") b.inizioRitornello = true;
        if (r && r.getAttribute("direction") === "backward") b.fineRitornello = true;
        if (!r && (bl.querySelector("bar-style") || {}).textContent === "light-heavy") b.fine = true;
        const fineB = bl.querySelector("ending");
        if (fineB) {
          b.volta = b.volta || { numero: fineB.getAttribute("number"), inizio: false, fine: false };
          if (fineB.getAttribute("type") === "start") b.volta.inizio = true; else b.volta.fine = true;
        }
      });
      let testiInAttesa = [], dinamicaInAttesa = null, acciaccInAttesa = [];
      [...m.children].forEach(n => {
        if (n.tagName === "direction") {
          // indicazioni scritte: andamento, "Introduzione", "Fine"... I riquadri (NOVITÀ e note) vanno a parte
          const met = n.querySelector("metronome");
          n.querySelectorAll("words").forEach(w => {
            const t = (w.textContent || "").trim(); if (!t) return;
            if (w.getAttribute("enclosure") === "rectangle") brano.riquadri.push(t);
            else if (met && brano.battute.length === 0 && !brano.andamento) brano.andamento = t;
            else testiInAttesa.push(t);
          });
          if (met && brano.battute.length === 0) brano.metronomo = { unita: (met.querySelector("beat-unit") || {}).textContent, valore: (met.querySelector("per-minute") || {}).textContent };
          const din = n.querySelector("dynamics > *"); if (din) dinamicaInAttesa = din.tagName;
          return;
        }
        if (n.tagName !== "note") return;
        if (n.querySelector("chord")) return;          // melodie a una voce
        if (n.querySelector("grace") && n.querySelector("pitch")) {   // acciaccatura: si attacca alla nota seguente
          const st = n.querySelector("pitch step").textContent.toLowerCase(), al = +((n.querySelector("pitch alter") || {}).textContent || 0);
          acciaccInAttesa.push({ nota: analizza(st + (al === -1 ? "b" : al === 1 ? "#" : "") + n.querySelector("pitch octave").textContent),
            durata: TIPI[(n.querySelector("type") || {}).textContent] || "8", slash: (n.querySelector("grace").getAttribute("slash") === "yes") });
          return;
        }
        const r = n.querySelector("rest");
        const intera = r && (r.getAttribute("measure") === "yes" || !n.querySelector("type"));
        const ev = { durata: intera ? "w" : (TIPI[(n.querySelector("type") || {}).textContent] || "q"), punti: n.querySelectorAll("dot").length };
        if (intera) ev.intera = true;
        if (testiInAttesa.length) { ev.testi = testiInAttesa; testiInAttesa = []; }
        if (dinamicaInAttesa) { ev.dinamica = dinamicaInAttesa; dinamicaInAttesa = null; }
        if (acciaccInAttesa.length) { ev.acciaccature = acciaccInAttesa; acciaccInAttesa = []; }
        const arts = n.querySelector("notations articulations"); if (arts) ev.art = [...arts.children].map(a => a.tagName);
        const colNota = n.getAttribute("color") || (n.querySelector("notehead") || { getAttribute: () => null }).getAttribute("color");
        if (colNota && /^#?([a-f0-9]{6})$/i.test(colNota) && colNota.replace("#", "").toLowerCase() !== "000000") ev.evidenzia = colNota.startsWith("#") ? colNota : "#" + colNota;
        const tr = n.querySelector(':scope > beam[number="1"]'); if (tr) { ev.trave = tr.textContent.trim(); brano.traviScritte = true; }
        const gambo = n.querySelector(":scope > stem"); if (gambo && /^(up|down)$/.test(gambo.textContent.trim())) ev.gambo = gambo.textContent.trim();
        if (n.querySelector("notations fermata")) ev.corona = true;
        const accScritto = n.querySelector(":scope > accidental");
        if (accScritto) { ev.accidentale = { sharp: "#", flat: "b", natural: "n" }[accScritto.textContent.trim()] || null; brano.alterazioniScritte = true; }
        n.querySelectorAll(":scope > tie").forEach(t => { if (t.getAttribute("type") === "start") ev.legaInizio = true; else ev.legaFine = true; });
        n.querySelectorAll("notations slur").forEach(sl => { if (sl.getAttribute("type") === "start") ev.portamentoInizio = true; else if (sl.getAttribute("type") === "stop") ev.portamentoFine = true; });
        if (r) ev.pausa = true;
        else {
          const step = n.querySelector("pitch step").textContent.toLowerCase();
          const alter = +((n.querySelector("pitch alter") || {}).textContent || 0);
          ev.nota = analizza(step + (alter === -1 ? "b" : alter === 1 ? "#" : "") + n.querySelector("pitch octave").textContent);
          const dito = n.querySelector("technical fingering"); if (dito) ev.dito = dito.textContent.trim();
        }
        b.eventi.push(ev);
      });
      // testi scritti dopo l'ultima nota della battuta (es. "Fine")
      if (testiInAttesa.length && b.eventi.length) b.eventi[b.eventi.length - 1].testiDopo = testiInAttesa;
      brano.battute.push(b);
    });
    // le battute in mezzo a una volta non hanno segni propri: le collego
    let aperta = null;
    brano.battute.forEach(b => {
      if (b.volta && b.volta.inizio) aperta = b.volta.numero;
      else if (!b.volta && aperta) b.volta = { numero: aperta, inizio: false, fine: false };
      if (b.volta && b.volta.fine) aperta = null;
    });
    return brano;
  }

  /* note diverse usate nel brano, dalla più grave alla più acuta */
  function noteUsate(brano) {
    const viste = new Map();
    brano.battute.forEach(b => b.eventi.forEach(e => { if (e.nota) viste.set(e.nota.chiave, e.nota); }));
    return [...viste.values()].sort((a, b) => midi(a) - midi(b));
  }

  /* diteggiatura della tastiera: un dito per tasto bianco, pollice sulla nota più grave del brano.
     Se nello spartito c'è una diteggiatura scritta (MuseScore -> MusicXML), vince quella. */
  const GRADI = { c: 0, d: 1, e: 2, f: 3, g: 4, a: 5, b: 6 };
  function grado(n) { return n.ottava * 7 + GRADI[n.lettera]; }
  function ditoTastiera(nota, piuGrave) { const d = grado(nota) - grado(piuGrave) + 1; return d >= 1 && d <= 5 ? String(d) : ""; }

  /* ===================== disegno del brano =====================
     opzioni: { strumento, colori:bool, nomi:bool, larghezza } */
  function disegnaBrano(contenitore, brano, opzioni) {
    const VF = (global.Vex && global.Vex.Flow) ? global.Vex.Flow : global.VexFlow;
    const o = Object.assign({ strumento: "flauto", colori: false, nomi: false, larghezza: 760 }, opzioni);
    const tastiera = o.strumento === "tastiera";
    /* diteggiatura: undefined = come sempre (tastiera con le dita, nessuna indicazione per le corde);
       "no" | "prima" (solo alla prima comparsa di ogni nota) | "sempre" */
    const corde = !!CORDE[o.strumento];
    const modoDit = o.diteggiatura, ditAttiva = modoDit === "prima" || modoDit === "sempre";
    const nomiSotto = tastiera || (corde && ditAttiva);
    const haSopra = (tastiera && (modoDit === undefined || ditAttiva)) || (corde && ditAttiva) || (o.nomi && !nomiSotto);
    const visteDit = new Set();
    const usate = noteUsate(brano);
    const piuGrave = o.notaBaseDita ? analizza(o.notaBaseDita) : usate[0];   // diteggiatura fissa (es. "g4" = sol pollice) o dal brano
    const conTesti = o.testi !== false;
    const W = o.larghezza;
    // battute di sola pausa consecutive -> una sola battuta con il numero (pausa di più battute), se richiesto
    const unita = [];
    brano.battute.forEach(b => {
      const soloPausa = b.eventi.length > 0 && b.eventi.every(e => e.intera);
      // solo se richiesto (opzione pausePiuBattute): di base ogni battuta di pausa resta separata
      const unibile = !!o.pausePiuBattute && soloPausa && !b.inizioRitornello && !b.fineRitornello && !b.volta && !b.fine;
      const haTesti = b.eventi.some(e => e.testi || e.testiDopo);
      const prec = unita[unita.length - 1];
      if (unibile && prec && prec.unibile && !haTesti) { prec.n++; prec.battute.push(b); }
      else unita.push({ b, n: 1, unibile, battute: [b] });
    });
    const perRiga = o.perRiga || (W < 520 ? 2 : 4), righe = Math.ceil(unita.length / perRiga);
    const altezzaRiga = (nomiSotto ? 140 : 120) + (corde && ditAttiva && o.nomi ? 16 : 0) + (conTesti && o.titolo === false ? 14 : 0);
    const yPrima = o.titolo === false ? (conTesti && (brano.andamento || brano.metronomo) ? 26 : 8) : 30;
    contenitore.innerHTML = "";
    const divRigo = document.createElement("div"); contenitore.appendChild(divRigo);
    const renderer = new VF.Renderer(divRigo, VF.Renderer.Backends.SVG);
    renderer.resize(W, yPrima + righe * altezzaRiga);
    const ctx = renderer.getContext();
    if (brano.titolo && o.titolo !== false) { ctx.save(); ctx.setFont("Georgia, serif", 18); ctx.fillText(brano.titolo, W / 2 - ctx.measureText(brano.titolo).width / 2, 20); ctx.restore(); }
    const alterazioniInChiave = {};
    "fcgdaeb".slice(0, Math.max(0, brano.armatura)).split("").forEach(l => alterazioniInChiave[l] = "#");
    "beadgcf".slice(0, Math.max(0, -brano.armatura)).split("").forEach(l => alterazioniInChiave[l] = "b");
    const keySpec = brano.armatura ? (["F","Bb","Eb","Ab","Db","Gb","Cb"][-brano.armatura - 1] || ["G","D","A","E","B","F#","C#"][brano.armatura - 1]) : null;

    const tutteLeNote = [];
    /* mappa per seguire la base: per ogni battuta, dove sta nel disegno e dove cade ogni figura (in semiminime) */
    const mappaBattute = [], lungBattuta = brano.tempo[0] * 4 / brano.tempo[1];
    const DURQ = { w: 4, h: 2, q: 1, "8": 0.5, "16": 0.25 };
    const durQ = e => e.intera ? lungBattuta : (DURQ[e.durata] || 1) * (e.punti ? 1.5 : 1);
    { let aperte = [], prossima = 0;   // ogni nota sotto una legatura di portamento riceve il suo numero
      brano.battute.forEach(b => b.eventi.forEach(e => {
        if (e.pausa) return;
        if (e.portamentoInizio) aperte.push(prossima++);
        e.portamenti = aperte.slice();
        if (e.portamentoFine) aperte.pop();
      })); }
    for (let r = 0; r < righe; r++) {
      const battute = unita.slice(r * perRiga, r * perRiga + perRiga);
      const y = yPrima + r * altezzaRiga + 10;
      const testa = (r === 0 ? 92 : 50) + (brano.armatura ? Math.abs(brano.armatura) * 10 : 0);
      // le battute con più note ricevono più spazio (minimo come 4 note)
      const pesi = battute.map(u => u.n > 1 ? 4 : Math.max(4, u.b.eventi.length));
      const pesoTot = unita.length >= perRiga ? Math.max(pesi.reduce((a, c) => a + c, 0), 4 * perRiga) : pesi.reduce((a, c) => a + c, 0);
      const spazio = W - 20 - testa;
      let x = 10, sn_ultimaBattuta = null;
      const daScrivere = [];   // note della riga: nomi e dita si scrivono alla fine, alla stessa altezza
      let stRiga = null;
      const volteRiga = [], testiPause = [];
      battute.forEach((u, i) => {
        const b = u.b, ultima = u.battute[u.battute.length - 1];
        const w = spazio * pesi[i] / pesoTot + (i === 0 ? testa : 0);
        const st = new VF.Stave(x, y, w);
        if (i === 0) { st.addClef("treble", "default", brano.chiaveOttava ? "8va" : undefined); if (keySpec) st.addKeySignature(keySpec); if (r === 0) st.addTimeSignature(brano.simboloTempo === "cut" ? "C|" : brano.simboloTempo === "common" ? "C" : brano.tempo.join("/")); }
        if (b.inizioRitornello) st.setBegBarType(VF.Barline.type.REPEAT_BEGIN);
        if (b.segno) st.setRepetitionType(VF.Repetition.type.SEGNO_LEFT, -6);   // il segno 𝄋 sopra l'inizio della battuta
        if (b.volta) volteRiga.push({ st, volta: b.volta });   // le volte si disegnano dopo, sopra i nomi
        if (ultima.fineRitornello) st.setEndBarType(VF.Barline.type.REPEAT_END);
        else if (ultima.fine || (r === righe - 1 && i === battute.length - 1)) st.setEndBarType(VF.Barline.type.END);
        st.setStyle({ strokeStyle: "#111", fillStyle: "#111" });
        st.setContext(ctx).draw();
        if (u.n > 1) {   // pausa di più battute: barra con il numero sopra
          new VF.MultiMeasureRest(u.n, { number_of_measures: u.n }).setStave(st).setContext(ctx).draw();
          u.battute.forEach((bb, k) => { const x0 = st.getNoteStartX(), x1 = st.getX() + st.getWidth(), pw = (x1 - x0) / u.n;
            mappaBattute[brano.battute.indexOf(bb)] = { x0: k ? x0 + k * pw : st.getX(), x1: x0 + (k + 1) * pw, y0: st.getYForLine(0), y1: st.getYForLine(4), punti: [{ q: 0, x: x0 + k * pw }, { q: lungBattuta, x: x0 + (k + 1) * pw }] }; });
          const t = b.eventi[0].testi; if (t) testiPause.push({ t: t.join("  "), x: st.getNoteStartX() });
          stRiga = st; x += w; return;
        }
        const note = b.eventi.map(e => {
          const durata = e.durata + (e.pausa ? "r" : "");
          // gambo come nel file, se indicato; altrimenti automatico
          const dirGambo = e.gambo === "up" ? 1 : e.gambo === "down" ? -1 : null;
          const sn = new VF.StaveNote(Object.assign({ keys: [e.pausa ? (e.intera ? "d/5" : "b/4") : e.nota.lettera + e.nota.alt + "/" + e.nota.ottava], duration: durata, dots: e.punti, clef: "treble", align_center: !!e.intera },
            dirGambo ? { stem_direction: dirGambo } : { auto_stem: true }));
          sn._ev = e; sn._riga = r;
          for (let k = 0; k < e.punti; k++) VF.Dot.buildAndAttach([sn], { all: true });
          if (e.pausa) return sn;
          // alterazioni: come scritte nel file, se il file le indica; altrimenti solo se diverse dalla chiave
          if (brano.alterazioniScritte) { if (e.accidentale) sn.addModifier(new VF.Accidental(e.accidentale), 0); }
          else {
            const inChiave = alterazioniInChiave[e.nota.lettera] || "";
            if (e.nota.alt !== inChiave) sn.addModifier(new VF.Accidental(e.nota.alt || "n"), 0);
          }
          // staccato, tenuto, accento (dalla parte della testa) e corona (sempre sopra)
          const POS = (VF.ModifierPosition || (VF.Modifier && VF.Modifier.Position) || {});
          const lato = sn.getStemDirection && sn.getStemDirection() === 1 ? POS.BELOW : POS.ABOVE;
          (e.art || []).forEach(a => { const c = { staccato: "a.", tenuto: "a-", accent: "a>" }[a]; if (c) sn.addModifier(new VF.Articulation(c).setPosition(lato), 0); });
          if (e.corona) sn.addModifier(new VF.Articulation("a@a").setPosition(POS.ABOVE), 0);
          // acciaccature
          if (e.acciaccature) {
            const gn = e.acciaccature.map(a => new VF.GraceNote({ keys: [a.nota.lettera + a.nota.alt + "/" + a.nota.ottava], duration: a.durata, slash: a.slash && e.acciaccature.length === 1 }));
            const gruppo = new VF.GraceNoteGroup(gn, true); if (gn.length > 1) gruppo.beamNotes();
            sn.addModifier(gruppo, 0);
          }
          const col = COLORI[e.nota.lettera];
          if (o.colori) sn.setKeyStyle(0, { fillStyle: col, strokeStyle: col });
          else if (e.evidenzia) sn.setStyle({ fillStyle: e.evidenzia, strokeStyle: e.evidenzia });   // nota evidenziata: rossa come nel file
          sn._nome = NOMI[e.nota.lettera].replace(/^./, c => c.toUpperCase()) + (e.nota.alt === "b" ? "♭" : e.nota.alt === "#" ? "♯" : "");
          if (e.legaFine) { sn._nome = ""; return sn; }   // nota legata: non si suona di nuovo
          const mostraDit = modoDit === undefined ? tastiera : (modoDit === "sempre" || (modoDit === "prima" && !visteDit.has(e.nota.chiave)));
          if (mostraDit) {
            if (tastiera) sn._dito = e.dito || ditoTastiera(e.nota, piuGrave);
            else if (corde) { const pos = posCorde(o.strumento, e.nota); if (pos) { sn._corda = String(pos[0]); sn._tasto = pos[1] === 0 ? "0" : romano(pos[1]); } }
            visteDit.add(e.nota.chiave);
          }
          return sn;
        });
        let beams = [];
        if (brano.traviScritte) {      // travi come nel file (inizio / continua / fine)
          let gruppo = [];
          note.forEach(sn => { const t = sn._ev && sn._ev.trave;
            if (t === "begin") gruppo = [sn]; else if (t === "continue" && gruppo.length) gruppo.push(sn);
            else if (t === "end" && gruppo.length) { gruppo.push(sn);
              // se il file non indica i gambi, tutte le note della trave prendono la stessa direzione
              const gambiScritti = gruppo.every(x => x._ev && x._ev.gambo);
              beams.push(new VF.Beam(gruppo, !gambiScritti)); gruppo = []; } });
        } else {
          let gruppiTrave; try { gruppiTrave = VF.Beam.getDefaultBeamGroups(brano.tempo.join("/")); } catch (er) {}
          beams = VF.Beam.generateBeams(note, gruppiTrave ? { groups: gruppiTrave } : {});
        }
        VF.Formatter.FormatAndDraw(ctx, st, note, { auto_beam: false });
        { let q = 0; const punti = note.map(sn => { const ev = sn._ev || {}; const p = { q, x: sn.getAbsoluteX() + sn.getGlyphWidth() / 2, lega: !!ev.legaFine, pausa: !!ev.pausa }; q += durQ(ev); return p; });
          mappaBattute[brano.battute.indexOf(b)] = { x0: st.getX(), x1: st.getX() + st.getWidth(), xNote: st.getNoteStartX(), y0: st.getYForLine(0), y1: st.getYForLine(4), punti }; }
        beams.forEach(bm => bm.setContext(ctx).draw());
        note.forEach(sn => { daScrivere.push(sn); tutteLeNote.push(sn); });
        stRiga = st; sn_ultimaBattuta = { st, note };
        x += w;
      });
      // nomi delle note e dita: in nero, tutti alla stessa altezza, sopra (o sotto) gambi e travi più sporgenti
      let piuAlto = stRiga.getYForLine(0), piuBasso = stRiga.getYForLine(4);
      daScrivere.forEach(sn => {
        if (sn.isRest && sn.isRest()) return;
        const ext = sn.getStemExtents ? sn.getStemExtents() : null;
        if (ext) { piuAlto = Math.min(piuAlto, ext.topY, ext.baseY); piuBasso = Math.max(piuBasso, ext.topY, ext.baseY); }
      });
      // legature di portamento: un arco sopra le note di questa riga
      const archi = new Map();
      daScrivere.forEach(sn => { const e = sn._ev; if (!e || e.pausa || !e.portamenti) return;
        e.portamenti.forEach(id => { if (!archi.has(id)) archi.set(id, []); archi.get(id).push(sn); }); });
      let cimaArchi = Infinity;
      const disegniArchi = [];
      archi.forEach(note => {
        if (note.length < 2) return;
        const cx = sn => sn.getAbsoluteX() + sn.getGlyphWidth() / 2;
        const alto = sn => { const ext = sn.getStemExtents(); const testa = sn.getYs()[0] - 6;
          return sn.getStemDirection() === 1 ? Math.min(ext.topY, ext.baseY, testa) : testa; };
        const x1 = cx(note[0]), x2 = cx(note[note.length - 1]);
        const yBase = Math.min(...note.map(alto)) - 5, picco = yBase - Math.min(16, 6 + (x2 - x1) * 0.04);
        cimaArchi = Math.min(cimaArchi, picco);
        disegniArchi.push([x1, x2, yBase, picco]);
      });
      disegniArchi.forEach(([x1, x2, yb, pk]) => {
        const xm = (x1 + x2) / 2, c = 2 * pk - yb;   // punto di controllo per avere il picco giusto
        ctx.save(); ctx.setFillStyle("#111"); ctx.beginPath();
        ctx.moveTo(x1, yb); ctx.quadraticCurveTo(xm, c, x2, yb); ctx.quadraticCurveTo(xm, c - 2.6, x1, yb);
        ctx.closePath(); ctx.fill(); ctx.restore();
      });
      const ySopra = Math.min(stRiga.getYForLine(0) - 14, piuAlto - 8, cimaArchi - 6);
      const ySotto = Math.max(stRiga.getYForLine(4) + 30, piuBasso + 18);
      const testo = (t, xc, yy, font) => { ctx.save(); ctx.setFont(font[0], font[1]); ctx.setFillStyle("#111");
        ctx.fillText(t, xc - ctx.measureText(t).width / 2, yy); ctx.restore(); };
      // con i colori le note evidenziate hanno un cerchietto rosso attorno alla testa
      if (o.colori) daScrivere.forEach(sn => {
        const e = sn._ev; if (!e || !e.evidenzia || e.pausa) return;
        const xc = sn.getAbsoluteX() + sn.getGlyphWidth() / 2, yc = sn.getYs()[0];
        ctx.save(); ctx.setStrokeStyle("#D0021B"); ctx.setLineWidth(2.2); ctx.beginPath();
        ctx.arc(xc, yc, 10.5, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      });
      const cerchio = (t, xc, yy) => { ctx.save(); ctx.setStrokeStyle("#111"); ctx.setLineWidth(1.1); ctx.setFillStyle("#fff");
        ctx.beginPath(); ctx.arc(xc, yy - 3.6, 6.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.setFont("Arial", 9.5, "bold"); ctx.setFillStyle("#111"); ctx.fillText(t, xc - ctx.measureText(t).width / 2, yy); ctx.restore(); };
      const yNomeSotto = corde && ditAttiva ? ySotto + 18 : ySotto;
      daScrivere.forEach(sn => {
        if (!sn._nome) return;
        const xc = sn.getAbsoluteX() + sn.getGlyphWidth() / 2;
        if (sn._dito) testo(sn._dito, xc, ySopra, ["Arial", 10]);
        if (sn._corda) cerchio(sn._corda, xc, ySopra);                       // corda: numero nel cerchietto, sopra
        if (sn._tasto) { ctx.save(); ctx.setFont("Arial", 10, "bold"); ctx.setFillStyle("#111");
          ctx.fillText(sn._tasto, xc - ctx.measureText(sn._tasto).width / 2, ySotto); ctx.restore(); }  // tasto in romano, sotto
        if (o.nomi) testo(sn._nome, xc, nomiSotto ? yNomeSotto : ySopra, ["Georgia, serif", 12]);
      });
      // dinamiche (p, mf, f...): in grassetto corsivo, sotto le altre indicazioni
      const yDin = (nomiSotto && o.nomi ? yNomeSotto : (corde && ditAttiva ? ySotto : ySotto - 12)) + 17;
      daScrivere.forEach(sn => {
        const e = sn._ev; if (!e || !e.dinamica) return;
        ctx.save(); ctx.setFont("Georgia, serif", 14, "bold", "italic"); ctx.setFillStyle("#111");
        ctx.fillText(e.dinamica, sn.getAbsoluteX() - 2, yDin); ctx.restore();
      });
      // indicazioni scritte, in corsivo, sopra nomi e dita
      // volte (prima e seconda volta): parentesi sopra i nomi delle note
      const yVolta = ySopra - (haSopra ? 30 : 16);
      volteRiga.forEach(({ st, volta }) => {
        const x1 = st.getX() + 2, x2 = st.getX() + st.getWidth() - 2;
        ctx.save(); ctx.setStrokeStyle("#111"); ctx.setLineWidth(1.3); ctx.beginPath();
        ctx.moveTo(volta.inizio ? x1 : st.getX(), volta.inizio ? yVolta + 14 : yVolta);
        if (volta.inizio) ctx.lineTo(x1, yVolta);
        ctx.lineTo(x2, yVolta); if (volta.fine) ctx.lineTo(x2, yVolta + 14);
        ctx.stroke(); ctx.restore();
        if (volta.inizio) { ctx.save(); ctx.setFont("Arial", 12, "bold"); ctx.setFillStyle("#111"); ctx.fillText(volta.numero + ".", x1 + 5, yVolta + 13); ctx.restore(); }
      });
      if (conTesti) {
        const yTesti = (volteRiga.length ? yVolta - 6 : ySopra - (haSopra ? 18 : 4));
        const scrivi = (t, xx, allinea) => { ctx.save(); ctx.setFont("Georgia, serif", 12, "normal", "italic"); ctx.setFillStyle("#334155");
          const w = ctx.measureText(t).width;
          // le scritte che arriverebbero oltre il bordo destro si spostano a sinistra
          const xt = Math.max(4, Math.min(allinea === "destra" ? xx - w : xx, W - 6 - w));
          ctx.fillText(t, xt, yTesti); ctx.restore(); };
        daScrivere.forEach(sn => {
          const e = sn._ev; if (!e) return;
          // per le pause di battuta intera (centrate) il testo parte dall'inizio della battuta
          if (e.testi) scrivi(e.testi.join("  "), e.intera ? sn.getStave().getNoteStartX() : sn.getAbsoluteX() - 4);
          if (e.testiDopo) scrivi(e.testiDopo.join("  "), sn.getStave().getX() + sn.getStave().getWidth() - 4, "destra");
        });
        testiPause.forEach(tp => scrivi(tp.t, tp.x));
        if (r === 0 && (brano.andamento || brano.metronomo)) {
          const nota = brano.metronomo ? ({ quarter: "♩", half: "𝅗𝅥", eighth: "♪" }[brano.metronomo.unita] || "♩") + " = " + brano.metronomo.valore : "";
          const t = [brano.andamento, nota].filter(Boolean).join("   ");
          ctx.save(); ctx.setFont("Georgia, serif", 13, "bold"); ctx.setFillStyle("#111"); ctx.fillText(t, 14, yTesti - 18); ctx.restore();
        }
      }
    }
    // legature di valore e di portamento (anche da una riga all'altra)
    const suonate = tutteLeNote.filter(sn => !sn._ev.pausa);
    const collega = (da, a, tipo) => {
      if (!a) return;
      if (tipo === "valore") {
        if (da._riga === a._riga) new VF.StaveTie({ first_note: da, last_note: a, first_indices: [0], last_indices: [0] }).setContext(ctx).draw();
        else {
          new VF.StaveTie({ first_note: da, last_note: null, first_indices: [0], last_indices: [0] }).setContext(ctx).draw();
          new VF.StaveTie({ first_note: null, last_note: a, first_indices: [0], last_indices: [0] }).setContext(ctx).draw();
        }
      } else {
        const curva = (x1, x2) => new VF.Curve(x1, x2, { cps: [{ x: 0, y: 12 }, { x: 0, y: 12 }] }).setContext(ctx).draw();
        if (da._riga === a._riga) curva(da, a);
        else {
          const fineRiga = suonate.filter(n => n._riga === da._riga).pop();
          const inizioRiga = suonate.find(n => n._riga === a._riga);
          if (fineRiga !== da) curva(da, fineRiga);
          if (inizioRiga !== a) curva(inizioRiga, a);
        }
      }
    };
    suonate.forEach((sn, i) => {
      if (sn._ev.legaInizio) collega(sn, suonate[i + 1], "valore");
      // le legature di portamento sono già disegnate riga per riga come archi sopra le note
    });
    const svg = divRigo.querySelector("svg");
    svg.querySelectorAll("path, rect").forEach(el => { if (el.getAttribute("stroke") === "#999999") el.setAttribute("stroke", "#111"); });
    // riquadro adattato a tutto ciò che è disegnato (archi, testi, nomi possono sporgere)
    let vb = [0, 0, W, yPrima + righe * altezzaRiga];
    try {
      const bb = svg.getBBox();
      const top = Math.min(0, bb.y - 6), bottom = Math.max(vb[3], bb.y + bb.height + 6);
      vb = [0, top, W, bottom - top];
    } catch (e) {}
    svg.setAttribute("viewBox", vb.join(" "));
    svg.setAttribute("width", "100%"); svg.removeAttribute("height");
    svg.style.width = "100%"; svg.style.height = "auto";   // VexFlow fissa la larghezza in pixel: lo spartito deve adattarsi al contenitore
    svg._mappa = mappaBattute; svg._lungBattuta = lungBattuta;

    if (o.schema === false) return contenitore;
    // schema dello strumento con le note usate nel brano
    const divSchema = document.createElement("div"); divSchema.className = "schema-brano"; contenitore.appendChild(divSchema);
    const g = disegnaGruppo(divSchema, o.strumento, usate);
    const gw = +g.getAttribute("width"), gh = +g.getAttribute("height");
    g.setAttribute("viewBox", `0 0 ${gw} ${gh}`); g.setAttribute("width", "100%"); g.removeAttribute("height");
    g.style.width = "100%"; g.style.height = "auto";
    g.style.maxWidth = Math.min(gw * 0.9, o.larghezza * 0.75) + "px"; g.style.display = "block"; g.style.margin = "0 auto";
    return contenitore;
  }

  /* ===================== spartito adattato a un riquadro =====================
     Per ogni numero di battute per riga (da 2 a 8) allarga le battute quanto serve per riempire
     il riquadro (mai sotto una larghezza minima leggibile) e tiene la soluzione con le note più grandi.
     Restituisce { svg, scala }: lo spartito disegnato in "contenitore" e il suo ingrandimento. */
  function adattaBrano(contenitore, brano, opzioni, larghArea, altoArea) {
    const minBattuta = 150, testa = 120;
    let migliore = null;
    for (let perRiga = 2; perRiga <= 8; perRiga++) {
      if (perRiga > brano.battute.length) break;
      const minimo = minBattuta * perRiga + testa;
      disegnaBrano(contenitore, brano, Object.assign({}, opzioni, { larghezza: minimo, perRiga }));
      const altoLogico = contenitore.querySelector("svg").viewBox.baseVal.height;
      const larghIdeale = altoLogico * larghArea / altoArea;        // larghezza che riempie anche in altezza
      const larghezza = Math.max(minimo, larghIdeale);
      const scala = Math.min(larghArea / larghezza, altoArea / altoLogico);
      if (!migliore || scala > migliore.scala + 1e-6) migliore = { perRiga, larghezza, scala };
    }
    disegnaBrano(contenitore, brano, Object.assign({}, opzioni, { larghezza: Math.round(migliore.larghezza), perRiga: migliore.perRiga }));
    const svg = contenitore.querySelector("svg"), vb = svg.viewBox.baseVal;
    return { svg, scala: Math.min(larghArea / vb.width, altoArea / vb.height), perRiga: migliore.perRiga };
  }

  /* ===================== pagina A4 orizzontale, a tutto foglio =====================
     paginaA4(brano, opzioni, extra) -> Promise<SVGElement> di 1123 x 794 (A4 a 96 dpi).
     extra: { numero, titolo, riquadri: [testi], disegno: url di un SVG, pausePiuBattute }
     In alto: numero, titolo colorato, novità, schema dello strumento, disegno.
     Sotto: lo spartito, grande quanto il foglio permette. */
  const NS = "http://www.w3.org/2000/svg";
  const PW = 1123, PH = 794, M = 22;
  const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let fontIncorporato = null;
  function caricaFontTitolo() {   // il carattere del titolo, incorporato nel PDF: preso dal sito (fonts/fredoka.woff), non da Google
    if (fontIncorporato) return fontIncorporato;
    fontIncorporato = fetch("fonts/fredoka.woff").then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(buf => {
      let bin = ""; const v = new Uint8Array(buf);
      for (let i = 0; i < v.length; i += 0x8000) bin += String.fromCharCode.apply(null, v.subarray(i, i + 0x8000));
      return `@font-face{font-family:'Fredoka';font-weight:300 700;src:url(data:font/woff;base64,${btoa(bin)}) format('woff');}`;
    }).catch(() => "");
    return fontIncorporato;
  }
  function inDataUrl(url) {
    return fetch(url).then(r => r.text()).then(t => "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(t)))).catch(() => null);
  }
  function annida(svgSorgente, x, y, w, h, allinea) {   // copia un SVG dentro la pagina, in un riquadro
    const n = document.createElementNS(NS, "svg");
    n.setAttribute("x", x); n.setAttribute("y", y); n.setAttribute("width", w); n.setAttribute("height", h);
    n.setAttribute("viewBox", svgSorgente.getAttribute("viewBox"));
    n.setAttribute("preserveAspectRatio", (allinea || "xMidYMid") + " meet");
    // VexFlow mette colore e spessore di base (es. i gambi delle note) sul contenitore: li porto con me
    [...svgSorgente.attributes].forEach(a => { if (!["width", "height", "viewBox", "style", "xmlns", "x", "y", "preserveAspectRatio"].includes(a.name)) n.setAttribute(a.name, a.value); });
    n.innerHTML = svgSorgente.innerHTML;
    return n;
  }
  async function paginaA4(brano, opzioni, extra) {
    extra = extra || {};
    const fuori = document.createElement("div");
    fuori.style.cssText = "position:fixed;left:-20000px;top:0;width:1400px;background:#fff";
    document.body.appendChild(fuori);
    try {
      const pagina = document.createElementNS(NS, "svg");
      pagina.setAttribute("xmlns", NS); pagina.setAttribute("viewBox", `0 0 ${PW} ${PH}`);
      pagina.setAttribute("width", PW); pagina.setAttribute("height", PH);
      let corpo = `<rect width="${PW}" height="${PH}" fill="#fff"/>`;
      // --- intestazione ---
      const riquadri = (extra.riquadri || []).map(t => t.split(/\n/).map(r => r.trim()).filter(Boolean));
      const larghSinistra = PW * 0.44;
      let xT = M;
      if (extra.numero != null) {
        corpo += `<circle cx="${M + 22}" cy="${M + 24}" r="22" fill="#5E50A1"/><text x="${M + 22}" y="${M + 32}" text-anchor="middle" font-family="Fredoka, 'Arial Rounded MT Bold', Arial, sans-serif" font-weight="700" font-size="22" fill="#fff">${extra.numero}</text>`;
        xT = M + 56;
      }
      const titolo = extra.titolo || brano.titoloBreve || brano.titolo || "";
      const fs = Math.max(22, Math.min(40, (larghSinistra - (xT - M)) / Math.max(6, titolo.length * 0.58)));
      let k = 0;
      const tspans = [...titolo].map(c => c === " " ? " " : `<tspan fill="${["#E21C48","#F99D1C","#FFF428","#BED958","#009C95","#5E50A1","#CF3E96"][k++ % 7]}">${esc(c)}</tspan>`).join("");
      corpo += `<text x="${xT}" y="${M + 36}" font-family="Fredoka, 'Arial Rounded MT Bold', 'Arial Black', Arial, sans-serif" font-weight="700" font-size="${fs}" stroke="#1F2430" stroke-width="${fs / 13}" paint-order="stroke" stroke-linejoin="round">${tspans}</text>`;
      let yR = M + 56;
      riquadri.forEach(righe => {
        const novita = /^NOVIT/i.test(righe[0]);
        const testa = novita ? "Novità: " + righe[0].replace(/^NOVIT[ÀA]\s*:?\s*/i, "") : "Attenzione";
        const resto = novita ? righe.slice(1) : righe;
        const h = 24 + resto.length * 15 + 8;
        corpo += `<rect x="${M}" y="${yR}" width="${larghSinistra}" height="${h}" rx="10" fill="${novita ? "#FFF7B8" : "#DDF3FF"}" stroke="${novita ? "#F5D90A" : "#7CC6F2"}" stroke-width="2"/>`;
        corpo += `<text x="${M + 12}" y="${yR + 20}" font-family="Fredoka, 'Arial Rounded MT Bold', Arial, sans-serif" font-weight="700" font-size="15" fill="#1F2430">${novita ? "★ " : "💡 "}${esc(testa)}</text>`;
        resto.forEach((r, i) => corpo += `<text x="${M + 12}" y="${yR + 38 + i * 15}" font-family="Arial, sans-serif" font-size="12.5" fill="#1F2430">${esc(r)}</text>`);
        yR += h + 6;
      });
      const altoTesta = Math.max(yR - M, 118);
      // --- disegno (in alto a destra) e schema dello strumento (al centro) ---
      const latoDis = extra.disegno ? Math.min(altoTesta + 6, 150) : 0;
      if (extra.disegno) {
        const dataUrl = await inDataUrl(extra.disegno);
        if (dataUrl) corpo += `<image x="${PW - M - latoDis}" y="${M - 6}" width="${latoDis}" height="${latoDis}" href="${dataUrl}"/>`;
      }
      pagina.innerHTML = corpo;
      const divSchema = document.createElement("div"); fuori.appendChild(divSchema);
      const gs = disegnaGruppo(divSchema, opzioni.strumento || "flauto", noteUsate(brano));
      gs.setAttribute("viewBox", `0 0 ${gs.getAttribute("width")} ${gs.getAttribute("height")}`);
      const xS = M + larghSinistra + 14, wS = PW - M - latoDis - 10 - xS;
      pagina.appendChild(annida(gs, xS, M - 4, wS, altoTesta + 4, "xMidYMid"));
      // --- spartito: provo diverse battute per riga e tengo il più grande che sta nel foglio ---
      const yS = M + altoTesta + 10, wSp = PW - 2 * M, hSp = PH - yS - M;
      const divSp = document.createElement("div"); fuori.appendChild(divSp);
      const ad = adattaBrano(divSp, brano, Object.assign({}, opzioni, { titolo: false, schema: false, pausePiuBattute: extra.pausePiuBattute }), wSp, hSp);
      pagina.appendChild(annida(ad.svg, M, yS, wSp, hSp, "xMidYMid"));
      return pagina;
    } finally { fuori.remove(); }
  }

  /* stampa: la pagina occupa tutto il foglio A4 orizzontale */
  function stampaPagina(pagina) {
    let area = document.getElementById("motoreAreaStampa");
    if (!area) {
      area = document.createElement("div"); area.id = "motoreAreaStampa"; document.body.appendChild(area);
      const st = document.createElement("style");
      st.textContent = "#motoreAreaStampa{display:none}@media print{@page{size:A4 landscape;margin:0}" +
        "body.motore-stampa>*:not(#motoreAreaStampa){display:none!important}body.motore-stampa{background:#fff!important;margin:0}" +
        "body.motore-stampa::before,body.motore-stampa::after{display:none!important}" +
        "body.motore-stampa #motoreAreaStampa{display:block}#motoreAreaStampa>svg{width:297mm;height:209mm;display:block}}";
      document.head.appendChild(st);
      window.addEventListener("afterprint", () => { document.body.classList.remove("motore-stampa"); area.innerHTML = ""; });
    }
    area.innerHTML = ""; area.appendChild(pagina);
    document.body.classList.add("motore-stampa");
    window.print();
  }

  /* PDF: la pagina diventa un'immagine ad alta risoluzione dentro un PDF A4 orizzontale, senza margini */
  async function salvaPaginaPDF(pagina, nomeFile) {
    const font = await caricaFontTitolo();
    const copia = pagina.cloneNode(true);
    if (font) { const st = document.createElementNS(NS, "style"); st.textContent = font; copia.insertBefore(st, copia.firstChild); }
    const scala = 2.6;
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copia)], { type: "image/svg+xml" }));
    const img = new Image();
    await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = url; });
    const canvas = document.createElement("canvas"); canvas.width = Math.round(PW * scala); canvas.height = Math.round(PH * scala);
    const c = canvas.getContext("2d"); c.fillStyle = "#fff"; c.fillRect(0, 0, canvas.width, canvas.height);
    c.drawImage(img, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url);
    const dati = atob(canvas.toDataURL("image/jpeg", 0.9).split(",")[1]);
    const jpeg = new Uint8Array(dati.length); for (let i = 0; i < dati.length; i++) jpeg[i] = dati.charCodeAt(i);
    const W = 842, H = 595, enc = new TextEncoder(), parti = [], offset = []; let lung = 0;
    const scrivi = d => { const b = typeof d === "string" ? enc.encode(d) : d; parti.push(b); lung += b.length; };
    const contenuto = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
    scrivi("%PDF-1.4\n");
    const ogg = (n, t) => { offset[n] = lung; scrivi(`${n} 0 obj\n${t}\nendobj\n`); };
    ogg(1, "<< /Type /Catalog /Pages 2 0 R >>"); ogg(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
    ogg(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
    offset[4] = lung;
    scrivi(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
    scrivi(jpeg); scrivi("\nendstream\nendobj\n");
    ogg(5, `<< /Length ${contenuto.length} >>\nstream\n${contenuto}\nendstream`);
    const xref = lung;
    scrivi("xref\n0 6\n0000000000 65535 f \n" + [1, 2, 3, 4, 5].map(n => String(offset[n]).padStart(10, "0") + " 00000 n \n").join(""));
    scrivi(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    const href = URL.createObjectURL(new Blob(parti, { type: "application/pdf" }));
    const a = document.createElement("a"); a.href = href; a.download = nomeFile; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 3000);
  }

  /* schema di una sola nota (solo la diteggiatura, senza pentagramma), come SVG a sé */
  function schemaNota(strumento, n, posizione) {
    let w, h, corpo;
    if (strumento === "flauto") { w = 66; h = 188; corpo = svgFlauto(n, 40, 6); }
    else if (strumento === "tastiera") { w = 150; h = 64; corpo = svgTastiera(n, 75, 5); }
    else { w = larghezzaCorde(strumento, n, posizione) + 12; h = (CORDE[strumento] - 1) * 15 + 34; corpo = svgCorde(strumento, n, w / 2 + 4, 8, posizione); }
    return `<svg xmlns="${NS}" viewBox="0 0 ${w} ${h}" style="display:block;width:100%;height:auto"><g stroke="none">${corpo}</g></svg>`;
  }
  /* pentagramma con una sola nota (per le carte), come SVG */
  function rigoNota(contenitore, n, chiave) {
    chiave = chiave || "treble";
    const VF = (global.Vex && global.Vex.Flow) ? global.Vex.Flow : global.VexFlow;
    contenitore.innerHTML = "";
    const R = new VF.Renderer(contenitore, VF.Renderer.Backends.SVG); R.resize(150, 110);
    const ctx = R.getContext();
    const st = new VF.Stave(4, 10, 142); st.setBegBarType(VF.Barline.type.NONE); st.setEndBarType(VF.Barline.type.NONE);
    st.setStyle({ strokeStyle: "#111", fillStyle: "#111" }); st.addClef(chiave).setContext(ctx).draw();
    const sn = new VF.StaveNote({ keys: [n.lettera + n.alt + "/" + n.ottava], duration: "w", clef: chiave });
    if (n.alt) sn.addModifier(new VF.Accidental(n.alt), 0);
    sn.setStave(st); const tc = new VF.TickContext(); tc.addTickable(sn).preFormat(); tc.setX(95 - st.getNoteStartX()); sn.setContext(ctx).draw();
    const svg = contenitore.querySelector("svg");
    svg.querySelectorAll("path, rect").forEach(el => { if (el.getAttribute("stroke") === "#999999") el.setAttribute("stroke", "#111"); });
    // riquadro adattato anche alle note con molti tagli addizionali (sopra o sotto il pentagramma)
    let alto = 0, basso = 110;
    try { const bb = svg.getBBox(); alto = Math.min(0, bb.y - 4); basso = Math.max(110, bb.y + bb.height + 4); } catch (e) {}
    svg.setAttribute("viewBox", `0 ${alto} 150 ${basso - alto}`); svg.removeAttribute("width"); svg.removeAttribute("height");
    svg.style.width = "100%"; svg.style.height = "auto"; svg.style.display = "block";
  }
  /* carte delle note, come negli schemi: pentagramma con la nota, nome colorato, diteggiatura */
  const LARGH_SCHEMA_CARTA = { flauto: 0.42, tastiera: 0.96, chitarra: 0.8, ukulele: 0.86, basso: 0.8 };
  function disegnaCarte(contenitore, strumento, note) {
    contenitore.innerHTML = "";
    note.forEach(n => {
      const carta = document.createElement("div"); carta.className = "carta-nota";
      const nome = NOMI[n.lettera].replace(/^./, c => c.toUpperCase()) + (n.alt === "b" ? "♭" : n.alt === "#" ? "♯" : "");
      carta.innerHTML = `<div class="carta-rigo"></div><div class="carta-nome" style="color:${COLORI[n.lettera]}">${nome}</div>` +
        `<div class="carta-schema" style="width:${Math.round((LARGH_SCHEMA_CARTA[strumento] || 0.8) * 100)}%;margin:0 auto">${schemaNota(strumento, n)}</div>`;
      contenitore.appendChild(carta);
      rigoNota(carta.querySelector(".carta-rigo"), n);
    });
  }

  global.MotoreSchemi = { posCorde, disegnaGruppo, disegnaBrano, leggiMusicXML, noteUsate, POSIZIONI, ALTERNATIVE, COLORI, NOMI, daNomi, analizza,
    paginaA4, stampaPagina, salvaPaginaPDF, disegnaCarte, adattaBrano, schemaNota, rigoNota, svgAccordo, ACCORDI, SIGLE, LETTERA_ACCORDO, romano };
})(window);
