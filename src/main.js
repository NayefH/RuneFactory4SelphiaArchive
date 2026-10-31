import "./style.css";
import { createDetailController } from "./details.js";
import "./attributes.css";
import "./home.css";
import "./categories.css";
import { createHome } from "./home.js";
import { publicUrl } from "./public-url.js";
import { createCatalog, recipeUsesItem } from "./catalog.js";
import {
  canonicalCategory,
  categoryGroup,
  categoryGroups,
  categoriesFor,
  categoryOptions,
} from "./categories.js";
import { escapeHtml } from "./html.js";
import { loadFavorites, saveFavorites } from "./favorites.js";
import { createLayout, navigationLabels } from "./layout.js";
import {
  getLanguage,
  setLanguage,
  t,
  locale,
  updateDocumentLanguage,
} from "./i18n.js";
import { displayName, localizeText } from "./data-localization.js";
import {
  contextLabels,
  attributeLabel,
  bonus,
  formatBonus,
} from "./attributes.js";
const $ = (selector) => document.querySelector(selector);
let catalog;
let detailController;
let loadFailed = false;
let attributeContext = "upgrade",
  attribute = "ATK";
let data,
  tab = "home",
  query = "",
  category = "",
  group = "",
  station = "",
  max = 99,
  sort = "name",
  page = 1,
  saved;
saved = loadFavorites();
const titles = {
  get home() {
    return t("Das Selphia Archiv", "The Selphia Archive");
  },
  get item() {
    return t("Items & Materialien", "Items & Materials");
  },
  get recipe() {
    return t("Rezepte & Herstellung", "Recipes & Crafting");
  },
  get monster() {
    return t("Das Bestiarium", "The Bestiary");
  },
  get saved() {
    return t("Deine Merkliste", "Your Favorites");
  },
};
const labels = navigationLabels;
if (!$("#home") || getLanguage() !== "de")
  $("#app").innerHTML = createLayout(labels);
