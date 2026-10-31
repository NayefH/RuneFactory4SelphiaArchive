import { t, locale } from "./i18n.js";
import { localizeText } from "./data-localization.js";
import { escapeHtml } from "./html.js";

const aliases = {
  "Short Sword": "Kurzschwerter",
  Spear: "Speere",
  Shield: "Schilde",
  Accessories: "Accessoires",
  Headgear: "Kopfbedeckungen",
};
export const canonicalCategory = (category) => aliases[category] || category;
const groups = [
  [
    "weapons",
    "Waffen",
    "Weapons",
    [
      "Kurzschwerter",
      "Langschwerter",
      "Speere",
      "Äxte",
      "Hämmer",
      "Doppelklingen",
      "Handschuhe",
      "Stäbe",
    ],
  ],
  [
    "equipment",
    "Ausrüstung & Accessoires",
    "Equipment & accessories",
    ["Accessoires", "Schilde", "Kopfbedeckungen", "Rüstungen", "Schuhe"],
  ],
  ["cooking", "Kochen", "Cooking", ["Kochen"]],
  ["chemistry", "Alchemie", "Chemistry", ["Alchemie", "Medicine"]],
  [
    "tools",
    "Werkzeuge",
    "Tools",
    [
      "Hacken",
      "Gießkannen",
      "Sicheln",
      "Äxte (Werkzeug)",
      "Hämmer (Werkzeug)",
      "Angeln",
      "Tools",
    ],
  ],
];
export function categoryGroup(category) {
  return (
    groups.find((group) =>
      group[3].includes(canonicalCategory(category)),
    )?.[0] || "other"
  );
}
export function categoryGroups(records) {
  return [...groups, ["other", "Weitere Kategorien", "Other categories", []]]
    .map(([id, de, en]) => ({
      id,
      label: t(de, en),
      count: records.filter((record) => categoryGroup(record.category) === id)
        .length,
    }))
    .filter((group) => group.count);
}
export function categoriesFor(records, group = "") {
  const counts = new Map();
  for (const record of records) {
    if (group && categoryGroup(record.category) !== group) continue;
    const category = canonicalCategory(record.category);
    if (category) counts.set(category, (counts.get(category) || 0) + 1);
  }
  return [...counts]
    .map(([value, count]) => ({ value, count, label: localizeText(value) }))
    .sort((a, b) => a.label.localeCompare(b.label, locale()));
}
export function categoryOptions(records) {
  return (
    `<option value="">${t("Alle Kategorien", "All categories")}</option>` +
    categoryGroups(records)
      .map(
        (group) =>
          `<optgroup label="${escapeHtml(group.label)}"><option value="group:${group.id}">${t("Alle", "All")} · ${escapeHtml(group.label)} (${group.count})</option>${categoriesFor(
            records,
            group.id,
          )
            .map(
              (category) =>
                `<option value="category:${escapeHtml(category.value)}">${escapeHtml(category.label)} (${category.count})</option>`,
            )
            .join("")}</optgroup>`,
      )
      .join("")
  );
}
