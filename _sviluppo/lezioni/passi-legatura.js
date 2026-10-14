/* ================= i passi ================= */
const CAPITOLI = [
  { nome: "La legatura", colore: "var(--c0)" },
  { nome: "Legatura e punto", colore: "var(--c1)" },
  { nome: "In pratica", colore: "var(--c2)" },
  { nome: "Ripasso", colore: "var(--c3)" }
];
const VB = "0 0 1000 420";
const PASSI = [];
const RIGO = () => R(60, 940, 200, "violino");
/* disegna una fila di battute nel palco e la tiene pronta per l'ascolto */
function scena(passo, ev, numMov, o = {}) {
  const r = RIGO();
  passo.B = Battute(r, ev, { x0: o.x0 || 250, x1: o.x1 || 930, num: numMov, barre: o.barre === false ? 0 : 270, conta: o.conta === false ? 0 : 350, senzaFine: o.senzaFine });
  q1(".scena").innerHTML = svgRigo(r, { spazi: true }) + svgBattute(passo.B, { tempo: o.senzaTempo ? null : numMov + "/4" });
  vfRiempi();
  return passo.B;
}
/* le legature compaiono piano (dissolvenza), dopo le note */
function disegnaLegature(anim) {
  qa(".legatura-vf").forEach(l => { l.classList.remove("appare"); if (anim) { void l.getBoundingClientRect(); l.classList.add("appare"); } });
}

/* ---------- 1. La legatura di valore ---------- */
PASSI.push({
  cap: 0, breve: "La legatura", titolo: "La legatura di valore",
  punti: [
    "La <b>legatura di valore</b> è una <b>linea curva</b> che unisce <b>due note</b>.",
    "Le due note hanno lo <b>stesso nome</b> e stanno alla <b>stessa altezza</b>: sulla stessa riga o nello stesso spazio.",
    `La nota si suona <b>una volta sola</b> e i valori si <b>sommano</b>: 1 + 1 = 2. ${ASCOLTA("senza", "▶ Senza legatura")} ${ASCOLTA("con", "▶ Con legatura")}`
  ],
  quaderno: "<p><b>Legatura di valore</b>: linea curva che unisce due note con lo stesso nome e sulla stessa altezza; unisce i valori delle note.</p>",
  crea() { svg(VB, `<g class="scena"></g>`); this.legata = true; this.disegna(); strumenti([{ t: "⌣ Togli / metti la legatura", fn: () => { this.legata = !this.legata; this.disegna(true); } }]); },
  disegna(anim) {
    scena(this, [{ fig: "q", lega: this.legata }, { fig: "q" }], 2, { x0: 300, x1: 760 });
    if (anim) disegnaLegature(true);
    cart(this.legata ? "Con la legatura: <b>un solo suono</b> di 2 movimenti" : "Senza legatura: <b>due suoni</b> da 1", false);
  },
  senza() { this.legata = false; this.disegna(); ascoltaBattute(this.B); },
  con() { this.legata = true; this.disegna(true); ascoltaBattute(this.B); },
  fase(f, anim) {
    fermaTutto(); this.legata = true; this.disegna();
    if (f === 0 && anim) disegnaLegature(true);
    spegniRighe();
    if (f >= 1) { luce(q1('.riga[data-riga="1"]'), true, coloreTesto("mi")); }
    if (f === 1) { qa(".ev").forEach((e, i) => dopo(200 + i * 600, () => salta(e))); }
    qa(".barra").forEach(b => b.style.opacity = f === 2 ? 1 : 0);
    cart(["Una linea curva che unisce due note", "Stesso nome, stessa altezza: MI e MI", "Un solo suono: 1 + 1 = 2"][f], anim);
    ascoltaNelTesto(this);
  }
});

