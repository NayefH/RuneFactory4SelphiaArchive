import json, re, hashlib, sys
from bs4 import BeautifulSoup
from pathlib import Path
from urllib.parse import quote
from collections import Counter
from recipe_acquisition import enrich_recipe_acquisitions

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parent.parent
base = json.loads((ROOT / "data-sources/catalog-seed.json").read_text(encoding="utf8"))
tables = json.loads((ROOT / "data-sources/wiki-tables.json").read_text(encoding="utf8"))
detailfile = ROOT / "data-sources/wiki-details.json"
details = (
    json.loads(detailfile.read_text(encoding="utf8"))
    if detailfile.exists()
    else {"details": [], "unresolved": []}
)
url = lambda n: "https://therunefactory.fandom.com/wiki/" + quote(n.replace(" ", "_"))
uid = lambda prefix, n: prefix + hashlib.sha256(n.encode()).hexdigest()[:14]


def money(s):
    s = re.sub(r"[G,\s]", "", s)
    return int(s) if s.isdigit() else None


def celltext(row):
    return [c["text"].strip() for c in row]


old = {r["name"].casefold(): r for r in base["records"]}
records = {}
recipes = []
aliases = {}
audit = {
    "shippingRows": 0,
    "recipeRows": 0,
    "detailPages": len(details["details"]),
    "unresolvedPages": details["unresolved"],
    "conflicts": [],
}


def item(name, **props):
    name = name.strip()
    if not name or re.fullmatch(r"[-ー—–]+|N/A|WIP", name):
        return None
    key = name.casefold()
    if key not in records:
        prior = old.get(key, {})
        records[key] = {
            "name": name,
            "type": "item",
            "category": prior.get("category", "Material / Zutat"),
            "source": url(name),
            "attributes": {},
            "attributeText": {},
        }
        for k in [
            "de",
            "translationStatus",
            "translationSource",
            "difficulty",
            "rarity",
            "location",
        ]:
            if k in prior:
                records[key][k] = prior[k]
    records[key].update(props)
    return records[key]


for table in tables["Shipping List (RF4)"]:
    header = None
    for row in table:
        vals = celltext(row)
        if "Name" in vals and "Sell" in vals and "Buy" in vals:
            header = {n: vals.index(n) for n in ["Name", "Sell", "Buy"]}
            continue
        if not header or len(vals) <= max(header.values()):
            continue
        n = vals[header["Name"]]
        if not n or n == "Name":
            continue
        r = item(
            n,
            buy=money(vals[header["Buy"]]),
            sell=money(vals[header["Sell"]]),
            priceSource=url("Shipping List (RF4)"),
        )
        if r:
            links = row[header["Name"]]["links"]
            r["wikiTitle"] = (
                (links[-1].get("title") or links[-1]["name"]) if links else n
            )
            audit["shippingRows"] += 1
craftCats = {
    1: "Accessoires",
    2: "Schilde",
    3: "Kopfbedeckungen",
    4: "Schuhe",
    5: "Rüstungen",
}
forgeCats = {
    1: "Kurzschwerter",
    2: "Langschwerter",
    3: "Speere",
    4: "Äxte",
    5: "Hämmer",
    6: "Doppelklingen",
    7: "Handschuhe",
    8: "Stäbe",
    9: "Hacken",
    10: "Gießkannen",
    11: "Sicheln",
    12: "Äxte (Werkzeug)",
    13: "Hämmer (Werkzeug)",
    14: "Angeln",
}
cookStations = {
    1: "Ohne Gerät",
    2: "Messer",
    3: "Bratpfanne",
    4: "Topf",
    5: "Ofen",
    6: "Dampfgarer",
    7: "Mixer",
}


def slots(cells):
    out = []
    for cell in cells:
        t = cell["text"].strip()
        if not t or re.fullmatch(r"[-ー—–]+|N/A", t):
            continue
        ns = list(
            dict.fromkeys(
                l["name"].strip() for l in cell.get("links", []) if l["name"].strip()
            )
        )
        if not ns:
            ns = [t]
        expanded = []
        for n in ns:
            if re.fullmatch(r"\([SML]\)", n) and expanded:
                expanded.append(re.sub(r"\([SML]\)$", n, expanded[0]))
            else:
                expanded.append(n)
        out.append({"options": expanded, "label": " / ".join(expanded)})
    return out


