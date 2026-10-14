/* ================= ritmo: figure, valori, battute, ascolto ================= */
const BASE_VAL = { w: 4, h: 2, q: 1, "8": 0.5, "16": 0.25 };
const NOME_FIG = { w: "semibreve", h: "minima", q: "semiminima", "8": "croma", "16": "semicroma" };
const NOME_PAUSA = { w: "pausa di semibreve", h: "pausa di minima", q: "pausa di semiminima", "8": "pausa di croma", "16": "pausa di semicroma" };
const valore = (fig, punti = 0) => BASE_VAL[fig] * [1, 1.5, 1.75][punti];
/* numeri con le frazioni: 1.5 → «1½», 0.75 → «¾» */
function num(v) {
  const i = Math.floor(v + 1e-9), r = Math.round((v - i) * 16);
  const F = { 0: "", 2: "⅛", 4: "¼", 6: "⅜", 8: "½", 10: "⅝", 12: "¾", 14: "⅞" };
  const f = F[r] !== undefined ? F[r] : `<span class="fraz">${r}/16</span>`;
  return (i ? i : (f ? "" : "0")) + f;
}
/* «2 + 1 + ½ = 3½» */
function somma(fig, punti) {
  const parti = [BASE_VAL[fig]]; for (let k = 1; k <= punti; k++) parti.push(parti[k - 1] / 2);
  return parti.map(num).join(" + ") + (punti ? " = " + num(valore(fig, punti)) : "");
}
function nomeFig(fig, punti = 0, pausa = false) {
  return (pausa ? NOME_PAUSA[fig] : NOME_FIG[fig]) + (punti === 1 ? " col punto" : punti === 2 ? " col doppio punto" : "");
}

/* una figura da sola (nota o pausa), disegnata da VexFlow; x, y = centro della testa (o riga centrale per le pause) */
function svgFig(x, y, fig, punti = 0, o = {}) {
  return vfFigura({ x, y, fig, punti, pausa: o.pausa, k: o.k || K, cls: o.cls, p: 4, gambo: 1, puntoCls: o.puntoCls });
}

/* ---------- suono: il pianoforte di «Leggi la nota» (fondamentale + armoniche che si smorzano, filtro che si scurisce).
   La nota dura quanto la figura: alla fine si «chiude» come quando si alza il dito dal tasto. ---------- */
