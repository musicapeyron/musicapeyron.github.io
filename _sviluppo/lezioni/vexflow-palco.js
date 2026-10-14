/* ================= VexFlow nel palco =================
   La musica scritta (chiavi, tempo, note, pause, punti, travature, legature, alterazioni, tagli) la disegna VexFlow.
   Le righe del pentagramma restano nostre (svgRigo), così si possono illuminare e toccare come prima:
   VexFlow disegna un pentagramma con le righe invisibili, esattamente sopra le nostre.
   Uso: nel markup del palco si mette vfRigo({...}) o vfFigura({...}); dopo svg() (o dopo un innerHTML)
   vfRiempi() li disegna davvero. Ogni nota diventa un gruppo <g class="ev nota c-sol" data-i="0">,
   i punti di valore hanno la classe .punto (con data-i = 0, 1). */
const VF = Vex.Flow;
const VFSPEC = {};
let VFN = 0;
const LETTERA = { do: "c", re: "d", mi: "e", fa: "f", sol: "g", la: "a", si: "b" };
/* chiave VexFlow di una posizione (0 = 1ª riga) in chiave di violino o di basso */
function vfKey(p, chiave = "violino") { const n = nota(chiave, p); return LETTERA[n.nome] + "/" + Math.floor(n.d / 7); }

function vfRigo(spec) { const id = "vf" + (++VFN); VFSPEC[id] = Object.assign({ tipo: "rigo" }, spec); return `<g class="vf-slot" id="${id}"></g>`; }
function vfFigura(spec) { const id = "vf" + (++VFN); VFSPEC[id] = Object.assign({ tipo: "fig" }, spec); return `<g class="vf-slot" id="${id}"></g>`; }
function vfRiempi(radice = PALCO) {
  radice.querySelectorAll(".vf-slot:not([data-fatto])").forEach(g => { g.dataset.fatto = 1; vfDisegna(g, VFSPEC[g.id]); });
}

/* una nota VexFlow da un evento { fig, punti, pausa, p, acc } */
function vfNota(e, chiave) {
  const pausa = !!e.pausa;
  const key = pausa ? (e.fig === "w" ? "d/5" : "b/4") : vfKey(e.p === undefined ? 2 : e.p, chiave);
  const opz = { keys: [key], duration: e.fig + (pausa ? "r" : ""), clef: chiave === "basso" ? "bass" : "treble" };
  if (!pausa) { opz.auto_stem = false; opz.stem_direction = (e.p === undefined ? 2 : e.p) >= 4 ? -1 : 1; }
  if (e.gambo) opz.stem_direction = e.gambo;
  const n = new VF.StaveNote(opz);
  if (e.acc) n.addModifier(new VF.Accidental(e.acc), 0);
  for (let i = 0; i < (e.punti || 0); i++) VF.Dot.buildAndAttach([n], { all: true });
  return n;
}
function centroNota(n) { return (n.getNoteHeadBeginX() + n.getNoteHeadEndX()) / 2; }

