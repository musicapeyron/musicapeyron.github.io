"""Uso: python3 _sviluppo/prove/inserisci_tel.py pagina.html ritocchi.css
Scrive (o sostituisce) dopo il primo </style> del gioco il link a telefono.css e il blocco
<style id="telefono-gioco"> con il @media del telefono in verticale e il CSS dato (solo le regole, senza @media)."""
import sys,re
pag,css=sys.argv[1],open(sys.argv[2],encoding='utf-8').read().strip()
s=open(pag,encoding='utf-8').read()
blocco=('<link rel="stylesheet" href="telefono.css?v=1">\n<style id="telefono-gioco">\n'
        '/* TELEFONO IN VERTICALE: ritocchi solo per questo gioco (le regole comuni sono in telefono.css) */\n'
        '@media (max-width: 620px) and (orientation: portrait) {\n'+css+'\n}\n</style>')
if 'id="telefono-gioco"' in s:
    s=re.sub(r'<link rel="stylesheet" href="telefono\.css\?v=\d+">\n<style id="telefono-gioco">.*?</style>',lambda m:blocco,s,count=1,flags=re.S)
else:
    i=s.index('</style>')+len('</style>')
    s=s[:i]+'\n'+blocco+s[i:]
open(pag,'w',encoding='utf-8').write(s)
print('ok',pag)
