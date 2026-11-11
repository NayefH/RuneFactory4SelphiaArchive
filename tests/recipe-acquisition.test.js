import test from "node:test";
import assert from "node:assert/strict";
import { createCatalog } from "../src/catalog.js";
import { acquisitionPanel } from "../src/recipe-acquisition.js";
import { escapeHtml } from "../src/html.js";
import { readFileSync } from "node:fs";
import {
  isSharanceExclusiveRecipe,
  sharanceRecipeBadge,
  sharanceRecipePanel,
} from "../src/recipe-acquisition.js";
import { setLanguage } from "../src/i18n.js";

const source = {
  location: "Rune Prana 4F",
  description: "Rezept aus einer Truhe nach dem Kampf.",
  source: "https://example.com/rf4",
  sourceTitle: "RF4-Fundort",
  kind: "chest",
};
const recipe = {
  id: "recipe",
  name: "Dry Curry",
  station: "Bratpfanne",
  category: "Kochen",
  level: 86,
  ingredients: ["Rice"],
  acquisition: [source],
};
const item = {
  id: "item",
  name: "Dry Curry",
  type: "item",
  category: "Kochen",
  location: "Fertiges Gericht im Laden",
};
const catalog = createCatalog({
  records: [item],
  recipes: [recipe, { ...recipe, id: "variant" }],
  materialGroups: {},
});
const filters = {
  tab: "recipe",
  query: "Rune Prana",
  category: "",
  station: "",
  maxRecipeLevel: 99,
  sort: "name",
};

test("recipe locations and directions are searchable on recipes and their items", () => {
  assert.equal(catalog.select(filters, new Set()).length, 2);
  assert.equal(
    catalog.select({ ...filters, tab: "item", query: "Truhe" }, new Set())[0]
      .id,
    "item",
  );
});

test("ingredient variants share a single source without reusing the finished item's location", () => {
  assert.deepEqual(catalog.getAcquisitions(item), [source]);
  assert.equal(catalog.getAcquisitions(recipe)[0].location, "Rune Prana 4F");
  assert.deepEqual(catalog.getAcquisitions({ ...item, type: "monster" }), []);
});

test("source panels render only documented sources and escape text", () => {
  assert.equal(acquisitionPanel([], escapeHtml), "");
  const panel = acquisitionPanel(
    [{ ...source, description: "<script>alert(1)</script>" }],
    escapeHtml,
  );
  assert.ok(panel.includes("Rezept finden / lernen"));
  assert.ok(panel.includes(source.source));
  assert.ok(!panel.includes("<script>"));
});

test("Sharance gold requires a recipe above level 80 without an alternative learning source", () => {
  const high = { ...recipe, acquisition: [] };
  assert.equal(isSharanceExclusiveRecipe(high), true);
  assert.equal(isSharanceExclusiveRecipe({ ...high, level: 80 }), false);
  assert.equal(isSharanceExclusiveRecipe({ ...high, level: 81 }), true);
  for (const level of [undefined, null, NaN, Infinity, "99"]) {
    assert.equal(isSharanceExclusiveRecipe({ ...high, level }), false);
  }
  assert.equal(isSharanceExclusiveRecipe({ ...item, level: 99 }), false);
  assert.equal(isSharanceExclusiveRecipe(recipe), false);
  const maze = { ...source, location: "Sharance Maze" };
  assert.equal(isSharanceExclusiveRecipe(high, [maze]), true);
  assert.equal(isSharanceExclusiveRecipe(high, [maze, source]), false);
  assert.equal(
    isSharanceExclusiveRecipe(high, [{ ...source, location: "" }]),
    false,
  );
  assert.equal(
    isSharanceExclusiveRecipe(high, [
      { ...source, kind: "quest", location: "Selphia" },
    ]),
    false,
  );
});

test("gold classification shares alternative locations between recipe variants and is searchable", () => {
  const high = { ...recipe, id: "high", name: "Gold Juice", acquisition: [] };
  const c = createCatalog({
    records: [{ ...item, name: high.name }],
    recipes: [high, recipe, { ...recipe, id: "variant", acquisition: [] }],
    materialGroups: {},
  });
  assert.equal(c.isSharanceExclusive(high), true);
  assert.equal(c.isSharanceExclusive(c.byId.get("variant")), false);
  assert.equal(c.isSharanceExclusive(c.byId.get("item")), false);
  for (const query of [
    "Sharance Maze",
    "Sharance-Labyrinth",
    "Rezeptbrot+",
    "Recipe Bread+",
  ]) {
    assert.deepEqual(
      c.select({ ...filters, query }, new Set()).map((r) => r.id),
      ["high"],
    );
  }
});

test("real recipes exclude documented chest alternatives while marking Bread+ variants across stations", () => {
  const data = JSON.parse(
    readFileSync(new URL("../public/data.json", import.meta.url)),
  );
  const c = createCatalog(data);
  for (const name of [
    "Gold Juice",
    "Rune Legend",
    "Four Dragons' Vest",
    "Leveliser",
  ]) {
    const variants = data.recipes.filter((r) => r.name === name);
    assert.ok(variants.length, name);
    assert.ok(variants.every(c.isSharanceExclusive), name);
  }
  for (const name of [
    "Pineapple Juice",
    "Fluffy Scarf",
    "Gáe Bolg",
    "Glitter Sashimi",
    "Royal Garter",
    "Platinum Hammer",
  ]) {
    const variants = data.recipes.filter((r) => r.name === name);
    assert.ok(variants.length, name);
    assert.ok(
      variants.every((r) => !c.isSharanceExclusive(r)),
      name,
    );
  }
  assert.ok(data.records.every((r) => !c.isSharanceExclusive(r)));
  assert.ok(
    data.recipes
      .filter((r) => r.acquisition?.length)
      .every((r) => !c.isSharanceExclusive(r)),
  );
});

test("gold badge and detail explanation translate and distinguish learning from crafting", () => {
  try {
    setLanguage("de");
    assert.ok(sharanceRecipeBadge().includes("Rezeptbrot+"));
    assert.ok(
      sharanceRecipePanel().includes("Herstellung ohne gelerntes Rezept"),
    );
    assert.ok(
      sharanceRecipePanel().includes(
        "https://www.neoseeker.com/rune-factory-4/faqs/758373-recipe.html",
      ),
    );
    setLanguage("en");
    assert.ok(sharanceRecipeBadge().includes("Recipe Bread+"));
    assert.ok(
      sharanceRecipePanel().includes("Crafting without a learned recipe"),
    );
    assert.ok(!sharanceRecipePanel().includes("Rezeptbrot"));
  } finally {
    setLanguage("de");
  }
});
