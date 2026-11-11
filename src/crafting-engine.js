import { categoryGroup, canonicalCategory } from "./categories.js";

export const craftStats = ["ATK", "M.ATK", "DEF", "M.DEF", "STR", "VIT", "INT"];
export const craftingStorageKey = "rf4-crafting-v1";
export const craftingSources = {
  rules:
    "https://gamefaqs.gamespot.com/boards/323550-rune-factory-4-special/67717309",
  bonuses: "https://therunefactory.fandom.com/wiki/Upgrading_Items_(RF4)",
  tiers: "https://steamcommunity.com/sharedfiles/filedetails/?id=2688288557",
};
const levelTiers = [
  [30, 10, 5, 6, 5],
  [60, 25, 10, 15, 12],
  [90, 70, 40, 36, 28],
  [120, 200, 180, 180, 170],
  [150, 700, 650, 350, 350],
];
const rarityTiers = [
  [25, 10, 3],
  [50, 30, 10],
  [75, 80, 20],
  [100, 150, 50],
  [125, 300, 90],
  [150, 500, 150],
  [175, 1000, 400],
  [200, 2000, 800],
];
const specialNames = new Set(["Object X", "Double Steel", "10-Fold Steel"]);
const ingredientAliases = {
  "Holy Spores": ["Holy Spore"],
  "Blue Giant's Gloves": ["Blue Giant's Glove"],
  "Cloth and skin": ["Cloths and Skins"],
  Milk: ["Milk (S)", "Milk (M)", "Milk (L)"],
  Egg: ["Egg (S)", "Egg (M)", "Egg (L)"],
};
const knownRarity = { "Double Steel": 5, "10-Fold Steel": 10, "Light Ore": 13 };
export const materialRarity = (item) =>
  Number.isFinite(item?.rarity) ? item.rarity : knownRarity[item?.name];
export const clampLevel = (value, max = 10) =>
  Math.max(1, Math.min(max, Math.trunc(Number(value) || 1)));
const statValues = (record, context) =>
  Object.fromEntries(
    craftStats.map((key) => [
      key,
      Number.isFinite(record?.attributes?.[context]?.[key])
        ? record.attributes[context][key]
        : 0,
    ]),
  );
const add = (target, values) => {
  for (const key of craftStats) target[key] += values[key] || 0;
};
const emptyStats = () => Object.fromEntries(craftStats.map((key) => [key, 0]));

export function createCraftingContext(data) {
  // Material-group records are placeholders, not usable physical ingredients.
  const items = data.records.filter(
    (record) =>
      record.type === "item" &&
      record.category !== "Materialgruppen" &&
      !Object.hasOwn(data.materialGroups, record.name),
  );
  const byId = new Map(items.map((item) => [item.id, item]));
  const byName = new Map(items.map((item) => [item.name, item]));
  const recipes = data.recipes;
  const recipesById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const slotsFor = (recipe) =>
    recipe.ingredientSlots ||
    recipe.ingredients.map((name) => ({
      label: name,
      options: name.split(" / "),
    }));
  const candidates = (slot) =>
    items
      .filter((item) =>
        slot.options
          .flatMap((name) => ingredientAliases[name] || [name])
          .some(
            (name) =>
              item.name === name ||
              canonicalCategory(item.category) === canonicalCategory(name),
          ),
      )
      .sort(
        (a, b) =>
          (Number.isFinite(Number(a.difficulty))
            ? Number(a.difficulty)
            : Infinity) -
            (Number.isFinite(Number(b.difficulty))
              ? Number(b.difficulty)
              : Infinity) || a.name.localeCompare(b.name),
      );
  const isEquipment = (recipe) =>
    ["Schmiede", "Fertigungstisch"].includes(recipe.station) &&
    ["weapons", "equipment", "tools"].includes(categoryGroup(recipe.category));
  return {
    items,
    byId,
    byName,
    recipes,
    recipesById,
    slotsFor,
    candidates,
    isEquipment,
  };
}

export function newCraftingPlan(context, recipeId) {
  const recipe =
    context.recipesById.get(recipeId) ||
    context.recipes.find((r) => r.name === "Broadsword") ||
    context.recipes[0];
  if (!recipe) return null;
  const required = context.slotsFor(recipe);
  return {
    recipeId: recipe.id,
    skill: 50,
    batch: 1,
    materials: Array.from({ length: 6 }, (_, index) => ({
      itemId:
        index < required.length
          ? context.candidates(required[index])[0]?.id || ""
          : "",
      level: 1,
      inherit:
        context.isEquipment(recipe) && index < Math.max(0, required.length - 3),
    })),
    upgrades: Array.from({ length: 9 }, () => ({ itemId: "", level: 1 })),
  };
}