def addrecipe(name, level, ingredients, station, category, source, **extra):
    if not name or not str(level).isdigit() or not ingredients:
        return
    r = {
        "name": name,
        "level": int(level),
        "ingredients": [s["label"] for s in ingredients],
        "ingredientSlots": ingredients,
        "station": station,
        "category": category,
        "source": source,
        **extra,
    }
    recipes.append(r)
    item(name, category=category)


for title in ["Crafting (RF4)", "Forging (RF4)", "Cooking (RF4)", "Pharmacy (RF4)"]:
    for ti, table in enumerate(tables[title]):
        if not table:
            continue
        h = celltext(table[0])
        levelKey = next((x for x in ["Level", "Levels"] if x in h), None)
        if not levelKey or not ("Ingredients" in h or "Required Materials" in h):
            continue
        ni = h.index("Item") if "Item" in h else h.index("Recipe")
        li = h.index(levelKey)
        ii = h.index("Ingredients" if "Ingredients" in h else "Required Materials")
        if title.startswith("Crafting"):
            station = "Fertigungstisch"
            category = craftCats.get(ti, "Ausrüstung")
        elif title.startswith("Forging"):
            station = "Schmiede"
            category = forgeCats.get(ti, "Ausrüstung")
        elif title.startswith("Cooking"):
            station = cookStations.get(ti, "Kochen")
            category = "Kochen"
        else:
            station = "Chemie-Set"
            category = "Alchemie"
        for row in table[1:]:
            v = celltext(row)
            if len(v) <= ii or not v[li].isdigit():
                continue
            extra = {}
            for hk, field in [
                ("Effects", "effects"),
                ("Abilities", "effects"),
                ("Abilites", "effects"),
                ("Element", "element"),
            ]:
                if hk in h and h.index(hk) < len(v):
                    extra[field] = re.sub(
                        r"\[(?:Effects|Ability|Atr)\]", "", v[h.index(hk)]
                    ).strip()
            if "Price" in h:
                extra["sell"] = money(v[h.index("Price")])
            addrecipe(
                v[ni], v[li], slots(row[ii:]), station, category, url(title), **extra
            )
            audit["recipeRows"] += 1
stat_alias = {
    "M. ATK": "M.ATK",
    "M ATK": "M.ATK",
    "M. DEF": "M.DEF",
    "M DEF": "M.DEF",
    "HPMAX": "HP MAX",
    "RPMAX": "RP MAX",
    "HP MAXIMUM": "HP MAX",
    "RP MAXIMUM": "RP MAX",
}


def attributes(text):
    out = {}
    text = re.sub(r"\[[^]]*\]", " ", text).replace("−", "-")
    pat = r"(?<![\w.])((?:M\.?\s*)?(?:ATK|DEF)|(?:HP|RP)\s*(?:max)?|STR|VIT|INT|(?:Fire|Water|Earth|Wind|Light|Dark|Love|Psn|Poison|Seal|Par|Paralysis|Slp|Sleep|Ftg|Fatigue|Sick|Illness|Faint|Crit|Crt|Critical|Knock|Stun|Drain|Diz)(?:\s*(?:Res|Resist|Resistance|Atk|Attack))?|Diz\s*Resist|Knock\s*Resist)\s*([+-])\s*(\d+(?:\.\d+)?)\s*(%)?"
    for m in re.finditer(pat, text, re.I):
        key = re.sub(r"\s+", " ", m[1].upper().strip())
        key = stat_alias.get(key, key)
        value = float(m[3]) * (-1 if m[2] == "-" else 1)
        if m[4]:
            key += "%"
        out[key] = value
    return out


def effect(r, context, text):
    if text and text not in ["-", "ー", "—", "N/A"]:
        r["attributeText"][context] = text
        r["attributes"][context] = attributes(text)
        r.setdefault("attributeSources", {})[context] = r["source"]


