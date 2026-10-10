/* =========================================================
   storia-attivita.js — per le pagine della storia della musica:
   mappa concettuale, esercizi alla LIM e schede da stampare.
   È uguale per tutte le epoche: cambiano solo i dati (ATTIVITA) che la pagina gli passa.

   Uso (in fondo allo script della pagina, prima di adatta-schermo.js):
     StoriaAttivita.avvia({ epoca, date, img, capitoli, strumenti, linea, attivita,
                            apriCapitolo, preparaSchermo });
   La pagina deve avere i contenitori #vistaMappa, #vistaEsercizi, #vistaSchede;
   la finestra degli esercizi (#attivita, #aTelaio) e il foglio di stampa (#stampa)
   li crea questo script. Niente viene salvato o inviato: tutto resta nella pagina.
   Niente emoji (richiesta di Cristiano): solo piccole icone disegnate qui sotto.
   Il formato dei dati è spiegato in _sviluppo/storia/LEGGIMI.md.
   ========================================================= */
(function () {
  "use strict";
  const COLORI = ["#E21C48", "#F99D1C", "#FFF428", "#BED958", "#009C95", "#5E50A1", "#CF3E96"];   // do re mi fa sol la si
  const $ = id => document.getElementById(id);
  const testo = h => String(h).replace(/<[^>]+>/g, "").replace(/\[\[|\]\]/g, "");
  const largo = window.matchMedia("(min-width: 900px) and (min-height: 560px)");
  // numeri casuali con un "seme": la stessa verifica A si ristampa uguale finché non si ricarica la pagina
  function rngDa(seme) {
    let s = 0; for (const ch of String(seme)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
    return function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function mescola(a, rng) { a = a.slice(); rng = rng || Math.random; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* piccole icone (linee semplici, prendono il colore della carta) */
  const P = {
    collega: '<path d="M9 15l6-6"/><path d="M11 6l1.5-1.5a4 4 0 0 1 5.7 5.7L16.5 12"/><path d="M13 18l-1.5 1.5a4 4 0 0 1-5.7-5.7L7.5 12"/>',
    persona: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-6.5 8-6.5s7 2 8 6.5"/>',
    strumento: '<circle cx="9" cy="16" r="5"/><path d="M12.5 12.5L20 5"/><path d="M18 3l3 3"/><circle cx="9" cy="16" r="1.4"/>',
    vf: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 12l3 3 6-6"/>',
    mappa: '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M5 16v-4h14v4"/>',
    griglia: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
    cuffie: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="7" rx="1.5"/><rect x="17" y="14" width="4" height="7" rx="1.5"/>',
    foglio: '<path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5M9 12h8M9 16h8"/>',
    libro: '<path d="M3 5c3-1.5 6-1.5 9 0v15c-3-1.5-6-1.5-9 0z"/><path d="M21 5c-3-1.5-6-1.5-9 0v15c3-1.5 6-1.5 9 0z"/>',
    verifica: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v3h6V3M8 11l2 2 4-4M8 17h8"/>'
  };
  const icona = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;

  let C = null, A = null, numMappe = 0;
  let conSol = true;
  const opzStampa = { riassunto: { breve: false, img: true }, completa: { breve: false, img: true } };

  /* =========================================================
     MAPPA CONCETTUALE (come le mappe di Novak: concetti nei riquadri,
     parole-legame sulle frecce, dall'alto il concetto più generale)
     ========================================================= */
  // buchi: parole [[così]] da nascondere; modo: "vista" (riquadri cliccabili), "esercizio", "stampa", "soluzioni"
  function mappaHTML(buchi, modo, scala) {
    const M = A.mappa, N = {};
    M.nodi.forEach(n => N[n.id] = n);
    const parola = w => {
      if (buchi && buchi.has(w)) return modo === "soluzioni" ? `<u>${w}</u>` : modo === "stampa" ? `<span class="buco"></span>` : `<span class="m-buco" data-w="${w}"></span>`;
      return `<b>${w}</b>`;
    };
    const t = s => String(s || "").replace(/\[\[(.+?)\]\]/g, (_, w) => parola(w));
    let linee = "", etich = "";
    const punta = "mcPunta" + (++numMappe);   // un id diverso per ogni mappa (anteprima e schermo intero)
    M.archi.forEach(e => {
      const a = N[e.da], b = N[e.a];
      let d, lx, ly, cls = "";
      if (e.forma === "orizz") {
        const sx = b.x + b.w < a.x;
        const x1 = sx ? a.x : a.x + a.w, x2 = sx ? b.x + b.w : b.x, y1 = a.y + a.h / 2, y2 = b.y + b.h / 2;
        d = `M${x1} ${y1} L${x2} ${y2}`; lx = (x1 + x2) / 2; ly = (y1 + y2) / 2 - 12;
      } else if (e.forma === "curva") {
        const x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y + b.h, giu = Math.max(y1, y2) + 46;
        d = `M${x1} ${y1} C${x1} ${giu}, ${x2} ${giu}, ${x2} ${y2}`; lx = (x1 + x2) / 2; ly = giu - 10; cls = " tratt";
      } else {
        const x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y, m = (y1 + y2) / 2;
        d = x1 === x2 ? `M${x1} ${y1} L${x2} ${y2}` : `M${x1} ${y1} V${m} H${x2} V${y2}`;
        if (e.lato === "padre") { lx = x1; ly = (y1 + m) / 2; } else { lx = x2; ly = (m + y2) / 2 + 1; }
      }
      linee += `<path class="mc-f${cls}" d="${d}" marker-end="url(#${punta})"/>`;
      if (e.l) etich += `<div class="mc-l${e.lato === "padre" ? " pa" : ""}" style="left:${lx}px;top:${ly}px">${e.l}</div>`;
    });
    const nodi = M.nodi.map(n => {
      const i = n.cap ? C.capitoli.findIndex(c => c.id === n.cap) : -1;
      const tag = modo === "vista" && i >= 0 ? "button" : "div";
      return `<${tag} ${tag === "button" ? `type="button" data-cap="${i}" title="Apri il capitolo ${i + 1}"` : ""} class="mc-n ${n.tipo || ""}" style="left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px">
        <span class="mc-t">${t(n.t)}</span>${n.s ? `<span class="mc-s">${t(n.s)}</span>` : ""}</${tag}>`;
    }).join("");
    const s = scala || 1;
    return `<div class="mc-box" style="width:${M.W * s}px;height:${M.H * s}px"><div class="mc mc-${modo}" style="width:${M.W}px;height:${M.H}px;transform:scale(${s})">
      <svg class="mc-svg" width="${M.W}" height="${M.H}" viewBox="0 0 ${M.W} ${M.H}" aria-hidden="true"><defs><marker id="${punta}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z"/></marker></defs>${linee}</svg>
      ${etich}${nodi}</div></div>`;
  }
  function paroleMappa() { const s = []; A.mappa.nodi.forEach(n => (String(n.t) + " " + (n.s || "")).replace(/\[\[(.+?)\]\]/g, (_, w) => s.push(w))); return s; }

  /* =========================================================
     FINESTRA DEGLI ESERCIZI (stessa grafica dei capitoli, sfondo del sito)
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
  function apri(label, titolo, colore, tipo) {
    fin.style.setProperty("--accent", colore || "#5EC8D8");
    fin.dataset.tipo = tipo || "";
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
  const scuoti = x => { x.classList.remove("no"); void x.offsetWidth; x.classList.add("no"); };

  /* ---------- MAPPA a schermo intero ---------- */
  function mostraMappa() {
    apri("Mappa concettuale", C.epoca + " in una mappa", "#FFE58A", "mappa");
    const s = largo.matches ? Math.min(1268 / A.mappa.W, 536 / A.mappa.H) : 0.62;
    corpo.innerHTML = `<div class="mc-scorri">${mappaHTML(null, "vista", s)}</div>`;
    corpo.addEventListener("click", function vai(e) {
      const b = e.target.closest(".mc-n[data-cap]"); if (!b) return;
      corpo.removeEventListener("click", vai); chiudi(); C.apriCapitolo(+b.dataset.cap);
    });
    barra("", "Tocca un riquadro colorato per aprire il suo capitolo.", "");
  }

  /* ---------- COLLEGA: tocca a sinistra, poi a destra ---------- */
  function esCollega(es) {
    apri("Esercizio · Collega", es.titolo, "#009C95");
    const giro = () => {
      const coppie = mescola(es.coppie()).slice(0, 7);
      const sx = coppie.map((c, i) => ({ i, c })), dx = mescola(sx);
      corpo.innerHTML = `<div class="a-intro">${es.istruzioni}</div><div class="collega"><div class="col">${sx.map(o =>
          `<button type="button" class="cl sx" data-i="${o.i}"><span class="pal"></span><b>${o.c[0]}</b></button>`).join("")}</div>
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
          msg(fatte === coppie.length ? "Tutte giuste! Bravissimi!" : `Collegate: ${fatte} su ${coppie.length}`);
        } else {
          [a, b].forEach(scuoti);
          msg(`Non è la coppia giusta: riprova! (collegate: ${fatte} su ${coppie.length})`);
        }
      });
    };
    giro();
    barra("", "", bottone("Nuove coppie", "avanti"));
    nav.lastElementChild.addEventListener("click", giro);
  }

  /* ---------- CHE STRUMENTO È? Uno alla volta, grande; immagine d'epoca oppure foto ---------- */
  function esStrumenti() {
    apri("Esercizio", "Che strumento è?", "#5EC8D8");
    const nomi = C.strumenti.map(s => s.titolo).sort((a, b) => a.localeCompare(b, "it"));
    let lista, k, primoColpo, sbagliato, vista = "epoca";
    const inizio = () => { lista = mescola(C.strumenti); k = 0; primoColpo = 0; mostra(); };
    const figura = s => {
      const o = s.cerchio;   // ovale rosso sullo strumento giusto, se nell'immagine d'epoca ce ne sono due
      const ovale = vista === "epoca" && o ? `<svg class="ovale" viewBox="0 0 640 400" aria-hidden="true"><ellipse cx="${o[0]}" cy="${o[1]}" rx="${o[2]}" ry="${o[3]}" transform="rotate(${o[4]} ${o[0]} ${o[1]})"/></svg>` : "";
      const f = vista === "foto" && s.foto ? s.foto : (s.epoca || s.img);
      return `<img src="${C.img + f}" alt="Uno strumento medievale: quale?">${ovale}`;
    };
    const mostra = () => {
      if (k >= lista.length) {
        $("aNum").textContent = "";
        corpo.innerHTML = `<div class="vf"><div class="n">Fine!</div><div class="finale">Riconosciuti al primo colpo: ${primoColpo} su ${lista.length}</div></div>`;
        barra("", "", bottone("Ricomincia", "avanti")); nav.lastElementChild.addEventListener("click", inizio); return;
      }
      const s = lista[k]; sbagliato = false;
      $("aNum").textContent = `Strumento ${k + 1} di ${lista.length}`;
      corpo.innerHTML = `<div class="strum1"><div><div class="a-scelta vista-sw"><button type="button" data-v="epoca"${vista === "epoca" ? ' class="si"' : ""}>Iconografia dell'epoca</button><button type="button" data-v="foto"${vista === "foto" ? ' class="si"' : ""}>Foto</button></div>
          <figure>${figura(s)}</figure>
          <div class="nota-sw">${vista === "epoca" ? "Iconografia dell'epoca: lo strumento come lo dipingevano allora, in miniature e quadri." : "Foto: lo strumento ricostruito oggi o conservato in un museo."}</div></div>
        <div><div class="dom">Che strumento è?</div><div class="nomi">${nomi.map(n => `<button type="button" class="cl" data-n="${n}"><span class="pal"></span><b>${n}</b></button>`).join("")}</div>
        <div class="a-msg"></div></div></div>`;
      corpo.querySelector(".vista-sw").addEventListener("click", e => {
        const b = e.target.closest("button"); if (!b || b.dataset.v === vista) return;
        vista = b.dataset.v;
        corpo.querySelectorAll(".vista-sw button").forEach(x => x.classList.toggle("si", x === b));
        corpo.querySelector(".strum1 figure").innerHTML = figura(s);
        corpo.querySelector(".nota-sw").textContent = vista === "epoca" ? "Iconografia dell'epoca: lo strumento come lo dipingevano allora, in miniature e quadri." : "Foto: lo strumento ricostruito oggi o conservato in un museo.";
      });
      barra("", "", bottone("Avanti ▶", "avanti")); const av = nav.lastElementChild; av.disabled = true;
      av.addEventListener("click", () => { k++; mostra(); });
      corpo.querySelector(".nomi").addEventListener("click", e => {
        const b = e.target.closest(".cl"); if (!b || av.disabled === false) return;
        if (b.dataset.n === s.titolo) {
          b.classList.add("fatto"); b.style.setProperty("--c", "#BED958");
          if (!sbagliato) primoColpo++;
          msg(`Giusto: <b>${s.titolo}</b>! ${s.chi}.`);
          av.disabled = false;
        } else { sbagliato = true; scuoti(b); msg("No, guarda bene e riprova!"); }
      });
    };
    inizio();
  }

  /* ---------- VERO O FALSO: una frase alla volta ---------- */
  function esVF() {
    apri("Esercizio", "Vero o falso?", "#F99D1C");
    let lista, k, giuste;
    const inizio = () => { lista = mescola(A.vf); k = 0; giuste = 0; mostra(); };
    const mostra = () => {
      if (k >= lista.length) {
        corpo.innerHTML = `<div class="vf"><div class="n">Fine!</div><div class="finale">Risposte giuste: ${giuste} su ${lista.length}</div>
          <div class="esito">${giuste === lista.length ? "Perfetto!" : giuste >= lista.length * 0.7 ? "Molto bene!" : "Rileggi i capitoli e riprova: andrà meglio!"}</div></div>`;
        barra("", "", bottone("Ricomincia", "avanti")); nav.lastElementChild.addEventListener("click", inizio);
        $("aNum").textContent = ""; return;
      }
      const [frase, vero, perche] = lista[k];
      $("aNum").textContent = `Frase ${k + 1} di ${lista.length}`;
      corpo.innerHTML = `<div class="vf"><div class="n">Frase ${k + 1} di ${lista.length}</div><div class="frase">${frase}</div>
        <div class="tasti"><button type="button" class="v">VERO</button><button type="button" class="f">FALSO</button></div>
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
  // sulla LIM la mappa occupa tutta la finestra: niente barra in alto, le parole in una riga sotto
  function esMappa() {
    apri("Esercizio", "Completa la mappa", "#a78bfa", "completa");
    const giro = () => {
      const buchi = new Set(A.mappaBuchi);
      const banca = mescola([...buchi, ...(A.mappaDistrattori || [])]);
      let s = largo.matches ? Math.min(1268 / A.mappa.W, 560 / A.mappa.H) : 0.62;
      corpo.innerHTML = `<div class="completa"><div class="mc-scorri">${mappaHTML(buchi, "esercizio", s)}</div>
        <div class="riga-banca"><button type="button" class="c-indice torna-b">◀ Torna</button>
          <div class="banca">${banca.map(w => `<button type="button" data-w="${w}">${w}</button>`).join("")}</div>
          <button type="button" class="c-indice ancora-b">Ricomincia</button></div></div>`;
      // se le parole vanno su tre righe, la mappa si rimpicciolisce quel tanto che basta
      if (largo.matches) {
        const box = corpo.querySelector(".mc-box"), mc = corpo.querySelector(".mc");
        while (corpo.scrollHeight > corpo.clientHeight && s > 0.6) {
          s -= 0.02; box.style.width = A.mappa.W * s + "px"; box.style.height = A.mappa.H * s + "px"; mc.style.transform = `scale(${s})`;
        }
      }
      corpo.querySelector(".torna-b").addEventListener("click", chiudi);
      corpo.querySelector(".ancora-b").addEventListener("click", giro);
      let parola = null, posto = null, messi = 0;
      const prova = () => {
        if (!parola || !posto) return;
        if (parola.dataset.w === posto.dataset.w) {
          posto.textContent = parola.dataset.w; posto.classList.add("pieno"); posto.classList.remove("scelto");
          parola.classList.add("usato"); messi++;
          if (messi === buchi.size) corpo.querySelector(".banca").innerHTML = `<span class="fatto-msg">Mappa completa! Bravissimi!</span>`;
        } else {
          posto.classList.remove("scelto"); scuoti(posto); scuoti(parola);
        }
        parola.classList.remove("scelto"); parola = null; posto = null;
      };
      corpo.querySelector(".banca").addEventListener("click", e => {
        const b = e.target.closest("button"); if (!b) return;
        if (parola) parola.classList.remove("scelto");
        parola = b === parola ? null : b; if (parola) parola.classList.add("scelto"); prova();
      });
      corpo.querySelector(".mc").addEventListener("click", e => {
        const b = e.target.closest(".m-buco"); if (!b || b.classList.contains("pieno")) return;
        if (posto) posto.classList.remove("scelto");
        posto = b; posto.classList.add("scelto"); prova();
      });
    };
    giro();
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
      [...celle.keys(), ...(extra || [])].forEach(k => { const [r, c] = k.split(",").map(Number); r0 = Math.min(r0, r); r1 = Math.max(r1, r); c0 = Math.min(c0, c); c1 = Math.max(c1, c); });
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
            const punti = n * 12 - (h * la) / 12 - Math.abs(h * 1.4 - la);
            if (!meglio || punti > meglio.punti) meglio = { punti, rs, cs, dr, dc };
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
  function vociCruci() { return A.cruciverba.map(v => [v[0].toUpperCase(), v[1]]); }
  function esCruci() {
    apri("Esercizio", "Cruciverba", "#FFE58A");
    const X = generaCruci(vociCruci());
    const scritto = X.g.map(r => r.map(() => ""));
    let sel = null;
    const numeri = {}; X.parole.forEach(m => numeri[m.r + "," + m.c] = m.n);
    const def = d => X.parole.filter(m => m.dir === d).map(m => `<p data-n="${m.n}" data-d="${d}"><b>${m.n}.</b> ${m.d} <small>(${m.w.length})</small></p>`).join("");
    corpo.innerHTML = `<div class="cruci"><div><div class="griglia-c" style="grid-template-columns:repeat(${X.W}, auto)">${X.g.map((row, r) => row.map((l, c) =>
        l ? `<div class="k l" data-r="${r}" data-c="${c}">${numeri[r + "," + c] ? `<sup>${numeri[r + "," + c]}</sup>` : ""}<span></span></div>` : `<div class="k"></div>`).join("")).join("")}</div></div>
      <div><div class="definizioni"><h4>Orizzontali →</h4>${def("o")}<h4>Verticali ↓</h4>${def("v")}</div>
        <div class="tastiera">${["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((riga, j) => `<div>${[...riga].map(x => `<button type="button" data-l="${x}">${x}</button>`).join("")}${j === 2 ? `<button type="button" class="lungo" data-l="canc">canc</button>` : ""}</div>`).join("")}</div>
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
      if (l === "canc") {
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
      if (tutte) msg("Cruciverba completato! Bravissimi!");
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
      else if (e.key === "Backspace") { scrivi("canc"); e.preventDefault(); }
    };
    document.addEventListener("keydown", tasti);
    chiudiFn = () => document.removeEventListener("keydown", tasti);
    barra(bottone("Soluzione"), "", bottone("Controlla", "avanti"));
    nav.firstElementChild.addEventListener("click", () => {
      X.g.forEach((row, r) => row.forEach((l, c) => { if (l) { scritto[r][c] = l; cella(r, c).querySelector("span").textContent = l; } }));
      controllaParole(true);
    });
    nav.lastElementChild.addEventListener("click", () => { if (!controllaParole(true)) msg("Le caselle rosse sono sbagliate: riprova!"); });
  }

  /* ---------- ESERCIZI DI ASCOLTO (scheda d'ascolto alla LIM) ---------- */
  function braniAscolto() {
    return A.ascolto.brani.map(b => {
      const cap = C.capitoli.find(c => c.id === b.cap) || {};
      const v = b.altro != null ? cap.altri[b.altro] : cap;
      return Object.assign({ brano: v.brano, chi: v.chi, yt: v.yt, img: v.img, canale: v.canale }, b);
    });
  }
  function esAscolto() {
    apri("Esercizi di ascolto", "Ascolta e scegli", "#5EC8D8");
    const brani = braniAscolto(), crit = A.ascolto.criteri;
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
      barra(bottone("◀", "indietro"), brani.map((_, j) => `<button type="button" class="pallino${j === k ? " qui" : ""}" data-j="${j}">${j + 1}</button>`).join(""), bottone("Controlla", "avanti"));
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
  const quad = () => `<span class="quad"></span>`;
  function stampa(fogli, orizzontale) {
    let st = $("stampaPagina");
    if (!st) { st = document.createElement("style"); st.id = "stampaPagina"; document.head.appendChild(st); }
    st.textContent = `@page { size: A4 ${orizzontale ? "landscape" : "portrait"}; margin: 11mm 12mm 10mm; }`;
    const s = $("stampa");
    s.innerHTML = fogli.filter(Boolean).map(f => `<div class="foglio">${f}</div>`).join("");
    const imgs = [...s.querySelectorAll("img")];
    Promise.all(imgs.map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))).then(() => setTimeout(() => window.print(), 60));
  }
  window.addEventListener("afterprint", () => { const s = $("stampa"); if (s) s.innerHTML = ""; });
  const tit = (t, sotto) => `<h1>${C.epoca} — ${t}</h1>${sotto ? `<div class="sotto">${sotto}</div>` : ""}`;
  const parole = () => C.capitoli.flatMap(c => c.parole || []);
  const conImm = (lista, n) => `<div class="imm-r">${lista.slice(0, n).map(([f, d]) => `<figure><img src="${C.img + f}" alt=""><figcaption>${d}</figcaption></figure>`).join("")}</div>`;

  function stRiassunto() {
    const o = opzStampa.riassunto, R = A.riassunto;
    if (o.breve) {
      const B = A.riassuntoBreve;
      return [`<div class="grande">` + tit("in breve", C.date) + (o.img ? conImm(R.immagini, 3) : "") + `<p>${B.testo}</p>
        <h2>Le date</h2>${B.date.map(([d, t]) => `<p><b>${d}</b> — ${t}</p>`).join("")}
        <h2>Le parole</h2>${B.parole.map(([t, d]) => `<p><b>${t}</b>: ${d}</p>`).join("")}` + piede() + `</div>`];
    }
    return [`<div class="compatto">` + tit("scheda riassuntiva", C.date) + (o.img ? conImm(R.immagini, 4) : "") + `<p>${R.testo}</p>
      <div class="due"><div><h2>La linea del tempo</h2><div class="linea-s">${C.linea.map(([d, t]) => `<b>${d}</b><span>${t}</span>`).join("")}</div>
        ${R.punti.map(([h, l]) => `<h2>${h}</h2>${l.map(x => `<p>• ${x}</p>`).join("")}`).join("")}</div>
        <div><h2>Parole da ricordare</h2>${parole().map(([t, d]) => `<p><b>${t}</b>: ${d}</p>`).join("")}</div></div>` + piede() + `</div>`];
  }
  function stCompleta() {
    const o = opzStampa.completa;
    if (o.breve) {
      const caps = C.capitoli.filter(c => A.raccontoBreve[c.id]).map((c, i) => `<div class="pag-s${o.img ? " con-img" : ""}"><div><h2>${i + 1}. ${c.titolo}</h2><p>${A.raccontoBreve[c.id]}</p>
        ${c.brano ? `<p class="asc-b">Ascolto: <b>${c.brano}</b></p>` : ""}</div>${o.img ? `<div class="fig"><img src="${C.img + c.pagine[0].img}" alt=""></div>` : ""}</div>`).join("");
      return [`<div class="grande">` + tit("il racconto in breve", C.date) + caps + piede() + `</div>`];
    }
    const caps = C.capitoli.map((c, i) => {
      const pag = c.pagine.map(p => `<div class="pag-s${o.img ? " con-img" : ""}"><div>${p.t.map(x => `<p>${x}</p>`).join("")}</div>` +
        (o.img ? `<div class="fig"><img src="${C.img + p.img}" alt=""><div>${p.did}</div></div>` : "") + `</div>`).join("");
      const asc = c.brano ? `<div class="ascolto-s"><b>Ascolto: ${c.brano}</b> — ${c.chi}<br>${c.punti.map(x => `• ${x}`).join("<br>")}<br><i>Lo sapevi?</i> ${c.sapevi}</div>` : "";
      const pr = (c.parole || []).length && !c.riepilogo ? `<p><b>Parole da ricordare:</b> ${c.parole.map(([t, d]) => `<b>${t}</b> (${d})`).join("; ")}</p>` : "";
      return `<div class="capitolo-s"><h2>${c.riepilogo ? "" : (i + 1) + ". "}${c.titolo} <span style="font-weight:600">· ${c.data}</span></h2>${pag}${asc}${pr}<div style="clear:both"></div></div>`;
    }).join("");
    return [tit("il racconto completo", C.date) + caps + piede()];
  }
  function stVF() {
    const lista = mescola(A.vf);   // ordine nuovo a ogni stampa
    const f = intesta() + tit("vero o falso", "Segna con una crocetta V (vero) o F (falso).") +
      `<table class="vf-r"><tr><th>N.</th><th>Frase</th><th>V</th><th>F</th></tr>${lista.map((v, i) => `<tr><td>${i + 1}</td><td>${v[0]}</td><td>${quad()}</td><td>${quad()}</td></tr>`).join("")}</table>
      <div class="punteggio">Risposte giuste: ____ su ${lista.length}</div>` + piede();
    const s = conSol ? tit("vero o falso: soluzioni", "Per l'insegnante") + `<div class="sol">${lista.map((v, i) => `<p><b>${i + 1}. ${v[1] ? "VERO" : "FALSO"}</b> — ${testo(v[0])}${v[2] ? ` <i>(${v[2]})</i>` : ""}</p>`).join("")}</div>` + piede() : "";
    return [f, s];
  }
  function stMappa() {
    const buchi = new Set(A.mappaBuchi);
    const banca = mescola([...buchi, ...(A.mappaDistrattori || [])]);
    const f = intesta() + tit("completa la mappa", `Scrivi negli spazi le parole giuste, scegliendole dal riquadro.${(A.mappaDistrattori || []).length ? " Attenzione: alcune parole non servono!" : ""}`) +
      `<div class="mappa-st">${mappaHTML(buchi, "stampa", 0.8)}</div><div class="banca-s">${banca.map(x => `<span>${x}</span>`).join("")}</div>` + piede();
    const s = conSol ? tit("completa la mappa: soluzioni", "Per l'insegnante: le parole da inserire sono sottolineate.") + `<div class="mappa-st">${mappaHTML(buchi, "soluzioni", 0.8)}</div>` + piede() : "";
    return [f, s];
  }
  function stAscolto() {
    const brani = braniAscolto(), crit = A.ascolto.criteri;
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

  /* ---------- VERIFICA: generata a ogni apertura della pagina, A e B diverse ---------- */
  let VERIFICA = null;
  function preparaVerifica() {
    const V = A.verifica, comune = rngDa(Math.random());
    // le domande sono le stesse per A e B (scelte a caso a ogni apertura), cambia l'ordine
    const scelta = {
      vf: mescola(A.vf, comune).slice(0, V.quanti.vf),
      coll: mescola(parole(), comune).slice(0, V.quanti.collega),
      pers: mescola(A.personaggi, comune).slice(0, V.quanti.personaggi),
      scelte: mescola(V.scelte, comune).slice(0, V.quanti.scelte),
      frasi: mescola(V.frasi, comune).slice(0, V.quanti.frasi),
      aperte: mescola(V.aperte, comune).slice(0, V.quanti.aperte)
    };
    const versione = seme => {
      const r = rngDa(seme);
      const sez = mescola(["vf", "coll", "pers", "scelte", "frasi", "aperte"], r);
      const coll = mescola(scelta.coll, r), pers = mescola(scelta.pers, r);
      return {
        sez, vf: mescola(scelta.vf, r), aperte: mescola(scelta.aperte, r),
        coll, collDx: mescola(coll.map((c, i) => ({ d: c[1], i })), r),
        pers, persDx: mescola(pers.map((c, i) => ({ d: c[1], i })), r),
        scelte: mescola(scelta.scelte, r).map(([d, op, g]) => ({ d, o: mescola(op.map((t, j) => ({ t, ok: j === g })), r) })),
        frasi: mescola(scelta.frasi, r), banca: mescola([...scelta.frasi.map(f => f.match(/\[\[(.+?)\]\]/)[1]), ...(V.frasiDistrattori || [])], r)
      };
    };
    let a, b, n = 0;
    do { a = versione(Math.random()); b = versione(Math.random()); n++; }
    while (n < 20 && (a.sez.join() === b.sez.join() || a.vf[0] === b.vf[0]));   // A e B devono essere diverse
    VERIFICA = { A: a, B: b };
  }
  function grigliaPunteggio(tot) {
    const soglie = [[10, .95], [9, .85], [8, .75], [7, .65], [6, .55], [5, .45], [4, 0]];
    let alto = tot;
    const righe = soglie.map(([dec, p]) => { const basso = Math.ceil(tot * p); const r = `<td>${basso === alto ? basso : basso + "–" + alto}</td>`; alto = basso - 1; return [dec, r]; });
    return `<table class="voto" style="width:auto;margin-top:2mm"><tr><th>Punti ottenuti</th>${righe.map(r => r[1]).join("")}</tr><tr><th>Punteggio in decimi</th>${righe.map(r => `<td>${r[0]}</td>`).join("")}</tr></table>
      <div style="font-size:8.5pt">Griglia indicativa: ognuno può adattarla ai propri criteri.</div>`;
  }
  function stVerifica(vers) {
    const D = VERIFICA[vers], L = "ABCDEFGHIJ";
    const punti = { vf: D.vf.length, coll: D.coll.length, pers: D.pers.length, scelte: D.scelte.length, frasi: D.frasi.length, aperte: D.aperte.reduce((s, a) => s + a[1], 0) };
    const tot = Object.values(punti).reduce((s, x) => s + x, 0);
    const pt = p => `(${p} ${p === 1 ? "punto" : "punti"})`;
    const corpoSez = {
      vf: () => `Vero o falso: segna V o F ${pt(punti.vf)}</h2><table class="vf-r"><tr><th>N.</th><th>Frase</th><th>V</th><th>F</th></tr>${D.vf.map((v, i) => `<tr><td>${i + 1}</td><td>${v[0]}</td><td>${quad()}</td><td>${quad()}</td></tr>`).join("")}</table>`,
      coll: () => `Collega ogni parola alla sua definizione: scrivi la lettera giusta ${pt(punti.coll)}</h2><div class="collega-s">${D.coll.map((c, i) => `<div>${i + 1}. <b>${c[0]}</b> → ____</div><div>${L[i]}. ${D.collDx[i].d}</div>`).join("")}</div>`,
      pers: () => `Chi ha fatto cosa? Scrivi la lettera giusta ${pt(punti.pers)}</h2><div class="collega-s">${D.pers.map((c, i) => `<div>${i + 1}. <b>${c[0]}</b> → ____</div><div>${L[i]}. ${D.persDx[i].d}</div>`).join("")}</div>`,
      scelte: () => `Scegli la risposta giusta ${pt(punti.scelte)}</h2><ol class="scelte">${D.scelte.map(s => `<li>${s.d}<div class="op">${s.o.map(o => `<span>${quad()}${o.t}</span>`).join("")}</div></li>`).join("")}</ol>`,
      frasi: () => `Completa le frasi con le parole del riquadro ${pt(punti.frasi)}</h2><div class="banca-v">${D.banca.map(w => `<span>${w}</span>`).join("")}</div><ol class="frasi">${D.frasi.map(f => `<li>${f.replace(/\[\[(.+?)\]\]/, '<span class="buco-v"></span>')}</li>`).join("")}</ol>`,
      aperte: () => `Rispondi con parole tue ${pt(punti.aperte)}</h2>${D.aperte.map(([d, p], i) => `<p><b>${String.fromCharCode(97 + i)})</b> ${d} <i>(${p} punti)</i></p>${'<div class="linee"></div>'.repeat(p + 1)}`).join("")}`
    };
    const f = `<div class="verifica">` + intesta() + tit(`verifica — versione ${vers}`, "Leggi bene ogni domanda prima di rispondere.") +
      D.sez.map((k, i) => `<h2>${i + 1}. ${corpoSez[k]()}`).join("") +
      `<div class="punteggio" style="font-size:12pt">Punteggio: ______ / ${tot}</div>` + piede() + `</div>`;
    if (!conSol) return [f];
    const solSez = {
      vf: () => `Vero o falso</h3><p>${D.vf.map((v, i) => `${i + 1}. ${v[1] ? "V" : "F"}`).join(" · ")}</p>`,
      coll: () => `Parole e definizioni</h3><p>${D.coll.map((c, i) => `${i + 1}. ${c[0]} → ${L[D.collDx.findIndex(x => x.i === i)]}`).join(" · ")}</p>`,
      pers: () => `Chi ha fatto cosa</h3><p>${D.pers.map((c, i) => `${i + 1}. ${c[0]} → ${L[D.persDx.findIndex(x => x.i === i)]}`).join(" · ")}</p>`,
      scelte: () => `Scelta multipla</h3><p>${D.scelte.map((s, i) => `${i + 1}. ${s.o.find(o => o.ok).t}`).join(" · ")}</p>`,
      frasi: () => `Completa le frasi</h3><p>${D.frasi.map((fr, i) => `${i + 1}. ${fr.match(/\[\[(.+?)\]\]/)[1]}`).join(" · ")}</p>`,
      aperte: () => `Domande aperte</h3>${D.aperte.map(([d, p, t], i) => `<p><b>${String.fromCharCode(97 + i)})</b> <i>${d}</i> (${p} punti)<br>Cosa dovrebbe esserci: ${t}</p>`).join("")}`
    };
    const sol = tit(`verifica — versione ${vers}: soluzioni`, "Per l'insegnante") + `<div class="sol">` + D.sez.map((k, i) => `<h3>${i + 1}. ${solSez[k]()}`).join("") +
      `<h3>Punteggio totale: ${tot}</h3>${grigliaPunteggio(tot)}</div>` + piede();
    return [f, sol];
  }

  /* =========================================================
     PANNELLI: Mappa, Esercizi, Schede
     ========================================================= */
  function pannelli() {
    const vm = $("vistaMappa");
    const s = largo.matches ? 372 / A.mappa.H : Math.min(1, (window.innerWidth - 40) / A.mappa.W);
    vm.innerHTML = `<button type="button" class="mc-anteprima" aria-label="Apri la mappa concettuale a schermo intero">${mappaHTML(null, "anteprima", s)}<span class="mc-tocca">Tocca per ingrandire</span></button>`;
    vm.addEventListener("click", e => { if (e.target.closest(".mc-anteprima")) mostraMappa(); });

    const ES = [
      ["collega", "Parole e significati", "Collega ogni parola alla sua definizione.", () => esCollega({ titolo: "Parole e significati", istruzioni: "Tocca una parola a sinistra, poi la sua definizione a destra.", coppie: () => parole().map(([t, d]) => [t, d.charAt(0).toUpperCase() + d.slice(1)]) })],
      ["persona", "Chi ha fatto cosa?", "Collega i personaggi a quello che hanno fatto.", () => esCollega({ titolo: "Chi ha fatto cosa?", istruzioni: "Tocca un personaggio a sinistra, poi quello che ha fatto a destra.", coppie: () => A.personaggi })],
      ["strumento", "Che strumento è?", "Uno strumento alla volta, grande: riconoscilo!", esStrumenti],
      ["vf", "Vero o falso?", `${A.vf.length} frasi: tocca VERO o FALSO e scopri subito se è giusto.`, esVF],
      ["mappa", "Completa la mappa", "Metti ogni parola al suo posto nella mappa concettuale.", esMappa],
      ["griglia", "Cruciverba", "Le parole da ricordare, incrociate.", esCruci],
      ["cuffie", "Esercizi di ascolto", "Ascolta ogni brano e rispondi: sacro o profano? Voci o strumenti?", esAscolto]
    ];
    const ve = $("vistaEsercizi");
    ve.innerHTML = `<div class="a-carte es">${ES.map((e, i) => `<button type="button" class="a-carta" data-i="${i}" style="--accent:${COLORI[i]}">${icona(e[0])}<span><b>${e[1]}</b><small>${e[2]}</small></span></button>`).join("")}</div>`;
    ve.addEventListener("click", e => { const b = e.target.closest(".a-carta"); if (b) ES[+b.dataset.i][3](); });

    const scelte = id => `<span class="a-scelta" data-o="${id}" data-k="breve"><button type="button" class="si" data-v="0">Completa</button><button type="button" data-v="1">Breve</button></span>
      <span class="a-scelta" data-o="${id}" data-k="img"><button type="button" class="si" data-v="1">Con immagini</button><button type="button" data-v="0">Senza</button></span>`;
    const SC = [
      ["foglio", "Scheda riassuntiva", "Una pagina da incollare sul quaderno.", [["Stampa", () => stampa(stRiassunto())]], scelte("riassunto")],
      ["libro", "Il racconto completo", "Tutti i capitoli, su più pagine.", [["Stampa", () => stampa(stCompleta())]], scelte("completa")],
      ["vf", "Vero o falso", "Le frasi in ordine diverso a ogni stampa.", [["Alla LIM", esVF], ["Stampa", () => stampa(stVF())]]],
      ["mappa", "Mappa da completare", "Con le parole da scegliere.", [["Alla LIM", esMappa], ["Stampa", () => stampa(stMappa(), true)]]],
      ["cuffie", "Scheda d'ascolto", "Una griglia per ogni brano.", [["Alla LIM", esAscolto], ["Stampa", () => stampa(stAscolto())]]],
      ["griglia", "Cruciverba", "Da risolvere sulla carta.", [["Alla LIM", esCruci], ["Stampa", () => stampa(stCruci())]]],
      ["verifica", "Verifica finale", "Fronte e retro. A e B sono diverse e cambiano a ogni apertura della pagina.", [["Versione A", () => stampa(stVerifica("A"))], ["Versione B", () => stampa(stVerifica("B"))]]]
    ];
    const vs = $("vistaSchede");
    vs.innerHTML = `<div class="a-opzioni"><label><input type="checkbox" id="sSol" checked> Aggiungi le soluzioni per l'insegnante (su un foglio a parte)</label></div>
      <div class="a-carte sc">${SC.map((s, i) => `<div class="a-carta" style="--accent:${COLORI[i]}">${icona(s[0])}<span><b>${s[1]}</b><small>${s[2]}</small>
        ${s[4] ? `<span class="opz-c">${s[4]}</span>` : ""}
        <span class="bottoni">${s[3].map((b, j) => `<button type="button" class="a-bot${j === s[3].length - 1 ? " pieno" : ""}" data-i="${i}" data-j="${j}">${b[0]}</button>`).join("")}</span></span></div>`).join("")}</div>`;
    vs.addEventListener("click", e => {
      const b = e.target.closest(".a-bot"); if (b) { SC[+b.dataset.i][3][+b.dataset.j][1](); return; }
      const o = e.target.closest(".a-scelta button"); if (!o) return;
      const g = o.parentNode;
      g.querySelectorAll("button").forEach(x => x.classList.toggle("si", x === o));
      opzStampa[g.dataset.o][g.dataset.k] = o.dataset.v === "1";
    });
    $("sSol").addEventListener("change", e => { conSol = e.target.checked; });
  }

  window.StoriaAttivita = {
    avvia(cfg) {
      C = cfg; A = cfg.attivita;
      creaFinestra();
      const s = document.createElement("div"); s.id = "stampa"; document.body.appendChild(s);
      preparaVerifica();
      pannelli();
    },
    _genera: v => generaCruci(v), _paroleMappa: () => paroleMappa()
  };
})();
