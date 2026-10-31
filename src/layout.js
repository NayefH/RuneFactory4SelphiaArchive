import { publicUrl } from "./public-url.js";
import { t, getLanguage } from "./i18n.js";
import { displayName } from "./data-localization.js";

export const navigationLabels = {
  get home() {
    return t("Start", "Home");
  },
  get item() {
    return t("Items", "Items");
  },
  get recipe() {
    return t("Rezepte", "Recipes");
  },
  get monster() {
    return t("Bestiarium", "Bestiary");
  },
  get saved() {
    return t("Merkliste", "Favorites");
  },
};

export function createLayout(labels = navigationLabels, assetUrl = publicUrl) {
  // The build-time homepage renderer replaces this exact placeholder.
  const homeSection = `<section id="home" hidden aria-label="${t("Startseite", "Home")}"></section>`;
  return /* HTML */ `<aside class="sidebar">
      <a
        class="brand"
        href="${assetUrl()}"
        aria-label="${t("Selphia Archiv – Startseite", "Selphia Archive – Home")}"
      >
        <img
          class="rf4-logo"
          src="${assetUrl("design/rf4-logo-transparent.png")}"
          alt="Rune Factory 4"
        />
        <span
          >SELPHIA<small
            >${t("DAS RUNENARCHIV", "THE RUNE ARCHIVE")}</small
          ></span
        >
      </a>
      <nav aria-label="${t("Verzeichnis", "Directory")}">
        ${Object.entries(labels)
          .map(
            ([id, label]) =>
              `<button class="nav ${id === "home" ? "active" : ""}" data-tab="${id}" aria-label="${label}"><span aria-hidden="true">${{ home: "⌂", item: "◇", recipe: "⚒", monster: "♞", saved: "☆" }[id]}</span><b>${label}</b>${id === "home" ? "" : `<i id="count-${id}">—</i>`}</button>`,
          )
          .join("")}
      </nav>
      <button class="source-button" data-sources>
        ⓘ ${t("Quellen & Datenstand", "Sources & data")}</button
      ><small class="sidebar-bottom"
        >${t("Ein inoffizielles Fanprojekt", "An unofficial fan project")}<br />${t("Nur Daten aus Rune Factory 4", "Rune Factory 4 data only")}</small
      >
    </aside>
    <div class="workspace">
      <header class="topbar">
        <span
          >${t("Das Selphia Archiv", "The Selphia Archive")}
          <span class="slash">/</span> <b id="breadcrumb">Items</b></span
        >
        <div class="topbar-actions">
          <a
            href="https://therunefactory.fandom.com/wiki/Rune_Factory_4"
            target="_blank"
            rel="noreferrer"
            >Rune Factory Wiki ↗</a
          >
          <label class="language-control" for="language-switch"
            ><svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c4 5 4 13 0 18M12 3c-4 5-4 13 0 18" /></svg
            ><span class="language-label">${t("Sprache", "Language")}</span
            ><select
              id="language-switch"
              aria-label="${t("Sprache wählen", "Choose language")}"
            >
              <option
                value="de"
                lang="de"
                ${getLanguage() === "de" ? "selected" : ""}
              >
                Deutsch
              </option>
              <option
                value="en"
                lang="en"
                ${getLanguage() === "en" ? "selected" : ""}
              >
                English
              </option>
            </select></label
          >
        </div>
      </header>
      <main>
        ${homeSection}
        <section class="directory" id="directory">
          <div class="section-heading">
            <div>
              <h1 id="section-title">
                ${t("Items & Materialien", "Items & materials")}
              </h1>
            </div>
            <span id="total" class="total"
              >${t("Lade Daten …", "Loading data …")}</span
            >
          </div>
          <section
            class="category-browser"
            aria-labelledby="category-browser-title"
          >
            <h2 id="category-browser-title">
              ${t("Nach Kategorie entdecken", "Browse by category")}
            </h2>
            <p>
              ${t("Wähle zuerst einen Bereich und grenze die Auswahl danach weiter ein.", "Choose a section first, then narrow down your selection.")}
            </p>
            <div
              class="category-chips"
              id="category-groups"
              role="group"
              aria-label="${t("Bereich wählen", "Choose a section")}"
            ></div>
            <div
              class="category-chips category-subtypes"
              id="category-types"
              role="group"
              aria-label="${t("Kategorie wählen", "Choose a category")}"
              hidden
            ></div>
          </section>
          <div class="search-box">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
            >
              <circle cx="10" cy="10" r="7" />
              <path d="m15 15 6 6" /></svg
            ><input
              id="search"
              type="search"
              placeholder="${t("Name, Material, Beute oder Fundort suchen …", "Search names, materials, drops or locations …")}"
              aria-label="${t("Verzeichnis durchsuchen", "Search the directory")}"
              autocomplete="off"
            /><kbd>/</kbd>
          </div>
          <div class="suggestions">
            ${t("Zum Beispiel", "For example")}
            <button data-search="Iron">${displayName("Iron")}</button
            ><button data-search="Wooly">Wooly</button
            ><button data-search="Wind Crystal">
              ${displayName("Wind Crystal")}
            </button>
          </div>
          <div class="filters">
            <label
              >${t("Kategorie", "Category")}<select id="category">
                <option value="">
                  ${t("Alle Kategorien", "All categories")}
                </option>
              </select></label
            ><label id="station-wrap" hidden
              >${t("Werkbank", "Station")}<select id="station">
                <option value="">${t("Alle Werkbänke", "All stations")}</option>
              </select></label
            ><label id="level-wrap" hidden
              >${t("Rezeptlevel bis", "Recipe level up to")}<input
                id="max"
                type="number"
                min="1"
                max="99"
                value="99" /></label
            ><label class="sort"
              >${t("Sortieren", "Sort by")}<select id="sort">
                <option value="name">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="level">
                  ${t("Rezeptlevel", "Recipe level")} ↑
                </option>
                <option value="bonus-desc">
                  ${t("Attributbonus", "Attribute bonus")} ↓
                </option>
                <option value="bonus-asc">
                  ${t("Attributbonus", "Attribute bonus")} ↑
                </option>
              </select></label
            ><button
              class="reset"
              data-reset
              title="${t("Filter zurücksetzen", "Reset filters")}"
            >
              ↺ <span>${t("Zurücksetzen", "Reset")}</span>
            </button>
          </div>
          <div class="attribute-controls" id="attribute-controls">
            <div class="attribute-intro">
              <b>✦ ${t("Boni vergleichen", "Compare bonuses")}</b
              ><span
                >${t("Einzelne Attribute wie in der Itemliste sortieren.", "Sort individual attributes as in the item list.")}</span
              >
            </div>
            <label
              >${t("Bonusart", "Bonus type")}<select id="attribute-context">
                <option value="upgrade">
                  ${t("Upgrade-Bonus", "Upgrade bonus")}
                </option>
                <option value="base">
                  ${t("Ausrüstung · Grundwerte", "Equipment · base stats")}
                </option>
                <option value="consume">
                  ${t("Beim Verzehr", "When consumed")}
                </option>
                <option value="cook">
                  ${t("Als Kochzutat", "As a cooking ingredient")}
                </option>
              </select></label
            ><label
              >${t("Attribut", "Attribute")}<select
                id="attribute"
              ></select></label
            ><button id="sort-attribute" class="bonus-sort">
              ${t("Höchster Bonus", "Highest bonus")} ↓
            </button>
          </div>
          <div class="results-heading">
            <span id="result-count" role="status" aria-live="polite"
              >${t("Daten werden geladen …", "Loading data …")}</span
            ><span
              >${t("Eintrag auswählen für Details", "Select an entry for details")}
              ↗</span
            >
          </div>
          <div id="results"></div>
          <div class="pagination" id="pagination"></div>
        </section>
        <footer>
          <span>✧ ${t("SELPHIA ARCHIV", "SELPHIA ARCHIVE")}</span>
          <p>
            ${t("Ein Fanprojekt von Nayef Hajjaj. Daten können Lücken enthalten.", "A fan project by Nayef Hajjaj. Some data may be incomplete.")}<br />${t("Deutsche Spielbegriffe sind Fanübersetzungen und keine verifizierte offizielle Lokalisierung.", "German game terms are fan translations, not a verified official localization.")}
          </p>
          <button data-sources>
            ${t("Quellen & Lizenz", "Sources & license")} ↗
          </button>
        </footer>
      </main>
    </div>
    <dialog id="detail"><div id="detail-body"></div></dialog>
    <div class="toast" role="status" id="toast"></div>`;
}