for r in recipes:
    it = item(r["name"])
    if r.get("effects"):
        effect(it, "consume" if r["category"] == "Kochen" else "base", r["effects"])
for d in details["details"]:
    name = d["listName"]
    rows = d["rows"]
    canonical = None
    for row in rows[:3]:
        v = [x for x in row["values"] if x]
        if (
            len(v) == 1
            and len(v[0]) < 55
            and v[0] not in ["Description", "Info", "Consume Info", "Upgrade Info"]
            and not v[0].startswith("[")
        ):
            canonical = v[0]
            break
    canonical = canonical or d["resolved"]
    if d["type"] == "item":
        if canonical.endswith("(RF4)") and name != canonical:
            canonical = name
        r = item(canonical)
        if r is None:
            continue
        aliases[name] = canonical
        aliases[d["wikiTitle"]] = canonical
    else:
        # Character pages can contain many unrelated RF4 infoboxes; a stat header is required for monsters.
        r = {
            "name": canonical,
            "type": "monster",
            "category": "Gegner",
            "attributes": {},
            "attributeText": {},
        }
        prior = old.get(name.casefold(), {})
        for k in [
            "location",
            "drops",
            "favorite",
            "produce",
            "de",
            "translationStatus",
        ]:
            if k in prior:
                r[k] = prior[k]
        records["monster:" + canonical.casefold()] = r
    r["source"] = url(d["resolved"]) + "#Rune_Factory_4"
    r["revision"] = d["revision"]
    r["wikiTitle"] = d["resolved"]
    r["detailImported"] = True
    if d.get("image") and not d["image"].startswith("data:"):
        r["imageSource"] = d["image"]
    context = None
    statheaders = None
    for idx, row in enumerate(rows):
        v = row["values"]
        if r["type"] == "monster":
            if "Level" in v and "HP" in v and "ATK" in v:
                statheaders = v
                continue
            if (
                statheaders
                and len(v) == len(statheaders)
                and all(not x for x in row["headers"])
            ):
                r.setdefault("statVariants", []).append(dict(zip(statheaders, v)))
                r.setdefault("stats", dict(zip(statheaders, v)))
                statheaders = None
            if v and v[0] in ["Normal", "Diz Attack"] and idx + 1 < len(rows):
                r.setdefault("resistances", {}).update(
                    dict(zip(v, rows[idx + 1]["values"]))
                )
            for pos, label in enumerate(v[:-1]):
                if label in [
                    "Location",
                    "Drop",
                    "Nickname",
                    "Ride",
                    "Befriend",
                    "Favorite",
                    "Produce",
                    "Cycle",
                    "Traits",
                ]:
                    field = {
                        "Location": "location",
                        "Drop": "dropDetails",
                        "Nickname": "nicknames",
                        "Ride": "ride",
                        "Befriend": "befriend",
                        "Favorite": "favorite",
                        "Produce": "produce",
                        "Cycle": "cycle",
                        "Traits": "traits",
                    }[label]
                    r[field] = v[pos + 1]
                    if label == "Drop":
                        r["drops"] = list(
                            dict.fromkeys(l["name"] for l in row["links"][pos + 1])
                        )
        else:
            if len(v) == 1:
                if v[0] in ["Consume Info", "Cook Info", "Upgrade Info"]:
                    context = {
                        "Consume Info": "consume",
                        "Cook Info": "cook",
                        "Upgrade Info": "upgrade",
                    }[v[0]]
                # Older item infobox style uses bracket-labelled effect sections.
                for match in re.finditer(
                    r"\[(Upgrade Info|Ability|Effects|Difficulty)\]\s*(.*?)(?=\[|$)",
                    v[0],
                ):
                    label, value = match.groups()
                    if label == "Difficulty":
                        r["difficulty"] = value.strip()
                    else:
                        effect(
                            r,
                            {
                                "Upgrade Info": "upgrade",
                                "Ability": "base",
                                "Effects": "consume",
                            }[label],
                            value.strip(),
                        )
            for pos, label in enumerate(v[:-1]):
                if label in [
                    "Category",
                    "Sell",
                    "Buy",
                    "Rarity",
                    "Rarity ?",
                    "Difficulty",
                    "Effects",
                ]:
                    value = v[pos + 1]
                    if label in ["Sell", "Buy"]:
                        r[label.lower()] = money(value)
                    elif label.startswith("Rarity"):
                        r["rarity"] = int(value) if value.isdigit() else value
                    elif label == "Category":
                        r["wikiCategory"] = value
                    elif label == "Difficulty":
                        r["difficulty"] = value
                    elif label == "Effects" and context:
                        effect(r, context, value)
            # Old item pages may include RF4 crafting recipes for other items. Preserve provenance and compare rather than blindly overriding.
            if (
                len(v) >= 4
                and v[0]
                in [
                    "Forge",
                    "Crafting Table",
                    "Chemistry Set",
                    "Simple",
                    "Knife",
                    "Frying Pan",
                    "Pot",
                    "Steamer",
                    "Mixer",
                    "Oven",
                ]
                and v[2].isdigit()
            ):
                station = {
                    "Forge": "Schmiede",
                    "Crafting Table": "Fertigungstisch",
                    "Chemistry Set": "Chemie-Set",
                    "Simple": "Ohne Gerät",
                    "Knife": "Messer",
                    "Frying Pan": "Bratpfanne",
                    "Pot": "Topf",
                    "Steamer": "Dampfgarer",
                    "Mixer": "Mixer",
                    "Oven": "Ofen",
                }[v[0]]
                ingredients = slots(
                    [
                        {"text": text, "links": links}
                        for text, links in zip(v[3:], row["links"][3:])
                    ]
                )
                matching = [
                    x
                    for x in recipes
                    if x["name"] == v[1]
                    and x["level"] == int(v[2])
                    and x["station"] == station
                ]
                if not matching:
                    addrecipe(
                        v[1],
                        v[2],
                        ingredients,
                        station,
                        (
                            "Alchemie"
                            if station == "Chemie-Set"
                            else (
                                "Kochen"
                                if station not in ["Schmiede", "Fertigungstisch"]
                                else item(v[1])["category"]
                            )
                        ),
                        r["source"],
                    )
                else:
                    sig = lambda ss: sorted(tuple(sorted(z["options"])) for z in ss)
                    if ingredients and all(
                        sig(x["ingredientSlots"]) != sig(ingredients) for x in matching
                    ):
                        # Size alternatives often differ only by presentation; do not treat those as recipe conflicts.
                        norm = lambda ss: sorted(
                            re.sub(r"\s*\([SML]\)", "", x["options"][0]) for x in ss
                        )
                        if all(
                            norm(x["ingredientSlots"]) != norm(ingredients)
                            for x in matching
                        ):
                            conflict = {
                                "name": v[1],
                                "level": int(v[2]),
                                "source": r["source"],
                                "ingredients": [x["label"] for x in ingredients],
                            }
                            if conflict not in audit["conflicts"]:
                                audit["conflicts"].append(conflict)
                                matching[0].setdefault("sourceConflicts", []).append(
                                    conflict
                                )
    # Obtaining is represented by linked locations in the RF4 section; keep them separate from gift tables.
    if r["type"] == "item" and r.get("attributeText"):
        r["effects"] = (
            r["attributeText"].get("base")
            or r["attributeText"].get("upgrade")
            or r["attributeText"].get("consume")
            or ""
        )


