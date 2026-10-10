# metadati (autore, licenza) dei file di Commons usati, in crediti.json
import json, re, subprocess, urllib.parse, time
exec(open("prepara.py").read().split("fatti=[]")[0])
UA = "musicascuole/1.0 (https://musicascuole.it; info@musicascuole.it)"
tit = {k: v[0].split("/",1)[1].replace("_"," ") for k,v in S.items() if v[0].startswith("wm/")}
out = {}
nomi = list(set(tit.values()))
for i in range(0, len(nomi), 20):
    q = "|".join("File:"+n for n in nomi[i:i+20])
    u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata|url&titles="+urllib.parse.quote(q)
    for t in range(12):
        r = subprocess.run(["curl","-s","-A",UA,"-w","\n%{http_code}",u],capture_output=True); b,_,c=r.stdout.rpartition(b"\n")
        if c==b"200": break
        time.sleep(10+5*t)
    d = json.loads(b)
    norm = {x["to"]:x["from"] for x in d["query"].get("normalized",[])}
    for p in d["query"]["pages"].values():
        if "imageinfo" not in p: out[p["title"]] = None; continue
        m = p["imageinfo"][0]["extmetadata"]; g=lambda k: re.sub("<[^>]+>","",m.get(k,{}).get("value","")).strip()
        out[p["title"][5:]] = {"lic": g("LicenseShortName"), "url": g("LicenseUrl"), "autore": g("Artist")[:120], "desc": g("ImageDescription")[:200], "pagina": p["imageinfo"][0]["descriptionurl"]}
json.dump({"chiavi":tit,"file":out}, open("crediti.json","w"), ensure_ascii=False, indent=1)
for k,n in tit.items():
    o=out.get(n); print(k, "|", (o or {}).get("lic"), "|", (o or {}).get("autore","")[:50], "|", (o or {}).get("desc","")[:70])
