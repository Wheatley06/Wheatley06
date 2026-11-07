"""Genera test-chambers.svg con tus 6 repos mas recientes (solo libreria estandar).
Uso: python generate_chambers.py [salida.svg]   (env: GH_USER, GITHUB_TOKEN, DEMO=1 para datos de ejemplo)"""
import os, sys, json, datetime, urllib.request, urllib.error
from xml.sax.saxutils import escape as esc

USER = os.environ.get("GH_USER", "Wheatley06"); N = 6
NOW = datetime.datetime.now(datetime.timezone.utc)

def api(path):
    h = {"User-Agent": "chambers", "Accept": "application/vnd.github+json"}
    if os.environ.get("GITHUB_TOKEN"): h["Authorization"] = "Bearer " + os.environ["GITHUB_TOKEN"]
    return json.load(urllib.request.urlopen(urllib.request.Request("https://api.github.com" + path, headers=h), timeout=30))

def fetch():
    repos = [r for r in api(f"/users/{USER}/repos?per_page=100&sort=pushed") if r["name"].lower() != USER.lower()]
    repos.sort(key=lambda r: max(r["pushed_at"], r["created_at"]), reverse=True)
    out = []
    for r in repos[:30]:
        own = None
        try:
            c = api(f"/repos/{USER}/{r['name']}/commits?author={USER}&per_page=1")
            if c: own = c[0]["commit"]["committer"]["date"]
        except urllib.error.HTTPError: pass
        d = r["description"] or ""
        if own: out.append((r["name"], d, own, "LAST COMMIT"))
        elif r["fork"]: out.append((r["name"], d, r["created_at"], "FORKED"))   # fork sin commits propios
        else: out.append((r["name"], d, r["pushed_at"], "LAST PUSH"))
    out.sort(key=lambda t: t[2], reverse=True)
    return out[:N]

def demo():
    ago = lambda n: (NOW - datetime.timedelta(days=n)).strftime("%Y-%m-%dT%H:%M:%SZ")
    return [("Minatech", "Featured project", ago(1), "LAST COMMIT"), ("nodered-owasys4-demo-full-mail", "Demo con varias apps para el dispositivo Owasys", ago(6), "LAST COMMIT"),
            ("30-days-of-solidity-submissions", "", ago(25), "LAST COMMIT"), ("financial-services", "", ago(48), "FORKED"),
            ("ai-engineering-from-scratch", "", ago(95), "LAST COMMIT"), ("old-experiment", "Prueba antigua", ago(210), "LAST COMMIT")]