def canon(n):
    return aliases.get(n, n)


for oldname, newname in list(aliases.items()):
    if (
        oldname.casefold() != newname.casefold()
        and oldname.casefold() in records
        and newname.casefold() in records
    ):
        prior = records.pop(oldname.casefold())
        dest = records[newname.casefold()]
        dest.setdefault("aliases", []).append(oldname)
        for k, v in prior.items():
            if k not in dest or dest[k] is None:
                dest[k] = v
for r in recipes:
    r["name"] = canon(r["name"])
    for slot in r["ingredientSlots"]:
        slot["options"] = list(dict.fromkeys(canon(n) for n in slot["options"]))
        slot["label"] = " / ".join(slot["options"])
    r["ingredients"] = [s["label"] for s in r["ingredientSlots"]]
    r["id"] = uid(
        "r", json.dumps([r["name"], r["station"], r["level"], r["ingredients"]])
    )
for r in records.values():
    r["id"] = uid("m" if r["type"] == "monster" else "i", r["name"])
    if r.get("drops"):
        r["drops"] = [canon(n) for n in r["drops"]]
    # Never inherit a guessed German name as an official translation.
    if r.get("de"):
        r["translationVerified"] = False
groups = base["materialGroups"]
for name, de in groups.items():
    key = name.casefold()
    if key in records:
        records[key].update(
            category="Materialgruppen",
            isMaterialGroup=True,
            de=de,
            translationStatus="Suchhilfe · offiziell unbestätigt",
        )