function vfDisegna(g, spec) {
  const k = spec.k || K;
  const div = document.createElement("div"); div.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden";
  document.body.appendChild(div);
  const ren = new VF.Renderer(div, VF.Renderer.Backends.SVG); ren.resize(2000, 400);
  const ctx = ren.getContext();
  const larg = spec.tipo === "fig" ? 120 : (spec.x1 - spec.x0) / k;
  const st = new VF.Stave(0, 0, larg, { space_above_staff_ln: 4 });
  st.setConfigForLines([0, 1, 2, 3, 4].map(() => ({ visible: false })));
  st.setBegBarType(VF.Barline.type.NONE); st.setEndBarType(VF.Barline.type.NONE);
  const chiave = spec.chiave === undefined ? (spec.tipo === "fig" ? null : "violino") : spec.chiave;
  if (chiave) st.addClef(chiave === "basso" ? "bass" : "treble");
  if (spec.tempo) st.addTimeSignature(spec.tempo);
  st.setContext(ctx).draw();
  const eventi = spec.tipo === "fig" ? [Object.assign({ p: spec.pausa ? undefined : 2 }, spec, { cls: "" })] : (spec.ev || []);
  const note = eventi.map(e => vfNota(e, chiave || "violino"));
  const out = { note: [] };
  if (note.length) {
    const travi = [];
    eventi.forEach((e, i) => { if (e.trave && note[i + 1] && (i === 0 || !eventi[i - 1].trave)) { let j = i; while (eventi[j].trave && note[j + 1]) j++; travi.push(new VF.Beam(note.slice(i, j + 1))); } });
    const voce = new VF.Voice({ num_beats: 4, beat_value: 4 }).setMode(VF.Voice.Mode.SOFT); voce.addTickables(note);
    new VF.Formatter().joinVoices([voce]).format([voce], Math.max(40, larg - st.getNoteStartX() - 20));
    note.forEach(n => n.setStave(st));
    // posizioni volute (in coordinate del palco): ogni nota si sposta perché il centro della testa cada lì
    const tx = spec.tipo === "fig" ? 0 : spec.x0;
    if (spec.xs) note.forEach((n, i) => { if (spec.xs[i] === undefined) return; const voluto = (spec.xs[i] - tx) / k, tc = n.getTickContext(); tc.setX(tc.getX() + voluto - centroNota(n)); });
    voce.draw(ctx, st);
    travi.forEach(b => b.setContext(ctx).draw());
    eventi.forEach((e, i) => { if (e.lega && note[i + 1]) new VF.StaveTie({ first_note: note[i], last_note: note[i + 1], first_indices: [0], last_indices: [0] }).setContext(ctx).draw(); });
    (spec.curve || []).forEach(([a, b]) => new VF.Curve(note[a], note[b], { position: VF.Curve.Position.NEAR_HEAD, position_end: VF.Curve.Position.NEAR_HEAD, cps: [{ x: 0, y: 14 }, { x: 0, y: 14 }] }).setContext(ctx).draw());
    note.forEach((n, i) => out.note.push({ x: centroNota(n), id: n.getAttribute("id") }));
  }
  // si sposta il disegno nel palco
  const svgVF = div.querySelector("svg");
  let tx, ty;
  if (spec.tipo === "fig") {
    const yRif = spec.pausa ? 60 : 60;          // riga centrale del pentagramma invisibile
    tx = spec.x - k * out.note[0].x; ty = spec.y - k * yRif;
  } else { tx = spec.x0; ty = spec.yb - 80 * k; }
  // il gruppo esterno porta posizione e grandezza; quello interno (.vfr) si può far «saltare» senza spostare niente
  const fuori = document.createElementNS("http://www.w3.org/2000/svg", "g");
  fuori.setAttribute("transform", `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k})`);
  const dentro = document.createElementNS("http://www.w3.org/2000/svg", "g");
  dentro.setAttribute("class", "vfr" + (spec.cls ? " " + spec.cls : ""));
  while (svgVF.firstChild) dentro.appendChild(svgVF.firstChild);
  fuori.appendChild(dentro); g.appendChild(fuori); div.remove();
  // classi nostre: chiave, tempo, note (con il colore del nome), punti
  const ch = dentro.querySelector(".vf-clef"); if (ch) ch.classList.add("chiave-vf");
  const tm = dentro.querySelector(".vf-timesignature"); if (tm) { tm.classList.add("tempo-vf"); const p = tm.querySelectorAll("path"); if (p[0]) p[0].classList.add("cifra-su"); if (p[1]) p[1].classList.add("cifra-giu"); }
  out.note.forEach((o, i) => {
    const e = eventi[i], el = dentro.querySelector("#vf-" + o.id); if (!el) return;
    el.classList.add("ev"); el.dataset.i = (spec.i0 || 0) + i;
    if (!e.pausa && spec.tipo !== "fig") { const nm = nota(chiave || "violino", e.p === undefined ? 2 : e.p).nome; el.classList.add("nota", "c-" + nm); el.dataset.p = e.p === undefined ? 2 : e.p; }
    else el.classList.add("pausa");
    if (e.cls) e.cls.split(" ").forEach(c => c && el.classList.add(c));
    // i punti di valore: i tracciati piccoli e tondi dopo la testa
    const testa = el.querySelector(".vf-notehead") || el;
    [...testa.querySelectorAll("path")].filter(pa => { const b = pa.getBBox(); return b.width < 6 && b.height < 6; })
      .forEach((pa, j) => { pa.classList.add("punto"); pa.dataset.i = j; if (e.puntoCls) e.puntoCls.split(" ").forEach(c => pa.classList.add(c)); });
    o.x = tx + k * o.x;
  });
  spec.out = out;
  g.dispatchEvent(new CustomEvent("vf-pronto", { detail: out }));
}
