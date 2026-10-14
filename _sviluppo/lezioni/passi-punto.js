/* ================= i passi ================= */
const CAPITOLI = [
  { nome: "Le figure", colore: "var(--c0)" },
  { nome: "Il punto", colore: "var(--c1)" },
  { nome: "In pratica", colore: "var(--c2)" },
  { nome: "Ripasso", colore: "var(--c3)" }
];
const VB = "0 0 1000 420";
const PASSI = [];

/* ---------- 1. Le figure e i loro valori ---------- */
PASSI.push({
  cap: 0, breve: "Le figure", titolo: "Le figure e i loro valori",
  punti: [
    "Ogni figura ha un <b>valore</b>: quanti <b>movimenti</b> dura. La <b>semiminima</b> vale <b>1</b> movimento.",
    "Ogni figura vale la <b>metà</b> di quella sopra: 4, 2, 1, ½, ¼.",
    "Tocca una figura: la senti durare quanto vale, mentre la sua barra si riempie."
  ],
  quaderno: "<p>Semibreve <b>4</b> · minima <b>2</b> · semiminima <b>1</b> · croma <b>½</b> · semicroma <b>¼</b></p>",
  crea() {
    let s = "";
    const Y = i => 52 + i * 82;
    ["w", "h", "q", "8", "16"].forEach((f, i) => s += svgRigaValore(Y(i), f, 0, { U: 100, xn: 150, xb: 430 }));
    s += `<g class="vela nascosto meta">` + [0, 1, 2, 3].map(i => `<text class="etic" x="930" y="${Y(i) + 48}" text-anchor="middle" fill="#FBBF24">metà ↓</text>`).join("") + `</g>`;
    s += `<g class="vela nascosto pause-col">` + ["w", "h", "q", "8", "16"].map((f, i) => svgFig(340, Y(i) - 4, f, 0, { k: 1.9, pausa: true })).join("") + `</g>`;
    svg("0 0 1000 430", s);
    qa(".riga-val").forEach(g => g.addEventListener("click", () => ascoltaFigura(g, g.dataset.fig, +g.dataset.punti, false)));
    strumenti([
      { t: "⏸ Mostra le pause", id: "btnPause", fn: el => { const on = !el.classList.contains("on"); el.classList.toggle("on", on); mostra(q1(".pause-col"), on); cart(on ? "Ogni figura ha la sua <b>pausa</b>, che dura lo stesso" : "Le figure", false); } },
      { suggerimento: "Tocca una figura" }
    ]);
  },
  fase(f, anim) {
    fermaTutto(); qa(".pezzo.zero").forEach(p => p.classList.remove("zero")); mostra(q1(".meta"), f === 1);
    cart(["La semiminima vale 1 movimento", "Ogni figura vale la metà di quella sopra", "Tocca una figura"][f], anim);
    if (f === 0 && anim) qa(".riga-val .pezzo").forEach((p, i) => { p.classList.add("zero"); dopo(150 + i * 600, () => p.classList.remove("zero")); });
  }
});

