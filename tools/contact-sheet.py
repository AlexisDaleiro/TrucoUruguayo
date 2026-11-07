"""Compose screenshot evidence for visual review, without modifying originals."""
from pathlib import Path
from PIL import Image, ImageDraw
import sys
folder=Path(sys.argv[1])
files=list(folder.glob('*.png'))
out=Image.new('RGB',(1200,((len(files)+3)//4)*260),'#ddd')
draw=ImageDraw.Draw(out)
for i,path in enumerate(files):
    im=Image.open(path)
    im.thumbnail((290,230))
    x,y=(i%4)*300,(i//4)*260
    out.paste(im,(x,y+25))
    draw.text((x,y),path.stem,fill='black')
out.save(folder/'revision.jpg')