# Retain unresolved monsters from the RF4 bestiary with explicit missing fields.
for r in base["records"]:
    if r["type"] == "monster" and not any(
        x["type"] == "monster" and x["name"] == r["name"] for x in records.values()
    ):
        r = {**r, "id": uid("m", r["name"]), "detailImported": False}
        records["monster:" + r["name"].casefold()] = r
ranchpath = ROOT / "data-sources/ranch-api.json"
ranchurl = "https://ranchstory.miraheze.org/wiki/Item_List_(Rune_Factory_4)"
audit["ranchItems"] = 0
audit["ranchAdded"] = []
audit["dataConflicts"] = []
if ranchpath.exists():
    ranch = json.loads(ranchpath.read_text(encoding="utf8"))
    rs = BeautifulSoup(ranch["parse"]["text"]["*"], "html.parser")
    for table in rs.find_all("table"):
        if table.find_parent("table"):
            continue
        trs = [tr for tr in table.find_all("tr") if tr.find_parent("table") == table]
        if not trs:
            continue
        h = [
            re.sub(r"\s+", " ", c.get_text(" ", strip=True))
            for c in trs[0].find_all(["th", "td"], recursive=False)
        ]
        if "Item Name" not in h:
            continue
        heading = table.find_previous(["h2", "h3"])
        section = (
            heading.get_text(" ", strip=True).replace("[edit]", "").strip()
            if heading
            else "Items"
        )
        names = {
            "Item Name": "name",
            "JP Name": "jp",
            "Sell": "sell",
            "Buy": "buy",
            "Upgrade Lv.": "difficulty",
            "Recipe Lv.": "recipeLevel",
        }
        last = None
        for tr in trs[1:]:
            cells = tr.find_all(["td", "th"], recursive=False)
            v = [re.sub(r"\s+", " ", c.get_text(" ", strip=True)) for c in cells]
            if len(v) != len(h):
                for text in v:
                    if last and text.startswith("Obtained By:"):
                        obtained = text.removeprefix("Obtained By:").strip()
                        if obtained and not last.get("location"):
                            last["location"] = obtained
                            last["locationSource"] = ranchurl
                continue
            name = re.sub(r"\s*\[more details\].*", "", v[h.index("Item Name")]).strip()
            if not name or name == "Item Name":
                continue
            name = canon(name)
            isnew = name.casefold() not in records
            r = item(name)
            if not r:
                continue
            last = r
            audit["ranchItems"] += 1
            if isnew:
                audit["ranchAdded"].append(name)
                r["source"] = ranchurl
                r["category"] = section
            r["ranchSource"] = ranchurl
            r["ranchRevision"] = ranch["parse"].get("revid")
            for key, field in names.items():
                if key not in h or field == "name":
                    continue
                value = v[h.index(key)]
                value = money(value) if field in ["sell", "buy"] else value
                if value is None or value in ["—", "-", ""]:
                    continue
                if field not in r or r[field] is None or r[field] in ["-", "N/A"]:
                    r[field] = value
                elif str(r[field]) != str(value) and field not in ["jp", "recipeLevel"]:
                    conflict = {
                        "item": name,
                        "field": field,
                        "primary": r[field],
                        "alternate": value,
                        "source": ranchurl,
                    }
                    audit["dataConflicts"].append(conflict)
                    r.setdefault("dataConflicts", []).append(conflict)
            for col, context in [
                ("Upgrade Stats", "upgrade"),
                ("Eating Effects", "consume"),
                ("Eating EFFECTSs", "consume"),
                ("Cooking Effects", "cook"),
                ("Cooking EFFECTSs", "cook"),
                (
                    "Stats",
                    (
                        "base"
                        if section
                        in [
                            "Short Sword",
                            "Long Sword",
                            "Spear",
                            "Axes/Hammer",
                            "Staff",
                            "Dual Sword",
                            "Fist",
                            "Shields",
                            "Accessories",
                            "Headgear",
                            "Shoes",
                            "Armor",
                            "Hoe",
                            "Waterpot",
                            "Sickle",
                            "Hammer",
                            "Axe",
                            "Fishing Pole",
                        ]
                        else "consume"
                    ),
                ),
            ]:
                if col not in h:
                    continue
                value = v[h.index(col)]
                if not value or value in ["—", "-", "STATS"]:
                    continue
                parsed = attributes(value)
                known = r["attributes"].get(context, {})
                differences = {
                    k: {"wiki": known[k], "ranch": nv}
                    for k, nv in parsed.items()
                    if k in known and nv != known[k]
                }
                if differences:
                    conflict = {
                        "item": name,
                        "field": context,
                        "primary": r["attributeText"].get(context),
                        "alternate": value,
                        "source": ranchurl,
                    }
                    audit["dataConflicts"].append(conflict)
                    r.setdefault("dataConflicts", []).append(conflict)
                if context not in r["attributes"] or not r["attributes"][context]:
                    effect(r, context, value)
                    r["attributeSources"][context] = ranchurl
                else:
                    for k, val in parsed.items():
                        r["attributes"][context].setdefault(k, val)
                    r.setdefault("ranchAttributeText", {})[context] = value
            # The raw numeric stat table for special accessories has one column per stat.
            if "ATK" in h:
                text = " ".join(
                    k + " +" + v[h.index(k)].lstrip("+")
                    for k in ["ATK", "DEF", "M ATK", "M DEF", "STR", "VIT", "INT"]
                    if k in h and re.fullmatch(r"[+-]?\d+", v[h.index(k)])
                )
                if text:
                    effect(r, "base", text)
                    r["attributeSources"]["base"] = ranchurl
            image = cells[0].find("img")
            if image:
                src = image.get("src", "")
                src = "https:" + src if src.startswith("//") else src
                if src.startswith("https://static.wikitide.net/"):
                    r["imageSource"] = src
                    r["imageCredit"] = ranchurl
            r["id"] = uid("i", r["name"])
