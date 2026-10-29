import test from "node:test";
import assert from "node:assert/strict";
import { createCatalog } from "../src/catalog.js";
import { acquisitionPanel } from "../src/recipe-acquisition.js";
import { escapeHtml } from "../src/html.js";

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
