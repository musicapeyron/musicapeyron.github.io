#!/bin/bash
# Controlla se i video YouTube si possono incorporare nel sito.
# Uso: bash _sviluppo/controlla_video.sh ID1 ID2 ...
#   oppure, per tutti i video di una pagina: bash _sviluppo/controlla_video.sh $(grep -o 'yt: "[^"]*"' storia-medioevo.html | cut -d'"' -f2)
for v in "$@"; do
  h=$(curl -s --max-time 20 -A "Mozilla/5.0" -H "Referer: https://musicapeyron.github.io/" "https://www.youtube-nocookie.com/embed/$v")
  if echo "$h" | grep -q 'playableInEmbed\\":true'; then echo "$v  OK"
  elif echo "$h" | grep -q UNPLAYABLE; then echo "$v  NON INCORPORABILE"
  else echo "$v  ? (da controllare a mano)"; fi
done
