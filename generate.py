import random, math, collections, sys, os, re, datetime, urllib.request
R, C = 13, 50
W, H = 1110, 230
CW, CH = W / C, H / R
D4 = [(0, 1), (1, 0), (0, -1), (-1, 0)]
T, SP, SG = 3200, 7, 9           # 90 s en unidades de 0.05 s; pac 0.2 s/casilla, fantasma 0.25 s/casilla
LOOP = 160
GCOL = ["#FF5C8A", "#35E6A5", "#00CFFF", "#8B35FF", "#D946EF", "#FFB84D", "#FF4B75", "#4D8DFF"]
LV = ["#161B22", "#0E4429", "#006D32", "#26A641", "#39D353"]
px = lambda p: ((p[1] + .5) * CW, (p[0] + .5) * CH)
f = lambda x: f"{x:.1f}".rstrip("0").rstrip(".")

# ---------------------------------------------------------------- datos reales
def streaks(user):
    req = urllib.request.Request(f"https://github.com/users/{user}/contributions", headers={"User-Agent": "Mozilla/5.0"})
    h = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
    cells = [(m.group(2), m.group(1)) for m in re.finditer(r'<td[^>]*?data-date="([\d-]+)"[^>]*?id="([^"]+)"', h)] or \
            [(m.group(1), m.group(2)) for m in re.finditer(r'<td[^>]*?id="([^"]+)"[^>]*?data-date="([\d-]+)"', h)]
    cells = [(d, i) for d, i in cells if re.fullmatch(r"\d{4}-\d\d-\d\d", d)] or [(i, d) for d, i in cells if re.fullmatch(r"\d{4}-\d\d-\d\d", i)]
    tips = {m.group(1): m.group(2) for m in re.finditer(r'<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)</tool-tip>', h)}
    cnt = {}
    for d, i in cells:
        m = re.match(r"(\d+) contribution", tips.get(i, "")); cnt[d] = int(m.group(1)) if m else 0
    if len(cnt) < 300: raise RuntimeError("No se pudo leer el calendario de contribuciones")
    ds = sorted(cnt); run = best = cur = 0
    for d in ds:
        run = run + 1 if cnt[d] > 0 else 0; best = max(best, run)
    for d in reversed(ds):
        if cnt[d] > 0: cur += 1
        elif d != ds[-1]: break
    return cur, best

# ---------------------------------------------------------------- laberinto
def cor(g): return {(r, c) for r in range(R) for c in range(C) if g[r][c] == '.'}

def valid(g):
    S = cor(g)
    for (r, c) in S:
        if sum((r + a, c + b) in S for a, b in D4) < 2: return False
    s0 = next(iter(S)); seen = {s0}; q = [s0]
    while q:
        r, c = q.pop()
        for a, b in D4:
            n = (r + a, c + b)
            if n in S and n not in seen: seen.add(n); q.append(n)
    return len(seen) == len(S)

def open2(g):
    return [(r, c) for r in range(R - 1) for c in range(C - 1)
            if all(g[r + a][c + b] == '.' for a in (0, 1) for b in (0, 1))]

def put(g, cells):
    old = []
    for r, c in cells:
        for cc in (c, C - 1 - c):
            old.append((r, cc, g[r][cc])); g[r][cc] = '#'
    return old

def seg(lo, hi, rnd):
    out = []; c = lo
    while c <= hi:
        rem = hi - c + 1
        if rem <= 6:
            if rem == 1 and out: out[-1] = (out[-1][0], hi)
            else: out.append((c, hi))
            break
        w = rnd.randint(2, min(6, rem - 3)); out.append((c, c + w - 1)); c += w + 1
    return out

