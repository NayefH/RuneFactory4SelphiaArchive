"""Repair known malformed Wiki headings using cached public API responses."""

import hashlib
import json
from pathlib import Path
from wiki_parser import parse_detail

ROOT = Path(__file__).resolve().parent.parent
path = ROOT / "data-sources/wiki-details.json"
dataset = json.loads(path.read_text(encoding="utf8"))
unresolved = []
repaired = 0
for seed in dataset["unresolved"]:
    cache = (
        ROOT
        / ".wiki-cache"
        / (hashlib.sha256(seed["wikiTitle"].encode()).hexdigest()[:20] + ".json")
    )
    if not cache.exists():
        unresolved.append(seed)
        continue
    article = json.loads(cache.read_text(encoding="utf8"))
    detail = parse_detail(seed, article)
    if detail:
        dataset["details"].append(detail)
        repaired += 1
    else:
        unresolved.append(seed)
dataset["unresolved"] = unresolved
path.write_text(json.dumps(dataset, ensure_ascii=False), encoding="utf8")
print("REPAIRED", repaired, "UNRESOLVED", len(unresolved))