# Resolve spelling variants against the RF4 inventory names, preserving searchable aliases.
english_variants = {
    "Small Milk": "Milk (S)",
    "Medium Milk": "Milk (M)",
    "Large Milk": "Milk (L)",
    "Fist of Wind": "Fists of Wind",
    "Gloves (Accessory)": "Gloves",
    "Grape Tree Seeds": "Grape Tree Seed",
    "Pink Melon Seeds": "Gold Melon Seeds",
    "Poison Rainbow Trout": "Rainbow Trout",
    "Star Sabre": "Star Saber",
    "Zweihander": "Zweihaender",
    "No Rot β": "No Rot (Beta)",
    "No Rot ß": "No Rot (Beta)",
    "No Rot α": "No Rot (Alpha)",
    "Cheap Propellor": "Cheap Propeller",
    "Quality Propellor": "Quality Propeller",
    "ChimeraTail": "Chimera Tail",
    "Giant's Glove": "Giant's Gloves",
    "Glitta Augita": "Glitta Augite",
    "Lightening Mane": "Lightning Mane",
    "Red Lion's Fur": "Red Lion Fur",
    "Salmon Rice Ball": "Salmon Onigiri",
    "Earring": "Earrings",
    "Magic Earring": "Magic Earrings",
    "Handknit Scarf": "Hand-Knit Scarf",
}
for old_name, canonical_name in english_variants.items():
    aliases[old_name] = canonical_name
    old_key, new_key = old_name.casefold(), canonical_name.casefold()
    if old_key not in records or old_key == new_key:
        continue
    previous = records.pop(old_key)
    target = records.setdefault(new_key, previous)
    target["name"] = canonical_name
    target["id"] = uid("i", canonical_name)
    target.setdefault("aliases", []).append(old_name)
    target["englishNameReference"] = (
        "https://github.com/Ericoptero/rf4helper/blob/main/data/items.json"
    )
    for key, value in previous.items():
        if key not in target or target[key] is None:
            target[key] = value

