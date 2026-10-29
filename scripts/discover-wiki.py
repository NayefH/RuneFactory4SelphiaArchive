import json, sys, urllib.request, urllib.parse, time, concurrent.futures
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parent.parent
cache = ROOT / ".wiki-cache"
cats = {
    "Items_(RF4)",
    "Monsters_(RF4)",
    "Equipment_(RF4)",
    "Collectible_(RF4)",
    "Consumable_(RF4)",
}
for p in cache.glob("*.json"):
    try:
        obj = json.loads(p.read_text(encoding="utf8"))
        for c in obj.get("parse", {}).get("categories", []):
            if c["*"].endswith("(RF4)"):
                cats.add(c["*"])
    except:
        pass
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
result = {}
visited = set()


def get(cat):
    out = []
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": "Category:" + cat,
        "cmlimit": "500",
        "format": "json",
    }
    for i in range(10):
        try:
            req = urllib.request.Request(
                "https://therunefactory.fandom.com/api.php?"
                + urllib.parse.urlencode(params),
                headers={"User-Agent": "SelphiaArchive/1.0"},
            )
            with opener.open(req, timeout=40) as r:
                d = json.load(r)
            out += d.get("query", {}).get("categorymembers", [])
            if "continue" not in d:
                break
            params.update(d["continue"])
        except Exception as e:
            print("CATEGORY ERROR", cat, str(e), flush=True)
            break
    return cat, out


while cats - visited:
    batch = sorted(cats - visited)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for cat, members in pool.map(get, batch):
            visited.add(cat)
            for m in members:
                if m["ns"] == 14 and m["title"].endswith("(RF4)"):
                    cats.add(m["title"].removeprefix("Category:").replace(" ", "_"))
                if m["ns"] == 0:
                    typ = "monster" if cat == "Monsters_(RF4)" else "item"
                    result[(typ, m["title"])] = {
                        "wikiTitle": m["title"],
                        "listName": m["title"],
                        "type": typ,
                        "category": cat.replace("_", " "),
                    }
    print("CATEGORY PROGRESS", len(visited), "PAGES", len(result), flush=True)
(cache / "category-manifest.json").write_text(
    json.dumps(list(result.values()), ensure_ascii=False), encoding="utf8"
)
(ROOT / "data-sources/category-audit.json").write_text(
    json.dumps(
        {"categories": sorted(visited), "entries": len(result)},
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf8",
)
