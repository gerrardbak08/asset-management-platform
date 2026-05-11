import json, os

with open('db_full.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

snapshots = db['snapshots']
m0_data = snapshots[0]['raw']
buildings = db['buildings']
for b in buildings:
    b['acquisitionPrice'] = int(b.get('acquisitionPrice', 0) or 0)
eqSnaps = db['equipmentSnapshots']
stores = db['stores']
for s in stores:
    s['supplyByCategory'] = json.loads(s.get('supplyByCategoryJson') or '{}')
    s['supplyByCategoryCount'] = json.loads(s.get('supplyByCategoryCountJson') or '{}')
    s['assetByType'] = json.loads(s.get('assetByTypeJson') or '{}')

DB_JSON = json.dumps({
    'snapshots': [{'period': s['period'], 'totalAsset': s['totalAsset'], 'tangible': s['tangible'], 'intangible': s['intangible'], 'equipment': s['equipment']} for s in snapshots],
    'm0': m0_data,
    'buildings': buildings,
    'eqSnaps': eqSnaps,
    'stores': stores
}, ensure_ascii=False, default=str)

print('DB_JSON size:', len(DB_JSON))

with open('data_embed.js', 'w', encoding='utf-8') as f:
    f.write('const DB = ')
    f.write(DB_JSON)
    f.write(';')

print('data_embed.js written')
