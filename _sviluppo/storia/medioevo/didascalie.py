import re, json
import os; f=os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../storia-medioevo.html"); s=open(f).read()
D=json.load(open("didascalie.json"))
alias={"riepilogo-1":"gregoriano-2","riepilogo-2":"trovatori-4","riepilogo-3":"guido-3"}
def r(m):
    k=m.group(1)
    for a,b in alias.items():
        if b==k and m.group(0).find('did: "'+D[a])>=0: k=a
    k2=m.group(2) or k
    return f'{{ img: "p-{alias.get(k2,k2)}.jpg", did: "{D[k2]}",'
# ogni pagina ha un segnaposto con la sua chiave: rinumerazione per capitolo
out=[]; pos=0
for m in re.finditer(r'\{ id: "(\w+)"', s):
    pass
caps=[(m.start(), m.group(1)) for m in re.finditer(r'\{ id: "(\w+)", mondo', s)]
res=s[:caps[0][0]]
for i,(st,cid) in enumerate(caps):
    en=caps[i+1][0] if i+1<len(caps) else s.index("  ];", st)
    blk=s[st:en]; n=[0]
    def rr(m):
        n[0]+=1; k=f"{cid}-{n[0]}"
        return f'{{ img: "p-{alias.get(k,k)}.jpg", did: "{D[k]}",'
    blk=re.sub(r'\{ img: "[^"]*", did: "[^"]*",', rr, blk)
    res+=blk
res+=s[en:]
res=res.replace(".d-img img { width: 100%; height: 100%; object-fit: cover; display: block; }",".d-img img { width: 100%; height: 100%; object-fit: contain; display: block; }")
open(f,"w").write(res); print("ok")
