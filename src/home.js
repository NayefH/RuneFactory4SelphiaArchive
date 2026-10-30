import { escapeHtml } from "./html.js";
import { publicUrl } from "./public-url.js";
import { t, getLanguage, locale } from "./i18n.js";
import { displayName } from "./data-localization.js";

export function createHome(data, assetUrl = publicUrl) {
  const count = (type) =>
    data.records
      .filter((record) => record.type === type)
      .length.toLocaleString(locale());
  const languageQuery = getLanguage() === "en" ? "&lang=en" : "";
  const image = (name, type = "item") => {
    const record = data.records.find(
      (entry) => entry.name === name && entry.type === type,
    );
    return record?.image
      ? `<img src="${escapeHtml(assetUrl(record.image))}" alt="${escapeHtml(displayName(record))} ${t("aus", "from")} Rune Factory 4" loading="lazy">`
      : "";
  };
  return `<div class="home-welcome">
    <img class="home-banner" src="${assetUrl("design/rf4-home.png")}" alt="${t("Lest, Frey und die Bewohner von Selphia – Rune Factory 4 Special", "Lest, Frey and the people of Selphia – Rune Factory 4 Special")}">
    <div class="home-intro"><span class="home-kicker">${t("DAS SELPHIA ARCHIV", "THE SELPHIA ARCHIVE")}</span><h1>${t("Dein Rune Factory 4 Archiv.", "Your Rune Factory 4 archive.")}</h1><p>${t("Die RF4-Datenbank von Nayef Hajjaj: Items vergleichen, Rezepte und ihre Fundorte nachschlagen und die Monster von Rune Factory 4 kennenlernen.", "The RF4 database by Nayef Hajjaj: compare items, look up recipes and their locations, and discover the monsters of Rune Factory 4.")}</p></div>
  </div>
  <form class="home-search" id="home-search-form" role="search">
    <label for="home-query">${t("Was suchst du in Selphia?", "What are you looking for in Selphia?")}</label>
    <div class="home-search-fields"><input id="home-query" name="q" type="search" placeholder="${t("Zum Beispiel Eisen, Wooly oder Trockenes Curry", "For example Iron, Wooly or Dry Curry")}" maxlength="180"><label class="home-scope-label" for="home-scope">${t("Bereich", "Section")}</label><select id="home-scope" name="scope" aria-label="${t("Suchbereich", "Search section")}"><option value="item">Items</option><option value="recipe">${t("Rezepte", "Recipes")}</option><option value="monster">${t("Gegner", "Monsters")}</option></select><button type="submit" class="primary">${t("Suchen", "Search")} <span aria-hidden="true">↗</span></button></div>
  </form>
  <div class="home-categories">
    <a class="home-card" data-tab="item" href="${assetUrl()}?tab=item${languageQuery}"><span class="home-card-image">${image("Turnip")}</span><span><small>${count("item")} ${t("Einträge", "entries")}</small><strong>${t("Items & Materialien", "Items & materials")}</strong><p>${t("Werte, Boni und Verwendung auf einen Blick.", "Stats, bonuses and uses at a glance.")}</p></span><span class="home-arrow" aria-hidden="true">↗</span></a>
    <a class="home-card" data-tab="recipe" href="${assetUrl()}?tab=recipe${languageQuery}"><span class="home-card-image">${image("Cooking Bread")}</span><span><small>${data.recipes.length.toLocaleString(locale())} ${t("Rezeptvarianten", "recipe variants")}</small><strong>${t("Rezepte & Herstellung", "Recipes & crafting")}</strong><p>${t("Zutaten, Werkbänke und bekannte Rezeptfundorte.", "Ingredients, stations and known recipe locations.")}</p></span><span class="home-arrow" aria-hidden="true">↗</span></a>
    <a class="home-card" data-tab="monster" href="${assetUrl()}?tab=monster${languageQuery}"><span class="home-card-image">${image("Wooly", "monster")}</span><span><small>${count("monster")} ${t("Gegner", "monsters")}</small><strong>${t("Das Bestiarium", "The bestiary")}</strong><p>${t("Fundorte, Beute und Kampfwerte entdecken.", "Discover locations, drops and combat stats.")}</p></span><span class="home-arrow" aria-hidden="true">↗</span></a>
  </div>
  <div class="home-guide"><img src="${assetUrl("design/frey-rf4.png")}" alt="${t("Frey aus Rune Factory 4", "Frey from Rune Factory 4")}" class="home-frey" loading="lazy"><div><span class="home-kicker">${t("GUT VORBEREITET NACH SELPHIA", "GET READY FOR SELPHIA")}</span><h2>${t("Das passende Item für deinen nächsten Schritt.", "The right item for your next adventure.")}</h2><p>${t("Sortiere nach einzelnen Attributen oder finde heraus, welche Materialien du für dein nächstes Rezept brauchst. Mit dem Stern sammelst du alles in deiner Merkliste.", "Sort by individual attributes or find the materials you need for your next recipe. Use the star to keep everything in your favorites.")}</p><div class="home-actions"><button class="primary" data-home-bonuses>${t("Boni vergleichen", "Compare bonuses")} <span aria-hidden="true">↗</span></button><button class="home-saved" data-tab="saved">☆ ${t("Deine Merkliste", "Your favorites")}</button></div></div></div>`;
}
