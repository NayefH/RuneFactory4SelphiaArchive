import { escapeHtml } from "./html.js";
import { recipeUsesItem } from "./catalog.js";
import { attributePanel } from "./attributes.js";
import { publicUrl } from "./public-url.js";
import { acquisitionPanel } from "./recipe-acquisition.js";
import { t, getLanguage, locale } from "./i18n.js";
import { displayName, localizeText } from "./data-localization.js";

export function createDetailController({
  data,
  catalog,
  favoriteIds,
  thumbnail,
  icon,
}) {
  const $ = (selector) => document.querySelector(selector);
  const saved = favoriteIds;
  const find = (id) => catalog.byId.get(id);
  const itemByName = (name) => catalog.getItem(name);
  const cat = (name) => localizeText(data.materialGroups[name] || name);
  let currentView;
  const originalName = (record) =>
    getLanguage() === "de" && displayName(record) !== record.name
      ? `<small>${escapeHtml(record.name)}</small>`
      : "";
  const related = (record) =>
    `<button class="related" data-open="${record.id}"><span>${icon(record)} ${escapeHtml(displayName(record))}${originalName(record)}</span><span>${record.level ? t("St. ", "Lv. ") + record.level : "↗"}</span></button>`;

  function chips(values = []) {
    const counts = new Map();
    for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
    return [...counts]
      .map(([name, count]) => {
        if (name.includes(" / ")) {
          return `<div class="ingredient-options"><span>${count > 1 ? count + " × " : ""}${t("Eine Option wählen:", "Choose one option:")}</span>${chips(name.split(" / "))}</div>`;
        }
        const record = itemByName(name);
        const group = data.materialGroups[name];
        const translated = group
          ? localizeText(group)
          : displayName(record || name);
        return `<button class="ingredient" ${record ? `data-open="${record.id}"` : `data-search="${escapeHtml(name)}"`}><span>${count > 1 ? count + " × " : ""}${escapeHtml(translated)}</span>${getLanguage() === "de" && translated !== name && !group ? `<small>${escapeHtml(name)}</small>` : ""}${group ? `<small>${t("Materialgruppe · ein passendes Material genügt", "Material group · any matching material will do")}</small>` : ""}</button>`;
      })
      .join("");
  }

  const fact = (label, value) => {
    const text =
      value == null || value === ""
        ? t("Nicht erfasst", "Not recorded")
        : /^(WIP|N\/A)$/i.test(String(value))
          ? t("Im Wiki unbekannt", "Unknown in the wiki")
          : value === "ー"
            ? t("Keine", "None")
            : typeof value === "number"
              ? value.toLocaleString(locale())
              : localizeText(value);
    return `<div class="fact"><span>${escapeHtml(label)}</span><strong>${escapeHtml(text)}</strong></div>`;
  };
  const price = (value) =>
    value == null ? null : value.toLocaleString(locale()) + " G";

  function modal(html) {
    $("#detail-body").innerHTML =
      `<button class="close" aria-label="${t("Details schließen", "Close details")}">✕</button>` +
      html;
    $("#detail").setAttribute("aria-labelledby", "detail-title");
    if (!$("#detail").open) $("#detail").showModal();
    $("#detail").scrollTop = 0;
  }

  function statGrid(values) {
    return `<div class="attribute-grid">${Object.entries(values)
      .map(
        ([key, value]) =>
          `<div><span>${escapeHtml(localizeText(key))}</span><strong>${escapeHtml(typeof value === "number" ? value.toLocaleString(locale()) : localizeText(value))}</strong></div>`,
      )
      .join("")}</div>`;
  }
  function monsterStats(record) {
    return record.stats
      ? `<h3>${t("Kampfwerte", "Combat stats")}</h3>${statGrid(record.stats)}${record.resistances ? `<h3>${t("Resistenzen & Status", "Resistances & status")}</h3>${statGrid(record.resistances)}` : ""}`
      : `<p class="subtle">${t("Kampfwerte in der zugänglichen RF4-Quelle noch nicht erfasst.", "Combat stats have not been recorded in the available RF4 source.")}</p>`;
  }

  function openDetail(id) {
    const record = find(id);
    if (!record) return;
    currentView = { kind: "record", id };
    const used = data.recipes.filter((recipe) =>
      recipeUsesItem(recipe, record.name),
    );
    const made = data.recipes.filter((recipe) => recipe.name === record.name);
    const drops = data.records.filter(
      (entry) => entry.type === "monster" && entry.drops?.includes(record.name),
    );
    const translated = displayName(record);
    const translatedName = getLanguage() === "de" && translated !== record.name;
    const effects = record.effects
      ? `<h3>${t("Werte & Effekte", "Stats & effects")}</h3><p class="effect">${escapeHtml(localizeText(record.effects))}</p>`
      : "";
    let body = "";
    if (record.station) {
      body = `<div class="facts">${fact(t("Werkbank", "Station"), record.station)}${fact(t("Rezeptlevel", "Recipe level"), record.level)}${fact(t("Verkauf (St. 1)", "Sell price (Lv. 1)"), price(record.sell))}</div><h3>${t("Benötigte Materialien", "Required materials")}</h3><div class="ingredients">${chips(record.ingredients)}</div><p class="subtle">${t("Wiederholte Materialien werden mit ihrer Anzahl gezeigt. Materialgruppen erlauben ein beliebiges passendes Item.", "Repeated materials show the quantity required. Material groups allow any matching item.")}</p>${effects}`;
    } else if (record.type === "monster") {
      body = `<div class="facts">${fact(t("Fundort", "Location"), record.location)}${fact(t("Lieblingsitem / Zähmen", "Favorite item / taming"), record.favorite)}${fact(t("Produktion in der Scheune", "Barn production"), record.produce)}</div><h3>${t("Beute", "Drops")}</h3><div class="ingredients">${chips(record.drops)}</div>${monsterStats(record)}${record.dropDetails ? `<h3>${t("Beute & Dropraten", "Drops & drop rates")}</h3><p>${escapeHtml(localizeText(record.dropDetails))}</p>` : ""}`;
    } else {
      body = `<div class="facts">${fact(t("Kaufpreis", "Buy price"), price(record.buy))}${fact(t("Verkaufspreis", "Sell price"), price(record.sell))}${fact(t("Seltenheit", "Rarity"), record.rarity)}${fact(t("Upgrade-Schwierigkeit", "Upgrade difficulty"), record.difficulty)}</div>${effects}${record.location ? `<h3>${t("Fundort / Erhalt", "Location / obtaining")}</h3><p>${escapeHtml(localizeText(record.location))}</p>` : ""}${made.length ? `<h3>${t("Herstellen", "Crafting")} <span>${made.length}</span></h3>${made.map(related).join("")}` : ""}${drops.length ? `<h3>${t("Beute von", "Dropped by")} <span>${drops.length}</span></h3>${drops.map(related).join("")}` : ""}${used.length ? `<h3>${t("Verwendet für", "Used for")} <span>${used.length}</span></h3>${used.map(related).join("")}` : `<p class="subtle">${t("Keine weitere Verwendung in den importierten Rezepten erfasst.", "No further uses recorded in the imported recipes.")}</p>`}`;
    }
    modal(`<div class="eyebrow">RUNE FACTORY 4 · ${escapeHtml(cat(record.category))}</div>
      <span class="detail-icon">${thumbnail(record)}</span>
      ${record.imageCaption ? `<p class="image-caption">${escapeHtml(localizeText(record.imageCaption))}</p>` : ""}
      <h2 id="detail-title">${escapeHtml(translated)}</h2>
      ${translatedName ? `<p class="detail-de">${escapeHtml(record.name)} <span class="unverified">EN</span></p><p class="translation-note">Fanübersetzung · nicht offiziell verifiziert</p>` : ""}
      <button class="save-detail" data-save="${record.id}">${saved.has(record.id) ? t("★ Gemerkt", "★ Saved") : t("☆ Zur Merkliste hinzufügen", "☆ Add to favorites")}</button>
      ${body}${attributePanel(record.station ? itemByName(record.name) || record : record, escapeHtml)}
      ${record.sourceConflicts?.length ? `<h3>${t("Quellenabweichung", "Source discrepancy")}</h3><p class="subtle">${t("Die Einzelartikel nennen teilweise andere Materialien:", "Some individual articles list different materials:")}</p>${record.sourceConflicts.map((conflict) => `<p>${escapeHtml(conflict.ingredients.map((name) => displayName(name)).join(" · "))} · <a href="${escapeHtml(conflict.source)}" target="_blank" rel="noreferrer">${t("Quelle", "Source")} ↗</a></p>`).join("")}` : ""}
      ${acquisitionPanel(catalog.getAcquisitions(record), escapeHtml)}
      <div class="detail-source">
        ${record.imageCredit || record.imageSource ? `<a href="${escapeHtml(record.imageCredit || record.imageSource)}" target="_blank" rel="noreferrer">${t("Bildquelle", "Image source")} ↗</a> · ` : ""}
        <a href="${escapeHtml(record.source)}" target="_blank" rel="noreferrer">${t("RF4-Datenquelle", "RF4 data source")} ↗</a>
        <span>${t("Datenstand: 29. Oktober 2026 · Fehlende Werte ≠ 0", "Data as of October 29, 2026 · Missing values ≠ 0")}</span>
      </div>`);
  }

  function showSources() {
    if (!data) return;
    currentView = { kind: "sources" };
    modal(`<div class="eyebrow">${t("TRANSPARENTES ARCHIV", "A TRANSPARENT ARCHIVE")}</div>
      <h2 id="detail-title">${t("Quellen & Datenstand", "Sources & data status")}</h2>
      <p>${t(
        "Die Spielwerte stammen aus den RF4-Seiten des Rune Factory Wiki und der Itemliste von Ranch Story. Bilder ergänzen RF4-Einträge aus Ranch Story, RF4 Helper und belegten RF4-Spielberichten. Importiert am 29. Oktober 2026. Die zugänglichen Wiki-Snapshots sind teilweise älter.",
        "Game data comes from the RF4 pages of the Rune Factory Wiki and the Ranch Story item list. Images supplement RF4 entries with artwork from Ranch Story, RF4 Helper and documented RF4 playthroughs. Imported on October 29, 2026. Some available wiki snapshots are older.",
      )}</p>
      <div class="facts">${fact(t("Items / Materialien", "Items / materials"), data.records.filter((record) => record.type === "item").length)}${fact(t("Gegner", "Monsters"), data.records.filter((record) => record.type === "monster").length)}${fact(t("Rezeptvarianten", "Recipe variants"), data.recipes.length)}</div>
      <h3>${t("Umfang", "Coverage")}</h3><p>${escapeHtml(localizeText(data.coverage))}</p>
      <h3>${t("Sprachen & deutsche Namen", "Languages & German names")}</h3>
      <p>${t(
        "Die Oberfläche und die erläuternden Spieldaten sind auf Deutsch und Englisch verfügbar. Deutsche Übertragungen von Item- und Gegnernamen sind Fanübersetzungen und nicht als offizielle Lokalisierung verifiziert. Die englischen Originalnamen bleiben zur Zuordnung sichtbar und sind in beiden Sprachen durchsuchbar.",
        "The interface and explanatory game data are available in German and English. German translations of item and monster names are fan translations and have not been verified against the official localization. Original English names remain available for reference and can be searched in either language.",
      )}</p>
      <p>${t(
        "Rune Factory 4 Special bietet eine offizielle deutsche Lokalisierung. Eine vollständige öffentlich überprüfbare Namensliste wurde bei der Recherche nicht gefunden. Deshalb wird hier kein deutscher Item- oder Gegnername als offiziell verifiziert bezeichnet.",
        "Rune Factory 4 Special has an official German localization. A complete, publicly verifiable list of localized names was not found during research. No German item or monster name in this archive is therefore described as officially verified.",
      )}</p>
      <a href="https://store.steampowered.com/app/1580240/?l=${getLanguage() === "de" ? "german" : "english"}" target="_blank" rel="noreferrer">${t("Offizielle Sprachangaben bei Steam", "Official language information on Steam")} ↗</a>
      <h3>${t("Vollständigkeitsprüfung", "Completeness audit")}</h3>
      <p>${data.audit ? t(`${data.audit.detailPages} RF4-Einzelseiten ausgewertet · ${data.audit.itemsWithAttributes} Items mit Attributen · ${data.audit.monstersWithStats} Gegner mit Kampfwerten. ${data.audit.conflicts.length} Quellenabweichungen erfasst.`, `${data.audit.detailPages} individual RF4 pages reviewed · ${data.audit.itemsWithAttributes} items with attributes · ${data.audit.monstersWithStats} monsters with combat stats. ${data.audit.conflicts.length} source discrepancies recorded.`) : t("Import läuft.", "Import in progress.")}</p>
      <a href="${publicUrl("completeness.json")}" target="_blank" rel="noreferrer">${t("Prüfbericht mit offenen Einträgen", "Audit report with incomplete entries")} ↗</a>
      <h3>${t("Wiki-Quellen", "Wiki sources")}</h3>
      <p>${t(
        `Für ${data.audit?.recipeNamesWithAcquisition || 0} Rezepte sind besondere Fundorte belegt. Die ${data.audit?.recipeAcquisitionSources || 0} Angaben nennen Gebiet und, soweit dokumentiert, Raumkoordinate und Zugang. Jeder Fundort ist direkt mit seiner Quelle verlinkt.`,
        `Special acquisition locations are documented for ${data.audit?.recipeNamesWithAcquisition || 0} recipes. The ${data.audit?.recipeAcquisitionSources || 0} entries list the area and, where documented, room coordinates and access requirements. Each location links directly to its source.`,
      )}</p>
      <p><a href="https://ranchstory.miraheze.org/wiki/Item_List_(Rune_Factory_4)" target="_blank" rel="noreferrer">${t("Ranch Story · RF4-Itemliste & Bilder", "Ranch Story · RF4 item list & images")} ↗</a></p>
      <div class="source-links">${[
        ["Crafting", "Handwerk"],
        ["Forging", "Schmieden"],
        ["Cooking", "Kochen"],
        ["Pharmacy", "Alchemie"],
        ["Monsters", "Gegner"],
        ["Other Items", "Weitere Items"],
        ["Crops", "Nutzpflanzen"],
      ]
        .map(
          ([name, german]) =>
            `<a href="https://therunefactory.fandom.com/wiki/${encodeURIComponent(name.replaceAll(" ", "_") + "_(RF4)")}" target="_blank" rel="noreferrer">${t(german, name)} (RF4) ↗</a>`,
        )
        .join("")}</div>
      <h3>${t("Grafiken & Schrift", "Artwork & fonts")}</h3>
      <p><a href="https://ranchstory.miraheze.org/wiki/File:RF4S_OfficialPromoArt_Banner.png" target="_blank" rel="noreferrer">${t("RF4-Special-Promobanner", "RF4 Special promotional banner")}</a>${t(
        ", Logo und Frey-Grafik: Ranch Story. Weitere RF4-Item- und Gegnersymbole: ",
        ", logo and Frey artwork: Ranch Story. Additional RF4 item and monster icons: ",
      )}<a href="https://github.com/Ericoptero/rf4helper" target="_blank" rel="noreferrer">${t("RF4 Helper von Eric Nantes", "RF4 Helper by Eric Nantes")}</a>${t(
        ". Abweichende Bildquellen und Bildausschnitte sind in den jeweiligen Details gekennzeichnet. Spielgrafiken © Marvelous / XSEED.",
        ". Other image sources and cropped images are identified in the relevant details. Game artwork © Marvelous / XSEED.",
      )}</p>
      <p>${t("Schriften: Alegreya und Nunito Sans, lokal eingebunden unter der SIL Open Font License.", "Fonts: Alegreya and Nunito Sans, hosted locally under the SIL Open Font License.")}</p>
      <h3>${t("Lizenz", "License")}</h3>
      <p>${t(
        "Spielinformationen: Rune Factory Wiki, Ranch Story und deren Mitwirkende. Bilder: zugehörige Wiki-Einträge; Spielgrafiken © Marvelous / XSEED. Wiki-Texte nach jeweiliger Quellenlizenz, ",
        "Game information: Rune Factory Wiki, Ranch Story and their contributors. Images: the corresponding wiki entries; game artwork © Marvelous / XSEED. Wiki text is subject to the source's license, ",
      )}<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA</a>${t(
        ", soweit im Wiki nicht anders angegeben. Die Tabellen wurden strukturiert, gekürzt und verknüpft. Inoffizielles Fanprojekt. Rune Factory gehört den jeweiligen Rechteinhabern.",
        ", unless otherwise stated by the wiki. Tables have been structured, abridged and linked. This is an unofficial fan project. Rune Factory belongs to its respective rights holders.",
      )}</p>
      <a class="download" href="${publicUrl("data.json")}" download="${t("rf4-archiv.json", "rf4-archive.json")}">↓ ${t("Strukturierten Datensatz herunterladen", "Download the structured dataset")}</a>`);
  }

  function refresh(force = false) {
    if (!currentView || (!force && !$("#detail").open)) return;
    const scrollTop = $("#detail").scrollTop;
    if (currentView.kind === "sources") showSources();
    else openDetail(currentView.id);
    $("#detail").scrollTop = scrollTop;
  }
  return { openDetail, showSources, refresh };
}
