/* =========================================================
   adatta-schermo.js — sui PC e sulla LIM (schermi larghi almeno 900 px e alti almeno 560)
   la schermata visibile del gioco si ingrandisce in proporzione fino a
   riempire la finestra, come una diapositiva, senza mai superarla.
   Sul telefono in verticale fa solo da "rete di sicurezza": se la schermata sporge di poco
   (un passo lungo del tutorial, un telefono piccolo) la rimpicciolisce un poco, mai sotto l'85%;
   se sporge di più lascia scorrere. Il layout del telefono va fatto nel CSS del gioco
   (@media (max-width: 620px) and (orientation: portrait)), vedi _sviluppo/GUIDA-INTERFACCE-GIOCHI.md.

   Attenzione: con lo zoom anche le misure in vh crescono. Per finestre e pannelli
   con max-height in vh, nella parte "larga" del CSS dividere per var(--zoom, 1),
   es. max-height: calc((100vh - 40px) / var(--zoom, 1)).

   Uso, in fondo alla pagina del gioco:
     <script src="adatta-schermo.js" data-schermate="#homeScreen, #gameContainer"></script>
   data-schermate = le schermate principali del gioco (menu, gioco...):
   quella visibile decide quanto ingrandire. Il gioco può chiamare
   window.adattaSchermo() se cambia molto la sua altezza.
   Il layout "largo" di ogni gioco è nel suo CSS, in @media (min-width: 900px) and (min-height: 560px).
   Se il gioco sposta elementi usando getBoundingClientRect, vedi fattoreSchermo() qui sotto.
   ========================================================= */
