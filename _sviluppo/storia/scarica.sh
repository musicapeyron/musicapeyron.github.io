#!/bin/bash
# come scarica.sh ma riprova (fino a 5 volte, con attese crescenti) se il server dice 429
UA="musicascuole/1.0 (https://musicascuole.it; info@musicascuole.it)"
for n in "$@"; do
  n="${n// /_}"
  if [ -s "$n" ] && ! file -b "$n" | grep -q HTML; then echo "gia $n"; continue; fi
  h=$(printf "%s" "$n" | md5sum | cut -c1-2)
  enc=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$n")
  for t in 1 2 3 4 5; do
    u="https://upload.wikimedia.org/wikipedia/commons/thumb/${h:0:1}/$h/$enc/960px-$enc"
    c=$(curl -s -A "$UA" -o "$n" -w "%{http_code}" "$u")
    if [ "$c" = "200" ]; then break; fi
    if [ "$c" = "404" ] || [ "$c" = "400" ]; then u="https://upload.wikimedia.org/wikipedia/commons/${h:0:1}/$h/$enc"; c=$(curl -s -A "$UA" -o "$n" -w "%{http_code}" "$u"); [ "$c" = "200" ] && break; fi
    sleep $((20*t))
  done
  echo "$c $n $(file -b "$n" | cut -c1-30)"; sleep 10
done