export function sanitizeCraftingPlan(context, value) {
  const plan = newCraftingPlan(context, value?.recipeId);
  if (!plan) return null;
  // An unknown recipe cannot supply a material plan for the fallback recipe.
  if (!context.recipesById.has(value?.recipeId)) return plan;
  const recipe = context.recipesById.get(plan.recipeId);
  const required = context.slotsFor(recipe);
  const equipment = context.isEquipment(recipe);
  plan.skill = clampLevel(value.skill, 99);
  plan.batch = equipment ? 1 : clampLevel(value.batch, 99);
  let inherited = 0,
    inheritedRequired = 0;
  plan.materials = plan.materials.map((fallback, index) => {
    const incoming = value.materials?.[index];
    if (!incoming) return fallback;
    let itemId = context.byId.has(incoming.itemId) ? incoming.itemId : "";
    if (!equipment && index >= required.length) itemId = "";
    if (
      index < required.length &&
      !context.candidates(required[index]).some((item) => item.id === itemId)
    )
      itemId = fallback.itemId;
    const eligible =
      index >= required.length ||
      (required.length >= 4 && inheritedRequired < required.length - 3);
    const inherit = Boolean(
      equipment && itemId && eligible && incoming.inherit && inherited < 3,
    );
    if (inherit) {
      inherited++;
      if (index < required.length) inheritedRequired++;
    }
    return { itemId, level: clampLevel(incoming.level), inherit };
  });
  plan.upgrades = plan.upgrades.map((_, index) => ({
    itemId:
      equipment && context.byId.has(value.upgrades?.[index]?.itemId)
        ? value.upgrades[index].itemId
        : "",
    level: clampLevel(value.upgrades?.[index]?.level),
  }));
  const occupied = plan.upgrades.filter((slot) => slot.itemId);
  plan.upgrades = [
    ...occupied,
    ...Array.from({ length: 9 - occupied.length }, () => ({
      itemId: "",
      level: 1,
    })),
  ];
  return plan;
}

export function loadCraftingPlan(context, storage) {
  try {
    return sanitizeCraftingPlan(
      context,
      JSON.parse(storage?.getItem(craftingStorageKey)),
    );
  } catch {
    return newCraftingPlan(context);
  }
}

export function saveCraftingPlan(plan, storage) {
  try {
    storage?.setItem(craftingStorageKey, JSON.stringify(plan));
    return Boolean(storage);
  } catch {
    return false;
  }
}