/* ---------- 2. Il punto di valore ---------- */
function palcoPunto(fig, punti, U = 130) {
  const r = R(60, 340, 260, "violino");
  let s = svgRigo(r, { spazi: true }) + vfRigo({ x0: r.x0, x1: r.x1, yb: r.yb, ev: [{ fig, punti, p: 0, cls: "fig-grande", puntoCls: "punto-big vela nascosto" }], xs: [235] });
  // barre: valore della nota, poi i pezzi dei punti
  let parti = [BASE_VAL[fig]]; for (let k = 1; k <= punti; k++) parti.push(parti[k - 1] / 2);
  let x = 420; const y = 150;
  s += `<g class="barra grande">`;
  parti.forEach((v, k) => { s += `<rect class="pezzo pz${k} cresce${k ? " zero" : ""}" data-k="${k}" x="${x}" y="${y}" width="${Math.max(6, v * U - 6)}" height="56" rx="10"/>` +
    `<text class="val-pezzo vela${k ? " nascosto" : ""}" data-k="${k}" x="${x + (v * U - 6) / 2}" y="${y + 38}">${num(v)}</text>`; x += v * U; });
  s += `<rect class="riempi" x="420" y="${y}" width="${x - 426}" height="56" rx="10"/></g>`;
  s += `<text class="uguale vela nascosto" x="420" y="${y + 120}">${somma(fig, punti)}</text>`;
  s += `<text class="etic" x="420" y="${y - 22}">${MAIU(nomeFig(fig, 0))}${punti ? " + " + (punti === 1 ? "PUNTO" : "DUE PUNTI") : ""}</text>`;
  return s;
}
function mostraPunti(quanti, anim) {
  qa(".punto-big").forEach((p, i) => { mostra(p, i < quanti); if (anim && i === quanti - 1) salta(p); });
  qa(".barra.grande .pezzo").forEach(p => p.classList.toggle("zero", +p.dataset.k > quanti));
  qa(".barra.grande .val-pezzo").forEach(t => mostra(t, +t.dataset.k <= quanti));
}
PASSI.push({
  cap: 1, breve: "Il punto di valore", titolo: "Il punto di valore",
  punti: [
    "Un <b>punto</b> scritto <b>dopo la nota</b> ne <b>aumenta il valore</b>.",
    "Di quanto? Della <b>metà</b> del valore della nota: la minima vale 2, la metà di 2 è 1.",
    `La <b>minima col punto</b> vale <b>3</b> movimenti: 2 + 1. ${ASCOLTA("confronta", "▶ Ascolta: minima, poi minima col punto")}`
  ],
  quaderno: "<p><b>Punto di valore</b>: un punto posto dopo una nota (o una pausa) aumenta il valore della nota di metà del valore della nota stessa.</p>",
  crea() { svg(VB, palcoPunto("h", 1)); strumenti([{ t: "↺ Togli e rimetti il punto", fn: () => { mostraPunti(0); dopo(700, () => mostraPunti(1, true)); } }]); },
  confronta() {
    fermaTutto(); const sec = 60 / 72, a = 0.3;
    [0, 1, 2, 3, 4, 5].forEach(b => colpoMetro(b === 0 || b === 3, a + b * sec));
    suonaTenuto(MI, a, 2 * sec); mostraPunti(0); cart("Minima: <b>2</b> movimenti", false);
    dopo((a + 3 * sec) * 1000, () => { mostraPunti(1, true); cart("Minima col punto: <b>3</b> movimenti", false); });
    suonaTenuto(MI, a + 3 * sec, 3 * sec);
    dopo(a * 1000, () => salta(q1(".fig-grande"))); dopo((a + 3 * sec) * 1000, () => salta(q1(".fig-grande")));
  },
  fase(f, anim) {
    // la minima col punto vale 3 fin dall'inizio: il punto e il suo pezzo di barra si vedono sempre
    fermaTutto(); mostraPunti(1, anim && f === 0); mostra(q1(".uguale"), true);
    cart(["Il punto dopo la nota", "+ la metà: 2 + 1", "Minima col punto = 3 movimenti"][f], anim);
    ascoltaNelTesto(this);
  }
});

