import { escapeHtml as esc } from "./html.js";
import { t, getLanguage } from "./i18n.js";
import { displayName, localizeText } from "./data-localization.js";
import { publicUrl } from "./public-url.js";

export const tamingSource =
  "https://therunefactory.fandom.com/wiki/Monsters_(RF4)";
export const cropSource =
  "https://therunefactory.fandom.com/wiki/Crops_(RF4)#Giant_Crops";

// Explicit allowlist: a monster's favorite gifts do not imply it is tameable.
export const bossGroups = [
  {
    names: ["Ambrosia"],
    items: [
      "Ultra Toyherb",
      "King Pink Cat",
      "Great Charm Blue",
      "Ultra Moondrop Flower",
    ],
    phase: "ambrosia",
  },
  { names: ["Thunderbolt"], items: ["Royal Carrot"] },
  {
    names: ["Marionetta"],
    items: ["Cake", "Chocolate Cake", "Cheesecake", "Apple Pie"],
  },
  {
    names: ["Sarcophagus"],
    items: ["Gold Juice", "Mixed Juice", "Mixed Smoothie"],
  },
  { names: ["Terraclone", "Terrable"], items: ["Turnip Heaven"] },
  { names: ["Fiergaenger", "Fiersome"], items: ["Gold Juice"] },
  { names: ["Aquameleon", "Aquaticus"], items: ["Union Stew"] },
  {
    names: ["Grimoire"],
    items: [
      "Golden Tyrant Turnip",
      "Gold Prince Potato",
      "Gldn. Doom Pumpkin",
      "Golden King Cabbage",
    ],
  },
  { names: ["Bane Dragon"], items: ["Rockfish Stew"] },
  {
    names: ["Octopirate"],
    items: ["Grilled Snapper", "Grilled G. Snapper", "Grilled L. Snapper"],
  },
  { names: ["Crystal Mammoth"], items: ["King Pineapple"] },
  {
    names: ["Hinoe", "Kinoto"],
    items: ["Salted Char", "Grilled G. Snapper", "Grilled L. Snapper"],
  },
  { names: ["Siren"], items: ["Great 4-Leaf Clover"] },
  { names: ["Death Wall"], items: ["Ice Cream"], phase: "death-wall" },
  { names: ["Chimera"], items: ["Royal Curry", "Ultimate Curry"] },
  { names: ["Greater Demon"], items: ["Big Fireflower", "Big Autumn Grass"] },
  { names: ["G Golem"], items: ["Orichalcum"] },
  { names: ["Dead Tree"], items: ["Formula C", "Greenifier+"] },
  { names: ["Emerald"], items: ["Big Green Crystal"] },
  { names: ["Olive"], items: ["Big White Crystal"] },
  { names: ["Rouge"], items: ["Big Red Crystal"] },
  { names: ["Marin"], items: ["Big Blue Crystal"] },
];

export const giantCrops = {
  "Ultra Toyherb": "Toyherb",
  "King Pink Cat": "Pink Cat",
  "Great Charm Blue": "Charm Blue",
  "Ultra Moondrop Flower": "Moondrop Flower",
  "Royal Carrot": "Carrot",
  "King Pineapple": "Pineapple",
  "Golden Tyrant Turnip": "Golden Turnip",
  "Gold Prince Potato": "Golden Potato",
  "Gldn. Doom Pumpkin": "Golden Pumpkin",
  "Golden King Cabbage": "Golden Cabbage",
  "Great 4-Leaf Clover": "4-Leaf Clover",
  "Big Fireflower": "Fireflower",
  "Big Autumn Grass": "Autumn Grass",
  "Big Green Crystal": "Green Crystal",
  "Big White Crystal": "White Crystal",
  "Big Red Crystal": "Red Crystal",
  "Big Blue Crystal": "Blue Crystal",
};

export const untameableBosses = [
  "Ancient Bone",
  "Rafflesia",
  "Sano",
  "Uno",
  "Sechs Tank",
  "Sechs Golem",
  "Sechs Dragon",
  "Ethelwill",
  "Ragnarok",
];

const external = (url, label) =>
  `<a href="${esc(url)}" target="_blank" rel="noreferrer">${esc(label)} ↗</a>`;
const button = (record, label = displayName(record)) =>
  record
    ? `<button class="guide-link" data-open="${esc(record.id)}">${esc(label)} ↗</button>`
    : esc(label);

