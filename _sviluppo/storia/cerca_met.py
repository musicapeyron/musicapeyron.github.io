#!/usr/bin/env python3
# cerca opere nel Met (pubblico dominio) e fa un foglio di provini: python3 cerca.py "parole" nome [max]
import json, sys, subprocess, urllib.parse, os
from PIL import Image, ImageDraw
q, nome = sys.argv[1], sys.argv[2]; mx = int(sys.argv[3]) if len(sys.argv) > 3 else 12
def get(u):
    r = subprocess.run(["curl","-s","--max-time","25",u], capture_output=True)
    return r.stdout
ids = json.loads(get("https://collectionapi.metmuseum.org/public/collection/v1.1/search?hasImages=true&limit=40&q="+urllib.parse.quote(q))).get("objectIDs") or []
righe=[]; imgs=[]
for i in ids:
    if len(imgs) >= mx: break
    try: o = json.loads(get(f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{i}"))
    except Exception: continue
    if not o.get("isPublicDomain") or not o.get("primaryImageSmall"): continue
    f = f"{nome}-{i}.jpg"; open(f,"wb").write(get(o["primaryImageSmall"]))
    try: im = Image.open(f).convert("RGB")
    except Exception: continue
    im.thumbnail((300,300)); imgs.append((i, im))
    righe.append(f"{i} | {o.get('title','')[:70]} | {o.get('objectDate','')} | {o.get('culture') or o.get('artistDisplayName','')} | {o.get('department','')}")
    json.dump(o, open(f"{nome}-{i}.json","w"))
print("\n".join(righe))
if imgs:
    S = Image.new("RGB", (4*310, ((len(imgs)+3)//4)*330), "white"); d = ImageDraw.Draw(S)
    for k,(i,im) in enumerate(imgs):
        x,y = (k%4)*310, (k//4)*330; S.paste(im,(x,y)); d.text((x+4,y+305), str(i), fill="black")
    S.save(f"P-{nome}.jpg")
