/* =========================================================
   storia-attivita.js — per le pagine della storia della musica:
   🗺️ mappa concettuale, ✏️ esercizi alla LIM e 🖨️ schede da stampare.
   È uguale per tutte le epoche: cambiano solo i dati (ATTIVITA) che la pagina gli passa.

   Uso (in fondo allo script della pagina, prima di adatta-schermo.js):
     StoriaAttivita.avvia({ epoca, date, img, capitoli, strumenti, linea, attivita,
                            apriCapitolo, preparaSchermo });
   La pagina deve avere i contenitori #vistaMappa, #vistaEsercizi, #vistaSchede;
   la finestra degli esercizi (#attivita, #aTelaio) e il foglio di stampa (#stampa)
   li crea questo script. Niente viene salvato o inviato: tutto resta nella pagina.
   Il formato dei dati è spiegato in _sviluppo/storia/LEGGIMI.md.
   ========================================================= */
(function () {
  "use strict";
  const COLORI = ["#E21C48", "#F99D1C", "#FFF428", "#BED958", "#009C95", "#5E50A1", "#CF3E96"];   // do re mi fa sol la si
  const $ = id => document.getElementById(id);
  const testo = h => String(h).replace(/<[^>]+>/g, "");
  // numeri casuali "fissi" (stessa verifica A ogni volta che si stampa)
  function rngDa(seme) {
    let s = 0; for (const ch of String(seme)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
    return function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function mescola(a, rng) { a = a.slice(); rng = rng || Math.random; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  let C = null, A = null;            // configurazione e dati dell'epoca
  let breve = false, conImg = true, conSol = true;

  /* =========================================================
     MAPPA CONCETTUALE
     ========================================================= */
  // buchi: insieme di parole da nascondere (null = mappa completa)
  function mappaHTML(buchi, cliccabile) {
    const M = A.mappa;
    const parola = w => buchi && buchi.has(w) ? `<span class="m-buco" data-w="${w}"></span>` : `<span>${w}</span>`;
    const nodo = n => {
      const i = C.capitoli.findIndex(c => c.id === n.cap);
      const tit = buchi && buchi.has(n.titolo) ? `<span class="m-buco" data-w="${n.titolo}"></span>` : n.titolo;
      const dentro = `<b>${tit}</b><span class="m-parole">${n.parole.map(parola).join("")}</span>` +
        (cliccabile && i >= 0 ? `<span class="m-vai">Capitolo ${i + 1} ›</span>` : "");
      return cliccabile && i >= 0 ? `<button type="button" class="m-nodo" data-cap="${i}">${dentro}</button>` : `<div class="m-nodo">${dentro}</div>`;
    };
    const ramo = (r, k) => `<div class="m-ramo ${r.classe}"><div class="m-testa">${r.icona} ${r.nome} <small>${r.sotto}</small></div>
      <div class="m-nodi">${r.nodi.map(nodo).join("")}</div></div>`;
    return `<div class="mappa">${ramo(M.rami[0], 0)}<div class="m-radice"><b>${C.epoca}</b><span>${C.date}</span>${M.centro ? `<div style="font-size:12.5px;margin-top:6px">${M.centro}</div>` : ""}</div>${ramo(M.rami[1], 1)}</div>`;
  }
  function tutteLeParoleDellaMappa() {
    const s = [];
    A.mappa.rami.forEach(r => r.nodi.forEach(n => { s.push(n.titolo); n.parole.forEach(p => s.push(p)); }));
    return s;
  }

  /* =========================================================
     FINESTRA DEGLI ESERCIZI (stessa grafica dei capitoli)
     ========================================================= */
  let fin, corpo, nav, chiudiFn = null;
  function creaFinestra() {
    fin = document.createElement("section");
    fin.className = "capitolo attivita"; fin.id = "attivita"; fin.hidden = true;
    fin.innerHTML = `<div class="c-telaio" id="aTelaio">
      <div class="c-barra"><button type="button" class="c-indice" id="aChiudi">◀ Torna</button>
        <div class="c-testa"><span class="c-label" id="aLabel"></span><h2 id="aTitolo"></h2></div><span class="c-num" id="aNum"></span></div>
      <div class="a-corpo" id="aCorpo"></div>
      <nav class="c-nav" id="aNav"></nav></div>`;
    document.body.appendChild(fin);
    corpo = $("aCorpo"); nav = $("aNav");
    $("aChiudi").addEventListener("click", chiudi);
    document.addEventListener("keydown", e => {
      if (fin.hidden) return;
      if (e.key === "Escape" && !document.querySelector(".velo.aperto")) { chiudi(); e.stopImmediatePropagation(); }
    }, true);
  }
  function apri(label, titolo, colore) {
    fin.style.setProperty("--accent", colore || "#5EC8D8");
    $("aLabel").textContent = label; $("aTitolo").textContent = titolo; $("aNum").textContent = "";
    corpo.innerHTML = ""; nav.innerHTML = ""; chiudiFn = null;
    fin.hidden = false; document.body.classList.add("in-capitolo");
  }
  function chiudi() {
    if (chiudiFn) chiudiFn();
    fin.hidden = true; corpo.innerHTML = ""; document.body.classList.remove("in-capitolo");
  }
  const bottone = (t, cls) => `<button type="button" class="c-freccia ${cls || ""}">${t}</button>`;
  function barra(sx, centro, dx) { nav.innerHTML = `${sx || "<span></span>"}<div class="c-pallini">${centro || ""}</div>${dx || "<span></span>"}`; }
  function msg(t) { const m = corpo.querySelector(".a-msg") || nav.querySelector(".c-pallini"); if (m) m.innerHTML = t; }

  /* ---------- COLLEGA: tocca a sinistra, poi a destra ---------- */
  function esCollega(es) {
    apri("Esercizio · Collega", es.titolo, "#009C95");
    const giro = () => {
      const coppie = mescola(es.coppie()).slice(0, 7);
      const sx = coppie.map((c, i) => ({ i, c })), dx = mescola(sx);
      corpo.innerHTML = `<div class="a-intro">${es.istruzioni}</div><div class="collega${coppie[0][0].img ? " immagini" : ""}"><div class="col">${sx.map(o =>
          `<button type="button" class="cl sx" data-i="${o.i}"><span class="pal"></span>${o.c[0].img ? `<img src="${C.img + o.c[0].img}" alt="${o.c[0].alt || ""}">` : `<b>${o.c[0]}</b>`}</button>`).join("")}</div>
        <div class="col">${dx.map(o => `<button type="button" class="cl dx" data-i="${o.i}"><span class="pal"></span><span>${o.c[1]}</span></button>`).join("")}</div></div>
        <div class="a-msg">Collegate: 0 su ${coppie.length}</div>`;
      let scelto = null, fatte = 0;
      corpo.querySelector(".collega").addEventListener("click", e => {
        const b = e.target.closest(".cl"); if (!b || b.classList.contains("fatto")) return;
        if (!scelto || scelto.classList.contains("sx") === b.classList.contains("sx")) {
          if (scelto) scelto.classList.remove("scelto");
          scelto = b === scelto ? null : b; if (scelto) scelto.classList.add("scelto"); return;
        }
        const a = scelto; scelto = null; a.classList.remove("scelto");
        if (a.dataset.i === b.dataset.i) {
          const col = COLORI[fatte % COLORI.length]; fatte++;
          [a, b].forEach(x => { x.classList.add("fatto"); x.style.setProperty("--c", col); });
          msg(fatte === coppie.length ? "🎉 Tutte giuste! Bravissimi!" : `Collegate: ${fatte} su ${coppie.length}`);
        } else {
          [a, b].forEach(x => { x.classList.remove("no"); void x.offsetWidth; x.classList.add("no"); });
          msg(`Non è la coppia giusta: riprova! (collegate: ${fatte} su ${coppie.length})`);
        }
      });
    };
    giro();
    barra("", "", bottone("🔀 Nuove coppie", "avanti"));
    nav.lastElementChild.addEventListener("click", giro);
  }

  /* ---------- VERO O FALSO: una frase alla volta ---------- */
  function esVF() {
    apri("Esercizio", "Vero o falso?", "#F99D1C");
    let lista, k, giuste;
    const inizio = () => { lista = mescola(A.vf); k = 0; giuste = 0; mostra(); };
    const mostra = () => {
      if (k >= lista.length) {
        corpo.innerHTML = `<div class="vf"><div class="n">Fine!</div><div class="finale">Risposte giuste: ${giuste} su ${lista.length}</div>
          <div class="esito">${giuste === lista.length ? "Perfetto! 🎉" : giuste >= lista.length * 0.7 ? "Molto bene! 👏" : "Rileggi i capitoli e riprova: andrà meglio! 💪"}</div></div>`;
        barra("", "", bottone("🔁 Ricomincia", "avanti")); nav.lastElementChild.addEventListener("click", inizio);
        $("aNum").textContent = ""; return;
      }
      const [frase, vero, perche] = lista[k];
      $("aNum").textContent = `Frase ${k + 1} di ${lista.length}`;
      corpo.innerHTML = `<div class="vf"><div class="n">Frase ${k + 1} di ${lista.length}</div><div class="frase">${frase}</div>
        <div class="tasti"><button type="button" class="v">✔ VERO</button><button type="button" class="f">✘ FALSO</button></div>
        <div class="esito"></div><div class="punti">Giuste finora: ${giuste}</div></div>`;
      barra("", "", bottone("Avanti ▶", "avanti")); const av = nav.lastElementChild; av.disabled = true;
      av.addEventListener("click", () => { k++; mostra(); });
      corpo.querySelector(".tasti").addEventListener("click", e => {
        const b = e.target.closest("button"); if (!b || b.disabled) return;
        const mio = b.classList.contains("v"), ok = mio === vero; if (ok) giuste++;
        corpo.querySelectorAll(".tasti button").forEach(x => x.disabled = true); b.classList.add("mio");
        corpo.querySelector(".esito").innerHTML = `<b class="${ok ? "ok" : "ko"}">${ok ? "Giusto!" : "Sbagliato:"}</b> è <b>${vero ? "vero" : "falso"}</b>. ${perche || ""}`;
        corpo.querySelector(".punti").textContent = `Giuste finora: ${giuste}`;
        av.disabled = false; av.focus({ preventScroll: true });
      });
    };
    inizio();
  }

  /* ---------- COMPLETA LA MAPPA: tocca una parola, poi il suo posto ---------- */
  function esMappa() {
    apri("Esercizio", "Completa la mappa", "#a78bfa");
    const giro = () => {
      const buchi = new Set(breve ? A.mappaBuchiBreve : A.mappaBuchi);
      const banca = mescola([...buchi, ...(A.mappaDistrattori || [])]);
      corpo.innerHTML = mappaHTML(buchi, false) + `<div class="banca">${banca.map(w => `<button type="button" data-w="${w}">${w}</button>`).join("")}</div>`;
      let parola = null, posto = null, messi = 0;
      const prova = () => {
        if (!parola || !posto) return;
        if (parola.dataset.w === posto.dataset.w) {
          posto.textContent = parola.dataset.w; posto.classList.add("pieno"); posto.classList.remove("scelto");
          parola.classList.add("usato"); messi++;
          msg(messi === buchi.size ? "🎉 Mappa completa! Bravissimi!" : `Parole al posto giusto: ${messi} su ${buchi.size}`);
        } else {
          posto.classList.remove("no", "scelto"); void posto.offsetWidth; posto.classList.add("no");
          msg("Non va lì: prova un altro posto!");
        }
        parola.classList.remove("scelto"); parola = null; posto = null;
      };
      corpo.querySelector(".banca").addEventListener("click", e => {
        const b = e.target.closest("button"); if (!b) return;
        if (parola) parola.classList.remove("scelto");
        parola = b === parola ? null : b; if (parola) parola.classList.add("scelto"); prova();
      });
      corpo.querySelector(".mappa").addEventListener("click", e => {
        const b = e.target.closest(".m-buco"); if (!b || b.classList.contains("pieno")) return;
        if (posto) posto.classList.remove("scelto");
        posto = b; posto.classList.add("scelto"); prova();
      });
    };
    giro();
    barra("", "", bottone("🔁 Ricomincia", "avanti"));
    nav.lastElementChild.addEventListener("click", () => { giro(); msg("Tocca una parola e poi il riquadro dove va."); });
    msg("Tocca una parola e poi il riquadro dove va.");
  }

  /* ---------- CRUCIVERBA ---------- */
  // dispone le parole incrociandole (sempre nello stesso modo, così LIM e stampa coincidono)
  function generaCruci(voci) {
    const celle = new Map(), messe = [];
    const ch = (r, c) => celle.get(r + "," + c);
    const lista = voci.slice().sort((a, b) => b[0].length - a[0].length);
    function puo(w, r, c, dr, dc) {
      let incroci = 0;
      if (ch(r - dr, c - dc) || ch(r + dr * w.length, c + dc * w.length)) return -1;
      for (let i = 0; i < w.length; i++) {
        const rr = r + dr * i, cc = c + dc * i, l = ch(rr, cc);
        if (l) { if (l !== w[i]) return -1; incroci++; }
        else if (ch(rr + dc, cc + dr) || ch(rr - dc, cc - dr)) return -1;
      }
      return incroci;
    }
    function metti(v, r, c, dr, dc) { for (let i = 0; i < v[0].length; i++) celle.set((r + dr * i) + "," + (c + dc * i), v[0][i]); messe.push({ w: v[0], d: v[1], r, c, dir: dr ? "v" : "o" }); }
    function bordi(extra) {
      let r0 = 1e9, r1 = -1e9, c0 = 1e9, c1 = -1e9;
      const tutte = [...celle.keys(), ...(extra || [])];
      tutte.forEach(k => { const [r, c] = k.split(",").map(Number); r0 = Math.min(r0, r); r1 = Math.max(r1, r); c0 = Math.min(c0, c); c1 = Math.max(c1, c); });
      return { r0, r1, c0, c1 };
    }
    metti(lista[0], 0, 0, 0, 1);
    let restanti = lista.slice(1);
    for (let giro = 0; giro < 2; giro++) {
      const scartate = [];
      restanti.forEach(v => {
        const w = v[0]; let meglio = null;
        celle.forEach((l, key) => {
          const [r, c] = key.split(",").map(Number);
          for (let i = 0; i < w.length; i++) if (w[i] === l) for (const [dr, dc] of [[0, 1], [1, 0]]) {
            const rs = r - dr * i, cs = c - dc * i, n = puo(w, rs, cs, dr, dc);
            if (n < 1) continue;
            const extra = []; for (let j = 0; j < w.length; j++) extra.push((rs + dr * j) + "," + (cs + dc * j));
            const b = bordi(extra), h = b.r1 - b.r0 + 1, la = b.c1 - b.c0 + 1;
            if (h > 13 || la > 17) continue;
            const voto = n * 12 - (h * la) / 12 - Math.abs(h * 1.4 - la);
            if (!meglio || voto > meglio.voto) meglio = { voto, rs, cs, dr, dc };
          }
        });
        if (meglio) metti(v, meglio.rs, meglio.cs, meglio.dr, meglio.dc); else scartate.push(v);
      });
      restanti = scartate;
    }
    const b = bordi();
    const H = b.r1 - b.r0 + 1, W = b.c1 - b.c0 + 1;
    messe.forEach(m => { m.r -= b.r0; m.c -= b.c0; });
    const inizi = [...new Set(messe.map(m => m.r * 100 + m.c))].sort((x, y) => x - y);
    messe.forEach(m => m.n = inizi.indexOf(m.r * 100 + m.c) + 1);
    const g = []; for (let r = 0; r < H; r++) { g.push([]); for (let c = 0; c < W; c++) g[r].push(celle.get((r + b.r0) + "," + (c + b.c0)) || ""); }
    return { H, W, g, parole: messe.sort((x, y) => x.n - y.n) };
  }
  function vociCruci() { return A.cruciverba.filter(v => !breve || v[2]).map(v => [v[0].toUpperCase(), v[1]]); }
  function esCruci() {
    apri("Esercizio", "Cruciverba", "#FFE58A");
    const X = generaCruci(vociCruci());
    const scritto = X.g.map(r => r.map(() => ""));
    let sel = null;   // { m: parola, i: posizione }
    const numeri = {}; X.parole.forEach(m => numeri[m.r + "," + m.c] = m.n);
    const def = d => X.parole.filter(m => m.dir === d).map(m => `<p data-n="${m.n}" data-d="${d}"><b>${m.n}.</b> ${m.d} <small>(${m.w.length})</small></p>`).join("");
    corpo.innerHTML = `<div class="cruci"><div><div class="griglia-c" style="grid-template-columns:repeat(${X.W}, auto)">${X.g.map((row, r) => row.map((l, c) =>
        l ? `<div class="k l" data-r="${r}" data-c="${c}">${numeri[r + "," + c] ? `<sup>${numeri[r + "," + c]}</sup>` : ""}<span></span></div>` : `<div class="k"></div>`).join("")).join("")}</div></div>
      <div><div class="definizioni"><h4>Orizzontali →</h4>${def("o")}<h4>Verticali ↓</h4>${def("v")}</div>
        <div class="tastiera">${["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((riga, j) => `<div>${[...riga].map(x => `<button type="button" data-l="${x}">${x}</button>`).join("")}${j === 2 ? `<button type="button" class="lungo" data-l="⌫">⌫</button>` : ""}</div>`).join("")}</div>
        <div class="a-msg">Tocca una casella o una definizione, poi scrivi.</div></div></div>`;
    const cella = (r, c) => corpo.querySelector(`.k.l[data-r="${r}"][data-c="${c}"]`);
    const celleDi = m => [...m.w].map((_, i) => m.dir === "o" ? [m.r, m.c + i] : [m.r + i, m.c]);
    function disegna() {
      corpo.querySelectorAll(".k.l").forEach(k => k.classList.remove("parola", "qui"));
      corpo.querySelectorAll(".definizioni p").forEach(p => p.classList.remove("qui"));
      if (!sel) return;
      celleDi(sel.m).forEach(([r, c], i) => cella(r, c).classList.add(i === sel.i ? "qui" : "parola"));
      const p = corpo.querySelector(`.definizioni p[data-n="${sel.m.n}"][data-d="${sel.m.dir}"]`); if (p) p.classList.add("qui");
    }
    function scegli(r, c) {
      const qui = X.parole.filter(m => celleDi(m).some(([rr, cc]) => rr === r && cc === c));
      let m = qui[0];
      if (sel && qui.length > 1 && qui.includes(sel.m) && celleDi(sel.m)[sel.i][0] === r && celleDi(sel.m)[sel.i][1] === c) m = qui.find(x => x !== sel.m);
      else if (sel && qui.includes(sel.m)) m = sel.m;
      sel = { m, i: celleDi(m).findIndex(([rr, cc]) => rr === r && cc === c) }; disegna();
    }
    function scrivi(l) {
      if (!sel) return;
      const [r, c] = celleDi(sel.m)[sel.i];
      if (l === "⌫") {
        if (!scritto[r][c] && sel.i > 0) sel.i--;
        const [r2, c2] = celleDi(sel.m)[sel.i]; scritto[r2][c2] = ""; cella(r2, c2).querySelector("span").textContent = "";
      } else {
        scritto[r][c] = l; cella(r, c).querySelector("span").textContent = l;
        if (sel.i < sel.m.w.length - 1) sel.i++;
      }
      corpo.querySelectorAll(".k.l").forEach(k => k.classList.remove("ok", "ko"));
      disegna(); controllaParole(false);
    }
    function controllaParole(mostra) {
      let tutte = true;
      X.parole.forEach(m => {
        const giusta = celleDi(m).every(([r, c]) => scritto[r][c] === X.g[r][c]);
        const p = corpo.querySelector(`.definizioni p[data-n="${m.n}"][data-d="${m.dir}"]`); if (p) p.classList.toggle("risolta", giusta);
        if (!giusta) tutte = false;
      });
      if (mostra) corpo.querySelectorAll(".k.l").forEach(k => { const r = +k.dataset.r, c = +k.dataset.c; if (scritto[r][c]) k.classList.add(scritto[r][c] === X.g[r][c] ? "ok" : "ko"); });
      if (tutte) msg("🎉 Cruciverba completato! Bravissimi!");
      return tutte;
    }
    corpo.querySelector(".griglia-c").addEventListener("click", e => { const k = e.target.closest(".k.l"); if (k) scegli(+k.dataset.r, +k.dataset.c); });
    corpo.querySelector(".definizioni").addEventListener("click", e => {
      const p = e.target.closest("p"); if (!p) return;
      const m = X.parole.find(x => x.n === +p.dataset.n && x.dir === p.dataset.d); sel = { m, i: 0 }; disegna();
    });
    corpo.querySelector(".tastiera").addEventListener("click", e => { const b = e.target.closest("button"); if (b) scrivi(b.dataset.l); });
    const tasti = e => {
      if (fin.hidden) return;
      if (/^[a-zA-Z]$/.test(e.key)) { scrivi(e.key.toUpperCase()); e.preventDefault(); }
      else if (e.key === "Backspace") { scrivi("⌫"); e.preventDefault(); }
    };
    document.addEventListener("keydown", tasti);
    chiudiFn = () => document.removeEventListener("keydown", tasti);
    barra(bottone("💡 Soluzione"), "", bottone("✔ Controlla", "avanti"));
    nav.firstElementChild.addEventListener("click", () => {
      X.g.forEach((row, r) => row.forEach((l, c) => { if (l) { scritto[r][c] = l; cella(r, c).querySelector("span").textContent = l; } }));
      controllaParole(true);
    });
    nav.lastElementChild.addEventListener("click", () => { if (!controllaParole(true)) msg("Le caselle rosse sono sbagliate: riprova!"); });
  }

  /* ---------- SCHEDA D'ASCOLTO alla LIM ---------- */
  function criteriAscolto() { const S = A.ascolto; return S.criteri.filter(c => !breve || S.breve.includes(c.id)); }
  function braniAscolto() {
    return A.ascolto.brani.filter(b => !breve || b.breve).map(b => {
      const cap = C.capitoli.find(c => c.id === b.cap) || {};
      const v = b.altro != null ? cap.altri[b.altro] : cap;
      return Object.assign({ brano: v.brano, chi: v.chi, yt: v.yt, img: v.img, canale: v.canale }, b);
    });
  }
  function esAscolto() {
    apri("Scheda d'ascolto", "Ascolta e scegli", "#5EC8D8");
    const brani = braniAscolto(), crit = criteriAscolto();
    let k = 0;
    const mostra = () => {
      const b = brani[k];
      $("aNum").textContent = `Brano ${k + 1} di ${brani.length}`;
      corpo.innerHTML = `<div class="asc"><div><div class="schermo c-schermo" id="aSchermo"></div>
          <h3>${b.brano}</h3><div class="chi">${b.chi}</div></div>
        <div>${crit.map(c => `<div class="criterio" data-c="${c.id}"><div class="nome">${c.nome}</div><div class="opz">${c.opz.map((o, j) => `<button type="button" data-j="${j}">${o}</button>`).join("")}</div><div class="nota"></div></div>`).join("")}
          <div class="a-msg"></div></div></div>`;
      C.preparaSchermo($("aSchermo"), b);
      corpo.querySelectorAll(".criterio").forEach(cr => cr.addEventListener("click", e => {
        const x = e.target.closest("button"); if (!x) return;
        cr.querySelectorAll("button").forEach(y => { y.classList.remove("si", "ok", "ko", "manca"); });
        cr.querySelector(".nota").textContent = ""; x.classList.add("si");
      }));
      barra(bottone("◀", "indietro"), brani.map((_, j) => `<button type="button" class="pallino${j === k ? " qui" : ""}" data-j="${j}">${j + 1}</button>`).join(""), bottone("✔ Controlla", "avanti"));
      const [pr, pal, av] = nav.children;
      pr.disabled = k === 0; pr.addEventListener("click", () => { k--; mostra(); });
      pal.addEventListener("click", e => { const p = e.target.closest(".pallino"); if (p) { k = +p.dataset.j; mostra(); } });
      av.addEventListener("click", () => {
        if (av.dataset.fatto) { k++; mostra(); return; }
        let giuste = 0, date = 0;
        crit.forEach(c => {
          const cr = corpo.querySelector(`.criterio[data-c="${c.id}"]`), ok = b.r[c.id] || [];
          const scelta = cr.querySelector("button.si");
          cr.querySelectorAll("button").forEach((y, j) => { if (ok.includes(j) && y !== scelta) y.classList.add("manca"); });
          if (scelta) { date++; const g = ok.includes(+scelta.dataset.j); scelta.classList.remove("si"); scelta.classList.add(g ? "ok" : "ko"); if (g) giuste++; }
          if (ok.length > 1) cr.querySelector(".nota").textContent = "Qui vanno bene tutte le risposte tratteggiate o in verde.";
        });
        msg(date ? `Giuste: ${giuste} su ${crit.length}` + (b.nota ? `<br><span style="font-weight:500;color:#DCE6F5">${b.nota}</span>` : "") : "Scegli una risposta per ogni riga, poi premi Controlla.");
        if (date && k < brani.length - 1) { av.textContent = "Brano successivo ▶"; av.dataset.fatto = "1"; }
      });
    };
    mostra();
  }

  /* =========================================================
     STAMPA
     ========================================================= */
  const piede = () => `<div class="piede">musicascuole.it — Storia della musica: ${C.epoca}</div>`;
  const intesta = () => `<div class="intesta"><span>Nome <span class="riga" style="min-width:60mm"></span></span><span>Classe <span class="riga" style="min-width:14mm"></span></span><span>Data <span class="riga" style="min-width:24mm"></span></span></div>`;
  const quad = (x) => `<span class="quad${x ? " x" : ""}"></span>`;
  function stampa(fogli, orizzontale) {
    let st = $("stampaPagina");
    if (!st) { st = document.createElement("style"); st.id = "stampaPagina"; document.head.appendChild(st); }
    st.textContent = `@page { size: A4 ${orizzontale ? "landscape" : "portrait"}; margin: 12mm 13mm 11mm; }`;
    const s = $("stampa");
    s.innerHTML = fogli.filter(Boolean).map(f => `<div class="foglio">${f}</div>`).join("");
    const imgs = [...s.querySelectorAll("img")];
    Promise.all(imgs.map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))).then(() => setTimeout(() => window.print(), 60));
  }
  window.addEventListener("afterprint", () => { const s = $("stampa"); if (s) s.innerHTML = ""; });
  const tit = (t, sotto) => `<h1>${C.epoca} — ${t}</h1>${sotto ? `<div class="sotto">${sotto}</div>` : ""}`;
  const parole = () => C.capitoli.flatMap(c => c.parole || []);

  function stRiassunto() {
    const imm = conImg ? `<div class="imm-r">${A.riassunto.immagini.map(([f, d]) => `<figure><img src="${C.img + f}" alt=""><figcaption>${d}</figcaption></figure>`).join("")}</div>` : "";
    return [`<div class="compatto">` + tit("scheda riassuntiva", C.date) + imm + `<p>${A.riassunto.testo}</p>
      <div class="due"><div><h2>La linea del tempo</h2><div class="linea-s">${C.linea.map(([d, t]) => `<b>${d}</b><span>${t}</span>`).join("")}</div>
        ${A.riassunto.punti.map(([h, l]) => `<h2>${h}</h2>${l.map(x => `<p>• ${x}</p>`).join("")}`).join("")}</div>
        <div><h2>Parole da ricordare</h2>${parole().map(([t, d]) => `<p><b>${t}</b>: ${d}</p>`).join("")}</div></div>` + piede() + `</div>`];
  }
  function stCompleta() {
    const caps = C.capitoli.map((c, i) => {
      const pag = c.pagine.map(p => `<div class="pag-s${conImg ? " con-img" : ""}"><div>${p.t.map(x => `<p>${x}</p>`).join("")}</div>` +
        (conImg ? `<div class="fig"><img src="${C.img + p.img}" alt=""><div>${p.did}</div></div>` : "") + `</div>`).join("");
      const asc = c.brano ? `<div class="ascolto-s"><b>🎧 Ascolto: ${c.brano}</b> — ${c.chi}<br>${c.punti.map(x => `• ${x}`).join("<br>")}<br><i>Lo sapevi?</i> ${c.sapevi}</div>` : "";
      const pr = (c.parole || []).length && !c.riepilogo ? `<p><b>Parole da ricordare:</b> ${c.parole.map(([t, d]) => `<b>${t}</b> (${d})`).join("; ")}</p>` : "";
      return `<div class="capitolo-s"><h2>${c.riepilogo ? "★" : i + 1}. ${c.titolo} <span style="font-weight:600">· ${c.data}</span></h2>${pag}${asc}${pr}<div style="clear:both"></div></div>`;
    }).join("");
    return [tit("il racconto completo", C.date) + caps + piede()];
  }
  function stVF() {
    const lista = breve ? A.vf.filter(v => v[3]) : A.vf;
    const f = intesta() + tit("vero o falso", "Segna con una crocetta V (vero) o F (falso).") +
      `<table class="vf-r"><tr><th>N.</th><th>Frase</th><th>V</th><th>F</th></tr>${lista.map((v, i) => `<tr><td>${i + 1}</td><td>${v[0]}</td><td>${quad()}</td><td>${quad()}</td></tr>`).join("")}</table>
      <div class="punteggio">Risposte giuste: ____ su ${lista.length}</div>` + piede();
    const s = conSol ? tit("vero o falso: soluzioni", "Per l'insegnante") + `<div class="sol">${lista.map((v, i) => `<p><b>${i + 1}. ${v[1] ? "VERO" : "FALSO"}</b> — ${testo(v[0])}${v[2] ? ` <i>(${v[2]})</i>` : ""}</p>`).join("")}</div>` + piede() : "";
    return [f, s];
  }
  function mappaStampa(buchi, pieni) {
    const M = A.mappa;
    const w = x => buchi && buchi.has(x) && !pieni ? `<span class="buco"></span>` : (buchi && buchi.has(x) ? `<u><b>${x}</b></u>` : x);
    const ramo = (r, p) => `<div class="ramo ${p}"><b>${r.icona} ${r.nome} — ${r.sotto}</b><div class="nodi">${r.nodi.map(n => `<div class="nodo"><b>${w(n.titolo)}</b>${n.parole.map(x => `<span>${w(x)}</span>`).join("")}</div>`).join("")}</div></div>`;
    return `<div class="mappa-s">${ramo(M.rami[0], "")}<div class="rad">${C.epoca}<small>${C.date}</small></div>${ramo(M.rami[1], "p")}</div>`;
  }
  function stMappa() {
    const buchi = new Set(breve ? A.mappaBuchiBreve : A.mappaBuchi);
    const banca = mescola([...buchi, ...(A.mappaDistrattori || [])], rngDa("banca"));
    const f = intesta() + tit("completa la mappa", `Scrivi negli spazi le parole giuste, scegliendole dal riquadro.${(A.mappaDistrattori || []).length ? " Attenzione: alcune parole non servono!" : ""}`) +
      mappaStampa(buchi, false) + `<div class="banca-s">${banca.map(x => `<span>${x}</span>`).join("")}</div>` + piede();
    const s = conSol ? tit("completa la mappa: soluzioni", "Per l'insegnante: le parole da inserire sono sottolineate.") + mappaStampa(buchi, true) + piede() : "";
    return [f, s];
  }
  function stAscolto() {
    const brani = braniAscolto(), crit = criteriAscolto();
    const f = intesta() + tit("scheda d'ascolto", "Ascolta ogni brano e segna con una crocetta le risposte giuste.") + brani.map((b, i) =>
      `<div class="asc-s"><b>${i + 1}. ${b.brano}</b> — ${b.chi}<div class="crit">${crit.map(c => `<b>${c.nome}</b><div>${c.opz.map(o => `<span>${quad()}${o}</span>`).join("")}</div>`).join("")}
        <b>Cosa mi ha colpito</b><div class="linee"></div></div></div>`).join("") + piede();
    const s = conSol ? tit("scheda d'ascolto: soluzioni", "Per l'insegnante") + `<table class="sol"><tr><th>Brano</th>${crit.map(c => `<th>${c.nome}</th>`).join("")}</tr>${brani.map(b =>
      `<tr><td><b>${b.brano}</b><br>${b.chi}</td>${crit.map(c => `<td>${(b.r[c.id] || []).map(j => c.opz[j]).join(" / ")}</td>`).join("")}</tr>`).join("")}</table>` + piede() : "";
    return [f, s];
  }
  function cruciStampa(X, pieno) {
    const num = {}; X.parole.forEach(m => num[m.r + "," + m.c] = m.n);
    return `<div class="cg" style="grid-template-columns:repeat(${X.W}, 7.5mm)">${X.g.map((row, r) => row.map((l, c) => l ? `<i class="l">${num[r + "," + c] ? `<sup>${num[r + "," + c]}</sup>` : ""}${pieno ? l : ""}</i>` : "<i></i>").join("")).join("")}</div>`;
  }
  function stCruci() {
    const X = generaCruci(vociCruci());
    const defs = d => X.parole.filter(m => m.dir === d).map(m => `<p><b>${m.n}.</b> ${m.d} (${m.w.length})</p>`).join("");
    const f = intesta() + tit("cruciverba", "Risolvi il cruciverba con le parole da ricordare.") + cruciStampa(X, false) +
      `<div class="defs"><h3>Orizzontali →</h3>${defs("o")}<h3>Verticali ↓</h3>${defs("v")}</div>` + piede();
    const s = conSol ? tit("cruciverba: soluzioni", "Per l'insegnante") + cruciStampa(X, true) + piede() : "";
    return [f, s];
  }
  // verifica: stesse domande, ordine diverso fra A e B
  function datiVerifica(vers) {
    const V = A.verifica, rng = rngDa(vers + (breve ? "b" : ""));
    const vf = mescola(A.vf.filter((v, i) => (breve ? V.vfBreve : V.vf).includes(i)), rng);
    const tutteParole = parole();
    const coll = mescola(tutteParole.filter(([t]) => (breve ? V.collegaBreve : V.collega).includes(t)), rng);
    const collDx = mescola(coll.map((c, i) => ({ d: c[1], i })), rng);
    const scelte = mescola(V.scelte.filter((s, i) => !breve || V.scelteBreve.includes(i)), rng).map(([d, op, g]) => {
      const o = mescola(op.map((t, j) => ({ t, ok: j === g })), rng); return { d, o };
    });
    const aperte = breve ? V.aperte.slice(0, 1) : V.aperte;
    const punti = vf.length + coll.length + scelte.length + aperte.reduce((s, a) => s + a[1], 0);
    return { vf, coll, collDx, scelte, aperte, punti };
  }
  function grigliaVoto(tot) {
    const soglie = [[10, .95], [9, .85], [8, .75], [7, .65], [6, .55], [5, .45], [4, 0]];
    let alto = tot;
    const righe = soglie.map(([voto, p]) => { const basso = Math.ceil(tot * p); const r = `<td>${basso === alto ? basso : basso + "–" + alto}</td>`; alto = basso - 1; return [voto, r]; });
    return `<table class="voto" style="width:auto;margin-top:2mm"><tr><th>Punti ottenuti</th>${righe.map(r => r[1]).join("")}</tr><tr><th>Punteggio in decimi</th>${righe.map(r => `<td>${r[0]}</td>`).join("")}</tr></table>
      <div style="font-size:8.5pt">Griglia indicativa: ognuno può adattarla ai propri criteri.</div>`;
  }
  function stVerifica(vers) {
    const D = datiVerifica(vers), L = "ABCDEFGHIJ";
    let n = 0;
    const sez = (t, p) => `<h2>${++n}. ${t} <span style="font-weight:600">(${p} ${p === 1 ? "punto" : "punti"})</span></h2>`;
    const f = intesta() + tit(`verifica${breve ? " (versione breve)" : ""} — versione ${vers}`, "Leggi bene ogni domanda prima di rispondere.") +
      sez("Vero o falso: segna V o F", D.vf.length) + `<table class="vf-r"><tr><th>N.</th><th>Frase</th><th>V</th><th>F</th></tr>${D.vf.map((v, i) => `<tr><td>${i + 1}</td><td>${v[0]}</td><td>${quad()}</td><td>${quad()}</td></tr>`).join("")}</table>` +
      sez("Collega ogni parola alla sua definizione: scrivi la lettera giusta", D.coll.length) +
      `<div class="collega-s">${D.coll.map((c, i) => `<div>${i + 1}. <b>${c[0]}</b> → ____</div><div>${L[i]}. ${D.collDx[i].d}</div>`).join("")}</div>` +
      sez("Scegli la risposta giusta", D.scelte.length) + `<ol class="scelte">${D.scelte.map(s => `<li>${s.d}<div class="op">${s.o.map(o => `<span>${quad()}${o.t}</span>`).join("")}</div></li>`).join("")}</ol>` +
      D.aperte.map(([d, p]) => sez("Rispondi con parole tue", p) + `<p>${d}</p>${'<div class="linee"></div>'.repeat(p + 2)}`).join("") +
      `<div class="punteggio" style="font-size:12pt">Punteggio: ______ / ${D.punti}</div>` + piede();
    const sol = !conSol ? "" : tit(`verifica${breve ? " (versione breve)" : ""} — versione ${vers}: soluzioni`, "Per l'insegnante") + `<div class="sol">
      <h3>1. Vero o falso</h3><p>${D.vf.map((v, i) => `${i + 1}. ${v[1] ? "V" : "F"}`).join(" · ")}</p>
      <h3>2. Collega</h3><p>${D.coll.map((c, i) => `${i + 1}. ${c[0]} → ${L[D.collDx.findIndex(x => x.i === i)]}`).join(" · ")}</p>
      <h3>3. Scelta multipla</h3><p>${D.scelte.map((s, i) => `${i + 1}. ${s.o.find(o => o.ok).t}`).join(" · ")}</p>
      ${D.aperte.map(([d, p, t], i) => `<h3>${4 + i}. Domanda aperta (${p} punti)</h3><p><i>${d}</i><br>Cosa dovrebbe esserci: ${t}</p>`).join("")}
      <h3>Punteggio totale: ${D.punti}</h3>${grigliaVoto(D.punti)}</div>` + piede();
    return [f, sol];
  }

  /* =========================================================
     PANNELLI: Mappa, Esercizi, Schede
     ========================================================= */
  function pannelli() {
    const vm = $("vistaMappa");
    vm.innerHTML = mappaHTML(null, true);
    vm.addEventListener("click", e => { const b = e.target.closest(".m-nodo[data-cap]"); if (b) C.apriCapitolo(+b.dataset.cap); });

    const ES = [
      ["🔗", "Parole e significati", "Collega ogni parola alla sua definizione.", () => esCollega({ titolo: "Parole e significati", istruzioni: "Tocca una parola a sinistra, poi la sua definizione a destra.", coppie: () => parole().map(([t, d]) => [t, d.charAt(0).toUpperCase() + d.slice(1)]) })],
      ["🧑‍🎤", "Chi ha fatto cosa?", "Collega i personaggi a quello che hanno fatto.", () => esCollega({ titolo: "Chi ha fatto cosa?", istruzioni: "Tocca un personaggio a sinistra, poi quello che ha fatto a destra.", coppie: () => A.personaggi })],
      ["🪕", "Che strumento è?", "Collega ogni immagine al nome dello strumento.", () => esCollega({ titolo: "Che strumento è?", istruzioni: "Tocca un'immagine a sinistra, poi il nome dello strumento a destra.", coppie: () => C.strumenti.map(s => [{ img: s.img, alt: "" }, `<b>${s.titolo}</b> <small style="color:#9FB3CE">· ${s.chi}</small>`]) })],
      ["✅", "Vero o falso?", `${A.vf.length} frasi: tocca VERO o FALSO e scopri subito se è giusto.`, esVF],
      ["🗺️", "Completa la mappa", "Metti ogni parola al suo posto nella mappa concettuale.", esMappa],
      ["🔤", "Cruciverba", "Le parole da ricordare, incrociate.", esCruci]
    ];
    const ve = $("vistaEsercizi");
    ve.innerHTML = `<div class="a-carte">${ES.map((e, i) => `<button type="button" class="a-carta" data-i="${i}" style="--accent:${COLORI[i]}"><span class="ic">${e[0]}</span><span><b>${e[1]}</b><small>${e[2]}</small></span></button>`).join("")}</div>`;
    ve.addEventListener("click", e => { const b = e.target.closest(".a-carta"); if (b) ES[+b.dataset.i][3](); });

    const SC = [
      ["📄", "Scheda riassuntiva", "Una pagina da incollare sul quaderno.", [["🖨️ Stampa", () => stampa(stRiassunto())]]],
      ["📚", "Il racconto completo", "Tutti i capitoli, su più pagine.", [["🖨️ Stampa", () => stampa(stCompleta())]]],
      ["✅", "Vero o falso", "Verifica pronta, con soluzioni.", [["▶ Alla LIM", esVF], ["🖨️ Stampa", () => stampa(stVF())]]],
      ["🗺️", "Mappa da completare", "Con le parole da scegliere.", [["▶ Alla LIM", esMappa], ["🖨️ Stampa", () => stampa(stMappa(), true)]]],
      ["🎧", "Scheda d'ascolto", "Una griglia per ogni brano.", [["▶ Alla LIM", esAscolto], ["🖨️ Stampa", () => stampa(stAscolto())]]],
      ["🔤", "Cruciverba", "Da risolvere sulla carta.", [["▶ Alla LIM", esCruci], ["🖨️ Stampa", () => stampa(stCruci())]]],
      ["📝", "Verifica finale", "Due versioni, A e B: stesse domande in ordine diverso. Punteggio e griglia di correzione.", [["🖨️ Versione A", () => stampa(stVerifica("A"))], ["🖨️ Versione B", () => stampa(stVerifica("B"))]]]
    ];
    const vs = $("vistaSchede");
    vs.innerHTML = `<div class="a-opzioni">
        <span class="a-scelta" id="sVers"><button type="button" class="si" data-v="0">Versione completa</button><button type="button" data-v="1">Versione breve</button></span>
        <span class="a-scelta" id="sImg"><button type="button" class="si" data-v="1">🖼️ Con immagini</button><button type="button" data-v="0">Senza immagini</button></span>
        <label><input type="checkbox" id="sSol" checked> Aggiungi le soluzioni per l'insegnante</label></div>
      <div class="a-carte">${SC.map((s, i) => `<div class="a-carta" style="--accent:${COLORI[i]}"><span class="ic">${s[0]}</span><span><b>${s[1]}</b><small>${s[2]}</small>
        <span class="bottoni">${s[3].map((b, j) => `<button type="button" class="a-bot${j === s[3].length - 1 ? " pieno" : ""}" data-i="${i}" data-j="${j}">${b[0]}</button>`).join("")}</span></span></div>`).join("")}</div>`;
    vs.addEventListener("click", e => {
      const b = e.target.closest(".a-bot"); if (b) { SC[+b.dataset.i][3][+b.dataset.j][1](); return; }
      const o = e.target.closest(".a-scelta button"); if (!o) return;
      o.parentNode.querySelectorAll("button").forEach(x => x.classList.toggle("si", x === o));
      if (o.parentNode.id === "sVers") breve = o.dataset.v === "1"; else conImg = o.dataset.v === "1";
    });
    $("sSol").addEventListener("change", e => { conSol = e.target.checked; });
  }

  window.StoriaAttivita = {
    avvia(cfg) {
      C = cfg; A = cfg.attivita;
      creaFinestra();
      const s = document.createElement("div"); s.id = "stampa"; document.body.appendChild(s);
      pannelli();
    },
    // per le prove automatiche
    _genera: v => generaCruci(v)
  };
})();
