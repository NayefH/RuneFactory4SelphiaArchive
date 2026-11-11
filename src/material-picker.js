import { t, locale } from "./i18n.js";
import { displayName, localizeText } from "./data-localization.js";
import { normalizeSearch } from "./catalog.js";
import { canonicalCategory } from "./categories.js";
import { attributeLabel, formatBonus } from "./attributes.js";
import {
  craftStats,
  materialRarity,
  sanitizeCraftingPlan,
} from "./crafting-engine.js";
import { escapeHtml as esc } from "./html.js";
import { publicUrl } from "./public-url.js";

const commonNames = [
  "Iron",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Orichalcum",
  "Dragonic Stone",
  "Double Steel",
  "10-Fold Steel",
  "Object X",
  "Mealy Apple",
];
const specialNames = new Set([
  "Double Steel",
  "10-Fold Steel",
  "Object X",
  "Light Ore",
  "Rare Can",
  "Glitta Augite",
  "Raccoon Leaf",
  "Shade Stone",
  "Invisible Stone",
  "Scrap Metal+",
]);
const pageSize = 36;
export const materialArtwork = (item) =>
  item?.image
    ? `<img src="${esc(publicUrl(item.image))}" alt="" loading="lazy" decoding="async">`
    : `<span aria-hidden="true">${item ? "◇" : "+"}</span>`;

export function materialEffectContext(context, plan) {
  const recipe = context.recipesById.get(plan.recipeId);
  return context.isEquipment(recipe)
    ? "upgrade"
    : recipe.category === "Kochen"
      ? "cook"
      : undefined;
}

export function materialBonusChips(item, effectContext = "upgrade", limit = 3) {
  const special = {
    "Double Steel": t("Vorheriger Bonus ×2", "Previous bonus ×2"),
    "10-Fold Steel": t("Vorheriger Bonus ×8", "Previous bonus ×8"),
    "Object X": t("Folgende Boni umkehren", "Reverse following bonuses"),
  };
  if (effectContext === "upgrade" && special[item.name])
    return `<span class="material-bonus material-bonus-special">${special[item.name]}</span>`;
  const values = Object.entries(item.attributes?.[effectContext] || {})
    .filter(([, value]) => Number.isFinite(value) && value !== 0)
    .sort(
      ([a], [b]) =>
        (craftStats.includes(a) ? craftStats.indexOf(a) : 100) -
        (craftStats.includes(b) ? craftStats.indexOf(b) : 100),
    );
  if (!values.length) return "";
  return (
    values
      .slice(0, limit)
      .map(
        ([key, value]) =>
          `<span class="material-bonus${value < 0 ? " material-bonus-negative" : ""}" title="${esc(attributeLabel(key))}">${esc(key)} ${esc(formatBonus(value, key))}</span>`,
      )
      .join("") +
    (values.length > limit
      ? `<span class="material-bonus material-bonus-more">+${values.length - limit}</span>`
      : "")
  );
}

export function materialCandidates(context, plan, target) {
  if (
    !["material", "upgrade"].includes(target?.kind) ||
    !Number.isInteger(target.index)
  )
    return [];
  const slots = target.kind === "material" ? plan.materials : plan.upgrades;
  if (target.index < 0 || target.index >= slots.length) return [];
  const recipe = context.recipesById.get(plan.recipeId);
  if (!recipe) return [];
  const required = context.slotsFor(recipe);
  if (target.kind === "material" && target.index < required.length)
    return context.candidates(required[target.index]);
  return context.isEquipment(recipe) ? context.items : [];
}

export function chooseCraftMaterial(context, plan, target, itemId) {
  if (!target) return undefined;
  const recipe = context.recipesById.get(plan.recipeId);
  if (!recipe) return undefined;
  const required = context.slotsFor(recipe).length;
  const mandatory = target.kind === "material" && target.index < required;
  const candidates = materialCandidates(context, plan, target);
  if (
    !candidates.length ||
    (!itemId && mandatory) ||
    (itemId && !candidates.some((item) => item.id === itemId))
  )
    return undefined;
  const next = {
    ...plan,
    materials: plan.materials.map((slot) => ({ ...slot })),
    upgrades: plan.upgrades.map((slot) => ({ ...slot })),
  };
  const slot = (target.kind === "material" ? next.materials : next.upgrades)[
    target.index
  ];
  slot.itemId = itemId;
  if (!itemId) slot.inherit = false;
  else if (
    target.kind === "material" &&
    !mandatory &&
    next.materials.filter((entry) => entry.inherit).length < 3
  )
    slot.inherit = true;
  return sanitizeCraftingPlan(context, next);
}

