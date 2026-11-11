# 2026-11-11 one-time import of guides from xinchao-golf-booking/-planner/-price into src/content/guides.json
# usage: python scripts/import-golf-guides.py src/content/guides.json (expects sibling repos)
import re, json, os, html as H, sys
base = r"C:\Users\j\Documents\업무 비서\work\homepage-revamp"
cats = {"booking": "예약 준비", "planner": "일정 짜기", "price": "비용 확인"}
ALLOW = {"vinpearl-golf-fit-deposit-payment-confirmation"}
PRICE = re.compile(r"\d{1,3}(?:,\d{3})+|\d+\s*(?:VND|동|원|달러|USD)\b|\d+만\s*원")
out, skipped = [], []
for site in cats:
    root = os.path.join(base, f"xinchao-golf-{site}")
    sm = open(os.path.join(root, "sitemap.xml"), encoding="utf-8").read()
    lastmod = {}
    for u in re.finditer(r"<url>([\s\S]*?)</url>", sm):
        loc = re.search(r"<loc>\s*([^<]+?)\s*</loc>", u.group(1)).group(1)
        lm = re.search(r"<lastmod>\s*([^<]+?)\s*</lastmod>", u.group(1))
        lastmod[re.sub(r"^https?://[^/]+", "", loc)] = lm.group(1)[:10] if lm else None
    gdir = os.path.join(root, "guide")
    for slug in sorted(os.listdir(gdir)):
        f = os.path.join(gdir, slug, "index.html")
        if not os.path.isfile(f): continue
        h = open(f, encoding="utf-8").read()
        robots = re.search(r'<meta\s+name="robots"\s+content="([^"]+)"', h)
        if robots and "noindex" in robots.group(1):
            skipped.append((site, slug, "noindex")); continue
        art = re.search(r"<article\b[^>]*>([\s\S]*?)</article>", h)
        if not art: skipped.append((site, slug, "no article")); continue
        body = art.group(1)
        text = re.sub(r"<[^>]+>", " ", body)
        if PRICE.search(text) and slug not in ALLOW:
            skipped.append((site, slug, "price:" + PRICE.search(text).group(0))); continue
        h1 = H.unescape(re.sub(r"<[^>]+>", "", re.search(r"<h1\b[^>]*>([\s\S]*?)</h1>", h).group(1))).strip()
        desc = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', h)
        desc = H.unescape(desc.group(1)) if desc else h1
        sub = re.search(r'<p class="detail-sub">([\s\S]*?)</p>', h)
        sub = H.unescape(re.sub(r"<[^>]+>", "", sub.group(1))).strip() if sub else desc
        # clean body
        body = re.sub(r'<div class="hero-actions">[\s\S]*?</div>\s*$', "", body.strip())
        body = re.sub(r'<span class="eyebrow">[^<]*</span>', "", body)
        body = re.sub(r'<figure[^>]*>\s*<img[^>]*hero-golf\.webp[^>]*>[\s\S]*?</figure>\s*', "", body)
        body = re.sub(r'<img[^>]*hero-golf\.webp[^>]*>\s*', "", body)
        out.append(dict(site=site, slug=slug, category=cats[site], title=h1, description=desc, sub=sub,
                        date=lastmod.get(f"/guide/{slug}/") or "2026-10-01", body=body))
slugs = {g["slug"] for g in out}
def fix_links(body):
    def rep(m):
        href = H.unescape(m.group(1))
        href = re.sub(r"^https://xinchao-golf(?:-booking|-planner|-price)?\.vercel\.app", "", href)
        g = re.match(r"^/guide/([^/#?]+)/?", href)
        if g: return 'href="%s"' % (f"/guide/{g.group(1)}.html" if g.group(1) in slugs else "/guide")
        if re.match(r"^/(golf|region)/", href): return 'href="/regions"'
        if href in ("/", "") or href.startswith("/#") or href.startswith("/guide"): return 'href="/guide"'
        if href.startswith("/sitemap"): return 'href="/guide"'
        return 'href="%s"' % H.escape(href, quote=True)
    body = re.sub(r'href="([^"]*)"', rep, body)
    body = re.sub(r'<a\b(?![^>]*target=)([^>]*href="https://[^"]*")([^>]*)>', r'<a\1\2 target="_blank" rel="noopener noreferrer">', body)
    return body
titles = {}
for g in out:
    g["body"] = fix_links(g["body"])
    if g["title"] in titles: g["title"] = f'{g["title"]} ({g["category"]})'
    titles[g["title"]] = 1
json.dump(out, open(sys.argv[1], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ported", len(out), "skipped", len(skipped))
for s in skipped: print("SKIP", *s)
