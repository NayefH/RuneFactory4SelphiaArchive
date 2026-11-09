import { characters, characterCoverage } from "./character-data.js";
import { escapeHtml as esc } from "./html.js";
import { getLanguage, t } from "./i18n.js";
import { displayName } from "./data-localization.js";

export const characterRoles = {
  get bachelor() {
    return t("Bachelor · Heiratskandidat", "Bachelor · Marriage candidate");
  },
  get bachelorette() {
    return t(
      "Bachelorette · Heiratskandidatin",
      "Bachelorette · Marriage candidate",
    );
  },
  get resident() {
    return t("Bewohner/in", "Resident");
  },
  get visitor() {
    return t("Gast", "Visitor");
  },
  get child() {
    return t("Kind", "Child");
  },
  get story() {
    return t("Weitere Figur", "Other character");
  },
};

const translatedNote = (note) =>
  Array.isArray(note)
    ? t(...note)
    : typeof note === "object" && note
      ? note[getLanguage()]
      : note || "";
const giftLabel = (name) =>
  ({
    "All fish": t("Alle Fische", "All fish"),
    "All vegetables": t("Alle Gemüsesorten", "All vegetables"),
    "All flowers": t("Alle Blumen", "All flowers"),
    "All grilled fish except Salted Pike": t(
      "Alle gegrillten Fische außer gesalzenem Hecht (Salted Pike)",
      "All grilled fish except Salted Pike",
    ),
    "All sashimi except Fall Sashimi": t(
      "Alle Sashimi außer Herbst-Sashimi (Fall Sashimi)",
      "All sashimi except Fall Sashimi",
    ),
  })[name] || displayName(name);
export function selectCharacters(filter = "all", query = "") {
  const term = query.trim().toLocaleLowerCase();
  return characters.filter((c) => {
    const roleMatches =
      filter === "all" ||
      (filter === "other"
        ? !["bachelor", "bachelorette"].includes(c.role)
        : c.role === filter);
    const names = [
      c.name,
      ...["loved", "liked", "disliked", "hated"].flatMap((k) =>
        (c[k] || []).flatMap((n) => [n, giftLabel(n)]),
      ),
    ];
    return (
      roleMatches &&
      (!term || names.join(" ").toLocaleLowerCase().includes(term))
    );
  });
}

export function characterCards(data, filter = "all", query = "") {
  const selected = selectCharacters(filter, query);
  const itemLink = (value) => {
    const item = data.records.find(
      (r) => r.type === "item" && r.name === value,
    );
    const label = item ? displayName(item) : giftLabel(value);
    return `<li>${item ? `<button class="guide-link" data-open="${esc(item.id)}">${esc(label)} ↗</button>` : esc(label)}${getLanguage() === "de" && label !== value ? `<small>${esc(value)}</small>` : ""}</li>`;
  };
  const headings = {
    loved: t("♥ Geliebt", "♥ Loved"),
    liked: t("+ Gemocht", "+ Liked"),
    disliked: t("− Ungeliebt", "− Disliked"),
    hated: t("× Verhasst", "× Hated"),
  };
  const cards = selected
    .map(
      (c) =>
        `<article class="character-card"><header><span class="character-initial" aria-hidden="true">${esc(c.name[0])}</span><div><h2>${esc(c.name)}</h2><span class="character-role ${["bachelor", "bachelorette"].includes(c.role) ? "marriage-candidate" : ""}">${["bachelor", "bachelorette"].includes(c.role) ? "♡ " : ""}${esc(characterRoles[c.role] || characterRoles.story)}</span></div></header>${c.birthday ? `<p class="subtle">${t("Geburtstag", "Birthday")}: ${esc(translatedNote(c.birthday))}</p>` : ""}${
          c.giftable === false
            ? `<p>${esc(translatedNote(c.notes) || t("Für diese Figur ist keine eigene Geschenkannahme dokumentiert.", "No individual gift-giving interaction is documented for this character."))}</p>`
            : `<div class="gift-grid">${Object.entries(headings)
                .map(
                  ([key, label]) =>
                    `<section class="gift-group ${key}"><h3>${label}</h3>${c[key]?.length ? `<ul>${c[key].map(itemLink).join("")}</ul>` : `<p class="subtle">${t("Keine gesonderten Angaben in der Quelle.", "No separate entries in the source.")}</p>`}</section>`,
                )
                .join(
                  "",
                )}</div>${c.notes ? `<p class="character-note">${esc(translatedNote(c.notes))}</p>` : ""}`
        }${c.source ? `<a class="guide-sources" href="${esc(c.source)}" target="_blank" rel="noreferrer">${t("RF4-Geschenkliste & Quelle", "RF4 gift list & source")} ↗</a>` : ""}</article>`,
    )
    .join("");
  return {
    count: selected.length,
    html:
      cards ||
      `<p class="guide-box">${t("Keine passenden Charaktere. Versuche einen anderen Namen oder ein anderes Geschenk.", "No matching characters. Try another name or gift.")}</p>`,
  };
}

export function createCharacterGuide(data, filter = "all", query = "") {
  const cards = characterCards(data, filter, query);
  const options = [
    ["all", t("Alle Charaktere", "All characters")],
    ["bachelor", "Bachelors"],
    ["bachelorette", "Bachelorettes"],
    ["other", t("Bewohner & weitere Figuren", "Residents & other characters")],
  ];
  return `<header class="guide-heading"><span class="home-kicker">RUNE FACTORY 4 · ${t("FREUNDSCHAFT & LIEBE", "FRIENDSHIP & ROMANCE")}</span><h1>${t("Charaktere & Geschenke", "Characters & gifts")}</h1><p>${t("Lerne die Bewohner von Selphia kennen. Heiratskandidaten sind mit einem Herz und als Bachelor oder Bachelorette markiert.", "Meet the people of Selphia. Marriage candidates are marked with a heart and a Bachelor or Bachelorette badge.")}</p></header>
  <div class="guide-box"><p>${t("Jeder Geschenkeintrag unterscheidet geliebte, gemochte, ungeliebte und verhasste Items. Die verlinkten Items öffnen die Datenbank mit Rezepten und verfügbaren Fundorten. Gruppen wie „alle Fische“ stehen für ganze Itemkategorien.", "Gift lists distinguish loved, liked, disliked and hated items. Linked items open database details with recipes and available locations. Groups such as “all fish” refer to entire item categories.")}</p><p>${esc(translatedNote(characterCoverage))}</p><p>${t("Storybedingungen und abweichende Quellenangaben stehen bei der jeweiligen Figur.", "Story requirements and source discrepancies appear with each character.")}</p></div>
  <div class="category-chips character-filters" role="group" aria-label="${t("Charaktergruppe", "Character group")}">${options.map(([value, label]) => `<button class="category-chip" data-character-filter="${value}" aria-pressed="${filter === value}">${label} <span>${selectCharacters(value).length}</span></button>`).join("")}</div>
  <label class="character-search" for="character-query">${t("Nach Charakter oder Geschenk suchen", "Search characters or gifts")}<input id="character-query" type="search" value="${esc(query)}" placeholder="${t("Zum Beispiel Dylas oder Apfel", "For example Dylas or Apple")}"></label>
  <p id="character-count" role="status" aria-live="polite">${cards.count} ${t("Charaktere", "characters")}</p><div class="character-grid" id="character-results">${cards.html}</div>`;
}
