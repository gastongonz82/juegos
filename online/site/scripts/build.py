from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
worker = (root / 'worker' / 'index.js').read_text()
html = (root / 'index.html').read_text()
client = (root / 'client.js').read_text()
solo_engine = (root / 'solo-engine.js').read_text()
manifest = root / '.openai' / 'hosting.json'
if not manifest.is_file():
    raise SystemExit('Missing .openai/hosting.json; configure the Sites project before packaging.')
config = json.loads(manifest.read_text())
if not config.get('project_id') or config.get('d1') != 'DB':
    raise SystemExit('hosting.json must declare this Sites project and its DB binding.')
if '__HTML__' not in worker or '__CLIENT__' not in worker:
    raise SystemExit('Worker HTML/client placeholders are missing.')
client = solo_engine + '\n' + client
output = worker.replace('__HTML__', json.dumps(html, ensure_ascii=False)).replace('__CLIENT__', json.dumps(client, ensure_ascii=False))
dist = root / 'dist'
(dist / 'server').mkdir(parents=True, exist_ok=True)
(dist / '.openai').mkdir(parents=True, exist_ok=True)
(dist / 'server' / 'index.js').write_text(output)
(dist / '.openai' / 'hosting.json').write_text(json.dumps(config, indent=2) + '\n')
print(f'Built {dist}')
