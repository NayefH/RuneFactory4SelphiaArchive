import json, time, sys, hashlib, re, urllib.request, urllib.parse, concurrent.futures
from pathlib import Path
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".wiki-cache"
CACHE.mkdir(exist_ok=True)
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))
API = "https://therunefactory.fandom.com/api.php?"


def fetch_page(title):
    key = hashlib.sha256(title.encode()).hexdigest()[:20]
    path = CACHE / (key + ".json")
    if path.exists():
        return json.loads(path.read_text(encoding="utf8"))
    params = {
        "action": "parse",
        "page": title,
        "prop": "text|links|categories|revid",
        "format": "json",
        "redirects": "1",
    }
    for attempt in range(3):
        try:
            req = urllib.request.Request(
                API + urllib.parse.urlencode(params),
                headers={
                    "User-Agent": "SelphiaArchive/1.0 (RF4 fan reference; public wiki API)"
                },
            )
            with OPENER.open(req, timeout=45) as res:
                obj = json.load(res)
            if "error" in obj:
                return {"requested": title, "error": obj["error"].get("code")}
            obj["requested"] = title
            path.write_text(json.dumps(obj, ensure_ascii=False), encoding="utf8")
            time.sleep(0.15)
            return obj
        except Exception as e:
            if attempt == 2:
                return {"requested": title, "error": str(e)}
            time.sleep(2 + attempt * 3)


def soup(obj):
    return BeautifulSoup(
        obj.get("parse", {}).get("text", {}).get("*", ""), "html.parser"
    )


def content4(s):
    h = s.find(id="Rune_Factory_4")
    if not h:
        return None
    h = h.find_parent(re.compile("^h[1-6]$"))
    if not h:
        return None
    level = int(h.name[1])
    out = BeautifulSoup("<section></section>", "html.parser").section
    for e in list(h.next_siblings):
        if (
            getattr(e, "name", "")
            and re.match("^h[1-6]$", e.name)
            and int(e.name[1]) <= level
        ):
            break
        out.append(BeautifulSoup(str(e), "html.parser"))
    for e in out.select(".mw-editsection,.reference,.mw-collapsible-toggle"):
        e.decompose()
    return out


def txt(e):
    return re.sub(r"\s+", " ", e.get_text(" ", strip=True)).strip()


