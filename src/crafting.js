import { t, locale } from "./i18n.js";
import { displayName, localizeText } from "./data-localization.js";
import { escapeHtml as esc } from "./html.js";
import { publicUrl } from "./public-url.js";
import { attributeLabel } from "./attributes.js";
import { normalizeSearch } from "./catalog.js";
import {
  craftStats,
  craftingSources,
  simulateCrafting,
} from "./crafting-engine.js";
import { sharanceRecipeBadge } from "./recipe-acquisition.js";

export const materialInputName = (item) =>
  `${displayName(item)} · ${item.name}`;
export function findCraftMaterial(context, value) {
  const text = normalizeSearch(value.trim());
  return context.items.find((item) =>
    [
      materialInputName(item),
      item.name,
      displayName(item, "de"),
      displayName(item, "en"),
    ].some((name) => normalizeSearch(name) === text),
  );
}
const n = (value) => value.toLocaleString(locale());
const signed = (value) => (value > 0 ? "+" : "") + n(value);
const statSummary = (values) =>
  craftStats
    .filter((key) => values[key])
    .map((key) => `${key} ${signed(values[key])}`)
    .join(" · ") ||
  t(
    "Kein direkter Bonus auf diese Kampfwerte",
    "No direct bonus to these combat stats",
  );
const itemImage = (item) =>
  item?.image
    ? `<img src="${esc(publicUrl(item.image))}" alt="" loading="lazy">`
    : `<span aria-hidden="true">⚒</span>`;
const warningTexts = () => ({
  "missing-base": t(
    "Die Grundwerte dieses Items sind unvollständig. Das Ergebnis zeigt nur erfasste Beiträge.",
    "This item's base stats are incomplete. The result only shows recorded contributions.",
  ),
  "missing-materials": t(
    "Eine benötigte Zutat fehlt im Datenbestand. Ergänze sie, bevor du diesen Plan im Spiel verwendest.",
    "A required ingredient is missing from the dataset. Resolve it before using this plan in the game.",
  ),
  inheritance: t(
    "Vererbung: Die angehakten Zutaten sind deine Zielkombination. Bei mehr als drei Zusätzen bzw. Rezepten mit mindestens vier Pflichtzutaten kann die Auswahl im Spiel zufällig sein. Bei Barrett prüfen.",
    "Inheritance: checked ingredients are your target combination. More than three extras, or recipes with at least four required ingredients, can involve random selection in the game. Check with Barrett.",
  ),
  "creation-special": t(
    "Ein gewählter Zusatz besitzt Vererbungs- oder Spezialeffekte. Diese sind nicht in den berechneten Kampfwerten enthalten.",
    "A selected extra has inheritance or special effects. These are not included in the calculated combat stats.",
  ),
  "special-effects": t(
    "Mindestens eine Aufwertung besitzt keine erfassten Boni auf die sieben gezeigten Kampfwerte. Weitere Effekte stehen in den Itemdetails.",
    "At least one upgrade has no recorded bonuses to the seven displayed combat stats. See item details for other effects.",
  ),
  "steel-inactive": t(
    "Ein Stahl-Schritt wirkt nicht: Double Steel und 10-Fold Steel funktionieren jeweils einmal und brauchen direkt davor ein normales Aufwertungsmaterial.",
    "A steel step is inactive: Double Steel and 10-Fold Steel each work once and require a regular upgrade material immediately before them.",
  ),
  "rarity-unknown": t(
    "Seltenheitswerte fehlen. Der Seltenheitsbonus ist deshalb nicht eingerechnet; das Ergebnis ist eine Teilberechnung.",
    "Rarity values are missing. The rarity bonus is excluded, so this is a partial calculation.",
  ),
  "staff-rarity": t(
    "Für diese Seltenheitsstufe des Stabs ist kein gesicherter Bonus hinterlegt. Er bleibt aus der Teilberechnung ausgeschlossen.",
    "No verified staff bonus is recorded for this rarity tier. It is excluded from this partial calculation.",
  ),
  "skill-low": t(
    "Dein Fertigkeitslevel liegt unter dem Rezeptlevel. Die Herstellung kann dadurch mehr RP erfordern; der Simulator berechnet keine RP-Kosten oder Erfolgschance.",
    "Your skill is below the recipe level. Crafting may require more RP; the simulator does not calculate RP costs or success chance.",
  ),
});