/* ---------- 2. I valori si sommano ---------- */
PASSI.push({
  cap: 0, breve: "Si sommano i valori", titolo: "I valori si sommano",
  punti: [
    `Con la legatura i valori si <b>sommano</b>: minima legata a semiminima = 2 + 1 = <b>3</b> movimenti. ${ASCOLTA("ascolta")}`,
    "Prova tu: scegli le due figure da legare e ascolta quanto dura il suono."
  ],
  quaderno: "<p>Minima + semiminima = 3 · semiminima + croma = 1½ · minima + minima = 4</p>",
  crea() {
    this.a = this.a || "h"; this.b = this.b || "q";
    svg(VB, `<g class="scena"></g><text class="uguale vela" x="500" y="400" text-anchor="middle"></text>`);
    strumenti([
      { gruppo: ["h", "q", "8"].map(f => ({ t: NOME_FIG[f], cls: f === this.a ? "on" : "", fn: el => { segna("gA", el); this.a = f; this.disegna(); } })), id: "gA" },
      { t: "⌣", cls: "segno" },
      { gruppo: ["h", "q", "8"].map(f => ({ t: NOME_FIG[f], cls: f === this.b ? "on" : "", fn: el => { segna("gB", el); this.b = f; this.disegna(); } })), id: "gB" },
      { t: "▶ Ascolta", cls: "forte", fn: () => this.ascolta() }
    ]);
    this.disegna();
  },
  disegna() {
    const tot = valore(this.a) + valore(this.b), n = Math.max(2, Math.ceil(tot - 1e-9));
    // le figure sole: si completa la battuta con pause, così si contano i movimenti
    const ev = [{ fig: this.a, lega: true }, { fig: this.b }];
    let resto = n - tot; const pause = [];
    [2, 1, 0.5].forEach(v => { while (resto >= v - 1e-9) { pause.push({ fig: { 2: "h", 1: "q", 0.5: "8" }[v], pausa: true }); resto -= v; } });
    scena(this, ev.concat(pause), n, { x0: 260, x1: 900 });
    const t = q1(".uguale"); t.innerHTML = `${num(valore(this.a))} + ${num(valore(this.b))} = ${num(tot)}`; mostra(t);
    cart(`<b>${NOME_FIG[this.a]}</b> legata a <b>${NOME_FIG[this.b]}</b> <span class="piccolo">· ${num(tot)} movimenti</span>`, false);
  },
  ascolta() { if (this.B) ascoltaBattute(this.B); },
  fase(f, anim) {
    fermaTutto();
    if (f === 0) { this.a = "h"; this.b = "q"; ["gA", "gB"].forEach(id => document.querySelectorAll(`#${id} .btn`).forEach((b, i) => b.classList.toggle("on", ["h", "q", "8"][i] === (id === "gA" ? this.a : this.b)))); }
    this.disegna(); ascoltaNelTesto(this);
  }
});

/* ---------- 3. Oltre la stanghetta ---------- */
PASSI.push({
  cap: 0, breve: "Oltre la stanghetta", titolo: "Oltre la stanghetta",
  punti: [
    "La legatura serve soprattutto a far <b>continuare</b> una nota <b>dopo la stanghetta</b>, nella battuta seguente.",
    `Si conta sempre, ma la nota legata <b>non si ribatte</b>: si tiene. ${ASCOLTA("ascolta", "▶ Ascolta e conta")}`
  ],
  quaderno: "<p>La legatura di valore può unire due note anche <b>attraverso la stanghetta</b>.</p>",
  crea() { svg(VB, `<g class="scena"></g>`); strumenti([{ t: "▶ Ascolta e conta", cls: "forte", fn: () => this.ascolta() }]); },
  ascolta() { if (this.B) ascoltaBattute(this.B); },
  fase(f, anim) {
    fermaTutto();
    scena(this, [{ fig: "q", p: 0 }, { fig: "q", p: 1 }, { fig: "q", p: 2 }, { fig: "q", p: 3, lega: true }, { fig: "h", p: 3 }, { fig: "h", p: 2 }], 4);
    if (anim && f === 0) disegnaLegature(true);
    cart(["La nota continua nella battuta dopo", "1 + 2 = 3 movimenti, senza ribattere"][f], anim);
    ascoltaNelTesto(this);
  }
});

