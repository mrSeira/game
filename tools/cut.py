import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
S={'2':"src/Лист персонажей Алисы и друзей-2.png",'1':"src/Лист персонажей Алисы и друзей-1.png"}
B={
 'alisa_front':('2',15,15,245,430),'alisa_side':('2',240,50,400,430),'alisa_jump':('2',550,20,770,430),
 'alisa_sit':('2',765,125,980,425),
 'isk_front':('2',975,35,1170,430),'isk_rear':('2',1345,10,1536,430),'isk_side':('1',645,50,855,425),
 'shur_wave':('2',10,485,195,730),'shur_apple':('2',195,480,385,725),'shur_look':('2',545,480,710,725),
 'shur_happy':('1',320,620,484,825),
 'nochka':('2',700,465,935,750),'sova':('2',1145,495,1310,735),'sova_fly':('2',1300,480,1536,735),
 'frog':('2',15,785,165,990),'frog_happy':('2',160,785,345,990),'butterfly':('2',350,775,580,995),
 'apple':('2',605,805,750,980),'stars3':('2',750,795,900,975),'rainbow':('2',1030,795,1270,990),
 'flowers':('2',1250,790,1536,1005),'castle':('1',1300,790,1536,1024),'flowerstrip':('1',0,865,465,1020),
 'star':('1',1362,650,1445,750),
}
ims={k:Image.open(v).convert('RGB') for k,v in S.items()}
import os; os.makedirs('spr',exist_ok=True)
for name,(s,x0,y0,x1,y1) in B.items():
    a=np.asarray(ims[s].crop((x0,y0,x1,y1))).astype(int)
    white=(a.min(axis=2)>232)&((a.max(axis=2)-a.min(axis=2))<14)
    lab,n=ndi.label(white)
    edge=set(lab[0,:])|set(lab[-1,:])|set(lab[:,0])|set(lab[:,-1]); edge.discard(0)
    bg=np.isin(lab,list(edge))
    fg=~bg
    fg=ndi.binary_opening(fg,iterations=1)
    l2,n2=ndi.label(ndi.binary_dilation(fg,iterations=1))
    if n2>1 and name not in('stars3','flowers','flowerstrip'):
        sizes=ndi.sum(fg,l2,range(1,n2+1)); keep=l2==(1+int(np.argmax(sizes))); fg&=keep
    alpha=ndi.gaussian_filter(fg.astype(float),0.7)
    alpha=np.clip(alpha*1.6-0.3,0,1)*fg
    rgba=np.dstack([a,(alpha*255)]).astype('uint8')
    im=Image.fromarray(rgba,'RGBA'); bb=im.getbbox(); im=im.crop(bb)
    im.save(f'spr/{name}.png'); print(name,im.size)
# contact sheet
names=list(B); W=1500; x=y=0; rowh=0
sheet=Image.new('RGB',(W,1300),(40,90,160))
for n in names:
    im=Image.open(f'spr/{n}.png'); im.thumbnail((230,230))
    if x+im.width>W: x=0; y+=rowh+6; rowh=0
    sheet.paste(im,(x,y),im); x+=im.width+6; rowh=max(rowh,im.height)
sheet.crop((0,0,W,y+rowh)).save('contact.png')