export function craftingRecipeOptions(
  context,
  selected,
  query = "",
  station = "",
) {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return [...context.recipes]
    .filter(
      (recipe) =>
        (!station || recipe.station === station) &&
        terms.every((term) =>
          normalizeSearch(
            `${recipe.name} ${displayName(recipe)} ${recipe.category} ${localizeText(recipe.category)}`,
          ).includes(term),
        ),
    )
    .sort(
      (a, b) =>
        displayName(a).localeCompare(displayName(b), locale(), {
          numeric: true,
        }) || a.level - b.level,
    )
    .map(
      (recipe) =>
        `<option value="${recipe.id}" ${recipe.id === selected ? "selected" : ""}>${esc(displayName(recipe))} · ${esc(localizeText(recipe.station))} · ${t("St.", "Lv.")} ${recipe.level}${context.recipes.filter((r) => r.name === recipe.name && r.station === recipe.station && r.level === recipe.level).length > 1 ? " · " + esc(recipe.ingredients.map((name) => localizeText(name)).join(" + ")) : ""}</option>`,
    )
    .join("");
}

function materialSlot(context, result, index, upgrade = false) {
  const { plan, recipe, equipment } = result;
  const slot = (upgrade ? plan.upgrades : plan.materials)[index];
  const required = context.slotsFor(recipe);
  const item = context.byId.get(slot.itemId);
  const kind = upgrade ? "upgrade" : "material";
  const id = `craft-${kind}-${index}`;
  const mandatory = !upgrade && index < required.length;
  const eligible =
    equipment && !upgrade && (!mandatory || required.length >= 4);
  const label = upgrade
    ? `${t("Aufwertung", "Upgrade")} ${index + 1}`
    : mandatory
      ? localizeText(required[index].label)
      : t("Freier Zusatz", "Optional extra");
  const field = mandatory
    ? `<select id="${id}" data-craft-kind="${kind}" data-craft-index="${index}">${!item ? `<option value="">${t("Zutat nicht erfasst", "Ingredient not recorded")}</option>` : ""}${context
        .candidates(required[index])
        .map(
          (candidate) =>
            `<option value="${candidate.id}" ${slot.itemId === candidate.id ? "selected" : ""}>${esc(displayName(candidate))}</option>`,
        )
        .join("")}</select>`
    : `<input id="${id}" data-craft-kind="${kind}" data-craft-index="${index}" list="craft-material-list" value="${esc(item ? materialInputName(item) : "")}" placeholder="${t("Material suchen …", "Find a material …")}" autocomplete="off">`;
  return `<div class="craft-slot${mandatory ? " craft-slot-required" : ""}"><label for="${id}"><span class="craft-slot-index">${upgrade ? index + 2 : index + 1}</span> ${esc(label)}</label><div class="craft-slot-fields">${field}${equipment ? `<label class="craft-level" for="${id}-level">${t("Itemlevel", "Item level")}<input id="${id}-level" type="number" min="1" max="10" value="${slot.level}" ${!item ? "disabled" : ""} data-craft-kind="${kind}" data-craft-index="${index}" data-craft-field="level"></label>` : ""}</div><div class="craft-slot-meta">${eligible ? `<label class="craft-inherit"><input type="checkbox" id="${id}-inherit" data-craft-kind="material" data-craft-index="${index}" data-craft-field="inherit" ${slot.inherit ? "checked" : ""} ${!item ? "disabled" : ""}>${t("Bonus vererben", "Inherit bonus")}</label>` : mandatory ? `<small>${t("Pflichtzutat", "Required ingredient")}</small>` : ""}${item ? `<button type="button" class="guide-link" data-open="${item.id}">${t("Itemdetails", "Item details")} ↗</button>` : ""}</div>${upgrade && item ? `<small class="craft-step-preview">${esc(statSummary(result.steps.find((step) => step.index === index)?.delta || {}))}</small>` : ""}</div>`;
}

