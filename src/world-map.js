import { escapeHtml as esc } from "./html.js";
import { t, getLanguage } from "./i18n.js";
import { localizeText } from "./data-localization.js";
import { publicUrl } from "./public-url.js";

export const mapRegions = [
  {
    id: "town",
    title: ["Selphia · Stadt", "Selphia · Town"],
    image: "maps/selphia.png",
    width: 480,
    height: 362,
    source: "https://cdn.staticneo.com/ew/8/89/Selphia.png",
    credit: "Neoseeker · Map of Selphia",
  },
  {
    id: "west",
    title: ["Westliche Ebene & Herbststraße", "West plain & Autumn Road"],
    image: "maps/selphia-west.png",
    width: 600,
    height: 450,
    source: "https://cdn.staticneo.com/ew/e/e0/Selphia_plain_west.png",
    credit: "Zoelius · Neoseeker",
  },
  {
    id: "east",
    title: ["Östliche Ebene", "East plain"],
    image: "maps/selphia-east.png",
    width: 800,
    height: 800,
    source:
      "https://wiki.biligame.com/runefactory/RF4%E5%9C%B0%E5%9B%BE%E6%94%BB%E7%95%A5",
    credit: "果果 (Guoguo) · Bilibili Rune Factory Wiki",
    language: "zh",
  },
  {
    id: "south",
    title: ["Sercerezo-Hügel", "Sercerezo Hill"],
    image: "maps/sercerezo-hill.png",
    width: 1000,
    height: 1000,
    source:
      "https://wiki.biligame.com/runefactory/RF4%E5%9C%B0%E5%9B%BE%E6%94%BB%E7%95%A5",
    credit: "果果 (Guoguo) · Bilibili Rune Factory Wiki",
    language: "zh",
  },
  ...[
    [
      "maya-east",
      ["Maya-Straße · Ost", "Maya Road · East"],
      "maya-road-east.png",
      1600,
      "maya",
    ],
    [
      "maya-west",
      ["Maya-Straße · West", "Maya Road · West"],
      "maya-road-west.png",
      1600,
      "maya",
    ],
    [
      "sechs-1",
      ["Sechs-Territorium · 1", "Sechs Territory · 1"],
      "sechs-territory-1.png",
      1200,
      "sechs",
    ],
    [
      "sechs-2",
      ["Sechs-Territorium · 2", "Sechs Territory · 2"],
      "sechs-territory-2.png",
      800,
      "sechs",
    ],
  ].map(([id, title, image, size, defaultPlace]) => ({
    id,
    title,
    image: `maps/${image}`,
    width: size,
    height: size,
    defaultPlace,
    source:
      "https://wiki.biligame.com/runefactory/RF4%E5%9C%B0%E5%9B%BE%E6%94%BB%E7%95%A5",
    credit: "果果 (Guoguo) · Bilibili Rune Factory Wiki",
    language: "zh",
  })),
];

const wiki = (title) =>
  `https://therunefactory.fandom.com/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`;
