/* ================= i passi ================= */
const CAPITOLI = [
  { nome: "Il tempo semplice", colore: "var(--c0)" },
  { nome: "2/4, 3/4 e 4/4", colore: "var(--c1)" },
  { nome: "In pratica", colore: "var(--c2)" },
  { nome: "Tempi composti", colore: "#F472B6" },
  { nome: "Ripasso", colore: "var(--c3)" }
];
const VB = "0 0 1000 420";
const PASSI = [];
const RIGO = () => R(60, 940, 190, "violino");

/* accenti: F = forte, mf = mezzoforte, d = debole */
const ACCENTI = { 2: ["F", "d"], 3: ["F", "d", "d"], 4: ["F", "d", "mf", "d"] };
const NOME_ACC = { F: "forte", mf: "mezzoforte", d: "debole" };
const RAGGIO = { F: 25, mf: 19, d: 14 };
const VOL = { F: 1, mf: 0.72, d: 0.5 };
const NOME_TEMPO = { 2: "binario", 3: "ternario", 4: "quaternario" };

/* il legnetto più o meno forte secondo l'accento */
function colpoLivello(l, quando) {
  const ac = audio(); if (!ac) return;
  const t = ac.currentTime + 0.03 + quando, g = ac.createGain(); g.gain.value = { F: 0.95, mf: 0.62, d: 0.36 }[l]; g.connect(master);
  const buf = campione("legno"); let o;
  if (buf) { o = ac.createBufferSource(); o.buffer = buf; o.playbackRate.value = l === "F" ? 1.12 : 1; o.connect(g); o.start(t); }
  else { o = ac.createOscillator(); const e = ac.createGain(); o.type = "sine"; o.frequency.setValueAtTime(l === "F" ? 1500 : 1150, t); o.frequency.exponentialRampToValueAtTime(700, t + 0.04);
    e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(0.3, t + 0.003); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.06); o.connect(e); e.connect(g); o.start(t); o.stop(t + 0.08); }
  VOCI.push({ g, os: [o] }); riposo(quando + 0.3);
}

/* una scena: pentagramma + battute (disegnate da VexFlow) + la fila dei movimenti sotto.
   o: { tempo ("3/4", "C", "6/8", null), m (movimenti per battuta), ub (valore di un movimento: 1 = semiminima, 1.5 = semiminima col punto),
        parti (in quante parti si vede diviso il movimento: 1, 2, 3), accenti (true: cerchi forte/debole), x0, x1 } */
