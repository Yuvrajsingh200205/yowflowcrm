"""Theme migration #3: deepen olive-gray inks (hue 90-110, low saturation) into true ink,
and turn blush/peach tints (hue 12-28, saturated) into lime tints."""
import re, colorsys, pathlib

def conv(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r/255, g/255, b/255); d = h*360
    if 90 <= d <= 110 and 0.03 <= s <= 0.12 and l < 0.5:
        r2, g2, b2 = colorsys.hls_to_rgb(88/360, l*0.5, 0.16)
    elif 12 <= d <= 28 and s >= 0.3 and l >= 0.5:
        r2, g2, b2 = colorsys.hls_to_rgb(80/360, l, min(max(s, 0.55), 0.85))
    else:
        return None
    return round(r2*255), round(g2*255), round(b2*255)

HEX = re.compile(r'#([0-9a-fA-F]{6})(?![0-9a-fA-F])'); RGB = re.compile(r'rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})')
def hs(m):
    v = m.group(1); c = conv(int(v[:2],16), int(v[2:4],16), int(v[4:],16))
    return m.group(0) if not c else '#%02X%02X%02X' % c
def rs(m):
    c = conv(*map(int, m.groups())); return m.group(0) if not c else m.group(0).split('(')[0] + '(%d,%d,%d' % c
n = 0
for p in pathlib.Path('src').rglob('*'):
    if p.suffix in ('.ts', '.tsx', '.css') and not p.name.endswith('.test.ts') and p.name != 'globals.css':
        s = p.read_text(); t = RGB.sub(rs, HEX.sub(hs, s))
        if t != s: p.write_text(t); n += 1
print(n, 'files')
