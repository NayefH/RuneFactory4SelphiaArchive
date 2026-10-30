export const supportedLanguages = ["de", "en"];
export const languageStorageKey = "rf4-language";

export function resolveLanguage(search = "", storage) {
  const requested = new URLSearchParams(search).get("lang");
  if (supportedLanguages.includes(requested)) return requested;
  try {
    const saved = storage?.getItem(languageStorageKey);
    if (supportedLanguages.includes(saved)) return saved;
  } catch {
    // Private browsing may disable storage; language switching still works.
  }
  return "de";
}

let language = "de";
if (typeof window !== "undefined") {
  let storage;
  try {
    storage = window.localStorage;
  } catch {
    /* Optional persistence. */
  }
  language = resolveLanguage(window.location.search, storage);
}

export const getLanguage = () => language;
export const t = (de, en) => (language === "en" ? en : de);
export const locale = (selected = language) =>
  selected === "en" ? "en-US" : "de-DE";

export function setLanguage(selected, storage) {
  if (!supportedLanguages.includes(selected)) return false;
  language = selected;
  try {
    if (storage === undefined && typeof window !== "undefined")
      storage = window.localStorage;
    storage?.setItem(languageStorageKey, selected);
  } catch {
    /* The in-memory preference remains usable. */
  }
  return true;
}

export function updateDocumentLanguage() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language;
  const title = t(
    "Rune Factory 4 Datenbank – Selphia Archiv | Nayef Hajjaj",
    "Rune Factory 4 Database – Selphia Archive | Nayef Hajjaj",
  );
  const description = t(
    "Selphia Archiv von Nayef Hajjaj: Rune Factory 4 Items, Rezepte und Gegner durchsuchen, Attribute vergleichen und Rezeptfundorte nachschlagen.",
    "Selphia Archive by Nayef Hajjaj: search Rune Factory 4 items, recipes and monsters, compare attributes and find recipe locations.",
  );
  document.title = title;
  for (const [selector, content] of [
    ['meta[name="description"]', description],
    ['meta[property="og:title"]', title],
    ['meta[property="og:description"]', description],
    ['meta[property="og:locale"]', t("de_DE", "en_US")],
    ['meta[property="og:site_name"]', t("Selphia Archiv", "Selphia Archive")],
    [
      'meta[property="og:image:alt"]',
      t(
        "Lest, Frey und die Bewohner von Selphia aus Rune Factory 4 Special",
        "Lest, Frey and the residents of Selphia from Rune Factory 4 Special",
      ),
    ],
  ])
    document.querySelector(selector)?.setAttribute("content", content);
}