/* ---------- 4. Legatura o punto? ---------- */
PASSI.push({
  cap: 1, breve: "Legatura o punto?", titolo: "Legatura o punto?",
  punti: [
    `Una <b>minima legata a una semiminima</b> suona <b>come</b> una <b>minima col punto</b>: 2 + 1 = 3. ${ASCOLTA("prima", "▶ Con la legatura")} ${ASCOLTA("seconda", "▶ Col punto")}`,
    "Il punto si usa <b>dentro</b> la battuta; quando la nota deve passare <b>oltre la stanghetta</b> serve la legatura."
  ],
  quaderno: "<p>Minima legata a semiminima = minima col punto (3 movimenti).</p>",
  crea() {
    svg(VB, `<g class="scena"></g>`);
    strumenti([{ t: "▶ Con la legatura", fn: () => this.prima() }, { t: "▶ Col punto", fn: () => this.seconda() }]);
  },
  disegna() {
    // due battute da 3/4 una accanto all'altra: a sinistra con la legatura, a destra col punto
    const r = RIGO();
    this.B1 = Battute(r, [{ fig: "h", lega: true }, { fig: "q" }], { x0: 250, x1: 560, num: 3, barre: 270, conta: 350, senzaFine: true });
    this.B2 = Battute(r, [{ fig: "h", punti: 1 }], { x0: 620, x1: 930, num: 3, barre: 270, conta: 350 });
    // ogni lato ha le sue note, barre e numeri dentro un gruppo, così si può far suonare da solo
    q1(".scena").innerHTML = svgRigo(r, { spazi: true }) + `<g class="lato1">${svgBattute(this.B1, { tempo: "3/4" })}</g><g class="lato2">${svgBattute(this.B2, { chiave: false })}</g>` +
      `<text class="uguale" x="590" y="${r.y(8) - 40}" text-anchor="middle">=</text>` +
      `<text class="etic" x="405" y="${r.y(8) - 50}" text-anchor="middle">CON LA LEGATURA</text><text class="etic" x="775" y="${r.y(8) - 50}" text-anchor="middle">COL PUNTO</text>`;
    vfRiempi();
  },
  // ascolta una sola delle due metà: le altre righe non si toccano
  suonaLato(B, g) {
    fermaTutto(); const sec = 60 / 72, a = 0.3;
    for (let b = 0; b < 3; b++) colpoMetro(b === 0, a + b * sec);
    suonaTenuto(MI, a, 3 * sec);
    dopo(a * 1000, () => { salta(g.querySelector(".ev")); });
    g.querySelectorAll(".barra .riempi").forEach(x => { x.style.transition = "none"; x.style.transform = "scaleX(0)"; });
    void g.getBoundingClientRect();
    let t = 0; B.ev.forEach((e, i) => { const ri = g.querySelectorAll(".barra .riempi")[i]; dopo((a + e.t * sec) * 1000, () => { ri.style.transition = `transform ${e.d * sec}s linear`; ri.style.transform = "scaleX(1)"; }); });
    dopo((a + 3 * sec + 0.5) * 1000, () => g.querySelectorAll(".barra .riempi").forEach(x => { x.style.transition = "transform .4s"; x.style.transform = "scaleX(0)"; }));
  },
  prima() { this.suonaLato(this.B1, q1(".lato1")); cart("Con la legatura: <b>3 movimenti</b>", false); },
  seconda() { this.suonaLato(this.B2, q1(".lato2")); cart("Col punto: <b>3 movimenti</b> · stesso suono", false); },
  fase(f, anim) {
    fermaTutto();
    if (f === 0) { this.disegna(); if (anim) disegnaLegature(true); }
    else { scena(this, [{ fig: "q" }, { fig: "q" }, { fig: "q" }, { fig: "q", lega: true }, { fig: "h" }, { fig: "h" }], 4); if (anim) disegnaLegature(true); }
    cart(["Stesso suono, due scritture", "Oltre la stanghetta solo la legatura"][f], anim);
    ascoltaNelTesto(this);
  }
});

