import sys; from PIL import Image, ImageDraw
out=sys.argv[1]; fs=sys.argv[2:]; W=4
S=Image.new("RGB",(W*420,((len(fs)+W-1)//W)*440),"white"); d=ImageDraw.Draw(S)
for k,f in enumerate(fs):
    try: im=Image.open(f).convert("RGB")
    except Exception: continue
    sz=im.size; im.thumbnail((410,410)); x,y=(k%W)*420,(k//W)*440; S.paste(im,(x,y)); d.text((x+3,y+415),f"{k} {f[:45]} {sz}",fill="black")
S.save(out)
