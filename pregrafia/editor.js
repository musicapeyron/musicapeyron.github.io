/* =========================================================
   pregrafia/editor.js — l'editor delle linee (editor-linee.html).
   Si disegna con il mouse mentre il brano suona; ogni punto ricorda il suo tempo.
   Tutto resta nel browser: niente invii, niente microfono. Il progetto si salva da solo
   in questo browser (senza il brano) e si può scaricare come file .json.
   ========================================================= */
(function () {
  "use strict";
  const L = window.LettoreLinee, $ = id => document.getElementById(id);
  const CHIAVE = "editorLinee.progetto.v1";
  const MARGINE = 0.06;
  const SPESSORI = [0.55, 1, 1.5, 2.2];
  const ESEMPI = [
    { nome: "Beethoven · Quinta sinfonia (inizio)", file: "media/pregrafia/beethoven5.mp3", chiave: "beethoven5",
      crediti: "Beethoven, Sinfonia n. 5, I movimento — Fulda Symphonic Orchestra, dir. Simon Schindler — EFF Open Audio License" }
  ];
  const tri = f => 2 / Math.PI * Math.asin(Math.sin(2 * Math.PI * f));
  const fraz = f => f - Math.floor(f);
  /* forme a tempo: φ = battiti dall'inizio della pagina × figure per battito; restituiscono [dx, dy] in unità di "grandezza" */
  const FORME = {
    onda:     { nome: "Onda",     f: φ => [0, -Math.sin(2 * Math.PI * φ)] },
    zigzag:   { nome: "Zig-zag",  f: φ => [0, -tri(φ)] },
    archi:    { nome: "Archi",    f: φ => [0, 1 - 2 * Math.abs(Math.sin(Math.PI * φ))] },
    valli:    { nome: "Valli",    f: φ => [0, 2 * Math.abs(Math.sin(Math.PI * φ)) - 1] },
    riccioli: { nome: "Riccioli", f: φ => [0.9 * Math.sin(2 * Math.PI * φ), Math.cos(2 * Math.PI * φ)] },
    greca:    { nome: "Greca",    f: φ => [0, -Math.max(-1, Math.min(1, 3 * Math.sin(2 * Math.PI * φ)))] },
    denti:    { nome: "Denti",    f: φ => { const s = fraz(φ), v = s < 0.85 ? s / 0.85 : (1 - s) / 0.15; return [0, 1 - 2 * v]; } }
  };
  const MODI = {
    libero:    ["Disegno libero", "<b>Premi play</b> (o comincia a disegnare) e traccia le linee tenendo premuto il mouse mentre la musica suona. Ogni punto si ricorda il suo momento."],
    guidato:   ["Guidato", "La penna va da sola da sinistra a destra col tempo: tu muovi solo <b>su e giù</b> tenendo premuto. Alza il mouse per lasciare un vuoto. Le pagine cambiano da sole."],
    forme:     ["Forme a tempo", "Scegli una forma: la penna la disegna da sola, precisa sui battiti. Tu decidi <b>l'altezza</b> con il mouse e quando cominciare e smettere."],
    tempo:     ["Disegna, poi dai il tempo", "A musica <b>ferma</b> disegna con calma. Poi premi play e, per ogni linea, tieni premuto il mouse (o <b>T</b>) mentre deve colorarsi. Se ripassi la linea con il mouse, segue anche la tua velocità."],
    seleziona: ["Sposta e modifica", "Clicca una linea per sceglierla e trascinala. <b>Rotellina</b>: più grande o più piccola. <b>Frecce</b>: sposta di poco. Colore e spessore valgono per la linea scelta."],
    gomma:     ["Gomma", "Clicca o passa sopra le linee da cancellare. Hai sbagliato? <b>Ctrl+Z</b>."]
  };

  /* ---------------- stato ---------------- */
  function nuovo() {
    return { formato: "musicascuole-linee", versione: 1, titolo: "", autore: "", crediti: "", audio: null,
      battiti: null, bpm: null, offset: 0, anticipo: 0.8, pagine: [{ tratti: [] }],
      impostazioni: { durataPagina: 8, unita: "battiti", pagineAuto: true } };
  }
  let prog = nuovo();
  let brano = null;        // { nome, tipo, bytes, src, url?, esempio? }
  let analisi = null;      // { durata, picchi, perSec, pronto: Promise<{env,hopT,t0,attacchi}> }
  const ui = { modo: "libero", forma: "onda", cicli: 1, ampiezza: 0.12, colore: L.PALETTE[0], spessore: 1, pagina: 0, sel: null,
    fantasma: true, tuttoColorato: true, metronomo: false, calamita: false, ritardo: 0.12, zoom: 1, vista: 0, giro: null, mouse: [0.5, 0.5], sopra: false };
  let storico = [], futuro = [];
  let disegno = null, assegna = null, batti = null, trascinaSel = null, gommaAttiva = null;
  let virtuale = null, ultimaAuto = -1, ultimoT = 0, presentando = false, video = null;
  let sporcoOnda = true, rafId = 0;

  const media = document.createElement("video");
  media.preload = "auto"; media.playsInline = true;
  media.preservesPitch = true; media.mozPreservesPitch = true; media.webkitPreservesPitch = true;
  let ctxA = null, sorgente = null;

  const tela = $("tela"), tctx = tela.getContext("2d");
  const ondaB = $("ondaBase"), octx = ondaB.getContext("2d"), ondaS = $("ondaSopra"), sctx = ondaS.getContext("2d");
  const telaP = $("telaP"), pctx = telaP.getContext("2d");
  const G = { W: 0, H: 0, tW: 0, tH: 0, pW: 0, pH: 0 };

  const pagCorr = () => prog.pagine[ui.pagina] || prog.pagine[0];
  const limita = (v, a, b) => Math.max(a, Math.min(b, v));
  const r3 = v => Math.round(v * 1000) / 1000, r4 = v => Math.round(v * 10000) / 10000;

  /* ---------------- avvisi ---------------- */
  let avvisoTimer = 0;
  function avviso(testo, lungo) {
    const a = $("avviso"); a.textContent = testo; a.hidden = false; a.style.opacity = 1;
    clearTimeout(avvisoTimer); avvisoTimer = setTimeout(() => { a.style.opacity = 0; setTimeout(() => { a.hidden = true; }, 300); }, lungo ? 6000 : 2800);
  }

  /* ---------------- tempo e battiti ---------------- */
  function durata() {
    if (isFinite(media.duration) && media.duration > 0) return media.duration;
    if (analisi && analisi.durata) return analisi.durata;
    return Math.max(30, L.durata(prog) + 5);
  }
  const clk = { mt: 0, pt: 0, ultimo: 0 };
  function azzeraOrologio() { clk.mt = media.currentTime; clk.pt = performance.now(); clk.ultimo = media.currentTime; }
  function tempoOra() {
    if (media.paused) return media.currentTime || 0;
    const mt = media.currentTime, ora = performance.now();
    if (mt !== clk.mt) { clk.mt = mt; clk.pt = ora; }
    let t = clk.mt + Math.min(0.3, (ora - clk.pt) / 1000 * media.playbackRate);
    if (t < clk.ultimo && clk.ultimo - t < 0.25) t = clk.ultimo;
    clk.ultimo = t;
    return Math.min(t, durata());
  }
  const tempoMano = () => Math.max(0, tempoOra() - ui.ritardo * media.playbackRate);

  let cacheB = {};
  function listaBattiti() {
    const d = durata();
    if (cacheB.ref === prog.battiti && cacheB.bpm === prog.bpm && cacheB.off === prog.offset && cacheB.d === d) return cacheB.B;
    let B = null;
    if (prog.battiti && prog.battiti.length >= 2) B = prog.battiti;
    else if (prog.bpm > 0) {
      const passo = 60 / prog.bpm, off = prog.offset || 0; B = [];
      for (let t = off - Math.floor(off / passo) * passo; t <= d + passo; t += passo) B.push(r3(t));
    }
    cacheB = { ref: prog.battiti, bpm: prog.bpm, off: prog.offset, d, B };
    return B;
  }
  function posBattito(t) {
    const B = listaBattiti(); if (!B) return t;
    const n = B.length;
    if (t <= B[0]) return (t - B[0]) / (B[1] - B[0]);
    if (t >= B[n - 1]) return n - 1 + (t - B[n - 1]) / (B[n - 1] - B[n - 2]);
    let a = 0, b = n - 1;
    while (b - a > 1) { const m = (a + b) >> 1; if (B[m] <= t) a = m; else b = m; }
    return a + (t - B[a]) / (B[a + 1] - B[a]);
  }
  function tempoBattito(k) {
    const B = listaBattiti(); if (!B) return k;
    const n = B.length;
    if (k <= 0) return B[0] + k * (B[1] - B[0]);
    if (k >= n - 1) return B[n - 1] + (k - n + 1) * (B[n - 1] - B[n - 2]);
    const i = Math.floor(k); return B[i] + (k - i) * (B[i + 1] - B[i]);
  }
  function battitoVicino(t) { const B = listaBattiti(); if (!B) return t; return tempoBattito(Math.round(posBattito(t))); }

  /* ---------------- audio: contesto, metronomo ---------------- */
  function assicuraCtx() {
    if (!ctxA) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctxA = new C(); }
    return ctxA;
  }
  function aggiornaCtx() {
    const serve = (!media.paused && (ui.metronomo || sorgente)) || !!video;
    if (!ctxA) { if (!serve) return; assicuraCtx(); if (!ctxA) return; }
    if (serve && ctxA.state !== "running") ctxA.resume().catch(() => {});
    else if (!serve && ctxA.state === "running") ctxA.suspend().catch(() => {});
  }
  function clic(forte) {
    if (!ctxA || ctxA.state !== "running") return;
    const o = ctxA.createOscillator(), g = ctxA.createGain(), t = ctxA.currentTime;
    o.frequency.value = forte ? 1500 : 1000;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g).connect(ctxA.destination); o.start(t); o.stop(t + 0.06);
  }
  function tickMetronomo(t) {
    if (!ui.metronomo) { ultimoT = t; return; }
    const B = listaBattiti();
    if (B && t > ultimoT && t - ultimoT < 0.3) {
      const k = Math.floor(posBattito(t)), tk = tempoBattito(k);
      if (tk > ultimoT && tk <= t) clic(false);
    }
    ultimoT = t;
  }

  /* ---------------- riproduzione ---------------- */
  function play() {
    if (!brano) { avviso("Prima apri un brano (menu Brano)."); return; }
    if (media.ended || media.currentTime >= durata() - 0.05) media.currentTime = 0;
    azzeraOrologio();
    const p = media.play(); if (p && p.catch) p.catch(() => {});
  }
  function pausa() { if (!media.paused) media.pause(); }
  function playPausa() { media.paused ? play() : pausa(); }
  function vaiA(t, cambiaPagina) {
    if (!brano) return;
    t = limita(t, 0, durata());
    media.currentTime = t; azzeraOrologio(); clk.mt = t; clk.ultimo = t; ultimoT = t;
    ultimaAuto = L.paginaA(prog, t);
    if (cambiaPagina) { const i = paginaPerTempo(t); if (i >= 0) vai(i); }
    richiedi();
  }
  function paginaPerTempo(t) {
    if (ui.modo === "guidato" || ui.modo === "forme") { const g = paginaGuidata(t); if (g >= 0) return g; }
    const tp = prog.pagine.some(p => L.tempiPagina(p));
    return tp ? L.paginaA(prog, t) : -1;
  }
  media.addEventListener("play", () => { azzeraOrologio(); ultimoT = media.currentTime; ultimaAuto = L.paginaA(prog, media.currentTime); aggiornaCtx(); aggiornaPlay(); richiedi(); });
  media.addEventListener("pause", () => { aggiornaCtx(); aggiornaPlay(); fermaTutto(); richiedi(); });
  media.addEventListener("ended", () => { aggiornaCtx(); aggiornaPlay(); fermaTutto(); if (video) fineVideo(); richiedi(); });
  media.addEventListener("loadedmetadata", () => { sporcoOnda = true; aggiornaStato(); richiedi(); });
  media.addEventListener("seeked", () => { azzeraOrologio(); richiedi(); });
  media.addEventListener("error", () => { if (brano) avviso("Questo file non si riesce a riprodurre in questo browser.", true); });
  function fermaTutto() {
    if (disegno) finisciDisegno();
    if (assegna) finisciAssegna();
    if (batti) fineBatti();
    virtuale = null;
  }
  function aggiornaPlay() {
    const usa = media.paused ? "#i-play" : "#i-pausa";
    $("tPlay").querySelector("use").setAttribute("href", usa);
    $("pPlay").querySelector("use").setAttribute("href", usa);
  }

  /* ---------------- brano ---------------- */
  function tipoDaNome(n) {
    const e = (n.split(".").pop() || "").toLowerCase();
    return { mp3: "audio/mpeg", ogg: "audio/ogg", oga: "audio/ogg", wav: "audio/wav", m4a: "audio/mp4", mp4: "video/mp4", webm: "video/webm", flac: "audio/flac" }[e] || "audio/mpeg";
  }
  function impostaBrano(b) {
    pausa();
    if (brano && brano.src && brano.src.startsWith("blob:")) URL.revokeObjectURL(brano.src);
    const stesso = prog.audio && prog.audio.nome === b.nome;
    if (!stesso && (prog.battiti || prog.bpm)) { prog.battiti = null; prog.bpm = null; prog.offset = 0; }
    brano = b;
    media.src = b.src; media.load();
    prog.audio = { nome: b.nome }; if (b.url) prog.audio.url = b.url;
    analisi = null; sporcoOnda = true; ui.vista = 0; ui.giro = null;
    aggiornaVuoto(); aggiornaStato(); salvaLocale(); richiedi();
    decodifica(b.bytes);
  }
  async function apriBranoFile(file) {
    try {
      const bytes = await file.arrayBuffer();
      impostaBrano({ nome: file.name, tipo: file.type || tipoDaNome(file.name), bytes, src: URL.createObjectURL(file) });
      avviso("Brano aperto: «" + file.name + "». Premi play e disegna!");
    } catch (e) { avviso("Non riesco ad aprire questo file.", true); }
  }
  async function apriEsempio(es, silenzioso) {
    try {
      if (!silenzioso) avviso("Carico il brano…");
      const r = await fetch(es.file); if (!r.ok) throw new Error(r.status);
      const bytes = await r.arrayBuffer();
      impostaBrano({ nome: es.file.split("/").pop(), tipo: "audio/mpeg", bytes, src: es.file, url: es.file, esempio: es });
      if (!prog.crediti) prog.crediti = es.crediti;
      if (!prog.titolo) { prog.titolo = es.nome; $("titolo").value = prog.titolo; }
      if (!prog.battiti && window.BATTITI && window.BATTITI[es.chiave]) {
        prog.battiti = window.BATTITI[es.chiave].slice(); prog.bpm = bpmDa(prog.battiti);
      }
      aggiornaStato(); salvaLocale();
      if (!silenzioso) avviso("Brano pronto, con i battiti già segnati. Premi play e disegna!");
    } catch (e) { avviso("Non riesco a caricare il brano di esempio.", true); }
  }
  function bpmDa(B) {
    if (!B || B.length < 2) return null;
    const iv = []; for (let i = 1; i < B.length; i++) iv.push(B[i] - B[i - 1]);
    iv.sort((a, b) => a - b); return Math.round(600 / iv[iv.length >> 1]) / 10;
  }

  /* onda sonora e analisi (attacchi, battiti), tutto nel browser */
  async function decodifica(bytes) {
    let buf;
    try {
      const C = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const oc = new C(1, 1, 44100);
      buf = await new Promise((ok, no) => { const p = oc.decodeAudioData(bytes.slice(0), ok, no); if (p && p.then) p.then(ok, no); });
    } catch (e) { aggiornaStato("onda sonora non disponibile per questo file"); return; }
    const sr = buf.sampleRate, n = buf.length, ch = [];
    for (let c = 0; c < buf.numberOfChannels; c++) ch.push(buf.getChannelData(c));
    const perSec = 100, passo = Math.max(1, Math.floor(sr / perSec)), nb = Math.ceil(n / passo);
    const picchi = new Float32Array(nb * 2);
    const ds = Math.max(1, Math.round(sr / 22050)), mono = new Float32Array(Math.floor(n / ds));
    for (let b = 0; b < nb; b++) {
      let mi = 0, ma = 0; const fine = Math.min(n, (b + 1) * passo);
      for (let i = b * passo; i < fine; i++) {
        let v = 0; for (let c = 0; c < ch.length; c++) v += ch[c][i]; v /= ch.length;
        if (v < mi) mi = v; if (v > ma) ma = v;
        if (i % ds === 0 && i / ds < mono.length) mono[i / ds] = v;
      }
      picchi[2 * b] = mi; picchi[2 * b + 1] = ma;
    }
    const a = { durata: n / sr, picchi, perSec: sr / passo };
    a.pronto = calcolaFlusso(mono, sr / ds);
    if (brano && brano.bytes === bytes) { analisi = a; sporcoOnda = true; aggiornaStato(); richiedi(); }
  }
  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit;
      if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang), h = len >> 1;
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < h; k++) {
          const a = i + k, b = a + h, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
          re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
  }
  function calcolaFlusso(mono, sr) {
    return new Promise(ok => {
      const N = 1024, H = 256, nfr = Math.max(0, Math.floor((mono.length - N) / H) + 1);
      const env = new Float32Array(nfr), re = new Float64Array(N), im = new Float64Array(N), prec = new Float32Array(N / 2);
      const fin = new Float32Array(N); for (let k = 0; k < N; k++) fin[k] = 0.5 - 0.5 * Math.cos(2 * Math.PI * k / N);
      const kMax = Math.min(N / 2, Math.round(8000 / sr * N));
      let i = 0;
      (function lotto() {
        const fine = Math.min(nfr, i + 1200);
        for (; i < fine; i++) {
          const o = i * H; for (let k = 0; k < N; k++) { re[k] = mono[o + k] * fin[k]; im[k] = 0; }
          fft(re, im);
          let f = 0;
          for (let k = 1; k < kMax; k++) { const m = Math.log(1 + 100 * Math.hypot(re[k], im[k])), d = m - prec[k]; if (d > 0) f += d; prec[k] = m; }
          env[i] = i ? f : 0;
        }
        if (i < nfr) { setTimeout(lotto, 0); return; }
        let s = 0, s2 = 0; for (let k = 0; k < nfr; k++) { s += env[k]; s2 += env[k] * env[k]; }
        const media_ = s / Math.max(1, nfr), dev = Math.sqrt(Math.max(1e-9, s2 / Math.max(1, nfr) - media_ * media_));
        for (let k = 0; k < nfr; k++) env[k] /= dev;
        const ris = { env, hopT: H / sr, t0: N / 2 / sr };
        ris.attacchi = trovaAttacchi(ris);
        ok(ris);
      })();
    });
  }
  function trovaAttacchi(a) {
    const e = a.env, n = e.length, w = 3, m = 20, out = [];
    let max = 0; for (let i = 0; i < n; i++) if (e[i] > max) max = e[i];
    let ultimo = -1e9;
    for (let i = w; i < n - w; i++) {
      let picco = true; for (let k = i - w; k <= i + w; k++) if (e[k] > e[i]) { picco = false; break; }
      if (!picco) continue;
      let s = 0, c = 0; for (let k = Math.max(0, i - m); k <= Math.min(n - 1, i + m); k++) { s += e[k]; c++; }
      const t = i * a.hopT + a.t0;
      if (e[i] / max > s / c / max + 0.07 && t - ultimo > 0.06) { out.push(r3(t)); ultimo = t; }
    }
    return out;
  }
  function tracciaBattiti(a, bpmGuida) {
    const env = a.env, n = env.length, hop = a.hopT;
    let mu = 0; for (let i = 0; i < n; i++) mu += env[i]; mu /= n;
    const minL = Math.max(2, Math.round(60 / 220 / hop)), maxL = Math.round(60 / 38 / hop), ref = bpmGuida || 110;
    const ac = new Float64Array(maxL + 2);
    for (let l = minL - 1; l <= maxL + 1; l++) { let s = 0; for (let i = l; i < n; i++) s += (env[i] - mu) * (env[i - l] - mu); ac[l] = s / (n - l); }
    let best = -Infinity, L = minL;
    for (let l = minL; l <= maxL; l++) {
      const bpm = 60 / (l * hop), w = Math.exp(-0.5 * Math.pow(Math.log2(bpm / ref) / (bpmGuida ? 0.25 : 0.9), 2));
      if (ac[l] * w > best) { best = ac[l] * w; L = l; }
    }
    const y0 = ac[L - 1], y1 = ac[L], y2 = ac[L + 1], den = y0 - 2 * y1 + y2;
    const P = L + (den < 0 ? 0.5 * (y0 - y2) / den : 0);
    const lw = Math.round(P), sig = P / 32, gw = [];
    for (let k = -lw; k <= lw; k++) gw.push(Math.exp(-0.5 * Math.pow(k / sig, 2)));
    const loc = new Float32Array(n);
    for (let i = 0; i < n; i++) { let s = 0; for (let k = -lw; k <= lw; k++) { const j = i + k; if (j >= 0 && j < n) s += env[j] * gw[k + lw]; } loc[i] = s; }
    const score = new Float32Array(n), back = new Int32Array(n).fill(-1), tight = 100;
    for (let i = 0; i < n; i++) {
      let bv = -Infinity, bj = -1;
      const j0 = Math.max(0, Math.round(i - 2 * P)), j1 = Math.round(i - P / 2);
      for (let j = j0; j <= j1; j++) { const v = score[j] - tight * Math.pow(Math.log((i - j) / P), 2); if (v > bv) { bv = v; bj = j; } }
      if (bj >= 0 && bv > 0) { score[i] = loc[i] + bv; back[i] = bj; } else score[i] = loc[i];
    }
    const massimi = [];
    for (let i = 1; i < n - 1; i++) if (score[i] > score[i - 1] && score[i] >= score[i + 1]) massimi.push(i);
    const ord = massimi.map(i => score[i]).sort((x, y) => x - y), med = ord[ord.length >> 1] || 0;
    let fine = n - 1; for (let k = massimi.length - 1; k >= 0; k--) if (score[massimi[k]] >= 0.5 * med) { fine = massimi[k]; break; }
    const fr = []; for (let i = fine; i >= 0; i = back[i]) { fr.push(i); if (back[i] < 0) break; }
    fr.reverse();
    return fr.map(i => r3(i * hop + a.t0));
  }
  async function trovaBattiti() {
    if (!brano) { avviso("Prima apri un brano."); return false; }
    if (!analisi) { avviso("Sto ancora leggendo il brano, riprova tra un attimo."); return false; }
    aggiornaStato("cerco i battiti…");
    const a = await analisi.pronto;
    await new Promise(r => setTimeout(r, 20));
    const guida = parseFloat($("bpm").value) || null;
    const B = tracciaBattiti(a, guida);
    if (B.length < 4) { avviso("Non ho trovato battiti chiari: prova «Batti il tempo»."); aggiornaStato(); return false; }
    salvaStorico();
    prog.battiti = B; prog.bpm = bpmDa(B); prog.offset = 0;
    modificato();
    avviso(`Trovati ${B.length} battiti (circa ${Math.round(prog.bpm)} al minuto). Accendi il metronomo per controllarli.`, true);
    return true;
  }

  /* battere il tempo con il tasto B */
  function battiTasto() {
    if (!brano) { avviso("Prima apri un brano."); return; }
    const t = tempoOra();
    if (!batti) {
      batti = { inizio: t, colpi: [] };
      if (media.paused) play(); else batti.colpi.push(r3(t));
      $("registraBattiti").classList.add("attivo");
      avviso("Batti B a ogni battito. Esc (o di nuovo il pulsante) per finire.");
    } else batti.colpi.push(r3(t));
    aggiornaStato(); sporcoOnda = true; richiedi();
  }
  function fineBatti() {
    const b = batti; batti = null; $("registraBattiti").classList.remove("attivo");
    if (b && b.colpi.length >= 2) {
      const c = b.colpi, iv = (c[c.length - 1] - c[0]) / (c.length - 1);
      const vecchi = (listaBattiti() || []).filter(x => x < c[0] - iv / 2 || x > c[c.length - 1] + iv / 2);
      salvaStorico();
      prog.battiti = vecchi.concat(c).sort((x, y) => x - y); prog.bpm = bpmDa(c); prog.offset = 0;
      modificato(); avviso(`Segnati ${c.length} battiti.`);
    }
    aggiornaStato(); sporcoOnda = true; richiedi();
  }

  /* ---------------- pagine guidate ---------------- */
  function paginaGuidata(t) {
    for (let i = 0; i < prog.pagine.length; i++) {
      const g = prog.pagine[i].guida;
      if (g && t >= g.inizio - 1e-6 && t < g.inizio + g.durata - 1e-6) return i;
    }
    return -1;
  }
  function nuovaGuida(t) {
    const n = Math.max(1, Math.round(+$("durPag").value || 8));
    const usaB = $("unitaPag").value === "battiti" && listaBattiti();
    let fineP = null, dopo = Infinity;
    prog.pagine.forEach(p => {
      const g = p.guida; if (!g) return;
      const e = g.inizio + g.durata;
      if (e <= t + 1e-6 && (fineP == null || e > fineP)) fineP = e;
      if (g.inizio > t && g.inizio < dopo) dopo = g.inizio;
    });
    let a, b;
    if (usaB) {
      const bt = posBattito(t); let k;
      if (fineP != null) { const kE = Math.round(posBattito(fineP)); k = kE + Math.max(0, Math.floor((bt - kE + 1e-6) / n)) * n; }
      else k = Math.floor(bt + 0.25);
      a = tempoBattito(k); b = tempoBattito(k + n);
    } else {
      a = fineP != null ? fineP + Math.floor((t - fineP) / n) * n : Math.max(0, t - 0.05);
      b = a + n;
    }
    if (b > dopo) b = dopo;
    return { inizio: r3(a), durata: r3(Math.max(0.5, b - a)), battiti: usaB ? n : null };
  }
  function xGuida(g, t) {
    let u;
    if (g.battiti && listaBattiti()) u = (posBattito(t) - posBattito(g.inizio)) / g.battiti;
    else u = (t - g.inizio) / g.durata;
    return MARGINE + (1 - 2 * MARGINE) * limita(u, 0, 1);
  }
  function inizioPagina(p) { if (p.guida) return p.guida.inizio; const tp = L.tempiPagina(p); return tp ? tp[0] : Infinity; }
  function preparaPaginaGuidata(t, g) {
    const i = paginaGuidata(t); if (i >= 0) return i;
    g = g || nuovaGuida(t);
    const cur = pagCorr();
    if (!cur.tratti.length) prog.pagine.splice(prog.pagine.indexOf(cur), 1);
    let pos = prog.pagine.findIndex(p => inizioPagina(p) > g.inizio);
    if (pos < 0) pos = prog.pagine.length;
    prog.pagine.splice(pos, 0, { tratti: [], guida: g });
    return pos;
  }
  function puntoForma(g, t, y) {
    let x = xGuida(g, t), yy = y;
    if (ui.modo === "forme" || (disegno && disegno.forme)) {
      const φ = (posBattito(t) - posBattito(g.inizio)) * ui.cicli, [dx, dy] = FORME[ui.forma].f(φ);
      x += dx * ui.ampiezza / L.ASPETTO; yy = y + dy * ui.ampiezza;
    }
    return [limita(x, 0, 1), limita(yy, 0.02, 0.98)];
  }

  /* ---------------- storico (annulla / rifai) ---------------- */
  function istantanea() { return JSON.stringify({ pagine: prog.pagine, battiti: prog.battiti, bpm: prog.bpm, offset: prog.offset, pagina: ui.pagina }); }
  function salvaStorico() { storico.push(istantanea()); if (storico.length > 150) storico.shift(); futuro.length = 0; aggiornaAnnulla(); }
  function ripristina(s) {
    const o = JSON.parse(s);
    prog.pagine = o.pagine.length ? o.pagine : [{ tratti: [] }]; prog.battiti = o.battiti; prog.bpm = o.bpm; prog.offset = o.offset || 0;
    ui.pagina = limita(o.pagina, 0, prog.pagine.length - 1); ui.sel = null; modificato();
  }
  function annulla() { if (disegno || !storico.length) return; futuro.push(istantanea()); ripristina(storico.pop()); aggiornaAnnulla(); }
  function rifai() { if (disegno || !futuro.length) return; storico.push(istantanea()); ripristina(futuro.pop()); aggiornaAnnulla(); }
  function aggiornaAnnulla() { $("annulla").disabled = !storico.length; $("rifai").disabled = !futuro.length; }

  let timerLocale = 0, timerMini = 0;
  function modificato() {
    sporcoOnda = true;
    if (!prog.pagine[ui.pagina]) ui.pagina = prog.pagine.length - 1;
    if (ui.sel && !prog.pagine.some(p => p.tratti.includes(ui.sel))) ui.sel = null;
    clearTimeout(timerMini); timerMini = setTimeout(aggiornaPagine, 120);
    salvaLocale(); aggiornaSel(); aggiornaEtichette(); aggiornaVuoto(); aggiornaStato(); richiedi();
  }
  function salvaLocale() {
    clearTimeout(timerLocale);
    timerLocale = setTimeout(() => {
      try {
        const o = Object.assign({}, prog, { audio: prog.audio ? { nome: prog.audio.nome, url: prog.audio.url } : null });
        localStorage.setItem(CHIAVE, JSON.stringify(o));
      } catch (e) { /* spazio pieno o archivio bloccato: pazienza */ }
    }, 700);
  }

  /* ---------------- disegno con il mouse ---------------- */
  function posMouse(e) { const r = tela.getBoundingClientRect(); return [limita((e.clientX - r.left) / r.width, 0, 1), limita((e.clientY - r.top) / r.height, 0, 1)]; }
  function nuovoTratto() { return { colore: ui.colore, spessore: ui.spessore, punti: [] }; }
  let avvisatoSenzaBrano = false;
  function iniziaLibero(p, senzaTempo) {
    const conTempo = !senzaTempo && !!brano;
    if (!senzaTempo && !brano && !avvisatoSenzaBrano) { avvisatoSenzaBrano = true; avviso("Senza brano la linea non ha tempo: potrai darglielo con «Poi tempo».", true); }
    salvaStorico();
    if (conTempo && media.paused) play();
    const tr = nuovoTratto(); pagCorr().tratti.push(tr);
    disegno = { tr, conTempo, quando: performance.now() };
    aggiungiPunto(p);
  }
  function aggiungiPunto(p) {
    const P = disegno.tr.punti, ult = P[P.length - 1];
    let t = disegno.conTempo ? tempoMano() : null;
    if (t != null && ult && ult[2] != null && t < ult[2]) t = ult[2];
    if (ult && Math.hypot((p[0] - ult[0]) * L.ASPETTO, p[1] - ult[1]) < 0.0025 && (t == null || t - ult[2] < 0.1)) return;
    P.push([r4(p[0]), r4(p[1]), t == null ? null : r3(t)]);
    disegno.quando = performance.now();
  }
  function iniziaGuidato(p) {
    if (!brano) { avviso("Prima apri un brano: in questa modalità la linea segue la musica."); return; }
    if (!listaBattiti() && (ui.modo === "forme" || $("unitaPag").value === "battiti")) {
      if (ui.modo === "forme") { avviso("Le forme hanno bisogno dei battiti: premi «Trova» o «Batti il tempo»."); return; }
      $("unitaPag").value = "secondi"; avviso("Non ci sono battiti: le pagine durano secondi.");
    }
    salvaStorico();
    if (media.paused) play();
    const t = ui.modo === "forme" ? tempoOra() : tempoMano();
    const i = preparaPaginaGuidata(t, virtuale && t < virtuale.inizio + virtuale.durata ? virtuale : null); virtuale = null; vai(i);
    aggiornaPagine(); sporcoOnda = true;
    disegno = { guidato: true, forme: ui.modo === "forme", pagina: prog.pagine[i], tr: nuovoTratto() };
    disegno.pagina.tratti.push(disegno.tr);
    puntoGuidato(t);
  }
  function puntoGuidato(t) {
    const g = disegno.pagina.guida, q = puntoForma(g, t, ui.mouse[1]), P = disegno.tr.punti, ult = P[P.length - 1];
    if (ult && t <= ult[2]) return;
    P.push([r4(q[0]), r4(q[1]), r3(t)]);
  }
  function avanzaGuidato() {
    const t = disegno.forme ? tempoOra() : tempoMano(), g = disegno.pagina.guida, fine = g.inizio + g.durata;
    if (t < fine) { puntoGuidato(t); return; }
    puntoGuidato(fine - 0.001);
    const tr = disegno.tr;
    chiudiTratto(tr);
    if (!$("pagAuto").checked) { disegno = null; pausa(); avviso("Fine della pagina. Premi play per continuare su una pagina nuova."); return; }
    const forme = disegno.forme;
    const i = preparaPaginaGuidata(fine + 0.002); vai(i); aggiornaPagine(); sporcoOnda = true;
    disegno = { guidato: true, forme, pagina: prog.pagine[i], tr: nuovoTratto() };
    disegno.pagina.tratti.push(disegno.tr);
    puntoGuidato(Math.max(fine, t));
  }
  function chiudiTratto(tr) {
    const pag = prog.pagine.find(p => p.tratti.includes(tr));
    if (!tr.punti.length && pag) { pag.tratti.splice(pag.tratti.indexOf(tr), 1); return false; }
    if (ui.calamita && tr.punti[0][2] != null && listaBattiti() && !(disegno && disegno.forme)) agganciaBattiti(tr);
    return true;
  }
  function finisciDisegno() {
    if (!disegno) return;
    const P = disegno.tr.punti;
    if (disegno.guidato && P.length && P[P.length - 1][2] - P[0][2] < 0.1) P.length = 0;
    const ok = chiudiTratto(disegno.tr);
    if (!ok && disegno.tr.punti.length === 0 && storico.length && !disegno.guidato) storico.pop();
    disegno = null; modificato();
  }

  /* poi tempo: assegnare i tempi alle linee disegnate a musica ferma */
  function prossimaSenzaTempo() {
    for (let k = ui.pagina; k < prog.pagine.length; k++) {
      const tr = prog.pagine[k].tratti.find(x => x.punti.length && x.punti[0][2] == null);
      if (tr) return { k, tr };
    }
    return null;
  }
  function iniziaAssegna(p, come) {
    const q = prossimaSenzaTempo();
    if (!q) { avviso("Tutte le linee hanno già il tempo. Disegnane altre a musica ferma, o usa «Togli il tempo»."); return; }
    salvaStorico();
    if (q.k !== ui.pagina) vai(q.k);
    const t = tempoMano();
    q.tr.punti.forEach((pt, i) => { pt[2] = i === 0 ? r3(t) : 1e9; });
    assegna = { tr: q.tr, t0: t, indice: 0, come, ripassa: false };
    if (p) seguiAssegna(p);
    richiedi();
  }
  function seguiAssegna(p) {
    const a = assegna, P = a.tr.punti, W = G.tW, H = G.tH;
    let best = -1, bd = Infinity;
    for (let i = a.indice; i < Math.min(P.length, a.indice + 40); i++) {
      const d = Math.hypot((P[i][0] - p[0]) * W, (P[i][1] - p[1]) * H); if (d < bd) { bd = d; best = i; }
    }
    if (best > a.indice && bd < 45) {
      const t = tempoMano(), t0 = P[a.indice][2];
      for (let i = a.indice + 1; i <= best; i++) P[i][2] = r3(t0 + (t - t0) * (i - a.indice) / (best - a.indice));
      a.indice = best; a.ripassa = true;
    }
  }
  function finisciAssegna() {
    const a = assegna; if (!a) return; assegna = null;
    const P = a.tr.punti, t1 = Math.max(tempoMano(), P[a.indice][2] + 0.25);
    const lung = [0]; for (let i = 1; i < P.length; i++) lung.push(lung[i - 1] + Math.hypot((P[i][0] - P[i - 1][0]) * L.ASPETTO, P[i][1] - P[i - 1][1]));
    const da = a.indice, l0 = lung[da], tot = lung[P.length - 1] - l0, t0 = P[da][2];
    for (let i = da + 1; i < P.length; i++) P[i][2] = r3(t0 + (t1 - t0) * (tot > 0 ? (lung[i] - l0) / tot : (i - da) / (P.length - 1 - da)));
    if (ui.calamita && listaBattiti()) agganciaBattiti(a.tr);
    modificato();
    const q = prossimaSenzaTempo();
    if (!q) avviso("Fatto: tutte le linee hanno il tempo.");
  }

  /* sposta, gomma */
  function distanzaTratto(tr, p) {
    const W = G.tW, H = G.tH, P = tr.punti; let d = Infinity;
    const px = p[0] * W, py = p[1] * H;
    for (let i = 0; i < P.length; i++) {
      const ax = P[i][0] * W, ay = P[i][1] * H;
      if (i === 0) { d = Math.min(d, Math.hypot(px - ax, py - ay)); continue; }
      const bx = P[i - 1][0] * W, by = P[i - 1][1] * H, vx = ax - bx, vy = ay - by, l2 = vx * vx + vy * vy;
      const u = l2 ? limita(((px - bx) * vx + (py - by) * vy) / l2, 0, 1) : 0;
      d = Math.min(d, Math.hypot(px - bx - u * vx, py - by - u * vy));
    }
    return d;
  }
  function spessorePx() { return Math.max(10, Math.min(G.tW, G.tH * 1.8) * 0.034); }
  function trattoSotto(p) {
    const tr = pagCorr().tratti;
    for (let i = tr.length - 1; i >= 0; i--) if (distanzaTratto(tr[i], p) < Math.max(10, spessorePx() * (tr[i].spessore || 1) / 2 + 5)) return tr[i];
    return null;
  }
  function selezionaA(p) {
    const tr = trattoSotto(p);
    ui.sel = tr;
    if (tr) { salvaStorico(); trascinaSel = { tr, p0: p, orig: tr.punti.map(q => q.slice()), mosso: false }; }
    aggiornaSel(); richiedi();
  }
  function gommaA(p) {
    const tr = trattoSotto(p);
    if (tr) { const a = pagCorr().tratti; a.splice(a.indexOf(tr), 1); gommaAttiva.tolte++; if (ui.sel === tr) ui.sel = null; modificato(); }
  }

  /* ---------------- sistemare le linee ---------------- */
  const Q = tr => tr.punti.map(p => [p[0] * L.ASPETTO, p[1]]);
  function lunghezze(P) { const l = [0]; for (let i = 1; i < P.length; i++) l.push(l[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); return l; }
  function haTempo(tr) { return tr.punti.length && tr.punti[0][2] != null; }
  function tempiEstremi(tr) { const P = tr.punti; return [P[0][2], P[P.length - 1][2]]; }
  function rimappa(tr, a, b) {
    const [t0, t1] = tempiEstremi(tr), d = t1 - t0;
    tr.punti.forEach((p, i) => { p[2] = r3(d > 0 ? a + (p[2] - t0) / d * (b - a) : a + (b - a) * i / Math.max(1, tr.punti.length - 1)); });
  }
  function smussa(tr) {
    for (let passo = 0; passo < 2; passo++) {
      const P = tr.punti, n = P.length; if (n < 5) return;
      const nuovi = P.map((p, i) => {
        if (i === 0 || i === n - 1) return p.slice();
        let sx = 0, sy = 0, c = 0; for (let k = Math.max(0, i - 3); k <= Math.min(n - 1, i + 3); k++) { sx += P[k][0]; sy += P[k][1]; c++; }
        return [r4(sx / c), r4(sy / c), p[2]];
      });
      tr.punti = nuovi;
    }
  }
  function rdp(P, eps) {
    const n = P.length; if (n < 3) return P.map((_, i) => i);
    const tieni = new Uint8Array(n); tieni[0] = tieni[n - 1] = 1;
    const pila = [[0, n - 1]];
    while (pila.length) {
      const [a, b] = pila.pop(); let dm = 0, im = -1;
      const ax = P[a][0], ay = P[a][1], vx = P[b][0] - ax, vy = P[b][1] - ay, l = Math.hypot(vx, vy) || 1e-9;
      for (let i = a + 1; i < b; i++) { const d = Math.abs((P[i][0] - ax) * vy - (P[i][1] - ay) * vx) / l; if (d > dm) { dm = d; im = i; } }
      if (dm > eps && im > 0) { tieni[im] = 1; pila.push([a, im], [im, b]); }
    }
    const out = []; for (let i = 0; i < n; i++) if (tieni[i]) out.push(i); return out;
  }
  function raddrizza(tr) { const idx = rdp(Q(tr), 0.012); tr.punti = idx.map(i => tr.punti[i]); }
  function velocitaRegolare(tr) {
    if (!haTempo(tr) || tr.punti.length < 2) return;
    const l = lunghezze(Q(tr)), tot = l[l.length - 1], [t0, t1] = tempiEstremi(tr);
    tr.punti.forEach((p, i) => { p[2] = r3(t0 + (t1 - t0) * (tot ? l[i] / tot : i / (tr.punti.length - 1))); });
  }
  function agganciaBattiti(tr) {
    if (!haTempo(tr) || !listaBattiti()) return;
    const [t0, t1] = tempiEstremi(tr);
    let a = battitoVicino(t0), b = battitoVicino(t1);
    if (b <= a) b = tempoBattito(Math.round(posBattito(a)) + 1);
    if (t1 - t0 < 0.05) b = a + (t1 - t0);
    rimappa(tr, a, b);
  }
  function agganciaAttacchi(tr, att) {
    if (!haTempo(tr) || !att || !att.length) return;
    const t0 = tr.punti[0][2]; let best = null;
    for (const x of att) if (Math.abs(x - t0) < 0.3 && (best == null || Math.abs(x - t0) < Math.abs(best - t0))) best = x;
    if (best != null) spostaTempi(tr, best - t0);
  }
  function spostaTempi(tr, dt) { if (haTempo(tr)) tr.punti.forEach(p => { p[2] = r3(Math.max(0, p[2] + dt)); }); }

  /* forma perfetta: riconosce linea, cerchio, onda, zig-zag, archi, greca, riccioli */
  function formaPerfetta(tr) {
    const P = tr.punti; if (P.length < 4) return false;
    const q = Q(tr), n = q.length, l = lunghezze(q), lung = l[n - 1];
    const conT = haTempo(tr), [t0, t1] = conT ? tempiEstremi(tr) : [null, null];
    const tempoA = (frazione) => { if (!conT) return null; const s = frazione * lung; let i = 1; while (i < n - 1 && l[i] < s) i++; const u = l[i] > l[i - 1] ? (s - l[i - 1]) / (l[i] - l[i - 1]) : 0; return r3(P[i - 1][2] + u * (P[i][2] - P[i - 1][2])); };
    const scrivi = pts => { tr.punti = pts.map(p => [r4(limita(p[0] / L.ASPETTO, 0, 1)), r4(limita(p[1], 0, 1)), p[2]]); };
    const chiusura = Math.hypot(q[0][0] - q[n - 1][0], q[0][1] - q[n - 1][1]);
    if (chiusura < 0.18 * lung && lung > 0.12) {
      let cx = 0, cy = 0; q.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= n; cy /= n;
      let rx = 0, ry = 0, area = 0; q.forEach((p, i) => { rx += Math.abs(p[0] - cx); ry += Math.abs(p[1] - cy); const r = q[(i + 1) % n]; area += p[0] * r[1] - r[0] * p[1]; });
      rx = rx / n * Math.PI / 2; ry = ry / n * Math.PI / 2;
      const a0 = Math.atan2((q[0][1] - cy) / ry, (q[0][0] - cx) / rx), verso = area >= 0 ? 1 : -1, M = 72, out = [];
      for (let k = 0; k <= M; k++) { const a = a0 + verso * 2 * Math.PI * k / M; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a), tempoA(k / M)]); }
      scrivi(out); return "cerchio";
    }
    const ux0 = q[n - 1][0] - q[0][0], uy0 = q[n - 1][1] - q[0][1], Lt = Math.hypot(ux0, uy0);
    if (Lt < 0.03) return false;
    const ux = ux0 / Lt, uy = uy0 / Lt, nx = -uy, ny = ux;
    const al = q.map(p => (p[0] - q[0][0]) * ux + (p[1] - q[0][1]) * uy), pe = q.map(p => (p[0] - q[0][0]) * nx + (p[1] - q[0][1]) * ny);
    let indietro = 0; for (let i = 1; i < n; i++) if (al[i] < al[i - 1]) indietro += al[i - 1] - al[i];
    let mi = Infinity, ma = -Infinity; pe.forEach(v => { if (v < mi) mi = v; if (v > ma) ma = v; });
    const vm = (mi + ma) / 2, amp = (ma - mi) / 2;
    const linea = () => {
      const am = []; let c = -Infinity; al.forEach(a => { c = Math.max(c, a); am.push(limita(c, 0, Lt)); });
      scrivi(am.map((a, i) => [q[0][0] + a * ux, q[0][1] + a * uy, conT ? P[i][2] : null]));
      return "linea";
    };
    if (amp < 0.012 || rdp(q, 0.02).length === 2) return linea();
    if (indietro > 0.25 * Lt) {
      let giri = 0; for (let i = 2; i < n; i++) {
        const a1 = Math.atan2(q[i - 1][1] - q[i - 2][1], q[i - 1][0] - q[i - 2][0]), a2 = Math.atan2(q[i][1] - q[i - 1][1], q[i][0] - q[i - 1][0]);
        let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; giri += d;
      }
      const k = Math.max(1, Math.round(Math.abs(giri) / (2 * Math.PI))), verso = giri >= 0 ? 1 : -1;
      const R = Math.max(amp * 0.85, Lt / k / (2 * Math.PI) * 1.4), M = k * 36, out = [];
      for (let j = 0; j <= M; j++) {
        const s = j / M, φ = k * s, a = Lt * s + R * Math.sin(2 * Math.PI * φ) * 0.9, v = vm + verso * amp * -Math.cos(2 * Math.PI * φ) + verso * amp * 0;
        out.push([q[0][0] + a * ux + v * nx, q[0][1] + a * uy + v * ny, tempoA(s)]);
      }
      scrivi(out); return "riccioli";
    }
    /* figure periodiche lungo l'asse: si prova quale assomiglia di più */
    const am = []; let c = -Infinity; al.forEach(a => { c = Math.max(c, a); am.push(c); });
    const S = 160, vs = [];
    for (let j = 0; j < S; j++) {
      const a = Lt * j / (S - 1); let i = 1; while (i < n - 1 && am[i] < a) i++;
      const u = am[i] > am[i - 1] ? limita((a - am[i - 1]) / (am[i] - am[i - 1]), 0, 1) : 0;
      vs.push(pe[i - 1] + u * (pe[i] - pe[i - 1]));
    }
    let incroci = 0, stato = 0;
    vs.forEach(v => { const z = v - vm; if (z > 0.3 * amp && stato <= 0) { if (stato < 0) incroci++; stato = 1; } else if (z < -0.3 * amp && stato >= 0) { if (stato > 0) incroci++; stato = -1; } });
    const forme = {
      onda: φ => Math.sin(2 * Math.PI * φ), zigzag: φ => tri(φ),
      archi: φ => 2 * Math.abs(Math.sin(Math.PI * φ)) - 1, greca: φ => Math.max(-1, Math.min(1, 3 * Math.sin(2 * Math.PI * φ)))
    };
    let best = null;
    for (const nome in forme) for (let h = Math.max(1, incroci - 1); h <= incroci + 2; h++) for (const segno of [1, -1]) {
      const cicli = nome === "archi" ? h : h / 2; let e = 0;
      for (let j = 0; j < S; j++) { const d = vs[j] - (vm + segno * amp * forme[nome](cicli * j / (S - 1))); e += d * d; }
      if (!best || e < best.e) best = { e, nome, cicli, segno };
    }
    if (!best) return linea();
    const f = forme[best.nome], M = Math.max(40, Math.round(best.cicli * 40)), out = [];
    const tempoAl = a => { if (!conT) return null; let i = 1; while (i < n - 1 && am[i] < a) i++; const u = am[i] > am[i - 1] ? limita((a - am[i - 1]) / (am[i] - am[i - 1]), 0, 1) : 0; return r3(P[i - 1][2] + u * (P[i][2] - P[i - 1][2])); };
    for (let j = 0; j <= M; j++) {
      const s = j / M, a = Lt * s, v = vm + best.segno * amp * f(best.cicli * s);
      out.push([q[0][0] + a * ux + v * nx, q[0][1] + a * uy + v * ny, tempoAl(a)]);
    }
    if (conT) { out[0][2] = t0; out[out.length - 1][2] = t1; for (let j = 1; j < out.length; j++) if (out[j][2] < out[j - 1][2]) out[j][2] = out[j - 1][2]; }
    scrivi(out);
    return { onda: "onda", zigzag: "zig-zag", archi: "archi", greca: "greca" }[best.nome];
  }

  function trattiAmbito() {
    const a = $("ambito").value;
    if (a === "tutto") return prog.pagine.flatMap(p => p.tratti);
    if (a === "sel" && ui.sel) return [ui.sel];
    return pagCorr().tratti.slice();
  }
  async function sistema(cosa) {
    const tr = trattiAmbito();
    if (!tr.length) { avviso("Non ci sono linee da sistemare qui."); return; }
    if ((cosa === "aggancia") && !listaBattiti()) { avviso("Prima servono i battiti: «Trova» o «Batti il tempo»."); return; }
    let att = null;
    if (cosa === "attacchi") {
      if (!analisi) { avviso("Prima apri un brano."); return; }
      att = (await analisi.pronto).attacchi;
    }
    salvaStorico();
    const nomi = new Set();
    tr.forEach(t => {
      if (cosa === "smussa") smussa(t);
      else if (cosa === "raddrizza") raddrizza(t);
      else if (cosa === "forma") { const r = formaPerfetta(t); if (r) nomi.add(r); }
      else if (cosa === "velocita") velocitaRegolare(t);
      else if (cosa === "aggancia") agganciaBattiti(t);
      else if (cosa === "attacchi") agganciaAttacchi(t, att);
    });
    modificato();
    const testi = { smussa: "Linee smussate.", raddrizza: "Linee raddrizzate.", velocita: "Ora si colorano a velocità regolare.", aggancia: "Agganciate ai battiti.", attacchi: "Agganciate agli attacchi della musica." };
    avviso(cosa === "forma" ? (nomi.size ? "Riconosciuto: " + [...nomi].join(", ") + "." : "Nessuna forma riconosciuta.") : testi[cosa]);
  }

  /* ---------------- operazioni su linee e pagine ---------------- */
  function copia(tr) { return JSON.parse(JSON.stringify(tr)); }
  function duplicaSel() {
    const s = ui.sel; if (!s) return;
    salvaStorico();
    const c = copia(s), dt = haTempo(s) ? tempiEstremi(s)[1] - tempiEstremi(s)[0] + 0.05 : 0;
    c.punti.forEach(p => { p[0] = r4(Math.min(1, p[0] + 0.04)); p[1] = r4(Math.min(1, p[1] + 0.04)); if (p[2] != null) p[2] = r3(p[2] + dt); });
    if (haTempo(c) && ui.calamita) agganciaBattiti(c);
    pagCorr().tratti.push(c); ui.sel = c; modificato();
  }
  function eliminaSel() {
    const s = ui.sel; if (!s) return;
    salvaStorico(); const a = pagCorr().tratti; a.splice(a.indexOf(s), 1); ui.sel = null; modificato();
  }
  function mandaDopo() {
    const s = ui.sel; if (!s) return;
    salvaStorico();
    const a = pagCorr().tratti; a.splice(a.indexOf(s), 1);
    if (!prog.pagine[ui.pagina + 1]) prog.pagine.push({ tratti: [] });
    prog.pagine[ui.pagina + 1].tratti.push(s); vai(ui.pagina + 1); ui.sel = s; modificato();
  }
  function ripeti() {
    const s = ui.sel; if (!s) return;
    const volte = limita(Math.round(+$("ripVolte").value || 1), 1, 32), ogni = +$("ripOgni").value || 1, unita = $("ripUnita").value, dx = (+$("ripDx").value || 0) / 100;
    if (unita === "battiti" && !listaBattiti() && haTempo(s)) { avviso("Servono i battiti, oppure scegli «secondi»."); return; }
    salvaStorico();
    for (let k = 1; k <= volte; k++) {
      const c = copia(s);
      c.punti.forEach(p => {
        p[0] = r4(p[0] + dx * k);
        if (p[2] != null) p[2] = r3(unita === "battiti" ? tempoBattito(posBattito(p[2]) + ogni * k) : p[2] + ogni * k);
      });
      pagCorr().tratti.push(c);
    }
    $("veloRipeti").hidden = true; modificato(); avviso(`Aggiunte ${volte} copie.`);
  }
  function vai(i) {
    i = limita(i, 0, prog.pagine.length - 1);
    if (i !== ui.pagina) { ui.pagina = i; if (ui.sel && !pagCorr().tratti.includes(ui.sel)) ui.sel = null; aggiornaSel(); }
    aggiornaEtichette(); evidenziaPagine(); richiedi();
  }
  function nuovaPagina() { salvaStorico(); prog.pagine.splice(ui.pagina + 1, 0, { tratti: [] }); ui.pagina++; ui.sel = null; modificato(); }
  function duplicaPagina() {
    const p = pagCorr(); salvaStorico();
    const c = copia(p), tp = L.tempiPagina(p);
    if (tp) {
      let dt = tp[1] - tp[0] + 0.1;
      if (listaBattiti()) dt = tempoBattito(Math.ceil(posBattito(tp[1] + 0.05)) + (posBattito(tp[0]) - Math.round(posBattito(tp[0])))) - tp[0];
      if (p.guida) dt = p.guida.durata;
      c.tratti.forEach(tr => tr.punti.forEach(q => { if (q[2] != null) q[2] = r3(q[2] + dt); }));
      if (c.guida) c.guida.inizio = r3(c.guida.inizio + dt);
    } else delete c.guida;
    prog.pagine.splice(ui.pagina + 1, 0, c); ui.pagina++; ui.sel = null; modificato();
    avviso("Pagina duplicata: i tempi continuano dopo la pagina copiata.");
  }
  function svuotaPagina() { if (!pagCorr().tratti.length) return; salvaStorico(); pagCorr().tratti = []; ui.sel = null; modificato(); }
  function eliminaPagina() {
    salvaStorico();
    if (prog.pagine.length === 1) prog.pagine = [{ tratti: [] }];
    else prog.pagine.splice(ui.pagina, 1);
    ui.pagina = Math.min(ui.pagina, prog.pagine.length - 1); ui.sel = null; modificato();
    avviso("Pagina eliminata (Ctrl+Z per riaverla).");
  }

  /* ---------------- disegno della tela ---------------- */
  function dimensiona() {
    const palco = $("palco"), dpr = Math.min(2, window.devicePixelRatio || 1);
    const aw = palco.clientWidth - 20, ah = palco.clientHeight - 20;
    let w = aw, h = w / L.ASPETTO; if (h > ah) { h = ah; w = h * L.ASPETTO; }
    w = Math.max(160, Math.floor(w)); h = Math.max(90, Math.floor(h));
    if (w !== G.tW || h !== G.tH) {
      G.tW = w; G.tH = h; tela.style.width = w + "px"; tela.style.height = h + "px";
      tela.width = Math.round(w * dpr); tela.height = Math.round(h * dpr); tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const lt = $("lineaTempo"), W = lt.clientWidth, H = lt.clientHeight;
    if (W !== G.W || H !== G.H) {
      G.W = W; G.H = H;
      [ondaB, ondaS].forEach(c => { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
      octx.setTransform(dpr, 0, 0, dpr, 0, 0); sctx.setTransform(dpr, 0, 0, dpr, 0, 0); sporcoOnda = true;
    }
    if (presentando) dimensionaPresenta();
    richiedi();
  }
  function disegnaTela(t) {
    const W = G.tW, H = G.tH, suona = !media.paused, cur = pagCorr();
    const pagina = virtuale ? { tratti: [] } : cur;
    const prima = virtuale ? cur : prog.pagine[ui.pagina - 1];
    const tutto = !suona && !disegno && ui.tuttoColorato;
    L.disegna(tctx, W, H, { pagine: [pagina] }, t, { pagina: 0, fantasma: ui.fantasma && prima ? prima : null, evidenzia: ui.sel,
      mostraTutto: tutto, senzaTempoColorato: true });
    const guidato = ui.modo === "guidato" || ui.modo === "forme";
    if (guidato && brano && (suona || disegno)) {
      const g = disegno ? disegno.pagina.guida : (virtuale || cur.guida);
      if (g) {
        const tt = ui.modo === "forme" ? t : Math.max(0, t - ui.ritardo * media.playbackRate);
        const x = xGuida(g, tt) * W;
        tctx.strokeStyle = "rgba(31,42,92,0.18)"; tctx.lineWidth = 2; tctx.beginPath(); tctx.moveTo(x, 0); tctx.lineTo(x, H); tctx.stroke();
        if (ui.modo === "forme" && listaBattiti()) {
          tctx.strokeStyle = L.chiaro(ui.colore, 0.35); tctx.lineWidth = 3; tctx.setLineDash([6, 6]); tctx.beginPath();
          const pb = posBattito(tt);
          for (let k = 0; k <= 40; k++) { const q = puntoForma(g, tempoBattito(pb + 2 * k / 40), ui.mouse[1]); k ? tctx.lineTo(q[0] * W, q[1] * H) : tctx.moveTo(q[0] * W, q[1] * H); }
          tctx.stroke(); tctx.setLineDash([]);
        }
        const q = puntoForma(g, tt, ui.mouse[1]);
        tctx.fillStyle = ui.colore; tctx.strokeStyle = "#fff"; tctx.lineWidth = 3;
        tctx.beginPath(); tctx.arc(q[0] * W, q[1] * H, 9, 0, 2 * Math.PI); tctx.fill(); tctx.stroke();
      }
    }
    if (ui.modo === "tempo" && suona && !assegna) {
      const q = prossimaSenzaTempo();
      if (q && q.k === ui.pagina) {
        tctx.save(); tctx.globalAlpha = 0.5; tctx.strokeStyle = "#1E88E5"; tctx.lineWidth = 3; tctx.setLineDash([8, 8]);
        const b = scatola(q.tr); tctx.strokeRect(b[0] * W - 12, b[1] * H - 12, (b[2] - b[0]) * W + 24, (b[3] - b[1]) * H + 24); tctx.restore();
      }
    }
    if (ui.sel && cur.tratti.includes(ui.sel) && !virtuale) {
      const b = scatola(ui.sel), m = spessorePx() * (ui.sel.spessore || 1) / 2 + 8;
      tctx.strokeStyle = "rgba(30,136,229,0.9)"; tctx.lineWidth = 1.5; tctx.setLineDash([5, 4]);
      tctx.strokeRect(b[0] * W - m, b[1] * H - m, (b[2] - b[0]) * W + 2 * m, (b[3] - b[1]) * H + 2 * m); tctx.setLineDash([]);
    }
  }
  function scatola(tr) {
    let a = 1, b = 1, c = 0, d = 0; tr.punti.forEach(p => { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); });
    return [a, b, c, d];
  }

  /* ---------------- linea del tempo (onda sonora) ---------------- */
  function vistaTL() {
    const d = durata(), span = Math.max(1, d / ui.zoom);
    ui.vista = limita(ui.vista, 0, Math.max(0, d - span));
    return { v0: ui.vista, span, d };
  }
  const xT = (t, v) => (t - v.v0) / v.span * G.W;
  const tX = (x, v) => v.v0 + x / G.W * v.span;
  let barre = [];
  function calcolaBarre() {
    barre = []; const corsie = [];
    const tutte = [];
    prog.pagine.forEach((p, k) => p.tratti.forEach(tr => { if (haTempo(tr)) { const [a, b] = tempiEstremi(tr); if (b < 1e8) tutte.push({ tr, k, a, b }); } }));
    tutte.sort((x, y) => x.a - y.a);
    tutte.forEach(o => { let c = corsie.findIndex(f => f < o.a - 0.02); if (c < 0) { c = corsie.length; corsie.push(0); } corsie[c] = o.b; o.c = Math.min(c, 2); barre.push(o); });
  }
  function disegnaOndaBase() {
    sporcoOnda = false;
    const W = G.W, H = G.H, v = vistaTL(), c = octx;
    c.clearRect(0, 0, W, H); c.fillStyle = "#0a1022"; c.fillRect(0, 0, W, H);
    const y0 = 15, y1 = H - 31, ym = (y0 + y1) / 2, hh = (y1 - y0) / 2;
    prog.pagine.forEach((p, k) => {
      const g = p.guida, tp = L.tempiPagina(p);
      const a = g ? g.inizio : tp && tp[0], b = g ? g.inizio + g.durata : tp && tp[1];
      if (a == null) return;
      const xa = xT(a, v), xb = Math.max(xa + 3, xT(b, v)); if (xb < 0 || xa > W) return;
      c.fillStyle = k === ui.pagina ? "rgba(249,157,28,0.55)" : (k % 2 ? "rgba(94,80,161,0.55)" : "rgba(0,156,149,0.5)");
      c.fillRect(xa, 1, xb - xa, 12);
      if (xb - xa > 14) { c.fillStyle = "#fff"; c.font = "bold 10px Inter, sans-serif"; c.fillText(String(k + 1), xa + 3, 11); }
    });
    if (analisi) {
      const pk = analisi.picchi, ps = analisi.perSec, nb = pk.length / 2;
      c.fillStyle = "rgba(125,211,252,0.55)";
      for (let x = 0; x < W; x++) {
        const ta = tX(x, v), tb = tX(x + 1, v); let i0 = Math.floor(ta * ps), i1 = Math.max(i0 + 1, Math.floor(tb * ps));
        if (i0 >= nb) break; i1 = Math.min(nb, i1);
        let mi = 0, ma = 0; for (let i = Math.max(0, i0); i < i1; i++) { if (pk[2 * i] < mi) mi = pk[2 * i]; if (pk[2 * i + 1] > ma) ma = pk[2 * i + 1]; }
        c.fillRect(x, ym - ma * hh * 1.6, 1, Math.max(1, (ma - mi) * hh * 1.6));
      }
    } else if (brano) { c.fillStyle = "#8193AE"; c.font = "12px Inter, sans-serif"; c.fillText("leggo il brano…", 10, ym + 4); }
    const B = listaBattiti();
    if (B) {
      const dist = (B.length > 1 ? (B[1] - B[0]) : 1) / v.span * W;
      if (dist > 3) {
        c.fillStyle = prog.battiti ? "rgba(249,157,28,0.75)" : "rgba(249,157,28,0.4)";
        B.forEach(b => { const x = xT(b, v); if (x >= 0 && x <= W) c.fillRect(Math.round(x), y0, 1, y1 - y0); });
      }
    }
    calcolaBarre();
    barre.forEach(o => {
      const xa = xT(o.a, v), xb = Math.max(xa + 3, xT(o.b, v)); if (xb < 0 || xa > W) return;
      const y = H - 29 + o.c * 9;
      c.fillStyle = o.tr === ui.sel ? "#fff" : o.tr.colore; c.globalAlpha = o.k === ui.pagina || o.tr === ui.sel ? 1 : 0.55;
      c.fillRect(xa, y, xb - xa, 7); c.globalAlpha = 1;
    });
  }
  function disegnaOndaSopra(t) {
    const W = G.W, H = G.H, v = vistaTL(), c = sctx;
    c.clearRect(0, 0, W, H);
    if (ui.giro && $("giro").checked) {
      const xa = xT(ui.giro[0], v), xb = xT(ui.giro[1], v);
      c.fillStyle = "rgba(61,190,110,0.18)"; c.fillRect(xa, 0, xb - xa, H);
      c.fillStyle = "#3DBE6E"; c.fillRect(xa, 0, 2, H); c.fillRect(xb - 2, 0, 2, H);
    } else if (ui.giro) { const xa = xT(ui.giro[0], v), xb = xT(ui.giro[1], v); c.fillStyle = "rgba(255,255,255,0.06)"; c.fillRect(xa, 0, xb - xa, H); }
    if (batti) { c.fillStyle = "#E21C48"; batti.colpi.forEach(b => { const x = xT(b, v); c.fillRect(x - 1, 15, 3, H - 46); }); }
    const x = xT(t, v);
    c.fillStyle = "#FF4D6D"; c.fillRect(Math.round(x) - 1, 0, 2, H);
    c.beginPath(); c.moveTo(x - 6, 0); c.lineTo(x + 6, 0); c.lineTo(x, 8); c.closePath(); c.fill();
  }
  function seguiVista(t) {
    const v = vistaTL();
    if (t > v.v0 + v.span * 0.92 || t < v.v0) { ui.vista = t - v.span * 0.08; sporcoOnda = true; }
  }

  /* ---------------- miniature delle pagine ---------------- */
  function aggiornaPagine() {
    const box = $("pagine");
    while (box.children.length > prog.pagine.length) box.lastChild.remove();
    while (box.children.length < prog.pagine.length) {
      const d = document.createElement("div"); d.className = "pag";
      d.innerHTML = '<canvas width="160" height="90"></canvas><span></span>';
      d.title = "Clic: apri la pagina · doppio clic: ascoltala";
      box.appendChild(d);
    }
    [...box.children].forEach((d, k) => {
      d.dataset.i = k; d.querySelector("span").textContent = k + 1;
      const c = d.querySelector("canvas").getContext("2d");
      L.disegna(c, 160, 90, { pagine: [prog.pagine[k]] }, null, { pagina: 0, mostraTutto: true, spessoreBase: 160 * 0.034, senzaTempoColorato: true });
    });
    evidenziaPagine();
  }
  let suonaPrima = -2;
  function evidenziaPagine() {
    const box = $("pagine"), sk = !media.paused ? L.paginaA(prog, tempoOra()) : -1;
    [...box.children].forEach((d, k) => { d.classList.toggle("attiva", k === ui.pagina); d.classList.toggle("suona", k === sk); });
    suonaPrima = sk;
  }

  /* ---------------- ciclo di disegno (solo quando serve) ---------------- */
  function richiedi() { if (!rafId) rafId = requestAnimationFrame(passo); }
  function passo() {
    rafId = 0;
    const t = tempoOra(), suona = !media.paused;
    if (suona) {
      if (ui.giro && $("giro").checked && t >= ui.giro[1] && !disegno && !video) { vaiA(ui.giro[0]); }
      tickMetronomo(t);
      if (disegno && performance.now() - (disegno.barre || 0) > 400) { disegno.barre = performance.now(); sporcoOnda = true; }
      if (disegno && disegno.guidato) avanzaGuidato();
      else if (disegno && disegno.conTempo && performance.now() - disegno.quando > 100) aggiungiPunto(ui.mouse);
      if (!disegno && !assegna) seguiPagina(t);
      seguiVista(t);
      const sk = L.paginaA(prog, t); if (sk !== suonaPrima) evidenziaPagine();
    }
    if (video) passoVideo(t);
    if (presentando) disegnaPresenta(t); else disegnaTela(t);
    if (sporcoOnda) disegnaOndaBase();
    disegnaOndaSopra(t);
    aggiornaOrologio(t);
    if (suona || disegno || video) richiedi();
  }
  function seguiPagina(t) {
    if (ui.modo === "guidato" || ui.modo === "forme") {
      const tt = ui.modo === "forme" ? t : Math.max(0, t - ui.ritardo * media.playbackRate);
      const i = paginaGuidata(tt);
      if (i >= 0) { virtuale = null; if (i !== ui.pagina) vai(i); return; }
      const prima = virtuale;
      virtuale = nuovaGuida(tt);
      if (!prima || prima.inizio !== virtuale.inizio) aggiornaEtichette();
      return;
    }
    virtuale = null;
    const pa = L.paginaA(prog, t);
    if (pa !== ultimaAuto) { ultimaAuto = pa; if (pa !== ui.pagina) vai(pa); }
  }
  function fmt(t) { t = Math.max(0, t); const m = Math.floor(t / 60), s = t - m * 60; return m + ":" + (s < 10 ? "0" : "") + s.toFixed(1); }
  let orologioPrima = "";
  function aggiornaOrologio(t) {
    const s = fmt(t) + " / " + fmt(durata()).replace(/\.\d$/, "");
    if (s !== orologioPrima) { $("orologio").textContent = s; orologioPrima = s; }
  }

  /* ---------------- presentazione ---------------- */
  function dimensionaPresenta() {
    const box = telaP.parentElement, dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = box.clientWidth, h = w / L.ASPETTO; if (h > box.clientHeight) { h = box.clientHeight; w = h * L.ASPETTO; }
    w = Math.floor(w); h = Math.floor(h);
    if (w !== G.pW || h !== G.pH) { G.pW = w; G.pH = h; telaP.style.width = w + "px"; telaP.style.height = h + "px"; telaP.width = Math.round(w * dpr); telaP.height = Math.round(h * dpr); pctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  }
  function disegnaPresenta(t) { L.disegna(pctx, G.pW, G.pH, prog, t, {}); }
  function apriPresenta() {
    if (!prog.pagine.some(p => p.tratti.length)) { avviso("Disegna prima qualche linea."); return; }
    if (disegno) finisciDisegno();
    presentando = true; $("presenta").hidden = false; G.pW = 0;
    const el = $("presenta");
    try { if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); } catch (e) { /* niente schermo intero */ }
    pausa(); if (brano) vaiA(0);
    setTimeout(dimensionaPresenta, 60); dimensionaPresenta(); richiedi();
  }
  function chiudiPresenta() {
    if (!presentando) return;
    presentando = false; $("presenta").hidden = true; pausa();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    richiedi();
  }
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && presentando) chiudiPresenta(); else if (presentando) setTimeout(dimensionaPresenta, 50); });

  /* ---------------- video ---------------- */
  function esportaVideo() {
    if (!brano) { avviso("Prima apri un brano."); return; }
    if (!prog.pagine.some(p => p.tratti.some(haTempo))) { avviso("Non ci sono linee a tempo da mettere nel video."); return; }
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { avviso("Questo browser non sa registrare video: prova con Chrome o Firefox.", true); return; }
    if (disegno) finisciDisegno();
    assicuraCtx();
    if (!sorgente) { sorgente = ctxA.createMediaElementSource(media); sorgente.connect(ctxA.destination); }
    const dest = ctxA.createMediaStreamDestination(); sorgente.connect(dest);
    const cv = document.createElement("canvas"); cv.width = 1280; cv.height = 720;
    const stream = cv.captureStream(30); dest.stream.getAudioTracks().forEach(tk => stream.addTrack(tk));
    const tipi = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    const tipo = tipi.find(x => MediaRecorder.isTypeSupported(x)) || "";
    let rec;
    try { rec = new MediaRecorder(stream, tipo ? { mimeType: tipo, videoBitsPerSecond: 5e6 } : {}); } catch (e) { avviso("Non riesco a registrare il video in questo browser.", true); sorgente.disconnect(dest); return; }
    const pezzi = [];
    rec.ondataavailable = e => { if (e.data && e.data.size) pezzi.push(e.data); };
    rec.onstop = () => {
      try { sorgente.disconnect(dest); } catch (e) { /* già staccato */ }
      if (video && video.annullato) { video = null; aggiornaCtx(); return; }
      scarica(new Blob(pezzi, { type: "video/webm" }), nomeFile() + ".webm");
      video = null; aggiornaCtx(); $("veloVideo").hidden = true; avviso("Video pronto: lo trovi tra i download.", true);
    };
    const fine = Math.min(durata(), L.durata(prog) + 2.5);
    video = { cv, c: cv.getContext("2d"), rec, fine, annullato: false };
    media.playbackRate = 1; $("velocita").value = "1";
    $("veloVideo").hidden = false; $("videoBarra").value = 0;
    media.currentTime = 0; azzeraOrologio();
    aggiornaCtx();
    rec.start(500); play(); richiedi();
  }
  function passoVideo(t) {
    L.disegna(video.c, 1280, 720, prog, t, {});
    $("videoBarra").value = video.fine ? t / video.fine : 0;
    if (t >= video.fine) fineVideo();
  }
  function fineVideo() { if (!video || video.rec.state === "inactive") return; pausa(); video.rec.stop(); }

  /* ---------------- file ---------------- */
  function nomeFile() { return (prog.titolo || "tappa").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tappa"; }
  function scarica(blob, nome) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function comeDataURL(blob) { return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(blob); }); }
  async function salvaFile() {
    const o = JSON.parse(JSON.stringify(prog));
    o.audio = prog.audio ? { nome: prog.audio.nome } : null;
    if (o.audio && prog.audio.url) o.audio.url = prog.audio.url;
    if ($("conAudio").checked && brano && brano.bytes && o.audio) o.audio.dati = await comeDataURL(new Blob([brano.bytes], { type: brano.tipo || "audio/mpeg" }));
    scarica(new Blob([JSON.stringify(o)], { type: "application/json" }), nomeFile() + ".json");
    avviso("Progetto salvato tra i download" + (o.audio && o.audio.dati ? ", con il brano dentro." : "."));
  }
  function caricaProgetto(o, daLocale) {
    if (!o || o.formato !== "musicascuole-linee" || !Array.isArray(o.pagine)) { if (!daLocale) avviso("Questo file non è un progetto dell'editor delle linee.", true); return false; }
    if (!daLocale) salvaStorico();
    const a = o.audio || {};
    const n = Object.assign(nuovo(), o);
    n.pagine = (o.pagine.length ? o.pagine : [{ tratti: [] }]).map(p => ({ tratti: (p.tratti || []).filter(tr => Array.isArray(tr.punti)), ...(p.guida ? { guida: p.guida } : {}) }));
    n.audio = a.nome ? { nome: String(a.nome) } : null;
    const urlOk = typeof a.url === "string" && /^media\/[\w\-./]+\.(mp3|ogg|m4a|mp4|wav|webm)$/i.test(a.url) && !a.url.includes("..");
    if (n.audio && urlOk) n.audio.url = a.url;
    n.impostazioni = Object.assign(nuovo().impostazioni, o.impostazioni || {});
    prog = n; ui.pagina = 0; ui.sel = null; cacheB = {};
    sincronizzaCampi();
    if (typeof a.dati === "string" && /^data:(audio|video)\/[\w.+-]+;base64,/.test(a.dati)) {
      const tipo = a.dati.slice(5, a.dati.indexOf(";"));
      fetch(a.dati).then(r => r.arrayBuffer()).then(bytes => impostaBrano({ nome: n.audio ? n.audio.nome : "brano", tipo, bytes, src: URL.createObjectURL(new Blob([bytes], { type: tipo })) }))
        .catch(() => avviso("Il brano dentro il file non si legge.", true));
    } else if (n.audio && n.audio.url) {
      const es = ESEMPI.find(e => e.file === n.audio.url) || { nome: n.titolo, file: n.audio.url, chiave: "", crediti: n.crediti };
      apriEsempio(es, true);
    } else if (n.audio && brano && brano.nome === n.audio.nome) { /* il brano giusto è già aperto */ }
    else if (n.audio) { avviso(`Ora apri il brano «${n.audio.nome}» (menu Brano).`, true); if (brano) { pausa(); brano = null; media.removeAttribute("src"); media.load(); analisi = null; } }
    modificato(); aggiornaPagine();
    return true;
  }
  async function apriProgettoFile(file) {
    try { caricaProgetto(JSON.parse(await file.text())); }
    catch (e) { avviso("Questo file non si legge come progetto.", true); }
  }
  function apriQualcosa(file) {
    if (!file) return;
    if (/\.json$/i.test(file.name) || file.type === "application/json") apriProgettoFile(file);
    else apriBranoFile(file);
  }
  function nuovoProgetto() {
    salvaStorico();
    const v = prog; prog = nuovo();
    if (brano) { prog.audio = { nome: brano.nome }; if (brano.url) prog.audio.url = brano.url; prog.battiti = v.battiti; prog.bpm = v.bpm; prog.offset = v.offset; }
    ui.pagina = 0; ui.sel = null; sincronizzaCampi(); modificato(); aggiornaPagine();
    avviso("Progetto nuovo (Ctrl+Z per tornare indietro).");
  }

  /* ---------------- interfaccia ---------------- */
  function sincronizzaCampi() {
    $("titolo").value = prog.titolo || "";
    const s = prog.impostazioni || {};
    $("durPag").value = s.durataPagina || 8; $("unitaPag").value = s.unita || "battiti"; $("pagAuto").checked = s.pagineAuto !== false;
    $("bpm").value = prog.bpm ? prog.bpm : "";
  }
  function aggiornaEtichette() {
    const p = pagCorr();
    let s = virtuale ? "Pagina nuova" : `Pagina ${ui.pagina + 1} di ${prog.pagine.length}`;
    const g = virtuale || p.guida;
    if (g && (ui.modo === "guidato" || ui.modo === "forme")) s += g.battiti ? ` · ${g.battiti} battiti` : ` · ${g.durata.toFixed(1)} s`;
    $("etPagina").textContent = s;
    let m = "";
    if (batti) m = "● batti B a ogni battito";
    else if (ui.modo === "tempo") { const q = prossimaSenzaTempo(); m = q ? "linee senza tempo: " + prog.pagine.reduce((n, pg) => n + pg.tratti.filter(x => x.punti.length && x.punti[0][2] == null).length, 0) : "tutte le linee hanno il tempo"; }
    else if (ui.modo === "forme") m = FORME[ui.forma].nome;
    $("etModo").textContent = m; $("etModo").style.display = m ? "" : "none";
  }
  function aggiornaVuoto() { $("vuoto").hidden = !!brano || prog.pagine.some(p => p.tratti.length); }
  function aggiornaStato(testo) {
    let s = testo;
    if (!s) {
      const B = listaBattiti();
      if (!brano) s = "nessun brano";
      else if (!analisi) s = "leggo il brano…";
      else if (B && prog.battiti) s = `${prog.battiti.length} battiti segnati · ${Math.round(prog.bpm || bpmDa(prog.battiti))} al minuto`;
      else if (B) s = `griglia a ${prog.bpm} battiti al minuto · doppio clic sull'onda: il primo battito è qui`;
      else s = "battiti non segnati";
      if (batti) s = `batti B: ${batti.colpi.length} battiti`;
    }
    $("stato").textContent = s;
    if (document.activeElement !== $("bpm")) $("bpm").value = prog.bpm || "";
    aggiornaEtichette();
  }
  function aggiornaSel() {
    const s = ui.sel;
    $("boxSel").classList.toggle("nascosto", !s); $("selCampi").classList.remove("nascosto"); $("selVuota").classList.add("nascosto");
    if (!s) { $("selInfo").textContent = ""; return; }
    if (haTempo(s)) { const [a, b] = tempiEstremi(s); $("selInizio").value = a.toFixed(2); $("selFine").value = b < 1e8 ? b.toFixed(2) : ""; $("selInfo").textContent = (b - a).toFixed(1) + " s"; }
    else { $("selInizio").value = ""; $("selFine").value = ""; $("selInfo").textContent = "senza tempo"; }
  }
  function impostaModo(m) {
    if (disegno) finisciDisegno();
    ui.modo = m; virtuale = null;
    document.querySelectorAll(".attr[data-modo]").forEach(b => b.classList.toggle("attivo", b.dataset.modo === m));
    $("boxModoTitolo").textContent = MODI[m][0]; $("aiutoModo").innerHTML = MODI[m][1];
    $("opzGuidato").classList.toggle("nascosto", !(m === "guidato" || m === "forme"));
    $("opzForme").classList.toggle("nascosto", m !== "forme");
    $("opzTempo").classList.toggle("nascosto", m !== "tempo");
    tela.style.cursor = m === "seleziona" ? "default" : m === "gomma" ? "cell" : "crosshair";
    if (m === "forme" && !listaBattiti() && analisi) trovaBattiti();
    aggiornaEtichette(); richiedi();
  }
  function costruisci() {
    const col = $("colori");
    L.PALETTE.forEach((c, i) => {
      const b = document.createElement("button"); b.style.background = c; b.title = "Colore"; b.setAttribute("aria-label", "Colore " + (i + 1));
      if (i === 0) b.classList.add("attivo");
      b.onclick = () => {
        ui.colore = c; col.querySelectorAll("button").forEach(x => x.classList.toggle("attivo", x === b));
        if (ui.sel) { salvaStorico(); ui.sel.colore = c; modificato(); }
        richiedi();
      };
      col.appendChild(b);
    });
    const sp = $("spessori");
    SPESSORI.forEach((s, i) => {
      const b = document.createElement("button"); b.title = "Spessore"; b.setAttribute("aria-label", "Spessore " + (i + 1));
      b.innerHTML = `<span style="height:${Math.round(3 + i * 3.5)}px"></span>`;
      if (s === 1) b.classList.add("attivo");
      b.onclick = () => {
        ui.spessore = s; sp.querySelectorAll("button").forEach(x => x.classList.toggle("attivo", x === b));
        if (ui.sel) { salvaStorico(); ui.sel.spessore = s; modificato(); }
      };
      sp.appendChild(b);
    });
    const fo = $("sceltaForme");
    Object.keys(FORME).forEach(k => {
      const b = document.createElement("button"); b.className = "btn piccolo" + (k === ui.forma ? " attivo" : ""); b.title = FORME[k].nome;
      let d = ""; for (let j = 0; j <= 60; j++) { const φ = j / 60 * 2.5, [dx, dy] = FORME[k].f(φ); d += (j ? "L" : "M") + (2 + j / 60 * 34 + dx * 3.2).toFixed(1) + " " + (9 + dy * 6).toFixed(1); }
      b.innerHTML = `<svg width="38" height="18" viewBox="0 0 38 18"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      b.onclick = () => { ui.forma = k; fo.querySelectorAll("button").forEach(x => x.classList.toggle("attivo", x === b)); aggiornaEtichette(); richiedi(); };
      fo.appendChild(b);
    });
    const es = $("esempi");
    ESEMPI.forEach(e => {
      const b = document.createElement("button");
      b.innerHTML = `<svg class="ico"><use href="#i-musica"/></svg><span>${e.nome}<span style="display:block;font-size:11px;color:#9FB3CE;font-weight:400">${e.crediti}</span></span>`;
      b.onclick = () => { chiudiMenu(); apriEsempio(e); }; es.appendChild(b);
    });
  }
  function chiudiMenu() { $("menuBrano").hidden = true; $("menuFile").hidden = true; }

  /* ---------- eventi: tela ---------- */
  tela.addEventListener("pointerdown", e => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    try { tela.setPointerCapture(e.pointerId); } catch (er) { /* niente */ }
    const p = posMouse(e); ui.mouse = p; chiudiMenu();
    switch (ui.modo) {
      case "libero": iniziaLibero(p); break;
      case "guidato": case "forme": iniziaGuidato(p); break;
      case "tempo": if (!media.paused) iniziaAssegna(p, "mouse"); else iniziaLibero(p, true); break;
      case "seleziona": selezionaA(p); break;
      case "gomma": salvaStorico(); gommaAttiva = { tolte: 0 }; gommaA(p); break;
    }
    richiedi();
  });
  tela.addEventListener("pointermove", e => {
    const p = posMouse(e); ui.mouse = p;
    if (disegno && !disegno.guidato) {
      const ev = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      (ev.length ? ev : [e]).forEach(x => aggiungiPunto(posMouse(x)));
    } else if (assegna && assegna.come === "mouse") seguiAssegna(p);
    else if (trascinaSel) {
      const dx = p[0] - trascinaSel.p0[0], dy = p[1] - trascinaSel.p0[1];
      trascinaSel.tr.punti.forEach((q, i) => { q[0] = r4(trascinaSel.orig[i][0] + dx); q[1] = r4(trascinaSel.orig[i][1] + dy); });
      trascinaSel.mosso = true;
    } else if (gommaAttiva) gommaA(p);
    richiedi();
  });
  const suGiu = () => {
    if (disegno) finisciDisegno();
    if (assegna && assegna.come === "mouse") finisciAssegna();
    if (trascinaSel) { if (!trascinaSel.mosso) storico.pop(); else modificato(); trascinaSel = null; aggiornaAnnulla(); }
    if (gommaAttiva) { if (!gommaAttiva.tolte) storico.pop(); gommaAttiva = null; aggiornaAnnulla(); }
    richiedi();
  };
  tela.addEventListener("pointerup", suGiu);
  tela.addEventListener("pointercancel", suGiu);
  tela.addEventListener("pointerleave", () => { if (!disegno && !trascinaSel) richiedi(); });
  let ultimaRotella = 0;
  tela.addEventListener("wheel", e => {
    if (ui.modo !== "seleziona" || !ui.sel) return;
    e.preventDefault();
    if (performance.now() - ultimaRotella > 600) salvaStorico();
    ultimaRotella = performance.now();
    const f = e.deltaY < 0 ? 1.05 : 1 / 1.05, b = scatola(ui.sel), cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    ui.sel.punti.forEach(q => { q[0] = r4(cx + (q[0] - cx) * f); q[1] = r4(cy + (q[1] - cy) * f); });
    modificato();
  }, { passive: false });

  /* ---------- eventi: linea del tempo ---------- */
  const lt = $("lineaTempo");
  let tlDrag = null;
  lt.addEventListener("pointerdown", e => {
    const r = lt.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, v = vistaTL(), t = tX(x, v);
    try { lt.setPointerCapture(e.pointerId); } catch (er) { /* niente */ }
    if (e.shiftKey) { tlDrag = { tipo: "giro", a: t }; ui.giro = [t, t]; $("giro").checked = true; richiedi(); return; }
    if (y >= G.H - 30) {
      const o = barre.slice().reverse().find(o => { const xa = xT(o.a, v), xb = Math.max(xa + 3, xT(o.b, v)), yy = G.H - 29 + o.c * 9; return x >= xa - 3 && x <= xb + 3 && y >= yy - 2 && y <= yy + 9; });
      if (o) {
        const xa = xT(o.a, v), xb = Math.max(xa + 3, xT(o.b, v));
        const tipo = xb - xa > 14 && x < xa + 5 ? "inizio" : xb - xa > 14 && x > xb - 5 ? "fine" : "tutto";
        salvaStorico();
        ui.sel = o.tr; if (o.k !== ui.pagina) vai(o.k);
        tlDrag = { tipo, x0: x, tr: o.tr, orig: o.tr.punti.map(p => p.slice()), a: o.a, b: o.b, mosso: false };
        aggiornaSel(); sporcoOnda = true; richiedi(); return;
      }
    }
    tlDrag = { tipo: "cerca" }; vaiA(t, true);
  });
  lt.addEventListener("pointermove", e => {
    if (!tlDrag) return;
    const r = lt.getBoundingClientRect(), x = e.clientX - r.left, v = vistaTL(), t = limita(tX(x, v), 0, durata());
    if (tlDrag.tipo === "cerca") vaiA(t, true);
    else if (tlDrag.tipo === "giro") { ui.giro = [Math.min(tlDrag.a, t), Math.max(tlDrag.a, t)]; richiedi(); }
    else {
      let dt = (x - tlDrag.x0) / G.W * v.span;
      const { a, b, tr, orig } = tlDrag;
      tr.punti = orig.map(p => p.slice());
      if (tlDrag.tipo === "tutto") { if (ui.calamita && listaBattiti()) dt = battitoVicino(a + dt) - a; spostaTempi(tr, Math.max(-a, dt)); }
      else if (tlDrag.tipo === "inizio") { let na = a + dt; if (ui.calamita) na = battitoVicino(na); rimappa(tr, Math.max(0, Math.min(na, b - 0.05)), b); }
      else { let nb = b + dt; if (ui.calamita) nb = battitoVicino(nb); rimappa(tr, a, Math.max(nb, a + 0.05)); }
      tlDrag.mosso = true; sporcoOnda = true; aggiornaSel(); richiedi();
    }
  });
  const fineTL = () => {
    if (!tlDrag) return;
    if (tlDrag.tipo === "giro" && ui.giro && ui.giro[1] - ui.giro[0] < 0.3) { ui.giro = null; $("giro").checked = false; }
    if (tlDrag.tipo === "giro" && ui.giro) avviso("Il pezzo segnato si ripete. Togli «Ripeti il pezzo» per smettere.");
    if (tlDrag.tr) { if (tlDrag.mosso) modificato(); else { storico.pop(); aggiornaAnnulla(); } }
    tlDrag = null; richiedi();
  };
  lt.addEventListener("pointerup", fineTL); lt.addEventListener("pointercancel", fineTL);
  lt.addEventListener("dblclick", e => {
    if (prog.battiti || !prog.bpm) return;
    const r = lt.getBoundingClientRect(), t = tX(e.clientX - r.left, vistaTL());
    salvaStorico(); prog.offset = r3(t); cacheB = {}; modificato(); avviso("La griglia dei battiti ora parte da qui.");
  });
  lt.addEventListener("wheel", e => {
    e.preventDefault();
    const r = lt.getBoundingClientRect(), x = e.clientX - r.left, v = vistaTL();
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) { ui.vista += (e.deltaX || e.deltaY) / G.W * v.span; }
    else {
      const t = tX(x, v); ui.zoom = limita(ui.zoom * (e.deltaY < 0 ? 1.2 : 1 / 1.2), 1, 40);
      const span = Math.max(1, durata() / ui.zoom); ui.vista = t - x / G.W * span; $("zoom").value = Math.min(20, ui.zoom);
    }
    sporcoOnda = true; richiedi();
  }, { passive: false });

  /* ---------- eventi: pulsanti ---------- */
  $("btnBrano").onclick = e => { e.stopPropagation(); const m = $("menuBrano"); const h = m.hidden; chiudiMenu(); m.hidden = !h; };
  $("btnFile").onclick = e => { e.stopPropagation(); const m = $("menuFile"); const h = m.hidden; chiudiMenu(); m.hidden = !h; };
  document.addEventListener("click", e => { if (!e.target.closest(".menu")) chiudiMenu(); });
  $("apriFile").onclick = () => { chiudiMenu(); $("sceltaFile").click(); };
  $("vuotoFile").onclick = () => $("sceltaFile").click();
  $("vuotoEsempio").onclick = () => apriEsempio(ESEMPI[0]);
  $("sceltaFile").onchange = e => { apriQualcosa(e.target.files[0]); e.target.value = ""; };
  $("sceltaProgetto").onchange = e => { apriQualcosa(e.target.files[0]); e.target.value = ""; };
  $("nuovo").onclick = () => { chiudiMenu(); nuovoProgetto(); };
  $("apriProgetto").onclick = () => { chiudiMenu(); $("sceltaProgetto").click(); };
  $("salva").onclick = () => { chiudiMenu(); salvaFile(); };
  $("conAudio").onclick = e => e.stopPropagation();
  $("video").onclick = () => { chiudiMenu(); esportaVideo(); };
  $("videoStop").onclick = () => { if (video) { video.annullato = true; fineVideo(); } $("veloVideo").hidden = true; };
  $("infoBtn").onclick = () => {
    chiudiMenu();
    $("infoTitolo").value = prog.titolo || ""; $("infoAutore").value = prog.autore || ""; $("infoCrediti").value = prog.crediti || ""; $("infoAnticipo").value = prog.anticipo == null ? 0.8 : prog.anticipo;
    $("veloInfo").hidden = false;
  };
  $("infoTitolo").oninput = e => { prog.titolo = e.target.value; $("titolo").value = prog.titolo; salvaLocale(); };
  $("infoAutore").oninput = e => { prog.autore = e.target.value; salvaLocale(); };
  $("infoCrediti").oninput = e => { prog.crediti = e.target.value; salvaLocale(); };
  $("infoAnticipo").oninput = e => { prog.anticipo = limita(+e.target.value || 0, 0, 3); salvaLocale(); };
  $("titolo").oninput = e => { prog.titolo = e.target.value; salvaLocale(); };
  $("annulla").onclick = annulla; $("rifai").onclick = rifai;
  $("aiuto").onclick = () => { $("veloAiuto").hidden = false; };
  $("presentaBtn").onclick = apriPresenta;
  document.querySelectorAll("[data-chiudi]").forEach(b => b.onclick = () => { b.closest(".velo").hidden = true; });
  document.querySelectorAll(".velo").forEach(v => v.addEventListener("click", e => { if (e.target === v && v.id !== "veloVideo") v.hidden = true; }));
  document.querySelectorAll(".attr[data-modo]").forEach(b => b.onclick = () => impostaModo(b.dataset.modo));
  $("durPag").onchange = e => { prog.impostazioni.durataPagina = limita(Math.round(+e.target.value || 8), 1, 64); e.target.value = prog.impostazioni.durataPagina; salvaLocale(); };
  $("unitaPag").onchange = e => { prog.impostazioni.unita = e.target.value; salvaLocale(); };
  $("pagAuto").onchange = e => { prog.impostazioni.pagineAuto = e.target.checked; salvaLocale(); };
  $("cicli").onchange = e => { ui.cicli = +e.target.value; richiedi(); };
  $("ampiezza").oninput = e => { ui.ampiezza = +e.target.value; richiedi(); };
  $("togliTempo").onclick = () => {
    const tr = pagCorr().tratti.filter(haTempo); if (!tr.length) { avviso("In questa pagina nessuna linea ha il tempo."); return; }
    salvaStorico(); tr.forEach(x => x.punti.forEach(p => { p[2] = null; })); delete pagCorr().guida; modificato();
    avviso("Ora premi play e dai di nuovo il tempo alle linee.");
  };
  $("pagNuova").onclick = nuovaPagina; $("pagDuplica").onclick = duplicaPagina; $("pagSvuota").onclick = svuotaPagina; $("pagElimina").onclick = eliminaPagina;
  $("pagine").addEventListener("click", e => { const d = e.target.closest(".pag"); if (d) { virtuale = null; vai(+d.dataset.i); } });
  $("pagine").addEventListener("dblclick", e => {
    const d = e.target.closest(".pag"); if (!d) return;
    const p = prog.pagine[+d.dataset.i], tp = p.guida ? [p.guida.inizio] : L.tempiPagina(p);
    if (tp && brano) { vaiA(Math.max(0, tp[0] - 0.6)); play(); }
  });
  $("fantasma").onchange = e => { ui.fantasma = e.target.checked; richiedi(); };
  $("tuttoColorato").onchange = e => { ui.tuttoColorato = e.target.checked; richiedi(); };
  $("selDuplica").onclick = duplicaSel; $("selElimina").onclick = eliminaSel; $("selDopo").onclick = mandaDopo;
  $("selRipeti").onclick = () => { if (ui.sel) { $("ripUnita").value = listaBattiti() ? "battiti" : "secondi"; $("veloRipeti").hidden = false; } };
  $("ripOk").onclick = ripeti;
  const cambiaTempiSel = () => {
    const s = ui.sel; if (!s) return;
    let a = parseFloat($("selInizio").value), b = parseFloat($("selFine").value);
    if (!isFinite(a)) return;
    if (!haTempo(s)) { salvaStorico(); s.punti.forEach(p => { p[2] = a; }); b = isFinite(b) ? b : a + 2; rimappa(s, a, Math.max(b, a + 0.05)); modificato(); return; }
    if (!isFinite(b) || b <= a) b = a + (tempiEstremi(s)[1] - tempiEstremi(s)[0]);
    salvaStorico(); rimappa(s, Math.max(0, a), Math.max(b, a + 0.05)); modificato();
  };
  $("selInizio").onchange = cambiaTempiSel; $("selFine").onchange = cambiaTempiSel;
  document.querySelectorAll("[data-sistema]").forEach(b => b.onclick = () => sistema(b.dataset.sistema));
  document.querySelectorAll("[data-sposta]").forEach(b => b.onclick = () => {
    const tr = trattiAmbito().filter(haTempo); if (!tr.length) return;
    salvaStorico(); tr.forEach(x => spostaTempi(x, +b.dataset.sposta)); modificato();
  });
  $("ritardo").onchange = e => { ui.ritardo = limita(+e.target.value || 0, 0, 0.5); try { localStorage.setItem("editorLinee.ritardo", ui.ritardo); } catch (er) { /* niente */ } };
  $("tInizio").onclick = () => vaiA(0, true);
  $("tIndietro").onclick = () => vaiA(tempoOra() - 5, true);
  $("tAvanti").onclick = () => vaiA(tempoOra() + 5, true);
  $("tPlay").onclick = playPausa;
  $("velocita").onchange = e => { media.playbackRate = +e.target.value; azzeraOrologio(); };
  $("giro").onchange = e => { if (e.target.checked && !ui.giro) { avviso("Segna il pezzo sull'onda sonora trascinando con Maiusc premuto."); e.target.checked = false; } richiedi(); };
  $("bpm").onchange = e => {
    const v = parseFloat(e.target.value);
    salvaStorico();
    if (!(v >= 30 && v <= 240)) { prog.bpm = null; if (!prog.battiti) e.target.value = ""; }
    else { prog.offset = prog.battiti ? prog.battiti[0] : (prog.offset || 0); prog.battiti = null; prog.bpm = v; }
    cacheB = {}; modificato();
  };
  $("trovaBattiti").onclick = trovaBattiti;
  $("registraBattiti").onclick = () => { if (batti) fineBatti(); else battiTasto(); };
  $("metronomo").onclick = () => toggleMetronomo();
  function toggleMetronomo() {
    ui.metronomo = !ui.metronomo; $("metronomo").classList.toggle("attivo", ui.metronomo);
    if (ui.metronomo && !listaBattiti()) avviso("Il metronomo suona sui battiti: prima «Trova» o «Batti il tempo».");
    if (ui.metronomo) assicuraCtx();
    aggiornaCtx();
  }
  $("calamita").onchange = e => { ui.calamita = e.target.checked; if (ui.calamita && !listaBattiti()) avviso("«Aggancia» usa i battiti: prima «Trova» o «Batti il tempo»."); };
  $("zoom").oninput = e => { const t = tempoOra(); ui.zoom = +e.target.value; const span = Math.max(1, durata() / ui.zoom); ui.vista = t - span * 0.3; sporcoOnda = true; richiedi(); };
  $("pChiudi").onclick = chiudiPresenta;
  $("pPlay").onclick = playPausa;
  $("pRicomincia").onclick = () => { vaiA(0); play(); };
  $("pLento").onclick = () => {
    const lento = media.playbackRate === 1; media.playbackRate = lento ? 0.75 : 1; $("velocita").value = String(media.playbackRate);
    $("pLento").textContent = lento ? "Velocità normale" : "Più lento"; azzeraOrologio();
  };
  telaP.addEventListener("click", playPausa);

  /* trascinare file sulla pagina */
  let contaDrag = 0;
  window.addEventListener("dragenter", e => { e.preventDefault(); contaDrag++; $("lascia").classList.add("su"); });
  window.addEventListener("dragleave", () => { if (--contaDrag <= 0) { contaDrag = 0; $("lascia").classList.remove("su"); } });
  window.addEventListener("dragover", e => e.preventDefault());
  window.addEventListener("drop", e => { e.preventDefault(); contaDrag = 0; $("lascia").classList.remove("su"); apriQualcosa(e.dataTransfer.files[0]); });

  /* tastiera */
  let ultimaFreccia = 0;
  document.addEventListener("keydown", e => {
    const el = e.target, scrive = el && (el.tagName === "INPUT" && !["checkbox", "range", "button"].includes(el.type) || el.tagName === "SELECT" || el.tagName === "TEXTAREA");
    const k = e.key, ctrl = e.ctrlKey || e.metaKey;
    if (k === "Escape") {
      if (batti) { fineBatti(); return; }
      if (presentando) { chiudiPresenta(); return; }
      const aperta = [...document.querySelectorAll(".velo")].find(v => !v.hidden && v.id !== "veloVideo");
      if (aperta) { aperta.hidden = true; return; }
      chiudiMenu(); if (ui.sel) { ui.sel = null; aggiornaSel(); richiedi(); }
      return;
    }
    if (scrive) return;
    if (ctrl && (k === "z" || k === "Z")) { e.preventDefault(); e.shiftKey ? rifai() : annulla(); return; }
    if (ctrl && (k === "y" || k === "Y")) { e.preventDefault(); rifai(); return; }
    if (ctrl && (k === "s" || k === "S")) { e.preventDefault(); salvaFile(); return; }
    if (ctrl && (k === "d" || k === "D")) { e.preventDefault(); duplicaSel(); return; }
    if (ctrl || e.altKey) return;
    if (presentando) { if (k === " ") { e.preventDefault(); playPausa(); } return; }
    if (k === " ") { e.preventDefault(); playPausa(); return; }
    if (e.repeat && (k === "b" || k === "B" || k === "t" || k === "T")) return;
    if (k === "b" || k === "B") { e.preventDefault(); battiTasto(); return; }
    if (k === "t" || k === "T") {
      if (ui.modo !== "tempo") { avviso("Il tasto T serve nella modalità «Poi tempo»."); return; }
      if (media.paused) { avviso("Premi play, poi tieni premuto T mentre la linea deve colorarsi."); return; }
      if (!assegna) iniziaAssegna(null, "tasto"); return;
    }
    if (k === "m" || k === "M") { toggleMetronomo(); return; }
    if (k === "p" || k === "P") { apriPresenta(); return; }
    if (k === "n" || k === "N") { nuovaPagina(); return; }
    if (k >= "1" && k <= "6") { impostaModo(["libero", "guidato", "forme", "tempo", "seleziona", "gomma"][+k - 1]); return; }
    if (k === "PageUp") { e.preventDefault(); virtuale = null; vai(ui.pagina - 1); return; }
    if (k === "PageDown") { e.preventDefault(); virtuale = null; vai(ui.pagina + 1); return; }
    if (k === "Home") { e.preventDefault(); vaiA(0, true); return; }
    if ((k === "Delete" || k === "Backspace") && ui.sel) { e.preventDefault(); eliminaSel(); return; }
    if (k.startsWith("Arrow")) {
      e.preventDefault();
      if (ui.sel) {
        if (performance.now() - ultimaFreccia > 800) salvaStorico();
        ultimaFreccia = performance.now();
        const d = e.shiftKey ? 0.02 : 0.005, dx = k === "ArrowLeft" ? -d : k === "ArrowRight" ? d : 0, dy = k === "ArrowUp" ? -d : k === "ArrowDown" ? d : 0;
        ui.sel.punti.forEach(q => { q[0] = r4(q[0] + dx); q[1] = r4(q[1] + dy); }); modificato();
      } else if (k === "ArrowLeft" || k === "ArrowRight") vaiA(tempoOra() + (k === "ArrowLeft" ? -2 : 2), true);
    }
  });
  document.addEventListener("keyup", e => { if ((e.key === "t" || e.key === "T") && assegna && assegna.come === "tasto") finisciAssegna(); });

  /* ---------------- avvio ---------------- */
  costruisci();
  try { const r = parseFloat(localStorage.getItem("editorLinee.ritardo")); if (isFinite(r)) { ui.ritardo = r; $("ritardo").value = r; } } catch (e) { /* niente */ }
  impostaModo("libero");
  if (window.ResizeObserver) { const ro = new ResizeObserver(dimensiona); ro.observe($("palco")); ro.observe(lt); }
  window.addEventListener("resize", dimensiona);
  dimensiona();
  let ripreso = false;
  try {
    const s = localStorage.getItem(CHIAVE);
    if (s) { const o = JSON.parse(s); if (o && o.pagine && (o.pagine.some(p => p.tratti && p.tratti.length) || (o.audio && o.audio.url))) ripreso = caricaProgetto(o, true); }
  } catch (e) { /* archivio non disponibile */ }
  if (ripreso && prog.pagine.some(p => p.tratti.length)) avviso("Ho ripreso il lavoro che avevi lasciato.");
  sincronizzaCampi(); aggiornaPagine(); aggiornaAnnulla(); aggiornaSel(); aggiornaVuoto(); aggiornaStato(); richiedi();

  /* per le prove automatiche */
  window.__editor = { get prog() { return prog; }, ui, media, tempoOra, vaiA, listaBattiti, formaPerfetta, caricaProgetto, get analisi() { return analisi; } };
})();
