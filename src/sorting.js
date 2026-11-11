import { t, locale } from "./i18n.js";

const itemTabs = ["item", "saved"];
const recipeTabs = ["recipe", "saved"];
const numericFields = {
  level: "level",
  "level-desc": "level",
  "buy-asc": "buy",
  "buy-desc": "buy",
  "sell-asc": "sell",
  "sell-desc": "sell",
  "difficulty-asc": "difficulty",
  "difficulty-desc": "difficulty",
};

export function sortOptions(tab) {
  const options = [
    { value: "name", label: "Name A–Z" },
    { value: "name-desc", label: "Name Z–A" },
    { value: "category", label: t("Kategorie", "Category") },
  ];
  if (recipeTabs.includes(tab)) {
    options.push(
      { value: "level", label: t("Rezeptlevel ↑", "Recipe level ↑") },
      { value: "level-desc", label: t("Rezeptlevel ↓", "Recipe level ↓") },
    );
  }
  if (itemTabs.includes(tab)) {
    for (const [field, label] of [
      ["sell", t("Verkaufspreis", "Sell price")],
      ["buy", t("Kaufpreis", "Buy price")],
      ["difficulty", t("Upgrade-Schwierigkeit", "Upgrade difficulty")],
      ["bonus", t("Attributbonus", "Attribute bonus")],
    ]) {
      options.push(
        { value: `${field}-desc`, label: `${label} ↓` },
        { value: `${field}-asc`, label: `${label} ↑` },
      );
    }
  }
  return options;
}

export function normalizeSort(sort, tab) {
  return sortOptions(tab).some((option) => option.value === sort)
    ? sort
    : "name";
}

export const isNumericSort = (sort) => Object.hasOwn(numericFields, sort);

export function numericSortValue(record, sort) {
  const field = numericFields[sort];
  // Prices and upgrade difficulty belong to items; recipe level to recipes.
  if (!field || (field === "level" ? !record.station : record.type !== "item"))
    return undefined;
  const value = record[field];
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value.trim()))
    return Number(value);
  return undefined;
}

export function sortValueLabel(record, sort) {
  if (!isNumericSort(sort)) return "";
  const field = numericFields[sort];
  const label = {
    level: t("Rezeptlevel", "Recipe level"),
    buy: t("Kaufpreis", "Buy price"),
    sell: t("Verkaufspreis", "Sell price"),
    difficulty: t("Upgrade-Schwierigkeit", "Upgrade difficulty"),
  }[field];
  const value = numericSortValue(record, sort);
  return `${label}: ${value === undefined ? t("Nicht erfasst", "Not recorded") : value.toLocaleString(locale()) + (["buy", "sell"].includes(field) ? " G" : "")}`;
}