export function craftingResult(result, catalog) {
  const { item, recipe, plan, equipment } = result;
  const warningLabels = warningTexts();
  const partial = result.warnings.some((key) =>
    [
      "rarity-unknown",
      "missing-base",
      "missing-materials",
      "creation-special",
      "staff-rarity",
    ].includes(key),
  );
  const stats = equipment
    ? `<div class="craft-stat-grid">${craftStats.map((key) => `<div><span>${esc(attributeLabel(key))} <small>${key}</small></span><strong data-craft-stat="${key}">${n(result.totals[key])}</strong><small>${t("Basis", "Base")} ${n(result.base[key])} · ${t("Bonus", "Bonus")} ${signed(result.totals[key] - result.base[key])}</small></div>`).join("")}</div><details class="craft-breakdown"><summary>${t("Wie entstehen die Werte?", "How are these stats calculated?")}</summary><div class="craft-table-scroll"><table><caption>${t("Beiträge zu den Kampfwerten", "Combat stat contributions")}</caption><thead><tr><th>${t("Beitrag", "Contribution")}</th>${craftStats.map((key) => `<th scope="col">${key}</th>`).join("")}</tr></thead><tbody>${[
        [t("Grundwerte", "Base stats"), result.base],
        [t("Vererbung", "Inheritance"), result.creation],
        [t("Aufwertungen", "Upgrades"), result.upgrades],
        [t("Levelbonus", "Level bonus"), result.levelBonus],
        [t("Seltenheitsbonus", "Rarity bonus"), result.rarityBonus],
      ]
        .map(
          ([label, values]) =>
            `<tr><th scope="row">${label}</th>${craftStats.map((key) => `<td>${n(values[key])}</td>`).join("")}</tr>`,
        )
        .join(
          "",
        )}</tbody></table></div></details><div class="craft-bonus-summary"><p>${t("Materiallevel gesamt", "Total material levels")}: <b>${result.totalLevel} / 150</b> · ${t("Bonus ab", "Bonus threshold")} ${result.levelTier || "—"}</p><p>${t("Seltenheit gesamt", "Total rarity")}: <b>${result.missingRarity ? "≥ " : ""}${result.totalRarity} / 225</b>${result.missingRarity ? ` · ${result.missingRarity} ${t("unbekannt", "unknown")}` : ""}</p>${!result.unlocked ? `<p>${t("Level- und Seltenheitsboni werden ab Fertigkeitslevel 50 berücksichtigt.", "Level and rarity bonuses are included from skill level 50.")}</p>` : ""}</div>`
    : `<div class="craft-output-count"><strong>× ${plan.batch}</strong><span>${t("Herstellungsdurchgänge", "Crafting runs")}</span></div>${item?.effects ? `<p>${esc(localizeText(item.effects))}</p>` : `<p>${t("Effekte des fertigen Items in den Rezept- und Itemdetails nachschlagen.", "See recipe and item details for the finished item's effects.")}</p>`}`;
  return `<div class="craft-result-heading"><span class="craft-result-icon">${itemImage(item)}</span><div><span class="craft-kicker">${partial ? t("Teilberechnung", "Partial calculation") : t("Dein Ergebnis", "Your result")}</span><h3>${esc(displayName(recipe))}</h3><p>${equipment ? `${t("Ausrüstungslevel", "Equipment level")} ${result.equipmentLevel} / 10` : esc(localizeText(recipe.station))}</p></div></div>${catalog.isSharanceExclusive(recipe) ? sharanceRecipeBadge() : ""}${stats}<h3>${t("Materialbedarf", "Materials needed")}</h3><ul class="craft-shopping">${result.shoppingList.map(({ item, count }) => `<li><button class="guide-link" data-open="${item.id}">${esc(displayName(item))}</button><b>× ${count}</b></li>`).join("")}</ul><p class="craft-cost">${t("Erfasste Einkaufspreise", "Recorded buy prices")}: <strong>${result.buyTotal === undefined ? t("Unvollständig", "Incomplete") : n(result.buyTotal) + " G"}</strong><small>${t("Preise sind keine Garantie für aktuelle Ladenverfügbarkeit.", "Prices do not guarantee current shop availability.")}</small></p>${result.warnings.length ? `<ul class="craft-warnings">${result.warnings.map((warning) => `<li>${warningLabels[warning]}</li>`).join("")}</ul>` : ""}${equipment ? `<p class="craft-scope">${t("Berechnet werden die sieben gezeigten Kampfwerte. Elementwechsel, Resistenzen, Stabzauber, Reichweite, Accessoire-Effekte, Waffenüberschreiben und RP-Kosten sind nicht eingerechnet. Vererbte Materialien entsprechen der gewählten Zielkombination.", "Calculates the seven displayed combat stats. Element changes, resistances, staff spells, range, accessory effects, weapon overrides and RP costs are not included. Inherited materials represent the chosen target combination.")}</p>` : `<p class="craft-scope">${t("Zutaten- und Mengenplanung für die gewählte Rezeptvariante. Zusätzliche Essensboni, Itemqualität und RP-Kosten werden nicht simuliert.", "Ingredient and quantity planning for the selected recipe variant. Extra food bonuses, item quality and RP costs are not simulated.")}</p>`}<a class="craft-download" href="data:application/json;charset=utf-8,${esc(encodeURIComponent(JSON.stringify(plan, null, 2)))}" download="rf4-crafting-plan.json">↓ ${t("Plan herunterladen", "Download plan")}</a>`;
}

