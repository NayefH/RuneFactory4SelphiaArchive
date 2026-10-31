import { bonus } from "./attributes.js";
import { displayName, localizeText } from "./data-localization.js";
import { locale } from "./i18n.js";
import { canonicalCategory, categoryGroup } from "./categories.js";
import {
  acquisitionSearchTerms,
  indexRecipeAcquisitions,
} from "./recipe-acquisition.js";

export function normalizeSearch(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ß", "ss");
}

export function recipeUsesItem(recipe, name) {
  if (recipe.ingredientSlots) {
    return recipe.ingredientSlots.some((slot) => slot.options.includes(name));
  }
  return recipe.ingredients.includes(name);
}

/** Index the catalog once so keystrokes do not repeatedly scan every item. */
export function createCatalog(dataset) {
  const recipeAcquisitions = indexRecipeAcquisitions(dataset.recipes);
  const getAcquisitions = (record) =>
    record.type === "monster" ? [] : recipeAcquisitions.get(record.name) || [];
  const allRecords = [...dataset.records, ...dataset.recipes];
  const byId = new Map(allRecords.map((record) => [record.id, record]));
  const itemsByName = new Map(
    dataset.records
      .filter((record) => record.type === "item")
      .map((record) => [record.name, record]),
  );
  const getItem = (name) => itemsByName.get(name);
  const searchIndex = new Map(
    allRecords.map((record) => {
      const materials =
        record.ingredientSlots?.flatMap((slot) => slot.options) ||
        record.ingredients ||
        [];
      const linkedNames = [...materials, ...(record.drops || [])];
      const terms = [
        record.name,
        record.de,
        getItem(record.name)?.de,
        ...(record.aliases || []),
        record.category,
        dataset.materialGroups[record.category],
        record.location,
        ...acquisitionSearchTerms(getAcquisitions(record)),
        record.station,
        record.effects,
        JSON.stringify(record.attributeText || {}),
        record.favorite,
        record.produce,
        ...linkedNames.flatMap((name) => [name, getItem(name)?.de]),
      ];
      const bilingualTerms = terms
        .filter(Boolean)
        .flatMap((term) => [
          term,
          localizeText(term, "de"),
          localizeText(term, "en"),
        ]);
      bilingualTerms.push(displayName(record, "de"), displayName(record, "en"));
      return [record.id, normalizeSearch(bilingualTerms.join(" "))];
    }),
  );

  function list(tab, favoriteIds) {
    if (tab === "saved")
      return allRecords.filter((record) => favoriteIds.has(record.id));
    if (tab === "recipe") return dataset.recipes;
    return dataset.records.filter((record) => record.type === tab);
  }

  function select(filters, favoriteIds) {
    const terms = normalizeSearch(filters.query.trim())
      .split(/\s+/)
      .filter(Boolean);
    const compareBonus = filters.sort.startsWith("bonus");
    const selected = list(filters.tab, favoriteIds).filter((record) => {
      if (filters.group && categoryGroup(record.category) !== filters.group)
        return false;
      if (
        filters.category &&
        canonicalCategory(record.category) !==
          canonicalCategory(filters.category)
      )
        return false;
      if (filters.station && record.station !== filters.station) return false;
      if (record.station && record.level > filters.maxRecipeLevel) return false;
      if (!terms.every((term) => searchIndex.get(record.id).includes(term)))
        return false;
      return (
        !compareBonus ||
        bonus(record, filters.attributeContext, filters.attribute) !== undefined
      );
    });

    return selected.sort((first, second) => {
      const compareNames = () =>
        displayName(first).localeCompare(displayName(second), locale());
      if (compareBonus) {
        const difference =
          bonus(second, filters.attributeContext, filters.attribute) -
          bonus(first, filters.attributeContext, filters.attribute);
        return (
          difference * (filters.sort === "bonus-asc" ? -1 : 1) || compareNames()
        );
      }
      if (filters.sort === "level")
        return (
          (first.level ?? Infinity) - (second.level ?? Infinity) ||
          compareNames()
        );
      return compareNames() * (filters.sort === "name-desc" ? -1 : 1);
    });
  }

  return { allRecords, byId, getItem, getAcquisitions, list, select };
}
