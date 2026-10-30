import { getLanguage } from "./i18n.js";
import { nameTranslations } from "./data-translations.js";
import { locationTranslations } from "./location-translations.js";

const pairs = (text) =>
  text
    .trim()
    .split("\n")
    .map((line) => line.split("|"));
const terms = pairs(`
Collectible|Sammelobjekte
Plant|Pflanzen
Recipe Bread|Rezeptbrot
Dual Blades|Doppelklingen
Short Swords|Kurzschwerter
Staves|Stäbe
Axes|Äxte
Strings|Fäden
Jewels|Edelsteine
Accessories|Accessoires
Shells and Bones|Panzer und Knochen
Cloths and Skins|Stoffe und Häute
Fists|Handschuhe
Pharmacy|Alchemie
Vegetable|Gemüse
Cooking|Kochen
Seed|Saatgut
Shards|Scherben
Headgear|Kopfbedeckungen
Magic|Magie
Rune Ability|Runenfähigkeiten
Long Swords|Langschwerter
Hammers|Hämmer
Fishing|Angeln
Spears|Speere
Crystals|Kristalle
Claws and Fangs|Klauen und Zähne
Feathers|Federn
Scales|Schuppen
Hoes|Hacken
Fish|Fische
Furs|Felle
Shoes|Schuhe
Shields|Schilde
Special|Besonderes
Trash|Abfall
Sticks and Stems|Stöcke und Stängel
Minerals|Erze
Tools|Werkzeuge
Armor|Rüstungen
Axes (tool)|Äxte (Werkzeug)
Hammers (tool)|Hämmer (Werkzeug)
Sickles|Sicheln
Watering Cans|Gießkannen
Ready-made|Fertigprodukte
Material groups|Materialgruppen
Material / Ingredient|Material / Zutat
Ingredients|Zutaten
Liquids|Flüssigkeiten
Failed Dishes|Misslungene Gerichte
Powders and Spores|Pulver und Sporen
Dairy|Milchprodukte
Monsters|Gegner
Seeds|Samen
Stones|Steine
Frying Pan|Bratpfanne
Spear|Speer
Shield|Schild
Mushrooms|Pilze
Medicine|Medizin
Short Sword|Kurzschwert
Crafting Table|Fertigungstisch
Forge|Schmiede
No Tool|Ohne Gerät
Knife|Messer
Pot|Topf
Oven|Ofen
Steamer|Dampfgarer
Mixer|Mixer
Chemistry Set|Chemie-Set
Upgrade Effect|Aufwertungseffekt
Normal|Normal
Fire|Feuer
Water|Wasser
Earth|Erde
Wind|Wind
Light|Licht
Dark|Dunkelheit
Love|Liebe
Poison|Gift
Seal|Versiegelung
Paralysis|Lähmung
Sleep|Schlaf
Fatigue|Erschöpfung
Illness|Krankheit
Faint|K. o.
Level|Stufe
EXP|Erfahrung
HP|LP
RP|RP
ATK|Angriff
DEF|Verteidigung
M. ATK|Magischer Angriff
M. DEF|Magische Verteidigung
M.ATK|Magischer Angriff
M.DEF|Magische Verteidigung
STR|Stärke
VIT|Vitalität
INT|Intelligenz
Bonus|Bonus
HP Drain|LP-Absorption
Diz Attack|Benommenheitsangriff
Diz Resist|Benommenheitsresistenz
Diz Pool|Benommenheitsschwelle
Additional Stun Time|Zusätzliche Betäubungsdauer
Flinch Amount|Taumelstärke
Knock Distance|Rückstoßweite
Knock Resist|Rückstoßresistenz
Crit Attack|Kritische Trefferchance
Crit Resist|Resistenz gegen kritische Treffer
Not recorded|Nicht erfasst
Unknown in the wiki|Im Wiki unbekannt
None|Keine
Search aid · officially unconfirmed|Suchhilfe · offiziell unbestätigt
Gameplay report · officially unconfirmed|Spielbericht · offiziell unbestätigt
`);