updateDocumentLanguage();
const cat = (n) => localizeText(n);
const itemByName = (name) => catalog.getItem(name);
const thumbnail = (r) => {
  const rec = r.station ? itemByName(r.name) : r;
  return rec?.image
    ? `<img src="${escapeHtml(publicUrl(rec.image))}" alt="${escapeHtml(displayName(r))} (RF4)" loading="lazy" decoding="async">`
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
  $(".category-browser").hidden = tab === "monster";
  const list = recordList();
  $("#category").innerHTML =
    `<option value="">${t("Alle Kategorien", "All categories")}</option>` +
    categoriesFor(list, group)
      .map(
        (c) =>
          `<option value="${escapeHtml(c.value)}">${escapeHtml(c.label)} (${c.count})</option>`,
      )
      .join("");
  $("#station").innerHTML =
    `<option value="">${t("Alle Werkbänke", "All workstations")}</option>` +
    [...new Set(data.recipes.map((r) => r.station))]
      .sort((a, b) => localizeText(a).localeCompare(localizeText(b), locale()))
      .map(
        (s) =>
          `<option value="${escapeHtml(s)}">${escapeHtml(localizeText(s))}</option>`,
      )
      .join("");
  $("#station-wrap").hidden = tab !== "recipe";
  $("#level-wrap").hidden = tab !== "recipe";
  $("#category").value = category;
}
function renderCategories() {
  const list = recordList();
  const chip = (label, value, count, active, kind) =>
    `<button type="button" class="category-chip" data-filter-${kind}="${escapeHtml(value)}" aria-pressed="${active}">${escapeHtml(label)}<span>${count.toLocaleString(locale())}</span></button>`;
  $("#category-groups").innerHTML =
    chip(t("Alle", "All"), "", list.length, !group, "group") +
    categoryGroups(list)
      .map((entry) =>
        chip(entry.label, entry.id, entry.count, group === entry.id, "group"),
      )
      .join("");
  $("#category-types").hidden = !group;
  $("#category-types").innerHTML = group
    ? chip(
        t("Alle Typen", "All types"),
        "",
        list.filter((record) => categoryGroup(record.category) === group)
          .length,
        !category,
        "category",
      ) +
      categoriesFor(list, group)
        .map((entry) =>
          chip(
            entry.label,
            entry.value,
            entry.count,
            category === entry.value,
            "category",
          ),
        )
        .join("")
    : "";
}
function updateHomeCategories(value = "") {
  const scope = $("#home-scope").value;
  $(".home-category-field").hidden = scope === "monster";
  $("#home-category").innerHTML = categoryOptions(
    scope === "recipe"
      ? data.recipes
      : data.records.filter((record) => record.type === scope),
  );
  if ([...$("#home-category").options].some((option) => option.value === value))
    $("#home-category").value = value;
}
function sync() {
  const p = new URLSearchParams();
  p.set("lang", getLanguage());
  if (tab !== "home") p.set("tab", tab);
  if (query) p.set("q", query);
  if (category) p.set("category", category);
  if (group) p.set("group", group);
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
  $("#count-saved").textContent = saved.size.toLocaleString(locale());
  if (tab === "home") {
    sync();
    return;
  }
  const list = catalog.select(
    {
      tab,
      query,
      category,
      group,
      station,
      maxRecipeLevel: max,
      sort,
      attributeContext,
      attribute,
    },
    saved,
  );
  renderCategories();
  const pages = Math.max(1, Math.ceil(list.length / 30));
  page = Math.min(page, pages);
  $("#section-title").textContent = titles[tab];
  $("#breadcrumb").textContent = labels[tab];
  $("#total").textContent =
    recordList().length.toLocaleString(locale()) + t(" Einträge", " entries");
  $("#result-count").textContent =
    list.length.toLocaleString(locale()) +
    t(" Treffer", " results") +
    (query ? t(" für „", " for “") + query + t("“", "”") : "");
  $("#results").innerHTML = list.length
    ? `<div class="table-head"><span>${t("Name", "Name")}</span><span>${t("Kategorie / Werkbank", "Category / Workstation")}</span><span>${tab === "monster" ? t("Fundort", "Location") : tab === "recipe" ? t("Materialien", "Materials") : t("Daten / Verwendung", "Stats / Uses")}</span><span></span></div>` +
      list
        .slice((page - 1) * 30, page * 30)
        .map((r) => {
          const used = data.recipes.filter((x) => recipeUsesItem(x, r.name));
          const info =
            r.type === "monster"
              ? localizeText(r.location)
              : r.station
                ? r.ingredients.map((n) => localizeText(n)).join(" · ")
                : localizeText(r.effects) ||
                  localizeText(r.location) ||
                  (used.length
                    ? t(
                        `In ${used.length} Rezepten verwendet`,
                        `Used in ${used.length} recipes`,
                      )
                    : t(
                        "Details und Verknüpfungen",
                        "Details and related entries",
                      ));
          const name = displayName(r);
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
                ><strong>${escapeHtml(name)}</strong
                >${getLanguage() === "de" && name !== r.name ? `<small>${escapeHtml(r.name)} <span class="unverified" title="Fanübersetzung · nicht offiziell verifiziert">DE*</span></small>` : ""}</span
              >
            </button>
            <div class="category-cell">
              <span class="tag ${r.type === "monster" ? "rose" : ""}"
                >${escapeHtml(cat(r.category))}</span
              >${r.station ? `<small>${escapeHtml(localizeText(r.station))} <b>${t("St.", "Lv.")} ${r.level}</b></small>` : ""}
            </div>
            <button class="info-cell" data-open="${r.id}">
              ${sort.startsWith("bonus") ? `<span class="bonus-value">${escapeHtml(formatBonus(score, attribute))}</span><small>${escapeHtml(attributeLabel(attribute))} · ${escapeHtml(contextLabels[attributeContext])}</small>` : escapeHtml(info)}${recipeLocations.length ? `<span class="recipe-location">${t("Rezept", "Recipe")}: ${escapeHtml(recipeLocations.map((n) => localizeText(n)).join(" · "))}</span>` : ""}</button
            ><button
              class="favorite ${saved.has(r.id) ? "is-saved" : ""}"
              data-save="${r.id}"
              aria-label="${saved.has(r.id) ? t("Aus Merkliste entfernen", "Remove from favorites") : t("Merken", "Add to favorites")}: ${escapeHtml(name)}"
              aria-pressed="${saved.has(r.id)}"
            >
              ${saved.has(r.id) ? "★" : "☆"}
            </button>
          </div>`;
        })
        .join("")
    : `<div class="empty"><span>⌕</span><h3>${tab === "saved" && !saved.size ? t("Dein Abenteuer beginnt hier.", "Your adventure starts here.") : t("Keine passenden Einträge.", "No matching entries.")}</h3><p>${tab === "saved" && !saved.size ? t("Markiere Items, Rezepte oder Gegner mit dem Stern.", "Star items, recipes or monsters to save them here.") : t("Probiere einen deutschen oder englischen Namen oder entferne einige Filter.", "Try a German or English name, or remove some filters.")}</p><button data-reset class="primary">${tab === "saved" && !saved.size ? t("Items entdecken", "Explore items") : t("Filter zurücksetzen", "Reset filters")}</button></div>`;
  $("#pagination").innerHTML = list.length
    ? `<span>${((page - 1) * 30 + 1).toLocaleString(locale())}–${Math.min(page * 30, list.length).toLocaleString(locale())} ${t("von", "of")} ${list.length.toLocaleString(locale())}</span><div><button data-page="${page - 1}" ${page === 1 ? "disabled" : ""} aria-label="${t("Vorherige Seite", "Previous page")}">←</button><span>${t("Seite", "Page")} ${page} / ${pages}</span><button data-page="${page + 1}" ${page === pages ? "disabled" : ""} aria-label="${t("Nächste Seite", "Next page")}">→</button></div>`
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
  group = "";
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
  group = "";
  station = "";
  max = 99;
  sort = "name";
  page = 1;
  $("#search").value = "";
  $("#category").value = "";
  $("#station").value = "";
  $("#max").value = 99;
  $("#sort").value = "name";
  options();
  render();
}
function openDetail(id) {
  detailController?.openDetail(id);
}
function showSources() {
  detailController?.showSources();
}
function switchLanguage(selected) {
  if (selected === getLanguage()) return;
  const modalWasOpen = $("#detail").open;
  const homeQuery = $("#home-query")?.value || "";
  const homeScope = $("#home-scope")?.value || "item";
  const homeCategory = $("#home-category")?.value || "";
  if (!setLanguage(selected)) return;
  if (modalWasOpen) $("#detail").close();
  updateDocumentLanguage();
  $("#app").innerHTML = createLayout(labels);
  if (data) {
    $("#home").innerHTML = createHome(data);
    $("#home-query").value = homeQuery;
    $("#home-scope").value = homeScope;
    updateHomeCategories(homeCategory);
    updateCounts();
    options();
    restoreControls();
    render();
    detailController?.refresh(modalWasOpen);
  } else if (loadFailed) {
    renderLoadError();
  }
  if (data || loadFailed) sync();
  else {
    const pendingUrl = new URL(location.href);
    pendingUrl.searchParams.set("lang", getLanguage());
    history.replaceState(null, "", pendingUrl);
  }
  $("#language-switch").focus({ preventScroll: true });
}

document.addEventListener("change", (event) => {
  const { id, value } = event.target;
  if (id === "language-switch") {
    switchLanguage(value);
    return;
  }
  if (!data) return;
  if (id === "home-scope") {
    updateHomeCategories();
    return;
  }
  if (id === "attribute-context") {
    attributeContext = value;
    updateAttributeOptions();
  } else if (id === "attribute") {
    attribute = value;
  } else if (id === "category") category = value;
  else if (id === "station") station = value;
  else if (id === "max") {
    max = Math.max(1, Math.min(99, +value || 99));
    event.target.value = max;
  } else if (id === "sort") sort = value;
  else return;
  if (["attribute", "attribute-context"].includes(id)) {
    sort = "bonus-desc";
    $("#sort").value = sort;
  }
  page = 1;
  render();
});
document.addEventListener("click", (e) => {
  if (!data) return;
  const target = e.target.closest("button, a[data-tab]");
  if (!target) return;
  if (target.tagName === "A") {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0)
      return;
    e.preventDefault();
  }
  if (target.id === "sort-attribute") {
    sort = "bonus-desc";
    $("#sort").value = sort;
    page = 1;
    render();
  }
  if (target.dataset.tab) {
    switchTab(target.dataset.tab);
    if (
      target.hasAttribute("data-group") ||
      target.hasAttribute("data-category")
    ) {
      group = target.dataset.group || "";
      category = target.dataset.category || "";
      options();
      render();
      $("#section-title").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }
  if (
    target.hasAttribute("data-filter-group") ||
    target.hasAttribute("data-filter-category")
  ) {
    const isGroup = target.hasAttribute("data-filter-group");
    if (isGroup) {
      group = target.dataset.filterGroup;
      category = "";
    } else category = target.dataset.filterCategory;
    page = 1;
    options();
    render();
    const selector = isGroup ? "[data-filter-group]" : "[data-filter-category]";
    [...document.querySelectorAll(selector)]
      .find((button) => button.getAttribute("aria-pressed") === "true")
      ?.focus({ preventScroll: true });
  }
  if (target.dataset.open) openDetail(target.dataset.open);
  if (target.hasAttribute("data-sources")) showSources();
  if (target.hasAttribute("data-reset")) reset();
  if (target.classList.contains("close")) $("#detail").close();
  if (target.dataset.save) {
    const id = target.dataset.save;
    saved.has(id) ? saved.delete(id) : saved.add(id);
    saveFavorites(saved);
    render();
    if (target.classList.contains("save-detail"))
      target.textContent = saved.has(id)
        ? t("★ Gemerkt", "★ Saved")
        : t("☆ Zur Merkliste hinzufügen", "☆ Add to favorites");
    $("#toast").textContent = saved.has(id)
      ? t("In deiner Merkliste gespeichert", "Added to your favorites")
      : t("Aus deiner Merkliste entfernt", "Removed from your favorites");
    $("#toast").classList.add("visible");
    setTimeout(() => $("#toast").classList.remove("visible"), 1800);
  }
  if (target.dataset.page) {
    page = +target.dataset.page;
    render();
    $(".directory").scrollIntoView({ behavior: "smooth" });
  }
  if (target.dataset.search) {
    if ($("#detail").open) $("#detail").close();
    if (tab === "saved" || tab === "home") switchTab("item");
    query = target.dataset.search;
    category = "";
    group = "";
    station = "";
    page = 1;
    $("#search").value = query;
    $("#category").value = "";
    $("#station").value = "";
    options();
    render();
    $(".directory").scrollIntoView({ behavior: "smooth" });
  }
});
document.addEventListener("submit", (event) => {
  if (event.target.id !== "home-search-form") return;
  event.preventDefault();
  const search = $("#home-query").value.trim();
  const selection = $("#home-category").value;
  switchTab($("#home-scope").value);
  if (selection.startsWith("group:")) group = selection.slice(6);
  if (selection.startsWith("category:")) {
    category = selection.slice(9);
    group = categoryGroup(category);
  }
  options();
  query = search;
  $("#search").value = query;
  render();
  $("#search").focus();
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
document.addEventListener("input", (e) => {
  if (e.target.id !== "search") return;
  query = e.target.value;
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
document.addEventListener("click", (e) => {
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
function updateCounts() {
  for (const type of ["item", "monster"])
    $("#count-" + type).textContent = data.records
      .filter((record) => record.type === type)
      .length.toLocaleString(locale());
  $("#count-recipe").textContent = data.recipes.length.toLocaleString(locale());
}
function restoreControls() {
  $("#search").value = query;
  $("#category").value = category;
  $("#station").value = station;
  $("#max").value = max;
  $("#sort").value = sort;
}
function renderLoadError() {
  $("#home").hidden = true;
  $("#directory").hidden = false;
  $("#total").textContent = t("Daten nicht verfügbar", "Data unavailable");
  $("#result-count").textContent = t(
    "Die Wiki-Daten konnten nicht geladen werden.",
    "The wiki data could not be loaded.",
  );
  $("#results").innerHTML =
    `<div class="empty"><h3>${t("Das Archiv ist gerade nicht erreichbar.", "The archive is currently unavailable.")}</h3><p>${t("Bitte lade die Seite erneut.", "Please reload the page.")}</p><button onclick="location.reload()" class="primary">${t("Erneut laden", "Reload")}</button></div>`;
}
async function init() {
  try {
    const response = await fetch(publicUrl("data.json"));
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
    updateCounts();
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
    group = categoryGroups(recordList()).some(
      (entry) => entry.id === p.get("group"),
    )
      ? p.get("group")
      : "";
    options();
    category = [...$("#category").options].some(
      (o) => o.value === canonicalCategory(p.get("category")),
    )
      ? canonicalCategory(p.get("category"))
      : "";
    station =
      tab === "recipe" &&
      [...$("#station").options].some((o) => o.value === p.get("station"))
        ? p.get("station")
        : "";
    restoreControls();
    render();
  } catch {
    data = undefined;
    catalog = undefined;
    loadFailed = true;
    renderLoadError();
  }
}
init();