# These are narrative links accidentally included by a Wiki navigation template.
for narrative_name in ["Ethelberd", "Sechs Empire"]:
    records.pop(narrative_name.casefold(), None)

for recipe in recipes:
    recipe["name"] = english_variants.get(recipe["name"], recipe["name"])
    for slot in recipe["ingredientSlots"]:
        slot["options"] = list(
            dict.fromkeys(english_variants.get(name, name) for name in slot["options"])
        )
        slot["label"] = " / ".join(slot["options"])
    recipe["ingredients"] = [slot["label"] for slot in recipe["ingredientSlots"]]
    recipe["id"] = uid(
        "r",
        json.dumps(
            [recipe["name"], recipe["station"], recipe["level"], recipe["ingredients"]]
        ),
    )
for record in records.values():
    if record.get("drops"):
        record["drops"] = [english_variants.get(name, name) for name in record["drops"]]

# Exact RF4 filenames supplement images omitted from the item table itself.
image_list_path = ROOT / "data-sources/ranch-image-index.json"
if image_list_path.exists():
    image_entries = json.loads(image_list_path.read_text(encoding="utf8"))

    def image_key(name):
        return re.sub(r"[^a-z0-9]+", "", name.lower().replace("+", "plus"))

    for record in records.values():
        if record["type"] != "item":
            continue
        if "icon" in record.get("imageSource", "").lower():
            record.pop("imageSource", None)
        if record.get("imageSource", "").startswith("https://static.wikitide.net/"):
            continue
        names = [record["name"], *record.get("aliases", [])]
        candidates = [
            image
            for image in image_entries
            if image["name"].startswith("RF4_Items_")
            and any(
                image_key(image["name"].rsplit(".", 1)[0]).endswith(image_key(name))
                for name in names
            )
        ]
        if len(candidates) == 1:
            record["imageSource"] = candidates[0]["url"]
            record["imageCredit"] = candidates[0]["descriptionurl"]

# Raccoon is a cross-reference to Magnuto in the RF4 bestiary, not another boss.
if "monster:raccoon" in records and "monster:magnuto" in records:
    records.pop("monster:raccoon")
    records["monster:magnuto"].setdefault("aliases", []).append("Raccoon")

# Supplement unavailable Wiki images with the separately indexed RF4-only collection.
helper_tree_path = ROOT / "data-sources/helper-tree.json"
if helper_tree_path.exists():
    helper_tree = json.loads(helper_tree_path.read_text(encoding="utf8"))
    helper_paths = {
        entry["path"]
        for entry in helper_tree.get("tree", [])
        if entry["type"] == "blob"
    }
    helper_commit = helper_tree["sha"]
    helper_images = {}
    normalize_name = lambda value: re.sub(
        r"[^a-z0-9]+", "", value.lower().replace("+", "plus")
    )
    for record_type, filename in [
        ("item", "helper-items.json"),
        ("monster", "helper-monsters.json"),
    ]:
        helper_file = ROOT / "data-sources" / filename
        if not helper_file.exists():
            continue
        for entry in json.loads(helper_file.read_text(encoding="utf8")).values():
            image_path = entry.get("image", "").lstrip("/")
            if not image_path.startswith("images/"):
                image_path = "images/" + image_path
            if not image_path.endswith((".png", ".jpg", ".webp", ".gif")):
                image_path += ".png"
            if "public/" + image_path in helper_paths and not image_path.endswith(
                "/unknown.png"
            ):
                helper_images[(record_type, normalize_name(entry["name"]))] = image_path
    audit["helperImagesMatched"] = 0
    for record in records.values():
        if record.get("imageSource", "").startswith("https://static.wikitide.net/"):
            continue
        names = [
            record["name"],
            record.get("wikiTitle", ""),
            *record.get("aliases", []),
        ]
        matches = {
            helper_images[(record["type"], normalize_name(name))]
            for name in names
            if (record["type"], normalize_name(name)) in helper_images
        }
        if len(matches) == 1:
            image_path = matches.pop()
            record["imageSource"] = (
                "https://raw.githubusercontent.com/Ericoptero/rf4helper/"
                + helper_commit
                + "/public/"
                + image_path
            )
            record["imageCredit"] = "https://github.com/Ericoptero/rf4helper"
            record["imageProvenance"] = (
                "RF4-only asset collection; matched by English name"
            )
            audit["helperImagesMatched"] += 1