export const places = [
  {
    id: "castle",
    name: "Selphia Castle",
    region: "town",
    xy: [58, 48],
    kind: "town",
    text: [
      "Ventuswill, Aufträge am Order-Symbol und dein Zuhause mit angrenzendem Farmgelände.",
      "Ventuswill, the Order Symbol and your home with the adjoining farm.",
    ],
    source: wiki("Selphia Castle"),
  },
  {
    id: "store",
    name: "Sincerity General Store",
    region: "town",
    xy: [80, 63],
    kind: "town",
    text: [
      "Blossom und Doug: Gemüsesamen, Lebensmittel und Vorräte; das Sortiment wächst mit erfüllten Aufträgen.",
      "Blossom and Doug: vegetable seeds, groceries and supplies; requests expand the selection.",
    ],
    source: wiki("Sincerity General Store"),
  },
  {
    id: "flowers",
    name: "Carnation’s",
    region: "town",
    xy: [82, 79],
    kind: "town",
    text: [
      "Blumensamen und Bodenzusätze, darunter Giantizer für die Riesenpflanzen zur Boss-Rekrutierung.",
      "Flower seeds and soil treatments, including Giantizer for giant boss-taming crops.",
    ],
    source: wiki("Carnation's"),
  },
  {
    id: "smith",
    name: "Blacksmith Meanderer",
    region: "town",
    xy: [42, 69],
    kind: "town",
    text: [
      "Bado verkauft Waffen und Ausrüstung. Raven bietet bei ihren Besuchen Materialien an.",
      "Bado sells weapons and equipment. Raven offers materials during her visits.",
    ],
    source: wiki("Blacksmith Meanderer"),
  },
  {
    id: "clinic",
    name: "Tiny Bandage Clinic",
    region: "town",
    xy: [30, 79],
    kind: "town",
    text: [
      "Jones und Nancy: Behandlung und Medizin.",
      "Jones and Nancy: medical care and medicine.",
    ],
    source: wiki("Tiny Bandage Clinic"),
  },
  {
    id: "kitchen",
    name: "Porcoline’s Kitchen",
    region: "town",
    xy: [62, 25],
    kind: "town",
    text: [
      "Restaurant und Rezeptbrot zum Lernen von Herstellungsrezepten.",
      "Restaurant and recipe bread for learning crafting recipes.",
    ],
    source: wiki("Porcoline's Kitchen"),
  },
  {
    id: "hotel",
    name: "Bell Hotel",
    region: "town",
    xy: [42, 25],
    kind: "town",
    text: [
      "Xiao Pai und Lin Fa betreiben das Hotel mit Badehaus.",
      "Xiao Pai and Lin Fa run the hotel and baths.",
    ],
    source: wiki("Bell Hotel"),
  },
  {
    id: "airship",
    name: "Airship",
    region: "town",
    xy: [58, 12],
    kind: "town",
    text: [
      "Luftschiff für Reisen zu bereits freigeschalteten Zielen.",
      "Travel by airship to destinations you have unlocked.",
    ],
    source: wiki("Selphia"),
  },
  {
    id: "leon",
    name: "Leon Karnak",
    region: "west",
    xy: [57, 11],
    kind: "dungeon",
    text: [
      "Nördlicher Turm in der westlichen Ebene. Später Zugang zu Rune Prana; hier findest du unter anderem Grimoire.",
      "Tower north of the west plain. Later provides access to Rune Prana; Grimoire is encountered here.",
    ],
    source: wiki("Leon Karnak"),
  },
  {
    id: "mansion",
    name: "Obsidian Mansion",
    region: "west",
    xy: [78, 26],
    kind: "dungeon",
    text: [
      "Anwesen im Westen von Selphia; Marionettas Dungeon.",
      "Mansion west of Selphia; Marionetta’s dungeon.",
    ],
    source: wiki("Obsidian Mansion"),
  },
  {
    id: "lava",
    name: "Delirium Lava Ruins",
    region: "west",
    xy: [67, 45],
    kind: "dungeon",
    text: [
      "Über die Herbststraße erreichbar. Feuergebiet mit Rafflesia; Feuerschutz mitnehmen.",
      "Reached through Autumn Road. Fire-themed ruins with Rafflesia; bring fire protection.",
    ],
    source: wiki("Delirium Lava Ruins"),
  },
  {
    id: "revival",
    name: "Revival Cave",
    region: "west",
    xy: [25, 47],
    kind: "dungeon",
    text: [
      "Nebenhöhle an der Herbststraße mit Ancient Bone.",
      "Side cave off Autumn Road with Ancient Bone.",
    ],
    source: wiki("Revival Cave"),
  },
  {
    id: "winter",
    name: "Winter Field",
    region: "west",
    xy: [6, 47],
    kind: "field",
    text: [
      "Saisonfeld für Pflanzen, die winterliche Bedingungen bevorzugen.",
      "Seasonal field for crops that prefer winter conditions.",
    ],
    source: wiki("Selphia Plain"),
  },
  {
    id: "autumn",
    name: "Autumn Field",
    region: "west",
    xy: [36, 76],
    kind: "field",
    text: [
      "Saisonfeld an der Herbststraße zum Anbau außerhalb der aktuellen Jahreszeit.",
      "Seasonal field along Autumn Road for crops outside the current season.",
    ],
    source: wiki("Selphia Plain"),
  },
  {
    id: "town-gate",
    name: "Selphia",
    region: "east",
    xy: [42, 21],
    kind: "town",
    text: [
      "Der nördliche Ausgang der Ebene führt zurück in die Stadt.",
      "The northern exit of the plain leads back to town.",
    ],
    source: wiki("Selphia"),
  },
  {
    id: "yokmir",
    name: "Yokmir Forest",
    region: "east",
    xy: [64, 29],
    kind: "dungeon",
    text: [
      "Frühes Waldgebiet an der östlichen Ebene; Ambrosia lebt hier. Die Yokmir-Höhle ist ein eigener Bereich.",
      "Early forest reached from the east plain; home to Ambrosia. Yokmir Cave is a separate area.",
    ],
    source: wiki("Yokmir Forest"),
  },
  {
    id: "water",
    name: "Water Ruins",
    region: "east",
    xy: [82, 37],
    kind: "dungeon",
    text: [
      "Ruinen an der östlichen Ebene; hier triffst du Thunderbolt.",
      "Ruins reached from the east plain, where you encounter Thunderbolt.",
    ],
    source: wiki("Water Ruins"),
  },
  {
    id: "keeno",
    name: "Keeno Lake",
    region: "east",
    xy: [20, 60],
    kind: "field",
    text: [
      "See und Angelplatz im Südwesten der östlichen Ebene.",
      "Lake and fishing spot in the southwest of the east plain.",
    ],
    source: wiki("Selphia Plain"),
  },
  {
    id: "cluck",
    name: "Cluck-Cluck Nest",
    region: "east",
    xy: [32, 69],
    kind: "dungeon",
    text: [
      "Nest mit Mamadoodles; Zugang über die Treppe in der östlichen Ebene.",
      "Nest with Mamadoodles, reached by stairs in the east plain.",
    ],
    source: wiki("Cluck-Cluck Nest"),
  },
  {
    id: "sercerezo",
    name: "Sercerezo Hill",
    region: "east",
    xy: [62, 76],
    kind: "field",
    text: [
      "Frühlingsgebiet mit Verbindung zur Idra-Höhle; der Zugang öffnet sich im Verlauf der Geschichte.",
      "Spring area connected to Idra Cave; access opens during the story.",
    ],
    source: wiki("Sercerezo Hill"),
  },
  {
    id: "idra",
    name: "Idra Cave",
    region: "south",
    xy: [20, 47],
    kind: "dungeon",
    text: [
      "Dungeon des zweiten Handlungsabschnitts mit Terraclone.",
      "Second-arc dungeon with Terraclone.",
    ],
    source: wiki("Idra Cave"),
  },
  {
    id: "spring-field",
    name: "Spring Field",
    region: "south",
    xy: [41, 27],
    kind: "field",
    text: [
      "Saisonfeld unter Frühlingsbedingungen im Norden des Sercerezo-Hügels.",
      "Seasonal field with spring conditions in northern Sercerezo Hill.",
    ],
    source: wiki("Sercerezo Hill"),
  },
  {
    id: "maya",
    name: "Maya Road",
    kind: "field",
    text: [
      "Späteres Gebiet mit Fiergaenger und dem Weg zum Sechs-Territorium.",
      "Later area with Fiergaenger and the route to Sechs Territory.",
    ],
    source: wiki("Maya Road"),
  },
  {
    id: "sechs",
    name: "Sechs Territory",
    kind: "dungeon",
    text: [
      "Schneegebiet im zweiten Handlungsabschnitt mit Aquameleon.",
      "Snowy second-arc area with Aquameleon.",
    ],
    source: wiki("Sechs Territory"),
  },
  {
    id: "empire",
    name: "Floating Empire",
    kind: "dungeon",
    text: [
      "Fliegende Festung mit Ost-, West-, Süd- und Hauptbereich; Abschluss des zweiten Handlungsabschnitts.",
      "Flying fortress with east, west, south and main sections; the end of the second story arc.",
    ],
    source: wiki("Floating Empire"),
  },
  {
    id: "prana",
    name: "Rune Prana",
    kind: "dungeon",
    text: [
      "Siebenstufiger Dungeon unter Leon Karnak im dritten Handlungsabschnitt. Viele rekrutierbare Bosse warten hier.",
      "Seven-floor dungeon beneath Leon Karnak in the third story arc. Many recruitable bosses are found here.",
    ],
    source: wiki("Rune Prana"),
  },
  {
    id: "sharance",
    name: "Sharance Maze",
    kind: "dungeon",
    text: [
      "Zusatzdungeon nach Freischaltung per Order; Zugang über den Baum in deinem Trophäenraum.",
      "Bonus dungeon unlocked through an Order; enter through the tree in your trophy room.",
    ],
    source: wiki("Sharance Maze"),
  },
];

