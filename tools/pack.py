import os, io, base64, json
from PIL import Image
out={}
H={'castle':360,'flowerstrip':129,'rainbow':175}
for f in sorted(os.listdir('spr')):
    n=f[:-4]; im=Image.open('spr/'+f); h=H.get(n,300)
    if im.height>h: im=im.resize((round(im.width*h/im.height),h),Image.LANCZOS)
    b=io.BytesIO(); im.save(b,'WEBP',quality=86,method=6)
    out[n]='data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
tv={'tv1':'Ёжик и волшебное яблоко','tv2':'Волшебный сад и сияющая звезда','tv3':'Вторая звёздочка в волшебной реке','tv4':'Тётушка Ночка дарит звезду Алисе'}
for k,v in tv.items():
    im=Image.open(f'src/{v}.png').convert('RGB').resize((760,380),Image.LANCZOS)
    b=io.BytesIO(); im.save(b,'JPEG',quality=80)
    out[k]='data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
json.dump(out,open('assets.json','w'))
print(len(out), sum(len(v) for v in out.values())//1024,'KB')