function scena(passo, ev, o) {
  const r = RIGO(), ub = o.ub || 1, m = o.m;
  const B = passo.B = Battute(r, ev, { x0: o.x0 || 250, x1: o.x1 || 930, num: m * ub });
  B.m = m; B.ub = ub; B.acc = ACCENTI[m];
  let s = svgRigo(r, { spazi: true }) + svgBattute(B, { tempo: o.tempo || null });
  const nMov = B.nb * m, y = 268;
  for (let b = 0; b < nMov; b++) {
    const t = b * ub, xa = B.x(t) + 2, xb = B.x(t) + ub * B.u - 8, l = B.acc[b % m];   // tutti i movimenti larghi uguali
    if (o.accenti) {
      const xc = B.x(t) + 18;
      s += `<g class="acc acc-${l}" data-b="${b}"><circle cx="${xc}" cy="${y + 26}" r="${RAGGIO[l]}"/><text x="${xc}" y="${y + 34}">${(b % m) + 1}</text></g>`;
      s += `<text class="acc-l" x="${xc}" y="${y + 90}">${l}</text>`;
    } else {
      const parti = o.parti || 1;
      s += `<g class="mov" data-b="${b}"><rect x="${xa}" y="${y}" width="${xb - xa}" height="44" rx="9"/>`;
      for (let k = 1; k < parti; k++) s += `<line x1="${xa + (xb - xa) * k / parti}" x2="${xa + (xb - xa) * k / parti}" y1="${y + 6}" y2="${y + 38}"/>`;
      s += `<text x="${xa + (xb - xa) / (2 * parti)}" y="${y + 31}">${(b % m) + 1}</text>`;
      for (let k = 1; k < parti; k++) s += `<text class="pic" x="${xa + (xb - xa) * (2 * k + 1) / (2 * parti)}" y="${y + 29}">·</text>`;
      s += `</g>`;
    }
  }
  s += o.extra || "";
  q1(".scena").innerHTML = s; vfRiempi();
  return B;
}
/* ascolta: legnetto con gli accenti, melodia del violino (più forte sui movimenti forti), cerchi e note che saltano */
function ascoltaTempo(B, o = {}) {
  fermaTutto();
  const sec = o.sec || 60 / 76, att = 0.35, nMov = B.nb * B.m;
  for (let b = 0; b < nMov; b++) {
    const l = B.acc[b % B.m], q = att + b * B.ub * sec;
    colpoLivello(l, q);
    dopo(q * 1000, () => { salta(q1(`.acc[data-b="${b}"]`)); salta(q1(`.mov[data-b="${b}"]`)); });
  }
  if (!o.soloColpi) B.ev.forEach((e, i) => {
    const q = att + e.t * sec, sulMov = Math.abs(e.t / B.ub - Math.round(e.t / B.ub)) < 1e-6;
    const l = sulMov ? B.acc[Math.round(e.t / B.ub) % B.m] : "d";
    if (!e.pausa) suonaTenuto(nota("violino", e.p).midi, q, e.d * sec, VOL[l]);
    dopo(q * 1000, () => salta(q1(`.ev[data-i="${i}"]`)));
  });
  dopo((att + B.tot * sec + 0.3) * 1000, () => { if (o.fine) o.fine(); });
}
/* note: [figura, posizione, opzioni] → eventi; "8t" = croma unita alla seguente da una trave */
const EV = lista => lista.map(([f, p, x]) => Object.assign({ fig: f.replace("t", ""), p, trave: f.endsWith("t") }, x || {}));

/* ---------- 1. Che cos'è un tempo semplice ---------- */
PASSI.push({
  cap: 0, breve: "Il tempo semplice", titolo: "Che cos'è un tempo semplice",
  punti: [
    "Nei tempi <b>2/4</b>, <b>3/4</b> e <b>4/4</b> il numero sotto è <b>4</b>: ogni movimento vale una <b>semiminima</b>.",
    `Ogni movimento si divide in <b>due</b> parti uguali, due <b>crome</b>: per questo sono tempi <b>semplici</b>. ${ASCOLTA("ascolta", "▶ Ascolta e conta")}`,
    "Prova tu: scegli il tempo, dividi i movimenti e ascolta."
  ],
  quaderno: "<p><b>Tempo semplice</b>: ogni movimento si divide in <b>due</b> parti uguali. Esempi: 2/4, 3/4, 4/4.</p>",
  crea() {
    this.m = this.m || 2; this.div = !!this.div;
    svg(VB, `<g class="scena"></g>`);
    strumenti([
      { gruppo: [2, 3, 4].map(m => ({ t: m + "/4", cls: m === this.m ? "on" : "", fn: el => { segna("gTempo1", el); this.m = m; this.disegna(); } })), id: "gTempo1" },
      { t: "✂️ Dividi in due", id: "btnDiv", cls: this.div ? "on" : "", fn: el => { this.div = !this.div; el.classList.toggle("on", this.div); this.disegna(); } },
      { t: "▶ Ascolta e conta", cls: "forte", fn: () => this.ascolta() }
    ]);
  },
  disegna() {
    fermaTutto();
    const ev = [];
    for (let b = 0; b < 2 * this.m; b++) ev.push(...(this.div ? EV([["8t", 0], ["8", 2]]) : EV([["q", 2]])));
    scena(this, ev, { tempo: this.m + "/4", m: this.m, parti: this.div ? 2 : 1, x0: 240 });
    cart(this.div ? `${this.m}/4 · ogni movimento = <b>due crome</b>` : `${this.m}/4 · <b>${this.m}</b> movimenti da una semiminima`, false);
  },
  ascolta() { ascoltaTempo(this.B, { sec: 60 / 66 }); },
  fase(f, anim) {
    this.div = f >= 1 ? (f === 1 ? true : this.div) : false;
    if (f < 2) { this.m = 2; segna("gTempo1", document.querySelector("#gTempo1 .btn")); }
    const bd = document.querySelector("#btnDiv"); if (bd) bd.classList.toggle("on", this.div);
    this.disegna();
    if (anim && f === 1) qa(".mov").forEach((m, i) => dopo(150 + i * 550, () => salta(m)));
    ascoltaNelTesto(this);
  }
});

