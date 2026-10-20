"""One-shot palette migration: plum/rose hues -> Yowflow deep green. Gold, reds, blues and neutrals are untouched."""
import re, colorsys, pathlib

HUE_LO, HUE_HI = 318, 352     # plum / rose band (danger reds sit at 353-10 and are kept)
TARGET_HUE = 166 / 360

def convert(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    deg = h * 360
    if s < 0.10 or not (HUE_LO <= deg <= HUE_HI):
        return None
    l2 = l * 0.72 if l < 0.55 else l            # deepen the brand-weight shades
    s2 = min(s, 0.34) if l < 0.7 else min(s, 0.22)
    r2, g2, b2 = colorsys.hls_to_rgb(TARGET_HUE, l2, s2)
    return round(r2 * 255), round(g2 * 255), round(b2 * 255)

HEX = re.compile(r'#([0-9a-fA-F]{6})\b')
RGBA = re.compile(r'rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})')

def hex_sub(m):
    v = m.group(1); c = convert(int(v[0:2], 16), int(v[2:4], 16), int(v[4:6], 16))
    if not c: return m.group(0)
    out = '%02X%02X%02X' % c
    return '#' + (out if v.isupper() or not v.islower() else out.lower())

def rgba_sub(m):
    c = convert(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    if not c: return m.group(0)
    return m.group(0).split('(')[0] + '(%d,%d,%d' % c

n = 0
for p in pathlib.Path('src').rglob('*'):
    if p.suffix in ('.ts', '.tsx', '.css') and not p.name.endswith('.test.ts'):
        s = p.read_text(); t = RGBA.sub(rgba_sub, HEX.sub(hex_sub, s))
        if t != s: p.write_text(t); n += 1
print(n, 'files recolored')
