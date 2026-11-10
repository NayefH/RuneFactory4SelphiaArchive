import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCatalog } from "../src/catalog.js";
import { setLanguage } from "../src/i18n.js";
import { canonicalCategory, categoryGroup } from "../src/categories.js";
import {
  normalizeSort,
  numericSortValue,
  sortOptions,
  sortValueLabel,
} from "../src/sorting.js";

const filters = { tab: "item", query: "", maxRecipeLevel: 99 };
const item = (id, values = {}) => ({
  id,
  name: id,
  type: "item",
  category: "Minerals",
  ...values,
});
const records = [
  item("unknown", { sell: null, buy: "-", difficulty: "#" }),
  item("ten", { sell: 10, buy: 100, difficulty: "10" }),
  item("invalid", { sell: "", buy: false, difficulty: "95?" }),
  item("zero", { sell: 0, buy: 0, difficulty: "0" }),
  item("two", { sell: 2, buy: 20, difficulty: "2" }),
];
const recipes = [
  {
    id: "recipe-ten",
    name: "Ten",
    station: "Schmiede",
    level: 10,
    ingredients: [],
  },
  {
    id: "recipe-two",
    name: "Two",
    station: "Schmiede",
    level: 2,
    ingredients: [],
  },
  {
    id: "recipe-unknown",
    name: "Unknown",
    station: "Schmiede",
    ingredients: [],
  },
];
const catalog = createCatalog({ records, recipes, materialGroups: {} });
const ids = (sort, extra = {}, selectedCatalog = catalog) =>
  selectedCatalog
    .select(
      { ...filters, sort, ...extra },
      new Set([...records, ...recipes].map((r) => r.id)),
    )
    .map((r) => r.id);

test("prices and upgrade difficulty sort numerically and keep unknowns last in either direction", () => {
  for (const field of ["sell", "buy", "difficulty"]) {
    assert.deepEqual(ids(`${field}-asc`), [
      "zero",
      "two",
      "ten",
      "invalid",
      "unknown",
    ]);
    assert.deepEqual(ids(`${field}-desc`), [
      "ten",
      "two",
      "zero",
      "invalid",
      "unknown",
    ]);
  }
});

test("recipe levels support both directions and put recipes without a level last", () => {
  assert.deepEqual(ids("level", { tab: "recipe" }), [
    "recipe-two",
    "recipe-ten",
    "recipe-unknown",
  ]);
  assert.deepEqual(ids("level-desc", { tab: "recipe" }), [
    "recipe-ten",
    "recipe-two",
    "recipe-unknown",
  ]);
});

test("favorites sort only the record types that have the selected value", () => {
  const byPrice = ids("sell-desc", { tab: "saved" });
  assert.deepEqual(byPrice.slice(0, 3), ["ten", "two", "zero"]);
  assert.equal(byPrice.length, records.length + recipes.length);
  assert.deepEqual(ids("level", { tab: "saved" }).slice(0, 2), [
    "recipe-two",
    "recipe-ten",
  ]);
});

test("sort options match each section and old level links remain valid for recipes", () => {
  const values = (tab) => sortOptions(tab).map((option) => option.value);
  assert.ok(values("item").includes("sell-desc"));
  assert.ok(!values("item").includes("level"));
  assert.ok(values("recipe").includes("level-desc"));
  assert.ok(!values("recipe").includes("bonus-desc"));
  assert.deepEqual(values("monster"), ["name", "name-desc", "category"]);
  assert.equal(normalizeSort("level", "recipe"), "level");
  assert.equal(normalizeSort("level", "item"), "name");
  assert.equal(normalizeSort("sell-desc", "monster"), "name");
  assert.equal(normalizeSort("not-a-sort", "item"), "name");
  assert.equal(normalizeSort(null, "item"), "name");
});

test("natural name order respects the selected language and numeric suffixes", () => {
  const c = createCatalog({
    records: [
      item("r10", { name: "Item 10", de: "Zinn 10" }),
      item("r2", { name: "Item 2", de: "Zinn 2" }),
      item("r1", { name: "Zinc", de: "Eisen" }),
    ],
    recipes: [],
    materialGroups: {},
  });
  try {
    setLanguage("de");
    assert.deepEqual(ids("name", {}, c), ["r1", "r2", "r10"]);
    setLanguage("en");
    assert.deepEqual(ids("name", {}, c), ["r2", "r10", "r1"]);
    assert.deepEqual(ids("name-desc", {}, c), ["r1", "r10", "r2"]);
  } finally {
    setLanguage("de");
  }
});

test("category order keeps weapon aliases together and separates equipment and materials", () => {
  const c = createCatalog({
    records: [
      item("ore"),
      item("shield", { category: "Schilde" }),
      item("sword-b", { category: "Short Sword" }),
      item("spear", { category: "Speere" }),
      item("sword-a", { category: "Kurzschwerter" }),
    ],
    recipes: [],
    materialGroups: {},
  });
  assert.deepEqual(ids("category", {}, c), [
    "sword-a",
    "sword-b",
    "spear",
    "shield",
    "ore",
  ]);
});

test("equal numeric values use a stable name order without mutating the dataset", () => {
  const tied = [item("b", { sell: 5 }), item("a", { sell: 5 })];
  const c = createCatalog({ records: tied, recipes: [], materialGroups: {} });
  assert.deepEqual(ids("sell-desc", {}, c), ["a", "b"]);
  assert.deepEqual(ids("sell-asc", {}, c), ["a", "b"]);
  assert.deepEqual(
    tied.map((record) => record.id),
    ["b", "a"],
  );
});

test("displayed values use the same data as sorting, preserving zero and unknown values", () => {
  assert.equal(sortValueLabel(records[3], "sell-asc"), "Verkaufspreis: 0 G");
  assert.equal(
    sortValueLabel(records[0], "difficulty-asc"),
    "Upgrade-Schwierigkeit: Nicht erfasst",
  );
  assert.equal(
    sortValueLabel(records[1], "difficulty-asc"),
    "Upgrade-Schwierigkeit: 10",
  );
  assert.equal(
    numericSortValue(item("invalid", { sell: NaN }), "sell-asc"),
    undefined,
  );
  assert.equal(
    numericSortValue(item("invalid", { sell: Infinity }), "sell-asc"),
    undefined,
  );
});

test("all real item sort modes retain items and correctly order known values", () => {
  const data = JSON.parse(
    readFileSync(new URL("../public/data.json", import.meta.url)),
  );
  const c = createCatalog(data);
  const count = data.records.filter((r) => r.type === "item").length;
  for (const { value: sort } of sortOptions("item").filter(
    (o) => !o.value.startsWith("bonus"),
  )) {
    const sorted = c.select({ ...filters, sort }, new Set());
    assert.equal(sorted.length, count, sort);
    let previous;
    let foundUnknown = false;
    for (const record of sorted) {
      const value = numericSortValue(record, sort);
      if (value === undefined) {
        foundUnknown = true;
        continue;
      }
      assert.equal(foundUnknown, false, `${sort}: known value follows unknown`);
      if (previous !== undefined)
        assert.ok(
          sort.endsWith("-desc") ? previous >= value : previous <= value,
          sort,
        );
      previous = value;
    }
    if (sort === "category") {
      const seen = new Set();
      let previousCategory;
      for (const record of sorted) {
        const key = `${categoryGroup(record.category)}:${canonicalCategory(record.category)}`;
        if (key !== previousCategory) {
          assert.ok(!seen.has(key), key);
          seen.add(key);
        }
        previousCategory = key;
      }
    }
  }
});
