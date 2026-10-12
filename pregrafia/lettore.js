/* =========================================================
   pregrafia/lettore.js — il "lettore" delle linee a tempo di musica.
   Usato dall'editor (editor-linee.html) e dal percorso (pregrafia-musicale.html).

   Formato del progetto (file .json dell'editor):
   {
     formato: "musicascuole-linee", versione: 1,
     titolo, autore, crediti,                 // testi liberi
     audio: { nome, url?, dati? },            // dati = registrazione incorporata (data URL), facoltativa
     battiti: [secondi…] | null,              // battiti registrati o trovati (per agganciare e per le forme)
     bpm, offset,                             // griglia regolare, se non ci sono battiti registrati
     anticipo: 0.8,                           // secondi in cui la pagina nuova si vede prima della sua prima linea
     pagine: [ { tratti: [ { colore, spessore, punti: [[x, y, t], …] } ] } ]
   }
   x e y vanno da 0 a 1 (y rispetto all'altezza, la pagina è 16:9); t in secondi della registrazione.
   ========================================================= */
(function (global) {
  "use strict";

  const PALETTE = ["#E21C48", "#009C95", "#5E50A1", "#F99D1C", "#1E88E5", "#CF3E96", "#2E9E5B", "#E8603C", "#7a5c3e", "#222b45"];
  const ASPETTO = 16 / 9;

  function chiaro(hex, f) {
    const n = parseInt((hex || "#888888").slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return `rgb(${Math.round(r + (255 - r) * f)},${Math.round(g + (255 - g) * f)},${Math.round(b + (255 - b) * f)})`;
  }

  /* tempi di una pagina: dalla prima all'ultima linea */
  function tempiPagina(p) {
    let a = Infinity, b = -Infinity;
    (p.tratti || []).forEach(tr => tr.punti.forEach(q => { if (q[2] != null) { if (q[2] < a) a = q[2]; if (q[2] > b) b = q[2]; } }));
    return a === Infinity ? null : [a, b];
  }
  /* quale pagina si vede al tempo t */
  function paginaA(prog, t) {
    const pag = prog.pagine || [], ant = prog.anticipo == null ? 0.8 : prog.anticipo;
    let scelta = 0, primaConTempi = -1;
    for (let i = 0; i < pag.length; i++) {
      const tp = tempiPagina(pag[i]);
      if (!tp) continue;
      if (primaConTempi < 0) primaConTempi = i;
      /* si passa alla pagina i un po' prima della sua prima linea, ma non prima che la precedente sia finita */
      const prec = i > 0 ? tempiPagina(pag[i - 1]) : null;
      const quando = prec ? Math.max(prec[1] + 0.05, tp[0] - ant) : -Infinity;
      if (t >= quando) scelta = i;
    }
    return primaConTempi < 0 ? 0 : scelta;
  }

  /* disegna la pagina "indice" al tempo t.
     opz: { mostraTutto: false (true = tutto colorato, per l'editor fermo), spessoreBase, fondo: false,
            evidenzia: tratto selezionato, fantasma: pagina da mostrare in trasparenza } */
  function disegna(ctx, W, H, prog, t, opz) {
    opz = opz || {};
    const indice = opz.pagina == null ? paginaA(prog, t) : opz.pagina;
    const pag = (prog.pagine || [])[indice];
    if (opz.fondo !== false) {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#fffaf3"); g.addColorStop(0.55, "#fdeef2"); g.addColorStop(1, "#f6ecff");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (opz.fantasma) disegnaTratti(ctx, W, H, opz.fantasma, null, { solo: "fantasma", spessoreBase: opz.spessoreBase });
    if (!pag) return indice;
    disegnaTratti(ctx, W, H, pag, t, opz);
    return indice;
  }
  function disegnaTratti(ctx, W, H, pag, t, opz) {
    const base = opz.spessoreBase || Math.max(10, Math.min(W, H * 1.8) * 0.034);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    (pag.tratti || []).forEach(tr => {
      const P = tr.punti; if (!P.length) return;
      const w = base * (tr.spessore || 1), col = tr.colore || PALETTE[0];
      const traccia = (fino) => {
        ctx.beginPath(); ctx.moveTo(P[0][0] * W, P[0][1] * H);
        if (P.length === 1) { ctx.lineTo(P[0][0] * W + 0.1, P[0][1] * H); return; }
        for (let i = 1; i < P.length; i++) {
          const p = P[i];
          if (fino != null && p[2] != null && p[2] > fino) {
            const q = P[i - 1], u = q[2] == null || p[2] === q[2] ? 1 : Math.max(0, Math.min(1, (fino - q[2]) / (p[2] - q[2])));
            ctx.lineTo((q[0] + (p[0] - q[0]) * u) * W, (q[1] + (p[1] - q[1]) * u) * H); return;
          }
          ctx.lineTo(p[0] * W, p[1] * H);
        }
      };
      if (opz.solo === "fantasma") { ctx.strokeStyle = "rgba(60,70,100,0.10)"; ctx.lineWidth = w; traccia(null); ctx.stroke(); return; }
      if (opz.evidenzia === tr) { ctx.strokeStyle = "rgba(30,136,229,0.35)"; ctx.lineWidth = w + 14; traccia(null); ctx.stroke(); }
      ctx.strokeStyle = chiaro(col, 0.78); ctx.lineWidth = w; traccia(null); ctx.stroke();
      const t0 = P[0][2];
      if (opz.mostraTutto || t0 == null) { if (opz.mostraTutto || opz.senzaTempoColorato) { ctx.strokeStyle = t0 == null ? chiaro(col, 0.45) : col; traccia(null); ctx.stroke(); } return; }
      if (t != null && t > t0) { ctx.strokeStyle = col; traccia(t); ctx.stroke(); }
    });
  }

  function durata(prog) {
    let fine = 0;
    (prog.pagine || []).forEach(p => { const tp = tempiPagina(p); if (tp && tp[1] > fine) fine = tp[1]; });
    return fine;
  }

  global.LettoreLinee = { disegna, paginaA, tempiPagina, durata, chiaro, PALETTE, ASPETTO };
})(window);