const prose = pairs(`
Increases effect of last item used in upgrade by 800%.|Verstärkt den Effekt des zuletzt zum Aufwerten verwendeten Items um 800 %.
Increases effect of last item used in upgrade by 200%.|Verstärkt den Effekt des zuletzt zum Aufwerten verwendeten Items um 200 %.
Cancels the effect of Object X, which is 8x the effect of the material used before.|Hebt den Effekt von Objekt X auf; entspricht dem Achtfachen des zuvor verwendeten Materials.
If in held in bag, automatically recovers HP if HP reaches 0|Stellt automatisch LP wieder her, sobald die LP auf 0 fallen, wenn das Item in der Tasche liegt.
Charge Ability : Heals a friendly target for a considerable amount.|Aufladefähigkeit: Heilt ein verbündetes Ziel um einen erheblichen Betrag.
Extends weapon attack range|Erhöht die Angriffsreichweite der Waffe.
Makes item invisible.|Macht das Item unsichtbar.
Increase Level|Erhöht die Stufe.
Changes category of weapon.|Ändert die Waffenkategorie.
It is upgraded with a random item for ever Level and gains those abilities.|Wird bei jeder Stufe mit einem zufälligen Item aufgewertet und erhält dessen Fähigkeiten.
Reverses the effects of all subsequent upgrades.|Kehrt die Effekte aller nachfolgenden Aufwertungen um.
Rare monster drops are slightly easier to come by|Seltene Monsterbeute wird etwas häufiger fallen gelassen.
Decrease enemy tolerance on hit.|Senkt bei einem Treffer die Widerstandskraft des Gegners.
+ Monster Item Drop|Erhöhte Monsterbeute
UPSTATS|Werteverbesserung
INEDIBLE|Ungenießbar
NO EFFECT|Kein Effekt
Status|Status
Not tameable|Nicht zähmbar
Not Tameable|Nicht zähmbar
Not implemented|Nicht implementiert
WIP|Noch nicht erfasst
N/A|Nicht verfügbar
ー|Keine
✖️|Keine
Daily|Täglich
Random|Zufällig
Truhe; Heavy Boots gegen den Wind anziehen.|Chest; wear Heavy Boots to resist the wind.
Rezepttruhe; Wasser- und Lichtfallen.|Recipe chest; water and light traps.
Truhe; Zugang mit normaler Riesenpflanze.|Chest; accessible with a regular giant crop.
Truhe; Zugang mit goldener Riesenpflanze erforderlich.|Chest; requires a giant golden crop for access.
Mit Water Shoes von F1 über das Wasser nach Osten zu den Truhen.|Use Water Shoes to cross the water east from F1 to the chests.
Feste Rezepttruhe im weiteren Aufstieg. Im bebilderten RF4-Spielbericht belegt; keine Raumkoordinate angegeben.|Fixed recipe chest further up the ascent. Documented in an illustrated RF4 gameplay report; no room coordinate provided.
Rezepttruhe im versteckten Bereich westlich von B2.|Recipe chest in the hidden area west of B2.
Schalter mit Gegenständen beschweren; oben links zwischen den beiden Blöcken hindurchgehen.|Weigh down the switches with items; walk between the two blocks at the upper left.
Mit Water Shoes von F8 aus erreichbar.|Accessible from F8 using Water Shoes.
Rezepttruhe.|Recipe chest.
Hebel betätigen, Gegner besiegen; Truhe erscheint. Giftraum.|Activate the lever and defeat the monsters to make the chest appear. Poison room.
RF4-Spielszene: Ethelberd in der ersten Kampfphase.|RF4 gameplay scene: Ethelberd during the first phase of the battle.
Gemeinsames RF4-Wooly-Symbol; Little Wooly ist die Festivalvariante.|Shared RF4 Wooly icon; Little Wooly is the festival variant.
RF4-Gruppenszene: Sechs Cat links im Bild; die Gruppe nach der Verwandlung.|RF4 group scene: Sechs Cat on the left; the group after transforming.
RF4-Spielszene: Sechs Dragon vor Forte und Frey.|RF4 gameplay scene: Sechs Dragon in front of Forte and Frey.
RF4-Gruppenszene: Sechs Sorcerer rechts, Sechs Dragon in der Mitte.|RF4 group scene: Sechs Sorcerer on the right, Sechs Dragon in the centre.
RF4-Tabellen, RF4-Abschnitte der einzelnen Rune-Factory-Wiki-Seiten und die RF4-Itemliste von Ranch Story. Quellenabweichungen und nicht belegbare Angaben sind gekennzeichnet. Deutsche offizielle Namen sind ohne verifizierbare Lokalisierungsquelle noch offen.|RF4 tables, RF4 sections of individual Rune Factory Wiki pages and the Ranch Story RF4 item list. Source discrepancies and unverified information are marked. Official German names remain unconfirmed without a verifiable localization source.
`);

// Source descriptions may begin in either language; keep their direction explicit.
const germanSourceStart = prose.findIndex(
  ([source]) => source === "Truhe; Heavy Boots gegen den Wind anziehen.",
);
const englishToGerman = new Map([
  ...terms,
  ...prose.slice(0, germanSourceStart),
  ...Object.entries(locationTranslations),
]);
const germanToEnglish = new Map(terms.map(([en, de]) => [de, en]));
for (const [de, en] of prose.slice(germanSourceStart))
  germanToEnglish.set(de, en);
for (const [en, de] of prose.slice(0, germanSourceStart)) {
  if (!germanToEnglish.has(de)) germanToEnglish.set(de, en);
}
for (const [en, de] of Object.entries(nameTranslations)) {
  if (!germanToEnglish.has(de)) germanToEnglish.set(de, en);
}