/* ---------- 2–4. I tre tempi ---------- */
function passoTempo(m, melodia, testi, quaderno) {
  return {
    cap: 1, breve: `Il ${m}/4`, titolo: `Il tempo ${m}/4`,
    punti: testi,
    quaderno,
    crea() { svg(VB, `<g class="scena"></g>`); strumenti([{ t: "🥁 Solo i colpi", fn: () => this.colpi() }, { t: "▶ Ascolta la melodia", cls: "forte", fn: () => this.melodia() }, { suggerimento: "Battete il primo movimento più forte" }]); },
    disegna(tempo) { scena(this, EV(melodia), { tempo: tempo || m + "/4", m, accenti: true }); },
    colpi() { ascoltaTempo(this.B, { soloColpi: true }); cart(ACCENTI[m].map(l => `<b>${NOME_ACC[l]}</b>`).join(" · "), false); },
    melodia() { ascoltaTempo(this.B); cart(`${m}/4 · tempo <b>${NOME_TEMPO[m]}</b>`, false); },
    fase(f, anim) {
      fermaTutto();
      this.disegna(m === 4 && f === 2 ? "C" : null);
      if (anim && f === 0) qa(".acc").forEach((a, i) => { if (i < m) dopo(200 + i * 600, () => salta(a)); });
      if (anim && m === 4 && f === 2) dopo(200, () => salta(q1(".tempo-vf")));
      cart(f === 0 ? ACCENTI[m].map(l => NOME_ACC[l]).join(" · ") : f === 1 ? `Tempo <b>${NOME_TEMPO[m]}</b>` : "4/4 = <b>C</b>", anim);
      ascoltaNelTesto(this);
    }
  };
}
PASSI.push(passoTempo(2,
  [["q", 2], ["q", 0], ["8t", 2], ["8", 3], ["q", 4], ["q", 5], ["q", 4], ["h", 2]],
  [`<b>2</b> movimenti in ogni battuta: il primo è <b>forte</b> (F), il secondo <b>debole</b> (d). ${ASCOLTA("colpi", "🥁 Ascolta i colpi")}`,
   `È un tempo <b>binario</b>: si conta «<b>1</b> 2, <b>1</b> 2». È il tempo delle <b>marce</b>. ${ASCOLTA("melodia", "▶ Ascolta la melodia")}`],
  "<p><b>2/4</b>: 2 movimenti da una semiminima. <b>Forte</b> – <b>debole</b>. Tempo binario.</p>"));
PASSI.push(passoTempo(3,
  [["h", 0], ["q", 2], ["h", 4], ["q", 3], ["h", 2, { punti: 1 }]],
  [`<b>3</b> movimenti in ogni battuta: <b>forte</b>, <b>debole</b>, <b>debole</b>. ${ASCOLTA("colpi", "🥁 Ascolta i colpi")}`,
   `È un tempo <b>ternario</b>: «<b>1</b> 2 3, <b>1</b> 2 3». È il tempo del <b>valzer</b>. ${ASCOLTA("melodia", "▶ Ascolta la melodia")}`],
  "<p><b>3/4</b>: 3 movimenti da una semiminima. <b>Forte</b> – <b>debole</b> – <b>debole</b>. Tempo ternario.</p>"));
