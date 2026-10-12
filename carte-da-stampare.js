/* =====================================================================
   CARTE DA STAMPARE — musicascuole.it
   Genera un PDF di carte da gioco pronte da ritagliare, nella misura
   standard delle carte collezionabili (63 x 88 mm), 9 per foglio A4.

   Il disegno del pentagramma è lo stesso del gioco "Scarta la nota"
   (stesse estensioni, stessa impaginazione VexFlow): così le carte
   stampate e quelle sullo schermo si corrispondono.

   Serve per "Scarta la nota", ma è scritto per essere riusato: per un
   altro mazzo basta preparare un elenco di carte (vedi "il descrittore
   di una carta" qui sotto) e chiamare CarteDaStampare.generaPDF().

   Richiede: vexflow.js (pentagramma), jspdf.js e svg2pdf.js (PDF).

   --- il descrittore di una carta ---
   { tipo:"nota", colore:"red", clef:"treble", key:"a/4", alter:0 }
   { tipo:"stop"|"inverti"|"pesca2", colore:"red" }
   { tipo:"jolly"|"jolly4" }
   ===================================================================== */
(function (global) {
  "use strict";

  /* ================= misure ================= */
  const CARTA_W = 63, CARTA_H = 88;        // mm — misura standard delle carte
  const A4_W = 210, A4_H = 297;
  const COLONNE = 3, RIGHE = 3;
  const MARGINE_X = (A4_W - COLONNE * CARTA_W) / 2;   // 10.5 mm
  const MARGINE_Y = (A4_H - RIGHE * CARTA_H) / 2;     // 16.5 mm

  /* ================= colori ================= */
  // colori delle carte: gli stessi quattro del gioco
  const COLORE_CARTA = {
    red: "#ef4444", green: "#22c55e", blue: "#3b82f6", yellow: "#eab308"
  };
  const CREMA = "#fdfaf3";          // l'ovale chiaro al centro della carta
  const INCHIOSTRO = "#1e293b";     // scritte scure
  const JOLLY_1 = "#334155", JOLLY_2 = "#1e293b";
  // colori ufficiali delle note del sito (vedi comune.css)
  const COLORE_NOTA = {
    c: "#E21C48", d: "#F99D1C", e: "#FFF428", f: "#BED958",
    g: "#009C95", a: "#5E50A1", b: "#CF3E96"
  };
  const SOLFEGGIO = { c: "DO", d: "RE", e: "MI", f: "FA", g: "SOL", a: "LA", b: "SI" };

  /* ================= estensioni delle note =================
     Identiche al gioco: rosso e blu nel registro grave della loro chiave,
     verde e giallo in quello acuto. Dieci note consecutive per colore. */
  const LETTERE = ["c", "d", "e", "f", "g", "a", "b"];

  function notaSopra(key) {
    const [lettera, ott] = key.split("/");
    let o = parseInt(ott, 10), i = LETTERE.indexOf(lettera) + 1;
    if (i >= LETTERE.length) { i = 0; o++; }      // dopo il SI si cambia ottava
    return LETTERE[i] + "/" + o;
  }

  function estensione(inizio, quante) {
    const out = [inizio];
    for (let i = 1; i < quante; i++) out.push(notaSopra(out[out.length - 1]));
    return out;
  }

  const ESTENSIONI = {
    violinoGrave: estensione("a/3", 10),   // LA3 -> DO5
    violinoAcuto: estensione("a/4", 10),   // LA4 -> DO6
    bassoGrave:   estensione("c/2", 10),   // DO2 -> MI3
    bassoAcuto:   estensione("c/3", 10)    // DO3 -> MI4
  };

  function estensionePerColore(colore, chiavi) {
    const grave = (colore === "red" || colore === "blue");
    if (chiavi === "violino") return { clef: "treble", keys: grave ? ESTENSIONI.violinoGrave : ESTENSIONI.violinoAcuto };
    if (chiavi === "basso")   return { clef: "bass",   keys: grave ? ESTENSIONI.bassoGrave   : ESTENSIONI.bassoAcuto };
    // modalità mista: rosso e verde in violino, blu e giallo in basso
    if (colore === "red")   return { clef: "treble", keys: ESTENSIONI.violinoGrave };
    if (colore === "green") return { clef: "treble", keys: ESTENSIONI.violinoAcuto };
    if (colore === "blue")  return { clef: "bass",   keys: ESTENSIONI.bassoGrave };
    return                         { clef: "bass",   keys: ESTENSIONI.bassoAcuto };
  }

  /* ================= icone delle carte azione =================
     Le stesse del gioco. STOP: una croma sbarrata ("questa nota non si
     suona"). INVERTI: due crome che si rincorrono in cerchio. */
  const ICONA_STOP = `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <g fill="#1e293b">
        <ellipse cx="38" cy="66" rx="14" ry="10.5" transform="rotate(-20 38 66)"/>
        <rect x="48" y="22" width="5.5" height="44" rx="2.6"/>
        <path d="M53.5 24 Q73 31 71 48 Q66 35 53.5 37 Z"/>
      </g>
      <circle cx="50" cy="50" r="40" fill="none" stroke="#dc2626" stroke-width="8" opacity="0.92"/>
      <line x1="22" y1="78" x2="78" y2="22" stroke="#dc2626" stroke-width="8" stroke-linecap="round" opacity="0.92"/>
    </svg>`;

  const ICONA_INVERTI = `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="#1e293b" stroke-width="8.5" stroke-linecap="round">
        <path d="M24 44 A28 28 0 0 1 68 28"/>
        <path d="M76 56 A28 28 0 0 1 32 72"/>
      </g>
      <g fill="#1e293b">
        <path d="M70 21 l12 9 l-14 8 z"/>
        <path d="M30 79 l-12 -9 l14 -8 z"/>
        <ellipse cx="44" cy="58" rx="8.5" ry="6.6" transform="rotate(-20 44 58)"/>
        <rect x="50.5" y="34" width="4" height="25" rx="2"/>
        <path d="M54.5 34 Q66 39 64 50 Q61 41 54.5 42 Z"/>
      </g>
    </svg>`;

  // croma disegnata a mano: i caratteri standard del PDF non contengono il
  // segno musicale, quindi la notina si disegna invece di scriverla
  function iconaCroma(colore) {
    return '<svg viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg">' +
      '<g fill="' + colore + '">' +
      '<ellipse cx="20" cy="76" rx="16" ry="12" transform="rotate(-20 20 76)"/>' +
      '<rect x="31.5" y="12" width="6" height="64" rx="3"/>' +
      '<path d="M37.5 14 Q60 22 57 44 Q51 27 37.5 29 Z"/>' +
      '</g></svg>';
  }

  /* ================= il pentagramma =================
     Copiato dal gioco: stessa lunghezza del rigo, stessa inquadratura
     centrata sul disegno (così i tagli addizionali non vengono tagliati). */
  const cachePentagramma = {};
  let ospite = null;

  function ospiteNascosto() {
    if (!ospite) {
      ospite = document.createElement("div");
      ospite.style.cssText = "position:absolute;left:-9999px;top:-9999px";
      document.body.appendChild(ospite);
    }
    return ospite;
  }

  function pentagrammaSVG(clef, key, alter) {
    alter = alter || 0;
    const chiave = clef + "|" + key + "|" + alter;
    if (cachePentagramma[chiave]) return cachePentagramma[chiave];

    const host = ospiteNascosto();
    host.innerHTML = "";
    const VF = global.Vex.Flow;
    const renderer = new VF.Renderer(host, VF.Renderer.Backends.SVG);
    renderer.resize(124, 150);
    const ctx = renderer.getContext();
    const rigo = new VF.Stave(0, 10, alter ? 108 : 96);
    rigo.addClef(clef);
    rigo.setContext(ctx).draw();
    const nota = new VF.StaveNote({ clef: clef, keys: [key], duration: "q" });
    // l'alterazione è scritta sulla nota, non in armatura
    if (alter !== 0) nota.addModifier(new VF.Accidental(alter > 0 ? "#" : "b"), 0);
    VF.Formatter.FormatAndDraw(ctx, rigo, [nota]);

    const svg = host.querySelector("svg");
    // riquadro di misura fissa, centrato sul disegno
    const VB_W = 124, VB_H = 150;
    let minY = -30, minX = -4;
    try {
      const bb = svg.getBBox();
      if (bb && bb.height > 0) {
        minY = bb.y + bb.height / 2 - VB_H / 2;
        minX = bb.x + bb.width / 2 - VB_W / 2;
      }
    } catch (e) { /* valori di ripiego */ }
    svg.setAttribute("viewBox", minX + " " + minY + " " + VB_W + " " + VB_H);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("width", VB_W);
    svg.setAttribute("height", VB_H);
    const out = svg.outerHTML;
    cachePentagramma[chiave] = out;
    return out;
  }

  /* ================= il mazzo di "Scarta la nota" =================
     numeroCopie: nel mazzo da gioco ogni NOME di nota deve uscire lo
     stesso numero di volte. L'estensione copre 10 gradi ma i nomi sono
     7: i valori 0-2 e 7-9 sono le due occorrenze dello stesso nome,
     quindi ricevono meno copie di quelli centrali. */
  function numeroCopie(valore) {
    if (valore >= 3 && valore <= 6) return 3;
    return valore <= 2 ? 2 : 1;
  }

  const COLORI = ["red", "green", "yellow", "blue"];
  // ordine di stampa: prima i due colori in violino, poi i due in basso
  const ORDINE_STAMPA = ["red", "green", "blue", "yellow"];

  function cartaNota(colore, valore, chiavi) {
    const { clef, keys } = estensionePerColore(colore, chiavi);
    const key = keys[Math.max(0, Math.min(keys.length - 1, valore))];
    return { tipo: "nota", colore: colore, clef: clef, key: key, alter: 0 };
  }

  /**
   * Prepara l'elenco delle carte di "Scarta la nota".
   * @param {string} chiavi      "entrambe" | "violino" | "basso"
   * @param {string} contenuto   "unaPerTipo" (54 carte) | "mazzoCompleto" (116)
   */
  function mazzoScartaLaNota(chiavi, contenuto) {
    const completo = (contenuto === "mazzoCompleto");
    const carte = [];
    ORDINE_STAMPA.forEach(colore => {
      for (let v = 0; v <= 9; v++) {
        const quante = completo ? numeroCopie(v) : 1;
        for (let k = 0; k < quante; k++) carte.push(cartaNota(colore, v, chiavi));
      }
      const quanteAzioni = completo ? 2 : 1;
      ["stop", "inverti", "pesca2"].forEach(t => {
        for (let k = 0; k < quanteAzioni; k++) carte.push({ tipo: t, colore: colore });
      });
    });
    const quantiJolly = completo ? 4 : 1;
    for (let k = 0; k < quantiJolly; k++) carte.push({ tipo: "jolly" });
    for (let k = 0; k < quantiJolly; k++) carte.push({ tipo: "jolly4" });
    return carte;
  }

  /* ================= disegno di una carta sul PDF ================= */

  function esadecimale(pdf, hex) { pdf.setFillColor(hex); }

  // l'ovale chiaro: è un rettangolo con angoli molto arrotondati, come nel gioco
  function ovale(pdf, x, y) {
    const w = CARTA_W * 0.9135, h = CARTA_H * 0.9333;
    const ox = x + (CARTA_W - w) / 2, oy = y + (CARTA_H - h) / 2;
    pdf.setFillColor(CREMA);
    pdf.roundedRect(ox, oy, w, h, w / 2, h * 0.4, "F");
    return { x: ox, y: oy, w: w, h: h };
  }

  function testoCentrato(pdf, testo, x, y, dimPt, colore) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(dimPt);
    pdf.setTextColor(colore);
    pdf.text(testo, x, y, { align: "center", baseline: "alphabetic" });
  }

  async function disegnaSVG(pdf, testoSVG, x, y, w, h) {
    const host = ospiteNascosto();
    const box = document.createElement("div");
    box.innerHTML = testoSVG.trim();
    host.appendChild(box);
    const svg = box.querySelector("svg");
    // svg2pdf.js in versione UMD espone un oggetto con dentro la funzione
    const converti = (typeof global.svg2pdf === "function") ? global.svg2pdf : global.svg2pdf.svg2pdf;
    await converti(svg, pdf, { x: x, y: y, width: w, height: h });
    host.removeChild(box);
  }

  // sfumatura circolare dell'ovale dei jolly: il PDF non la sa fare, quindi si
  // disegna a spicchi sottili con il colore che cambia poco per volta
  function ovaleJolly(pdf, o) {
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
    const colori = [[239,68,68], [234,179,8], [34,197,94], [59,130,246]];  // rosso giallo verde blu
    const passi = 144;
    for (let i = 0; i < passi; i++) {
      // gli spicchi si sovrappongono di poco, altrimenti restano righine chiare
      const a0 = (i / passi) * 2 * Math.PI - Math.PI / 2 - 0.014;
      const a1 = ((i + 1) / passi) * 2 * Math.PI - Math.PI / 2 + 0.014;
      const t = (i + 0.5) / passi * 4;
      const c0 = colori[Math.floor(t) % 4], c1 = colori[(Math.floor(t) + 1) % 4], f = t % 1;
      pdf.setFillColor(
        Math.round(c0[0] + (c1[0] - c0[0]) * f),
        Math.round(c0[1] + (c1[1] - c0[1]) * f),
        Math.round(c0[2] + (c1[2] - c0[2]) * f)
      );
      const rx = o.w / 2 * 1.015, ry = o.h / 2 * 1.015;
      pdf.triangle(
        cx, cy,
        cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry,
        cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry,
        "F"
      );
    }
  }

  /**
   * Disegna una carta con l'angolo in alto a sinistra in (x, y).
   * @param {string} nomi  "nessuno" | "neri" | "colorati"
   */
  async function disegnaCarta(pdf, carta, x, y, nomi) {
    const jolly = (carta.tipo === "jolly" || carta.tipo === "jolly4");

    // fondo colorato
    pdf.setFillColor(jolly ? JOLLY_1 : COLORE_CARTA[carta.colore]);
    pdf.roundedRect(x, y, CARTA_W, CARTA_H, 3.4, 3.4, "F");

    const o = ovale(pdf, x, y);
    if (jolly) ovaleJolly(pdf, o);

    const cx = x + CARTA_W / 2;

    if (carta.tipo === "nota") {
      const conNome = (nomi !== "nessuno");
      const lettera = carta.key.split("/")[0];
      if (conNome) {
        // pentagramma un po' più piccolo, il nome scritto sotto
        const w = CARTA_W * 0.782, h = CARTA_H * 0.673;
        await disegnaSVG(pdf, pentagrammaSVG(carta.clef, carta.key, carta.alter),
                         cx - w / 2, y + CARTA_H * 0.105, w, h);
        const colore = (nomi === "colorati") ? COLORE_NOTA[lettera] : INCHIOSTRO;
        // contorno scuro: MI e FA sono chiarissimi e sul crema sparirebbero
        if (nomi === "colorati") {
          pdf.setDrawColor(INCHIOSTRO);
          pdf.setLineWidth(0.35);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(31.5);
          pdf.setTextColor(colore);
          pdf.text(SOLFEGGIO[lettera], cx, y + CARTA_H * 0.866,
                   { align: "center", renderingMode: "fillThenStroke" });
          pdf.setLineWidth(0.2);
        } else {
          testoCentrato(pdf, SOLFEGGIO[lettera], cx, y + CARTA_H * 0.866, 31.5, INCHIOSTRO);
        }
      } else {
        const w = CARTA_W * 0.855, h = CARTA_H * 0.74;
        await disegnaSVG(pdf, pentagrammaSVG(carta.clef, carta.key, carta.alter),
                         cx - w / 2, y + (CARTA_H - h) / 2, w, h);
      }
      return;
    }

    // ---- carte azione e jolly ----
    const etichette = { stop: "STOP", inverti: "INV", pesca2: "+2", jolly: "?", jolly4: "+4" };
    const etichetta = etichette[carta.tipo];
    const coloreEtichetta = jolly ? "#ffffff" : "#111827";

    // scritte d'angolo, una dritta e una capovolta come nelle carte vere
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18.3);
    pdf.setTextColor(coloreEtichetta);
    pdf.text(etichetta, x + 4.1, y + 6.9, { baseline: "alphabetic" });
    pdf.text(etichetta, x + CARTA_W - 4.1, y + CARTA_H - 6.9, { angle: 180, baseline: "alphabetic" });

    if (carta.tipo === "stop" || carta.tipo === "inverti") {
      const lato = o.w * 0.74;
      await disegnaSVG(pdf, carta.tipo === "stop" ? ICONA_STOP : ICONA_INVERTI,
                       cx - lato / 2, y + CARTA_H / 2 - lato / 2, lato, lato);
    } else if (carta.tipo === "pesca2" || carta.tipo === "jolly4") {
      const numero = (carta.tipo === "pesca2") ? "+2" : "+4";
      const colore = (carta.tipo === "jolly4") ? "#ffffff" : INCHIOSTRO;
      testoCentrato(pdf, numero, cx, y + CARTA_H * 0.52, 50, colore);
      // le due crome sotto il numero
      const hc = CARTA_H * 0.105, wc = hc * 0.6;
      await disegnaSVG(pdf, iconaCroma(colore), cx - wc - 0.6, y + CARTA_H * 0.565, wc, hc);
      await disegnaSVG(pdf, iconaCroma(colore), cx + 0.6,      y + CARTA_H * 0.565, wc, hc);
    } else if (carta.tipo === "jolly") {
      const hc = CARTA_H * 0.26, wc = hc * 0.6;
      await disegnaSVG(pdf, iconaCroma("#ffffff"), cx - wc / 2, y + CARTA_H * 0.37, wc, hc);
    }
  }

  /* ================= il foglio ================= */

  // tratteggio leggero attorno a ogni carta, per ritagliare dritto
  function guideDiTaglio(pdf) {
    pdf.setDrawColor("#c8c8c8");
    pdf.setLineWidth(0.15);
    if (pdf.setLineDashPattern) pdf.setLineDashPattern([1, 1], 0);
    for (let c = 0; c <= COLONNE; c++) {
      const x = MARGINE_X + c * CARTA_W;
      pdf.line(x, MARGINE_Y, x, MARGINE_Y + RIGHE * CARTA_H);
    }
    for (let r = 0; r <= RIGHE; r++) {
      const y = MARGINE_Y + r * CARTA_H;
      pdf.line(MARGINE_X, y, MARGINE_X + COLONNE * CARTA_W, y);
    }
    if (pdf.setLineDashPattern) pdf.setLineDashPattern([], 0);
  }

  /**
   * Genera il PDF e lo fa scaricare.
   * @param {Array}  carte     elenco di descrittori (vedi in testa al file)
   * @param {string} nomi      "nessuno" | "neri" | "colorati"
   * @param {string} nomeFile  nome del file scaricato
   * @param {function} avanzamento  opzionale: riceve (fatte, totale)
   */
  async function generaPDF(carte, nomi, nomeFile, avanzamento) {
    const { jsPDF } = global.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const perFoglio = COLONNE * RIGHE;

    for (let i = 0; i < carte.length; i++) {
      const dentro = i % perFoglio;
      if (i > 0 && dentro === 0) pdf.addPage();
      if (dentro === 0) guideDiTaglio(pdf);
      const col = dentro % COLONNE, rig = Math.floor(dentro / COLONNE);
      await disegnaCarta(pdf, carte[i],
                         MARGINE_X + col * CARTA_W,
                         MARGINE_Y + rig * CARTA_H, nomi);
      if (avanzamento && (i % 6 === 0 || i === carte.length - 1)) {
        avanzamento(i + 1, carte.length);
        // lascia respirare la pagina, così la barra di avanzamento si vede
        await new Promise(r => setTimeout(r, 0));
      }
    }
    pdf.save(nomeFile);
  }

  global.CarteDaStampare = {
    CARTA_W: CARTA_W, CARTA_H: CARTA_H,
    COLORI: COLORI,
    mazzoScartaLaNota: mazzoScartaLaNota,
    pentagrammaSVG: pentagrammaSVG,
    disegnaCarta: disegnaCarta,
    generaPDF: generaPDF
  };
})(window);