export function itemAcquisition(name, data) {
  const item = data.records.find((r) => r.type === "item" && r.name === name);
  const allRecipes = data.recipes.filter((r) => r.name === name);
  const indexRecipes = allRecipes.filter((r) =>
    /\/(Cooking|Pharmacy)_(?:%28|\()RF4/.test(r.source || ""),
  );
  const recipes = indexRecipes.length ? indexRecipes : allRecipes;
  const crop = giantCrops[name];
  const original =
    getLanguage() === "de" && displayName(item || name) !== name
      ? `<small>${esc(name)}</small>`
      : "";
  let how;
  if (crop) {
    how = `${t("Riesenform von", "Giant form of")} <strong>${esc(displayName(crop))}</strong>. <a data-tab="bosses" data-anchor="giant-crops" href="${publicUrl()}?tab=bosses&lang=${getLanguage()}#giant-crops">${t("Anbauanleitung", "Growing guide")} ↓</a>`;
  } else if (recipes.length) {
    how =
      [...new Set(recipes.map((r) => r.station))]
        .map((s) => esc(localizeText(s)))
        .join(" / ") +
      ": " +
      recipes
        .map((r) =>
          button(r, t(`Rezept · St. ${r.level}`, `Recipe · Lv. ${r.level}`)),
        )
        .join(" · ");
  } else {
    how = esc(
      localizeText(
        item?.location || t("Fundort nicht erfasst", "Location not recorded"),
      ),
    );
  }
  return `<li class="taming-item"><div>${button(item, displayName(item || name))}${original}</div><p>${how}</p>${item?.source ? external(item.source, t("Itemquelle", "Item source")) : ""}</li>`;
}

export function bossPanel(record, data) {
  const group = bossGroups.find((g) => g.names.includes(record.name));
  if (
    !group &&
    !untameableBosses.includes(record.name) &&
    record.name !== "Magnuto"
  )
    return "";
  if (!group)
    return `<h3>${t("Boss rekrutieren", "Recruit this boss")}</h3><p>${record.name === "Magnuto" ? t("Die Quellen widersprechen sich bei Magnuto. Genannte Lieblingsgerichte sind kein verlässlicher Nachweis, dass er gezähmt werden kann.", "Sources disagree about Magnuto. Listed favorite dishes do not reliably establish that he can be tamed.") : t("Dieser Boss kann in Rune Factory 4 nicht gezähmt werden.", "This boss cannot be tamed in Rune Factory 4.")}</p>`;
  return `<h3>${t("Boss rekrutieren", "Recruit this boss")}</h3><p>${t("Eines dieser Items verwenden; mehrere Exemplare für weitere Versuche mitnehmen. Die verlinkten Rezepte zeigen Zutaten und bekannte Rezeptfundorte.", "Use any one of these items; bring extra copies for retries. Linked recipes show ingredients and known recipe locations.")}</p>${phaseNote(group)}<ul class="taming-items">${group.items.map((n) => itemAcquisition(n, data)).join("")}</ul><p><a data-tab="bosses" href="${publicUrl()}?tab=bosses&lang=${getLanguage()}">${t("Vollständige Anleitung zur Boss-Rekrutierung", "Full boss recruitment guide")} ↗</a></p>`;
}

function phaseNote(group) {
  return group.phase
    ? `<p class="guide-notice">${group.phase === "ambrosia" ? t("Zuerst die Pflanzenform besiegen. Erst die Schmetterlingsform lässt sich zähmen.", "Defeat the plant form first. Only the butterfly form can be tamed.") : t("Warten, bis Death Wall sich von der Wand löst; erst dann die Items geben.", "Wait for Death Wall to detach from the wall before offering items.")}</p>`
    : "";
}

export function createBossGuide(data) {
  const find = (name) =>
    data.records.find((r) => r.type === "monster" && r.name === name);
  return `<header class="guide-heading"><span class="home-kicker">RUNE FACTORY 4 · ${t("GEFÄHRTEN", "COMPANIONS")}</span><h1>${t("Bosse rekrutieren", "Recruit bosses")}</h1><p>${t("Vom ersten Schmetterling bis zum legendären Drachen: Zähmungsitems, Beschaffung und Besonderheiten auf einen Blick.", "From the first butterfly to legendary dragons: taming gifts, how to obtain them and special requirements.")}</p></header>
  <section class="guide-box"><h2>${t("So wird ein Boss dein Begleiter", "How to recruit a boss")}</h2><ol class="guide-steps">
  <li>${t("Baue eine Monsterscheune und lasse einen Platz frei. Besiege den Boss zunächst im Storykampf und kehre später für den Zähmungsversuch zurück.", "Build a monster barn with an empty space. Defeat the boss in its story encounter, then return for a taming attempt.")}</li>
  <li>${t("Speichere vorher und nimm mehrere Exemplare eines passenden Items mit. Je größer der Levelunterschied zu deinen Ungunsten, desto schwieriger wird es.", "Save beforehand and bring several copies of a suitable item. A boss above your level is harder to tame.")}</li>
  <li>${t("Bürste den Boss bis zu 15-mal, solange Musiknoten erscheinen. Gib ihm anschließend ein Item aus seiner Liste. Die Einträge sind Alternativen; du brauchst nicht alle.", "Brush the boss up to 15 times while musical notes appear. Then give it an item from its list. These are alternatives; you do not need every item.")}</li>
  <li>${t("Warte die Herzanzeige ab. Ein Totenkopf bedeutet: Versuch gescheitert. Wiederhole es mit einem weiteren Item. Ein passendes Geschenk garantiert keinen Erfolg.", "Wait for the heart animation. A skull means the attempt failed. Try again with another item. A correct gift does not guarantee success.")}</li>
  </ol><p>${external("https://therunefactory.fandom.com/wiki/Monsters_(RF4)#Taming_and_Stats:", t("Rune Factory Wiki · Zähmungsmechanik", "Rune Factory Wiki · taming mechanics"))} · ${external(tamingSource, t("RF4-Monsterliste", "RF4 monster list"))}</p></section>
  <p class="guide-notice">${t("Die Bosse und Gebiete unten enthalten Spoiler. Die Varianten mit „2“ verwenden dieselben Zähmungsitems. Zahlen wie „(5)“ in älteren Wiki-Einträgen bezeichnen Freundschaftspunkte, keine benötigte Stückzahl.", "The bosses and areas below contain spoilers. Variants with “2” use the same taming gifts. Numbers such as “(5)” in older wiki entries are friendship points, not required quantities.")}</p>
  <div class="boss-grid">${bossGroups
    .map((group) => {
      const monsters = group.names.map(find).filter(Boolean);
      return `<article class="boss-card"><header>${monsters[0]?.image ? `<img src="${esc(publicUrl(monsters[0].image))}" alt="" loading="lazy">` : ""}<div><h2>${group.names.map((n) => button(find(n), displayName(find(n) || n))).join(" / ")}</h2>${monsters.map((r) => `<p><strong>${esc(displayName(r))}:</strong> ${esc(localizeText(r.location))}</p>`).join("")}</div></header>${phaseNote(group)}<p class="subtle">${t("Ein passendes Item genügt pro Versuch:", "One suitable item per attempt:")}</p><ul class="taming-items">${group.items.map((n) => itemAcquisition(n, data)).join("")}</ul><p class="guide-sources">${monsters.map((r) => external(r.source, displayName(r))).join(" · ")}</p></article>`;
    })
    .join("")}</div>
  <section class="guide-box" id="giant-crops"><h2>${t("Riesenpflanzen für Zähmungsitems anbauen", "Grow giant crops for taming gifts")}</h2><p>${t("Pflanze vier gleiche Samen in ein 2×2-Feld. Verwende Giantizer auf dem Boden und pflege die Pflanzen weiter. Ernte sie nicht sofort: Die vier großen Pflanzen müssen sich erst zu einer einzigen Riesenpflanze verbinden. Eine normale Karotte oder eine normale Kristallblume ersetzt das geforderte Riesenitem nicht.", "Plant four identical seeds in a 2×2 plot. Apply Giantizer to the soil and keep tending the plants. Do not harvest immediately: the four large plants must merge into one giant crop. An ordinary carrot or crystal flower cannot replace the required giant item.")}</p><p>${t("Gemüsesamen erhältst du im Gemischtwarenladen, Blumensamen bei Carnation’s, sobald sie durch Aufträge freigeschaltet wurden. Giantizer gibt es bei Carnation’s. Goldgemüse und Kristallblumen setzen ihre jeweiligen Samen voraus.", "Buy vegetable seeds at the general store and flower seeds at Carnation’s once unlocked through requests. Carnation’s sells Giantizer. Golden vegetables and crystal flowers require their corresponding seeds.")}</p><p>${button(
    data.records.find((r) => r.name === "Giantizer"),
    "Giantizer",
  )} · ${external(cropSource, t("Quelle: Riesenpflanzen", "Source: giant crops"))}</p></section>
  <section class="guide-box"><h2>${t("Welche Bosse lassen sich nicht rekrutieren?", "Which bosses cannot be recruited?")}</h2><p>${untameableBosses.map((n) => button(find(n), n)).join(" · ")}</p><p>${t("Magnuto: widersprüchliche Angaben in den Quellen; deshalb hier nicht als sicher rekrutierbar aufgeführt. Lieblingsgerichte allein belegen keine Zähmbarkeit.", "Magnuto: conflicting source information, so he is not listed as reliably recruitable. Favorite dishes alone do not establish tameability.")}</p>${external(tamingSource, t("Quelle & Ausnahmen", "Source & exceptions"))}</section>`;
}
