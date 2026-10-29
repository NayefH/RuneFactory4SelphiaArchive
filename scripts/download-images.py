import json, sys, hashlib, urllib.request, concurrent.futures, time
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / "public/data.json").read_text(encoding="utf8"))
dest = ROOT / "public/images"
dest.mkdir(exist_ok=True)
indexfile = ROOT / "data-sources/image-index.json"
index = json.loads(indexfile.read_text(encoding="utf8")) if indexfile.exists() else {}
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def download(src):
    if (
        src in index
        and index[src].get("local")
        and (ROOT / "public" / index[src]["local"].lstrip("/")).exists()
    ):
        return src, index[src]
    if "static.wikia.nocookie.net" in src:
        return src, {
            "error": "Fandom image server returned HTTP 403; original source retained"
        }
    for attempt in range(3):
        try:
            req = urllib.request.Request(
                src,
                headers={
                    "User-Agent": "SelphiaArchive/1.0 (RF4 fan reference)",
                    "Referer": "https://therunefactory.fandom.com/",
                },
            )
            with opener.open(req, timeout=30) as r:
                body = r.read()
                ctype = r.headers.get("Content-Type", "").split(";")[0]
            if not ctype.startswith("image/") or body[:20].lower().find(b"<html") >= 0:
                raise ValueError("Not an image: " + ctype)
            ext = {
                "image/png": ".png",
                "image/gif": ".gif",
                "image/jpeg": ".jpg",
                "image/webp": ".webp",
                "image/svg+xml": ".svg",
            }.get(ctype, ".png")
            name = hashlib.sha256(src.encode()).hexdigest()[:20] + ext
            (dest / name).write_bytes(body)
            return src, {"local": "/images/" + name, "size": len(body), "type": ctype}
        except Exception as e:
            if attempt == 2:
                return src, {"error": str(e)}
            time.sleep(1 + attempt)


sources = sorted(set(r["imageSource"] for r in data["records"] if r.get("imageSource")))
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
    for i, (src, result) in enumerate(pool.map(download, sources)):
        index[src] = result
        if (i + 1) % 50 == 0:
            indexfile.write_text(json.dumps(index, ensure_ascii=False), encoding="utf8")
            print("IMAGE PROGRESS", i + 1, "/", len(sources), flush=True)
indexfile.write_text(json.dumps(index, ensure_ascii=False), encoding="utf8")
for r in data["records"]:
    result = index.get(r.get("imageSource"), {})
    if result.get("local"):
        r["image"] = result["local"]
data["audit"]["imagesDownloaded"] = sum(bool(r.get("image")) for r in data["records"])
data["audit"]["missingImages"] = [
    {
        "name": r["name"],
        "type": r["type"],
        "reason": (
            "no_rf4_image_in_sources"
            if not r.get("imageSource")
            else index.get(r["imageSource"], {}).get("error", "pending")
        ),
    }
    for r in data["records"]
    if not r.get("image") and not r.get("isMaterialGroup")
]
(ROOT / "public/data.json").write_text(
    json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf8"
)
(ROOT / "public/completeness.json").write_text(
    json.dumps(data["audit"], ensure_ascii=False, indent=2), encoding="utf8"
)
print(
    "IMAGES DONE",
    data["audit"]["imagesDownloaded"],
    "MISSING",
    len(data["audit"]["missingImages"]),
    flush=True,
)
