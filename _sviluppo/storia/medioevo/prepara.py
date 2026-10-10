# prepara le immagini delle pagine: ritaglio (frazioni) e riduzione a max 1000x667, jpg
import os, sys; from PIL import Image
W="wm/"; M="met/"
S = {
 "viaggio-1": (W+"Les_Très_Riches_Heures_du_duc_de_Berry_mars.jpg", (0,0.37,1,1)),
 "viaggio-2": (W+"Cleric,_Knight,_and_Workman_representing_the_Three_Classes.jpg", None),
 "viaggio-3": (W+"Cantigas_de_Santa_Maria,_Musician's_Codex,_page_209R.jpg", None),
 "gregoriano-1": (W+"Unknown-artist-eadwine-the-scribe-at-work-eadwine-psalter-christ-church-canterbury-england-uk-circa-1160-70.jpg", None),
 "gregoriano-2": (M+"coro-orig.jpg", None),
 "gregoriano-3": (W+"Charlemagne_coronation.jpg", None),
 "gregoriano-4": (W+"St._Gallen_Stiftsbibliothek,_Cod._Sang._359,_S._25.jpg", (0.13,0.56,0.78,0.86)),
 "guido-1": (W+"Guido_of_Arezzo_and_Bishop_Tedald_Working_on_Monochord,_11th_Century_Miniature_(21954743795).jpg", None),
 "guido-2": (W+"Manuscript_Leaf,_from_a_Gradual_MET_sf31-134-7bs1.jpg", None),
 "guido-3": (W+"The_Hand_of_Guido.jpg", None),
 "ildegarda-1": (W+"Kloster_Disibodenberg_01.jpg", None),
 "ildegarda-2": (W+"Meister_des_Hildegardis-Codex_001_cropped.jpg", None),
 "ildegarda-3": (W+"Riesencodex_-_fl.0466r.jpg", (0.04,0.03,0.98,0.5)),
 "notredame-1": (W+"Nave_of_Notre-Dame_de_Paris_towards_the_portal,_2024_(1).jpg", None),
 "notredame-2": (W+"Paris_Notre-Dame_Vaults_01.JPG", (0,0.25,1,0.75)),
 "notredame-3": (W+"Pluteous_29.1,_folio_1v.jpg", None),
 "notredame-4": (W+"Perotin_-_Alleluia_nativitas.jpg", (0.05,0.08,0.95,0.6)),
 "trovatori-1": (W+"BnF_ms._12473_fol._15v_-_Bernart_de_Ventadour_(1).jpg", None),
 "trovatori-2": (W+"BnF_ms._12473_fol._126v_-_La_comtesse_de_Die_(1).jpg", None),
 "trovatori-3": (W+"Altstetten.jpg", None),
 "trovatori-4": (W+"Codex_Manesse_Heinrich_von_Meißen_(Frauenlob).jpg", (0,0.4,1,1)),
 "trovatori-5": (W+"Codex_Manesse_Walther_von_der_Vogelweide.jpg", None),
 "goliardi-1": (W+"Laurentius_de_Voltolina_001.jpg", None),
 "goliardi-2": (W+"Codex_Buranus-89v-dettaglio.jpg", (0.06,0.0,1,0.62)),
 "goliardi-3": (W+"Meister_der_Carmina_Burana_001.jpg", None),
 "canone-1": (W+"Les_Très_Riches_Heures_du_duc_de_Berry_juin.jpg", (0,0.36,1,1)),
 "canone-2": (W+"Sumer_is_icumen_in_-_Summer_Canon_(Reading_Rota)_(mid_13th_C),_f.11v_-_BL_Harley_MS_978.jpg", None),
 "arsnova-1": (W+"Roman_de_Fauvel_-_BNF_Ms._fr._146,_folio_11r.jpg", None),
 "arsnova-2": (W+"Burying_Plague_Victims_of_Tournai.jpg", None),
 "arsnova-3": (W+"Guillaume_de_Machaut_et_Bon_Espoir_-_Le_Remede_de_Fortune.jpg", None),
 "arsnova-4": (W+"Guillaume_de_Machaut,_Le_remède_de_fortune_(dance),_Paris,_Ms._fr._1586.jpg", (0.04,0.05,0.92,0.5)),
 "landini-1": (W+"Dante_Domenico_di_Michelino.jpg", (0.535,0.2,1,0.93)),
 "landini-2": (W+"Decameron_-_BNF_Ms_239_-_Départ_des_conteurs_du_Decameron_de_Florence_-_détail.jpg", (0.36,0,1,1)),
 "landini-3": (W+"Bernardo_daddi,_madonna_della_misericordia,_con_più_antica_veduta_di_firenze,_1342,_06_vecchio_duomo.JPG", None),
 "landini-4": (W+"Andrea_da_Firenze_(Squarcialupi_Codex).jpg", None),
}
fatti=[]
for k,(f,box) in S.items():
    if len(sys.argv)>1 and k not in sys.argv[1:]: continue
    if not os.path.exists(f): print("MANCA", k); continue
    try: im = Image.open(f).convert("RGB")
    except Exception: print("ROTTO", k); continue
    if box:
        w,h = im.size; im = im.crop((int(box[0]*w),int(box[1]*h),int(box[2]*w),int(box[3]*h)))
    im.thumbnail((1000,667), Image.LANCZOS)
    im.save(f"pagine/p-{k}.jpg", quality=80, optimize=True, progressive=True); fatti.append(f"pagine/p-{k}.jpg")
print(len(fatti))
