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
    const brano = { titolo: (doc.querySelector("work-title, movement-title") || {}).textContent || "", armatura: 0, tempo: [4, 4], battute: [], riquadri: [] };
    const mt = doc.querySelector("movement-title");
    brano.titoloBreve = mt ? mt.textContent.replace(/^\s*\d+\.\s*/, "").trim() : brano.titolo;
    parte.querySelectorAll(":scope > measure").forEach(m => {
      const b = { eventi: [] };
      const key = m.querySelector("attributes key fifths"); if (key) brano.armatura = +key.textContent;
      const t = m.querySelector("attributes time"); if (t) brano.tempo = [+t.querySelector("beats").textContent, +t.querySelector("beat-type").textContent];
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
      let testiInAttesa = [];
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
          return;
        }
        if (n.tagName !== "note") return;
        if (n.querySelector("chord")) return;          // melodie a una voce
        const r = n.querySelector("rest");
        const intera = r && (r.getAttribute("measure") === "yes" || !n.querySelector("type"));
        const ev = { durata: intera ? "w" : (TIPI[(n.querySelector("type") || {}).textContent] || "q"), punti: n.querySelectorAll("dot").length };
        if (intera) ev.intera = true;
        if (testiInAttesa.length) { ev.testi = testiInAttesa; testiInAttesa = []; }
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
    const usate = noteUsate(brano);
    const piuGrave = o.notaBaseDita ? analizza(o.notaBaseDita) : usate[0];   // diteggiatura fissa (es. "g4" = sol pollice) o dal brano
    const conTesti = o.testi !== false;
    const W = o.larghezza;
    const perRiga = o.perRiga || (W < 520 ? 2 : 4), righe = Math.ceil(brano.battute.length / perRiga);
    const altezzaRiga = (tastiera ? 140 : 120) + (conTesti && o.titolo === false ? 14 : 0);
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
    { let aperte = [], prossima = 0;   // ogni nota sotto una legatura di portamento riceve il suo numero
      brano.battute.forEach(b => b.eventi.forEach(e => {
        if (e.pausa) return;
        if (e.portamentoInizio) aperte.push(prossima++);
        e.portamenti = aperte.slice();
        if (e.portamentoFine) aperte.pop();
      })); }
    for (let r = 0; r < righe; r++) {
      const battute = brano.battute.slice(r * perRiga, r * perRiga + perRiga);
      const y = yPrima + r * altezzaRiga + 10;
      const testa = (r === 0 ? 92 : 50) + (brano.armatura ? Math.abs(brano.armatura) * 10 : 0);
      // le battute con più note ricevono più spazio (minimo come 4 note)
      const pesi = battute.map(b => Math.max(4, b.eventi.length));
      const pesoTot = brano.battute.length >= perRiga ? Math.max(pesi.reduce((a, c) => a + c, 0), 4 * perRiga) : pesi.reduce((a, c) => a + c, 0);
      const spazio = W - 20 - testa;
      let x = 10, sn_ultimaBattuta = null;
      const daScrivere = [];   // note della riga: nomi e dita si scrivono alla fine, alla stessa altezza
      let stRiga = null;
      battute.forEach((b, i) => {
        const w = spazio * pesi[i] / pesoTot + (i === 0 ? testa : 0);
        const st = new VF.Stave(x, y, w);
        if (i === 0) { st.addClef("treble"); if (keySpec) st.addKeySignature(keySpec); if (r === 0) st.addTimeSignature(brano.tempo.join("/")); }
        if (b.inizioRitornello) st.setBegBarType(VF.Barline.type.REPEAT_BEGIN);
        if (b.volta) {
          const T = VF.VoltaType || (VF.Volta && VF.Volta.type);
          const tipo = b.volta.inizio && b.volta.fine ? T.BEGIN_END : b.volta.inizio ? T.BEGIN : b.volta.fine ? T.END : T.MID;
          st.setVoltaType(tipo, b.volta.numero + ".", 21);   // appena sopra i nomi delle note
        }
        if (b.fineRitornello) st.setEndBarType(VF.Barline.type.REPEAT_END);
        else if (b.fine || (r === righe - 1 && i === battute.length - 1)) st.setEndBarType(VF.Barline.type.END);
        st.setStyle({ strokeStyle: "#111", fillStyle: "#111" });
        st.setContext(ctx).draw();
        const note = b.eventi.map(e => {
          const durata = e.durata + (e.pausa ? "r" : "");
          const sn = new VF.StaveNote({ keys: [e.pausa ? (e.intera ? "d/5" : "b/4") : e.nota.lettera + e.nota.alt + "/" + e.nota.ottava], duration: durata, dots: e.punti, clef: "treble", auto_stem: true, align_center: !!e.intera });
          sn._ev = e; sn._riga = r;
          for (let k = 0; k < e.punti; k++) VF.Dot.buildAndAttach([sn], { all: true });
          if (e.pausa) return sn;
          // alterazione scritta solo se diversa da quella in chiave
          const inChiave = alterazioniInChiave[e.nota.lettera] || "";
          if (e.nota.alt !== inChiave) sn.addModifier(new VF.Accidental(e.nota.alt || "n"), 0);
          const col = COLORI[e.nota.lettera];
          if (o.colori) sn.setKeyStyle(0, { fillStyle: col, strokeStyle: col });
          sn._nome = NOMI[e.nota.lettera].replace(/^./, c => c.toUpperCase()) + (e.nota.alt === "b" ? "♭" : e.nota.alt === "#" ? "♯" : "");
          if (tastiera) sn._dito = e.dito || ditoTastiera(e.nota, piuGrave);
          if (e.legaFine) { sn._nome = ""; sn._dito = ""; }   // nota legata: non si suona di nuovo
          return sn;
        });
        const beams = VF.Beam.generateBeams(note);
        VF.Formatter.FormatAndDraw(ctx, st, note, { auto_beam: false });
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
      daScrivere.forEach(sn => {
        if (!sn._nome) return;
        const xc = sn.getAbsoluteX() + sn.getGlyphWidth() / 2;
        if (tastiera) {
          if (sn._dito) testo(sn._dito, xc, ySopra, ["Arial", 10]);
          if (o.nomi) testo(sn._nome, xc, ySotto, ["Georgia, serif", 12]);
        } else if (o.nomi) testo(sn._nome, xc, ySopra, ["Georgia, serif", 12]);
      });
      // indicazioni scritte, in corsivo, sopra nomi e dita
      if (conTesti) {
        const yTesti = ySopra - ((tastiera || o.nomi) ? 18 : 4);
        const scrivi = (t, xx, allinea) => { ctx.save(); ctx.setFont("Georgia, serif", 12, "normal", "italic"); ctx.setFillStyle("#334155");
          const w = ctx.measureText(t).width; ctx.fillText(t, allinea === "destra" ? xx - w : xx, yTesti); ctx.restore(); };
        daScrivere.forEach(sn => {
          const e = sn._ev; if (!e) return;
          // per le pause di battuta intera (centrate) il testo parte dall'inizio della battuta
          if (e.testi) scrivi(e.testi.join("  "), e.intera ? sn.getStave().getNoteStartX() : sn.getAbsoluteX() - 4);
          if (e.testiDopo) scrivi(e.testiDopo.join("  "), sn.getStave().getX() + sn.getStave().getWidth() - 4, "destra");
        });
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

  global.MotoreSchemi = { disegnaGruppo, disegnaBrano, leggiMusicXML, noteUsate, POSIZIONI, COLORI, NOMI, daNomi };
})(window);