def build(seed):
    rnd = random.Random(seed)
    g = [['.'] * C for _ in range(R)]
    for c in range(C): g[0][c] = g[R - 1][c] = '#'
    for r in range(R): g[r][0] = g[r][C - 1] = '#'
    for c in range(21, 29): g[5][c] = g[7][c] = '#'
    g[6][21] = g[6][28] = '#'
    for c in range(22, 28): g[6][c] = 'H'
    g[5][24] = g[5][25] = 'D'
    for r in (1, 2, 3, 9, 10): g[r][24] = g[r][25] = '#'
    res = {(4, c) for c in range(20, 30)} | {(8, c) for c in range(20, 30)} | \
          {(r, 20) for r in range(4, 9)} | {(r, 29) for r in range(4, 9)}
    op = [p for p in open2(g) if p[1] <= 24]
    for _ in range(3000):
        if not op: break
        r, c = rnd.choice(op)
        w = rnd.choice([1, 2, 2, 3, 3, 4, 4, 5]); h = rnd.choice([1, 2, 2, 3, 3, 4, 5])
        if (w == 1 and h < 3) or (h == 1 and w < 3): continue
        c0 = c - rnd.randint(0, w - 1); r0 = r - rnd.randint(0, h - 1)
        if c0 < 1 or c0 + w - 1 > 23 or r0 < 1 or r0 + h - 1 > 11: continue
        cells = [(rr, cc) for rr in range(r0, r0 + h) for cc in range(c0, c0 + w)]
        if any(g[rr][cc] != '.' or (rr, cc) in res for rr, cc in cells): continue
        old = put(g, cells)
        if not valid(g):
            for rr, cc, v in old: g[rr][cc] = v
        else: op = [p for p in open2(g) if p[1] <= 24]
    for (r, c) in open2(g):
        for a_, b_ in ((0, 0), (1, 0), (0, 1), (1, 1)):
            rr, cc = r + a_, c + b_
            if g[rr][cc] != '.' or (rr, cc) in res or cc > 24: continue
            old = put(g, [(rr, cc)])
            if valid(g): break
            for x, y, v in old: g[x][y] = v
    if open2(g) or not valid(g): return None
    return g

def score(g):
    S = cor(g)
    wl = {(r, c) for r in range(R) for c in range(C) if g[r][c] == '#'}
    seen, isl, nonrect, tall = set(), 0, 0, 0
    for p in wl:
        if p in seen: continue
        comp = [p]; q = [p]; seen.add(p)
        while q:
            r, c = q.pop()
            for a, b in D4:
                n = (r + a, c + b)
                if n in wl and n not in seen: seen.add(n); q.append(n); comp.append(n)
        rs = [x[0] for x in comp]; cs = [x[1] for x in comp]
        if min(rs) == 0 or max(rs) == R - 1 or min(cs) == 0 or max(cs) == C - 1: continue
        isl += 1
        bb = (max(rs) - min(rs) + 1) * (max(cs) - min(cs) + 1)
        if bb != len(comp): nonrect += 1
        if max(rs) - min(rs) >= 4 and max(cs) - min(cs) <= 2: tall += 1
    pill = sum(1 for (r, c) in wl if all((r + a, c + b) not in wl for a, b in D4))
    return isl * 1.5 + nonrect * 3 + tall * 2 - pill * 5 - abs(len(S) - 300) / 5

# ---------------------------------------------------------------- simulación
def bfs(src, adj, lim=999):
    d = {s: 0 for s in src}; q = collections.deque(src)
    while q:
        p = q.popleft()
        if d[p] >= lim: continue
        for n in adj.get(p, ()):
            if n not in d: d[n] = d[p] + 1; q.append(n)
    return d

def lerp(e, t):
    a = px(e['cell']); n = e.get('nxt')
    if n is None: return a
    b = px(n); k = min(1, (t - e['t0']) / e['step'])
    return (a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k)

