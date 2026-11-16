import json
a=open('assets.json').read(); js=open('game.js').read()
html='''<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Алиса и Искорка: три звёздочки</title>
<style>html,body{margin:0;height:100%;background:#1c1638;overflow:hidden}body{display:flex;align-items:center;justify-content:center}canvas{display:block;image-rendering:auto}</style>
</head><body><canvas id="c" width="1280" height="720"></canvas>
<script>const ASSETS='''+a+''';</script>
<script>'''+js+'''</script></body></html>'''
import os; os.makedirs('dist',exist_ok=True); open('dist/index.html','w').write(html); print(len(html)//1024,'KB')