let VOCI = [];
const MI = 64;                                    // il MI della 1ª riga (ottava del do centrale): la nota delle lezioni sul ritmo
function suonaTenuto(midi, quando, dur) {
  const ac = audio(); if (!ac) return;
  const t = ac.currentTime + 0.03 + quando, f = 440 * Math.pow(2, (midi - 69) / 12), fine = t + Math.max(0.15, dur - 0.05);
  const lungo = Math.max(1.9, dur * 1.15);
  const fl = ac.createBiquadFilter(); fl.type = "lowpass"; fl.Q.value = 0.6;
  fl.frequency.setValueAtTime(6500, t); fl.frequency.exponentialRampToValueAtTime(800, t + lungo);
  const chiudi = ac.createGain(); chiudi.gain.setValueAtTime(1, t); chiudi.gain.setTargetAtTime(0.0001, fine, 0.04);
  fl.connect(chiudi); chiudi.connect(master);
  const os = [[1, 0.5, 1], [2, 0.24, 0.8], [3, 0.14, 0.6], [4, 0.08, 0.45], [6, 0.04, 0.3]].map(([m, v, d]) => {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = "sine"; o.frequency.value = f * m;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + lungo * d);
    o.connect(g); g.connect(fl); o.start(t); o.stop(Math.min(t + lungo * d, fine + 0.3) + 0.05); return o;
  });
  VOCI.push({ g: chiudi, os }); riposo(quando + dur + 0.4);
}
/* il metronomo: un «tic» morbido di legno, un po' più acuto sul primo movimento */
function colpoMetro(forte, quando) {
  const ac = audio(); if (!ac) return;
  const t = ac.currentTime + 0.03 + quando, o = ac.createOscillator(), g = ac.createGain(), fl = ac.createBiquadFilter();
  o.type = "sine"; o.frequency.setValueAtTime(forte ? 1500 : 1150, t); o.frequency.exponentialRampToValueAtTime(forte ? 900 : 700, t + 0.04);
  fl.type = "bandpass"; fl.frequency.value = forte ? 1300 : 1000; fl.Q.value = 1.2;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(forte ? 0.22 : 0.13, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.connect(fl); fl.connect(g); g.connect(master); o.start(t); o.stop(t + 0.08); VOCI.push({ g, os: [o] }); riposo(quando + 0.2);
}
function zittisci() {
  if (AC) VOCI.forEach(v => { try { v.g.gain.cancelScheduledValues(AC.currentTime); v.g.gain.setTargetAtTime(0.0001, AC.currentTime, 0.02); v.os.forEach(o => o.stop(AC.currentTime + 0.08)); } catch (e) { } });
  VOCI = [];
}

/* ---------- «salto» a tempo (al posto delle luci: più sicuro per gli occhi) ---------- */
function salta(el) { if (!el) return; el.classList.remove("pop"); void el.getBoundingClientRect(); el.classList.add("pop"); }

/* ---------- battute: note su una riga del pentagramma, a distanza proporzionale alla durata ----------
   eventi: [{ fig, punti, pausa, lega (legata alla successiva), p (posizione, di base 2 = sol), trave (unita con la successiva) }]
   o: { x0, x1, num (movimenti per battuta), barre (y), conta (y) } */
function Battute(r, eventi, o) {
  const B = { r, ev: [], o };
  let t = 0; eventi.forEach(e => { const d = valore(e.fig, e.punti || 0); B.ev.push({ ...e, p: e.p === undefined ? 0 : e.p, t, d }); t += d; });   // di base il MI (1ª riga)
  B.tot = t; B.nb = Math.ceil(t / o.num - 1e-9);
  B.mw = (o.x1 - o.x0) / B.nb; B.padL = Math.min(46, B.mw * 0.16); B.padR = Math.min(26, B.mw * 0.08);
  B.x = tt => { const m = Math.min(B.nb - 1, Math.floor(tt / o.num + 1e-9)), dt = tt - m * o.num; return o.x0 + m * B.mw + B.padL + dt * (B.mw - B.padL - B.padR) / o.num; };
  B.u = (B.mw - B.padL - B.padR) / o.num;         // larghezza di un movimento
  return B;
}
function svgBattute(B, opz = {}) {
  const { r, ev, o } = B; let s = `<g class="battute">`;
  for (let m = 1; m <= B.nb; m++) {
    const x = o.x0 + m * B.mw;
    if (m < B.nb) s += `<line class="stanghetta" x1="${x}" x2="${x}" y1="${r.y(8)}" y2="${r.yb}"/>`;
    else if (!o.senzaFine) s += `<line class="stanghetta" x1="${x - 12}" x2="${x - 12}" y1="${r.y(8)}" y2="${r.yb}"/><line class="stanghetta grossa" x1="${x - 1}" x2="${x - 1}" y1="${r.y(8) + 1}" y2="${r.yb - 1}"/>`;
    else s += `<line class="stanghetta" x1="${x}" x2="${x}" y1="${r.y(8)}" y2="${r.yb}"/>`;
  }
  ev.forEach(e => e.xn = B.x(e.t) + 18);
  // chiave e indicazione di tempo (se richieste) + note: tutto VexFlow, sopra le nostre righe
  s += vfRigo({ x0: opz.rx0 !== undefined ? opz.rx0 : r.x0, x1: r.x1, yb: r.yb, chiave: opz.chiave === false ? null : "violino", tempo: opz.tempo || null,
    ev: ev.map(e => ({ fig: e.fig, punti: e.punti, pausa: e.pausa, p: e.p, lega: e.lega, trave: e.trave, acc: e.acc, puntoCls: "punto-ev" })), xs: ev.map(e => e.xn), i0: opz.i0 || 0, cls: opz.cls });
  // barre della durata e numeri del conteggio
  if (o.barre) ev.forEach((e, i) => {
    const xa = B.x(e.t), xb = B.x(e.t + e.d) - 5, base = valore(e.fig, 0);
    let parti = [base]; for (let k = 1; k <= (e.punti || 0); k++) parti.push(parti[k - 1] / 2);
    let tt = e.t;
    s += `<g class="barra${e.pausa ? " silenzio" : ""}" data-i="${(opz.i0 || 0) + i}">`;
    parti.forEach((v, k) => { const a = B.x(tt), b = Math.min(B.x(tt + v) - (k === parti.length - 1 ? 5 : 1), xb);
      s += `<rect class="pezzo pz${k}" x="${a}" y="${o.barre}" width="${Math.max(4, b - a)}" height="26" rx="6"/>`; tt += v; });
    s += `<rect class="riempi" x="${xa}" y="${o.barre}" width="${Math.max(4, xb - xa)}" height="26" rx="6"/>`;
    if (opz.valori !== false) s += `<text class="val-barra" x="${(xa + xb) / 2}" y="${o.barre + 19}">${num(e.d)}</text>`;
    s += `</g>`;
  });
  if (o.conta) for (let b = 0; b < B.nb * o.num; b++) s += `<text class="conta-n" data-b="${b}" x="${B.x(b) + 18}" y="${o.conta}">${(b % o.num) + 1}</text>`;
  return s + `</g>`;
}
function svgLegatura(xa, xb, y, cls = "") {
  const h = Math.min(30, 10 + (xb - xa) * 0.12);
  return `<path class="legatura ${cls}" d="M${xa} ${y} Q${(xa + xb) / 2} ${y + h * 2} ${xb} ${y}"/>`;
}
/* ascolta una fila di battute: metronomo, suoni tenuti (le legature non si ribattono), note che saltano, barre che si riempiono */
function ascoltaBattute(B, bpm = 72, fine) {
  fermaTutto();
  const sec = 60 / bpm, att = 0.35;
  qa(".barra .riempi").forEach(x => { x.style.transition = "none"; x.style.transform = "scaleX(0)"; });
  void PALCO.getBoundingClientRect();
  for (let b = 0; b < B.nb * B.o.num; b++) {
    colpoMetro(b % B.o.num === 0, att + b * sec);
    dopo((att + b * sec) * 1000, () => salta(q1(`.conta-n[data-b="${b}"]`)));
  }
  let i = 0;
  while (i < B.ev.length) {
    const e = B.ev[i]; let d = e.d, j = i;
    while (B.ev[j].lega && B.ev[j + 1]) { j++; d += B.ev[j].d; }
    if (!e.pausa) suonaTenuto(nota("violino", e.p).midi, att + e.t * sec, d * sec);
    for (let k = i; k <= j; k++) {
      const ek = B.ev[k], kk = k;
      dopo((att + ek.t * sec) * 1000, () => {
        if (kk === i) salta(q1(`.ev[data-i="${kk}"]`));
        const ri = q1(`.barra[data-i="${kk}"] .riempi`);
        if (ri) { ri.style.transition = `transform ${ek.d * sec}s linear`; ri.style.transform = "scaleX(1)"; }
      });
    }
    i = j + 1;
  }
  dopo((att + B.tot * sec + 0.4) * 1000, () => { qa(".barra .riempi").forEach(x => { x.style.transition = "transform .4s"; x.style.transform = "scaleX(0)"; }); if (fine) fine(); });
}

/* righe della «scala dei valori»: figura, nome, barra lunga quanto dura */
function svgRigaValore(y, fig, punti, o = {}) {
  const U = o.U || 100, X = o.xb || 420, k = o.k || 1.9;
  let s = `<g class="riga-val ${o.cls || ""}" data-fig="${fig}" data-punti="${punti}"${o.pausa ? ' data-pausa="1"' : ""}>`;
  s += `<rect class="colpo" x="20" y="${y - 36}" width="960" height="72"/>`;
  s += svgFig(o.xf || 95, o.pausa ? y - 6 : y + 8, fig, punti, { k, gambo: 2.6, pausa: o.pausa, cls: "fig-riga" });
  s += `<text class="nome-fig" x="${o.xn || 160}" y="${y + 16}">${nomeFig(fig, punti, o.pausa)}</text>`;
  let parti = [BASE_VAL[fig]]; for (let i = 1; i <= punti; i++) parti.push(parti[i - 1] / 2);
  let x = X;
  s += `<g class="barra${o.pausa ? " silenzio" : ""}">`;
  parti.forEach((v, i) => { s += `<rect class="pezzo pz${i} cresce" x="${x}" y="${y - 8}" width="${Math.max(4, v * U - 4)}" height="30" rx="7"/>`; x += v * U; });
  s += `<rect class="riempi" x="${X}" y="${y - 8}" width="${Math.max(4, x - X - 4)}" height="30" rx="7"/></g>`;
  s += `<text class="val-riga" x="${x + 10}" y="${y + 16}">${num(valore(fig, punti))}</text>`;
  return s + `</g>`;
}
/* fa sentire una figura: suono lungo quanto vale, colpi a ogni movimento, barra che si riempie */
function ascoltaFigura(g, fig, punti, pausa, bpm = 72) {
  fermaTutto();
  const sec = 60 / bpm, d = valore(fig, punti), att = 0.3;
  const ri = g.querySelector(".riempi"); ri.style.transition = "none"; ri.style.transform = "scaleX(0)"; void ri.getBoundingClientRect();
  for (let b = 0; b < Math.max(1, Math.ceil(d - 1e-9)); b++) colpoMetro(b === 0, att + b * sec);
  if (!pausa) suonaTenuto(MI, att, d * sec);
  dopo(att * 1000, () => { salta(g.querySelector(".fig-riga")); ri.style.transition = `transform ${d * sec}s linear`; ri.style.transform = "scaleX(1)"; });
  dopo((att + d * sec + 0.6) * 1000, () => { ri.style.transition = "transform .4s"; ri.style.transform = "scaleX(0)"; });
  cart(`<b>${nomeFig(fig, punti, pausa)}</b> <span class="piccolo">· ${punti ? somma(fig, punti) : num(d)} ${d === 1 ? "movimento" : "movimenti"}</span>`);
}
/* pulsante «▶ Ascolta» dentro il testo: il suono parte solo quando lo si preme */
function ascoltaNelTesto(passo) {
  document.querySelectorAll("#punti .ascolta-in").forEach(b => b.onclick = e => { e.stopPropagation(); passo[b.dataset.az](b.dataset.arg); });
}
const ASCOLTA = (az, testo = "▶ Ascolta", arg = "") => `<button class="ascolta-in" data-az="${az}" data-arg="${arg}">${testo}</button>`;
