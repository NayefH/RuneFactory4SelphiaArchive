import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createCraftingContext,
  newCraftingPlan,
  sanitizeCraftingPlan,
  simulateCrafting,
  loadCraftingPlan,
  saveCraftingPlan,
} from "../src/crafting-engine.js";
import { createCraftingPage, findCraftMaterial } from "../src/crafting.js";
import { createCatalog } from "../src/catalog.js";
import { setLanguage } from "../src/i18n.js";

const data = JSON.parse(
  readFileSync(new URL("../public/data.json", import.meta.url)),
);
const context = createCraftingContext(data);
const catalog = createCatalog(data);
const recipe = (name) => context.recipes.find((recipe) => recipe.name === name);
const id = (name) => context.byName.get(name).id;
const upgrade = (name, level = 1) => ({ itemId: id(name), level });
const planFor = (name) => newCraftingPlan(context, recipe(name).id);

test("every real recipe has physical ingredient candidates, including aliases and material groups", () => {
  assert.equal(context.recipes.length, 665);
  assert.ok(!context.byName.has("Minerals"));
  for (const recipe of context.recipes) {
    assert.ok(context.slotsFor(recipe).length <= 6, recipe.name);
    for (const slot of context.slotsFor(recipe))
      assert.ok(
        context.candidates(slot).length,
        `${recipe.name}: ${slot.label}`,
      );
  }
  assert.ok(
    context
      .candidates({ options: ["Milk"] })
      .some((item) => item.name === "Milk (S)"),
  );
  assert.ok(
    context
      .candidates({ options: ["Minerals"] })
      .every((item) => item.category === "Minerals"),
  );
});

test("ordinary upgrades use only upgrade effects and halve repeated materials", () => {
  const plan = planFor("Broadsword");
  plan.upgrades = [
    upgrade("Gold"),
    upgrade("Gold"),
    upgrade("Gold"),
    upgrade("Gold"),
  ];
  const result = simulateCrafting(context, plan);
  assert.deepEqual(
    result.steps.map((step) => step.delta.DEF),
    [10, 5, 2, 1],
  );
  assert.equal(result.upgrades.DEF, 18);
  assert.equal(result.equipmentLevel, 5);
  assert.equal(result.base.ATK, 5);
});

test("both steels repeat the full original effect even after a diminished material", () => {
  const plan = planFor("Broadsword");
  plan.upgrades = [
    upgrade("Gold"),
    upgrade("10-Fold Steel"),
    upgrade("Gold"),
    upgrade("Double Steel"),
  ];
  const result = simulateCrafting(context, plan);
  assert.deepEqual(
    result.steps.map((step) => step.delta.DEF),
    [10, 80, 5, 20],
  );
  assert.equal(result.upgrades.DEF, 115);
});

test("steel cannot chain or work twice and Object X reverses subsequent material stats", () => {
  const plan = planFor("Broadsword");
  plan.upgrades = [
    upgrade("Object X"),
    upgrade("Gold"),
    upgrade("Double Steel"),
    upgrade("10-Fold Steel"),
    upgrade("Gold"),
    upgrade("Double Steel"),
  ];
  const result = simulateCrafting(context, plan);
  assert.deepEqual(
    result.steps.map((step) => step.delta.DEF),
    [0, -10, 20, 0, 5, 0],
  );
  assert.ok(result.warnings.includes("steel-inactive"));
});

test("negative numeric effects reverse under Object X without using food bonuses", () => {
  const plan = planFor("Broadsword");
  plan.upgrades = [upgrade("Object X"), upgrade("Mealy Apple")];
  const result = simulateCrafting(context, plan);
  assert.equal(result.upgrades.STR, 100);
  assert.equal(result.upgrades.VIT, 150);
  assert.equal(result.upgrades.INT, 100);
});

test("six level-10 ingredients plus nine upgrades apply the highest level tier at skill 50", () => {
  const plan = planFor("Broadsword");
  plan.materials.forEach((slot, index) => {
    slot.itemId = id(index ? "Bronze" : "Iron");
    slot.level = 10;
    slot.inherit = index > 0 && index < 4;
  });
  plan.upgrades = Array.from({ length: 9 }, () => upgrade("Bronze", 10));
  const result = simulateCrafting(context, plan);
  assert.equal(result.totalLevel, 150);
  assert.equal(result.totalRarity, 57);
  assert.equal(result.levelBonus.ATK, 700);
  assert.equal(result.levelBonus["M.ATK"], 650);
  assert.equal(result.rarityBonus.ATK, 30);
  assert.equal(result.totals.ATK, 735);
  assert.equal(result.totals.DEF, 19);
  assert.equal(
    result.shoppingList.find(({ item }) => item.name === "Bronze").count,
    14,
  );
  plan.skill = 49;
  const locked = simulateCrafting(context, plan);
  assert.equal(locked.levelBonus.ATK, 0);
  assert.equal(locked.rarityBonus.ATK, 0);
});

