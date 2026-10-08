#!/usr/bin/env python3
"""
Rigenera le pagine delle raccolte di spartiti a partire dal modello brani-propedeutici.html.

Le pagine primi-brani, primi-brani-2, diabelli, berens e scale sono copie del modello
con poche differenze (elenco dei brani, cartella, audio, testi). Le differenze sono salvate
in _sviluppo/patch/<pagina>.patch.

Uso (dalla cartella principale del sito):
    python3 _sviluppo/genera_raccolte.py            # rigenera tutte le raccolte
    python3 _sviluppo/genera_raccolte.py --salva    # dopo aver modificato a mano una raccolta: aggiorna la sua patch

Dopo una modifica al modello (brani-propedeutici.html):
  1. lancia lo script: ogni raccolta riceve la modifica;
  2. se una patch non si applica, lo script lo dice e lascia la pagina com'era:
     in quel caso la modifica va fatta a mano su quella pagina, poi si lancia con --salva.
Le costanti solo del modello (SINCRO, FESTA, NOVITA_AGGIUNTE, PAUSE_RAGGRUPPATE) nelle patch sono già azzerate.
"""
import os, subprocess, sys, tempfile, shutil

QUI = os.path.dirname(os.path.abspath(__file__))
SITO = os.path.dirname(QUI)
MODELLO = os.path.join(SITO, "brani-propedeutici.html")
RACCOLTE = ["primi-brani", "primi-brani-2", "diabelli", "berens", "scale"]


def salva():
    for r in RACCOLTE:
        out = subprocess.run(["diff", "-u", MODELLO, os.path.join(SITO, r + ".html")], capture_output=True, text=True).stdout
        open(os.path.join(QUI, "patch", r + ".patch"), "w", encoding="utf8").write(out)
        print("patch aggiornata:", r)


def genera():
    errori = 0
    for r in RACCOLTE:
        patch = os.path.join(QUI, "patch", r + ".patch")
        with tempfile.TemporaryDirectory() as tmp:
            nuovo = os.path.join(tmp, r + ".html")
            shutil.copy(MODELLO, nuovo)
            p = subprocess.run(["patch", "-s", "--no-backup-if-mismatch", "-r", "-", nuovo, patch], capture_output=True, text=True)
            if p.returncode != 0:
                errori += 1
                print("NON applicata:", r, "\n", p.stdout, p.stderr)
                continue
            shutil.copy(nuovo, os.path.join(SITO, r + ".html"))
            print("rigenerata:", r)
    if errori:
        print(f"\n{errori} raccolte da sistemare a mano (vedi sopra), poi: python3 _sviluppo/genera_raccolte.py --salva")


if __name__ == "__main__":
    salva() if "--salva" in sys.argv else genera()
