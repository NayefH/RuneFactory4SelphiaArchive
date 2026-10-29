import "./style.css";
import { createDetailController } from "./details.js";
import "./attributes.css";
import "./home.css";
import { createHome } from "./home.js";
import { createCatalog, recipeUsesItem } from "./catalog.js";
import { escapeHtml } from "./html.js";
import { loadFavorites, saveFavorites } from "./favorites.js";
import { createLayout } from "./layout.js";
import {
  contextLabels,
  attributeLabel,
  bonus,
  formatBonus,
} from "./attributes.js";
const $ = (selector) => document.querySelector(selector);
let catalog;
let detailController;
let attributeContext = "upgrade",
  attribute = "ATK";
let data,
  tab = "home",
  query = "",
  category = "",
  station = "",
  max = 99,
  sort = "name",
  page = 1,
  saved;
saved = loadFavorites();
const titles = {
  home: "Das Selphia Archiv",
  item: "Items & Materialien",
  recipe: "Rezepte & Herstellung",
  monster: "Das Bestiarium",
  saved: "Deine Merkliste",
};
const labels = {
  home: "Start",
  item: "Items",
  recipe: "Rezepte",
  monster: "Bestiarium",
  saved: "Merkliste",
};
$("#app").innerHTML = createLayout(labels);
const all = () => catalog.allRecords;
const find = (id) => catalog.byId.get(id);
const cat = (n) => data.materialGroups[n] || n;
const itemByName = (name) => catalog.getItem(name);
const de = (n) => itemByName(n)?.de || "";
const thumbnail = (r) => {
  const rec = r.station ? itemByName(r.name) : r;
  return rec?.image
    ? `<img src="${escapeHtml(rec.image)}" alt="${escapeHtml(r.name)} (RF4)" loading="lazy" decoding="async">`
    : icon(r);
};
const icon = (r) =>
  r.type === "monster"
    ? "♞"
    : r.station
      ? "⚒"
      : /Ring|Brooch|Bracelet|Pendant/.test(r.name)
        ? "◉"
        : r.category === "Kochen"
          ? "♧"
          : "◇";
