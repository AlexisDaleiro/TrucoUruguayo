"""Compose screenshot evidence for visual review, without modifying originals."""
from pathlib import Path
from PIL import Image, ImageDraw
import sys
folder=Path(sys.argv[1])
prefix=sys.argv[2] if len(sys.argv)>2 else ''
files=list(folder.glob(prefix+'*.png'))
if not files:
    raise SystemExit('No screenshot files match this group')
out=Image.new('RGB',(1200,((len(files)+3)//4)*260),'#ddd')
draw=ImageDraw.Draw(out)
for i,path in enumerate(files):
    im=Image.open(path)
    im.thumbnail((290,230))
    x,y=(i%4)*300,(i//4)*260
    out.paste(im,(x,y+25))
    draw.text((x,y),path.stem,fill='black')
out.save(folder/('revision-'+prefix.rstrip('-')+'.jpg' if prefix else 'revision.jpg'))