export function createCraftingPage(context, plan, catalog) {
  const result = simulateCrafting(context, plan);
  if (!result)
    return `<h1>${t("Keine Rezepte verfügbar", "No recipes available")}</h1>`;
  const { recipe, equipment } = result;
  const required = context.slotsFor(recipe);
  return `<div class="guide-heading"><span class="craft-kicker">RUNE FACTORY 4 · ${t("WERKSTATT", "WORKSHOP")}</span><h1>${t("Crafting verstehen & ausprobieren", "Understand crafting & try it out")}</h1><p>${t("Plane Zutaten für jede Werkbank. Bei Waffen und Ausrüstung siehst du zusätzlich, wie Materialien, Vererbung und Aufwertungen deine Werte verändern.", "Plan ingredients for every workstation. For weapons and equipment, see how materials, inheritance and upgrades change your stats.")}</p><div class="craft-anchor-links"><a href="#craft-simulator">${t("Zum Simulator", "Go to simulator")} ↓</a><a href="#craft-basics">${t("Crafting erklärt", "Crafting explained")} ↓</a></div></div>
  <section id="craft-simulator" aria-labelledby="craft-simulator-title"><div class="craft-section-heading"><h2 id="craft-simulator-title">${t("Deine Crafting-Werkstatt", "Your crafting workshop")}</h2><div class="craft-actions"><a href="#craft-result">${t("Zum Ergebnis", "View result")} ?</a><button type="button" data-craft-example>${t("Beispiel laden", "Load example")}</button><button type="button" data-craft-reset>${t("Plan zurücksetzen", "Reset plan")}</button></div></div><div class="craft-layout"><div class="craft-editor"><section class="guide-box craft-recipe-box"><h3>1 · ${t("Rezept auswählen", "Choose a recipe")}</h3><div class="craft-recipe-filters"><label for="craft-station">${t("Werkbank", "Workstation")}<select id="craft-station"><option value="">${t("Alle Werkbänke", "All workstations")}</option>${[...new Set(context.recipes.map((r) => r.station))].map((station) => `<option value="${esc(station)}">${esc(localizeText(station))}</option>`).join("")}</select></label><label for="craft-recipe-search">${t("Rezept suchen", "Find a recipe")}<input id="craft-recipe-search" type="search" placeholder="${t("Deutscher oder englischer Name …", "German or English name …")}"></label></div><label for="craft-recipe">${t("Rezept / Variante", "Recipe / variant")}<select id="craft-recipe">${craftingRecipeOptions(context, recipe.id)}</select></label><p class="craft-recipe-meta">${esc(localizeText(recipe.category))} · ${t("Rezeptlevel", "Recipe level")} ${recipe.level} <button class="guide-link" data-open="${recipe.id}">${t("Rezeptdetails", "Recipe details")} ↗</button></p><div class="craft-recipe-filters"><label for="craft-skill">${t("Dein Fertigkeitslevel", "Your skill level")}<input id="craft-skill" type="number" min="1" max="99" value="${result.plan.skill}"></label>${!equipment ? `<label for="craft-batch">${t("Anzahl herstellen", "Crafting quantity")}<input id="craft-batch" type="number" min="1" max="99" value="${result.plan.batch}"></label>` : ""}</div></section><section class="guide-box"><h3>2 · ${t("Zutaten festlegen", "Choose ingredients")}</h3><p class="craft-help">${equipment ? t("Sechs Herstellungsplätze. Pflichtzutaten erfüllen das Rezept; freie Zusätze können ihre Upgrade-Boni vererben. Höchstens drei Zutaten als Vererbung auswählen.", "Six crafting slots. Required ingredients fulfil the recipe; optional extras can pass on their upgrade bonuses. Select at most three ingredients for inheritance.") : t("Wähle für Materialgruppen und Alternativen eine passende Zutat. Wiederholte Zutaten werden im Materialbedarf zusammengezählt.", "Choose a suitable ingredient for each material group or alternative. Repeated ingredients are combined in the materials list.")}</p><div class="craft-material-grid">${Array.from({ length: equipment ? 6 : required.length }, (_, index) => materialSlot(context, result, index)).join("")}</div></section>${equipment ? `<section class="guide-box"><h3>3 · ${t("Aufwertungsfolge planen", "Plan upgrade order")}</h3><p class="craft-help">${t("Neun Aufwertungen führen von Ausrüstungslevel 1 bis 10. Die Reihenfolge zählt: wiederholte Materialien wirken schwächer. Die Zahl links zeigt das erreichte Ausrüstungslevel.", "Nine upgrades take equipment from level 1 to 10. Order matters: repeated materials have weaker effects. The number on the left shows the resulting equipment level.")}</p><div class="craft-upgrade-grid">${Array.from({ length: 9 }, (_, index) => materialSlot(context, result, index, true)).join("")}</div></section>` : ""}</div><aside class="guide-box craft-result" id="craft-result" aria-label="${t("Simulationsergebnis", "Simulation result")}" aria-live="polite" aria-atomic="true">${craftingResult(result, catalog)}</aside></div><datalist id="craft-material-list">${context.items.map((item) => `<option value="${esc(materialInputName(item))}"></option>`).join("")}</datalist><p class="craft-save-note" id="craft-save-status" role="status"></p></section>
  ${craftingExplanation()}`;
}