def health(iso):
    days = (NOW - datetime.datetime.fromisoformat(iso.replace("Z", "+00:00"))).days
    return days, 100 if days <= 30 else max(50, 100 - (days - 30) // 7)

def ago_txt(d): return "TODAY" if d < 1 else f"{d}D AGO" if d < 60 else f"{d // 30}MO AGO"
def cut(t, n): return t if len(t) <= n else t[:n - 1] + "…"

# nucleos de personalidad (version estilizada propia): ojo, tinte de carcasa, extra
def core(k, eye, shell, dur):
    ex = {
        0: '',  # Fact
        1: f'<g><animateTransform attributeName="transform" type="rotate" values="0;360" dur="5s" repeatCount="indefinite"/>'
           '<circle cx="0" cy="-12" r="1" fill="#E5E7EB"/><circle cx="10" cy="6" r=".8" fill="#E5E7EB"/><circle cx="-9" cy="7" r=".9" fill="#E5E7EB"/></g>',  # Space
        2: '<path d="M-4.6 -3.2A5.6 5.6 0 0 1 0 -5.8" fill="none" stroke="#FFF" stroke-opacity=".7" stroke-width="1" stroke-linecap="round"/>',  # Adventure
        3: f'<circle r="12.5" fill="none" stroke="{eye}" stroke-opacity=".6" stroke-dasharray="2 3"><animateTransform attributeName="transform" type="rotate" values="0;-360" dur="6s" repeatCount="indefinite"/></circle>',  # Curiosity
        4: f'<circle r="12.5" fill="none" stroke="{eye}" stroke-opacity=".7" stroke-width=".8"><animate attributeName="r" values="11.5;13.5;11.5" dur="2s" repeatCount="indefinite"/></circle>',  # Morality
        5: '<polygon points="12.8,0.0 10.0,3.6 9.8,8.2 5.3,9.2 2.2,12.6 -1.8,10.4 -6.4,11.1 -8.1,6.8 -12.0,4.4 -10.6,0.0 -12.0,-4.4 -8.1,-6.8 -6.4,-11.1 -1.8,-10.4 2.2,-12.6 5.3,-9.2 9.8,-8.2 10.0,-3.6" fill="none" stroke="#F87171" stroke-width=".9" stroke-linejoin="round"><animateTransform attributeName="transform" type="rotate" values="0;360" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;.35;.9" dur=".5s" repeatCount="indefinite"/></polygon>'
           '<path d="M-6.5 -6.8L-3.6 -3.4L-5.6 -1.2M6.8 5.6L3.7 3.2L5.4 1" fill="none" stroke="#7F1D1D" stroke-width="1" stroke-linecap="round"/>',  # Anger
    }[k]
    sh = ('<animateTransform attributeName="transform" type="translate" values="-.7 0;.7 .4;-.5 -.3;.6 0;-.7 0" dur=".18s" repeatCount="indefinite"/>' if k == 5 else '')
    return (f'<g transform="scale(1.2)"><g>{sh}<rect x="-12.5" y="-2.6" width="25" height="5.2" rx="2" fill="#475569"/>'
            f'<circle r="9.5" fill="{shell}" stroke="#94A3B8" stroke-width=".8"/>'
            f'<circle r="6.2" fill="#0B1220" stroke="{eye}" stroke-opacity=".6" stroke-width=".8"/>'
            f'<g><animateTransform attributeName="transform" type="translate" values="-1.3 0;1.3 .4;-1.3 0" dur="{dur}s" repeatCount="indefinite"/>'
            f'<circle r="3.7" fill="{eye}" filter="url(#g)"><animate attributeName="r" values="3.7;3.7;.7;3.7" keyTimes="0;.9;.95;1" dur="{dur+1.3:.1f}s" repeatCount="indefinite"/></circle>'
            f'<circle r="1.3" fill="#0B1220"/></g>{ex}</g></g>')

CORES = [("#FB923C", "#CBD5E1", 2.4), ("#60A5FA", "#E2E8F0", 2.0), ("#FACC15", "#D1D5DB", 2.8),
         ("#A78BFA", "#DDD6FE", 2.2), ("#22D3EE", "#CFFAFE", 3.0), ("#F87171", "#FECACA", 1.6)]

def make(repos):
    W, H = 1200, 490
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="Test chambers: most recently updated repositories">',
         '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#020617"/><stop offset="1" stop-color="#11152F"/></linearGradient>'
         '<linearGradient id="bd" x1="0" x2="1"><stop offset="0" stop-color="#7C3AED"/><stop offset=".48" stop-color="#22D3EE"/><stop offset="1" stop-color="#10B981"/></linearGradient>'
         '<linearGradient id="sc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22D3EE" stop-opacity="0"/><stop offset=".5" stop-color="#22D3EE" stop-opacity=".3"/><stop offset="1" stop-color="#7C3AED" stop-opacity="0"/></linearGradient>'
         '<filter id="g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>']
    for i in range(len(repos)):
        o.append(f'<clipPath id="t{i}"><rect x="18" y="40" width="0" height="24"><animate attributeName="width" from="0" to="322" dur="1.1s" begin="{.3 + i * .2:.1f}s" fill="freeze"/></rect></clipPath>')
    o.append('</defs><rect width="1200" height="490" fill="url(#bg)"/><rect x="8" y="8" width="1184" height="474" rx="14" fill="#0A1226" fill-opacity=".55" stroke="url(#bd)" stroke-opacity=".9" stroke-width="1.6"/><g font-family="monospace">')
    o.append('<text x="30" y="32" fill="#22D3EE" font-size="12" letter-spacing="4">TEST CHAMBERS // ACTIVE PROJECTS</text>'
             '<circle cx="1018" cy="28" r="3.2" fill="#10B981" filter="url(#g)"><animate attributeName="opacity" values="1;.25;1" dur="1.6s" repeatCount="indefinite"/></circle>'
             f'<text x="1170" y="32" text-anchor="end" fill="#64748B" font-size="10" letter-spacing="2">{len(repos)} CHAMBERS ONLINE</text>')
    for i, (name, desc, pushed, lab) in enumerate(repos):
        x, y = 30 + (i % 3) * 385, 52 + (i // 3) * 200
        days, hp = health(pushed); act = hp >= 90
        sc, bc = ("#10B981", "#22D3EE") if act else ("#F87171", "#F59E0B")
        eye, shell, dur = CORES[i % 6]; d = i * .55; w = round(231 * hp / 100)
        o.append(
            f'<g transform="translate({x} {y})"><rect width="355" height="185" rx="10" fill="#07111F" stroke="url(#bd)" stroke-opacity=".8"/>'
            f'<text x="18" y="26" fill="#64748B" font-size="10" letter-spacing="3">TEST CHAMBER {i + 1:02d}</text>'
            f'<text x="337" y="26" text-anchor="end" fill="{sc}" font-size="10" letter-spacing="2">● {"ACTIVE" if act else "INACTIVE"}'
            f'<animate attributeName="opacity" values="1;.45;1" dur="2s" begin="{d}s" repeatCount="indefinite"/></text>'
            f'<text x="18" y="58" fill="#E5E7EB" font-size="18" font-weight="bold" clip-path="url(#t{i})">{esc(cut(name, 28))}</text>'
            f'<text x="18" y="79" fill="{"#22D3EE" if desc else "#64748B"}" font-size="10.5">{esc(cut(desc, 46)) if desc else "no description"}</text>'
            '<ellipse cx="40" cy="116" rx="7" ry="15" fill="none" stroke="#38BDF8" stroke-width="2.5" filter="url(#g)"><animate attributeName="ry" values="15;12;15" dur="1.6s" repeatCount="indefinite"/></ellipse>'
            '<ellipse cx="315" cy="116" rx="7" ry="15" fill="none" stroke="#FB923C" stroke-width="2.5" filter="url(#g)"><animate attributeName="ry" values="12;15;12" dur="1.6s" repeatCount="indefinite"/></ellipse>'
            '<path d="M54 116H301" stroke="#64748B" stroke-opacity=".5" stroke-dasharray="3 5"/>'
            f'<g><animateMotion path="M56 116H299" dur="3.6s" begin="{d}s" repeatCount="indefinite"/>'
            f'<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.08;.92;1" dur="3.6s" begin="{d}s" repeatCount="indefinite"/>'
            f'<g><animateTransform attributeName="transform" type="rotate" values="-8;8;-8" dur="1.1s" repeatCount="indefinite"/>{core(i % 6, eye, shell, dur)}</g></g>'
            '<text x="18" y="157" fill="#64748B" font-size="9" letter-spacing="2">REPO HEALTH</text>'
            f'<rect x="104" y="149" width="231" height="7" rx="3.5" fill="#11152F"/>'
            f'<rect x="104" y="149" width="0" height="7" rx="3.5" fill="{bc}" filter="url(#g)"><animate attributeName="width" values="0;{w}" dur="1.6s" begin="{d}s" fill="freeze"/></rect>'
            f'<text x="18" y="175" fill="#64748B" font-size="9" letter-spacing="1">{lab} // {ago_txt(days)}</text>'
            f'<text x="337" y="175" text-anchor="end" fill="#E5E7EB" font-size="9">{hp}%</text></g>')
    o.append('<text x="30" y="472" fill="#38BDF8" font-size="10">signal.locked &gt; TEST CHAMBERS'
             '<tspan fill="#22D3EE"> ▌<animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/></tspan></text>'
             '<text x="1170" y="472" text-anchor="end" fill="#64748B" font-size="10">UPDATED DAILY // GITHUB ACTIONS</text></g>'
             '<rect x="10" y="0" width="1180" height="40" fill="url(#sc)" opacity=".5"><animate attributeName="y" values="0;450;0" dur="9s" repeatCount="indefinite"/></rect></svg>')
    return "\n".join(o)

if __name__ == "__main__":
    try: repos = fetch(); src = "live"
    except Exception as e:
        if not os.environ.get("DEMO"): raise
        repos = demo(); src = f"demo ({e.__class__.__name__})"
    out = sys.argv[1] if len(sys.argv) > 1 else "test-chambers.svg"
    open(out, "w").write(make(repos)); print(src, "->", out, [(r[0], health(r[2])) for r in repos])