PASSI.push(passoTempo(4,
  [["q", 0], ["q", 2], ["q", 4], ["q", 2], ["h", 3], ["h", 0]],
  [`<b>4</b> movimenti in ogni battuta: <b>forte</b>, <b>debole</b>, <b>mezzoforte</b> (mf), <b>debole</b>. ${ASCOLTA("colpi", "🥁 Ascolta i colpi")}`,
   `È un tempo <b>quaternario</b>: «<b>1</b> 2 <b>3</b> 4». È il tempo più usato, anche nelle canzoni. ${ASCOLTA("melodia", "▶ Ascolta la melodia")}`,
   "Il 4/4 si può scrivere anche con una <b>C</b>."],
  "<p><b>4/4</b>: 4 movimenti da una semiminima. <b>Forte</b> – <b>debole</b> – <b>mezzoforte</b> – <b>debole</b>. Tempo quaternario; si scrive anche <b>C</b>.</p>"));

/* ---------- 5. Il gesto del direttore ---------- */
// punti dei movimenti e punti di controllo delle curve (visti da chi dirige), nel palco 1000 × 420
const GESTO = {
  2: { p: [[540, 360], [610, 70]], c: [[525, 180], [720, 330]] },
  3: { p: [[520, 360], [760, 290], [610, 70]], c: [[505, 180], [640, 250], [800, 140]] },
  4: { p: [[560, 360], [360, 270], [790, 270], [640, 70]], c: [[545, 180], [440, 250], [575, 325], [820, 140]] }
};
PASSI.push({
  cap: 1, breve: "Il gesto del direttore", titolo: "Battere il tempo",
  punti: [
    "Il <b>direttore</b> batte il tempo con la mano: il <b>primo</b> movimento va sempre <b>in basso</b>, l'<b>ultimo</b> in <b>alto</b>.",
    "Prova tu: scegli il tempo, premi ▶ e muovi la mano destra seguendo il pallino."
  ],
  quaderno: "<p>Battere il tempo: il 1° movimento va in <b>basso</b>, l'ultimo in <b>alto</b>.</p>",
  crea() {
    this.m = this.m || 3;
    strumenti([
      { gruppo: [2, 3, 4].map(m => ({ t: m + "/4", cls: m === this.m ? "on" : "", fn: el => { segna("gGesto", el); this.m = m; fermaTutto(); this.disegna(); } })), id: "gGesto" },
      { t: "▶ Batti il tempo", id: "btnBatti", cls: "forte", fn: () => this.batti() }
    ]);
    this.disegna();
  },
  pos(i, s) {                                     // dal movimento i-1 al movimento i, s da 0 a 1
    const G = GESTO[this.m], n = this.m, a = G.p[(i - 1 + n) % n], b = G.p[i % n], c = G.c[i % n];
    return [(1 - s) * (1 - s) * a[0] + 2 * s * (1 - s) * c[0] + s * s * b[0], (1 - s) * (1 - s) * a[1] + 2 * s * (1 - s) * c[1] + s * s * b[1]];
  },
  disegna() {
    const G = GESTO[this.m], n = this.m, L = ACCENTI[n];
    let s = "";
    for (let i = 0; i < n; i++) {
      const a = G.p[(i - 1 + n) % n], b = G.p[i], c = G.c[i];
      s += `<path class="traccia" d="M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}"/>`;
      // una freccia a metà strada, nella direzione del gesto
      const [x, y] = this.pos(i, 0.55), [x2, y2] = this.pos(i, 0.58), ang = Math.atan2(y2 - y, x2 - x) * 180 / Math.PI;
      s += `<path class="punta" d="M-11 -10 L11 0 L-11 10 Z" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})"/>`;
    }
    G.p.forEach(([x, y], i) => s += `<g class="acc acc-${L[i]}" data-b="${i}"><circle cx="${x}" cy="${y}" r="${RAGGIO[L[i]] + 4}"/><text x="${x}" y="${y + 9}">${i + 1}</text></g>`);
    s += `<text class="uguale" x="170" y="200" text-anchor="middle">${n}/4</text><text class="acc-l" x="170" y="250">${L.join(" · ")}</text>`;
    s += `<circle class="bacchetta vela nascosto" cx="0" cy="0" r="15"/>`;
    svg(VB, s);
    cart(`${n}/4 · ${n === 2 ? "giù, su" : n === 3 ? "giù, destra, su" : "giù, sinistra, destra, su"}`, false);
  },
  batti() {
    fermaTutto();
    const n = this.m, sec = 60 / 66, giri = 4, tot = n * giri, palla = q1(".bacchetta");
    mostra(palla); const metti = ([x, y]) => { palla.setAttribute("cx", x.toFixed(1)); palla.setAttribute("cy", y.toFixed(1)); };
    metti(GESTO[n].p[n - 1]);
    // un movimento di preparazione (in silenzio), poi 4 battute
    for (let k = 0; k < tot; k++) {
      const l = ACCENTI[n][k % n];
      colpoLivello(l, (k + 1) * sec);
      dopo((k + 1) * sec * 1000 + 30, () => { salta(q1(`.acc[data-b="${k % n}"]`)); cart(`<span style="font-size:30px">${(k % n) + 1}</span> <span class="piccolo">${NOME_ACC[l]}</span>`, false); });
    }
    const t0 = performance.now() + 30;
    const passo = ora => {
      const tt = (ora - t0) / 1000 / sec;               // in movimenti, da 0
      if (tt >= tot + 0.6) { mostra(palla, false); cart(`${n}/4 · ancora? Premi ▶`, false); return; }
      if (tt >= 0) { const k = Math.min(tot, Math.floor(tt)), s = Math.min(1, tt - k); metti(k >= tot ? GESTO[n].p[(tot - 1) % n] : this.pos(k % n, s * s)); }
      ANIMA = requestAnimationFrame(passo);
    };
    ANIMA = requestAnimationFrame(passo);
  },
  fase(f, anim) {
    fermaTutto(); this.disegna();
    if (anim && f === 0) qa(".acc").forEach((a, i) => dopo(200 + i * 600, () => salta(a)));
  }
});

