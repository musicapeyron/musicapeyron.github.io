/* Schede da stampare per la primaria — motore di impaginazione.
   Usa il vexflow.js del sito (VexFlow 4.2.2) e, dove serve, motore-schemi.js (carte, brani).
   Le pagine sono A4 (210 x 297 mm); si stampano in PDF con genera_pdf.py.

   Concetti:
   - Schede.scheda(classe, meta, disegna)  registra una scheda; disegna(corpo, api) la riempie.
   - stato.modo "col" (a colori) o "bn" (bianco e nero: illustrazioni da colorare, niente colori delle note).
   - stato.sol  true = volume delle soluzioni: le schede con meta.sol disegnano anche le risposte.
   - Pentagramma: unità di VexFlow (1 spazio = 10 unità); "passo" 0 = 1° rigo (mi), 1 = 1° spazio (fa) …
*/
(function (global) {
  "use strict";
  const VF = global.Vex.Flow;
  const NS = "http://www.w3.org/2000/svg";
  const MM = 96 / 25.4;                       // pixel per millimetro
  const LARGHEZZA = Math.round(184 * MM);     // larghezza utile della pagina in pixel

  const COLORI = { c: "#E21C48", d: "#F99D1C", e: "#FFF428", f: "#BED958", g: "#009C95", a: "#5E50A1", b: "#CF3E96" };
  const NOMI = { c: "do", d: "re", e: "mi", f: "fa", g: "sol", a: "la", b: "si" };
  const LETTERE = { do: "c", re: "d", mi: "e", fa: "f", sol: "g", la: "a", si: "b" };
  const ORDINE = ["c", "d", "e", "f", "g", "a", "b"];

  const AREE = {
    G: ["Grafia", "matita"], N: ["Note", "nota"], R: ["Ritmo", "tamburo"], A: ["Ascolto e suono", "orecchio"],
    S: ["Strumenti", "violino"], C: ["Creatività", "lampadina"], X: ["Ritaglia e gioca", "forbici"],
    V: ["Verifica", "stella"], M: ["Per tutto l'anno", "libro"]
  };

  const stato = { classe: 2, modo: "col", sol: false, solo: null, schede: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    titoliClasse: {}, pagine: 0, corpi: [], adattate: [] };

  /* ---------------- utilità ---------------- */
  function el(tag, attr, ...figli) {
    const e = document.createElement(tag);
    if (attr) for (const k in attr) {
      if (k === "html") e.innerHTML = attr[k];
      else if (k === "style" && typeof attr[k] === "object") Object.assign(e.style, attr[k]);
      else e.setAttribute(k, attr[k]);
    }
    figli.flat().forEach(f => { if (f == null || f === false) return; e.appendChild(typeof f === "string" ? document.createTextNode(f) : f); });
    return e;
  }
  function sv(tag, attr) {
    const e = document.createElementNS(NS, tag);
    for (const k in attr) e.setAttribute(k, attr[k]);
    return e;
  }
  function img(nome, mm, extra) {
    const d = el("span", Object.assign({ class: "img" }, extra || {}));
    d.style.width = mm + "mm"; d.style.height = mm + "mm";
    d.appendChild(el("img", { src: `img/${stato.modo}/${nome}.svg`, alt: "" }));
    return d;
  }
  /* numeri casuali ripetibili: la stessa scheda esce sempre uguale (e le soluzioni coincidono) */
  function caso(seme) {
    let h = 2166136261;
    for (const c of String(seme)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    let a = h >>> 0;
    const r = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    return {
      r, int: (min, max) => min + Math.floor(r() * (max - min + 1)),
      pick: arr => arr[Math.floor(r() * arr.length)],
      mescola: arr => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; },
      /* sequenza senza due valori uguali di fila */
      serie: (arr, n) => { const o = []; let prima = null; for (let i = 0; i < n; i++) { let v; let k = 0; do { v = arr[Math.floor(r() * arr.length)]; k++; } while (v === prima && arr.length > 1 && k < 20); o.push(v); prima = v; } return o; }
    };
  }
  const col = () => stato.modo === "col";
  const scuro = (hex, f) => { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) * f, g = ((n >> 8) & 255) * f, b = (n & 255) * f; return `rgb(${r | 0},${g | 0},${b | 0})`; };

  /* "g4" -> { l:"g", alt:"", o:4, passo } ; passo 0 = mi4 (1° rigo) */
  function nota(s) {
    const m = /^([a-g])(#|b|n)?(\d)$/.exec(s);
    if (!m) throw new Error("nota? " + s);
    const l = m[1], o = +m[3];
    return { l, alt: m[2] || "", o, passo: (o - 4) * 7 + ORDINE.indexOf(l) - 2, nome: NOMI[l], key: l + (m[2] && m[2] !== "n" ? m[2] : "") + "/" + o };
  }
  const nomeDi = s => nota(s).nome;

  /* ---------------- pentagramma "didattico" ----------------
     o: larg (px), spazio (px tra due righi), sopra/sotto (spazi liberi), linee: "solide"|"grigie"|"tratteggiate"|"nessuna",
        chiave: false|"nera"|"grigia"|"traccia", tempo: "2/4"…, inizio: unità lasciate a sinistra */
  function pentagramma(cont, o) {
    o = Object.assign({ larg: LARGHEZZA, spazio: 30, sopra: 2, sotto: 2, linee: "solide", chiave: false, sbarre: false }, o);
    const sc = o.spazio / 10, W = o.larg / sc, H = (4 + o.sopra + o.sotto) * 10;
    const wrap = el("div", { class: "penta", style: { width: o.larg + "px", height: (H * sc) + "px" } });
    cont.appendChild(wrap);
    const r = new VF.Renderer(wrap, VF.Renderer.Backends.SVG);
    r.resize(o.larg, H * sc);
    const ctx = r.getContext(); ctx.scale(sc, sc);
    const st = new VF.Stave(0, o.sopra * 10, W - 1, { space_above_staff_ln: 0, space_below_staff_ln: 0 });
    st.setBegBarType(VF.Barline.type.NONE); st.setEndBarType(VF.Barline.type.NONE);
    if (!o.sbarre) { st.options.left_bar = false; st.options.right_bar = false; }
    const tinta = o.linee === "grigie" ? "#a7acb8" : "#222";
    st.setStyle({ strokeStyle: tinta, fillStyle: tinta });
    if (o.linee === "tratteggiate" || o.linee === "nessuna") st.setConfigForLines([0, 1, 2, 3, 4].map(() => ({ visible: false })));
    st.setContext(ctx).draw();
    const svg = ctx.svg;
    const yRigo = i => st.getYForLine(4 - i);          // i: 0 = 1° rigo (in basso) … 4 = 5° rigo
    const P = {
      ctx, st, svg, sc, W, H, wrap, o,
      y: passo => yRigo(0) - passo * 5,                // y di una nota (passo 0 = mi4)
      yRigo, add: (tag, attr) => { const e = sv(tag, attr); svg.appendChild(e); return e; },
      px: u => u * sc
    };
    if (o.linee === "tratteggiate") for (let i = 0; i < 5; i++)
      P.add("line", { x1: 0, x2: W, y1: yRigo(i), y2: yRigo(i), stroke: "#8b90a0", "stroke-width": 0.9, "stroke-dasharray": "3 2.2" });
    if (o.chiave) disegnaChiave(P, o.inizioChiave || 4, o.chiave);
    if (o.tempo) tempoGlifo(P, o.chiave ? 34 : 6, o.tempo);
    return P;
  }

  /* glifi di VexFlow (forme della notazione "vera") */
  function glifo(P, x, y, codice, colore, punto) {
    P.ctx.save(); P.ctx.setFillStyle(colore || "#111"); P.ctx.setStrokeStyle(colore || "#111");
    VF.Glyph.renderGlyph(P.ctx, x, y, punto || 39, codice);
    P.ctx.restore();
  }
  const GRIGIO_TRACCIA = "#9aa0ad", GRIGIO_FANTASMA = "#d3d6de";

  /* chiave di violino: "nera", "grigia" (da ripassare colorando), "traccia" (linea tratteggiata da seguire), "puntini" (con numeri) */
  const CHIAVE_PERCORSO = [["M", 1.85, 0.25], ["C", 1.3, 0.3, 1.25, -0.6, 1.85, -0.65], ["C", 2.65, -0.65, 2.8, 0.85, 1.75, 0.97],
    ["C", 0.35, 1.05, -0.25, 0.1, 0.45, -0.8], ["C", 1.1, -1.5, 2.35, -2.2, 2.3, -3.3], ["C", 2.25, -4.15, 1.85, -4.55, 1.6, -4.2],
    ["C", 1.2, -3.6, 1.3, -2.4, 1.55, -1.2], ["L", 2.0, 2.0], ["C", 2.05, 2.6, 1.2, 2.75, 0.95, 2.25]];
  function percorso(def, X, Y, s) {
    return def.map(p => p[0] + " " + p.slice(1).map((v, i) => i % 2 ? (Y + v * s) : (X + v * s)).join(" ")).join(" ");
  }
  function disegnaChiave(P, x, stile) {
    const y = P.yRigo(1);
    if (stile === "nera") return glifo(P, x, y, "gClef");
    if (stile === "grigia") return glifo(P, x, y, "gClef", GRIGIO_FANTASMA);
    if (stile === "fantasma") return glifo(P, x, y, "gClef", "#eceef3");
    const d = percorso(CHIAVE_PERCORSO, x, y, 10);
    if (stile === "traccia" || stile === "puntini") {
      const sw = Math.max(0.7, 1.6 / P.sc);
      P.add("path", { d, fill: "none", stroke: GRIGIO_TRACCIA, "stroke-width": sw * 1.3, "stroke-dasharray": `${sw * 2.2} ${sw * 2}`, "stroke-linecap": "round" });
      P.add("circle", { cx: x + 0.95 * 10, cy: y + 2.25 * 10 - 1, r: 2.6, fill: "none", stroke: GRIGIO_TRACCIA, "stroke-width": sw, "stroke-dasharray": `${sw * 1.5} ${sw * 1.4}` });
      partenza(P, x + 18.5, y + 2.5, stile === "puntini" ? 1 : null);
    }
    if (stile === "puntini") {
      /* tappe numerate lungo il gesto */
      const tappe = [[2.95, 0.05, 2], [-0.25, 0.3, 3], [2.75, -3.75, 4], [2.4, 1.55, 5], [0.45, 2.85, 6]];
      tappe.forEach(([tx, ty, n]) => numeretto(P, x + tx * 10, y + ty * 10, n));
    }
  }
  function partenza(P, x, y, n) {
    P.add("circle", { cx: x, cy: y, r: n ? 2.9 : 2.1, fill: col() ? "#16a34a" : "#000" });
    if (n) { const t = P.add("text", { x, y: y + 1.45, "text-anchor": "middle", "font-size": 4, "font-family": "Fredoka", "font-weight": 600, fill: "#fff" }); t.textContent = n; }
  }
  function numeretto(P, x, y, n) {
    P.add("circle", { cx: x, cy: y, r: 2.6, fill: "#fff", stroke: col() ? "#1f2a5c" : "#000", "stroke-width": 0.5 });
    const t = P.add("text", { x, y: y + 1.35, "text-anchor": "middle", "font-size": 3.6, "font-family": "Fredoka", "font-weight": 600, fill: col() ? "#1f2a5c" : "#000" });
    t.textContent = n;
  }
  function tempoGlifo(P, x, tempo) {
    const [a, b] = tempo.split("/");
    glifo(P, x, P.yRigo(3), "timeSig" + a); glifo(P, x, P.yRigo(1), "timeSig" + b);
  }

  /* ---- figure disegnate a mano (per ripassare: "traccia"; per modello: "piena"/"vuota"; per colorare: "bianca") ---- */
  const TESTA = { rx: 6.3, ry: 4.6 };
  function testa(P, x, passo, stile, colore) {
    const y = P.y(passo);
    tagli(P, x, passo, stile === "traccia");
    const base = { cx: x, cy: y, rx: TESTA.rx, ry: TESTA.ry, transform: `rotate(-22 ${x} ${y})` };
    if (stile === "traccia") return P.add("ellipse", Object.assign(base, { fill: "none", stroke: GRIGIO_TRACCIA, "stroke-width": 1.05, "stroke-dasharray": "2.1 1.7" }));
    if (stile === "grigia") return P.add("ellipse", Object.assign(base, { fill: GRIGIO_FANTASMA }));
    if (stile === "vuota") return P.add("ellipse", Object.assign(base, { rx: 5.9, ry: 4.1, fill: "#fff", stroke: colore || "#111", "stroke-width": 1.5 }));
    if (stile === "bianca") return P.add("ellipse", Object.assign(base, { rx: 6.6, ry: 4.9, fill: colore || "#fff", stroke: "#111", "stroke-width": 1.1 }));
    if (stile === "colore") return P.add("ellipse", Object.assign(base, { fill: colore, stroke: scuro(colore, 0.6), "stroke-width": 0.9 }));
    if (stile === "puntino") return P.add("circle", { cx: x, cy: y, r: 1.5, fill: "#6b7280" });
    return P.add("ellipse", Object.assign(base, { fill: colore || "#111" }));
  }
  function tagli(P, x, passo, traccia) {
    const a = { stroke: traccia ? GRIGIO_TRACCIA : "#222", "stroke-width": 1, "stroke-dasharray": traccia ? "2 1.6" : "none" };
    for (let p = -2; p >= passo; p -= 2) P.add("line", Object.assign({ x1: x - 10, x2: x + 10, y1: P.y(p), y2: P.y(p) }, a));
    for (let p = 10; p <= passo; p += 2) P.add("line", Object.assign({ x1: x - 10, x2: x + 10, y1: P.y(p), y2: P.y(p) }, a));
  }
  function gambo(P, x, passo, su, stile) {
    const y = P.y(passo), dx = su ? 5.75 : -5.75, l = 34;
    const a = stile === "traccia" ? { stroke: GRIGIO_TRACCIA, "stroke-width": 1.1, "stroke-dasharray": "2.1 1.7" } : { stroke: "#111", "stroke-width": 1.3 };
    P.add("line", Object.assign({ x1: x + dx, x2: x + dx, y1: y + (su ? -1 : 1), y2: y + (su ? -l : l) }, a));
    return { x: x + dx, y: y + (su ? -l : l) };
  }
  /* figura intera disegnata a mano: tipo "4" semiminima, "2" minima, "1" semibreve, "8" croma */
  function figura(P, x, passo, tipo, stile, su) {
    if (su == null) su = passo < 4;
    const vuota = tipo === "2" || tipo === "1";
    testa(P, x, passo, stile === "traccia" ? "traccia" : (vuota ? "vuota" : "piena"));
    if (tipo === "1") return;
    const g = gambo(P, x, passo, su, stile);
    if (tipo === "8") {
      if (stile === "traccia") {
        const d = su ? `M ${g.x} ${g.y} c 1 6 9 8 8 18` : `M ${g.x} ${g.y} c 1 -6 9 -8 8 -18`;
        P.add("path", { d, fill: "none", stroke: GRIGIO_TRACCIA, "stroke-width": 1.1, "stroke-dasharray": "2.1 1.7" });
      } else glifo(P, g.x - 0.6, g.y, su ? "flag8thUp" : "flag8thDown");
    }
  }
  /* due crome unite da una trave */
  function coppiaCrome(P, x1, x2, passo1, passo2, stile) {
    const su = (passo1 + passo2) / 2 < 4;
    const st = stile === "traccia" ? "traccia" : "piena";
    testa(P, x1, passo1, st); testa(P, x2, passo2, st);
    const g1 = gambo(P, x1, passo1, su, stile), g2 = gambo(P, x2, passo2, su, stile);
    const yb = su ? Math.min(g1.y, g2.y) : Math.max(g1.y, g2.y);
    const h = su ? 5 : -5;
    if (stile === "traccia") {
      P.add("polygon", { points: `${g1.x},${yb} ${g2.x},${yb} ${g2.x},${yb + h} ${g1.x},${yb + h}`, fill: "none", stroke: GRIGIO_TRACCIA, "stroke-width": 1, "stroke-dasharray": "2.1 1.7" });
    } else P.add("rect", { x: g1.x - 0.6, y: su ? yb : yb - 5, width: g2.x - g1.x + 1.2, height: 5, fill: "#111" });
  }
  /* pause e segni da glifo: "4" pausa di semiminima, "2" di minima, "1" di semibreve, "8" di croma */
  function pausa(P, x, tipo, colore) {
    const codice = { "4": "restQuarter", "2": "restHalf", "1": "restWhole", "8": "rest8th" }[tipo];
    const y = { "4": P.yRigo(2), "2": P.yRigo(2), "1": P.yRigo(3), "8": P.yRigo(2) }[tipo];
    glifo(P, x - 5, y, codice, colore);
  }
  /* pausa di semiminima tratteggiata: percorso per la mano (in spazi, da sopra a sotto) */
  const PAUSA_PERCORSO = [["M", 0.3, -1.35], ["L", 0.85, -0.55], ["C", 0.5, -0.2, 0.2, 0.0, 0.3, 0.25], ["L", 0.95, 0.85], ["C", 0.5, 0.6, 0.12, 0.85, 0.35, 1.15], ["C", 0.45, 1.32, 0.55, 1.42, 0.62, 1.5]];
  function pausaTraccia(P, x, stile) {
    const y = P.yRigo(2);
    const sw = Math.max(0.7, 1.6 / P.sc);
    glifo(P, x - 5, y, "restQuarter", "#eceef3");
    P.add("path", { d: percorso(PAUSA_PERCORSO, x - 5, y, 10), fill: "none", stroke: GRIGIO_TRACCIA, "stroke-width": sw * 1.3,
      "stroke-dasharray": `${sw * 2.2} ${sw * 2}`, "stroke-linecap": "round", "stroke-linejoin": "round" });
    partenza(P, x - 2, y - 13.5, stile === "puntini" ? 1 : null);
    if (stile === "puntini") { numeretto(P, x + 7.5, y - 6.5, 2); numeretto(P, x - 7.5, y + 1, 3); numeretto(P, x + 8.5, y + 8.5, 4); numeretto(P, x + 5, y + 16, 5); }
  }
  function stanghetta(P, x, tipo, stile) {
    const t = P.yRigo(4), b = P.yRigo(0);
    const tr = stile === "traccia";
    const a = tr ? { stroke: GRIGIO_TRACCIA, "stroke-dasharray": "2.1 1.7" } : { stroke: "#111" };
    if (tipo === "fine") {
      P.add("line", Object.assign({ x1: x - 4, x2: x - 4, y1: t, y2: b, "stroke-width": 1 }, a));
      if (tr) P.add("rect", { x: x - 1, y: t, width: 3, height: b - t, fill: "none", stroke: GRIGIO_TRACCIA, "stroke-width": 0.9, "stroke-dasharray": "2.1 1.7" });
      else P.add("rect", { x: x - 1, y: t, width: 3, height: b - t, fill: "#111" });
    } else if (tipo === "doppia") {
      P.add("line", Object.assign({ x1: x - 3, x2: x - 3, y1: t, y2: b, "stroke-width": 1 }, a));
      P.add("line", Object.assign({ x1: x, x2: x, y1: t, y2: b, "stroke-width": 1 }, a));
    } else P.add("line", Object.assign({ x1: x, x2: x, y1: t, y2: b, "stroke-width": tr ? 1.1 : 1 }, a));
  }
  /* testo dentro il pentagramma (in unità del pentagramma, sovrimpresso in HTML) */
  function scritta(P, x, y, html, stile) {
    const d = el("div", { class: "sopra", html });
    d.style.left = (x * P.sc) + "px"; d.style.top = (y * P.sc) + "px";
    if (stile) Object.assign(d.style, stile);
    P.wrap.appendChild(d); return d;
  }

  /* ---------------- notazione "vera" con VexFlow (battute, ritmi, melodie) ----------------
     battute(cont, { larg, spazio, tempo:"2/4"|null, chiave:true, misure:["q:g4 q:a4 h:g4", …], unaLinea, colori, fine, cuori })
     token: durata ":" altezza. Durate: w h q 8 16, con "." per il punto; altezza: g4, f#4, bb4; "r" pausa; "x" solo ritmo. */
  function token(t, unaLinea) {
    const [d0, h] = t.split(":");
    const punti = (d0.match(/\./g) || []).length, d = d0.replace(/\./g, "");
    const pausa = h === "r";
    let key = unaLinea || h === "x" ? "b/4" : null, n = null;
    if (!pausa && !key) { n = nota(h); key = n.key; }
    if (pausa) key = d === "w" ? "d/5" : "b/4";
    return { d, punti, pausa, key, n, durata: d + (pausa ? "r" : "") };
  }
  const BATTITI = { w: 4, h: 2, q: 1, "8": 0.5, "16": 0.25 };
  function valore(t) { let v = BATTITI[t.d]; let agg = v; for (let i = 0; i < t.punti; i++) { agg /= 2; v += agg; } return v; }

  function battute(cont, o) {
    o = Object.assign({ larg: LARGHEZZA, spazio: 14, chiave: true, tempo: null, misure: [], unaLinea: false, colori: false,
      fine: true, sopra: 3, sotto: 3, cuori: false, legature: [], nomi: false, stile: null, gambiSu: null, primaLarga: true }, o);
    const sc = o.spazio / 10, W = o.larg / sc, H = (4 + o.sopra + o.sotto) * 10;
    const wrap = el("div", { class: "penta", style: { width: o.larg + "px", height: (H * sc) + "px" } });
    cont.appendChild(wrap);
    const r = new VF.Renderer(wrap, VF.Renderer.Backends.SVG); r.resize(o.larg, H * sc);
    const ctx = r.getContext(); ctx.scale(sc, sc);
    const n = o.misure.length;
    const testa0 = (o.chiave && !o.unaLinea ? 36 : 6) + (o.tempo ? 22 : 0);
    const resto = (W - 2 - testa0) / n;
    let x = 0; const out = { note: [], staves: [], wrap, sc, ctx };
    o.misure.forEach((m, i) => {
      const w = resto + (i === 0 ? testa0 : 0);
      const st = new VF.Stave(x, o.sopra * 10, w, { space_above_staff_ln: 0, space_below_staff_ln: 0 });
      if (i === 0 && o.chiave && !o.unaLinea) st.addClef("treble");
      if (i === 0 && o.tempo) st.addTimeSignature(o.tempo);
      st.setBegBarType(VF.Barline.type.NONE);
      if (i === n - 1 && o.fine) st.setEndBarType(VF.Barline.type.END);
      else if (o.senzaStanghette) st.setEndBarType(VF.Barline.type.NONE);
      if (o.unaLinea) { st.setConfigForLines([0, 1, 2, 3, 4].map(k => ({ visible: k === 2 }))); st.setEndBarType(VF.Barline.type.NONE); }
      st.setStyle({ strokeStyle: "#222", fillStyle: "#222" });
      st.setContext(ctx).draw();
      out.staves.push(st);
      const toks = m.trim() ? m.trim().split(/\s+/).map(t => token(t, o.unaLinea)) : [];
      const notes = toks.map(t => {
        const opz = { keys: [t.key], duration: t.durata, clef: "treble", dots: t.punti };
        if (o.unaLinea || o.gambiSu) opz.stem_direction = 1; else opz.auto_stem = true;
        const sn = new VF.StaveNote(opz);
        if (t.n && t.n.alt && t.n.alt !== "") sn.addModifier(new VF.Accidental(t.n.alt), 0);
        for (let k = 0; k < t.punti; k++) VF.Dot.buildAndAttach([sn], { all: true });
        if (o.colori && t.n && !t.pausa) sn.setKeyStyle(0, { fillStyle: COLORI[t.n.l], strokeStyle: scuro(COLORI[t.n.l], 0.55) });
        if (o.stile === "grigio") sn.setStyle({ fillStyle: "#b9bdc8", strokeStyle: "#b9bdc8" });
        sn._tok = t; return sn;
      });
      if (notes.length) {
        const beams = VF.Beam.generateBeams(notes.filter(s => !s._tok.pausa), { stem_direction: o.unaLinea || o.gambiSu ? 1 : undefined, maintain_stem_directions: !!(o.unaLinea || o.gambiSu) });
        const voice = new VF.Voice({ num_beats: 4, beat_value: 4 }).setMode(VF.Voice.Mode.SOFT).addTickables(notes);
        const largNote = w - (st.getNoteStartX() - x) - 12;
        new VF.Formatter().joinVoices([voice]).format([voice], largNote);
        /* ritmo proporzionale: lo spazio è il tempo (un battito = stessa larghezza) */
        const tot = toks.reduce((q, t) => q + valore(t), 0) || 1;
        const battiti = o.battitiMisura || (o.tempo ? +o.tempo.split("/")[0] : Math.max(1, Math.round(tot)));
        if (o.proporzionale !== false) {
          let t = 0;
          notes.forEach(sn => { sn.getTickContext().setX(4 + (t / battiti) * (largNote - 6)); t += valore(sn._tok); });
        }
        voice.draw(ctx, st);
        const delta = notes[0].getAbsoluteX() - notes[0].getTickContext().getX();
        out.misure = out.misure || []; out.misure.push({ st, battiti, x0: delta + 4, larg: largNote - 6 });
        beams.forEach(b => { if (o.stile === "grigio") b.setStyle({ fillStyle: "#b9bdc8", strokeStyle: "#b9bdc8" }); b.setContext(ctx).draw(); });
        notes.forEach(s => out.note.push({ sn: s, x: s.getAbsoluteX() + 5, misura: i, t: s._tok }));
      }
      if (o.unaLinea && !(i === n - 1 && !o.fine && o.senzaStanghette)) {
        const yl = st.getYForLine(2), xb = x + w;
        const e = sv("line", { x1: xb, x2: xb, y1: yl - 12, y2: yl + 12, stroke: "#222", "stroke-width": 1 });
        if (!(o.senzaStanghette && i < n - 1)) ctx.svg.appendChild(e);
        if (i === n - 1 && o.fine) ctx.svg.appendChild(sv("rect", { x: xb - 3, y: yl - 12, width: 3, height: 24, fill: "#222" }));
      }
      out.yLinea = st.getYForLine(2); out.yRigo0 = st.getYForLine(4);
      x += w;
    });
    o.legature.forEach(([a, b]) => new VF.StaveTie({ first_note: out.note[a].sn, last_note: out.note[b].sn, first_indices: [0], last_indices: [0] }).setContext(ctx).draw());
    /* cuori della pulsazione sopra ogni battito */
    if (o.cuori && out.misure) {
      out.misure.forEach(m => {
        for (let k = 0; k < m.battiti; k++) {
          const d = el("div", { class: "sopra" }); d.appendChild(img("cuore", o.spazio / MM * 1.25));
          const xx = m.x0 + (k / m.battiti) * m.larg + 6;
          d.style.left = (xx * sc) + "px"; d.style.top = ((m.st.getYForLine(0) - 27) * sc) + "px"; wrap.appendChild(d);
        }
      });
    }
    out.scritta = (x, y, html, stile) => { const d = el("div", { class: "sopra", html }); d.style.left = (x * sc) + "px"; d.style.top = (y * sc) + "px"; if (stile) Object.assign(d.style, stile); wrap.appendChild(d); return d; };
    return out;
  }

  /* ---------------- pagine ---------------- */
  function nuovaPagina(classi) {
    const pg = el("div", { class: "pagina" + (stato.classe === 1 ? " maiuscolo" : "") + (classi ? " " + classi : "") });
    document.getElementById("volume").appendChild(pg);
    stato.pagine++;
    return pg;
  }
  function piede(pg) {
    pg.appendChild(el("div", { class: "piede" },
      el("span", null, "musicascuole.it · schede gratuite · CC BY-NC-SA 4.0"),
      el("span", null, `Il mio quaderno di musica · classe ${stato.classe}ª`),
      el("span", { class: "num" }, String(stato.pagine))));
  }
  function paginaScheda(meta, parte) {
    const pg = nuovaPagina();
    const [nomeArea, icona] = AREE[meta.codice[1]] || AREE.M;
    pg.appendChild(el("div", { class: "testata" },
      el("span", { class: "area" }, img(icona, 6.5), nomeArea),
      el("span", { class: "nome" }, "Nome", el("span")),
      el("span", { class: "codice" }, meta.codice + (parte ? " · " + parte : ""))));
    pg.appendChild(el("div", { class: "titolo" }, (stato.sol ? "Soluzioni · " : "") + meta.titolo));
    if (meta.consegna) {
      const c = el("div", { class: "consegna" });
      if (meta.icona !== false) c.appendChild(img(meta.icona || "matita", 9));
      c.appendChild(el("span", { html: meta.consegna }));
      pg.appendChild(c);
    }
    const corpo = el("div", { class: "corpo" + (meta.alto ? " alto" : "") });
    pg.appendChild(corpo);
    stato.corpi.push(corpo);
    piede(pg);
    return corpo;
  }

  function copertina(classe) {
    const pg = nuovaPagina("copertina");
    const t = stato.titoliClasse[classe] || {};
    const fila = el("div", { class: "riga", style: { justifyContent: "center", gap: "5mm", margin: "12mm 0" } });
    ORDINE.forEach(l => {
      const c = el("div", { class: "centro", style: { fontSize: "14pt" } });
      const p = el("div", { class: "pallino", style: { width: "17mm", height: "17mm", margin: "0 auto 2mm",
        background: col() ? COLORI[l] : "#fff", borderColor: col() ? scuro(COLORI[l], 0.6) : "#000", borderWidth: ".6mm" } });
      c.append(p, NOMI[l]); fila.appendChild(c);
    });
    pg.append(
      el("div", { style: { marginTop: "6mm" } }, img("note", 34)),
      el("div", { class: "grande" }, stato.sol ? "Soluzioni" : "Il mio quaderno di musica"),
      el("div", { class: "classe" }, `classe ${classe}ª`),
      el("div", { class: "testo", style: { color: "var(--grigio)", maxWidth: "140mm" } }, t.sottotitolo || ""),
      fila,
      stato.sol ? el("div", { class: "testo" }, "Per l'insegnante") :
        el("div", { class: "testo", style: { marginTop: "6mm" } }, "Nome ", el("span", { style: { display: "inline-block", width: "90mm", borderBottom: ".4mm solid #888" } })),
      el("div", { class: "piccolo", style: { marginTop: "auto" } }, `musicascuole.it · ${col() ? "versione a colori" : "versione in bianco e nero"}`));
  }

  function indice(classe, elenco) {
    const pg = nuovaPagina();
    pg.appendChild(el("div", { class: "titolo" }, "Indice delle schede"));
    const t = stato.titoliClasse[classe] || {};
    if (t.guida) pg.appendChild(el("div", { class: "consegna", style: { fontSize: "11pt" } }, img("gufo", 9), el("span", { html: t.guida })));
    const ind = el("div", { class: "indice", style: { marginTop: "4mm" } });
    let area = null;
    elenco.forEach(s => {
      if (s.codice[1] !== area) { area = s.codice[1]; ind.appendChild(el("h3", null, (AREE[area] || AREE.M)[0])); }
      ind.appendChild(el("div", null, el("span", { class: "cod" }, s.codice), el("span", null, s.titolo), el("span", { class: "pg" }, String(s._pagina || ""))));
    });
    pg.appendChild(ind);
    pg.appendChild(el("div", { class: "piccolo", style: { marginTop: "auto", fontSize: "8.5pt", lineHeight: "1.35" }, html:
      "Schede gratuite di <b>musicascuole.it</b>, licenza CC BY-NC-SA 4.0: si possono stampare, fotocopiare e condividere, non vendere. " +
      "Notazione disegnata con VexFlow (MIT). Illustrazioni: OpenMoji, progetto open source di HfG Schwäbisch Gmünd, licenza CC BY-SA 4.0. " +
      "Carattere Fredoka (SIL Open Font License)." }));
    piede(pg);
    return ind;
  }

  /* rete di sicurezza: se il contenuto non sta nella pagina, lo rimpicciolisce (e lo segnala nella console) */
  function adatta(corpo, codice) {
    const disp = corpo.clientHeight;
    let tot = 0; [...corpo.children].forEach(c => { tot += c.getBoundingClientRect().height; });
    const gap = corpo.classList.contains("alto") ? (corpo.children.length - 1) * 4 * MM : 0;
    if (tot + gap <= disp + 1) return;
    const f = Math.max(0.6, (disp - gap) / tot * 0.985);
    [...corpo.children].forEach(c => { c.style.zoom = f; });
    stato.adattate.push(codice + " " + Math.round(f * 100) + "%");
    console.warn("ADATTATA " + codice + " al " + Math.round(f * 100) + "%");
  }

  /* ---------------- registro e avvio ---------------- */
  function scheda(classe, meta, disegna) { meta.disegna = disegna; stato.schede[classe].push(meta); }
  function titoloClasse(classe, t) { stato.titoliClasse[classe] = t; }

  async function avvia() {
    const q = new URLSearchParams(location.search);
    stato.classe = +(q.get("classe") || 2);
    stato.modo = q.get("modo") === "bn" ? "bn" : "col";
    stato.sol = q.get("sol") === "1";
    stato.solo = q.get("solo");
    document.body.classList.toggle("bn", stato.modo === "bn");
    try { await document.fonts.load("600 20px Fredoka"); await document.fonts.load("400 20px Fredoka"); } catch (e) { }
    let elenco = stato.schede[stato.classe].slice();
    if (stato.solo) elenco = elenco.filter(s => stato.solo.split(",").includes(s.codice));
    if (stato.sol) elenco = elenco.filter(s => s.sol);
    let ind = null;
    if (!stato.solo) { copertina(stato.classe); }
    const pagIndice = !stato.solo ? stato.pagine + 1 : 0;
    if (!stato.solo) stato.pagine++;   // posto per l'indice, disegnato alla fine
    for (const s of elenco) {
      s._pagina = stato.pagine + 1;
      const api = { altraPagina: (parte) => paginaScheda(s, parte), rnd: caso(s.codice), sol: stato.sol, col: col() };
      stato.corpi = [];
      try { s.disegna(paginaScheda(s), api); }
      catch (e) { console.error("Errore nella scheda " + s.codice, e); }
      stato.corpi.forEach(c => adatta(c, s.codice));
    }
    if (!stato.solo) {
      const salvate = stato.pagine; stato.pagine = pagIndice - 1;
      indice(stato.classe, elenco);
      const vol = document.getElementById("volume");
      vol.insertBefore(vol.lastChild, vol.children[1]);
      stato.pagine = salvate;
    }
    global.PRONTO = true;
  }

  global.Schede = {
    stato, el, sv, img, caso, nota, nomeDi, COLORI, NOMI, LETTERE, ORDINE, MM, LARGHEZZA,
    pentagramma, glifo, disegnaChiave, partenza, numeretto, testa, tagli, gambo, figura, coppiaCrome, pausa, pausaTraccia,
    stanghetta, scritta, battute, valore, token, scheda, titoloClasse, avvia, col, scuro, GRIGIO_TRACCIA, GRIGIO_FANTASMA
  };
})(window);
