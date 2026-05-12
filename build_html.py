#!/usr/bin/env python3
"""Build complete AIMS single-page HTML."""
import json, os

with open('_data_embed.js', 'r', encoding='utf-8') as f:
    data_js = f.read()

OUTPUT = 'AIMS_완전판_v2.html'

html = []
html.append('<!DOCTYPE html>')
html.append('<html lang="ko">')
html.append('<head>')
html.append('<meta charset="UTF-8">')
html.append('<meta name="viewport" content="width=device-width,initial-scale=1.0">')
html.append('<title>AIMS — 전사 자산관리 시스템</title>')
html.append('<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">')
html.append('<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"><\/script>')
html.append('<style>')
html.append(CSS)
html.append('</style>')
html.append('</head>')
html.append('<body>')
html.append(BODY_HTML)
html.append('<script>')
html.append(data_js)
html.append(APP_JS)
html.append('<\/script>')
html.append('</body>')
html.append('</html>')

with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write('\n'.join(html))

print(f'Generated: {OUTPUT} ({os.path.getsize(OUTPUT)//1024}KB)')