/* ---------- 3. Tutte le figure col punto ---------- */
PASSI.push({
  cap: 1, breve: "Le figure col punto", titolo: "Tutte le figure col punto",
  punti: [
    "Il punto funziona con <b>tutte</b> le figure: si aggiunge sempre la <b>metà</b> del loro valore.",
    `La <b>semiminima col punto</b> vale <b>1 e ½</b>: un movimento e mezzo. ${ASCOLTA("semiminima")}`,
    "Prova tu: tocca una figura col punto e ascoltala."
  ],
  quaderno: "<p>Semibreve col punto <b>6</b> · minima col punto <b>3</b> · semiminima col punto <b>1½</b> · croma col punto <b>¾</b></p>",
  crea() {
    let s = "";
    ["w", "h", "q", "8"].forEach((f, i) => s += svgRigaValore(62 + i * 98, f, 1, { U: 70, xn: 150, xb: 470 }));
    svg(VB, s);
    qa(".riga-val").forEach(g => g.addEventListener("click", () => this.tocca(g)));
    strumenti([{ suggerimento: "Tocca una figura col punto" }]);
  },
  tocca(g) {
    qa(".riga-val").forEach(x => x.classList.toggle("scelta", x === g));
    ascoltaFigura(g, g.dataset.fig, 1, false);
    cart(`<b>${nomeFig(g.dataset.fig, 1)}</b> <span class="piccolo">· ${somma(g.dataset.fig, 1)}</span>`, false);
  },
  semiminima() { this.tocca(q1('.riga-val[data-fig="q"]')); },
  fase(f, anim) {
    fermaTutto(); qa(".pezzo.zero").forEach(p => p.classList.remove("zero"));
    qa(".riga-val").forEach(x => x.classList.toggle("scelta", f === 1 && x.dataset.fig === "q"));
    cart(["Con tutte le figure: + la metà", "Semiminima col punto = 1½", "Tocca una figura"][f], anim);
    if (f === 0 && anim) qa(".riga-val").forEach((g, i) => { const p = g.querySelectorAll(".pezzo"); p[1].classList.add("zero"); dopo(500 + i * 700, () => { p[1].classList.remove("zero"); salta(g.querySelector(".punto")); }); });
    ascoltaNelTesto(this);
  }
});

/* ---------- 4. Il punto sulle pause ---------- */
PASSI.push({
  cap: 1, breve: "Le pause col punto", titolo: "Il punto sulle pause",
  punti: [
    "Il punto si mette anche dopo una <b>pausa</b>: il <b>silenzio</b> dura la metà in più.",
    `Esempio in 4/4: una semiminima e una pausa di minima col punto: 1 + 3 = 4 movimenti. ${ASCOLTA("esempio", "▶ Ascolta e conta")}`
  ],
  quaderno: "<p>Pausa di minima col punto = <b>3</b> movimenti di silenzio; pausa di semiminima col punto = <b>1½</b>.</p>",
  crea() {
    let s = `<g class="scena-righe">`;
    ["h", "q"].forEach((f, i) => s += svgRigaValore(130 + i * 120, f, 1, { U: 90, pausa: true, xn: 150, xb: 540 }));
    s += `</g><g class="scena-battuta"></g>`;
    svg(VB, s);
    qa(".riga-val").forEach(g => g.addEventListener("click", () => ascoltaFigura(g, g.dataset.fig, 1, true)));
    strumenti([{ suggerimento: "Tocca una pausa: senti i colpi del silenzio" }]);
  },
  esempio() { if (this.B) ascoltaBattute(this.B); },
  fase(f, anim) {
    fermaTutto();
    q1(".scena-righe").style.display = f === 0 ? "" : "none";
    const g = q1(".scena-battuta"); g.innerHTML = "";
    if (f === 1) {
      const r = R(60, 940, 210, "violino");
      this.B = Battute(r, [{ fig: "q" }, { fig: "h", punti: 1, pausa: true }], { x0: 250, x1: 930, num: 4, barre: 280, conta: 360 });
      g.innerHTML = svgRigo(r) + svgBattute(this.B, { tempo: "4/4" }); vfRiempi();
    }
    cart(["Anche le pause col punto", "1 + 3 = 4 movimenti"][f], anim);
    ascoltaNelTesto(this);
  }
});

