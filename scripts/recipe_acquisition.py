"""Attach reviewed RF4 recipe sources without confusing them with item locations."""

import json
from collections import defaultdict


def enrich_recipe_acquisitions(recipes, source_path, aliases):
    entries = json.loads(source_path.read_text(encoding="utf-8"))
    by_name = defaultdict(list)
    for entry in entries:
        required = ("name", "location", "description", "source", "sourceTitle", "kind")
        if any(
            not isinstance(entry.get(key), str) or not entry[key].strip()
            for key in required
        ):
            raise ValueError(f"Incomplete recipe source: {entry.get('name')}")
        if not entry["source"].startswith("https://"):
            raise ValueError(f"Invalid recipe source: {entry['name']}")
        name = aliases.get(entry["name"], entry["name"])
        acquisition = {key: entry[key] for key in required if key != "name"}
        if acquisition not in by_name[name]:
            by_name[name].append(acquisition)

    matched_names = set()
    for recipe in recipes:
        if recipe["name"] in by_name:
            recipe["acquisition"] = by_name[recipe["name"]]
            matched_names.add(recipe["name"])
    return {
        "recipesWithAcquisition": sum(
            bool(recipe.get("acquisition")) for recipe in recipes
        ),
        "recipeNamesWithAcquisition": len(matched_names),
        "recipeAcquisitionSources": sum(len(by_name[name]) for name in matched_names),
        "unmatchedRecipeAcquisitions": sorted(set(by_name) - matched_names),
    }