def simulate(g, seed, chase):
    rnd = random.Random(seed * 13 + 5)
    S = cor(g)
    adj = {p: [(p[0] + a, p[1] + b) for a, b in D4 if (p[0] + a, p[1] + b) in S] for p in S}
    start = min(S, key=lambda p: (p[0] - 1) ** 2 + (p[1] - 1) ** 2)
    pool = sorted(S - {start})
    nc = rnd.sample(pool, int(len(S) * .31))
    contrib = {p: rnd.choices([0, 1, 2, 3, 4], [1.2, 2.2, 2, 2, 1.8])[0] for p in nc}
    coins = [p for p in pool if p not in contrib]
    sp = []
    cand = [p for p in coins if len(adj[p]) >= 3] or coins
    sp.append(rnd.choice(cand))
    while len(sp) < 15:
        sp.append(max(cand, key=lambda p: min(abs(p[0] - q[0]) * 1.3 + abs(p[1] - q[1]) for q in sp)))
    eaten = {}
    ang = {(0, 1): 0, (1, 0): 90, (0, -1): 180, (-1, 0): 270}
    pac = dict(cell=start, nxt=None, t0=0, step=SP, d=(0, 1), prev=None)
    pkf = [(0,) + px(start)]; rot = [(0, 0)]
    hs = [(6, c) for c in range(22, 28)]
    gadj = {p: [n for n in adj[p]] for p in S}
    far = bfs([start], adj)
    gh = []
    spots = [p for p in sorted(S) if far[p] >= 14]
    rnd.shuffle(spots)
    chosen = []
    for p in spots:
        if all(abs(p[0] - q[0]) + abs(p[1] - q[1]) >= 8 for q in chosen): chosen.append(p)
        if len(chosen) == 8: break
    for i, p in enumerate(chosen):
        gh.append(dict(cell=p, nxt=None, t0=0, step=SG, prev=None, plan=[], alive=True, rs=0,
                       kf=[(0,) + px(p)], op=[(0, 1)], c=GCOL[i]))
    expl = []

    def spawn_path(h):
        col = 24 if h[1] <= 24 else 25
        path = []; r, c = h
        while c != col: c += 1 if col > c else -1; path.append((r, c))
        path += [(5, col), (4, col)]
        return path

    def gplan(e):
        pd = bfs([pac['cell']], adj)
        best = None
        for _ in range(8):
            cur, prev, sc, walk = e['cell'] if e['nxt'] is None else e['nxt'], e['cell'], 0, []
            for _s in range(24):
                nb = [n for n in adj[cur] if n != prev] or [prev]
                n = rnd.choice(nb); walk.append(n); sc += pd.get(n, 0); prev, cur = cur, n
            if best is None or sc > best[0]: best = (sc, walk)
        return best[1]

    def gnext(e, t):
        if not e['plan']: e['plan'] = gplan(e) if e['cell'] in S else spawn_path(e['cell'])
        e['nxt'] = e['plan'].pop(0); e['t0'] = t

    def pnext(t):
        cell = pac['cell']
        gc = [e['nxt'] or e['cell'] for e in gh if e['alive'] and (e['nxt'] or e['cell']) in S]
        fg = bfs(gc, adj) if gc else {}
        rem = [p for p in coins if p not in eaten]
        fc = bfs(rem, adj) if rem else {}
        field = fg if fg.get(cell, 99) <= chase else fc
        nb = adj[cell]
        st = (cell[0] + pac['d'][0], cell[1] + pac['d'][1])
        nxt = min(nb, key=lambda n: (field.get(n, 999), n == pac['prev'], n != st, rnd.random()))
        d = (nxt[0] - cell[0], nxt[1] - cell[1])
        if d != pac['d'] or len(rot) == 1 and t == 0:
            if ang[d] != rot[-1][1]: rot.append((t, ang[d]))
        pac['d'] = d; pac['nxt'] = nxt; pac['t0'] = t

    pnext(0)
    for e in gh: gnext(e, 0)
    for t in range(1, T + 1):
        if t - pac['t0'] >= SP:
            pac['prev'] = pac['cell']; pac['cell'] = pac['nxt']
            if pac['cell'] in coins and pac['cell'] not in eaten: eaten[pac['cell']] = t
            pnext(t); pkf.append((t,) + px(pac['cell']))
        for e in gh:
            if not e['alive']:
                if t >= e['rs']:
                    e['alive'] = True; e['plan'] = spawn_path(e['cell']); gnext(e, t)
                    e['op'] += [(e['rs'], 0), (e['rs'] + 10, 1)]
                continue
            if t - e['t0'] >= SG:
                e['prev'] = e['cell']; e['cell'] = e['nxt']; e['kf'].append((t,) + px(e['cell'])); gnext(e, t)
        pp = lerp(pac, t)
        for e in gh:
            if not e['alive']: continue
            gp = lerp(e, t)
            if math.hypot(pp[0] - gp[0], pp[1] - gp[1]) < 9.5 and (e['cell'] in S):
                expl.append((t, gp[0], gp[1], e['c']))
                e['kf'].append((t,) + gp)
                h = rnd.choice(hs); hp = px(h)
                e['kf'].append((t + .02,) + hp)
                e['rs'] = t + 100; e['kf'].append((e['rs'],) + hp)
                e['op'] += [(t - .02, 1), (t, 0)]
                e['alive'] = False; e['cell'] = h; e['nxt'] = None; e['plan'] = []
    pkf.append((T,) + lerp(pac, T))
    for e in gh:
        if e['alive']: e['kf'].append((T,) + lerp(e, T))
        else: e['kf'].append((T,) + px(e['cell']))
        e['op'].append((T, e['op'][-1][1] if e['alive'] else 0))
    return dict(S=S, start=start, contrib=contrib, coins=coins, sp=set(sp), eaten=eaten, pkf=pkf, rot=rot, gh=gh,
                expl=expl, adj=adj)

