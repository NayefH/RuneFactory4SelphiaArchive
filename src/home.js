import { escapeHtml } from "./html.js";
import { publicUrl } from "./public-url.js";
import { t, getLanguage, locale } from "./i18n.js";
import { displayName } from "./data-localization.js";
import { categoriesFor, categoryOptions } from "./categories.js";

export function createHome(data, assetUrl = publicUrl) {
  const count = (type) =>
    data.records
      .filter((record) => record.type === type)
      .length.toLocaleString(locale());
  const languageQuery = getLanguage() === "en" ? "&lang=en" : "";
  const items = data.records.filter((record) => record.type === "item");
  const categoryLink = (tab, label, group = "", category = "", count) => {
    const params = new URLSearchParams({ tab, lang: getLanguage() });
    if (group) params.set("group", group);
    if (category) params.set("category", category);
    return `<a class="category-chip" data-tab="${tab}" data-group="${group}" data-category="${escapeHtml(category)}" href="${assetUrl()}?${escapeHtml(params.toString())}">${escapeHtml(label)}${count === undefined ? "" : `<span>${count}</span>`}</a>`;
  };
  const shortcuts = [
    [
      t("Waffen", "Weapons"),
      t("Direkt nach Waffentyp auswählen.", "Choose a weapon type."),
      "item",
      "weapons",
    ],
    [
      t("Rezepte", "Recipes"),
      t("Nach Herstellung vorfiltern.", "Filter by crafting discipline."),
      "recipe",
      "",
    ],
    [
      t("Ausrüstung & Accessoires", "Equipment & accessories"),
      t(
        "Passende Ausrüstung schneller finden.",
        "Find the equipment you need.",
      ),
      "item",
      "equipment",
    ],
  ]
    .map(([title, description, tab, group]) => {
      const links =
        tab === "recipe"
          ? [
              [t("Waffen schmieden", "Forge weapons"), "weapons", ""],
              [
                t("Accessoires herstellen", "Craft accessories"),
                "equipment",
                "Accessoires",
              ],
              [t("Kochen", "Cooking"), "cooking", ""],
              [t("Alchemie", "Chemistry"), "chemistry", ""],
              [t("Alle Rezepte", "All recipes"), "", ""],
            ]
              .map(([label, section, category]) =>
                categoryLink(tab, label, section, category),
              )
              .join("")
          : categoryLink(tab, t("Alle", "All") + " · " + title, group) +
            categoriesFor(items, group)
              .map((category) =>
                categoryLink(
                  tab,
                  category.label,
                  group,
                  category.value,
                  category.count,
                ),
              )
              .join("");
      return `<article class="home-shortcut"><h3>${title}</h3><p>${description}</p><div class="category-chips">${links}</div></article>`;
    })
    .join("");
  const image = (name, type = "item") => {
    const record = data.records.find(
      (entry) => entry.name === name && entry.type === type,
    );
    return record?.image
      ? `<img src="${escapeHtml(assetUrl(record.image))}" alt="${escapeHtml(displayName(record))} ${t("aus", "from")} Rune Factory 4" loading="lazy">`
      : "";
  };
  return `<div class="home-welcome">
    <div class="home-intro"><span class="home-kicker">${t("DAS SELPHIA ARCHIV", "THE SELPHIA ARCHIVE")}</span><h1>${t("Dein Rune Factory 4 Archiv.", "Your Rune Factory 4 archive.")}</h1><p>${t("Die RF4-Datenbank von Nayef Hajjaj: Items vergleichen, Rezepte und ihre Fundorte nachschlagen und die Monster von Rune Factory 4 kennenlernen.", "The RF4 database by Nayef Hajjaj: compare items, look up recipes and their locations, and discover the monsters of Rune Factory 4.")}</p></div>
    <img class="home-banner" src="${assetUrl("design/rf4-home.png")}" alt="${t("Lest, Frey und die Bewohner von Selphia – Rune Factory 4 Special", "Lest, Frey and the people of Selphia – Rune Factory 4 Special")}">
  </div>
  <form class="home-search" id="home-search-form" role="search">
    <label for="home-query">${t("Das Archiv durchsuchen", "Search the archive")}</label>
    <div class="home-search-fields"><input id="home-query" name="q" type="search" placeholder="${t("Zum Beispiel Eisen, Wooly oder Trockenes Curry", "For example Iron, Wooly or Dry Curry")}" maxlength="180"><label class="home-scope-label" for="home-scope">${t("Bereich", "Section")}</label><select id="home-scope" name="scope" aria-label="${t("Suchbereich", "Search section")}"><option value="item">Items</option><option value="recipe">${t("Rezepte", "Recipes")}</option><option value="monster">${t("Gegner", "Monsters")}</option></select><button type="submit" class="primary">${t("Suchen", "Search")} <span aria-hidden="true">↗</span></button></div>
    <div class="home-category-field"><label for="home-category">${t("Kategorie vorab wählen", "Choose a category first")}</label><select id="home-category" name="category">${categoryOptions(items)}</select></div>
  </form>
  <section class="home-shortcuts" aria-labelledby="home-shortcuts-title"><h2 id="home-shortcuts-title">${t("Direkt zur passenden Kategorie", "Go straight to your category")}</h2><p>${t("Waffen, Rezepte und Accessoires mit einem Klick vorfiltern – auch ohne Suchbegriff.", "Filter weapons, recipes and accessories in one click, with or without a search term.")}</p><div class="home-shortcut-grid">${shortcuts}</div></section>
  <section class="home-directory" aria-labelledby="archive-sections-title">
    <h2 id="archive-sections-title">${t("Inhaltsverzeichnis", "Contents")}</h2>
    <div class="home-categories">
      <a class="home-card" data-tab="item" href="${assetUrl()}?tab=item${languageQuery}"><span class="home-card-image">${image("Turnip")}</span><span class="home-card-copy"><strong>${t("Items & Materialien", "Items & materials")}</strong><p>${t("Werte, Boni und Verwendung auf einen Blick.", "Stats, bonuses and uses at a glance.")}</p></span><small class="home-card-count">${count("item")} ${t("Einträge", "entries")}</small><span class="home-arrow" aria-hidden="true">↗</span></a>
      <a class="home-card" data-tab="recipe" href="${assetUrl()}?tab=recipe${languageQuery}"><span class="home-card-image">${image("Cooking Bread")}</span><span class="home-card-copy"><strong>${t("Rezepte & Herstellung", "Recipes & crafting")}</strong><p>${t("Zutaten, Werkbänke und bekannte Rezeptfundorte.", "Ingredients, stations and known recipe locations.")}</p></span><small class="home-card-count">${data.recipes.length.toLocaleString(locale())} ${t("Rezeptvarianten", "recipe variants")}</small><span class="home-arrow" aria-hidden="true">↗</span></a>
      <a class="home-card" data-tab="monster" href="${assetUrl()}?tab=monster${languageQuery}"><span class="home-card-image">${image("Wooly", "monster")}</span><span class="home-card-copy"><strong>${t("Das Bestiarium", "The bestiary")}</strong><p>${t("Fundorte, Beute und Kampfwerte entdecken.", "Discover locations, drops and combat stats.")}</p></span><small class="home-card-count">${count("monster")} ${t("Gegner", "monsters")}</small><span class="home-arrow" aria-hidden="true">↗</span></a>
    </div>
  </section>`;
}