const recordList = () => catalog.list(tab, saved);
function updateAttributeOptions() {
  if (!data) return;
  const keys = [
    ...new Set(
      data.records
        .filter((r) => r.type === "item")
        .flatMap((r) => Object.keys(r.attributes?.[attributeContext] || {})),
    ),
  ];
  const priority = [
    "ATK",
    "DEF",
    "M.ATK",
    "M.DEF",
    "STR",
    "VIT",
    "INT",
    "HP",
    "RP",
    "HP MAX",
    "RP MAX",
  ];
  keys.sort(
    (a, b) =>
      (priority.indexOf(a) < 0 ? 100 : priority.indexOf(a)) -
        (priority.indexOf(b) < 0 ? 100 : priority.indexOf(b)) ||
      a.localeCompare(b),
  );
  if (!keys.includes(attribute)) attribute = keys[0] || "ATK";
  $("#attribute").innerHTML = keys
    .map(
      (k) =>
        `<option value="${escapeHtml(k)}">${escapeHtml(attributeLabel(k))} · ${escapeHtml(k)}</option>`,
    )
    .join("");
  $("#attribute").value = attribute;
  $("#attribute-context").value = attributeContext;
  $("#attribute-controls").hidden = !["item", "saved"].includes(tab);
}
function options() {
  updateAttributeOptions();
  const list = recordList();
  $("#category").innerHTML =
    '<option value="">Alle Kategorien</option>' +
    [...new Set(list.map((r) => r.category))]
      .sort()
      .map(
        (c) =>
          `<option value="${escapeHtml(c)}">${escapeHtml(cat(c))}</option>`,
      )
      .join("");
  $("#station").innerHTML =
    '<option value="">Alle Werkbänke</option>' +
    [...new Set(data.recipes.map((r) => r.station))]
      .sort()
      .map((s) => `<option>${escapeHtml(s)}</option>`)
      .join("");
  $("#station-wrap").hidden = tab !== "recipe";
  $("#level-wrap").hidden = tab !== "recipe";
}
function sync() {
  const p = new URLSearchParams();
  if (tab !== "home") p.set("tab", tab);
  if (query) p.set("q", query);
  if (category) p.set("category", category);
  if (station) p.set("station", station);
  if (max !== 99) p.set("max", max);
  if (sort !== "name") p.set("sort", sort);
  if (sort.startsWith("bonus")) {
    p.set("context", attributeContext);
    p.set("attribute", attribute);
  }
  history.replaceState(null, "", location.pathname + (p.size ? "?" + p : ""));
}
function render() {
  if (!data) return;
  $("#home").hidden = tab !== "home";
  $("#directory").hidden = tab === "home";
  $("#breadcrumb").textContent = labels[tab];
  document.querySelectorAll(".nav[data-tab]").forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $("#count-saved").textContent = saved.size;
  if (tab === "home") {
    sync();
    return;
  }
  const list = catalog.select(
    {
      tab,
      query,
      category,
      station,
      maxRecipeLevel: max,
      sort,
      attributeContext,
      attribute,
    },
    saved,
  );
  const pages = Math.max(1, Math.ceil(list.length / 30));
  page = Math.min(page, pages);
  $("#section-title").textContent = titles[tab];
  $("#breadcrumb").textContent = labels[tab];
  $("#total").textContent =
    recordList().length.toLocaleString("de-DE") + " Einträge";
  $("#result-count").textContent =
    list.length.toLocaleString("de-DE") +
    " Treffer" +
    (query ? " für „" + query + "“" : "");
  $("#results").innerHTML = list.length
    ? `<div class="table-head"><span>Name</span><span>Kategorie / Werkbank</span><span>${tab === "monster" ? "Fundort" : tab === "recipe" ? "Materialien" : "Daten / Verwendung"}</span><span></span></div>` +
      list
        .slice((page - 1) * 30, page * 30)
        .map((r) => {
          const used = data.recipes.filter((x) => recipeUsesItem(x, r.name));
          const info =
            r.type === "monster"
              ? r.location
              : r.station
                ? r.ingredients.join(" · ")
                : r.effects ||
                  r.location ||
                  (used.length
                    ? `In ${used.length} Rezepten verwendet`
                    : "Details und Verknüpfungen");
          const german = r.de || de(r.name);
          const score = bonus(r, attributeContext, attribute);
          const recipeLocations = r.station
            ? [
                ...new Set(
                  catalog.getAcquisitions(r).map((entry) => entry.location),
                ),
              ]
            : [];
          return /* HTML */ `<div class="result-row">
            <button class="entry" data-open="${r.id}">
              <span
                class="item-icon ${r.type === "monster" ? "monster-icon" : r.station ? "recipe-icon" : ""}"
                >${thumbnail(r)}</span
              ><span class="entry-name"
                ><strong>${escapeHtml(r.name)}</strong
                >${german ? `<small>${escapeHtml(german)} <span class="unverified" title="Offizielle Übersetzung noch nicht verifiziert">DE*</span></small>` : '<small class="translation-missing">Deutscher Name noch nicht verifiziert</small>'}</span
              >
            </button>
            <div class="category-cell">
              <span class="tag ${r.type === "monster" ? "rose" : ""}"
                >${escapeHtml(cat(r.category))}</span
              >${r.station ? `<small>${escapeHtml(r.station)} <b>Lv. ${r.level}</b></small>` : ""}
            </div>
            <button class="info-cell" data-open="${r.id}">
              ${sort.startsWith("bonus") ? `<span class="bonus-value">${escapeHtml(formatBonus(score, attribute))}</span><small>${escapeHtml(attributeLabel(attribute))} · ${escapeHtml(contextLabels[attributeContext])}</small>` : escapeHtml(info)}${recipeLocations.length ? `<span class="recipe-location">Rezept: ${escapeHtml(recipeLocations.join(" · "))}</span>` : ""}</button
            ><button
              class="favorite ${saved.has(r.id) ? "is-saved" : ""}"
              data-save="${r.id}"
              aria-label="${saved.has(r.id) ? "Aus Merkliste entfernen" : "Merken"}: ${escapeHtml(r.name)}"
              aria-pressed="${saved.has(r.id)}"
            >
              ${saved.has(r.id) ? "★" : "☆"}
            </button>
          </div>`;
        })
        .join("")
    : `<div class="empty"><span>⌕</span><h3>${tab === "saved" && !saved.size ? "Dein Abenteuer beginnt hier." : "Keine passenden Einträge."}</h3><p>${tab === "saved" && !saved.size ? "Markiere Items, Rezepte oder Gegner mit dem Stern." : "Probiere einen englischen Namen oder entferne einige Filter."}</p><button data-reset class="primary">${tab === "saved" && !saved.size ? "Items entdecken" : "Filter zurücksetzen"}</button></div>`;
  $("#pagination").innerHTML = list.length
    ? `<span>${(page - 1) * 30 + 1}–${Math.min(page * 30, list.length)} von ${list.length}</span><div><button data-page="${page - 1}" ${page === 1 ? "disabled" : ""} aria-label="Vorherige Seite">←</button><span>Seite ${page} / ${pages}</span><button data-page="${page + 1}" ${page === pages ? "disabled" : ""} aria-label="Nächste Seite">→</button></div>`
    : "";
  sync();
}
function switchTab(t) {
  if (t === "home" || tab === "home") {
    query = "";
    $("#search").value = "";
  }
  tab = t;
  if (!["item", "saved"].includes(t) && sort.startsWith("bonus")) {
    sort = "name";
    $("#sort").value = "name";
  }
  category = "";
  station = "";
  max = 99;
  page = 1;
  $("#max").value = 99;
  options();
  render();
}
function reset() {
  if (tab === "saved" && !saved.size) switchTab("item");
  query = "";
  category = "";
  station = "";
  max = 99;
  sort = "name";
  page = 1;
  $("#search").value = "";
  $("#category").value = "";
  $("#station").value = "";
  $("#max").value = 99;
  $("#sort").value = "name";
  render();
}
function openDetail(id) {
  detailController?.openDetail(id);
}
function showSources() {
  detailController?.showSources();
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.id === "sort-attribute") {
    sort = "bonus-desc";
    $("#sort").value = sort;
    page = 1;
    render();
  }
  if (t.dataset.tab) switchTab(t.dataset.tab);
  if (t.hasAttribute("data-home-bonuses")) {
    switchTab("item");
    sort = "bonus-desc";
    $("#sort").value = sort;
    render();
  }
  if (t.dataset.open) openDetail(t.dataset.open);
  if (t.hasAttribute("data-sources")) showSources();
  if (t.hasAttribute("data-reset")) reset();
  if (t.classList.contains("close")) $("#detail").close();
  if (t.dataset.save) {
    const id = t.dataset.save;
    saved.has(id) ? saved.delete(id) : saved.add(id);
    saveFavorites(saved);
    render();
    if (t.classList.contains("save-detail"))
      t.textContent = saved.has(id)
        ? "★ Gemerkt"
        : "☆ Zur Merkliste hinzufügen";
    $("#toast").textContent = saved.has(id)
      ? "In deiner Merkliste gespeichert"
      : "Aus deiner Merkliste entfernt";
    $("#toast").classList.add("visible");
    setTimeout(() => $("#toast").classList.remove("visible"), 1800);
  }
  if (t.dataset.page) {
    page = +t.dataset.page;
    render();
    $(".directory").scrollIntoView({ behavior: "smooth" });
  }
  if (t.dataset.search) {
    if ($("#detail").open) $("#detail").close();
    if (tab === "saved" || tab === "home") switchTab("item");
    query = t.dataset.search;
    category = "";
    station = "";
    page = 1;
    $("#search").value = query;
    $("#category").value = "";
    $("#station").value = "";
    render();
    $(".directory").scrollIntoView({ behavior: "smooth" });
  }
});
document.addEventListener("submit", (event) => {
  if (event.target.id !== "home-search-form") return;
  event.preventDefault();
  const search = $("#home-query").value.trim();
  switchTab($("#home-scope").value);
  query = search;
  $("#search").value = query;
  render();
  $("#search").focus();
});
$("#attribute-context").addEventListener("change", (e) => {
  attributeContext = e.target.value;
  updateAttributeOptions();
  sort = "bonus-desc";
  $("#sort").value = sort;
  page = 1;
  render();
});
$("#attribute").addEventListener("change", (e) => {
  attribute = e.target.value;
  sort = "bonus-desc";
  $("#sort").value = sort;
  page = 1;
  render();
});
document.addEventListener(
  "error",
  (e) => {
    if (e.target.tagName === "IMG") {
      e.target.replaceWith(document.createTextNode("◇"));
    }
  },
  true,
);
$("#search").addEventListener("input", (e) => {
  query = e.target.value;
  page = 1;
  render();
});
for (const id of ["category", "station", "max", "sort"])
  $("#" + id).addEventListener("change", (e) => {
    if (id === "category") category = e.target.value;
    if (id === "station") station = e.target.value;
    if (id === "max") {
      max = Math.max(1, Math.min(99, +e.target.value || 99));
      e.target.value = max;
    }
    if (id === "sort") sort = e.target.value;
    page = 1;
    render();
  });