# ---------------------------------------------------------------- SVG
def compress(kf):
    out = [kf[0]]
    for i in range(1, len(kf) - 1):
        a, b, c = out[-1], kf[i], kf[i + 1]
        v1 = ((b[1] - a[1]) / (b[0] - a[0] + 1e-9), (b[2] - a[2]) / (b[0] - a[0] + 1e-9))
        v2 = ((c[1] - b[1]) / (c[0] - b[0] + 1e-9), (c[2] - b[2]) / (c[0] - b[0] + 1e-9))
        if abs(v1[0] - v2[0]) < 1e-3 and abs(v1[1] - v2[1]) < 1e-3: continue
        out.append(b)
    out.append(kf[-1]); return out

def mono(ts):
    out = []; last = -1
    for t in ts:
        k = t / T
        if k <= last: k = last + 1e-6
        out.append(k); last = k
    out[0] = 0; out[-1] = 1; return out

def chamfer(kf, step, f=0.3):
    out = [kf[0]]
    for i in range(1, len(kf) - 1):
        a, b, c = kf[i - 1], kf[i], kf[i + 1]
        d1, d2 = b[0] - a[0], c[0] - b[0]
        v1 = (b[1] - a[1], b[2] - a[2]); v2 = (c[1] - b[1], c[2] - b[2])
        cross = v1[0] * v2[1] - v1[1] * v2[0]; dot = v1[0] * v2[0] + v1[1] * v2[1]
        if abs(d1 - step) < .01 and abs(d2 - step) < .01 and abs(cross) > 1e-6 and dot >= 0:
            out.append((b[0] - f * d1, b[1] - f * v1[0], b[2] - f * v1[1]))
            out.append((b[0] + f * d2, b[1] + f * v2[0], b[2] + f * v2[1]))
        else: out.append(b)
    out.append(kf[-1]); return out

def motion(kf, step):
    kf = compress(chamfer(kf, step)); ks = mono([k[0] for k in kf])
    return ('<animateMotion dur="%ds" repeatCount="indefinite" calcMode="linear" values="%s" keyTimes="%s"/>' %
            (LOOP, ";".join(f"{f(k[1])},{f(k[2])}" for k in kf), ";".join(f"{k:.6f}" for k in ks)))

def op_anim(op):
    ks = mono([o[0] for o in op])
    return ('<animate attributeName="opacity" dur="%ds" repeatCount="indefinite" values="%s" keyTimes="%s"/>' %
            (LOOP, ";".join(str(o[1]) for o in op), ";".join(f"{k:.6f}" for k in ks)))

def eat_anim(te):
    return ('<animate attributeName="opacity" dur="%ds" repeatCount="indefinite" '
            'values="1;1;0;0;1" keyTimes="0;%.6f;%.6f;0.9995;1"/>' % (LOOP, (te - 1) / T, (te + 3) / T))

