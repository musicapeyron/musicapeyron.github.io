#!/usr/bin/env python3
# python3 titoli.py "query" ... -> titoli dei file su Commons (senza scaricare)
import json, sys, subprocess, urllib.parse, time
UA = "musicascuole/1.0 (https://musicascuole.it; info@musicascuole.it)"
def get(u):
    for t in range(8):
        r = subprocess.run(["curl","-s","-A",UA,"-w","\n%{http_code}","--max-time","40",u], capture_output=True)
        body, _, code = r.stdout.rpartition(b"\n")
        if code == b"200": return body
        time.sleep(3 + 3*t)
    return b"{}"
for q in sys.argv[1:]:
    u = ("https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=12&srsearch=%s" % urllib.parse.quote(q + " filetype:bitmap"))
    d = json.loads(get(u)); print("==", q, flush=True)
    for p in d.get("query", {}).get("search", []): print("  ", p["title"][5:], flush=True)
    time.sleep(1)