export function simulateCrafting(context, value) {
  const plan = sanitizeCraftingPlan(context, value);
  if (!plan) return null;
  const recipe = context.recipesById.get(plan.recipeId);
  const item = context.byName.get(recipe.name);
  const equipment = context.isEquipment(recipe);
  const base = statValues(item, "base");
  const creation = emptyStats(),
    upgrades = emptyStats();
  const warnings = new Set();
  const requiredCount = context.slotsFor(recipe).length;
  if (
    equipment &&
    !craftStats.some((key) => Number.isFinite(item?.attributes?.base?.[key]))
  )
    warnings.add("missing-base");
  const selected = plan.materials.filter((slot) => slot.itemId);
  if (plan.materials.slice(0, requiredCount).some((slot) => !slot.itemId))
    warnings.add("missing-materials");
  if (equipment && (selected.length - requiredCount > 3 || requiredCount >= 4))
    warnings.add("inheritance");
  for (const slot of plan.materials.filter(
    (slot) => slot.inherit && slot.itemId,
  )) {
    const material = context.byId.get(slot.itemId);
    if (specialNames.has(material.name) || material.attributes?.base)
      warnings.add("creation-special");
    else add(creation, statValues(material, "upgrade"));
  }
  let reverse = false,
    previous;
  const used = new Map(),
    usedSteel = new Set(),
    steps = [];
  for (const [index, slot] of plan.upgrades.entries()) {
    const material = context.byId.get(slot.itemId);
    if (!material) continue;
    const delta = emptyStats();
    let multiplier = 1,
      rule = "normal";
    if (material.name === "Object X") {
      reverse = !reverse;
      previous = undefined;
      rule = reverse ? "reverse-on" : "reverse-off";
    } else if (["Double Steel", "10-Fold Steel"].includes(material.name)) {
      rule = "steel";
      if (usedSteel.has(material.name) || !previous) {
        rule = "steel-inactive";
        warnings.add("steel-inactive");
      } else {
        multiplier = material.name === "Double Steel" ? 2 : 8;
        for (const key of craftStats) delta[key] = previous[key] * multiplier;
      }
      usedSteel.add(material.name);
      reverse = false;
      previous = undefined;
    } else {
      const count = used.get(material.id) || 0;
      multiplier = (reverse ? -1 : 1) / 2 ** count;
      rule = reverse ? "reversed" : count ? "repeated" : "normal";
      previous = statValues(material, "upgrade");
      for (const key of craftStats)
        delta[key] = Math.trunc(previous[key] * multiplier);
      used.set(material.id, count + 1);
      if (
        !material.attributes?.upgrade ||
        !craftStats.some((key) =>
          Object.hasOwn(material.attributes.upgrade, key),
        )
      )
        warnings.add("special-effects");
    }
    add(upgrades, delta);
    steps.push({ index, material, delta, multiplier, rule });
  }
  const allMaterials = [
    ...selected,
    ...plan.upgrades.filter((slot) => slot.itemId),
  ];
  const totalLevel = allMaterials.reduce((sum, slot) => sum + slot.level, 0);
  const missingRarity = allMaterials.filter(
    (slot) => !Number.isFinite(materialRarity(context.byId.get(slot.itemId))),
  ).length;
  const totalRarity = allMaterials.reduce(
    (sum, slot) => sum + (materialRarity(context.byId.get(slot.itemId)) || 0),
    0,
  );
  const weapon =
    recipe.station === "Schmiede" ||
    (canonicalCategory(recipe.category) === "Accessoires" &&
      /Gloves|Earring/i.test(recipe.name));
  const levelBonus = emptyStats(),
    rarityBonus = emptyStats();
  const unlocked = equipment && plan.skill >= 50;
  const levelTier =
    unlocked && !warnings.has("missing-materials")
      ? levelTiers.findLast((tier) => totalLevel >= tier[0])
      : undefined;
  const rarityTier =
    unlocked && !missingRarity && !warnings.has("missing-materials")
      ? rarityTiers.findLast((tier) => totalRarity >= tier[0])
      : undefined;
  if (levelTier) {
    if (weapon) {
      levelBonus.ATK = levelTier[1];
      levelBonus["M.ATK"] = levelTier[2];
    } else {
      levelBonus.DEF = levelTier[3];
      levelBonus["M.DEF"] = levelTier[4];
    }
  }
  if (rarityTier) {
    if (canonicalCategory(recipe.category) === "Stäbe") {
      if (rarityTier[0] >= 175)
        rarityBonus["M.ATK"] = rarityTier[0] === 200 ? 1800 : 950;
      else warnings.add("staff-rarity");
    } else rarityBonus[weapon ? "ATK" : "DEF"] = rarityTier[weapon ? 1 : 2];
  }
  if (missingRarity && unlocked) warnings.add("rarity-unknown");
  if (plan.skill < recipe.level) warnings.add("skill-low");
  const totals = { ...base };
  for (const values of [creation, upgrades, levelBonus, rarityBonus])
    add(totals, values);
  const shopping = new Map();
  for (const slot of allMaterials) {
    const material = context.byId.get(slot.itemId);
    const previous = shopping.get(material.id);
    shopping.set(material.id, {
      item: material,
      count: (previous?.count || 0) + plan.batch,
    });
  }
  const shoppingList = [...shopping.values()];
  const buyKnown = shoppingList.every(({ item }) => Number.isFinite(item.buy));
  const buyTotal = buyKnown
    ? shoppingList.reduce((sum, { item, count }) => sum + item.buy * count, 0)
    : undefined;
  return {
    plan,
    recipe,
    item,
    equipment,
    shoppingList,
    buyTotal,
    base,
    creation,
    upgrades,
    levelBonus,
    rarityBonus,
    totals,
    totalLevel,
    totalRarity,
    missingRarity,
    levelTier: levelTier?.[0] || 0,
    rarityTier: rarityTier?.[0] || 0,
    equipmentLevel: 1 + steps.length,
    steps,
    warnings: [...warnings],
    unlocked,
  };
}
