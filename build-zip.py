import json, os, zipfile, io

BASE = os.path.dirname(os.path.abspath(__file__))
OUTPUT = os.path.join(BASE, 'nekogames-full.zip')

with open(os.path.join(BASE, 'games.json')) as f:
    games = json.load(f)

with zipfile.ZipFile(OUTPUT, 'w', zipfile.ZIP_DEFLATED) as z:
    site_files = ['index.html', 'style.css', 'script.js', 'games.json']
    for sf in site_files:
        path = os.path.join(BASE, sf)
        if os.path.exists(path):
            z.write(path, sf)
    offline = '''<!DOCTYPE html><html><head><meta charset="utf-8"><title>Nekogames</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font-family:sans-serif;background:#07070f;color:#e0e0e0}#g{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:16px;padding:28px;max-width:1280px;margin:0 auto}.c{background:#10102a;border:1px solid rgba(255,255,255,.04);border-radius:14px;text-align:center;cursor:pointer;overflow:hidden;transition:.2s}.c:hover{transform:translateY(-4px);box-shadow:0 8px 30px rgba(102,126,234,.15)}.c .t{width:100%;aspect-ratio:16/9;background:#0a0a1e;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.15);font-size:24px}.c .n{padding:10px 10px 2px;font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c .cat{padding:0 10px 12px;font-size:10px;color:#00f0ff;text-transform:uppercase;letter-spacing:1px;font-weight:700;opacity:.6}h1{text-align:center;padding:20px;color:#667eea}</style></head><body><h1>Nekogames</h1><div id="g">'''
    for g in games:
        name = g['name'].replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
        cat = g['category']
        offline += f'<div class="c" onclick="location=\'games/{g["id"]}.html\'"><div class="t">&#x25B6;</div><div class="n">{name}</div><div class="cat">{cat}</div></div>'
    offline += '</div></body></html>'
    z.writestr('nekogames-offline.html', offline)
    for g in games:
        wrapper = f'''<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{g["name"]}</title><style>body{{margin:0;overflow:hidden;background:#000}}iframe{{width:100vw;height:100vh;border:none}}</style></head><body><iframe src="{g["url"]}" allowfullscreen></iframe></body></html>'''
        z.writestr(f'games/{g["id"]}.html', wrapper)

size = os.path.getsize(OUTPUT)
print(f'Updated {OUTPUT} ({len(games)} games, {size/1024/1024:.0f} MB)')