document.addEventListener("keydown", (e) => {
  if (
    e.key === "/" &&
    !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) &&
    !$("#detail").open
  ) {
    e.preventDefault();
    $(tab === "home" ? "#home-query" : "#search").focus();
  }
});
$("#detail").addEventListener("click", (e) => {
  if (e.target === $("#detail")) {
    const b = $("#detail").getBoundingClientRect();
    if (
      e.clientX < b.left ||
      e.clientX > b.right ||
      e.clientY < b.top ||
      e.clientY > b.bottom
    )
      $("#detail").close();
  }
});
async function init() {
  try {
    const response = await fetch("/data.json");
    if (!response.ok) throw Error();
    data = await response.json();
    catalog = createCatalog(data);
    $("#home").innerHTML = createHome(data);
    saved = new Set([...saved].filter((id) => catalog.byId.has(id)));
    detailController = createDetailController({
      data,
      catalog,
      favoriteIds: saved,
      thumbnail,
      icon,
    });
    for (const t of ["item", "monster"])
      $("#count-" + t).textContent = data.records.filter(
        (r) => r.type === t,
      ).length;
    $("#count-recipe").textContent = data.recipes.length;
    const p = new URLSearchParams(location.search);
    tab = Object.hasOwn(titles, p.get("tab"))
      ? p.get("tab")
      : p.has("q")
        ? "item"
        : "home";
    query = p.get("q") || "";
    sort = ["name", "name-desc", "level", "bonus-desc", "bonus-asc"].includes(
      p.get("sort"),
    )
      ? p.get("sort")
      : "name";
    max = Math.max(1, Math.min(99, Number(p.get("max")) || 99));
    attributeContext = Object.hasOwn(contextLabels, p.get("context"))
      ? p.get("context")
      : "upgrade";
    attribute = p.get("attribute") || "ATK";
    options();
    category = [...$("#category").options].some(
      (o) => o.value === p.get("category"),
    )
      ? p.get("category")
      : "";
    station =
      tab === "recipe" &&
      [...$("#station").options].some((o) => o.value === p.get("station"))
        ? p.get("station")
        : "";
    $("#search").value = query;
    $("#category").value = category;
    $("#station").value = station;
    $("#max").value = max;
    $("#sort").value = sort;
    render();
  } catch {
    $("#result-count").textContent =
      "Die Wiki-Daten konnten nicht geladen werden.";
    $("#results").innerHTML =
      '<div class="empty"><h3>Das Archiv ist gerade nicht erreichbar.</h3><p>Bitte lade die Seite erneut.</p><button onclick="location.reload()" class="primary">Erneut laden</button></div>';
  }
}
init();