const name = (p) => localizeText(p.name);
const external = (url, label) =>
  `<a href="${esc(url)}" target="_blank" rel="noreferrer">${esc(label)} ↗</a>`;
export function placeDetail(id) {
  const p = places.find((p) => p.id === id) || places[0];
  return `<h2 id="map-place-title">${esc(name(p))}</h2>${getLanguage() === "de" && name(p) !== p.name ? `<small>${esc(p.name)}</small>` : ""}<p>${esc(t(...p.text))}</p><p>${external(p.source, t("Ortsdetails & Quelle", "Location details & source"))}</p>${p.kind !== "town" ? `<button class="guide-link" data-location-search="${esc(p.name)}">${t("Gegner dieses Gebiets im Bestiarium suchen", "Find this area’s monsters in the bestiary")} ↗</button>` : ""}`;
}

export function createMapGuide(data, regionId = "town", placeId) {
  const region = mapRegions.find((r) => r.id === regionId) || mapRegions[0];
  const marked = places.filter((p) => p.region === region.id);
  const selected = marked.some((p) => p.id === placeId)
    ? placeId
    : marked[0]?.id || region.defaultPlace || "castle";
  return `<header class="guide-heading"><span class="home-kicker">RUNE FACTORY 4 · ${t("ORIENTIERUNG", "EXPLORATION")}</span><h1>${t("Karte & wichtige Orte", "Map & important places")}</h1><p>${t("Erkunde Selphia und seine Umgebung. Wähle eine Karte und dann eine Markierung, um mehr über den Ort zu erfahren.", "Explore Selphia and its surroundings. Choose a map, then select a marker to learn about that place.")}</p></header>
  <div class="category-chips map-regions" role="group" aria-label="${t("Kartenregion", "Map region")}">${mapRegions.map((r) => `<button class="category-chip" data-map-region="${r.id}" aria-pressed="${r.id === region.id}">${esc(t(...r.title))}</button>`).join("")}</div>
  <div class="map-layout"><figure class="map-figure"><div class="map-canvas"><img class="game-map" src="${publicUrl(region.image)}" width="${region.width}" height="${region.height}" alt="${esc(t(...region.title))} – Rune Factory 4">${marked.map((p, i) => `<button class="map-pin" data-map-place="${p.id}" style="left:${p.xy[0]}%;top:${p.xy[1]}%" aria-label="${esc(name(p))}" aria-pressed="${p.id === selected}" title="${esc(name(p))}">${i + 1}</button>`).join("")}</div><figcaption>${esc(region.credit)} · ${external(publicUrl(region.image), t("Karte in Originalgröße", "Original-size map"))} · ${external(region.source, t("Bildquelle", "Image source"))}</figcaption></figure><aside class="map-detail guide-box" id="map-detail" aria-live="polite">${placeDetail(selected)}</aside></div>
  <div class="map-legend" role="group" aria-label="${t("Markierte Orte", "Marked places")}">${marked.map((p, i) => `<button data-map-place="${p.id}" aria-pressed="${p.id === selected}"><span>${i + 1}</span>${esc(name(p))}</button>`).join("")}</div>
  <p class="guide-notice">${region.language === "zh" ? t("Diese Originalkarte hat chinesische Beschriftungen. Öffne sie in Originalgröße, um die Details zu lesen. Die ergänzten Ortsbeschreibungen sind auf Deutsch und Englisch verfügbar.", "This original map has Chinese labels. Open it at original size to read the details. Added location descriptions are available in German and English.") : t("Die Originalkarte hat englische Beschriftungen. Die ergänzten Markierungen und Beschreibungen folgen deiner Sprachwahl.", "The original map has English labels. Added markers and descriptions follow your selected language.")} ${t("Gebiete werden abhängig vom Storyfortschritt zugänglich; die Übersicht unten enthält Spoiler.", "Areas unlock with story progress; the directory below contains spoilers.")}</p>
  <section><h2>${t("Die wichtigsten Gebiete der Spielwelt", "Key areas across the game world")}</h2><div class="place-grid">${places
    .filter((p) => p.kind !== "town")
    .map(
      (p) =>
        `<article class="guide-box"><h3>${esc(name(p))}</h3><p>${esc(t(...p.text))}</p>${external(p.source, t("Karte & Ortsdetails", "Map & location details"))}</article>`,
    )
    .join("")}</div></section>
  <section class="guide-box"><h2>${t("Weitere Dungeon-Karten", "More dungeon maps")}</h2><p>${t("Raumkarten, Truhen und Zugangswege zu den weiteren Dungeons findest du in der verlinkten RF4-Kartenübersicht.", "Find room maps, chests and access routes for the remaining dungeons in the linked RF4 map collection.")}</p>${external("https://therunefactory.fandom.com/wiki/User_blog:Snowsiren/World_Map_(RF4)", "Snowsiren · World Map (RF4)")}<p class="subtle">${t("Karten und Spielgrafiken © jeweilige Rechteinhaber / Marvelous / XSEED. Markierungen ergänzt; Originalbilder unverändert.", "Maps and game artwork © their respective owners / Marvelous / XSEED. Markers added; original artwork unchanged.")}</p></section>`;
}
