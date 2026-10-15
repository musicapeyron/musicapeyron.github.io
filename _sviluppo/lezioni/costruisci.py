# Rigenera punto-di-valore.html, legatura-di-valore.html e tempi-semplici.html.
# Le pagine sono fatte con il motore di note-sul-pentagramma.html (stile, indice, passi, suono)
# + ritmo-motore.js (figure, battute, ascolto) + ritmo.css + i passi di ciascuna lezione.
# Uso (dalla cartella del sito): python3 _sviluppo/lezioni/costruisci.py
import os
D = os.path.dirname(os.path.abspath(__file__)) + "/"
SITO = os.path.abspath(D + "../..") + "/"
import json,re
src=open(SITO+'note-sul-pentagramma.html',encoding='utf-8').read()
motore=open(D+'ritmo-motore.js',encoding='utf-8').read()   # VexFlow: vexflow.js e lezioni-vexflow.js, già caricati dalla pagina di partenza
rg=json.load(open(D+'ritmo-glifi.json'))
CSS=open(D+'ritmo.css',encoding='utf-8').read()
def costruisci(passi_file, out, titolo, h1, desc, css_extra=None):
    t=src
    i=t.index("/* ===== le chiavi disegnate come a mano"); j=t.index("/* ================= disegno SVG"); t=t[:i]+t[j:]
    i=t.index("/* ================= metronomo"); j=t.index("/* ================= i passi ================= */")
    t=t[:i]+"const metro = { attivo: false, ferma() {} };\n\n"+motore+"\n"+t[j:]
    i=t.index("/* ================= i passi ================= */"); j=t.index("/* ================= navigazione ================= */")
    t=t[:i]+open(D+passi_file,encoding='utf-8').read()+"\n"+t[j:]
    m=re.search(r'const GLIFI = (\{.*?\});\n',t); G=json.loads(m.group(1))
    G['r']={k[:-1]:rg[k] for k in ['wr','hr','qr','8r','16r']}; G['coda8']=rg['coda8']; G['coda16']=rg['coda16']; G.pop('coda',None)
    t=t[:m.start()]+'const GLIFI = '+json.dumps(G,separators=(',',':'))+';\n'+t[m.end():]
    def rep(a,b,n=1):
        nonlocal t
        assert t.count(a)==n,(out,a[:70],t.count(a)); t=t.replace(a,b)
    rep('<title>Le note sul pentagramma — musicascuole.it</title>',f'<title>{titolo} — musicascuole.it</title>')
    rep('<meta name="description" content="Lezione interattiva per la LIM: il pentagramma, la chiave di violino e di basso, i tagli addizionali, battute, pulsazione e indicazione di tempo, passo dopo passo.">',f'<meta name="description" content="{desc}">')
    rep('<h1>Le note sul pentagramma</h1>',f'<h1>{h1}</h1>')
    rep("   Le note sul pentagramma — lezione interattiva a passi.",f"   {h1} — lezione interattiva a passi (stesso motore di note-sul-pentagramma.html;\n   si rigenera con _sviluppo/lezioni/costruisci.py a partire dai file in _sviluppo/lezioni/).")
    rep("function fermaTutto() { TIMER.forEach(clearTimeout); TIMER = []; metro.ferma(); cancelAnimationFrame(ANIMA); }",
        "function fermaTutto() { TIMER.forEach(clearTimeout); TIMER = []; metro.ferma(); cancelAnimationFrame(ANIMA); if (typeof zittisci === \"function\") zittisci(); }")
    css = CSS + ("\n" + open(D + css_extra, encoding='utf-8').read() if css_extra else "")
    rep("@media (prefers-reduced-motion: reduce) {", css+"\n@media (prefers-reduced-motion: reduce) {\n  .cresce { transition: none; }")
    open(SITO+out,'w',encoding='utf-8').write(t); print(out,len(t))
import sys
SOLO = sys.argv[1:]
if not SOLO or 'punto' in SOLO: costruisci('passi-punto.js','punto-di-valore.html','Il punto di valore','Il punto di valore',
  "Lezione interattiva per la LIM: il punto di valore e il doppio punto, sulle note e sulle pause, con le barre della durata, l'ascolto e le battute di esempio.")
if not SOLO or 'legatura' in SOLO: costruisci('passi-legatura.js','legatura-di-valore.html','La legatura di valore','La legatura di valore',
  "Lezione interattiva per la LIM: la legatura di valore, i valori che si sommano, la legatura oltre la stanghetta, legatura o punto, legatura di valore o di portamento.")
if not SOLO or 'tempi' in SOLO: costruisci('passi-tempi.js','tempi-semplici.html','I tempi semplici','I tempi semplici',
  "Lezione interattiva per la LIM: i tempi semplici 2/4, 3/4 e 4/4, movimenti forti e deboli, il gesto del direttore, quale tempo? e un primo sguardo ai tempi composti.", 'tempi.css')
