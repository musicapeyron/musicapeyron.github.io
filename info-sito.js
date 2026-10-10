/* =========================================================
   info-sito.js — la riga «musicascuole.it — Crediti e licenza · Privacy» in cima a ogni pagina.
   Si carica subito dopo <body>:  <script src="info-sito.js"></script>
   La riga sta sopra a tutto (in alto, al centro) e la pagina scende di quanto serve,
   così non copre titoli o pulsanti. Nella modalità schermo intero (body.lim) sparisce.
   ========================================================= */
(function () {
  "use strict";
  var ALTEZZA = 26;
  var stile = document.createElement("style");
  stile.textContent =
    ".info-sito{position:absolute;top:0;left:0;right:0;z-index:30000;height:" + ALTEZZA + "px;display:flex;align-items:center;justify-content:center;" +
    "pointer-events:none;font:600 12.5px 'Manrope','Inter','Segoe UI',Arial,sans-serif;color:#CBD5E1;white-space:nowrap;}" +
    ".info-sito span{pointer-events:auto;background:rgba(15,23,42,.78);border:1px solid rgba(255,255,255,.16);border-top:0;" +
    "border-radius:0 0 12px 12px;padding:3px 12px 4px;}" +
    ".info-sito a{color:#7DD3FC;text-decoration:none;}.info-sito a:hover{text-decoration:underline;}" +
    "body.lim .info-sito{display:none;}" +
    "@media (max-width:420px){.info-sito{font-size:11px;}.info-sito span{padding:3px 9px 4px;}}" +
    "@media print{.info-sito{display:none;}}";
  document.head.appendChild(stile);

  var riga = document.createElement("nav");
  riga.className = "info-sito";
  riga.setAttribute("aria-label", "Informazioni sul sito");
  var cartella = /\/programma\//.test(location.pathname) ? "../" : "";
  riga.innerHTML = '<span>musicascuole.it — <a href="' + cartella + 'crediti.html">Crediti e licenza</a> · <a href="' + cartella + 'privacy.html">Privacy</a></span>';

  function aggiungi() {
    var b = document.body;
    b.insertBefore(riga, b.firstChild);
    // la pagina scende di ALTEZZA px rispetto al suo margine superiore (anche quando questo cambia con lo schermo)
    function spazio() {
      if (b.classList.contains("lim")) { b.style.paddingTop = ""; return; }
      b.style.paddingTop = "";
      var p = parseFloat(getComputedStyle(b).paddingTop) || 0;
      b.style.paddingTop = (p + ALTEZZA) + "px";
    }
    spazio();
    var larghezza = window.innerWidth, altezza = window.innerHeight;
    window.addEventListener("resize", function () {
      if (window.innerWidth === larghezza && Math.abs(window.innerHeight - altezza) < 120) return;   // la barra del telefono che compare e sparisce
      larghezza = window.innerWidth; altezza = window.innerHeight; spazio();
    });
    new MutationObserver(spazio).observe(b, { attributes: true, attributeFilter: ["class"] });
  }
  if (document.body) aggiungi(); else document.addEventListener("DOMContentLoaded", aggiungi);
})();
