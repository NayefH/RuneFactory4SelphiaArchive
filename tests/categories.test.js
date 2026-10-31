import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCatalog } from "../src/catalog.js";
import {
  categoryGroup,
  categoryGroups,
  categoriesFor,
} from "../src/categories.js";

const data = JSON.parse(
  readFileSync(new URL("../public/data.json", import.meta.url)),
);
const catalog = createCatalog(data);
const filters = { tab: "item", query: "", sort: "name", maxRecipeLevel: 99 };

test("category groups account for every item and recipe exactly once", () => {
  for (const tab of ["item", "recipe"]) {
    const records = catalog.list(tab, new Set());
    const groups = categoryGroups(records);
    assert.equal(
      groups.reduce((sum, group) => sum + group.count, 0),
      records.length,
    );
    for (const group of groups) {
      const selected = catalog.select(
        { ...filters, tab, group: group.id },
        new Set(),
      );
      assert.equal(selected.length, group.count);
      assert.equal(
        categoriesFor(records, group.id).reduce(
          (sum, category) => sum + category.count,
          0,
        ),
        group.count,
      );
    }
  }
});

test("weapon categories include English aliases and exclude farm tools", () => {
  const weapons = catalog.select({ ...filters, group: "weapons" }, new Set());
  assert.ok(weapons.some((record) => record.category === "Short Sword"));
  assert.ok(
    weapons.every((record) => categoryGroup(record.category) === "weapons"),
  );
  assert.ok(!weapons.some((record) => record.category.includes("Werkzeug")));
  const swords = catalog.select(
    { ...filters, group: "weapons", category: "Kurzschwerter" },
    new Set(),
  );
  assert.equal(
    swords.length,
    data.records.filter((record) =>
      ["Kurzschwerter", "Short Sword"].includes(record.category),
    ).length,
  );
});

test("accessory filter includes all accessories without other equipment", () => {
  for (const tab of ["item", "recipe"]) {
    const selected = catalog.select(
      { ...filters, tab, group: "equipment", category: "Accessoires" },
      new Set(),
    );
    assert.ok(selected.length > 0);
    assert.ok(
      selected.every((record) =>
        ["Accessoires", "Accessories"].includes(record.category),
      ),
    );
  }
});

test("recipe category combines with station, level and bilingual search", () => {
  const result = catalog.select(
    {
      ...filters,
      tab: "recipe",
      group: "weapons",
      category: "Kurzschwerter",
      station: "Schmiede",
      maxRecipeLevel: 20,
      query: "Wasserschwert",
    },
    new Set(),
  );
  assert.ok(result.length > 0);
  assert.ok(
    result.every(
      (record) => record.level <= 20 && record.station === "Schmiede",
    ),
  );
  assert.equal(
    catalog.select(
      { ...filters, tab: "recipe", group: "weapons", category: "Kochen" },
      new Set(),
    ).length,
    0,
  );
});