export function selectMaterials(context, plan, target, filters = {}) {
  const effectContext = materialEffectContext(context, plan);
  const candidates = materialCandidates(context, plan, target);
  if (!candidates.length) return [];
  const inPlan = new Set(
    [...plan.materials, ...plan.upgrades]
      .map((slot) => slot.itemId)
      .filter(Boolean),
  );
  const terms = normalizeSearch(filters.query || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const category = filters.category || "";
  const mode = filters.mode || "all";
  const sort = filters.sort || "common";
  const selectedId = (
    target.kind === "material" ? plan.materials : plan.upgrades
  )[target.index]?.itemId;
  const collator = new Intl.Collator(locale(), {
    numeric: true,
    sensitivity: "base",
  });
  const valueFor = (item) =>
    sort === "rarity"
      ? materialRarity(item)
      : item.attributes?.[effectContext]?.[sort];
  const sorted = candidates
    .filter((item) => {
      if (category && canonicalCategory(item.category) !== category)
        return false;
      if (mode === "special" && !specialNames.has(item.name)) return false;
      if (mode === "plan" && !inPlan.has(item.id)) return false;
      if (
        mode === "bonus" &&
        !Object.values(item.attributes?.[effectContext] || {}).some(
          (value) => Number.isFinite(value) && value !== 0,
        )
      )
        return false;
      const search = normalizeSearch(
        [
          item.name,
          displayName(item, "de"),
          displayName(item, "en"),
          ...(item.aliases || []),
          item.category,
          localizeText(item.category, "de"),
          localizeText(item.category, "en"),
          item.attributeText?.[effectContext],
        ]
          .filter(Boolean)
          .join(" "),
      );
      return terms.every((term) => search.includes(term));
    })
    .sort((a, b) => {
      const byName = () =>
        collator.compare(displayName(a), displayName(b)) ||
        collator.compare(a.name, b.name);
      if (sort === "name") return byName();
      if (sort === "common") {
        const rank = (item) =>
          item.id === selectedId
            ? -1
            : commonNames.includes(item.name)
              ? commonNames.indexOf(item.name)
              : 100;
        return rank(a) - rank(b) || byName();
      }
      const av = valueFor(a),
        bv = valueFor(b);
      if (!Number.isFinite(av) || !Number.isFinite(bv))
        return (
          Number(!Number.isFinite(av)) - Number(!Number.isFinite(bv)) ||
          byName()
        );
      return bv - av || byName();
    });
  return sorted;
}

export function materialPickerCards(
  context,
  plan,
  target,
  filters,
  limit = pageSize,
) {
  const effectContext = materialEffectContext(context, plan);
  const matches = selectMaterials(context, plan, target, filters);
  const selectedId = (
    target.kind === "material" ? plan.materials : plan.upgrades
  )[target.index]?.itemId;
  const used = new Map();
  for (const slot of [...plan.materials, ...plan.upgrades])
    if (slot.itemId) used.set(slot.itemId, (used.get(slot.itemId) || 0) + 1);
  const shown = matches.slice(0, limit);
  const html = shown.length
    ? shown
        .map((item) => {
          const selected = item.id === selectedId;
          const name = displayName(item);
          const rarity = materialRarity(item);
          const difficulty =
            typeof item.difficulty === "number"
              ? item.difficulty
              : /^\d+(?:\.\d+)?$/.test(item.difficulty)
                ? Number(item.difficulty)
                : undefined;
          const bonuses = effectContext
            ? materialBonusChips(item, effectContext)
            : "";
          return `<button type="button" class="material-card${selected ? " is-selected" : ""}" data-material-choice="${item.id}" aria-pressed="${selected}"><span class="material-card-top"><span class="material-card-image">${materialArtwork(item)}</span><span class="material-card-name"><strong>${esc(name)}</strong>${name !== item.name ? `<small>${esc(item.name)}</small>` : ""}<small>${esc(localizeText(canonicalCategory(item.category)))}</small></span><span class="material-card-check" aria-hidden="true">${selected ? "✓" : "+"}</span></span><span class="material-card-effect-label">${effectContext === "upgrade" ? t("Upgrade-Bonus", "Upgrade bonus") : effectContext === "cook" ? t("Als Kochzutat", "As a cooking ingredient") : t("Zutat", "Ingredient")}</span><span class="material-card-bonuses">${bonuses || `<span class="material-no-bonus">${effectContext ? t("Kein Zahlenbonus erfasst", "No numeric bonus recorded") : t("Für dieses Rezept geeignet", "Suitable for this recipe")}</span>`}</span><span class="material-card-facts"><span>◇ ${t("Seltenheit", "Rarity")} <b>${rarity ?? "—"}</b></span>${effectContext === "upgrade" ? `<span>${t("Schwierigkeit", "Difficulty")} <b>${difficulty ?? "—"}</b></span>` : Number.isFinite(item.buy) ? `<span>${item.buy.toLocaleString(locale())} G</span>` : ""}</span><span class="material-card-action">${selected ? t("Aktuell ausgewählt", "Currently selected") : t("Auswählen", "Select")} <span>${used.has(item.id) ? `${t("Im Plan", "In plan")} ×${used.get(item.id)}` : "↗"}</span></span></button>`;
        })
        .join("")
    : `<div class="material-picker-empty"><span aria-hidden="true">⌕</span><strong>${t("Keine passenden Materialien", "No matching materials")}</strong><p>${t("Passe die Suche an oder setze die Filter zurück.", "Change the search or reset the filters.")}</p><button type="button" data-material-reset>${t("Filter zurücksetzen", "Reset filters")}</button></div>`;
  return { html, total: matches.length, shown: shown.length };
}

export function materialPickerShell(context, plan, target) {
  const recipe = context.recipesById.get(plan.recipeId);
  const required = context.slotsFor(recipe);
  const mandatory =
    target.kind === "material" && target.index < required.length;
  const item = context.byId.get(
    (target.kind === "material" ? plan.materials : plan.upgrades)[target.index]
      .itemId,
  );
  const categories = new Map();
  for (const candidate of materialCandidates(context, plan, target)) {
    const category = canonicalCategory(candidate.category);
    categories.set(category, (categories.get(category) || 0) + 1);
  }
  const effectContext = materialEffectContext(context, plan);
  const slotLabel =
    target.kind === "upgrade"
      ? `${t("Aufwertung", "Upgrade")} ${target.index + 1}`
      : mandatory
        ? localizeText(required[target.index].label)
        : `${t("Freier Zusatz", "Optional extra")} ${target.index + 1 - required.length}`;
  return `<header class="material-picker-header"><div><span class="craft-kicker">${esc(displayName(recipe))} · ${esc(slotLabel)}</span><h2 id="material-picker-title">${t("Material auswählen", "Choose a material")}</h2><p id="material-picker-description">${mandatory ? t("Nur Zutaten, die in diesen Rezeptplatz passen.", "Only ingredients that fit this recipe slot.") : t("Vergleiche Bilder und Boni. Ein Klick übernimmt das Material in deinen Plan.", "Compare images and bonuses. Select a card to add its material to your plan.")}</p></div><button type="button" class="material-picker-close" data-material-close aria-label="${t("Materialauswahl schließen", "Close material picker")}">✕</button></header><div class="material-picker-controls"><label class="material-search" for="material-picker-search"><span aria-hidden="true">⌕</span><input type="search" id="material-picker-search" placeholder="${t("Name, Kategorie oder Bonus suchen …", "Search name, category or bonus …")}" aria-label="${t("Materialien durchsuchen", "Search materials")}" autocomplete="off"></label><div class="material-picker-filters"><label>${t("Kategorie", "Category")}<select id="material-picker-category"><option value="">${t("Alle Kategorien", "All categories")}</option>${[
    ...categories,
  ]
    .sort(([a], [b]) =>
      localizeText(a).localeCompare(localizeText(b), locale()),
    )
    .map(
      ([category, count]) =>
        `<option value="${esc(category)}">${esc(localizeText(category))} (${count})</option>`,
    )
    .join(
      "",
    )}</select></label><label>${t("Sortieren", "Sort by")}<select id="material-picker-sort"><option value="common">${t("Gängige Materialien", "Common materials")}</option><option value="name">Name A–Z</option>${effectContext ? craftStats.map((key) => `<option value="${key}">${esc(attributeLabel(key))} ↓</option>`).join("") : ""}<option value="rarity">${t("Seltenheit", "Rarity")} ↓</option></select></label></div><div class="material-picker-tabs" role="group" aria-label="${t("Materialien filtern", "Filter materials")}">${[["all", t("Alle", "All")], ...(effectContext ? [["bonus", t("Mit Boni", "With bonuses")]] : []), ...(effectContext === "upgrade" ? [["special", t("Spezialmaterialien", "Special materials")]] : []), ["plan", t("Im Plan", "In plan")]].map(([value, label]) => `<button type="button" data-material-mode="${value}" aria-pressed="${value === "all"}">${label}</button>`).join("")}<button type="button" class="material-filter-reset" data-material-reset>${t("Zurücksetzen", "Reset")}</button></div></div><div class="material-picker-results"><p class="material-picker-count" id="material-picker-count" role="status" aria-live="polite"></p><div class="material-picker-grid" id="material-picker-grid"></div><button type="button" class="material-picker-more" id="material-picker-more" data-material-more>${t("Weitere Materialien anzeigen", "Show more materials")} ↓</button></div><footer class="material-picker-footer"><span>${item ? `${t("Aktuell", "Current")}: <b>${esc(displayName(item))}</b>` : t("Noch kein Material ausgewählt", "No material selected yet")}</span><div>${!mandatory && item ? `<button type="button" data-material-clear>${t("Platz leeren", "Clear slot")}</button>` : ""}<button type="button" data-material-close>${t("Abbrechen", "Cancel")}</button></div></footer>`;
}

export function createMaterialPicker({ context, getPlan, onSelect }) {
  let state;
  const dialog = () => document.getElementById("craft-material-picker");
  function update() {
    const el = dialog();
    const result = materialPickerCards(
      context,
      getPlan(),
      state.target,
      state.filters,
      state.limit,
    );
    el.querySelector("#material-picker-grid").innerHTML = result.html;
    el.querySelector("#material-picker-count").textContent = t(
      `${result.shown} von ${result.total} Materialien`,
      `${result.shown} of ${result.total} materials`,
    );
    el.querySelector("#material-picker-more").hidden =
      result.shown >= result.total;
    el.querySelectorAll("[data-material-mode]").forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.materialMode === state.filters.mode),
      ),
    );
  }
  const close = () => dialog()?.close();
  function open(target) {
    if (!materialCandidates(context, getPlan(), target).length) return;
    const el = dialog();
    if (!el) return;
    state = {
      target,
      filters: { query: "", category: "", sort: "common", mode: "all" },
      limit: pageSize,
    };
    el.innerHTML = materialPickerShell(context, getPlan(), target);
    el.onclick = (event) => {
      event.stopPropagation();
      if (event.target === el) {
        const rect = el.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          close();
        return;
      }
      const button = event.target.closest("button");
      if (!button) return;
      if (button.hasAttribute("data-material-close")) close();
      else if (
        button.hasAttribute("data-material-choice") ||
        button.hasAttribute("data-material-clear")
      ) {
        const itemId = button.dataset.materialChoice || "";
        const chosenTarget = state.target;
        close();
        onSelect(chosenTarget, itemId);
      } else if (button.dataset.materialMode) {
        state.filters.mode = button.dataset.materialMode;
        state.limit = pageSize;
        update();
      } else if (button.hasAttribute("data-material-reset")) {
        state.filters = {
          query: "",
          category: "",
          sort: "common",
          mode: "all",
        };
        state.limit = pageSize;
        el.querySelector("#material-picker-search").value = "";
        el.querySelector("#material-picker-category").value = "";
        el.querySelector("#material-picker-sort").value = "common";
        update();
        el.querySelector("#material-picker-search").focus();
      } else if (button.hasAttribute("data-material-more")) {
        state.limit += pageSize;
        update();
      }
    };
    el.oninput = (event) => {
      event.stopPropagation();
      if (event.target.id === "material-picker-search") {
        state.filters.query = event.target.value;
        state.limit = pageSize;
        update();
      }
    };
    el.onchange = (event) => {
      event.stopPropagation();
      if (event.target.id === "material-picker-category")
        state.filters.category = event.target.value;
      else if (event.target.id === "material-picker-sort")
        state.filters.sort = event.target.value;
      else return;
      state.limit = pageSize;
      update();
    };
    el.onclose = () => {
      if (el.open) return;
      document.documentElement.classList.remove("material-picker-open");
      document
        .getElementById(`craft-${target.kind}-${target.index}`)
        ?.focus({ preventScroll: true });
    };
    el.onkeydown = (event) => {
      const cards = [...el.querySelectorAll("[data-material-choice]")];
      if (
        event.target.id === "material-picker-search" &&
        event.key === "ArrowDown" &&
        cards.length
      ) {
        event.preventDefault();
        cards[0].focus();
        return;
      }
      const current = cards.indexOf(
        event.target.closest("[data-material-choice]"),
      );
      if (current < 0) return;
      const columns = getComputedStyle(
        el.querySelector("#material-picker-grid"),
      ).gridTemplateColumns.split(" ").length;
      const offset = {
        ArrowRight: 1,
        ArrowLeft: -1,
        ArrowDown: columns,
        ArrowUp: -columns,
      }[event.key];
      if (offset) {
        event.preventDefault();
        cards[
          Math.max(0, Math.min(cards.length - 1, current + offset))
        ].focus();
      }
    };
    update();
    document.documentElement.classList.add("material-picker-open");
    el.showModal();
    el.querySelector("#material-picker-search").focus({ preventScroll: true });
  }
  return { open, close };
}