/* ---------- 5. Legatura di valore o di portamento? ---------- */
PASSI.push({
  cap: 1, breve: "Valore o portamento?", titolo: "Legatura di valore o di portamento?",
  punti: [
    `Se la curva unisce note <b>diverse</b>, <b>non</b> è una legatura di valore: è una legatura di <b>portamento</b>. Le note si suonano <b>tutte</b>, ben unite. ${ASCOLTA("valoreA", "▶ Valore")} ${ASCOLTA("portamentoA", "▶ Portamento")}`,
    "Prova tu: tocca una curva e scopri se è una legatura di <b>valore</b> o di <b>portamento</b>."
  ],
  quaderno: "<p>Legatura di <b>valore</b>: note uguali, si suona una volta. Legatura di <b>portamento</b>: note diverse, si suonano tutte, unite.</p>",
  crea() { svg(VB, `<g class="scena"></g><g class="segni"></g>`); strumenti([{ suggerimento: "Tocca le curve" }]); },
  // disegna note e curve; ogni curva ha un'area da toccare
  disegna(gruppi) {
    const r = RIGO(); let s = svgRigo(r, { spazi: true }), x = 230;
    this.gruppi = gruppi;
    const ev = [], xsTutte = [], curve = [];
    gruppi.forEach((g, gi) => {
      const xs = g.p.map((p, i) => x + i * (gruppi.length > 2 ? 78 : 100)), i0 = ev.length;
      g.p.forEach((p, i) => { ev.push({ fig: "q", p, gambo: 1, lega: g.valore && i < g.p.length - 1, data: { g: gi } }); xsTutte.push(xs[i]); });
      if (!g.valore) curve.push([i0, ev.length - 1]);
      const ylow = Math.max(...g.p.map(p => r.y(p))) + 24;
      s += `<rect class="colpo curva-colpo" data-g="${gi}" x="${xs[0] - 24}" y="${ylow - 40}" width="${xs[xs.length - 1] - xs[0] + 48}" height="90"/>`;
      if (g.etichetta) s += `<text class="etic" x="${(xs[0] + xs[xs.length - 1]) / 2}" y="${r.yb + 110}" text-anchor="middle" fill="${g.valore ? "#34D399" : "#F472B6"}">${g.etichetta}</text>`;
      g.xs = xs; x = xs[xs.length - 1] + (gruppi.length > 2 ? 92 : 200);
    });
    s = s.replace(svgRigo(r, { spazi: true }), svgRigo(r, { spazi: true }) + vfRigo({ x0: r.x0, x1: r.x1, yb: r.yb, ev, xs: xsTutte, curve }));
    q1(".scena").innerHTML = s; q1(".segni").innerHTML = ""; vfRiempi();
    qa(".curva-colpo").forEach(c => c.addEventListener("click", () => this.tocca(+c.dataset.g)));
  },
  tocca(gi) {
    const g = this.gruppi[gi], r = RIGO();
    qa(`.ev[data-g="${gi}"]`).forEach(salta);
    q1(".segni").insertAdjacentHTML("beforeend", `<text class="esito" x="${(g.xs[0] + g.xs[g.xs.length - 1]) / 2}" y="${r.y(10) - 6}" text-anchor="middle" fill="${g.valore ? "#34D399" : "#F472B6"}">${g.valore ? "VALORE" : "PORTAMENTO"}</text>`);
    this.suona(g);
    cart(g.valore ? "<b style=\"color:#34D399\">Valore</b> <span class=\"piccolo\">· note uguali: un solo suono</span>" : "<b style=\"color:#F472B6\">Portamento</b> <span class=\"piccolo\">· note diverse: si suonano tutte, unite</span>", false);
  },
  suona(g) {
    fermaTutto(); const sec = 60 / 80, a = 0.25;
    if (g.valore) { suonaTenuto(nota("violino", g.p[0]).midi, a, g.p.length * sec); dopo(a * 1000, () => salta(q1(`.ev[data-g="${this.gruppi.indexOf(g)}"]`))); }
    else g.p.forEach((p, i) => suonaTenuto(nota("violino", p).midi, a + i * sec, sec + 0.04));
  },
  valoreA() { this.suona(this.gruppi[0]); }, portamentoA() { this.suona(this.gruppi[1]); },
  fase(f, anim) {
    fermaTutto();
    if (f === 0) this.disegna([{ p: [2, 2], valore: true, etichetta: "VALORE" }, { p: [-2, -1, 0], valore: false, etichetta: "PORTAMENTO" }]);
    else this.disegna([{ p: [4, 5, 6], valore: false }, { p: [3, 3], valore: true }, { p: [1, 0], valore: false }, { p: [5, 5], valore: true }]);
    if (anim) disegnaLegature(true);
    cart(["Note uguali o note diverse?", "Tocca una curva"][f], anim);
    ascoltaNelTesto(this);
  }
});