# These variants share an RF4 family icon; identify this explicitly instead of showing dropped fur as a monster portrait.
if "monster:little wooly" in records:
    wooly = records.get("monster:wooly", {})
    if wooly.get("imageSource"):
        records["monster:little wooly"].update(
            imageSource=wooly["imageSource"],
            imageCredit=wooly.get("imageCredit", wooly.get("source")),
            imageCaption="Gemeinsames RF4-Wooly-Symbol; Little Wooly ist die Festivalvariante.",
        )
if "monster:soldier" in records and helper_tree_path.exists():
    records["monster:soldier"].update(
        imageSource="https://raw.githubusercontent.com/Ericoptero/rf4helper/"
        + helper_commit
        + "/public/images/monsters/soldier.png",
        imageCredit="https://github.com/Ericoptero/rf4helper",
    )
overrides_path = ROOT / "data-sources/image-overrides.json"
if overrides_path.exists():
    for name, override in json.loads(overrides_path.read_text(encoding="utf8")).items():
        record = records.get("monster:" + name.casefold())
        if record:
            record.update(
                imageSource=override["url"],
                imageCredit=override["credit"],
                imageCaption=override["caption"],
            )

out = list(records.values())
out.sort(key=lambda r: (r["type"], r["name"].casefold()))
dedup = {r["id"]: r for r in recipes}
recipes = list(dedup.values())

acquisition_path = ROOT / "data-sources/recipe-acquisition.json"
if acquisition_path.exists():
    audit.update(
        enrich_recipe_acquisitions(recipes, acquisition_path, english_variants)
    )
audit.update(
    items=sum(r["type"] == "item" for r in out),
    monsters=sum(r["type"] == "monster" for r in out),
    recipes=len(recipes),
    images=sum(bool(r.get("imageSource")) for r in out),
    itemsWithAttributes=sum(
        bool(r.get("attributes")) for r in out if r["type"] == "item"
    ),
    monstersWithStats=sum(bool(r.get("stats")) for r in out if r["type"] == "monster"),
    itemsWithoutIndividualPage=[
        r["name"] for r in out if r["type"] == "item" and not r.get("detailImported")
    ],
)
base.update(
    records=out,
    recipes=recipes,
    audit=audit,
    coverage="RF4-Tabellen, RF4-Abschnitte der einzelnen Rune-Factory-Wiki-Seiten und die RF4-Itemliste von Ranch Story. Quellenabweichungen und nicht belegbare Angaben sind gekennzeichnet. Deutsche offizielle Namen sind ohne verifizierbare Lokalisierungsquelle noch offen.",
)
(ROOT / "public/data.json").write_text(
    json.dumps(base, ensure_ascii=False, separators=(",", ":")), encoding="utf8"
)
(ROOT / "public/completeness.json").write_text(
    json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf8"
)
print(
    json.dumps(
        {k: v for k, v in audit.items() if not isinstance(v, list)}, ensure_ascii=False
    )
)
print(
    "CONFLICTS",
    len(audit["conflicts"]),
    "NO DETAIL",
    len(audit["itemsWithoutIndividualPage"]),
    "RANCH ADDED",
    len(audit["ranchAdded"]),
)
