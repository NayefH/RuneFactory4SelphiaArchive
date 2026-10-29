export function createLayout(labels) {
  return /* HTML */ `<aside class="sidebar">
      <a class="brand" href="/" aria-label="Selphia Archiv – Startseite">
        <img class="rf4-logo" src="/design/rf4-logo.png" alt="Rune Factory 4" />
        <span>SELPHIA<small>DAS RUNENARCHIV</small></span>
      </a>
      <nav aria-label="Verzeichnis">
        ${Object.entries(labels)
          .map(
            ([id, label]) =>
              `<button class="nav ${id === "home" ? "active" : ""}" data-tab="${id}" aria-label="${label}"><span aria-hidden="true">${{ home: "⌂", item: "◇", recipe: "⚒", monster: "♞", saved: "☆" }[id]}</span><b>${label}</b>${id === "home" ? "" : `<i id="count-${id}">—</i>`}</button>`,
          )
          .join("")}
      </nav>
      <div class="side-art" aria-hidden="true">
        <img src="/design/frey-rf4.png" alt="" />
      </div>
      <button class="source-button" data-sources>ⓘ Quellen & Datenstand</button
      ><small class="sidebar-bottom"
        >Ein inoffizielles Fanprojekt<br />Nur Daten aus Rune Factory 4</small
      >
    </aside>
    <div class="workspace">
      <header class="topbar">
        <span
          >Das Selphia Archiv <span class="slash">/</span>
          <b id="breadcrumb">Items</b></span
        ><a
          href="https://therunefactory.fandom.com/wiki/Rune_Factory_4"
          target="_blank"
          rel="noreferrer"
          >Rune Factory Wiki ↗</a
        >
      </header>
      <main>
        <section id="home" hidden aria-label="Startseite"></section>
        <section class="directory" id="directory">
          <div class="section-heading">
            <div><h1 id="section-title">Items & Materialien</h1></div>
            <span id="total" class="total">Lade Daten …</span>
          </div>
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
              placeholder="Name, Material, Beute oder Fundort suchen …"
              aria-label="Verzeichnis durchsuchen"
              autocomplete="off"
            /><kbd>/</kbd>
          </div>
          <div class="suggestions">
            Zum Beispiel <button data-search="Iron">Iron / Eisen</button
            ><button data-search="Wooly">Wooly</button
            ><button data-search="Wind Crystal">Wind Crystal</button>
          </div>
          <div class="filters">
            <label
              >Kategorie<select id="category">
                <option value="">Alle Kategorien</option>
              </select></label
            ><label id="station-wrap" hidden
              >Werkbank<select id="station">
                <option value="">Alle Werkbänke</option>
              </select></label
            ><label id="level-wrap" hidden
              >Rezeptlevel bis<input
                id="max"
                type="number"
                min="1"
                max="99"
                value="99" /></label
            ><label class="sort"
              >Sortieren<select id="sort">
                <option value="name">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="level">Rezeptlevel ↑</option>
                <option value="bonus-desc">Attributbonus ↓</option>
                <option value="bonus-asc">Attributbonus ↑</option>
              </select></label
            ><button class="reset" data-reset title="Filter zurücksetzen">
              ↺ <span>Zurücksetzen</span>
            </button>
          </div>
          <div class="attribute-controls" id="attribute-controls">
            <div class="attribute-intro">
              <b>✦ Boni vergleichen</b
              ><span>Einzelne Attribute wie in der Itemliste sortieren.</span>
            </div>
            <label
              >Bonusart<select id="attribute-context">
                <option value="upgrade">Upgrade-Bonus</option>
                <option value="base">Ausrüstung · Grundwerte</option>
                <option value="consume">Beim Verzehr</option>
                <option value="cook">Als Kochzutat</option>
              </select></label
            ><label>Attribut<select id="attribute"></select></label
            ><button id="sort-attribute" class="bonus-sort">
              Höchster Bonus ↓
            </button>
          </div>
          <div class="results-heading">
            <span id="result-count" role="status" aria-live="polite"
              >Daten werden geladen …</span
            ><span>Eintrag auswählen für Details ↗</span>
          </div>
          <div id="results"></div>
          <div class="pagination" id="pagination"></div>
        </section>
        <footer>
          <span>✧ SELPHIA ARCHIV</span>
          <p>
            Wiki-Tabellen, neu geordnet. Daten können Lücken enthalten.<br />Deutsche
            Suchhilfen sind noch nicht als offizielle Lokalisierung verifiziert.
          </p>
          <button data-sources>Quellen & Lizenz ↗</button>
        </footer>
      </main>
    </div>
    <dialog id="detail"><div id="detail-body"></div></dialog>
    <div class="toast" role="status" id="toast"></div>`;
}
