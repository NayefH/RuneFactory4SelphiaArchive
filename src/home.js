import { escapeHtml } from "./html.js";
import { publicUrl } from "./public-url.js";

export function createHome(data, assetUrl = publicUrl) {
  const count = (type) =>
    data.records
      .filter((record) => record.type === type)
      .length.toLocaleString("de-DE");
  const image = (name, type = "item") => {
    const record = data.records.find(
      (entry) => entry.name === name && entry.type === type,
    );
    return record?.image
      ? `<img src="${escapeHtml(assetUrl(record.image))}" alt="${escapeHtml(name)} aus Rune Factory 4" loading="lazy">`
      : "";
  };
  return `<div class="home-welcome">
    <img class="home-banner" src="${assetUrl("design/rf4-home.png")}" alt="Lest, Frey und die Bewohner von Selphia – Rune Factory 4 Special">
    <div class="home-intro"><span class="home-kicker">DAS SELPHIA ARCHIV</span><h1>Dein Rune Factory 4 Archiv.</h1><p>Die RF4-Datenbank von Nayef Hajjaj: Items vergleichen, Rezepte und ihre Fundorte nachschlagen und die Monster von Rune Factory 4 kennenlernen.</p></div>
  </div>
  <form class="home-search" id="home-search-form" role="search">
    <label for="home-query">Was suchst du in Selphia?</label>
    <div class="home-search-fields"><input id="home-query" name="q" type="search" placeholder="Zum Beispiel Iron, Wooly oder Dry Curry" maxlength="180"><label class="home-scope-label" for="home-scope">Bereich</label><select id="home-scope" name="scope" aria-label="Suchbereich"><option value="item">Items</option><option value="recipe">Rezepte</option><option value="monster">Gegner</option></select><button type="submit" class="primary">Suchen <span aria-hidden="true">↗</span></button></div>
  </form>
  <div class="home-categories">
    <a class="home-card" data-tab="item" href="${assetUrl()}?tab=item"><span class="home-card-image">${image("Turnip")}</span><span><small>${count("item")} Einträge</small><strong>Items & Materialien</strong><p>Werte, Boni und Verwendung auf einen Blick.</p></span><span class="home-arrow" aria-hidden="true">↗</span></a>
    <a class="home-card" data-tab="recipe" href="${assetUrl()}?tab=recipe"><span class="home-card-image">${image("Cooking Bread")}</span><span><small>${data.recipes.length.toLocaleString("de-DE")} Rezeptvarianten</small><strong>Rezepte & Herstellung</strong><p>Zutaten, Werkbänke und bekannte Rezeptfundorte.</p></span><span class="home-arrow" aria-hidden="true">↗</span></a>
    <a class="home-card" data-tab="monster" href="${assetUrl()}?tab=monster"><span class="home-card-image">${image("Wooly", "monster")}</span><span><small>${count("monster")} Gegner</small><strong>Das Bestiarium</strong><p>Fundorte, Beute und Kampfwerte entdecken.</p></span><span class="home-arrow" aria-hidden="true">↗</span></a>
  </div>
  <div class="home-guide"><img src="${assetUrl("design/frey-rf4.png")}" alt="Frey aus Rune Factory 4" class="home-frey" loading="lazy"><div><span class="home-kicker">GUT VORBEREITET NACH SELPHIA</span><h2>Das passende Item für deinen nächsten Schritt.</h2><p>Sortiere nach einzelnen Attributen oder finde heraus, welche Materialien du für dein nächstes Rezept brauchst. Mit dem Stern sammelst du alles in deiner Merkliste.</p><div class="home-actions"><button class="primary" data-home-bonuses>Boni vergleichen <span aria-hidden="true">↗</span></button><button class="home-saved" data-tab="saved">☆ Deine Merkliste</button></div></div></div>`;
}