/* ---------- 5. Il doppio punto ---------- */
PASSI.push({
  cap: 1, breve: "Il doppio punto", titolo: "Il doppio punto",
  punti: [
    "Dopo una nota si possono scrivere anche <b>due punti</b>.",
    "Il <b>secondo punto</b> vale la <b>metà del primo</b>: minima col doppio punto = 2 + 1 + ½ = <b>3½</b>.",
    `Semiminima col doppio punto: 1 + ½ + ¼ = <b>1¾</b>. ${ASCOLTA("semiminima", "▶ Ascolta")}`
  ],
  quaderno: "<p>Ulteriori punti aggiunti al primo valgono la <b>metà</b> dei punti che li precedono.</p>",
  crea() { this.fig = "h"; svg(VB, palcoPunto("h", 2, 120)); strumenti([{ suggerimento: "Ogni punto vale la metà di quello prima" }]); },
  semiminima() {
    fermaTutto(); svg(VB, palcoPunto("q", 2, 200)); mostraPunti(2); mostra(q1(".uguale"));
    const sec = 60 / 72, a = 0.3; [0, 1].forEach(b => colpoMetro(b === 0, a + b * sec)); suonaTenuto(MI, a, 1.75 * sec);
    const ri = q1(".barra.grande .riempi"); dopo(a * 1000, () => { salta(q1(".fig-grande")); ri.style.transition = `transform ${1.75 * sec}s linear`; ri.style.transform = "scaleX(1)"; });
    cart("Semiminima col doppio punto: <b>1¾</b>", false);
  },
  fase(f, anim) {
    fermaTutto(); svg(VB, palcoPunto(f === 2 ? "q" : "h", 2, f === 2 ? 200 : 120));
    // si vede subito il valore giusto (minima col doppio punto = 3½); i punti saltano uno dopo l'altro
    mostraPunti(2); mostra(q1(".uguale"));
    if (anim) qa(".punto-big").forEach((p, i) => dopo(300 + i * 700, () => salta(p)));
    cart(["Due punti", "Il secondo punto: metà del primo", "Semiminima col doppio punto = 1¾"][f], anim);
    ascoltaNelTesto(this);
  }
});

/* ---------- 6. Calcola tu ---------- */
PASSI.push({
  cap: 2, breve: "Calcola tu", titolo: "Calcola tu",
  punti: ["Scegli una figura e quanti punti: guarda quanto dura e ascoltala."],
  quaderno: "",
  crea() {
    this.fig = this.fig || "q"; this.np = this.np === undefined ? 1 : this.np;
    strumenti([
      { gruppo: ["w", "h", "q", "8", "16"].map(f => ({ t: NOME_FIG[f], cls: f === this.fig ? "on" : "", fn: el => { segna("gFig", el); this.fig = f; this.disegna(); } })), id: "gFig" },
      { gruppo: [0, 1, 2].map(p => ({ t: ["senza punto", "1 punto", "2 punti"][p], cls: p === this.np ? "on" : "", fn: el => { segna("gPunti", el); this.np = p; this.disegna(); } })), id: "gPunti" },
      { t: "▶ Ascolta", cls: "forte", fn: () => this.ascolta() }
    ]);
    this.disegna();
  },
  disegna() {
    const tot = valore(this.fig, 2), U = Math.min(200, 470 / tot);
    svg(VB, palcoPunto(this.fig, this.np, U)); mostraPunti(this.np); mostra(q1(".uguale"), true);
    if (!this.np) q1(".uguale").textContent = num(valore(this.fig, 0)) + (valore(this.fig, 0) === 1 ? " movimento" : " movimenti");
    cart(`<b>${nomeFig(this.fig, this.np)}</b> <span class="piccolo">· ${num(valore(this.fig, this.np))} ${valore(this.fig, this.np) === 1 ? "movimento" : "movimenti"}</span>`, false);
  },
  ascolta() {
    fermaTutto(); const sec = 60 / 72, a = 0.3, d = valore(this.fig, this.np);
    for (let b = 0; b < Math.max(1, Math.ceil(d - 1e-9)); b++) colpoMetro(b === 0, a + b * sec);
    suonaTenuto(MI, a, d * sec);
    const ri = q1(".barra.grande .riempi"); ri.style.transition = "none"; ri.style.transform = "scaleX(0)"; void ri.getBoundingClientRect();
    dopo(a * 1000, () => { salta(q1(".fig-grande")); ri.style.transition = `transform ${d * sec}s linear`; ri.style.transform = "scaleX(1)"; });
    dopo((a + d * sec + 0.6) * 1000, () => { ri.style.transition = "transform .4s"; ri.style.transform = "scaleX(0)"; });
  },
  fase(f, anim) { fermaTutto(); }
});