def make(g, s):
    S = s['S']; out = []; A = out.append
    A('''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="480" viewBox="0 0 1200 480" role="img" aria-label="Wheatley06 cyberpunk Pac-Man contribution maze">
<defs>
<linearGradient id="panelGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#12243A"/><stop offset="55%" stop-color="#0B1728"/><stop offset="100%" stop-color="#101020"/></linearGradient>
<linearGradient id="headerGradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#00CFFF" stop-opacity="0.8"/><stop offset="50%" stop-color="#1677FF" stop-opacity="0.25"/><stop offset="100%" stop-color="#D946EF" stop-opacity="0.8"/></linearGradient>
<linearGradient id="wallGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#00CFFF"/><stop offset="100%" stop-color="#1677FF"/></linearGradient>
<radialGradient id="backgroundGlow"><stop offset="0%" stop-color="#1677FF" stop-opacity="0.18"/><stop offset="100%" stop-color="#0D1117" stop-opacity="0"/></radialGradient>
<filter id="neonGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="strongGlow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="greenGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="wallFx" filterUnits="userSpaceOnUse" x="-6" y="-6" width="1122" height="242"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<pattern id="circuitGrid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#00CFFF" stroke-opacity="0.07"/><circle cx="0" cy="0" r="1.5" fill="#00CFFF" opacity="0.2"/></pattern>
<clipPath id="mazeClip"><rect width="1110" height="230" rx="4"/></clipPath>
</defs>
<rect width="1200" height="480" fill="#0D1117"/><rect width="1200" height="480" fill="url(#circuitGrid)"/>
<ellipse cx="600" cy="240" rx="570" ry="300" fill="url(#backgroundGlow)"/>
<path d="M0 90H1200 M0 420H1200" stroke="#00CFFF" stroke-opacity="0.15"/>
<path id="circ" d="M25 25H160L180 45H300 M900 25H1040L1060 45H1175" fill="none" stroke="#00CFFF" stroke-opacity="0.35" stroke-width="1.5"/>
<path id="trL" d="M25 25H160L180 45H300" fill="none"/><path id="trR" d="M1175 45H1060L1040 25H900" fill="none"/>
<circle r="2.6" fill="#00CFFF" filter="url(#neonGlow)"><animateMotion dur="4s" repeatCount="indefinite"><mpath href="#trL"/></animateMotion></circle>
<circle r="2.6" fill="#D946EF" filter="url(#neonGlow)"><animateMotion dur="4s" begin="1.5s" repeatCount="indefinite"><mpath href="#trR"/></animateMotion></circle>
<rect x="25" y="115" width="1150" height="290" rx="12" fill="url(#panelGradient)" stroke="#00CFFF" stroke-opacity="0.45" stroke-width="1.5"/>
<path d="M45 135H170 M1030 135H1155 M45 385H170 M1030 385H1155" fill="none" stroke="#00CFFF" stroke-opacity="0.5" stroke-width="2"/>
<path d="M25 155V135Q25 115 45 115 M1155 115Q1175 115 1175 135V155 M25 365V385Q25 405 45 405 M1155 405Q1175 405 1175 385V365" fill="none" stroke="#00CFFF" stroke-width="1.5" opacity="0.7"/>
<g font-family="monospace">
<text x="36" y="48" fill="#00CFFF" font-size="13" letter-spacing="4">SYSTEM // PAC-MAN MATRIX</text>
<text x="36" y="78" fill="#FFFFFF" font-size="27" font-weight="bold" letter-spacing="3">WHEATLEY06<animate attributeName="fill-opacity" values="1;0.82;1;1;0.9;1" keyTimes="0;0.04;0.08;0.7;0.73;1" dur="6s" repeatCount="indefinite"/></text>
<circle cx="1094" cy="44" r="3.6" fill="#00D6B0" filter="url(#neonGlow)"><animate attributeName="opacity" values="1;0.25;1" dur="1.6s" repeatCount="indefinite"/></circle>
<text x="1160" y="48" text-anchor="end" fill="#00D6B0" font-size="12" letter-spacing="2">ONLINE</text>
<text x="1160" y="75" text-anchor="end" fill="#8299B5" font-size="10" letter-spacing="2">STREAK // CURRENT @@CUR@@ DAYS // BEST @@BEST@@</text>
<rect x="35" y="98" width="1130" height="2" fill="url(#headerGradient)"/>
<text x="45" y="135" fill="#00CFFF" font-size="9" letter-spacing="1.5">NEON MAZE // @@N@@ MOVEMENT NODES</text>
<text x="1155" y="135" text-anchor="end" fill="#00D6B0" font-size="9" letter-spacing="1.5">@@K@@ CONTRIBUTION CELLS</text>
</g>'''.replace('@@CUR@@', str(s['streak'][0])).replace('@@BEST@@', str(s['streak'][1])).replace('@@N@@', str(len(S))).replace('@@K@@', str(sum(1 for v in s['contrib'].values() if v > 0))))
    for i, (x, y, col, b) in enumerate([(80, 105, "#00CFFF", 0), (180, 424, "#1677FF", .5), (1040, 108, "#8B35FF", 1),
                                        (1120, 424, "#D946EF", 1.5), (420, 424, "#00D6B0", .8), (790, 424, "#00CFFF", 1.2)]):
        A(f'<circle cx="{x}" cy="{y}" r="2" fill="{col}"><animate attributeName="opacity" values="0;1;0" dur="2.5s" begin="{b}s" repeatCount="indefinite"/><animate attributeName="r" values="2;3.6;2" dur="2.5s" begin="{b}s" repeatCount="indefinite"/></circle>')
    A('<g transform="translate(45 145)" clip-path="url(#mazeClip)">')
    # suelo
    for (r, c) in sorted(S): A(f'<rect x="{f(c*CW)}" y="{f(r*CH)}" width="{f(CW)}" height="{f(CH)}" fill="#0D1724" opacity="0.65"/>')
    for c in range(22, 28): A(f'<rect x="{f(c*CW)}" y="{f(6*CH)}" width="{f(CW)}" height="{f(CH)}" fill="#1A1030" opacity="0.8"/>')
    # contribuciones (solo visuales, nunca se recogen)
    A('<g filter="url(#greenGlow)">')
    rnd = random.Random(99)
    for (r, c), lv in sorted(s['contrib'].items()):
        x, y = (c + .5) * CW - 5.3, (r + .5) * CH - 5.3
        st = ' stroke="#7CFF9B" stroke-opacity="0.3" stroke-width="0.6"' if lv else ' stroke="#30363D" stroke-width="0.6"'
        an = ''
        if lv >= 2 and rnd.random() < .3:
            an = f'<animate attributeName="opacity" values="1;0.72;1" dur="{rnd.uniform(3,6):.1f}s" begin="{rnd.uniform(0,4):.1f}s" repeatCount="indefinite"/>'
        A(f'<rect x="{f(x)}" y="{f(y)}" width="10.6" height="10.6" rx="2" fill="{LV[lv]}"{st}>{an}</rect>' if an else
          f'<rect x="{f(x)}" y="{f(y)}" width="10.6" height="10.6" rx="2" fill="{LV[lv]}"{st}/>')
    A('</g>')
    # paredes: baldosas neón con pulso escalonado (5 fases)
    ph = [[] for _ in range(5)]
    for r in range(R):
        for c in range(C):
            if g[r][c] == '#':
                ph[(c + 2 * r) % 5].append(f'<rect x="{f(c*CW+1)}" y="{f(r*CH+1)}" width="{f(CW-2)}" height="{f(CH-2)}" rx="3"/>')
    A('<g filter="url(#wallFx)" fill="url(#wallGradient)" fill-opacity="0.16" stroke="#00CFFF" stroke-width="1.3">')
    for i, rs in enumerate(ph):
        A('<g>' + "".join(rs) + f'<animate attributeName="opacity" values="0.65;1;0.65" dur="2.5s" begin="{i*.25}s" repeatCount="indefinite"/></g>')
    A('</g>')
    A(f'<rect x="{f(24*CW+2)}" y="{f(5*CH+CH/2-1.2)}" width="{f(2*CW-4)}" height="2.4" rx="1.2" fill="#FF5C8A" filter="url(#neonGlow)"><animate attributeName="opacity" values="1;0.45;1" dur="1.8s" repeatCount="indefinite"/></rect>')
    # actores
    A('<g><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.008;0.992;1" dur="%ds" repeatCount="indefinite"/>' % LOOP)
    A('<g filter="url(#neonGlow)">')
    for p in s['coins']:
        x, y = px(p); te = s['eaten'].get(p)
        if p in s['sp']:
            inner = (f'<circle cx="{f(x)}" cy="{f(y)}" r="3.4" fill="#FFE600" stroke="#00CFFF" stroke-width="1"><animate attributeName="r" values="3;4.5;3" dur="0.7s" repeatCount="indefinite"/></circle>'
                     f'<circle cx="{f(x)}" cy="{f(y)}" r="5.2" fill="none" stroke="#FFE600" stroke-opacity="0.35"><animate attributeName="r" values="4;7;4" dur="1.2s" repeatCount="indefinite"/></circle>')
            A(f'<g>{inner}{eat_anim(te) if te else ""}</g>')
        else:
            A(f'<circle cx="{f(x)}" cy="{f(y)}" r="1.65" fill="#C8F8FF">{eat_anim(te) if te else ""}</circle>')
    A('</g>')
    # explosiones
    for (t, x, y, col) in s['expl']:
        k0, k1 = t / T, (t + 22) / T
        def an(attr, v0, v1, v2=None):
            vals = f"{v0};{v0};{v1};{v1}" if v2 is None else f"{v0};{v0};{v1};{v2}"
            return f'<animate attributeName="{attr}" dur="{LOOP}s" repeatCount="indefinite" values="{vals}" keyTimes="0;{k0:.5f};{k1:.5f};1"/>'
        def an_op(): return f'<animate attributeName="opacity" dur="{LOOP}s" repeatCount="indefinite" values="0;0;1;0;0" keyTimes="0;{k0-0.00002:.5f};{k0:.5f};{k1:.5f};1"/>'
        A(f'<g transform="translate({f(x)} {f(y)})" filter="url(#neonGlow)" opacity="0">{an_op()}'
          f'<circle r="2" fill="{col}">{an("r", 2, 10)}</circle>'
          f'<circle r="3" fill="none" stroke="#FFFFFF" stroke-width="1.4">{an("r", 3, 19)}</circle>'
          f'<circle r="4" fill="none" stroke="{col}" stroke-width="2.4" stroke-dasharray="1.6 4.2">{an("r", 4, 28)}</circle></g>')
    # fantasmas
    for e in s['gh']:
        A(f'<g>{motion(e["kf"], SG)}{op_anim(e["op"])}<g filter="url(#neonGlow)"><g>'
          f'<path d="M-7 5.7L-7 0A7 7 0 0 1 7 0L7 5.7L3.5 3.9L0 6L-3.5 3.9Z" fill="{e["c"]}" stroke="#FFF" stroke-opacity="0.35" stroke-width="0.7"/>'
          '<ellipse cx="-2.3" cy="0" rx="1.5" ry="1.9" fill="#FFF"/><ellipse cx="2.3" cy="0" rx="1.5" ry="1.9" fill="#FFF"/>'
          '<circle cx="-1.9" cy="0" r="0.7" fill="#132238"/><circle cx="2.6" cy="0" r="0.7" fill="#132238"/>'
          f'<animateTransform attributeName="transform" type="translate" additive="sum" values="0 0;0 -1.5;0 0;0 1.5;0 0" dur="2.4s" begin="{(GCOL.index(e["c"]))*.3:.1f}s" repeatCount="indefinite"/></g></g></g>')
    # pac-man
    cur = rot0 = s['rot'][0][1]; pts = [(0, cur)]
    for (t, ang) in s['rot'][1:]:
        dl = ((ang - cur + 180) % 360) - 180
        pts.append((max(t - 1.5, pts[-1][0] + .01), cur)); pts.append((t + 2.5, cur + dl)); cur += dl
    pts.append((T, cur)); rk = mono([p[0] for p in pts]); rv = [p[1] for p in pts]
    rk_s = ";".join(f"{k:.6f}" for k in rk)
    A(f'<g id="pac">{motion(s["pkf"], SP)}<g><animateTransform attributeName="transform" type="rotate" calcMode="linear" dur="{LOOP}s" repeatCount="indefinite" values="{";".join(map(str, rv))}" keyTimes="{rk_s}"/>'
      '<circle r="9" fill="none" stroke="#FFE600" stroke-opacity="0.18"/>'
      '<path fill="#FFE600" filter="url(#strongGlow)" d="M0 0L7.4 -4.8A7.4 7.4 0 1 1 7.4 4.8Z"><animate attributeName="d" dur="0.5s" repeatCount="indefinite" '
      'values="M0 0L7.4 -4.8A7.4 7.4 0 1 1 7.4 4.8Z;M0 0L7.4 0A7.4 7.4 0 1 1 7.4 0Z;M0 0L7.4 -4.8A7.4 7.4 0 1 1 7.4 4.8Z"/></path></g></g>')
    A('</g></g>')
    A('<g font-family="monospace"><text x="36" y="445" fill="#00CFFF" font-size="10" letter-spacing="2">PAC-MAN // CONTRIBUTION ENGINE</text>'
      '<text x="1160" y="445" text-anchor="end" fill="#8299B5" font-size="10">GENERATED AUTOMATICALLY // GITHUB</text>'
      '<path d="M35 455H1165" stroke="#00CFFF" stroke-opacity="0.2"/></g></svg>')
    return "\n".join(out)

