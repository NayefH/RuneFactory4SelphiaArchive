import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getLanguage,
  languageStorageKey,
  locale,
  resolveLanguage,
  setLanguage,
  t,
  updateDocumentLanguage,
} from "../src/i18n.js";
import { createLayout, navigationLabels } from "../src/layout.js";
import { createHome } from "../src/home.js";
import {
  attributeLabel,
  contextLabels,
  formatBonus,
} from "../src/attributes.js";
import { displayName, localizeText } from "../src/data-localization.js";

const fixture = {
  records: [
    { id: "turnip", type: "item", name: "Turnip", image: "/images/turnip.png" },
    {
      id: "bread",
      type: "item",
      name: "Cooking Bread",
      image: "/images/bread.png",
    },
    { id: "wooly", type: "monster", name: "Wooly", image: "/images/wooly.png" },
  ],
  recipes: [{ id: "iron-shield", name: "Iron Shield", station: "Schmiede" }],
};

afterEach(() => setLanguage("de", null));

test("localization imports and metadata updates work without browser globals", () => {
  assert.equal(typeof window, "undefined");
  assert.equal(typeof document, "undefined");
  assert.equal(getLanguage(), "de");
  assert.equal(t("Start", "Home"), "Start");
  assert.equal(locale(), "de-DE");
  assert.doesNotThrow(updateDocumentLanguage);
});

test("supported URL language takes priority over the saved preference", () => {
  const storage = {
    getItem(key) {
      assert.equal(key, languageStorageKey);
      return "de";
    },
  };
  assert.equal(resolveLanguage("?tab=item&lang=en", storage), "en");
  assert.equal(resolveLanguage("?lang=de", { getItem: () => "en" }), "de");
  assert.equal(resolveLanguage("?lang=fr", { getItem: () => "en" }), "en");
  assert.equal(resolveLanguage("?tab=recipe", { getItem: () => "en" }), "en");
});

test("missing, invalid and inaccessible saved preferences fall back to German", () => {
  for (const value of [null, undefined, "", "fr", "EN", "true"]) {
    assert.equal(resolveLanguage("", { getItem: () => value }), "de");
  }
  assert.equal(resolveLanguage("?lang=unknown"), "de");
  assert.equal(
    resolveLanguage("", {
      getItem() {
        throw Error("disabled");
      },
    }),
    "de",
  );
  assert.equal(
    resolveLanguage("?lang=en", {
      getItem() {
        throw Error("disabled");
      },
    }),
    "en",
  );
});

test("changing language persists only supported choices and survives blocked storage", () => {
  const writes = [];
  const storage = { setItem: (...entry) => writes.push(entry) };
  assert.equal(setLanguage("en", storage), true);
  assert.equal(getLanguage(), "en");
  assert.deepEqual(writes, [[languageStorageKey, "en"]]);
  assert.equal(setLanguage("fr", storage), false);
  assert.equal(getLanguage(), "en");
  assert.equal(writes.length, 1);
  assert.equal(
    setLanguage("de", {
      setItem() {
        throw Error("disabled");
      },
    }),
    true,
  );
  assert.equal(getLanguage(), "de");
});

test("labels and number formatting follow the current language without reimporting", () => {
  assert.equal(navigationLabels.recipe, "Rezepte");
  assert.equal(contextLabels.consume, "Beim Verzehr");
  assert.equal(attributeLabel("STR"), "Stärke");
  assert.equal(formatBonus(1234, "ATK"), "+1.234");
  setLanguage("en", null);
  assert.equal(t("Suchen", "Search"), "Search");
  assert.equal(locale(), "en-US");
  assert.equal(locale("de"), "de-DE");
  assert.equal(navigationLabels.recipe, "Recipes");
  assert.equal(navigationLabels.saved, "Favorites");
  assert.equal(contextLabels.consume, "When consumed");
  assert.equal(attributeLabel("STR"), "Strength");
  assert.equal(formatBonus(1234, "ATK"), "+1,234");
  assert.equal(formatBonus(undefined, "ATK"), "Not recorded");
});

test("layout and homepage translate all major UI areas and preserve deployment paths", () => {
  for (const base of ["/", "/RuneFactory4SelphiaArchive/"]) {
    const assetUrl = (path = "") => base + path.replace(/^\//, "");
    setLanguage("de", null);
    const german = createLayout(undefined, assetUrl);
    assert.ok(german.includes('id="language-switch"'));
    assert.ok(german.includes('aria-label="Sprache wählen"'));
    assert.ok(german.includes("Quellen &amp;") || german.includes("Quellen &"));
    assert.ok(
      german.includes('<section id="home" hidden aria-label="Startseite">'),
    );
    assert.ok(
      createHome(fixture, assetUrl).includes("Dein Rune Factory 4 Archiv."),
    );
    setLanguage("en", null);
    const english = createLayout(undefined, assetUrl);
    const home = createHome(fixture, assetUrl);
    assert.ok(english.includes('aria-label="Choose language"'));
    assert.match(english, /value="en"\s+lang="en"\s+selected/);
    assert.ok(english.includes("Sources & license"));
    assert.ok(
      english.includes(
        'placeholder="Search names, materials, drops or locations …"',
      ),
    );
    assert.ok(!english.includes("Quellen &"));
    assert.ok(!english.includes("Alle Kategorien"));
    assert.ok(!english.includes("Deutscher Name noch nicht verifiziert"));
    assert.ok(home.includes("Your Rune Factory 4 archive."));
    assert.ok(home.includes('aria-label="Search section"'));
    assert.ok(home.includes(`href="${base}?tab=recipe&lang=en"`));
    assert.ok(home.includes(`src="${base}images/wooly.png"`));
    assert.ok(!home.includes("Rezeptvarianten"));
    assert.ok(!home.includes("Was suchst du"));
  }
});

test("game labels translate for display while canonical record values remain unchanged", () => {
  const record = { name: "Iron Shield", station: "Topf", category: "Minerals" };
  const original = structuredClone(record);
  assert.equal(displayName("Iron", "de"), "Eisen");
  assert.equal(displayName(record, "de"), "Eisenschild");
  assert.equal(displayName(record, "en"), "Iron Shield");
  assert.equal(displayName("Iron", "en"), "Iron");
  assert.notEqual(localizeText("Topf", "en"), "Topf");
  assert.notEqual(localizeText("Minerals", "de"), "Minerals");
  assert.equal(localizeText("Minerals", "en"), "Minerals");
  assert.deepEqual(record, original);
});
