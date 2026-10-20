"""Theme migration #2: Frameloom green/gold -> Yowflow ink + lime.
 - hue ~166 (the green produced by codemod_palette) -> neutral ink (keeps lightness, near-zero saturation)
 - light golds (hue 35-48, L >= .55) -> lime, same lightness
Semantic success/warning/danger colours are left alone."""
import re, colorsys, pathlib

def conv(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r/255, g/255, b/255); d = h*360
    if s >= 0.08 and 164 <= d <= 168:                 # converted brand green -> ink
        r2, g2, b2 = colorsys.hls_to_rgb(100/360, l, 0.06)
    elif s >= 0.2 and 35 <= d <= 48 and l >= 0.55:   # champagne gold -> lime
        r2, g2, b2 = colorsys.hls_to_rgb(80/360, min(l, 0.62) if l < 0.62 else l, max(s, 0.7))
    else:
        return None
    return round(r2*255), round(g2*255), round(b2*255)

HEX = re.compile(r'#([0-9a-fA-F]{6})\b'); RGB = re.compile(r'rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})')
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