/* ---------- 6. Esempi in battuta ---------- */
const ESEMPI_LEGA = [
  { num: 4, ev: [{ fig: "h", lega: true }, { fig: "q" }, { fig: "q" }], testo: "4/4: <b>minima legata a semiminima</b> (3 movimenti), poi una semiminima." },
  { num: 3, ev: [{ fig: "h" }, { fig: "q", lega: true }, { fig: "q" }, { fig: "h" }], testo: "3/4: l'ultima nota della prima battuta <b>continua</b> nella seconda." },
  { num: 2, ev: [{ fig: "q", lega: true }, { fig: "8" }, { fig: "8" }], testo: "2/4: <b>semiminima legata a croma</b> (1½), poi una croma." },
  { num: 4, ev: [{ fig: "q" }, { fig: "q" }, { fig: "h", lega: true }, { fig: "h" }, { fig: "h" }], testo: "4/4: una <b>minima legata</b> oltre la stanghetta: 2 + 2 = 4 movimenti." }
];
PASSI.push({
  cap: 2, breve: "Esempi in battuta", titolo: "Esempi in battuta",
  punti: ESEMPI_LEGA.map(e => e.testo + " " + ASCOLTA("ascolta", "▶ Ascolta e conta")),
  quaderno: "<p>Copia le battute sul quaderno pentagrammato e scrivi sotto le note legate quanto dura il suono.</p>",
  crea() { svg(VB, `<g class="scena"></g>`); strumenti([{ t: "▶ Ascolta e conta", cls: "forte", fn: () => this.ascolta() }, { suggerimento: "Battete il tempo con la mano" }]); },
  ascolta() { if (this.B) ascoltaBattute(this.B); },
  fase(f, anim) {
    fermaTutto(); const E = ESEMPI_LEGA[f];
    scena(this, E.ev, E.num);
    if (anim) disegnaLegature(true);
    cart(`<b>${E.num}/4</b> <span class="piccolo">· esempio ${f + 1} di ${ESEMPI_LEGA.length}</span>`, anim);
    ascoltaNelTesto(this);
  }
});

/* ---------- 7. Ripasso ---------- */
const DEF_LEGA = [
  [0, "Legatura di valore", "linea curva che unisce due note con lo stesso nome e sulla stessa altezza; unisce i valori delle note."],
  [1, "Si sommano i valori", "la nota si suona una volta sola: minima + semiminima = 3 movimenti."],
  [2, "Oltre la stanghetta", "la legatura fa continuare una nota nella battuta seguente."],
  [3, "Legatura o punto", "minima legata a semiminima suona come la minima col punto."],
  [4, "Legatura di portamento", "unisce note diverse: si suonano tutte, ben unite (non si somma nulla)."]
];
PASSI.push({
  cap: 3, breve: "Sul quaderno", titolo: "Ricapitoliamo", soloTesto: true,
  punti: ["Le definizioni da copiare sul quaderno. Tocca una scheda per tornare al passo."],
  crea() {
    const box = document.createElement("div"); box.className = "ripasso ripasso-grande";
    DEF_LEGA.forEach(([p, t, d]) => {
      const b = document.createElement("button"); b.className = "def"; b.style.setProperty("--colore", CAPITOLI[PASSI[p].cap].colore);
      b.innerHTML = `<span class="vai">${p + 1} →</span><b>${t}</b>: ${d}`; b.addEventListener("click", () => vai(p, PASSI[p].punti.length - 1)); box.appendChild(b);
    });
    PALCO.innerHTML = ""; PALCO.appendChild(box);
    STRUM.innerHTML = `<div class="allenati"><span>Ora allenati:</span>
      <a class="btn" href="lettura-ritmica.html">👏 Lettura ritmica</a><a class="btn" href="imita-il-ritmo.html">🥁 Imita il ritmo</a>
      <a class="btn" href="costruttore-di-battute.html">🧱 Costruttore di battute</a><a class="btn" href="punto-di-valore.html">• Il punto di valore</a></div>`;
  },
  fase() { cart("📒 Da copiare sul quaderno", false); }
});
