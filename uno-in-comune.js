/* =====================================================================
   UNO IN COMUNE — motore del gioco
   Due carte qualsiasi del mazzo hanno sempre ESATTAMENTE un simbolo in
   comune. Non è un caso fortunato: il mazzo è un "piano proiettivo
   finito" di ordine n (n primo), che ha n²+n+1 carte, n+1 simboli per
   carta e n²+n+1 simboli diversi.

     n = 3  ->  13 carte,  4 simboli per carta, 13 simboli
     n = 5  ->  31 carte,  6 simboli per carta, 31 simboli
     n = 7  ->  57 carte,  8 simboli per carta, 57 simboli

   I simboli sono disegnati con i caratteri musicali di VexFlow
   (Bravura), gli stessi degli spartiti del sito: richiede vexflow.js.
   ===================================================================== */
(function (global) {
  "use strict";

  /* ================= il mazzo ================= */
  function costruisciMazzo(n) {
    const carte = [];
    carte.push(Array.from({ length: n + 1 }, (_, i) => i));
    for (let i = 0; i < n; i++) {
      const c = [0];
      for (let j = 0; j < n; j++) c.push(n + 1 + n * i + j);
      carte.push(c);
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const c = [i + 1];
      for (let k = 0; k < n; k++) c.push(n + 1 + n * k + ((i * k + j) % n));
      carte.push(c);
    }
    return carte;
  }

  /* ================= i simboli =================
     Ogni voce: { nome (per il tutorial e per chi non vede bene),
                  pezzi: [ ... ] }  dove ogni pezzo è
        { g:"nomeGlifo", x, y, s }  un glifo musicale
        { r:[x, y, larghezza, altezza] }  un rettangolo (gambo, punto…)
     Le misure sono in unità VexFlow, con l'origine al centro del simbolo. */

  const G = (g, x, y, s) => ({ g: g, x: x || 0, y: y || 0, s: s || 38 });
  const R = (x, y, w, h) => ({ r: [x, y, w, h] });

  /* Misure vere dei glifi alla grandezza che usiamo (38), lette una volta con
     getBBox: i glifi musicali partono dal loro BORDO SINISTRO, non dal centro,
     quindi il gambo va calcolato, non messo a occhio. */
  const SPAZIO = 9.85;          // uno spazio del pentagramma
  const TESTA_W = 11.63;        // larghezza della testa di nota (1,18 spazi)
  const TESTA_W_SEMIBREVE = 16.63;
  const GAMBO_W = SPAZIO * 0.12;    // spessore del gambo, come da regola tipografica
  const GAMBO_H = SPAZIO * 3.5;     // lunghezza normale del gambo

  /* Figura musicale: testa, gambo a destra della testa (note con gambo in su),
     coda attaccata in cima al gambo, punto di valore dopo la testa. */
  function figura(nome, testa, gambo, coda, punto) {
    const larghezza = (testa === "noteheadWhole") ? TESTA_W_SEMIBREVE : TESTA_W;
    const x0 = -larghezza / 2;                 // la testa sta al centro
    const xGambo = x0 + larghezza - GAMBO_W;   // lato destro della testa
    const pezzi = [G(testa, x0, 0, 38)];
    if (gambo) pezzi.push(R(xGambo, -GAMBO_H, GAMBO_W, GAMBO_H));
    if (coda) pezzi.push(G(coda, xGambo, -GAMBO_H, 38));
    if (punto) pezzi.push(G("augmentationDot", x0 + larghezza + SPAZIO * 0.26, 0, 38));
    return { nome: nome, pezzi: pezzi };
  }

  // indicazione di tempo: due cifre incolonnate
  function tempo(nome, sopra, sotto) {
    return { nome: nome, pezzi: [G(sopra, 0, -9, 36), G(sotto, 0, 9, 36)] };
  }

  // dinamica: una o più lettere affiancate
  function dinamica(nome, lettere) {
    const passo = 13;
    const x0 = -(lettere.length - 1) * passo / 2;
    return { nome: nome, pezzi: lettere.map((l, i) => G(l, x0 + i * passo, 0, 38)) };
  }

  const P = "dynamicPiano", F = "dynamicForte", M = "dynamicMezzo";

  // due crome unite dalla travatura: si distingue a colpo d'occhio da una
  // croma sola, mentre "croma puntata" sarebbe stata quasi identica
  const DUE_CROME = (function () {
    const passo = SPAZIO * 1.7;                 // distanza fra le due teste
    const xa = -passo / 2 - TESTA_W / 2, xb = passo / 2 - TESTA_W / 2;
    const ga = xa + TESTA_W - GAMBO_W, gb = xb + TESTA_W - GAMBO_W;
    return { nome: "due crome", pezzi: [
      G("noteheadBlack", xa, 0, 38), G("noteheadBlack", xb, 0, 38),
      R(ga, -GAMBO_H, GAMBO_W, GAMBO_H), R(gb, -GAMBO_H, GAMBO_W, GAMBO_H),
      R(ga, -GAMBO_H, gb + GAMBO_W - ga, SPAZIO * 0.5)   // la travatura
    ] };
  })();

  /* I segni sono in ordine di importanza didattica: le difficoltà più
     basse usano i primi della lista. */
  const SEGNI = [
    // --- i primi 13: facile ---
    { nome: "chiave di violino", pezzi: [G("gClef", 0, 2, 32)] },
    { nome: "chiave di basso",   pezzi: [G("fClef", 0, -4, 38)] },
    { nome: "chiave di do",      pezzi: [G("cClef", 0, 0, 38)] },
    figura("semibreve",   "noteheadWhole", false, null, false),
    figura("minima",      "noteheadHalf",  true,  null, false),
    figura("semiminima",  "noteheadBlack", true,  null, false),
    figura("croma",       "noteheadBlack", true,  "flag8thUp", false),
    figura("semicroma",   "noteheadBlack", true,  "flag16thUp", false),
    { nome: "pausa di semibreve", pezzi: [G("restWholeLegerLine", 0, 0, 38)] },
    { nome: "pausa di minima",    pezzi: [G("restHalfLegerLine", 0, 0, 38)] },
    { nome: "pausa di semiminima",pezzi: [G("restQuarter", 0, 0, 38)] },
    { nome: "pausa di croma",     pezzi: [G("rest8th", 0, 0, 38)] },
    { nome: "pausa di semicroma", pezzi: [G("rest16th", 0, 0, 38)] },
    // --- fino a 31: medio ---
    { nome: "diesis",    pezzi: [G("accidentalSharp", 0, 0, 38)] },
    { nome: "bemolle",   pezzi: [G("accidentalFlat", 0, 3, 38)] },
    { nome: "bequadro",  pezzi: [G("accidentalNatural", 0, 0, 38)] },
    dinamica("piano", [P]),
    dinamica("forte", [F]),
    dinamica("mezzoforte", [M, F]),
    dinamica("mezzopiano", [M, P]),
    dinamica("pianissimo", [P, P]),
    dinamica("fortissimo", [F, F]),
    { nome: "accento",       pezzi: [G("articAccentAbove", 0, 0, 38)] },
    { nome: "staccato",      pezzi: [G("articStaccatoAbove", 0, 0, 44)] },
    { nome: "tenuto",        pezzi: [G("articTenutoAbove", 0, 0, 40)] },
    { nome: "staccatissimo", pezzi: [G("articStaccatissimoAbove", 0, 0, 40)] },
    { nome: "marcato",       pezzi: [G("articMarcatoAbove", 0, 0, 38)] },
    { nome: "tempo quattro quarti", pezzi: [G("timeSigCommon", 0, 0, 38)] },
    tempo("tempo tre quarti", "timeSig3", "timeSig4"),
    tempo("tempo due quarti", "timeSig2", "timeSig4"),
    tempo("tempo sei ottavi", "timeSig6", "timeSig8"),
    // --- fino a 57: difficile ---
    { nome: "corona",            pezzi: [G("fermataAbove", 0, 4, 38)] },
    { nome: "respiro",           pezzi: [G("breathMarkComma", 0, 0, 44)] },
    { nome: "cesura",            pezzi: [G("caesura", 0, 0, 38)] },
    { nome: "trillo",            pezzi: [G("ornamentTrill", 0, 0, 38)] },
    { nome: "gruppetto",         pezzi: [G("ornamentTurn", 0, 0, 40)] },
    { nome: "mordente",          pezzi: [G("ornamentMordent", 0, 0, 38)] },
    { nome: "mordente breve",    pezzi: [G("ornamentShortTrill", 0, 0, 38)] },
    { nome: "arcata in giù",     pezzi: [G("stringsDownBow", 0, 0, 38)] },
    { nome: "arcata in su",      pezzi: [G("stringsUpBow", 0, 0, 38)] },
    { nome: "armonico",          pezzi: [G("stringsHarmonic", 0, 0, 44)] },
    { nome: "pedale",            pezzi: [G("keyboardPedalPed", 0, 0, 38)] },
    { nome: "togli il pedale",   pezzi: [G("keyboardPedalUp", 0, 0, 38)] },
    { nome: "doppio diesis",     pezzi: [G("accidentalDoubleSharp", 0, 0, 38)] },
    { nome: "doppio bemolle",    pezzi: [G("accidentalDoubleFlat", 0, 3, 38)] },
    { nome: "pausa di breve",    pezzi: [G("restDoubleWhole", 0, 0, 38)] },
    { nome: "pausa di biscroma", pezzi: [G("rest32nd", 0, 0, 38)] },
    { nome: "tempo tagliato",    pezzi: [G("timeSigCutCommon", 0, 0, 38)] },
    tempo("tempo due mezzi", "timeSig2", "timeSig2"),
    figura("semibreve puntata",  "noteheadWhole", false, null, true),
    figura("minima puntata",     "noteheadHalf",  true,  null, true),
    figura("semiminima puntata", "noteheadBlack", true,  null, true),
    DUE_CROME,
    { nome: "segno",     pezzi: [G("segno", 0, 0, 38)] },
    { nome: "coda",      pezzi: [G("coda", 0, 0, 38)] },
    { nome: "arpeggio",  pezzi: [G("arpeggiatoUp", 0, 0, 38)] },
    { nome: "tremolo",   pezzi: [G("tremolo1", 0, 0, 44)] }
  ];

  /* Famiglia di ogni segno: serve al quiz per proporre risposte sbagliate
     dello stesso tipo (fra pause, fra dinamiche…), non a caso.
     Gli estremi sono gli indici nell'elenco SEGNI qui sopra. */
  const FAMIGLIE = [
    [0, 2, "chiavi"], [3, 7, "figure"], [8, 12, "pause"], [13, 15, "alterazioni"],
    [16, 21, "dinamiche"], [22, 26, "articolazioni"], [27, 30, "tempi"],
    [31, 33, "espressione"], [34, 37, "abbellimenti"], [38, 42, "esecuzione"],
    [43, 44, "alterazioni"], [45, 46, "pause"], [47, 48, "tempi"],
    [49, 52, "figure"], [53, 56, "varie"]
  ];
  function famigliaDi(i) {
    const f = FAMIGLIE.find(r => i >= r[0] && i <= r[1]);
    return f ? f[2] : "varie";
  }

  /* ================= le note sul pentagramma ================= */
  const LETTERE = ["c", "d", "e", "f", "g", "a", "b"];
  const SOLFEGGIO = { c: "do", d: "re", e: "mi", f: "fa", g: "sol", a: "la", b: "si" };

  function sopra(key) {
    const [l, o] = key.split("/");
    let ott = parseInt(o, 10), i = LETTERE.indexOf(l) + 1;
    if (i >= LETTERE.length) { i = 0; ott++; }
    return LETTERE[i] + "/" + ott;
  }
  function serie(da, quante) {
    const out = [da];
    for (let i = 1; i < quante; i++) out.push(sopra(out[out.length - 1]));
    return out;
  }

  function nota(clef, key) {
    const l = key.split("/")[0];
    return {
      nome: SOLFEGGIO[l] + " in chiave di " + (clef === "treble" ? "violino" : "basso"),
      nota: { clef: clef, key: key }, lettera: l
    };
  }

  function elencoNote() {
    // prima le note centrali (le più usate), poi gli estremi
    const vioCentro = serie("c/4", 13).map(k => nota("treble", k));
    const basCentro = serie("c/3", 13).map(k => nota("bass", k));
    const vioEstremi = serie("a/3", 2).map(k => nota("treble", k))
      .concat(serie("b/5", 2).map(k => nota("treble", k)));
    const basEstremi = serie("c/2", 2).map(k => nota("bass", k))
      .concat(serie("b/4", 2).map(k => nota("bass", k)));
    return vioCentro.concat(basCentro, vioEstremi, basEstremi);   // 34
  }

  /* ================= colori =================
     Sulla carta chiara i colori chiari (mi, fa) sparirebbero: si usano
     scuriti quanto basta, come fa il motore degli schemi. */
  const COLORE_NOTA = {
    c: "#E21C48", d: "#C77400", e: "#9A8F00", f: "#6E8A1E",
    g: "#009C95", a: "#5E50A1", b: "#CF3E96"
  };
  const INCHIOSTRO = "#1e293b";
  const TAVOLOZZA = ["#E21C48", "#C77400", "#9A8F00", "#6E8A1E", "#009C95", "#5E50A1", "#CF3E96", "#1e293b"];

  /* ================= disegno di un simbolo ================= */
  const cacheSVG = {};
  let ospite = null;
  function ospiteNascosto() {
    if (!ospite) {
      ospite = document.createElement("div");
      ospite.style.cssText = "position:absolute;left:-9999px;top:-9999px";
      document.body.appendChild(ospite);
    }
    return ospite;
  }

  // misura finale del disegno dentro il suo riquadro quadrato.
  // Non si "allarga tutto fino a riempire": un punto di staccato deve
  // restare un puntino e una chiave di violino deve restare grande.
  // Però i segni piccolissimi vengono un po' ingranditi, altrimenti sulla
  // carta non si vedrebbero e non si riuscirebbe a toccarli.
  function inquadraRiquadro(svg, bb, lato) {
    const d = Math.max(bb.width, bb.height);
    const l = Math.min(110, Math.max(34, d * 1.25));
    svg.setAttribute("viewBox",
      (bb.x + bb.width / 2 - l / 2) + " " + (bb.y + bb.height / 2 - l / 2) + " " + l + " " + l);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    misura(svg, lato, lato);
  }

  // VexFlow scrive larghezza e altezza anche nello style: va sovrascritto
  function misura(svg, w, h) {
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    svg.style.width = w + "px";
    svg.style.height = h + "px";
    svg.style.overflow = "visible";
  }

  function inquadra(svg, lato) {
    let bb;
    try { bb = svg.getBBox(); } catch (e) { return; }
    if (!bb || !bb.width) return;
    inquadraRiquadro(svg, bb, lato);
  }

  function simboloSVG(simbolo, colore, lato) {
    // la chiave comprende nota e chiave musicale: due note diverse possono
    // avere lo stesso nome (il do di tre ottave diverse si chiama sempre do)
    const quale = simbolo.nota ? (simbolo.nota.clef + simbolo.nota.key) : simbolo.nome;
    const chiave = quale + "|" + colore + "|" + lato;
    if (cacheSVG[chiave]) return cacheSVG[chiave];

    const host = ospiteNascosto();
    host.innerHTML = "";
    const VF = global.Vex.Flow;
    const rend = new VF.Renderer(host, VF.Renderer.Backends.SVG);
    rend.resize(200, 200);
    const ctx = rend.getContext();
    ctx.setFillStyle(colore);
    ctx.setStrokeStyle(colore);

    if (simbolo.nota) {
      // una nota vera su un pentagramma in miniatura: rigo e chiave sempre
      // scuri, colorata solo la nota, così il colore dice il nome
      ctx.setFillStyle(INCHIOSTRO); ctx.setStrokeStyle(INCHIOSTRO);
      const rigo = new VF.Stave(0, 20, 86);
      rigo.addClef(simbolo.nota.clef);
      rigo.setContext(ctx).draw();
      ctx.setFillStyle(colore); ctx.setStrokeStyle(colore);
      const n = new VF.StaveNote({ clef: simbolo.nota.clef, keys: [simbolo.nota.key], duration: "q" });
      n.setStyle({ fillStyle: colore, strokeStyle: colore });
      VF.Formatter.FormatAndDraw(ctx, rigo, [n]);
      // il pentagramma è largo: niente riquadro quadrato, si tiene la forma
      const svg = host.querySelector("svg");
      let bb; try { bb = svg.getBBox(); } catch (e) { bb = null; }
      if (bb && bb.width) {
        const m = bb.height * 0.10;
        svg.setAttribute("viewBox", (bb.x - m) + " " + (bb.y - m) + " " + (bb.width + 2 * m) + " " + (bb.height + 2 * m));
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        // il pentagramma è più largo che alto: il riquadro lo segue
        misura(svg, lato, lato * (bb.height + 2 * m) / (bb.width + 2 * m));
      }
      const out = svg.outerHTML;
      cacheSVG[chiave] = out;
      return out;
    }

    simbolo.pezzi.forEach(p => {
      if (p.g) VF.Glyph.renderGlyph(ctx, 100 + p.x, 100 + p.y, p.s, p.g);
      else ctx.fillRect(100 + p.r[0], 100 + p.r[1], p.r[2], p.r[3]);
    });
    const svg = host.querySelector("svg");
    inquadra(svg, lato);
    const out = svg.outerHTML;
    cacheSVG[chiave] = out;
    return out;
  }

  /* ================= elenco dei simboli per una partita ================= */
  function simboliPerPartita(insieme, quanti) {
    const note = elencoNote();
    let scelti;
    if (insieme === "note") scelti = note.slice(0, quanti);
    else if (insieme === "segni") scelti = SEGNI.slice(0, quanti);
    else {
      // misto: metà e metà, alternati, così entrambi i tipi si vedono sempre
      const a = SEGNI.slice(0, Math.ceil(quanti / 2));
      const b = note.slice(0, Math.floor(quanti / 2));
      scelti = [];
      for (let i = 0; i < quanti; i++) scelti.push(i % 2 === 0 ? a[Math.floor(i / 2)] : b[Math.floor(i / 2)]);
    }
    return scelti.map((s, i) => {
      const colore = s.lettera ? COLORE_NOTA[s.lettera] : TAVOLOZZA[i % TAVOLOZZA.length];
      return {
        id: i, nome: s.nome, def: s, colore: colore,
        lettera: s.lettera || null,
        famiglia: s.lettera ? "note" : famigliaDi(SEGNI.indexOf(s))
      };
    });
  }

  // quanti simboli diversi riesce a dare un insieme
  function simboliDisponibili(insieme) {
    if (insieme === "note") return elencoNote().length;              // 34
    if (insieme === "segni") return SEGNI.length;                    // 57
    return SEGNI.length + elencoNote().length;
  }

  /* ================= disposizione dei simboli nella carta =================
     Numeri casuali ma ripetibili: la stessa carta è sempre disegnata
     uguale, così i ragazzi non vedono i simboli spostarsi. */
  function caso(seme) {
    let s = seme + 0x9e3779b9;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // anelli: quanti simboli su ogni cerchio, e a che distanza dal centro
  const ANELLI = {
    4: [{ n: 1, r: 0 }, { n: 3, r: 0.62 }],
    6: [{ n: 1, r: 0 }, { n: 5, r: 0.64 }],
    8: [{ n: 3, r: 0.33 }, { n: 5, r: 0.70 }]
  };
  const MISURA = { 4: 0.37, 6: 0.31, 8: 0.26 };

  function disposizione(idCarta, quanti) {
    const rnd = caso(idCarta * 7919 + quanti);
    const anelli = ANELLI[quanti] || ANELLI[6];
    const posti = [];
    anelli.forEach(a => {
      const giro = rnd() * Math.PI * 2;
      for (let i = 0; i < a.n; i++) {
        const ang = giro + (i / a.n) * Math.PI * 2 + (rnd() - 0.5) * 0.35;
        const r = a.r * (0.90 + rnd() * 0.20);
        posti.push({
          x: 0.5 + Math.cos(ang) * r / 2,
          y: 0.5 + Math.sin(ang) * r / 2,
          scala: 0.82 + rnd() * 0.33,
          rotazione: (rnd() - 0.5) * 50
        });
      }
    });
    return { posti: posti, misura: MISURA[quanti] || MISURA[6] };
  }

  global.UnoInComune = {
    SOLFEGGIO: SOLFEGGIO,
    costruisciMazzo: costruisciMazzo,
    simboliPerPartita: simboliPerPartita,
    simboliDisponibili: simboliDisponibili,
    simboloSVG: simboloSVG,
    disposizione: disposizione,
    SEGNI: SEGNI
  };
})(window);