/* ---------- 6. Quale tempo? ---------- */
// battute da 2, 3 e 4 movimenti (le crome a coppie, unite dalla trave)
const BATTUTE_Q = {
  2: [["q", "q"], ["h"], ["8t", "8", "q"], ["q", "8t", "8"], ["q.", "8"], ["8t", "8", "8t", "8"], ["q", "qr"]],
  3: [["h", "q"], ["q", "q", "q"], ["h."], ["q", "h"], ["q", "8t", "8", "q"], ["8t", "8", "q", "q"], ["q.", "8", "q"], ["qr", "q", "q"]],
  4: [["w"], ["h", "h"], ["q", "q", "h"], ["h", "q", "q"], ["h.", "q"], ["q", "q", "q", "q"], ["8t", "8", "q", "h"], ["q", "h", "q"], ["hr", "h"]]
};
const MELO = [0, 2, 4, 3, 2, 1, 0, 2, 3, 4, 5, 4];
function battutaEv(lista, i0) {
  return lista.map((f, i) => { const pausa = f.endsWith("r"), punti = f.includes(".") ? 1 : 0, fig = f.replace(/[.rt]/g, "");
    return { fig, punti, pausa, trave: f.endsWith("t"), p: MELO[(i0 + i) % MELO.length] }; });
}
PASSI.push({
  cap: 2, breve: "Quale tempo?", titolo: "Quale tempo?",
  punti: [
    "Manca l'indicazione di tempo! <b>Conta</b> quanti movimenti ci sono in ogni battuta e scegli: 2/4, 3/4 o 4/4.",
    "Se sbagli, sotto ogni battuta compare il conto. Poi premi «Un'altra»."
  ],
  quaderno: "<p>Per trovare il tempo: si <b>sommano</b> i valori delle figure di una battuta.</p>",
  crea() {
    this.giuste = this.giuste || 0; this.fatte = this.fatte || 0;
    svg(VB, `<g class="scena"></g>`);
    strumenti([
      { gruppo: [2, 3, 4].map(m => ({ t: m + "/4", fn: el => this.rispondi(m, el) })), id: "gRisp" },
      { t: "↻ Un'altra", fn: () => this.nuova() },
      { t: "▶ Ascolta", id: "btnAscQ", fn: () => this.ascolta() }
    ]);
    this.nuova(true);
  },
  nuova(prima) {
    fermaTutto();
    let m; do { m = 2 + Math.floor(Math.random() * 3); } while (!prima && m === this.m && Math.random() < 0.6);
    const P = BATTUTE_Q[m], a = Math.floor(Math.random() * P.length); let b; do { b = Math.floor(Math.random() * P.length); } while (b === a);
    this.m = m; this.batt = [P[a], P[b]]; this.risolta = false; this.primo = true;
    document.querySelectorAll("#gRisp .btn").forEach(x => x.classList.remove("on", "giusto", "sbagliato"));
    this.disegna(false);
    cart(`Quanti movimenti? <span class="piccolo">· giuste al primo colpo: ${this.giuste} su ${this.fatte}</span>`, false);
  },
  disegna(conTempo) {
    const ev = battutaEv(this.batt[0], 0).concat(battutaEv(this.batt[1], 4));
    const r = RIGO();
    let extra = conTempo ? "" : `<g class="buco"><rect x="180" y="${r.y(8) - 4}" width="52" height="${4 * S + 8}" rx="8"/><text x="206" y="${r.y(4) + 14}">?</text></g>`;
    scena(this, ev, { tempo: conTempo ? this.m + "/4" : null, m: this.m, accenti: false, parti: 1, extra, x0: 240, x1: 940 });
    // il conto di ogni battuta (nascosto finché serve)
    const B = this.B; let s = "";
    [0, 1].forEach(k => {
      const vals = B.ev.filter(e => e.t >= k * this.m - 1e-9 && e.t < (k + 1) * this.m - 1e-9).map(e => num(e.d));
      s += `<text class="somma vela nascosto" x="${B.x(k * this.m) + (B.mw - B.padL) / 2}" y="370" text-anchor="middle">${vals.join(" + ")}${vals.length > 1 ? " = " + this.m : ""}</text>`;
    });
    q1(".scena").insertAdjacentHTML("beforeend", s);
    qa(".mov").forEach(x => { x.classList.add("vela"); mostra(x, conTempo); });
  },
  rispondi(m, el) {
    if (this.risolta) return;
    if (this.primo) this.fatte++;
    if (m === this.m) {
      if (this.primo) this.giuste++;
      this.risolta = true; el.classList.add("giusto");
      this.disegna(true); qa(".somma").forEach(x => mostra(x));
      dopo(80, () => salta(q1(".tempo-vf")));
      cart(`<b>Giusto: ${m}/4!</b> <span class="piccolo">· giuste al primo colpo: ${this.giuste} su ${this.fatte}</span>`, false);
      dopo(500, () => this.ascolta());
    } else {
      el.classList.add("sbagliato"); this.primo = false;
      qa(".somma").forEach(x => mostra(x));
      cart(`Non ancora: guarda il conto sotto le battute`, false);
    }
  },
  ascolta() { if (this.B) ascoltaTempo(this.B); },
  fase(f, anim) { cart(`Quanti movimenti? <span class="piccolo">· giuste al primo colpo: ${this.giuste} su ${this.fatte}</span>`, false); }
});

