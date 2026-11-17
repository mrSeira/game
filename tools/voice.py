# Озвучка реплик: python3 tools/voice.py <модель.onnx>  → voices.json
import re, sys, json, base64, subprocess, tempfile, os
model = sys.argv[1]
src = open('game.js', encoding='utf8').read()
lines = []
for m in re.finditer(r"say\('([^']+)',\s*([^;]*?)\);", src):
    who, rest = m.group(1), m.group(2)
    for t in re.findall(r"'([^']+)'", rest): lines.append((who, t))
tv = re.search(r"const TV = \[(.*?)\];", src).group(1)
for t in re.findall(r"'([^']+)'", tv): lines.append(('Совушка', t))
PITCH = {'Шуршик': 1.22, 'Искорка': 1.12, 'Алиса': 1.18, 'Мама': 0.97, 'Совушка': 0.93}
out = {}
with tempfile.TemporaryDirectory() as d:
    for i, (who, t) in enumerate(dict.fromkeys(lines)):
        wav, mp3 = os.path.join(d, f'{i}.wav'), os.path.join(d, f'{i}.mp3')
        spoken = t.replace('…', ',')
        subprocess.run([sys.executable, '-m', 'piper', '-m', model, '-f', wav, '--length_scale', '1.12', '--sentence_silence', '0.25'], input=spoken.encode(), check=True, capture_output=True)
        f = PITCH.get(who, 1.0)
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', wav, '-af', f'asetrate=22050*{f},aresample=22050,atempo={1/f:.4f},loudnorm=I=-16', '-ac', '1', '-b:a', '40k', mp3], check=True)
        out[t] = 'data:audio/mpeg;base64,' + base64.b64encode(open(mp3, 'rb').read()).decode()
        print(who, '|', t)
json.dump(out, open('voices.json', 'w', encoding='utf8'), ensure_ascii=False)
print(len(out), 'реплик,', sum(len(v) for v in out.values()) // 1024, 'KB')