/* ---------- 7. Esempi in battuta ---------- */
const ESEMPI_PUNTO = [
  { num: 3, ev: [{ fig: "h", punti: 1 }], testo: "3/4: una <b>minima col punto</b> riempie tutta la battuta." },
  { num: 4, ev: [{ fig: "q", punti: 1 }, { fig: "8" }, { fig: "h" }], testo: "4/4: <b>semiminima col punto</b> e croma fanno 2 movimenti, poi una minima." },
  { num: 2, ev: [{ fig: "8", punti: 1, trave: 1 }, { fig: "16" }, { fig: "q" }], testo: "2/4: <b>croma col punto</b> e semicroma fanno 1 movimento, poi una semiminima." },
  { num: 4, ev: [{ fig: "q" }, { fig: "h", punti: 1, pausa: true }, { fig: "h", punti: 1 }, { fig: "q" }], testo: "4/4 in due battute: semiminima e <b>pausa di minima col punto</b>, poi <b>minima col punto</b> e semiminima." }
];
PASSI.push({
  cap: 2, breve: "Esempi in battuta", titolo: "Esempi in battuta",
  punti: ESEMPI_PUNTO.map(e => e.testo + " " + ASCOLTA("ascolta", "▶ Ascolta e conta")),
  quaderno: "<p>Copia le battute sul quaderno pentagrammato e scrivi sotto ogni nota quanti movimenti dura.</p>",
  crea() { svg(VB, `<g class="scena"></g>`); strumenti([{ t: "▶ Ascolta e conta", cls: "forte", fn: () => this.ascolta() }, { suggerimento: "Battete il tempo con la mano" }]); },
  ascolta() { if (this.B) ascoltaBattute(this.B); },
  fase(f, anim) {
    fermaTutto(); const E = ESEMPI_PUNTO[f], r = R(60, 940, 200, "violino");
    this.B = Battute(r, E.ev, { x0: 250, x1: 930, num: E.num, barre: 270, conta: 350 });
    q1(".scena").innerHTML = svgRigo(r) + svgBattute(this.B, { tempo: E.num + "/4" }); vfRiempi();
    cart(`<b>${E.num}/4</b> <span class="piccolo">· esempio ${f + 1} di ${ESEMPI_PUNTO.length}</span>`, anim);
    ascoltaNelTesto(this);
  }
});

/* ---------- 8. Ripasso ---------- */
const DEF_PUNTO = [
  [1, "Punto di valore", "un punto posto dopo una nota (o una pausa) aumenta il valore della nota di metà del valore della nota stessa."],
  [4, "Doppio punto", "ulteriori punti aggiunti al primo valgono la metà dei punti che li precedono."],
  [2, "Figure col punto", "semibreve 4 + 2 = 6 · minima 2 + 1 = 3 · semiminima 1 + ½ = 1½ · croma ½ + ¼ = ¾."],
  [3, "Pause col punto", "valgono come le note: pausa di minima col punto = 3 movimenti di silenzio."],
  [0, "Figure", "semibreve 4 · minima 2 · semiminima 1 · croma ½ · semicroma ¼."]
];
PASSI.push({
  cap: 3, breve: "Sul quaderno", titolo: "Ricapitoliamo", soloTesto: true,
  punti: ["Le definizioni da copiare sul quaderno. Tocca una scheda per tornare al passo."],
  crea() {
    const box = document.createElement("div"); box.className = "ripasso ripasso-grande";
    DEF_PUNTO.forEach(([p, t, d]) => {
      const b = document.createElement("button"); b.className = "def"; b.style.setProperty("--colore", CAPITOLI[PASSI[p].cap].colore);
      b.innerHTML = `<span class="vai">${p + 1} →</span><b>${t}</b>: ${d}`; b.addEventListener("click", () => vai(p, PASSI[p].punti.length - 1)); box.appendChild(b);
    });
    PALCO.innerHTML = ""; PALCO.appendChild(box);
    STRUM.innerHTML = `<div class="allenati"><span>Ora allenati:</span>
      <a class="btn" href="figure-ritmiche.html">♩ Figure ritmiche</a><a class="btn" href="lettura-ritmica.html">👏 Lettura ritmica</a>
      <a class="btn" href="imita-il-ritmo.html">🥁 Imita il ritmo</a><a class="btn" href="legatura-di-valore.html">⌣ La legatura di valore</a></div>`;
  },
  fase() { cart("📒 Da copiare sul quaderno", false); }
});
