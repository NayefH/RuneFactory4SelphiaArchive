import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  bossGroups,
  bossPanel,
  createBossGuide,
  giantCrops,
  itemAcquisition,
  tamingSource,
  untameableBosses,
} from "../src/boss-recruitment.js";
import { characters } from "../src/character-data.js";
import { selectCharacters, createCharacterGuide } from "../src/characters.js";
import { createMapGuide, mapRegions, places } from "../src/world-map.js";
import { setLanguage } from "../src/i18n.js";

const data = JSON.parse(
  readFileSync(new URL("../public/data.json", import.meta.url), "utf8"),
);
afterEach(() => setLanguage("de", null));

test("boss guide resolves every taming gift and links to RF4 wiki sources", () => {
  assert.match(tamingSource, /therunefactory\.fandom\.com/);
  const names = bossGroups.flatMap((g) => g.names);
  assert.equal(new Set(names).size, 26);
  for (const group of bossGroups) {
    for (const name of group.names) {
      const monster = data.records.find(
        (r) => r.type === "monster" && r.name === name,
      );
      assert.ok(monster, name);
      assert.match(monster.source, /#Rune_Factory_4$/);
      assert.ok(!untameableBosses.includes(name));
      for (const gift of group.items)
        assert.ok(monster.favorite.includes(gift), `${name}: ${gift}`);
    }
    for (const gift of group.items) {
      assert.ok(
        data.records.some((r) => r.type === "item" && r.name === gift),
        gift,
      );
      assert.ok(
        giantCrops[gift] ||
          data.recipes.some((r) => r.name === gift) ||
          gift === "Orichalcum",
        gift,
      );
    }
  }
  assert.doesNotMatch(createBossGuide(data), /GameFAQs|gamespot/);
});

test("boss gifts lead to crop instructions or the correct crafting record", () => {
  const carrot = itemAcquisition("Royal Carrot", data);
  assert.match(carrot, /data-tab="bosses" data-anchor="giant-crops"/);
  const cake = itemAcquisition("Cake", data);
  assert.match(cake, /Ofen/);
  assert.doesNotMatch(cake, /Mixer/);
  const thunderbolt = data.records.find((r) => r.name === "Thunderbolt");
  assert.match(bossPanel(thunderbolt, data), /data-open="ia917a101ccfb53"/);
  assert.match(
    bossPanel(
      data.records.find((r) => r.name === "Ragnarok"),
      data,
    ),
    /nicht gezähmt/,
  );
});

test("all map assets exist and every marker is bounded and uniquely identified", () => {
  assert.equal(mapRegions.length, 8);
  assert.equal(new Set(places.map((p) => p.id)).size, places.length);
  for (const region of mapRegions) {
    assert.ok(
      existsSync(new URL(`../public/${region.image}`, import.meta.url)),
      region.image,
    );
    const page = createMapGuide(data, region.id);
    assert.ok(page.includes(region.image));
    assert.doesNotMatch(page, /undefined|NaN/);
  }
  for (const p of places.filter((p) => p.region)) {
    assert.ok(mapRegions.some((r) => r.id === p.region));
    assert.ok(p.xy.every((n) => n >= 0 && n <= 100));
  }
});

test("character groups contain all twelve marriage candidates and preserve gift exceptions", () => {
  assert.equal(selectCharacters("bachelor").length, 6);
  assert.equal(selectCharacters("bachelorette").length, 6);
  assert.equal(characters.filter((c) => c.giftable).length, 25);
  for (const c of characters) {
    assert.ok(c.source.startsWith("https://"));
    const seen = new Set();
    for (const key of ["loved", "liked", "disliked", "hated"]) {
      assert.ok(Array.isArray(c[key]));
      for (const name of c[key]) {
        assert.ok(!seen.has(name), `${c.name}: conflicting ${name}`);
        seen.add(name);
      }
    }
    if (c.giftable) {
      assert.ok(c.loved.length);
      assert.ok(c.disliked.length || c.hated.length);
    }
  }
  const bado = characters.find((c) => c.name === "Bado");
  assert.ok(bado.liked.includes("Scrap Metal"));
  assert.ok(!bado.disliked.includes("Scrap Metal"));
});

test("character search understands German gifts and English originals", () => {
  assert.ok(selectCharacters("all", "Apfel").some((c) => c.name === "Clorica"));
  assert.ok(selectCharacters("all", "Apple").some((c) => c.name === "Clorica"));
  assert.equal(selectCharacters("bachelorette", "Dylas").length, 0);
  assert.equal(selectCharacters("all", "not-an-existing-character").length, 0);
});

test("all three guides translate and character sample coverage is explicit", () => {
  const german = createCharacterGuide(data);
  assert.match(german, /Geschenkbeispiele/);
  assert.match(german, /Nicht aufgeführte Items/);
  setLanguage("en", null);
  assert.match(createBossGuide(data), /Recruit bosses/);
  assert.match(createMapGuide(data), /Map & important places/);
  assert.match(createCharacterGuide(data), /Characters & gifts/);
});
