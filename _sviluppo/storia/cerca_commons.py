#!/usr/bin/env python3
# python3 cerca.py nome "query" [n]  -> provini P-nome.jpg + nome.txt (indice | file | licenza | autore)
import json, sys, subprocess, urllib.parse, time, re, os
from PIL import Image, ImageDraw
nome, q = sys.argv[1], sys.argv[2]; n = int(sys.argv[3]) if len(sys.argv) > 3 else 8
UA = "musicascuole/1.0 (https://musicascuole.it; info@musicascuole.it)"
def get(u, tent=6):
    for t in range(tent):
        r = subprocess.run(["curl","-s","-A",UA,"-w","\n%{http_code}","--max-time","40",u], capture_output=True)
        body, _, code = r.stdout.rpartition(b"\n")
        if code == b"200": return body
        time.sleep(4 + 4*t)
    return b""
u = ("https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=%d&gsrsearch=%s"
     "&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=900" % (n, urllib.parse.quote(q + " filetype:bitmap")))
d = json.loads(get(u) or b"{}"); pages = sorted((d.get("query") or {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
righe = []; imgs = []
for k, p in enumerate(pages):
    ii = p["imageinfo"][0]; m = ii.get("extmetadata", {})
    lic = m.get("LicenseShortName", {}).get("value", "?"); art = re.sub("<[^>]+>", "", m.get("Artist", {}).get("value", ""))[:60]
    f = f"{nome}-{k}.jpg"
    b = get(ii["thumburl"]); time.sleep(1.5)
    if not b: continue
    open(f, "wb").write(b)
    try: im = Image.open(f).convert("RGB")
    except Exception: continue
    im.thumbnail((300, 300)); imgs.append((k, im))
    righe.append(f"{k} | {p['title'][5:]} | {lic} | {art} | {ii['width']}x{ii['height']}")
open(nome + ".txt", "w").write("\n".join(righe) + "\n"); print("\n".join(righe))
if imgs:
    S = Image.new("RGB", (4*310, ((len(imgs)+3)//4)*330), "white"); dr = ImageDraw.Draw(S)
    for j, (k, im) in enumerate(imgs):
        x, y = (j%4)*310, (j//4)*330; S.paste(im, (x, y)); dr.text((x+4, y+305), str(k), fill="black")
    S.save(f"P-{nome}.jpg")
