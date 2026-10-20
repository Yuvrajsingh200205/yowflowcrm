"""One-shot codemod: replace hardcoded brand strings in src/**/*.ts(x) with BRAND.* references."""
import re, sys, pathlib

ROOT = pathlib.Path('src')
SKIP = {'config/brand.ts'}
# (needle, expression) — ordered, most specific first.
PHRASES = [
    ('hello@weddingphotoplanet.com', 'BRAND.supportEmail'),
    ('rajat@weddingphotoplanet.com', 'BRAND.supportEmail'),
    ('Wedding Photo Planet CRM', 'BRAND.name'),
    ('WEDDING PHOTO PLANET', 'BRAND.name.toUpperCase()'),
    ('Wedding Photo Planet', 'BRAND.name'),
    ('weddingphotoplanet.com', 'BRAND.domain'),
]
PREFIX_RE = re.compile(r'wpp([_.\-])(?=[a-z])')

def scan(src, targets):
    """Yield (start, end, kind) for every occurrence of a target (regex) outside comments,
    with the enclosing literal kind: 'sq','dq','tpl' or 'code' (JSX text)."""
    i, n = 0, len(src)
    out = []
    state = 'code'
    lit_start = 0
    tpl_depth = []  # stack for ${ } nesting
    while i < n:
        c = src[i]
        if state == 'code':
            if src.startswith('//', i):
                j = src.find('\n', i); i = n if j < 0 else j; continue
            if src.startswith('/*', i):
                j = src.find('*/', i + 2); i = n if j < 0 else j + 2; continue
            if c == "'": state, lit_start = 'sq', i
            elif c == '"': state, lit_start = 'dq', i
            elif c == '`': state, lit_start = 'tpl', i
            elif c == '}' and tpl_depth:
                state, lit_start = 'tpl', tpl_depth.pop()
            else:
                m = targets.match(src, i)
                if m: out.append((m.start(), m.end(), 'code', None)); i = m.end(); continue
            i += 1; continue
        if state in ('sq', 'dq'):
            q = "'" if state == 'sq' else '"'
            if c == '\\': i += 2; continue
            if c == '\n': state = 'code'; i += 1; continue   # recover from JSX apostrophes
            if c == q:
                state = 'code'; i += 1; continue
            m = targets.match(src, i)
            if m: out.append((m.start(), m.end(), state, lit_start)); i = m.end(); continue
            i += 1; continue
        if state == 'tpl':
            if c == '\\': i += 2; continue
            if c == '`': state = 'code'; i += 1; continue
            if src.startswith('${', i):
                tpl_depth.append(lit_start); state = 'code'; i += 2; continue
            m = targets.match(src, i)
            if m: out.append((m.start(), m.end(), 'tpl', lit_start)); i = m.end(); continue
            i += 1; continue
    return out

def expr_for(text):
    if PREFIX_RE.fullmatch(text): return 'BRAND.cookiePrefix'
    for needle, e in PHRASES:
        if text == needle: return e
    raise ValueError(text)

def process(path):
    src = path.read_text()
    alt = '|'.join(re.escape(p) for p, _ in PHRASES) + '|wpp[_.\\-](?=[a-z])'
    targets = re.compile(alt)
    hits = scan(src, targets)
    if not hits: return False
    # group literal-level edits
    edits = []   # (start, end, replacement)
    lits = {}
    for s, e, kind, ls in hits:
        text = src[s:e]
        sep = text[3] if text.startswith('wpp') else None
        ex = 'BRAND.cookiePrefix' if sep else expr_for(text)
        tail = sep if sep else ''
        if kind == 'code':
            edits.append((s, e, '{' + ex + '}' + tail))
        elif kind == 'tpl':
            edits.append((s, e, '${' + ex + '}' + tail))
        else:
            lits.setdefault(ls, []).append((s, e, ex, tail))
    # convert single/double-quoted literals to template literals
    for ls, items in lits.items():
        q = src[ls]
        end = ls + 1
        while src[end] != q:
            end += 2 if src[end] == '\\' else 1
        body = src[ls + 1:end]
        rel = [(s - ls - 1, e - ls - 1, ex, t) for s, e, ex, t in items]
        new, last = [], 0
        for s, e, ex, t in rel:
            new.append(esc(body[last:s])); new.append('${' + ex + '}' + t); last = e
        new.append(esc(body[last:]))
        repl = '`' + ''.join(new) + '`'
        # JSX attribute value: name="..." -> name={`...`}  (quote directly after `name=`)
        if re.search(r'[A-Za-z\-]=$', src[:ls]):
            repl = '{' + repl + '}'
        edits.append((ls, end + 1, repl))
    edits.sort(reverse=True)
    for s, e, r in edits: src = src[:s] + r + src[e:]
    rel = str(path.relative_to(ROOT))
    imp = "import { BRAND } from '@/config/brand';\n"
    if imp not in src:
        lines = src.split('\n'); idx = 0
        for k, l in enumerate(lines):
            if l.startswith("'use client'") or l.startswith('"use client"'): idx = k + 1
            if re.match(r'^import .* from ', l) or re.match(r"^import '", l) or l.startswith('} from '): idx = k + 1
        lines.insert(idx, imp.rstrip('\n'))
        src = '\n'.join(lines)
    path.write_text(src)
    return True

def esc(s): return s.replace('\\\'', "'").replace('\\"', '"').replace('`', '\\`').replace('${', '\\${')

def in_jsx_attr(src, pos):
    # crude: the nearest '<' before pos without an intervening '>' at depth 0
    seg = src[max(0, pos - 400):pos]
    lt = seg.rfind('<'); gt = seg.rfind('>')
    return lt > gt and re.match(r'<[A-Za-z]', seg[lt:]) is not None

changed = []
for p in sorted(ROOT.rglob('*')):
    if p.suffix in ('.ts', '.tsx') and str(p.relative_to(ROOT)) not in SKIP and not p.name.endswith('.test.ts'):
        if process(p): changed.append(str(p))
print('\n'.join(changed)); print(len(changed), 'files changed')