test("armour level and rarity bonuses affect defence instead of attack", () => {
  const plan = planFor("Round Shield");
  plan.materials.forEach((slot, index) => {
    slot.itemId = id(index ? "Dragonic Stone" : "Bronze");
    slot.level = 10;
    slot.inherit = false;
  });
  plan.upgrades = Array.from({ length: 9 }, () =>
    upgrade("Dragonic Stone", 10),
  );
  const result = simulateCrafting(context, plan);
  assert.equal(result.levelBonus.DEF, 350);
  assert.equal(result.levelBonus["M.DEF"], 350);
  assert.equal(result.rarityBonus.DEF, 800);
  assert.equal(result.levelBonus.ATK, 0);
});

test("missing rarity remains unknown and produces an explicit partial result", () => {
  const plan = planFor("Broadsword");
  plan.upgrades = [upgrade("Holy Spore")];
  const result = simulateCrafting(context, plan);
  assert.ok(result.missingRarity > 0);
  assert.ok(result.warnings.includes("rarity-unknown"));
  assert.equal(result.rarityTier, 0);
  assert.ok(
    createCraftingPage(context, plan, catalog).includes("Teilberechnung"),
  );
});

test("all non-equipment workstations support quantity planning without equipment upgrades", () => {
  for (const station of new Set(
    context.recipes
      .filter((recipe) => !context.isEquipment(recipe))
      .map((recipe) => recipe.station),
  )) {
    const selected = context.recipes.find(
      (recipe) => recipe.station === station && !context.isEquipment(recipe),
    );
    const plan = newCraftingPlan(context, selected.id);
    plan.batch = 7;
    plan.upgrades = [upgrade("Gold")];
    const result = simulateCrafting(context, plan);
    assert.equal(result.equipment, false, station);
    assert.equal(
      result.shoppingList.reduce((sum, entry) => sum + entry.count, 0),
      context.slotsFor(selected).length * 7,
      station,
    );
    assert.equal(result.steps.length, 0);
    assert.equal(result.levelTier, 0);
  }
});

test("invalid saved plans cannot change required ingredients, exceed slot limits or inject records", () => {
  const plan = planFor("Broadsword");
  plan.materials[0] = { itemId: id("Gold Juice"), level: 999, inherit: true };
  plan.upgrades = Array.from({ length: 20 }, () => upgrade("Gold", 0));
  const clean = sanitizeCraftingPlan(context, plan);
  assert.ok(
    context
      .candidates(context.slotsFor(recipe("Broadsword"))[0])
      .some((item) => item.id === clean.materials[0].itemId),
  );
  assert.equal(clean.materials[0].level, 10);
  assert.equal(clean.materials[0].inherit, false);
  assert.equal(clean.upgrades.length, 9);
  assert.ok(clean.upgrades.every((slot) => slot.level === 1));
  assert.ok(newCraftingPlan(context, "invalid").recipeId);
});

test("local plan persistence survives blocked storage and malformed content", () => {
  const plan = planFor("Broadsword");
  assert.equal(
    loadCraftingPlan(context, { getItem: () => "{invalid" }).recipeId,
    plan.recipeId,
  );
  assert.equal(
    saveCraftingPlan(plan, {
      setItem: () => {
        throw Error("blocked");
      },
    }),
    false,
  );
  const saved = {};
  const storage = {
    setItem: (key, value) => (saved[key] = value),
    getItem: (key) => saved[key],
  };
  assert.equal(saveCraftingPlan(plan, storage), true);
  assert.deepEqual(
    loadCraftingPlan(context, storage),
    sanitizeCraftingPlan(context, plan),
  );
});

test("page and material selection work in both languages with all workstations and source links", () => {
  try {
    for (const language of ["de", "en"]) {
      setLanguage(language);
      const page = createCraftingPage(context, planFor("Broadsword"), catalog);
      assert.ok(page.includes('id="craft-simulator"'));
      assert.ok(page.includes('id="craft-basics"'));
      assert.ok(page.includes('data-craft-index="8"'));
      assert.ok(page.includes("https://gamefaqs.gamespot.com/"));
      assert.equal(findCraftMaterial(context, "Gold").name, "Gold");
      assert.equal(findCraftMaterial(context, "Eisen").name, "Iron");
    }
  } finally {
    setLanguage("de");
  }
});
