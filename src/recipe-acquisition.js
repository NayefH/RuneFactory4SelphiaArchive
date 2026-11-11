import { t } from "./i18n.js";
import { localizeText } from "./data-localization.js";

// Normal recipe bread teaches levels up to and including 80. Higher recipes
// need Bread+ from Sharance Maze unless a separate recipe source is documented.
// https://www.neoseeker.com/rune-factory-4/faqs/758373-recipe.html
export function isSharanceExclusiveRecipe(
  record,
  entries = record.acquisition || [],
) {
  return Boolean(
    record.station &&
    Number.isFinite(record.level) &&
    record.level > 80 &&
    !entries.some(
      (entry) =>
        !/sharance (?:maze|labyrinth)|sharance-labyrinth/i.test(
          entry.location || "",
        ),
    ),
  );
}

export function sharanceRecipeBadge() {
  return `<span class="sharance-badge" title="${t("Rezeptbrot+ aus Sharance Maze; kein anderer Rezeptfundort erfasst.", "Recipe Bread+ from Sharance Maze; no other recipe location recorded.")}"><span aria-hidden="true">◆</span> Sharance Maze · ${t("Rezeptbrot+", "Recipe Bread+")}</span>`;
}

export function sharanceRecipePanel() {
  return `<section class="sharance-note">${sharanceRecipeBadge()}<p>${t("Dieses Rezept wird über Rezeptbrot+ von den Endbossen in Sharance Maze gelernt. Für diese Rezeptvariante ist kein alternativer Rezeptfundort erfasst.", "Learn this recipe using Recipe Bread+ from the final bosses in Sharance Maze. No alternative recipe location is recorded for this recipe variant.")}</p><p>${t("Die goldene Markierung ergibt sich aus dem Rezeptlevel über 80 und den erfassten Fundorten. Herstellung ohne gelerntes Rezept ist mit ausreichend RP weiterhin möglich.", "The gold marking is based on a recipe level above 80 and the recorded locations. Crafting without a learned recipe is still possible with enough RP.")}</p><a href="https://www.neoseeker.com/rune-factory-4/faqs/758373-recipe.html" target="_blank" rel="noreferrer">${t("Quelle: Rezeptbrot-Regeln (RF4)", "Source: recipe bread rules (RF4)")} ↗</a></section>`;
}

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