function craftingExplanation() {
  const cards = [
    [
      t("Werkbank & Rezept", "Workstation & recipe"),
      t(
        "Waffen und Werkzeuge entstehen an der Schmiede, Rüstung und Accessoires am Fertigungstisch. Für Gerichte brauchst du das passende Kochgerät, für Medizin das Chemie-Set. Rezepte legen Pflichtzutaten und Werkbank fest; Materialgruppen erlauben mehrere passende Items.",
        "Use the forge for weapons and tools, the crafting table for armour and accessories, the matching cooking tool for dishes, and the chemistry set for medicine. Recipes determine required ingredients and the workstation; material groups allow several suitable items.",
      ),
    ],
    [
      t("Rezeptlevel ist kein Itemlevel", "Recipe level is not item level"),
      t(
        "Das Rezeptlevel beschreibt die Herstellungsschwierigkeit. Das Itemlevel eines Materials reicht von 1 bis 10. Bei Ausrüstung werden die Materiallevel aus bis zu sechs Herstellungs- und neun Aufwertungsplätzen addiert. Ab Schmiede- bzw. Handwerkslevel 50 gibt es dafür zusätzliche Werteboni.",
        "Recipe level describes crafting difficulty. A material's item level ranges from 1 to 10. Equipment adds the levels of up to six crafting ingredients and nine upgrades. From forging or crafting skill 50, that total grants additional stat bonuses.",
      ),
    ],
    [
      t("Herstellen & Vererben", "Crafting & inheritance"),
      t(
        "Die Grundwerte kommen aus dem Rezept. Bis zu drei vererbte Materialien ergänzen ihre Upgrade-Boni. Sie müssen nicht die Pflichtzutaten sein. Sind mehr Kandidaten vorhanden, kann die Auswahl zufällig ausfallen. Barrett kann dir sagen, welche Materialien übernommen wurden.",
        "The recipe supplies base stats. Up to three inherited materials add their upgrade bonuses. These need not be the required ingredients. Extra candidates can make selection random. Barrett can tell you which materials were inherited.",
      ),
    ],
    [
      t("Aufwerten in der richtigen Reihenfolge", "Upgrade in the right order"),
      t(
        "Jede erfolgreiche Aufwertung erhöht das Ausrüstungslevel um eins, höchstens bis Level 10. Derselbe Materialtyp wirkt beim Wiederholen nur halb so stark wie zuvor. Ein Gold-Upgrade gibt beispielsweise DEF +10, das nächste mit Gold nur noch +5. Verzehr- und Kochboni eines Materials sind keine Ausrüstungsboni.",
        "Each successful upgrade increases equipment level by one, up to level 10. Reusing the same material halves its effect again. A Gold upgrade gives DEF +10; the next Gold adds only +5. A material's food and cooking effects are not equipment bonuses.",
      ),
    ],
    [
      t(
        "Double Steel, 10-Fold Steel & Object X",
        "Double Steel, 10-Fold Steel & Object X",
      ),
      t(
        "Double Steel fügt zweimal, 10-Fold Steel achtmal den ursprünglichen Bonus des vorherigen Aufwertungsmaterials hinzu. Jeder Stahl wirkt pro Ausrüstung einmal; sie lassen sich nicht direkt miteinander verketten. Object X dreht die Vorzeichen nachfolgender Boni um. Ein Stahl-Schritt hebt diese Umkehr auf.",
        "Double Steel adds twice, and 10-Fold Steel eight times, the previous upgrade material's original bonus. Each steel works once per piece and they cannot be chained directly. Object X reverses subsequent bonuses; a steel step cancels that reversal.",
      ),
    ],
    [
      t("Seltenheit & Rezeptbrot+", "Rarity & Recipe Bread+"),
      t(
        "Materialien besitzen zusätzlich einen Seltenheitswert. Er ist nicht ihre Upgrade-Schwierigkeit. Hohe Summen geben weitere Boni. Für Rezepte über Level 80 brauchst du Rezeptbrot+ aus Sharance Maze oder einen besonderen Rezeptfundort. Mit genügend RP kannst du auch ohne gelerntes Rezept herstellen.",
        "Materials also have a rarity value, separate from upgrade difficulty. High totals grant further bonuses. Recipes above level 80 need Recipe Bread+ from Sharance Maze or a special recipe location. With enough RP, you can also craft without learning a recipe.",
      ),
    ],
  ];
  return `<section id="craft-basics" class="craft-basics" aria-labelledby="craft-basics-title"><h2 id="craft-basics-title">${t("So funktioniert Crafting in RF4", "How crafting works in RF4")}</h2><div class="craft-explanation-grid">${cards.map(([title, body], index) => `<article class="guide-box"><span class="craft-kicker">0${index + 1}</span><h3>${title}</h3><p>${body}</p></article>`).join("")}</div><div class="guide-box"><h3>${t("Was der Simulator abbildet", "What the simulator covers")}</h3><p>${t("Alle Rezeptarten sind als Zutatenplan verfügbar. Bei Ausrüstung werden Grundwerte, gewählte numerische Vererbung, die Aufwertungsfolge sowie belegte Level- und Seltenheitsboni für ATK, M.ATK, DEF, M.DEF, STR, VIT und INT berechnet. Fehlende Seltenheitsdaten führen zu einer gekennzeichneten Teilberechnung. Spezialeffekte und RP-Verbrauch bleiben zum Nachschlagen mit den Itemdetails verknüpft.", "All recipe types support ingredient planning. For equipment, the simulator calculates base stats, selected numeric inheritance, upgrade order and documented level and rarity bonuses for ATK, M.ATK, DEF, M.DEF, STR, VIT and INT. Missing rarity data produces a labelled partial calculation. Special effects and RP usage remain available through item details.")}</p><div class="guide-sources"><a href="${craftingSources.rules}" target="_blank" rel="noreferrer">${t("Regeln & Vererbung · Kirbye2006", "Rules & inheritance · Kirbye2006")} ↗</a> · <a href="${craftingSources.tiers}" target="_blank" rel="noreferrer">${t("Bonusstufen ? adda", "Bonus tiers ? adda")} ?</a> ? <a href="${craftingSources.bonuses}" target="_blank" rel="noreferrer">${t("Aufwertungen & Bonustabellen · RF4 Wiki", "Upgrades & bonus tables · RF4 Wiki")} ↗</a> · <a href="https://therunefactory.fandom.com/wiki/Cooking_(RF4)" target="_blank" rel="noreferrer">${t("Kochen & Rezeptbrot", "Cooking & recipe bread")} ↗</a></div></div></section>`;
}
