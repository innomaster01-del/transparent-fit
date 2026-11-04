"""Download real photos of clothes hanging in shops (Wikimedia Commons, free licences) and run the
garment detector on them. Output: out/photos/*.jpg, out/annotated/*.jpg, out/results.json"""
import json, os, urllib.parse, urllib.request
os.makedirs('out/photos', exist_ok=True); os.makedirs('out/annotated', exist_ok=True)
UA = {'User-Agent': 'TransparentFitTest/1.0 (garment detection test; GitHub Actions)'}
def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
queries = ['shirt on hanger', 'clothes hanging rack shop', 't-shirt hanging', 'clothing store rack',
           'dress on hanger', 'jeans hanging shop', 'clothes rail shop', 'jacket on hanger', 'shirts hanging market',
           'trousers on hanger', 'second hand clothes rack', 'hoodie on hanger']
files = {}
for q in queries:
    api = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({
        'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': q + ' filetype:bitmap', 'gsrnamespace': 6,
        'gsrlimit': 8, 'prop': 'imageinfo', 'iiprop': 'url|extmetadata', 'iiurlwidth': 1024})
    try: d = json.loads(get(api))
    except Exception as e: print('query failed', q, e); continue
    for p in (d.get('query', {}).get('pages', {}) or {}).values():
        ii = (p.get('imageinfo') or [{}])[0]; u = ii.get('thumburl')
        if u and p['title'] not in files:
            lic = ii.get('extmetadata', {}).get('LicenseShortName', {}).get('value', '')
            files[p['title']] = {'url': u, 'query': q, 'license': lic, 'page': ii.get('descriptionurl', '')}
print(len(files), 'photos found')
from ultralytics import YOLO
model = YOLO('deepfashion2_yolov8s-seg.pt')
results = []
for k, (title, info) in enumerate(list(files.items())[:60]):
    name = f'p{k:02d}.jpg'
    try: open('out/photos/' + name, 'wb').write(get(info['url']))
    except Exception as e: print('download failed', title, e); continue
    r = model.predict('out/photos/' + name, imgsz=416, conf=0.3, verbose=False)[0]
    dets = [{'name': model.names[int(c)], 'p': round(float(p), 2), 'box': [round(float(v)) for v in b]}
            for c, p, b in zip(r.boxes.cls, r.boxes.conf, r.boxes.xyxy)]
    r.save(filename='out/annotated/' + name)
    results.append({'file': name, 'title': title, **info, 'dets': dets})
    print(name, title[:60], [(d['name'], d['p']) for d in dets][:4])
json.dump(results, open('out/results.json', 'w'), indent=1)