// Keep the original acquisition descriptions searchable while displaying the
// translated item names with the case required by their German sentences.
const germanSourceOverrides = new Map([
  [
    "Truhe; Heavy Boots gegen den Wind anziehen.",
    "Truhe; schwere Stiefel gegen den Wind anziehen.",
  ],
  [
    "Mit Water Shoes von F1 über das Wasser nach Osten zu den Truhen.",
    "Mit Wasserschuhen von F1 über das Wasser nach Osten zu den Truhen.",
  ],
  [
    "Mit Water Shoes von F8 aus erreichbar.",
    "Von F8 aus mit Wasserschuhen erreichbar.",
  ],
]);

export function germanName(recordOrString) {
  const name =
    typeof recordOrString === "object" ? recordOrString?.name : recordOrString;
  return (
    (typeof recordOrString === "object" && recordOrString?.de) ||
    nameTranslations[name] ||
    englishToGerman.get(name) ||
    localizeText(name, "de")
  );
}

export function displayName(recordOrString, language = getLanguage()) {
  const name =
    typeof recordOrString === "object" ? recordOrString?.name : recordOrString;
  return language === "de" ? germanName(recordOrString) : name || "";
}

const escapePattern = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const nameLookup = new Map(
  Object.entries(nameTranslations).map(([name, de]) => [
    name.toLowerCase(),
    de,
  ]),
);
const namesPattern = new RegExp(
  `(?<![\\p{L}\\p{N}_])(?:${[...nameLookup.keys()]
    .sort((a, b) => b.length - a.length)
    .map(escapePattern)
    .join("|")})(?![\\p{L}\\p{N}_])`,
  "giu",
);

const effectTerms = pairs(`
Status Ailments|Statusleiden
Status Ailment|Statusleiden
Charge Ability|Aufladefähigkeit
HP Max|Max. LP
RP Max|Max. RP
M. ATK|Magischer Angriff
M. DEF|Magische Verteidigung
M.ATK|Magischer Angriff
M.DEF|Magische Verteidigung
MATK|Magischer Angriff
MDEF|Magische Verteidigung
HP Drain|LP-Absorption
Monster Item Drop|Monsterbeute
Read note|Hinweis beachten
EarthWind|Erde/Wind
FireWater|Feuer/Wasser
HP|LP
ATK|Angriff
ARK|Angriff
Atk|Angriff
DEF|Verteidigung
Def|Verteidigung
STR|Stärke
VIT|Vitalität
INT|Intelligenz
Psn|Gift
PSN|Gift
Par|Lähmung
PAR|Lähmung
Slp|Schlaf
SLP|Schlaf
Ftg|Erschöpfung
FTG|Erschöpfung
Sick|Krankheit
SEAL|Versiegelung
Fnt|K. o.
Faint|K. o.
Diz|Benommenheit
Crt|Kritisch
Crit|Kritisch
Stun|Betäubung
Knock|Rückstoß
Drain|Absorption
Res|Resistenz
Heal|Heilt
Dispel|Bannung
Earth|Erde
Fire|Feuer
Water|Wasser
Wind|Wind
Light|Licht
Dark|Dunkelheit
Love|Liebe
Random|Zufällig
chance|Chance
Daily|Täglich
Lvl|Stufe
LV|Stufe
Level|Stufe
UPSTATS|Werteverbesserung
NO EFFECT|Kein Effekt
INEDIBLE|Ungenießbar
`);
const effectLookup = new Map(
  effectTerms.map(([en, de]) => [en.toLowerCase(), de]),
);
const effectsPattern = new RegExp(
  `(?<![\\p{L}\\p{N}_])(?:${[...effectLookup.keys()]
    .sort((a, b) => b.length - a.length)
    .map(escapePattern)
    .join("|")})(?![\\p{L}\\p{N}_])`,
  "giu",
);

const localizedTextCache = { de: new Map(), en: new Map() };
function translateText(value, language) {
  if (value == null) return "";
  const text = String(value);
  if (!text) return "";
  if (language === "en") return germanToEnglish.get(text) || text;
  if (germanSourceOverrides.has(text)) return germanSourceOverrides.get(text);
  if (englishToGerman.has(text)) return englishToGerman.get(text);
  if (nameTranslations[text]) return nameTranslations[text];
  const protectedNames = [];
  let result = text
    .replaceAll("Template:RFI ", "")
    .replace(namesPattern, (name) => {
      protectedNames.push(nameLookup.get(name.toLowerCase()));
      return `\u0001${protectedNames.length - 1}\u0002`;
    });
  for (const [source, translated] of prose
    .slice(0, germanSourceStart)
    .sort((a, b) => b[0].length - a[0].length)) {
    if (source.length > 20) result = result.replaceAll(source, translated);
  }
  result = result.replace(effectsPattern, (term) =>
    effectLookup.get(term.toLowerCase()),
  );
  return result.replace(
    /\u0001(\d+)\u0002/g,
    (_, index) => protectedNames[Number(index)],
  );
}

export function localizeText(value, language = getLanguage()) {
  const text = String(value ?? "");
  const cache = localizedTextCache[language === "en" ? "en" : "de"];
  if (!cache.has(text)) cache.set(text, translateText(text, language));
  return cache.get(text);
}