B = [(2,4,2,3),(6,9,2,3),(11,12,1,5),(14,18,2,3),(20,22,2,3),
     (2,3,5,10),(5,9,5,6),(5,6,8,10),(8,9,8,10),(14,19,5,7),(11,12,7,10),
     (14,18,9,10),(20,22,9,10)]

def layout():
    g = [['.'] * C for _ in range(R)]
    for c in range(C): g[0][c] = g[R - 1][c] = '#'
    for r in range(R): g[r][0] = g[r][C - 1] = '#'
    for c in range(21, 29): g[5][c] = g[7][c] = '#'
    g[6][21] = g[6][28] = '#'
    for c in range(22, 28): g[6][c] = 'H'
    g[5][24] = g[5][25] = 'D'
    for r in (1, 2, 3, 9, 10): g[r][24] = g[r][25] = '#'
    for (c0, c1, r0, r1) in B: put(g, [(r, c) for r in range(r0, r1 + 1) for c in range(c0, c1 + 1)])
    assert valid(g) and not open2(g)
    return g

if __name__ == "__main__":
    g = layout(); best = None
    for k in range(1, 60):
        for chase in (3, 4, 5, 6):
            s = simulate(g, k, chase)
            nk, ne = len(s['expl']), len(s['eaten']) / len(s['coins'])
            if 8 <= nk <= 16 and ne > .9:
                best = (k, chase, s); break
        if best: break
    k, chase, s = best
    print("seed", k, "chase", chase, file=sys.stderr)
    s["streak"] = streaks(os.environ.get("GH_USER", "Wheatley06"))
    out = sys.argv[1] if len(sys.argv) > 1 else "pacman-contributions.svg"
    svg = make(g, s)
    open(out, "w").write(svg)
    print("streak", s["streak"], "->", out, file=sys.stderr)
    print("bytes", len(svg), "nodes", len(s['S']), "contrib", sum(1 for v in s['contrib'].values() if v), "L0", sum(1 for v in s['contrib'].values() if not v),
          "coins", len(s['coins']), "specials", len(s['sp']), "kills", len(s['expl']), "eaten", len(s['eaten']), file=sys.stderr)
    from collections import Counter; print("levels", Counter(s['contrib'].values()), file=sys.stderr)
