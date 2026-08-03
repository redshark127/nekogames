import json, os, re, zipfile

BASE = os.path.dirname(os.path.abspath(__file__))
OUTPUT = os.path.join(BASE, 'nekogames-full.zip')

with open(os.path.join(BASE, 'games.json')) as f:
    games = json.load(f)

def read(p):
    with open(os.path.join(BASE, p), 'r', encoding='utf-8') as f:
        return f.read()

index_html = read('index.html')
css = read('style.css')
script_js = read('script.js')

# --- Build self-contained offline app: same as the live site but with assets inlined ---
offline = index_html

offline = offline.replace(
    '<link rel="stylesheet" href="style.css">',
    '<style>' + css + '</style>')

sw_block = '''  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js');
    }
  </script>'''
offline = offline.replace(
    sw_block,
    '''  <script>
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      try { navigator.serviceWorker.register('sw.js'); } catch (e) {}
    }
  </script>''')

games_json = json.dumps(games, separators=(',', ':'), ensure_ascii=False)

def inline_games(match):
    return '<script>window.__GAMES__ = ' + games_json + ';</script>\n<script>\n' + script_js + '\n</script>'

offline = re.sub(
    r'<script src="script\.js\?v=\d+"></script>',
    inline_games,
    offline)

with zipfile.ZipFile(OUTPUT, 'w', zipfile.ZIP_DEFLATED) as z:
    site_files = ['index.html', 'style.css', 'script.js', 'games.json']
    for sf in site_files:
        path = os.path.join(BASE, sf)
        if os.path.exists(path):
            z.write(path, sf)
    z.writestr('nekogames-offline.html', offline)
    for g in games:
        name = g['name'].replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
        if g['url'].startswith('games/'):
            src = './' + g['url'][len('games/'):]
            wrapper = f'''<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{name}</title><style>body{{margin:0;overflow:hidden;background:#000}}iframe{{width:100vw;height:100vh;border:none}}</style></head><body><iframe src="{src}" allowfullscreen></iframe></body></html>'''
            z.writestr(f'games/{g["id"]}.html', wrapper)
        elif g['url'].startswith('./wrappers/'):
            wrapper_path = os.path.join(BASE, g['url'][2:])
            if os.path.exists(wrapper_path):
                with open(wrapper_path, 'r', encoding='utf-8') as wf:
                    z.writestr(f'games/{g["id"]}.html', wf.read())
            else:
                src = g['url']
                wrapper = f'''<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{name}</title><style>body{{margin:0;overflow:hidden;background:#000}}iframe{{width:100vw;height:100vh;border:none}}</style></head><body><iframe src="{src}" allowfullscreen></iframe></body></html>'''
                z.writestr(f'games/{g["id"]}.html', wrapper)
        else:
            src = g['url']
            wrapper = f'''<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{name}</title><style>body{{margin:0;overflow:hidden;background:#000}}iframe{{width:100vw;height:100vh;border:none}}</style></head><body><iframe src="{src}" allowfullscreen></iframe></body></html>'''
            z.writestr(f'games/{g["id"]}.html', wrapper)
    if os.path.isdir(os.path.join(BASE, 'games', 'sheriff-looper')):
        for fname in os.listdir(os.path.join(BASE, 'games', 'sheriff-looper')):
            z.write(os.path.join(BASE, 'games', 'sheriff-looper', fname), f'games/sheriff-looper/{fname}')

size = os.path.getsize(OUTPUT)
print(f'Updated {OUTPUT} ({len(games)} games, {size/1024:.0f} KB, offline {len(offline)/1024:.0f} KB)')
