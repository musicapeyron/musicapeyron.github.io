/* =========================================================
   storia-percorso.js — il percorso guidato delle pagine delle epoche della storia della musica:
   indice dei capitoli, capitoli a pagine (immagine + testo, poi ascolto e parole da ricordare),
   schede Strumenti / Da suonare, finestra degli strumenti, crediti.
   Uguale per tutte le epoche: la pagina passa solo i dati.

   Uso, in fondo alla pagina (dopo storia-attivita.js, prima di adatta-schermo.js):
     StoriaPercorso.avvia({ epoca, date, img, capitoli, linea, strumenti, suonare, crediti, attivita,
                            prossima: { nome: "Rinascimento", articolo: "il", url: "storia-rinascimento.html" },
                            colori: { sacro: "#a78bfa", profano: "#F99D1C" } });   // colori: facoltativo
   La pagina ha il banner, le schede (data-scheda), #vistaPercorso con #indice, #griglia, le viste
   di mappa/esercizi/schede e #listaCrediti. Il capitolo (#capitolo) e la finestra degli strumenti
   (#velo) li crea questo script. Formato dei dati: _sviluppo/storia/LEGGIMI.md.
   ========================================================= */
(function () {
  "use strict";
  function avvia(cfg) {
  const IMG = cfg.img, CAPITOLI = cfg.capitoli, LINEA = cfg.linea || [], STRUMENTI = cfg.strumenti || [], SUONARE = cfg.suonare || [];
  const P = cfg.prossima || null;
  const contenitore = document.createElement("div");
  contenitore.innerHTML = `<!-- ======== un capitolo del percorso: schermata intera ======== -->
<section class="capitolo" id="capitolo" aria-labelledby="cTitolo" hidden>
  <div class="c-telaio" id="cTelaio">
    <div class="c-barra">
      <button type="button" class="c-indice" id="cIndice">☰ Indice</button>
      <div class="c-testa"><span class="c-label" id="cLabel"></span><h2 id="cTitolo"></h2><span class="c-data" id="cData"></span></div>
      <span class="c-num" id="cNum"></span>
    </div>
    <div class="c-avanz" id="cAvanz" aria-hidden="true"></div>
    <article class="c-diapo" id="cDiapo" aria-live="polite"></article>
    <nav class="c-nav" aria-label="Pagine del capitolo">
      <button type="button" class="c-freccia indietro" id="cPrec" aria-label="Indietro">◀</button>
      <div class="c-pallini" id="cPallini"></div>
      <button type="button" class="c-freccia avanti" id="cSucc"><span id="cSuccTesto"></span> ▶</button>
    </nav>
  </div>
</section>

<!-- ======== finestra piccola: gli strumenti ======== -->
<div class="velo" id="velo" role="dialog" aria-modal="true" aria-labelledby="fTitolo">
  <div class="finestra" id="finestra">
    <button class="chiudi" id="chiudi" aria-label="Chiudi">✕</button>
    <div class="schermo" id="schermo"></div>
    <div class="info">
      <span class="label" id="fLabel"></span>
      <h3 id="fTitolo"></h3>
      <div class="chi" id="fChi"></div>
      <div class="gancio" id="fGancio"></div>
      <ul id="fPunti"></ul>
      <div class="sapevi" id="fSapevi"></div>
      <div class="piede">
        <div class="frecce"><button class="freccia" id="prec">◀</button><button class="freccia" id="succ">▶</button></div>
        <div id="fFonte"></div>
      </div>
    </div>
  </div>
</div>

`;
  while (contenitore.firstChild) document.body.appendChild(contenitore.firstChild);

  /* ---------- schede ---------- */
  const vistaPercorso = document.getElementById("vistaPercorso"), griglia = document.getElementById("griglia");
  const nC = document.getElementById("nCapitoli"), nS = document.getElementById("nStrumenti"), nD = document.getElementById("nSuonare");
  if (nC) nC.textContent = CAPITOLI.length - 1;
  if (nS) nS.textContent = STRUMENTI.length;
  if (nD) nD.textContent = SUONARE.length;
  const accento = c => (cfg.colori || { sacro: "#a78bfa", profano: "#F99D1C" })[c.mondo] || "#F99D1C";

  /* indice del percorso */
  document.getElementById("indice").innerHTML = `<li><button type="button" class="inizia" id="inizia">▶ Comincia il viaggio</button></li>` + CAPITOLI.map((c, i) => `
    <li><button type="button" class="voce ${c.mondo}${c.riepilogo ? " fine" : ""}" data-i="${i}" style="--accent:${accento(c)}">
      <span class="v-num">${c.riepilogo ? "★" : i + 1}</span>
      ${c.img ? `<span class="v-foto" style="background-image:url('${IMG + c.img}')"></span>` : `<span class="v-foto v-vuota"></span>`}
      <span class="v-testo"><span class="v-data">${c.data}</span><span class="v-titolo">${c.titolo}</span>
        <span class="v-brano">${c.brano ? "♪ " + c.brano + " · " + c.chi : "Le date e le parole da ricordare"}</span></span>
      <span class="v-vai" aria-hidden="true">›</span></button></li>`).join("");
  document.getElementById("indice").addEventListener("click", e => { const b = e.target.closest(".voce"); if (b) apriCapitolo(+b.dataset.i); });
  document.getElementById("inizia").addEventListener("click", () => apriCapitolo(0));

  function disegnaGriglia(scheda) {
    griglia.innerHTML = "";
    if (scheda === "suonare") {
      SUONARE.forEach(s => {
        const c = document.createElement("div"); c.className = "card suona empty";
        c.innerHTML = `<div class="foto" style="background-image:url('${IMG + s.img}')"></div>
          <div class="testo"><span class="label">Da suonare</span><h2>${s.titolo}</h2><span class="chi">${s.chi}</span></div>`;
        griglia.appendChild(c);
      });
      return;
    }
    STRUMENTI.forEach((d, i) => {
      const c = document.createElement("button"); c.type = "button"; c.className = "card strum";
      c.innerHTML = `<div class="foto" style="background-image:url('${IMG + d.img}')"></div>
        <div class="testo"><span class="label">${d.label}</span><h2>${d.titolo}</h2><span class="chi">${d.chi}</span><p>${d.gancio}</p></div>`;
      c.addEventListener("click", () => apriStrumento(STRUMENTI, i));
      griglia.appendChild(c);
    });
  }
  document.querySelectorAll(".scheda").forEach(b => b.addEventListener("click", () => {
    const s = b.dataset.scheda;
    document.querySelectorAll(".scheda").forEach(x => x.classList.toggle("attiva", x === b));
    vistaPercorso.hidden = s !== "percorso"; griglia.hidden = s !== "strumenti" && s !== "suonare";
    ["mappa", "esercizi", "schede"].forEach(v => { document.getElementById("vista" + v[0].toUpperCase() + v.slice(1)).hidden = s !== v; });
    if (!griglia.hidden) disegnaGriglia(s);
  }));

  /* ---------- anteprima del video: nessuna richiesta a YouTube finché non si preme play ---------- */
  function preparaSchermo(el, v) {
    el.innerHTML = "";
    el.style.backgroundImage = `url('${IMG + v.img}')`;
    const b = document.createElement("button"); b.className = "avvio"; b.type = "button";
    b.innerHTML = `<span class="tondo">▶</span><span class="nota">Il video si carica da YouTube quando premi play</span>`;
    b.addEventListener("click", () => {
      el.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.yt}?autoplay=1&rel=0&playsinline=1" title="${v.brano || v.titolo}"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    });
    el.appendChild(b);
    return b;
  }

  /* ---------- un capitolo: una pagina alla volta, si va avanti con la freccia ---------- */
  const cap = document.getElementById("capitolo"), cDiapo = document.getElementById("cDiapo");
  const $ = id => document.getElementById(id);
  let attuale = -1, pag = 0, diapo = [];
  // le pagine di un capitolo: i paragrafi (con la loro immagine), poi l'ascolto, poi le parole da ricordare
  function pagineDi(c) {
    const d = c.pagine.map(p => ({ tipo: "testo", p }));
    if (c.brano) d.push({ tipo: "ascolto" });
    if (c.riepilogo) d.push({ tipo: "linea" }, { tipo: "fine" });
    else if ((c.parole || []).length || (c.strumenti || []).length) d.push({ tipo: "ricorda" });
    return d;
  }
  function apriCapitolo(i, daStoria, ultima) {
    const nuovo = Math.max(0, Math.min(CAPITOLI.length - 1, i));
    const cambia = nuovo !== attuale || cap.hidden;
    attuale = nuovo;
    const c = CAPITOLI[attuale];
    diapo = pagineDi(c);
    cap.style.setProperty("--accent", accento(c));
    $("cNum").textContent = c.riepilogo ? "Fine del percorso" : `Capitolo ${attuale + 1} di ${CAPITOLI.length - 1}`;
    $("cAvanz").innerHTML = CAPITOLI.map((_, k) => `<span class="${k < attuale ? "fatto" : k === attuale ? "qui" : ""}"></span>`).join("");
    $("cLabel").textContent = c.label;
    $("cTitolo").textContent = c.titolo;
    $("cData").textContent = c.data;
    cap.hidden = false; document.body.classList.add("in-capitolo");
    if (cambia && !daStoria) history.pushState({ c: attuale }, "", "#capitolo-" + (attuale + 1));
    mostraPagina(ultima ? diapo.length - 1 : 0);
  }
  // icone dei pallini (niente emoji)
  const svg = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const ICO = { cuffie: svg('<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="7" rx="1.5"/><rect x="17" y="14" width="4" height="7" rx="1.5"/>'),
    foglio: svg('<path d="M6 2h9l5 5v15H6z"/><path d="M9 12h8M9 16h8"/>'), orologio: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>') };
  function mostraPagina(k) {
    pag = k;
    const c = CAPITOLI[attuale], d = diapo[pag];
    cDiapo.className = "c-diapo tipo-" + d.tipo;
    if (d.tipo === "testo") {
      const p = d.p;
      cDiapo.innerHTML = `<figure class="d-fig"><div class="d-img"><img src="${IMG + p.img}" alt=""></div><figcaption>${p.did}</figcaption></figure>
        <div class="d-testo">${p.t.map(x => `<p>${x}</p>`).join("")}</div>`;
    } else if (d.tipo === "ascolto") {
      cDiapo.innerHTML = `<div class="d-sx"><div class="schermo c-schermo" id="cSchermo"></div><div class="c-fonte" id="cFonte"></div>
          <div class="c-altri" id="cAltri">${(c.altri || []).map((a, k) => `<button type="button" class="altro" data-k="${k}">Ascolta anche: <b>${a.brano}</b> · ${a.chi}</button>`).join("")}</div></div>
        <div class="d-dx"><span class="d-tag">Ascoltiamo</span><h3 class="d-brano" id="cBrano">${c.brano}</h3><div class="c-chi" id="cChi">${c.chi}</div>
          <div class="c-gancio">${c.gancio}</div><ul class="c-punti">${c.punti.map(p => `<li>${p}</li>`).join("")}</ul>
          <div class="c-sapevi"><b>Lo sapevi?</b> ${c.sapevi}</div></div>`;
      mostraAscolto(c);
    } else if (d.tipo === "ricorda") {
      const strum = (c.strumenti || []).map(id => STRUMENTI.findIndex(s => s.id === id)).filter(k => k >= 0);
      cDiapo.innerHTML = `<h3 class="d-sez">Parole da ricordare</h3><dl class="c-parole">${(c.parole || []).map(([t, x]) => `<div><dt>${t}</dt><dd>${x}</dd></div>`).join("")}</dl>` +
        (strum.length ? `<h3 class="d-sez">Gli strumenti di questo capitolo <small>(tocca per ascoltare)</small></h3><div class="c-strumenti">${strum.map(k => `<button type="button" class="c-strum" data-k="${k}"><span class="foto" style="background-image:url('${IMG + STRUMENTI[k].img}')"></span>
          <span><b>${STRUMENTI[k].titolo}</b><small>${STRUMENTI[k].chi}</small></span></button>`).join("")}</div>` : "");
    } else if (d.tipo === "linea") {
      cDiapo.innerHTML = `<h3 class="d-sez">La linea del tempo</h3><ol class="linea">${LINEA.map(([x, t]) => `<li><b>${x}</b><span>${t}</span></li>`).join("")}</ol>`;
    } else {
      cDiapo.innerHTML = `<h3 class="d-sez">Tutte le parole da ricordare</h3><dl class="c-parole tutte">${CAPITOLI.flatMap(x => x.parole || []).map(([t, x]) => `<div><dt>${t}</dt><dd>${x}</dd></div>`).join("")}</dl>
        ${P ? `<p class="d-prossima">Il viaggio continua con ${P.articolo} <b>${P.nome}</b>: premi la freccia ▶</p>` : ""}`;
    }
    $("cPallini").innerHTML = diapo.map((x, j) => `<button type="button" class="pallino${j === pag ? " qui" : j < pag ? " fatto" : ""}" data-j="${j}" aria-label="Pagina ${j + 1}">${x.tipo === "ascolto" ? ICO.cuffie : x.tipo === "ricorda" || x.tipo === "fine" ? ICO.foglio : x.tipo === "linea" ? ICO.orologio : j + 1}</button>`).join("");
    const prima = attuale === 0 && pag === 0;
    $("cPrec").disabled = prima;
    $("cSucc").disabled = !P && attuale === CAPITOLI.length - 1 && pag === diapo.length - 1;
    const s = CAPITOLI[attuale + 1];
    $("cSuccTesto").textContent = pag < diapo.length - 1 ? (diapo[pag + 1].tipo === "ascolto" ? "Ascoltiamo" : "Avanti") : s ? (s.riepilogo ? "Ricapitoliamo" : "Capitolo " + (attuale + 2)) : (P ? (P.articolo + " " + P.nome).replace(/^./, x => x.toUpperCase()) : "Fine");
  }
  function avanti() {
    if (pag < diapo.length - 1) mostraPagina(pag + 1);
    else if (attuale < CAPITOLI.length - 1) apriCapitolo(attuale + 1);
    else if (P) location.href = P.url;   // dopo l'ultima pagina: l'epoca successiva
  }
  function indietro() {
    if (pag > 0) mostraPagina(pag - 1);
    else if (attuale > 0) apriCapitolo(attuale - 1, false, true);
  }
  function mostraAscolto(v) {
    preparaSchermo($("cSchermo"), v);
    $("cFonte").innerHTML = `Video: ${v.canale} · <a href="https://www.youtube.com/watch?v=${v.yt}" target="_blank" rel="noopener">Apri su YouTube ↗</a>`;
  }
  cDiapo.addEventListener("click", e => {
    const b = e.target.closest(".altro");
    if (b) {
      const c = CAPITOLI[attuale], a = c.altri[+b.dataset.k];
      const torna = b.classList.toggle("attivo");
      mostraAscolto(torna ? a : c);
      $("cBrano").textContent = torna ? a.brano : c.brano; $("cChi").textContent = torna ? a.chi : c.chi;
      b.innerHTML = torna ? `Torna a: <b>${c.brano}</b> · ${c.chi}` : `Ascolta anche: <b>${a.brano}</b> · ${a.chi}`;
      return;
    }
    const st = e.target.closest(".c-strum");
    if (st) apriStrumento(STRUMENTI, +st.dataset.k);
  });
  $("cPallini").addEventListener("click", e => { const b = e.target.closest(".pallino"); if (b) mostraPagina(+b.dataset.j); });
  function chiudiCapitolo(daStoria) {
    if (cap.hidden) return;
    cap.hidden = true; cDiapo.innerHTML = ""; document.body.classList.remove("in-capitolo");
    if (!daStoria && location.hash) history.pushState({}, "", location.pathname);
    const v = document.querySelector(`.voce[data-i="${attuale}"]`); if (v) v.focus({ preventScroll: true });
  }
  $("cIndice").addEventListener("click", () => chiudiCapitolo());
  $("cPrec").addEventListener("click", indietro);
  $("cSucc").addEventListener("click", avanti);
  window.addEventListener("popstate", () => {
    const m = location.hash.match(/^#capitolo-(\d+)$/);
    if (m) apriCapitolo(+m[1] - 1, true); else chiudiCapitolo(true);
  });
  { const m = location.hash.match(/^#capitolo-(\d+)$/); if (m) apriCapitolo(+m[1] - 1, true); }

  /* ---------- finestra piccola: uno strumento ---------- */
  const velo = $("velo"), schermo = $("schermo"), finestra = $("finestra");
  let elencoS = STRUMENTI, iS = 0;
  function apriStrumento(lista, i) {
    elencoS = lista; iS = (i + lista.length) % lista.length;
    const d = lista[iS];
    finestra.style.setProperty("--accent", "#5EC8D8");
    $("fLabel").textContent = d.label; $("fTitolo").textContent = d.titolo; $("fChi").textContent = d.chi; $("fGancio").textContent = d.gancio;
    $("fPunti").innerHTML = d.punti.map(p => `<li>${p}</li>`).join("");
    $("fSapevi").innerHTML = `<b>Lo sapevi?</b> ${d.sapevi}`;
    $("fFonte").innerHTML = `<a href="https://www.youtube.com/watch?v=${d.yt}" target="_blank" rel="noopener">Apri su YouTube ↗</a>`;
    preparaSchermo(schermo, d).focus({ preventScroll: true });
    velo.classList.add("aperto"); document.body.style.overflow = "hidden";
  }
  function chiudiStrumento() { velo.classList.remove("aperto"); schermo.innerHTML = ""; document.body.style.overflow = ""; }
  $("chiudi").addEventListener("click", chiudiStrumento);
  velo.addEventListener("click", e => { if (e.target === velo) chiudiStrumento(); });
  $("prec").addEventListener("click", () => apriStrumento(elencoS, iS - 1));
  $("succ").addEventListener("click", () => apriStrumento(elencoS, iS + 1));
  document.addEventListener("keydown", e => {
    if (velo.classList.contains("aperto")) {
      if (e.key === "Escape") chiudiStrumento();
      if (e.key === "ArrowRight") apriStrumento(elencoS, iS + 1);
      if (e.key === "ArrowLeft") apriStrumento(elencoS, iS - 1);
      return;
    }
    if (cap.hidden || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === "Escape") chiudiCapitolo();
    if (e.key === "ArrowRight") avanti();
    if (e.key === "ArrowLeft") indietro();
  });

  /* ---------- crediti ---------- */
  const videoCapitoli = CAPITOLI.filter(c => c.brano).flatMap(c => [c, ...(c.altri || [])]);
  $("listaCrediti").innerHTML = (cfg.crediti || []).map(c => `<li>${c}</li>`).join("") +
    [...videoCapitoli.map(c => ({ titolo: c.brano, chi: c.chi, yt: c.yt, canale: c.canale })), ...STRUMENTI]
      .map(d => `<li>${d.titolo} (${d.chi}): video di <a href="https://www.youtube.com/watch?v=${d.yt}" target="_blank" rel="noopener">${d.canale}</a> su YouTube</li>`).join("");


  if (window.StoriaAttivita && cfg.attivita) StoriaAttivita.avvia({ epoca: cfg.epoca, date: cfg.date, img: IMG, capitoli: CAPITOLI, strumenti: STRUMENTI, linea: LINEA,
    attivita: cfg.attivita, apriCapitolo: i => apriCapitolo(i), preparaSchermo });
  }
  window.StoriaPercorso = { avvia };
})();
