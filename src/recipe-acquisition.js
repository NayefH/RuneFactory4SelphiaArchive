import { t } from "./i18n.js";
import { localizeText } from "./data-localization.js";

/** Recipes may have several ways to learn them, shared by ingredient variants. */
export function indexRecipeAcquisitions(recipes) {
  const byName = new Map();
  for (const recipe of recipes) {
    const entries = byName.get(recipe.name) || new Map();
    for (const entry of recipe.acquisition || []) {
      const key = JSON.stringify([
        entry.location,
        entry.description,
        entry.source,
      ]);
      entries.set(key, entry);
    }
    byName.set(recipe.name, entries);
  }
  return new Map(
    [...byName].map(([name, entries]) => [name, [...entries.values()]]),
  );
}

export function acquisitionSearchTerms(entries) {
  return entries.flatMap(({ location, description, kind }) => [
    location,
    description,
    kind,
  ]);
}

export function acquisitionPanel(entries, escapeHtml) {
  if (!entries.length) return "";
  return `<h3>${t("Rezept finden / lernen", "Find / learn this recipe")}</h3><ul class="acquisition-list">${entries
    .map(
      (entry) =>
        `<li><strong class="acquisition-location">${escapeHtml(localizeText(entry.location))}</strong><p>${escapeHtml(localizeText(entry.description))}</p><a class="acquisition-source" href="${escapeHtml(entry.source)}" target="_blank" rel="noreferrer">${escapeHtml(entry.sourceTitle ? localizeText(entry.sourceTitle) : t("Fundortquelle", "Location source"))} ↗</a></li>`,
    )
    .join("")}</ul>`;
}
