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
      f4: ["P", 1, 2, 3, 4], g4: ["P", 1, 2, 3], a4: ["P", 1, 2], bb4: ["P", 1, 3, 4], b4: ["P", 1],
      c5: ["P", 2], d5: [2], e5: ["P½", 1, 2, 3, 4, 5], f5: ["P½", 1, 2, 3, 4]
    },
    chitarra: {
      f4: [4, 3], g4: [3, 0], a4: [3, 2], bb4: [3, 3], b4: [2, 0], c5: [2, 1], d5: [2, 3], e5: [1, 0], f5: [1, 1]
    },
    ukulele: {
      f4: [2, 1], g4: [2, 3], a4: [1, 0], bb4: [1, 1], b4: [1, 2], c5: [1, 3], d5: [1, 5], e5: [1, 7], f5: [1, 8]
    },
    basso: {
      f2: [4, 1], g2: [4, 3], a2: [3, 0], bb2: [3, 1], b2: [3, 2], c3: [3, 3], d3: [2, 0], e3: [2, 2], f3: [2, 3]
    }
  };
  const CORDE = { chitarra: 6, ukulele: 4, basso: 4 };
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
  function svgCorde(strumento, nota, cx, top) {
    const nCorde = CORDE[strumento];
    const pos = POSIZIONI[strumento][nota.chiave];
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
      s += `<text x="${x0 - 22}" y="${y + 3.5}" font-size="10.5" text-anchor="middle" fill="${GRIGIO}" font-family="DejaVu Sans, Verdana, sans-serif" font-weight="400">${["I","II","III","IV","V","VI"][c - 1]}</text>`;
    }
    // segni di riferimento sulla tastiera (tra le corde centrali)
    for (const f of SEGNI_TASTO[strumento]) if (f <= tasti)
      s += `<circle cx="${x0 + (f - 0.5) * largTasto}" cy="${y0 + alto / 2}" r="2.6" fill="${GRIGIO_CHIARO}"/>`;
    // capotasto
    s += `<line x1="${x0}" y1="${y0 - 1}" x2="${x0}" y2="${y0 + alto + 1}" stroke="#111" stroke-width="3.2"/>`;
    // numeri dei tasti
    for (let t = 1; t <= tasti; t++) s += `<text x="${x0 + (t - 0.5) * largTasto}" y="${y0 + alto + 14}" font-size="9.5" text-anchor="middle" fill="${GRIGIO}" font-family="DejaVu Sans, Verdana, sans-serif" font-weight="400">${t}</text>`;
    // dito o corda a vuoto
    const y = y0 + (corda - 1) * passo;
    if (tasto === 0) s += `<circle cx="${x0 - 8}" cy="${y}" r="5.2" fill="#fff" stroke="${bordo}" stroke-width="2"/>`;
    else s += `<circle cx="${x0 + (tasto - 0.5) * largTasto}" cy="${y}" r="6.2" fill="${col}" stroke="${bordo}" stroke-width="1"/>`;
    return s;
  }
  function larghezzaCorde(strumento, nota) {
    const pos = POSIZIONI[strumento][nota.chiave] || [1, 3];
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
    for (let i = 1; i <= 7; i++) s += foro(cx, ys[i - 1], chiusi.includes(i) ? "chiuso" : "aperto");
    return s;
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
    const brano = { titolo: (doc.querySelector("work-title, movement-title") || {}).textContent || "", armatura: 0, tempo: [4, 4], battute: [] };
    parte.querySelectorAll(":scope > measure").forEach(m => {
      const b = { eventi: [] };
      const key = m.querySelector("attributes key fifths"); if (key) brano.armatura = +key.textContent;
      const t = m.querySelector("attributes time"); if (t) brano.tempo = [+t.querySelector("beats").textContent, +t.querySelector("beat-type").textContent];
      m.querySelectorAll(":scope > barline").forEach(bl => {
        const r = bl.querySelector("repeat");
        if (r && r.getAttribute("direction") === "forward") b.inizioRitornello = true;
        if (r && r.getAttribute("direction") === "backward") b.fineRitornello = true;
        if (!r && (bl.querySelector("bar-style") || {}).textContent === "light-heavy") b.fine = true;
      });
      m.querySelectorAll(":scope > note").forEach(n => {
        if (n.querySelector("chord")) return;          // melodie a una voce
        const ev = { durata: TIPI[(n.querySelector("type") || {}).textContent] || "q", punti: n.querySelectorAll("dot").length };
        if (n.querySelector("rest")) ev.pausa = true;
        else {
          const step = n.querySelector("pitch step").textContent.toLowerCase();
          const alter = +((n.querySelector("pitch alter") || {}).textContent || 0);
          ev.nota = analizza(step + (alter === -1 ? "b" : alter === 1 ? "#" : "") + n.querySelector("pitch octave").textContent);
          const dito = n.querySelector("technical fingering"); if (dito) ev.dito = dito.textContent.trim();
        }
        b.eventi.push(ev);
      });
      brano.battute.push(b);
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
    const usate = noteUsate(brano), piuGrave = usate[0];
    const W = o.larghezza;
    const perRiga = o.perRiga || (W < 520 ? 2 : 4), righe = Math.ceil(brano.battute.length / perRiga);
    const altezzaRiga = tastiera ? 140 : 120, yPrima = 30;
    contenitore.innerHTML = "";
    const divRigo = document.createElement("div"); contenitore.appendChild(divRigo);
    const renderer = new VF.Renderer(divRigo, VF.Renderer.Backends.SVG);
    renderer.resize(W, yPrima + righe * altezzaRiga);
    const ctx = renderer.getContext();
    if (brano.titolo) { ctx.save(); ctx.setFont("Georgia, serif", 18); ctx.fillText(brano.titolo, W / 2 - ctx.measureText(brano.titolo).width / 2, 20); ctx.restore(); }
    const keySpec = brano.armatura ? (["F","Bb","Eb","Ab","Db","Gb","Cb"][-brano.armatura - 1] || ["G","D","A","E","B","F#","C#"][brano.armatura - 1]) : null;

    for (let r = 0; r < righe; r++) {
      const battute = brano.battute.slice(r * perRiga, r * perRiga + perRiga);
      const y = yPrima + r * altezzaRiga + 10;
      const testa = r === 0 ? 92 : 50;
      const largB = (W - 20 - testa) / perRiga;
      let x = 10;
      battute.forEach((b, i) => {
        const w = largB + (i === 0 ? testa : 0);
        const st = new VF.Stave(x, y, w);
        if (i === 0) { st.addClef("treble"); if (keySpec) st.addKeySignature(keySpec); if (r === 0) st.addTimeSignature(brano.tempo.join("/")); }
        if (b.inizioRitornello) st.setBegBarType(VF.Barline.type.REPEAT_BEGIN);
        if (b.fineRitornello) st.setEndBarType(VF.Barline.type.REPEAT_END);
        else if (b.fine || (r === righe - 1 && i === battute.length - 1)) st.setEndBarType(VF.Barline.type.END);
        st.setStyle({ strokeStyle: "#111", fillStyle: "#111" });
        st.setContext(ctx).draw();
        const note = b.eventi.map(e => {
          const durata = e.durata + (e.pausa ? "r" : "");
          const sn = new VF.StaveNote({ keys: [e.pausa ? "b/4" : e.nota.lettera + e.nota.alt + "/" + e.nota.ottava], duration: durata, clef: "treble", auto_stem: true });
          for (let k = 0; k < e.punti; k++) VF.Dot.buildAndAttach([sn], { all: true });
          if (e.pausa) return sn;
          if (e.nota.alt) sn.addModifier(new VF.Accidental(e.nota.alt), 0);
          const col = COLORI[e.nota.lettera];
          if (o.colori) sn.setKeyStyle(0, { fillStyle: col, strokeStyle: col });
          sn._nome = NOMI[e.nota.lettera].replace(/^./, c => c.toUpperCase()) + (e.nota.alt === "b" ? "♭" : e.nota.alt === "#" ? "♯" : "");
          if (tastiera) sn._dito = e.dito || ditoTastiera(e.nota, piuGrave);
          return sn;
        });
        const beams = VF.Beam.generateBeams(note);
        VF.Formatter.FormatAndDraw(ctx, st, note, { auto_beam: false });
        beams.forEach(bm => bm.setContext(ctx).draw());
        // nomi delle note e dita: su righe fisse, in nero, come negli spartiti stampati
        const ySopra = st.getYForLine(0) - 14, ySotto = st.getYForLine(4) + 44;
        const testo = (t, xc, yy, font) => { ctx.save(); ctx.setFont(font[0], font[1]); ctx.setFillStyle("#111");
          ctx.fillText(t, xc - ctx.measureText(t).width / 2, yy); ctx.restore(); };
        note.forEach(sn => {
          if (!sn._nome) return;
          const xc = sn.getAbsoluteX() + sn.getGlyphWidth() / 2;
          if (tastiera) {
            if (sn._dito) testo(sn._dito, xc, ySopra, ["Arial", 10]);
            if (o.nomi) testo(sn._nome, xc, ySotto, ["Georgia, serif", 12]);
          } else if (o.nomi) testo(sn._nome, xc, ySopra, ["Georgia, serif", 12]);
        });
        x += w;
      });
    }
    const svg = divRigo.querySelector("svg");
    svg.querySelectorAll("path, rect").forEach(el => { if (el.getAttribute("stroke") === "#999999") el.setAttribute("stroke", "#111"); });
    svg.setAttribute("viewBox", `0 0 ${W} ${yPrima + righe * altezzaRiga}`);
    svg.setAttribute("width", "100%"); svg.removeAttribute("height");

    // schema dello strumento con le note usate nel brano
    const divSchema = document.createElement("div"); divSchema.className = "schema-brano"; contenitore.appendChild(divSchema);
    const g = disegnaGruppo(divSchema, o.strumento, usate);
    const gw = +g.getAttribute("width"), gh = +g.getAttribute("height");
    g.setAttribute("viewBox", `0 0 ${gw} ${gh}`); g.setAttribute("width", "100%"); g.removeAttribute("height");
    g.style.maxWidth = Math.min(gw * 0.9, o.larghezza * 0.75) + "px"; g.style.display = "block"; g.style.margin = "0 auto";
    return contenitore;
  }

  global.MotoreSchemi = { disegnaGruppo, disegnaBrano, leggiMusicXML, noteUsate, POSIZIONI, COLORI, NOMI, daNomi };
})(window);
