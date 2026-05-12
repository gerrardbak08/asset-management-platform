#!/usr/bin/env python3
"""Generate complete single-page HTML for AIMS platform."""
import json, base64, os, subprocess

DATA_PATH = "apps/api/data/v16-extracted.json"
PHOTOS_DIR = "uploads/buildings"
OUTPUT_PATH = "AIMS_완전판_v2.html"

print("Loading data...")
with open(DATA_PATH, "r") as f:
    data = json.load(f)

buildings_raw = data["buildingsRaw"]
coords = data["coords"]
equipments_raw = data["equipmentsRaw"]
stores_all = data["stores"]
m0 = data["m0Data"]
photos_map = data["photos"]
details_map = data["details"]

# Resize and encode photos to base64 (max 400px wide, quality 60)
print("Encoding photos...")
photo_b64 = {}
for i in range(1, 16):
    fname = f"b{str(i).zfill(3)}.jpg"
    fpath = os.path.join(PHOTOS_DIR, fname)
    if os.path.exists(fpath):
        try:
            result = subprocess.run(
                ["python3", "-c", f"""
import sys
try:
    from PIL import Image
    import io
    img = Image.open('{fpath}')
    img.thumbnail((400, 300))
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=50)
    sys.stdout.buffer.write(buf.getvalue())
except ImportError:
    with open('{fpath}', 'rb') as f:
        sys.stdout.buffer.write(f.read())
"""],
                capture_output=True, timeout=10
            )
            if result.returncode == 0 and result.stdout:
                photo_b64[fname] = base64.b64encode(result.stdout).decode()
                print(f"  {fname}: {len(photo_b64[fname])//1024}KB b64")
        except Exception as e:
            print(f"  {fname}: skip ({e})")

# Also try detail photos
for i in range(1, 16):
    fname = f"b{str(i).zfill(3)}_detail.jpg"
    fpath = os.path.join(PHOTOS_DIR, fname)
    if os.path.exists(fpath):
        try:
            result = subprocess.run(
                ["python3", "-c", f"""
import sys
try:
    from PIL import Image
    import io
    img = Image.open('{fpath}')
    img.thumbnail((400, 300))
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=50)
    sys.stdout.buffer.write(buf.getvalue())
except ImportError:
    with open('{fpath}', 'rb') as f:
        sys.stdout.buffer.write(f.read())
"""],
                capture_output=True, timeout=10
            )
            if result.returncode == 0 and result.stdout:
                photo_b64[fname] = base64.b64encode(result.stdout).decode()
                print(f"  {fname}: {len(photo_b64[fname])//1024}KB b64")
        except Exception as e:
            print(f"  {fname}: skip ({e})")

print(f"Photos encoded: {len(photo_b64)}")

# Prepare buildings data
buildings_js = []
for i, b in enumerate(buildings_raw):
    photo_key = f"b{str(i+1).zfill(3)}.jpg"
    detail_key = f"b{str(i+1).zfill(3)}_detail.jpg"
    buildings_js.append({
        "name": b[0], "address": b[1], "use": b[2],
        "areaSqm": b[3], "areaPyeong": b[4], "floors": b[5],
        "approvalDate": b[6] if b[6] != "-" else None,
        "acquisitionDate": b[7], "acquisitionPrice": b[8],
        "rentalArea": b[9], "rentalRate": b[10], "vacancy": b[11],
        "tenant": b[12],
        "lat": coords[i][0] if i < len(coords) else 37.5,
        "lng": coords[i][1] if i < len(coords) else 127.0,
        "photo": photo_key if photo_key in photo_b64 else None,
        "detailPhoto": detail_key if detail_key in photo_b64 else None,
    })

# Equipment data
equip_js = []
for e in equipments_raw:
    equip_js.append({
        "name": e[0],
        "purchase": e[1], "transfer": e[2], "disposal": e[3], "inventory": e[4]
    })

# All stores
stores_js = []
for s in stores_all:
    stores_js.append({
        "name": s["name"],
        "siteType": s.get("site_type", ""),
        "assetValue": s.get("asset_value", 0),
        "assetCount": s.get("asset_count", 0),
        "supplyValue": s.get("supply_value", 0),
        "assetByType": s.get("asset_by_type", {}),
        "supplyByCategory": s.get("supply_by_category", {}),
        "supplyByCategoryCount": s.get("supply_by_category_count", {}),
    })

# Sort stores by asset_value desc
stores_js.sort(key=lambda s: s["assetValue"], reverse=True)

print(f"Data: {len(buildings_js)} buildings, {len(equip_js)} equipment, {len(stores_js)} stores")
print("Generating HTML...")

# Serialize data for embedding
data_block = f"""
const PHOTOS_B64 = {json.dumps(photo_b64)};
const BUILDINGS = {json.dumps(buildings_js, ensure_ascii=False)};
const EQUIPMENTS = {json.dumps(equip_js, ensure_ascii=False)};
const STORES = {json.dumps(stores_js, ensure_ascii=False)};
const M0 = {json.dumps(m0, ensure_ascii=False)};
"""

print(f"Data block size: {len(data_block)//1024}KB")
print("Writing HTML file...")

# Now write the full HTML
with open(OUTPUT_PATH, "w", encoding="utf-8") as out:
    out.write(HTML_TEMPLATE.replace("/* __DATA_BLOCK__ */", data_block))

print(f"Done! {OUTPUT_PATH} ({os.path.getsize(OUTPUT_PATH)//1024}KB)")