(function () {
  var script = document.currentScript;
  var selettori = (script && script.getAttribute("data-schermate")) || "";
  var MIN = 0.65, MAX = 2.2;
  // schermi larghi e non troppo bassi: così i telefoni girati in orizzontale (larghi
  // anche 930 px ma alti circa 400) tengono la loro impaginazione
  var largo = window.matchMedia("(min-width: 900px) and (min-height: 560px)");
  var telefono = window.matchMedia("(max-width: 620px) and (orientation: portrait)");
  var MIN_TEL = 0.85;

  function schermate() {
    return selettori.split(",").map(function (s) { return document.querySelector(s.trim()); }).filter(Boolean);
  }
  function visibile() {
    var tutte = schermate();
    for (var i = 0; i < tutte.length; i++) {
      var e = tutte[i];
      if (getComputedStyle(e).display !== "none" && e.offsetHeight > 0) return e;
    }
    return null;
  }

  // telefono: solo rimpicciolire un poco se la pagina sporge di poco
  function adattaTelefono() {
    var b = document.body, d = document.documentElement;
    b.style.zoom = "";
    d.style.removeProperty("--zoom");
    var h = d.scrollHeight, H = window.innerHeight;
    if (h <= H + 1) return;
    var z = Math.max(MIN_TEL, H / h);
    b.style.zoom = z;
    while (z > MIN_TEL && d.scrollHeight > window.innerHeight + 1) { z -= 0.01; b.style.zoom = z; }
    if (d.scrollHeight > window.innerHeight + 1 && z <= MIN_TEL) { b.style.zoom = ""; return; }   // troppo alta: si scorre a grandezza normale
    d.style.setProperty("--zoom", z);
  }

  function adatta() {
    var b = document.body;
    if (!largo.matches) {
      if (telefono.matches) { adattaTelefono(); return; }
      b.style.zoom = ""; document.documentElement.style.removeProperty("--zoom"); return;
    }
    var el = visibile();
    if (!el) return;
    b.style.zoom = 1;
    var cs = getComputedStyle(b);
    var padV = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    var padO = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    // si misura anche ciò che sporge dalla schermata (scrollWidth/scrollHeight)
    var w = Math.max(el.offsetWidth, el.scrollWidth), h = Math.max(el.offsetHeight, el.scrollHeight);
    var z = Math.min((window.innerWidth - padO) / w, (window.innerHeight - padV) / h);
    z = Math.max(MIN, Math.min(z, MAX));
    b.style.zoom = z;
    document.documentElement.style.setProperty("--zoom", z);
    // controllo sul risultato vero: se qualcosa sporge ancora, si scende un poco alla volta
    var d = document.documentElement;
    while (z > MIN && (d.scrollHeight > window.innerHeight || d.scrollWidth > window.innerWidth)) {
      z -= 0.02;
      b.style.zoom = z;
    }
    document.documentElement.style.setProperty("--zoom", z);
  }

  // si ricalcola quando cambia la finestra o quando si passa da una schermata all'altra
  var attesa = 0;
  function presto() { cancelAnimationFrame(attesa); attesa = requestAnimationFrame(adatta); }
  window.addEventListener("resize", presto);
  var osserva = new MutationObserver(presto);
  // se la schermata cambia altezza (es. si apre un gruppo di opzioni) si ricalcola;
  // si ignora il cambio dovuto allo zoom stesso (stesse misure di prima)
  var ultime = new WeakMap();
  var misura = "ResizeObserver" in window ? new ResizeObserver(function (voci) {
    var cambiata = false;
    voci.forEach(function (v) {
      var m = Math.round(v.target.offsetWidth) + "x" + Math.round(v.target.offsetHeight);
      if (ultime.get(v.target) !== m) { ultime.set(v.target, m); cambiata = true; }
    });
    if (cambiata) presto();
  }) : null;
  function avvia() {
    schermate().forEach(function (e) {
      osserva.observe(e, { attributes: true, attributeFilter: ["style", "class", "hidden"] });
      if (misura) misura.observe(e);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(presto);
    adatta();
  }
  // Telefono: pentagrammi senza spazio vuoto sopra e sotto. Il contenitore del disegno ha
  // data-ritaglia-tel="y altezza" (in unità del disegno, es. "30 155"): ogni <svg> che ci compare
  // dentro viene ritagliato a quella fascia, così a parità di riquadro il pentagramma è più grande.
  // Con un terzo valore "LxA" (es. "36 124 220x200") si ritagliano solo i disegni di quella misura
  // (utile se nel contenitore ci sono anche altri disegni, es. la tastiera nel tutorial).
  // La fascia è fissa (non segue le note) perché la scala non cambi fra una domanda e l'altra.
  function ritaglia(svg) {
    if (!telefono.matches || svg.dataset.ritagliato) return;
    var box = svg.parentElement && svg.parentElement.closest("[data-ritaglia-tel]");
    if (!box) return;
    var vb = (svg.getAttribute("viewBox") || ("0 0 " + (svg.getAttribute("width") || 0) + " " + (svg.getAttribute("height") || 0))).split(/[\s,]+/).map(Number);
    var f = box.getAttribute("data-ritaglia-tel").split(/\s+/).map(Number);
    var solo = box.getAttribute("data-ritaglia-tel").split(/\s+/)[2];
    if (!vb[2] || f.length < 2) return;
    if (solo && solo !== vb[2] + "x" + vb[3]) return;
    svg.setAttribute("viewBox", vb[0] + " " + f[0] + " " + vb[2] + " " + f[1]);
    // anche le misure dichiarate seguono il ritaglio (il browser ne ricava le proporzioni)
    var w = parseFloat(svg.getAttribute("width")) || vb[2];
    var h = Math.round(f[1] * w / vb[2]);
    svg.setAttribute("height", h);
    if (svg.style.height) svg.style.height = h + "px";
    svg.dataset.ritagliato = "1";
  }
  function cercaDaRitagliare() {
    document.querySelectorAll("[data-ritaglia-tel] svg").forEach(ritaglia);
  }
  // si osservano solo i contenitori marcati (poco lavoro: niente telefoni che scaldano)
  function osservaRitagli() {
    document.querySelectorAll("[data-ritaglia-tel]").forEach(function (c) {
      new MutationObserver(cercaDaRitagliare).observe(c, { childList: true, subtree: true });
    });
    cercaDaRitagliare();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", osservaRitagli); else osservaRitagli();

  window.adattaSchermo = adatta;
  // fattore di ingrandimento attuale (1 sul telefono). Attenzione: con lo zoom,
  // getBoundingClientRect() dà misure già ingrandite; se un gioco usa la differenza
  // fra due posizioni per spostare un elemento (transform, left, top), deve dividerla
  // per window.fattoreSchermo(), altrimenti l'elemento va troppo lontano.
  window.fattoreSchermo = function () { return parseFloat(document.body.style.zoom) || 1; };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia); else avvia();
})();