def main():
    mains = [
        "Shipping List (RF4)",
        "Monsters (RF4)",
        "Crafting (RF4)",
        "Forging (RF4)",
        "Cooking (RF4)",
        "Pharmacy (RF4)",
        "Other Items (RF4)",
        "Equipment (RF4)",
        "Crops (RF4)",
        "Consumables (RF4)",
    ]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        mainobjs = list(pool.map(fetch_page, mains))
    seeds = {}
    tables = {}
    for title, obj in zip(mains, mainobjs):
        if "error" in obj:
            print("ERROR MAIN", title, obj["error"], flush=True)
            continue
        s = soup(obj)
        tables[title] = []
        for table in s.select("table.wikitable"):
            rows = []
            for tr in table.find_all("tr"):
                if tr.find_parent("table") != table:
                    continue
                cells = tr.find_all(["td", "th"], recursive=False)
                if len(cells) < 2:
                    continue
                row = []
                for cell in cells:
                    links = [
                        {"name": txt(a), "title": a.get("title"), "href": a.get("href")}
                        for a in cell.find_all("a")
                        if a.get("href", "").startswith("/wiki/")
                        and not a.get("href", "").startswith("/wiki/File:")
                    ]
                    row.append(
                        {
                            "text": txt(cell),
                            "links": links,
                            "header": cell.name == "th",
                            "colspan": cell.get("colspan"),
                            "rowspan": cell.get("rowspan"),
                        }
                    )
                rows.append(row)
            tables[title].append(rows)
        # Seed only lists of actual items/monsters; avoid navigation templates.
        if title not in ["Shipping List (RF4)", "Monsters (RF4)"]:
            continue
        for table in s.select("table.wikitable"):
            name_index = None
            for tr in table.find_all("tr"):
                cells = tr.find_all(["td", "th"], recursive=False)
                values = [txt(c) for c in cells]
                if "Name" in values and (
                    "Sell" in values or "Location(s)" in values or "Buy" in values
                ):
                    name_index = values.index("Name")
                    continue
                if (
                    name_index is None
                    or len(cells) <= name_index
                    or cells[name_index].name == "th"
                ):
                    continue
                cell = cells[name_index]
                links = [
                    a
                    for a in cell.find_all("a")
                    if a.get("href", "").startswith("/wiki/")
                    and not a.get("href", "").startswith("/wiki/File:")
                    and "image" not in a.get("class", [])
                ]
                name = txt(cell)
                if (
                    not name
                    or len(name) > 60
                    or name in ["Image", "Name", "Item", "Type"]
                ):
                    continue
                wiki = (
                    links[-1].get("title") or links[-1].get_text(strip=True)
                    if links
                    else name
                )
                if not wiki or wiki.startswith(("Category:", "File:")):
                    continue
                seeds[(title.startswith("Monsters"), wiki)] = {
                    "wikiTitle": wiki,
                    "listName": name,
                    "type": "monster" if title.startswith("Monsters") else "item",
                }
    (ROOT / "data-sources/wiki-tables.json").write_text(
        json.dumps(tables, ensure_ascii=False), encoding="utf8"
    )
    # Ingredients with individual pages may be absent from shipping list (quest items etc.).
    for title in ["Crafting (RF4)", "Forging (RF4)", "Cooking (RF4)", "Pharmacy (RF4)"]:
        for table in tables.get(title, []):
            for row in table:
                for cell in row:
                    for link in cell["links"]:
                        wiki = link["title"] or link["name"]
                        if (
                            wiki
                            and not wiki.endswith("(RF4)")
                            and not wiki.startswith(("Category:", "File:"))
                            and wiki not in ["Bado", "Porcoline", "Jones", "Nancy"]
                        ):
                            seeds.setdefault(
                                (False, wiki),
                                {
                                    "wikiTitle": wiki,
                                    "listName": link["name"],
                                    "type": "item",
                                },
                            )
    category_manifest = CACHE / "category-manifest.json"
    if category_manifest.exists():
        for seed in json.loads(category_manifest.read_text(encoding="utf8")):
            seeds.setdefault((seed["type"] == "monster", seed["wikiTitle"]), seed)
    manifest = list(seeds.values())
    (CACHE / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False), encoding="utf8"
    )
    print(
        "MANIFEST",
        len(manifest),
        "items",
        sum(x["type"] == "item" for x in manifest),
        "monsters",
        sum(x["type"] == "monster" for x in manifest),
        flush=True,
    )
    details = []
    errors = []

    def work(seed):
        obj = fetch_page(seed["wikiTitle"])
        return seed, obj

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(work, seed) for seed in manifest]
        for i, f in enumerate(concurrent.futures.as_completed(futures)):
            seed, obj = f.result()
            if "error" in obj:
                errors.append({**seed, "error": obj["error"]})
            else:
                section = content4(soup(obj))
                if section is None:
                    errors.append(
                        {
                            **seed,
                            "error": "no_rf4_section",
                            "resolved": obj["parse"]["title"],
                        }
                    )
                else:
                    rows = []
                    for tr in section.find_all("tr"):
                        cells = tr.find_all(["th", "td"], recursive=False)
                        # Ignore wrapper cells that contain entire nested stat tables.
                        if len(cells) == 1 and cells[0].find("table"):
                            continue
                        if any(c.find("table") for c in cells):
                            continue
                        vals = [txt(c) for c in cells]
                        if any(vals):
                            rows.append(
                                {
                                    "values": vals,
                                    "headers": [c.name == "th" for c in cells],
                                    "links": [
                                        [
                                            {
                                                "name": txt(a),
                                                "title": a.get("title"),
                                                "href": a.get("href"),
                                            }
                                            for a in c.find_all("a")
                                            if a.get("href", "").startswith("/wiki/")
                                            and "image" not in a.get("class", [])
                                        ]
                                        for c in cells
                                    ],
                                }
                            )
                    image = section.find("img")
                    imageurl = (
                        (image.get("data-src") or image.get("src")) if image else None
                    )
                    details.append(
                        {
                            **seed,
                            "resolved": obj["parse"]["title"],
                            "revision": obj["parse"].get("revid"),
                            "rows": rows,
                            "image": imageurl,
                        }
                    )
            if (i + 1) % 40 == 0:
                print(
                    "PROGRESS",
                    i + 1,
                    "/",
                    len(manifest),
                    "RF4",
                    len(details),
                    "unresolved",
                    len(errors),
                    flush=True,
                )
    result = {
        "details": details,
        "unresolved": errors,
        "fetchedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "manifestCount": len(manifest),
    }
    (ROOT / "data-sources/wiki-details.json").write_text(
        json.dumps(result, ensure_ascii=False), encoding="utf8"
    )
    print("DONE", len(details), "UNRESOLVED", len(errors), flush=True)


if __name__ == "__main__":
    main()
