import { escapeHtml } from "./html.js";
import { recipeUsesItem } from "./catalog.js";
import { attributePanel } from "./attributes.js";
import { publicUrl } from "./public-url.js";
import { acquisitionPanel } from "./recipe-acquisition.js";

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
  const cat = (name) => data.materialGroups[name] || name;
  const de = (name) => itemByName(name)?.de || "";
  const related = (r) =>
    `<button class="related" data-open="${r.id}"><span>${icon(r)} ${escapeHtml(r.name)}${r.de ? ` <small>/ ${escapeHtml(r.de)}*</small>` : ""}</span><span>${r.level ? "Lv. " + r.level : "↗"}</span></button>`;
  function chips(arr) {
    const counts = new Map();
    for (const x of arr) counts.set(x, (counts.get(x) || 0) + 1);
    return [...counts]
      .map(([n, c]) => {
        if (n.includes(" / ")) {
          return `<div class="ingredient-options"><span>${c > 1 ? c + " × " : ""}Eine Option wählen:</span>${chips(n.split(" / "))}</div>`;
        }
        const r = itemByName(n);
        return /* HTML */ `<button
          class="ingredient"
          ${r ? `data-open="${r.id}"` : `data-search="${escapeHtml(n)}"`}
        >
          <span>${c > 1 ? c + " × " : ""}${escapeHtml(n)}</span
          >${de(n) ? `<small>${escapeHtml(de(n))}*</small>` : ""}${data.materialGroups[n] ? "<small>Materialgruppe · ein passendes Material genügt</small>" : ""}
        </button>`;
      })
      .join("");
  }
  const fact = (label, value) =>
    `<div class="fact"><span>${label}</span><strong>${escapeHtml(value == null || value === "" ? "Nicht erfasst" : /^(WIP|N\/A)$/i.test(String(value)) ? "Im Wiki unbekannt" : value === "ー" ? "Keine" : value)}</strong></div>`;
  function modal(html) {
    $("#detail-body").innerHTML =
      '<button class="close" aria-label="Details schließen">✕</button>' + html;
    if (!$("#detail").open) $("#detail").showModal();
    $("#detail").scrollTop = 0;
  }
  function monsterStats(r) {
    return r.stats
      ? `<h3>Kampfwerte</h3><div class="attribute-grid">${Object.entries(
          r.stats,
        )
          .map(
            ([key, value]) =>
              `<div><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></div>`,
          )
          .join("")}</div>${
          r.resistances
            ? `<h3>Resistenzen & Status</h3><div class="attribute-grid">${Object.entries(
                r.resistances,
              )
                .map(
                  ([key, value]) =>
                    `<div><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></div>`,
                )
                .join("")}</div>`
            : ""
        }`
      : '<p class="subtle">Kampfwerte in der zugänglichen RF4-Quelle noch nicht erfasst.</p>';
  }
  function openDetail(id) {
    const r = find(id);
    if (!r) return;
    const used = data.recipes.filter((x) => recipeUsesItem(x, r.name)),
      made = data.recipes.filter((x) => x.name === r.name),
      drops = data.records.filter(
        (x) => x.type === "monster" && x.drops?.includes(r.name),
      );
    const german = r.de || de(r.name),
      nameRec = r.de ? r : itemByName(r.name);
    let body = "";
    if (r.station) {
      body = `<div class="facts">${fact("Werkbank", r.station)}${fact("Rezeptlevel", r.level)}${fact("Verkauf (Lv. 1)", r.sell != null ? r.sell + " G" : null)}</div><h3>Benötigte Materialien</h3><div class="ingredients">${chips(r.ingredients)}</div><p class="subtle">Wiederholte Materialien werden mit ihrer Anzahl gezeigt. Materialgruppen erlauben ein beliebiges passendes Item.</p>${r.effects ? `<h3>Werte & Effekte</h3><p class="effect">${escapeHtml(r.effects)}</p>` : ""}`;
    } else if (r.type === "monster") {
      body = `<div class="facts">${fact("Fundort", r.location)}${fact("Lieblingsitem / Zähmen", r.favorite)}${fact("Produktion in der Scheune", r.produce)}</div><h3>Beute</h3><div class="ingredients">${chips(r.drops)}</div>${monsterStats(r)}${r.dropDetails ? `<h3>Beute & Dropraten</h3><p>${escapeHtml(r.dropDetails)}</p>` : ""}`;
    } else {
      body = `<div class="facts">${fact("Kaufpreis", r.buy != null ? r.buy + " G" : null)}${fact("Verkaufspreis", r.sell != null ? r.sell + " G" : null)}${fact("Seltenheit", r.rarity)}${fact("Upgrade-Schwierigkeit", r.difficulty)}</div>${r.effects ? `<h3>Werte & Effekte</h3><p class="effect">${escapeHtml(r.effects)}</p>` : ""}${r.location ? `<h3>Fundort / Erhalt</h3><p>${escapeHtml(r.location)}</p>` : ""}${made.length ? `<h3>Herstellen <span>${made.length}</span></h3>${made.map(related).join("")}` : ""}${drops.length ? `<h3>Beute von <span>${drops.length}</span></h3>${drops.map(related).join("")}` : ""}${used.length ? `<h3>Verwendet für <span>${used.length}</span></h3>${used.map(related).join("")}` : '<p class="subtle">Keine weitere Verwendung in den importierten Rezepten erfasst.</p>'}`;
    }
    modal(
      /* HTML */ `<div class="eyebrow">
          RUNE FACTORY 4 · ${escapeHtml(cat(r.category))}
        </div>
        <span class="detail-icon">${thumbnail(r)}</span>
        ${r.imageCaption ? `<p class="image-caption">${escapeHtml(r.imageCaption)}</p>` : ""}
        <h2>${escapeHtml(r.name)}</h2>
        <p class="detail-de">
          ${german ? escapeHtml(german) + ' <span class="unverified">DE*</span>' : "Deutscher Name noch nicht verifiziert"}
        </p>
        ${german ? `<p class="translation-note">${escapeHtml(nameRec?.translationStatus || "Suchhilfe · offiziell unbestätigt")}${nameRec?.translationSource ? ` · <a href="${escapeHtml(nameRec.translationSource)}" target="_blank" rel="noreferrer">Beleg ↗</a>` : ""}</p>` : ""}<button
          class="save-detail"
          data-save="${r.id}"
        >
          ${saved.has(r.id) ? "★ Gemerkt" : "☆ Zur Merkliste hinzufügen"}</button
        >${body}${attributePanel(r.station ? itemByName(r.name) || r : r, escapeHtml)}${r.sourceConflicts?.length ? `<h3>Quellenabweichung</h3><p class="subtle">Die Einzelartikel nennen teilweise andere Materialien:</p>${r.sourceConflicts.map((c) => `<p>${escapeHtml(c.ingredients.join(" · "))} · <a href="${escapeHtml(c.source)}" target="_blank" rel="noreferrer">Quelle ↗</a></p>`).join("")}` : ""}
        ${acquisitionPanel(catalog.getAcquisitions(r), escapeHtml)}
        <div class="detail-source">
          ${r.imageCredit || r.imageSource ? `<a href="${escapeHtml(r.imageCredit || r.imageSource)}" target="_blank" rel="noreferrer">Bildquelle ↗</a> · ` : ""}
          <a href="${escapeHtml(r.source)}" target="_blank" rel="noreferrer"
            >RF4-Datenquelle ↗</a
          ><span>Datenstand: 29. Oktober 2026 · Fehlende Werte ≠ 0</span>
        </div>`,
    );
  }
  function showSources() {
    if (!data) return;
    modal(
      /* HTML */ `<div class="eyebrow">TRANSPARENTES ARCHIV</div>
        <h2>Quellen & Datenstand</h2>
        <p>
          Die Spielwerte stammen aus den RF4-Seiten des Rune Factory Wiki und
          der Itemliste von Ranch Story. Bilder ergänzen RF4-Einträge aus Ranch
          Story, RF4 Helper und belegten RF4-Spielberichten. Importiert am 29.
          Oktober 2026. Die zugänglichen Wiki-Snapshots sind teilweise älter.
        </p>
        <div class="facts">
          ${fact("Items / Materialien", data.records.filter((r) => r.type === "item").length)}${fact("Gegner", data.records.filter((r) => r.type === "monster").length)}${fact("Rezeptvarianten", data.recipes.length)}
        </div>
        <h3>Umfang</h3>
        <p>${escapeHtml(data.coverage)}</p>
        <h3>Deutsche Namen</h3>
        <p>
          Die offizielle deutsche Lokalisierung ist in Rune Factory 4 Special
          verfügbar. Eine vollständige öffentlich überprüfbare Namensliste wurde
          bei der Recherche nicht gefunden. Deshalb wird noch kein deutscher
          Item- oder Gegnername als offiziell verifiziert bezeichnet.
        </p>
        <p>
          Mit <b>DE*</b> gekennzeichnete Begriffe sind unbestätigte deutsche
          Suchhilfen, zusätzlich zu den englischen Namen. Die gefundene
          Fanübersetzung wurde nicht als offizielle Quelle übernommen.
        </p>
        <a
          href="https://store.steampowered.com/app/1580240/?l=german"
          target="_blank"
          rel="noreferrer"
          >Offizielle Sprachangaben bei Steam ↗</a
        >
        <h3>Vollständigkeitsprüfung</h3>
        <p>
          ${data.audit ? `${data.audit.detailPages} RF4-Einzelseiten ausgewertet · ${data.audit.itemsWithAttributes} Items mit Attributen · ${data.audit.monstersWithStats} Gegner mit Kampfwerten. ${data.audit.conflicts.length} Quellenabweichungen erfasst.` : "Import läuft."}
        </p>
        <a href="${publicUrl("completeness.json")}" target="_blank"
          >Prüfbericht mit offenen Einträgen ↗</a
        >
        <h3>Wiki-Quellen</h3>
        <p>
          Für ${data.audit?.recipeNamesWithAcquisition || 0} Rezepte sind
          besondere Fundorte belegt. Die
          ${data.audit?.recipeAcquisitionSources || 0} Angaben nennen Gebiet
          und, soweit dokumentiert, Raumkoordinate und Zugang. Jeder Fundort ist
          direkt mit seiner Quelle verlinkt.
        </p>
        <p>
          <a
            href="https://ranchstory.miraheze.org/wiki/Item_List_(Rune_Factory_4)"
            target="_blank"
            rel="noreferrer"
            >Ranch Story · RF4 Item List & Bilder ↗</a
          >
        </p>
        <div class="source-links">
          ${["Crafting", "Forging", "Cooking", "Pharmacy", "Monsters", "Other Items", "Crops"].map((n) => `<a href="https://therunefactory.fandom.com/wiki/${encodeURIComponent(n.replaceAll(" ", "_") + "_(RF4)")}" target="_blank" rel="noreferrer">${n} (RF4) ↗</a>`).join("")}
        </div>
        <h3>Grafiken & Schrift</h3>
        <p>
          <a
            href="https://ranchstory.miraheze.org/wiki/File:RF4S_OfficialPromoArt_Banner.png"
            target="_blank"
            rel="noreferrer"
            >RF4-Special-Promobanner</a
          >, Logo und Frey-Grafik: Ranch Story. Weitere RF4-Item- und
          Gegnersymbole:
          <a
            href="https://github.com/Ericoptero/rf4helper"
            target="_blank"
            rel="noreferrer"
            >RF4 Helper von Eric Nantes</a
          >. Abweichende Bildquellen und Bildausschnitte sind in den jeweiligen
          Details gekennzeichnet. Spielgrafiken © Marvelous / XSEED.
        </p>
        <p>
          Schriften: Alegreya und Nunito Sans, lokal eingebunden unter der SIL
          Open Font License.
        </p>
        <h3>Lizenz</h3>
        <p>
          Spielinformationen: Rune Factory Wiki, Ranch Story und deren
          Mitwirkende. Bilder: zugehörige Wiki-Einträge; Spielgrafiken ©
          Marvelous / XSEED. Wiki-Texte nach jeweiliger Quellenlizenz,
          <a
            href="https://creativecommons.org/licenses/by-sa/3.0/"
            target="_blank"
            rel="noreferrer"
            >CC BY-SA</a
          >, soweit im Wiki nicht anders angegeben. Die Tabellen wurden
          strukturiert, gekürzt und verknüpft. Inoffizielles Fanprojekt. Rune
          Factory gehört den jeweiligen Rechteinhabern.
        </p>
        <a
          class="download"
          href="${publicUrl("data.json")}"
          download="rf4-archiv.json"
          >↓ Strukturierten Datensatz herunterladen</a
        >`,
    );
  }
  return { openDetail, showSources };
}
