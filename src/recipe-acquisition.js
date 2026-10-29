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
  return `<h3>Rezept finden / lernen</h3><ul class="acquisition-list">${entries
    .map(
      (entry) =>
        `<li><strong class="acquisition-location">${escapeHtml(entry.location)}</strong><p>${escapeHtml(entry.description)}</p><a class="acquisition-source" href="${escapeHtml(entry.source)}" target="_blank" rel="noreferrer">${escapeHtml(entry.sourceTitle || "Fundortquelle")} ↗</a></li>`,
    )
    .join("")}</ul>`;
}