/* ---------- 7. Verso i tempi composti ---------- */
PASSI.push({
  cap: 3, breve: "E i tempi composti?", titolo: "E i tempi composti?",
  punti: [
    `Nei tempi <b>semplici</b> ogni movimento si divide in <b>due</b>. ${ASCOLTA("semplice", "▶ Ascolta il 2/4")}`,
    `Nei tempi <b>composti</b> ogni movimento si divide in <b>tre</b>: vale una <b>semiminima col punto</b>, cioè tre crome. Esempio: <b>6/8</b>. ${ASCOLTA("composto", "▶ Ascolta il 6/8")}`,
    "Il 6/8 ha <b>2</b> movimenti, come il 2/4: cambia solo come si dividono. I tempi composti li studieremo più avanti!"
  ],
  quaderno: "<p><b>Tempo composto</b>: ogni movimento si divide in <b>tre</b> parti uguali. Esempio: 6/8 (2 movimenti da semiminima col punto).</p>",
  crea() {
    svg(VB, `<g class="scena"></g>`);
    strumenti([{ gruppo: [["2/4 semplice", "s"], ["6/8 composto", "c"]].map(([t, k]) => ({ t, fn: el => { segna("gComp", el); this.mostra(k); } })), id: "gComp" },
      { t: "▶ Ascolta e conta", cls: "forte", fn: () => this.ascolta() }]);
  },
  mostra(k) {
    fermaTutto(); this.k = k;
    document.querySelectorAll("#gComp .btn").forEach((b, i) => b.classList.toggle("on", (i === 0) === (k === "s")));
    if (k === "s") scena(this, EV([["8t", 2], ["8", 2], ["8t", 4], ["8", 2], ["8t", 3], ["8", 3], ["8t", 1], ["8", 1]]), { tempo: "2/4", m: 2, parti: 2 });
    else scena(this, EV([["8t", 2], ["8t", 2], ["8", 2], ["8t", 4], ["8t", 3], ["8", 2], ["8t", 3], ["8t", 2], ["8", 1], ["8t", 0], ["8t", 1], ["8", 0]]), { tempo: "6/8", m: 2, ub: 1.5, parti: 3 });
    cart(k === "s" ? "2/4 · ogni movimento: <b>2</b> crome" : "6/8 · ogni movimento: <b>3</b> crome", false);
  },
  semplice() { this.mostra("s"); this.ascolta(); },
  composto() { this.mostra("c"); this.ascolta(); },
  // stessa velocità dei movimenti (60 al minuto): nel 6/8 le crome sono tre per movimento
  ascolta() { ascoltaTempo(this.B, { sec: this.k === "s" ? 1 : 1 / 1.5 }); },
  fase(f, anim) {
    this.mostra(f === 0 ? "s" : "c");
    if (anim && f < 2) qa(".mov").forEach((m, i) => { if (i < 2) dopo(200 + i * 600, () => salta(m)); });
    ascoltaNelTesto(this);
  }
});

/* ---------- 8. Ripasso ---------- */
const DEF_TEMPI = [
  [0, "Tempo semplice", "ogni movimento si divide in due parti uguali (2/4, 3/4, 4/4)."],
  [1, "2/4", "2 movimenti: forte, debole. Tempo binario."],
  [2, "3/4", "3 movimenti: forte, debole, debole. Tempo ternario."],
  [3, "4/4", "4 movimenti: forte, debole, mezzoforte, debole. Tempo quaternario; si scrive anche C."],
  [4, "Battere il tempo", "il 1° movimento va in basso, l'ultimo in alto."],
  [6, "Tempo composto", "ogni movimento si divide in tre parti uguali (per esempio 6/8)."]
];
PASSI.push({
  cap: 4, breve: "Sul quaderno", titolo: "Ricapitoliamo", soloTesto: true,
  punti: ["Le definizioni da copiare sul quaderno. Tocca una scheda per tornare al passo."],
  crea() {
    const box = document.createElement("div"); box.className = "ripasso ripasso-grande";
    DEF_TEMPI.forEach(([p, t, d]) => {
      const b = document.createElement("button"); b.className = "def"; b.style.setProperty("--colore", CAPITOLI[PASSI[p].cap].colore);
      b.innerHTML = `<span class="vai">${p + 1} →</span><b>${t}</b>: ${d}`; b.addEventListener("click", () => vai(p, PASSI[p].punti.length - 1)); box.appendChild(b);
    });
    PALCO.innerHTML = ""; PALCO.appendChild(box);
    STRUM.innerHTML = `<div class="allenati"><span>Ora allenati:</span>
      <a class="btn" href="lettura-ritmica.html">👏 Lettura ritmica</a><a class="btn" href="costruttore-di-battute.html">🧱 Costruttore di battute</a>
      <a class="btn" href="dettato-ritmico.html">✍️ Dettato ritmico</a></div>`;
  },
  fase() { cart("📒 Da copiare sul quaderno", false); }
});
