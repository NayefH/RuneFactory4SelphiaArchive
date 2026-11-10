// RF4 / RF4 Special only. Compact gift examples, not an exhaustive item index.
// Each character links to the relevant RF4 gift table. Category entries preserve
// the source's exceptions; named items take precedence over category summaries.
const wiki = (name) =>
  `https://wiki.ranchstory.farm/index.php/${name.replaceAll(" ", "_")}_(Rune_Factory_4)#Gifts`;
const split = (value = "") => (value ? value.split("|") : []);
const trash = split(
  "Can|Rare Can|Boot|Scrap Metal|Weeds|Withered Grass|Failed Dish|Disastrous Dish|Stone|Branch|Object X",
);
const medicinal = split(
  "The Protein|Intelligencer|Vital Gummi|Heart Drink|Antidote Potion|Para-Gone|Roundoff|Cold Medicine|Love Potion|Invinciroid|Leveliser|Recovery Potion|Healing Potion|Mystery Potion",
);
const make = (name, role, loved, liked, disliked, hated, extra = {}) => ({
  name,
  role,
  giftable: true,
  examples: true,
  loved: split(loved),
  liked: split(liked),
  disliked: split(disliked),
  hated: split(hated),
  source: wiki(name),
  ...extra,
});
const commonDislikes = (extra = "") => [
  ...new Set([...split(extra), ...trash]),
];

export const characters = [
  make(
    "Amber",
    "bachelorette",
    "Mixed Smoothie|Gold Juice|Emery Flower|Great Emery Flower",
    "Honey|Toyherb|Moondrop Flower|Pink Cat|Charm Blue|Strawberry|Apple|Orange|Pineapple Juice|Mixed Juice",
    "All fish|Boot|Scrap Metal|Weeds|Withered Grass|Failed Dish|Disastrous Dish|Stone|Branch|Object X",
    "Ironleaf|Super Ironleaf",
  ),
  make(
    "Clorica",
    "bachelorette",
    "Apple Pie|Platinum|Orichalcum|Diamond|Round Stone|Shade Stone|White Stone|Glitta Augite|Red Core|Green Core|Yellow Core|Blue Core",
    "Apple|Apple Juice|Baked Apple|Apple Jam|Hot Chocolate|Cookie|Flan|Silver|Gold|Ruby|Emerald|Sapphire",
    "",
    "Grape Bread",
    { disliked: commonDislikes("Grapes|Grape Juice|Wine|Grape Jam") },
  ),
  make(
    "Dolce",
    "bachelorette",
    "Flan|Pumpkin Flan|Cake|Chocolate Cake|Cheesecake|Choco Sponge",
    "Hot Milk|Hot Chocolate|Hot Juice|Relax Tea|Yarn Ball|Cheap Cloth|Quality Cloth|Silk Cloth|Spider's Thread|Pretty Thread|Moondrop Flower|Ice Cream",
    "",
    "Vegetable Juice",
    {
      disliked: commonDislikes(
        "All vegetables|Salad|Wine|Tomato Juice|Grape Juice|Orange Juice|Apple Juice|Fruit Juice|Mixed Juice|Gold Juice",
      ),
    },
  ),
  make(
    "Forte",
    "bachelorette",
    "Omelet Rice|Chocolate Cake|Union Stew",
    "Egg (S)|Egg (M)|Egg (L)|Mayonnaise|Fried Egg|Omelet|Boiled Egg|Egg Bowl|Cheesecake|Apple Pie|Flan|All flowers",
    "",
    "Ultimate Curry|Royal Curry",
    {
      disliked: commonDislikes(
        "Curry Bread|Curry Udon|Curry Manju|Dry Curry|Curry Rice",
      ),
      notes: {
        de: "Die Quelle nennt auch Kuchen unter Geliebt; ihre Tabelle führt ihn zugleich bei Gemocht. Schokoladenkuchen, Omelettreis und Union Stew sind die eindeutigeren Geschenkoptionen.",
        en: "The source lists Cake as both loved and liked. Chocolate Cake, Omelet Rice and Union Stew are clearer gift choices.",
      },
    },
  ),
  make(
    "Margaret",
    "bachelorette",
    "Prelude to Love|Pineapple Juice|Pink Melon|Golden Turnip|Golden Potato|Golden Pumpkin|Golden Cabbage",
    "Toyherb|Moondrop Flower|Apple|Orange|Strawberry|Shrimp|Lobster|Cake|Chocolate Cake|Apple Pie|Honey|Ice Cream",
    "Squid|Sunsquid|Lamp Squid|Skull",
    "Squid Sashimi|Sunsquid Sashimi|Lamp Squid Sashimi|Grilled Squid|Grilled Sunsquid|Grilled Lamp Squid",
    {
      sources: [
        wiki("Margaret"),
        "https://wikiwiki.jp/rf4bu/キャラクターデータ",
      ],
      notes: {
        de: "Die Quellen unterscheiden sich bei einzelnen geliebten Geschenken. Hier sind die wiederholt belegten Optionen aufgeführt. Müll nicht pauschal als ungeliebt behandeln: Margaret ist eine Ausnahme.",
        en: "Sources differ on some loved gifts. This list uses repeatedly documented choices. Do not apply a blanket trash dislike: Margaret is an exception.",
      },
    },
  ),
  make(
    "Xiao Pai",
    "bachelorette",
    "Blue Crystal|Big Blue Crystal|Green Crystal|Big Green Crystal|Red Crystal|Big Red Crystal|White Crystal|Big White Crystal|Emery Flower|Great Emery Flower",
    "Toyherb|Ultra Toyherb|Moondrop Flower|Pink Cat|Charm Blue|Fireflower|Fried Rice|Chinese Manju|Curry Manju|Gyoza|Boiled Gyoza|Steamed Gyoza",
    "Tomato Juice|Salad|Sandwich|Can|Rare Can|Boot|Scrap Metal|Weeds|Withered Grass|Stone|Branch|Object X",
    "Tomato|Titan Tomato",
  ),
  make(
    "Arthur",
    "bachelor",
    "Salmon Onigiri|Turnip Heaven|Golden Turnip|Golden Tyrant Turnip",
    "Turnip|Tyrant Turnip|Pink Turnip|Colossal Pink|Onigiri|Baked Onigiri|Sandwich|Chinese Manju|Curry Manju|Pickled Turnip|Pickle Mix|Pickles|Spectacles|Intelligent Glasses|Can|Rare Can",
    "All grilled fish except Salted Pike|Boot|Scrap Metal|Weeds|Withered Grass|Failed Dish|Disastrous Dish|Stone|Branch|Object X",
    "Salted Pike",
  ),
  make(
    "Doug",
    "bachelor",
    "Tempura Bowl",
    "Rice|Onigiri|Salmon Onigiri|Baked Onigiri|Fried Rice|Risotto|Rice Porridge|Milk Porridge|Egg Bowl|Bamboo Rice|Omelet Rice|Doria|Seafood Doria",
    "",
    "Curry Bread|Cheese Bread",
    {
      disliked: commonDislikes(
        "Bread|Toast|French Toast|Grape Bread|Jam Bread|Butter Roll|Steamed Bread",
      ),
      notes: {
        de: "Seine Freundschaft ist während eines Teils der Geschichte begrenzt. Die Kennzeichnung als Bachelor bedeutet nicht, dass seine Romanze sofort verfügbar ist.",
        en: "His friendship is capped during part of the story. The bachelor label does not mean his romance is immediately available.",
      },
    },
  ),
  make(
    "Dylas",
    "bachelor",
    "Milk Porridge|Tuna|Throbby Snapper|Glitter Snapper|Sunsquid|Fatty Tuna|Lover Sashimi|Glitter Sashimi|Sunsquid Sashimi",
    "Milk (S)|Milk (M)|Milk (L)|Carrot|Royal Carrot|Corn Flakes|Hot Milk|Vegetable Juice",
    "",
    "Chocolate|Honey",
    {
      disliked: commonDislikes(
        "Cake|Chocolate Cake|Cheesecake|Apple Pie|Pancakes|Dumplings|Cookie|Flan|Ice Cream|Strawberry Jam",
      ),
      notes: {
        de: "Die Quelle nennt zusätzlich die übrigen Fische und Sashimi als gemocht; die oben genannten Lieblingsfische und ihre Sashimi sind Ausnahmen mit höherer Vorliebe.",
        en: "The source also lists other fish and sashimi as liked; the favorite fish and sashimi listed above are higher-preference exceptions.",
      },
    },
  ),
  make(
    "Kiel",
    "bachelor",
    "Chocolate Cake|Chowder",
    "Dumplings|Pound Cake|Baked Apple|Donut|Hot Chocolate|Cookie|Flan|Pumpkin Flan|Ice Cream|Chocolate|Honey|Cake|Cheesecake|Apple Pie",
    "",
    "Fall Sashimi",
    {
      disliked: commonDislikes("All sashimi except Fall Sashimi"),
      notes: {
        de: "Kiel liebt außerdem Bossbeute. Die Kategorie bezieht sich auf die Beuteitems, nicht auf beliebige bei einem Boss gefundene Gegenstände.",
        en: "Kiel also loves boss drops. This category refers to the drop items, not every object found near a boss.",
      },
    },
  ),
  make(
    "Leon",
    "bachelor",
    "Salted R. Trout|Grilled Lamp Squid",
    "Rainbow Trout|Lamp Squid|Rainbow Sashimi|Lamp Squid Sashimi|Charm Blue|Great Charm Blue|Pom-Pom Grass|King Pom-Pom Grass",
    "",
    "Milk (S)|Milk (M)|Milk (L)",
    {
      disliked: commonDislikes(
        "Milk Porridge|Strawberry Milk|Corn Flakes|Hot Milk",
      ),
      notes: {
        de: "Andere gegrillte Fische werden ebenfalls gemocht; die beiden unter Geliebt genannten Fischgerichte haben Vorrang.",
        en: "Other grilled fish are also liked; the two fish dishes listed as loved take precedence.",
      },
    },
  ),
  make(
    "Vishnal",
    "bachelor",
    "Ultimate Curry|Royal Curry|Curry Bread|Curry Udon|Curry Manju|Dry Curry|Curry Rice|Golden Potato|Gold Prince Potato|Golden Pumpkin|Gldn. Doom Pumpkin|Golden King Cabbage",
    "Fried Rice|Omelet Rice|Croquettes|Gyoza|Chinese Manju|Steamed Gyoza|Ice Cream|Flan|Carrot|Potato|Cabbage",
    "Turnip|Tyrant Turnip|Pink Turnip|Colossal Pink|Golden Tyrant Turnip|Pickled Turnip|Pickle Mix|Can|Rare Can|Boot|Scrap Metal|Weeds|Withered Grass|Stone|Branch|Object X",
    "Turnip Heaven",
    {
      notes: {
        de: "Gemüse wird grundsätzlich gemocht, Rüben sind eine Ausnahme. Goldgemüse wird bevorzugt, doch goldene Rüben sind kein sicheres Geschenk.",
        en: "Vegetables are generally liked, with turnips as an exception. Golden vegetables are favorites, but golden turnips are not a safe gift.",
      },
    },
  ),
  make(
    "Bado",
    "resident",
    "Tempura Bowl|Egg Bowl",
    "Scrap Metal|Onigiri|Baked Onigiri|Salmon Onigiri",
    "Cheese|Pizza|Seafood Pizza|Seafood Gratin|Cheesecake|Cheese Bread|Iron|Bronze|Silver|Gold|Platinum|Orichalcum",
    "Cheese Fondue",
    {
      notes: {
        de: "Bado mag Schrottmetall; die sonstigen Erze mag er nicht. Die Quelle nennt Käsegerichte als weitere ungeliebte Geschenke.",
        en: "Bado likes Scrap Metal but dislikes other ores. The source also lists cheese dishes as disliked gifts.",
      },
    },
  ),
  make(
    "Blossom",
    "resident",
    "Risotto",
    "Rice Porridge|Milk Porridge|Vegetable Juice|Relax Tea|Turnip|Carrot|Potato|Cabbage",
    "",
    "Formuade",
    {
      disliked: [...trash, ...medicinal],
      notes: {
        de: "Die Quelle nennt alle Gemüsesorten als gemocht; hier sind einige einfach erhältliche Beispiele verlinkt. Medikamente werden nicht gemocht.",
        en: "The source lists all vegetables as liked; some easy examples are linked here. Medicines are disliked.",
      },
    },
  ),
  make(
    "Illuminata",
    "resident",
    "Relax Tea|Relax Tea Leaves",
    "Toyherb|Moondrop Flower|Pink Cat|Charm Blue|Cherry Grass|Lamp Grass|Fireflower|Apple Pie|Bread|Honey|Cookie|Flan|Cake|Strawberry Jam",
    "",
    "Pickles",
    {
      disliked: commonDislikes("Pickled Turnip|Turnip|Pickle Mix"),
      notes: {
        de: "Auch weitere Blumen, Süßspeisen, Marmeladen und Brotsorten werden gemocht; die vollständige Zuordnung steht in der Quelle.",
        en: "Other flowers, sweets, jams and breads are also liked; see the source for the full classification.",
      },
    },
  ),
  make(
    "Jones",
    "resident",
    "Fried Rice",
    "Rice|Onigiri|Salmon Onigiri|Baked Onigiri|Bamboo Rice|Pickled Turnip|Pickles|Pickle Mix|Miso Eggplant|Tempura|Tempura Udon|Flan|Moondrop Flower",
    "",
    "Devil Blood",
    {
      disliked: commonDislikes("Tomato Juice"),
      notes: {
        de: "Die Quelle nennt außerdem Sashimi und gegrillten Fisch als gemocht.",
        en: "The source also lists sashimi and grilled fish as liked.",
      },
    },
  ),
  make(
    "Lin Fa",
    "resident",
    "Milk Porridge",
    "Rice|Onigiri|Salmon Onigiri|Baked Onigiri|Fried Rice|Risotto|Rice Porridge|Tempura Bowl|Egg Bowl|Bamboo Rice|Omelet Rice|Milk (S)|Milk (M)|Milk (L)|Chinese Manju|Gyoza",
    "",
    "Curry Udon",
    { disliked: commonDislikes("Udon|Fried Udon|Tempura Udon") },
  ),
  make(
    "Nancy",
    "resident",
    "Stew",
    "Cheese|Cheesecake|Cheese Bread|Omelet|Omelet Rice|Risotto|Cheese Fondue|Pizza|Seafood Pizza|Doria|Seafood Doria|Gratin|Seafood Gratin|Flan|Pumpkin Flan|Moondrop Flower",
    "",
    "Rainbow Sashimi|Salted R. Trout",
    {
      disliked: commonDislikes(
        "Rainbow Trout|Lamp Squid|Lamp Squid Sashimi|Grilled Lamp Squid",
      ),
    },
  ),
  make(
    "Porcoline",
    "resident",
    "Turnip|Carrot|Potato|Cabbage|Pumpkin|Onion|Radish|Leek|Bok Choy",
    "Onigiri|Bread|Fried Rice|Cake|Apple Pie|Stew",
    "",
    "Failed Dish|Disastrous Dish",
    {
      disliked: [
        ...trash.filter((n) => !["Failed Dish", "Disastrous Dish"].includes(n)),
        ...medicinal,
      ],
      notes: {
        de: "Er liebt alle Gemüsesorten und mag grundsätzlich Gerichte. Die genannten Items sind Beispiele; misslungene und katastrophale Gerichte bleiben verhasste Ausnahmen.",
        en: "He loves all vegetables and generally likes cooked dishes. Listed items are examples; Failed Dish and Disastrous Dish remain hated exceptions.",
      },
    },
  ),
  make(
    "Ventuswill",
    "resident",
    "Pancakes|Golden Cabbage|Golden King Cabbage|Golden Pumpkin|Gldn. Doom Pumpkin|Golden Potato|Gold Prince Potato|Golden Turnip|Golden Tyrant Turnip",
    "Turnip|Carrot|Potato|Cabbage|Mushroom|Honey",
    "",
    "Dragon Fang",
    {
      disliked: [
        ...commonDislikes(
          "Iron|Bronze|Silver|Gold|Platinum|Orichalcum|Dragonic Stone",
        ),
        ...medicinal,
      ],
      notes: {
        de: "Sie mag Gemüse, Pilze und Honig. Viele Monsterdrops werden nicht gemocht. Ihre Verfügbarkeit hängt vom Fortschritt der Geschichte ab.",
        en: "She likes vegetables, mushrooms and honey. Many monster drops are disliked. Her availability depends on story progress.",
      },
    },
  ),
  make(
    "Volkanon",
    "resident",
    "Relax Tea",
    "Lumber|Stone|Dumplings|Pound Cake|Baked Apple|Donut|Hot Chocolate|Cookie|Flan|Pumpkin Flan|Ice Cream|Chocolate|Honey|Cake|Chocolate Cake|Cheesecake|Apple Pie",
    "Can|Rare Can|Boot|Scrap Metal|Weeds|Withered Grass|Object X",
    "Failed Dish|Disastrous Dish",
    {
      notes: {
        de: "Lumber und Stone sind bei ihm ausdrücklich gemocht. Auch weitere Süßspeisen sind geeignete Geschenke.",
        en: "Lumber and Stone are explicitly liked. Other sweets also make suitable gifts.",
      },
    },
  ),
  make(
    "Barrett",
    "visitor",
    "Skipjack Sashimi|Salmon|Salmon Sashimi|Skipjack",
    "Iron",
    "",
    "Emperor Eggplant",
    {
      disliked: commonDislikes("Eggplant"),
      notes: {
        de: "Gast aus Rune Factory 2; in Rune Factory 4 kein Heiratskandidat.",
        en: "A guest from Rune Factory 2; not a marriage candidate in Rune Factory 4.",
      },
    },
  ),
  make(
    "Raven",
    "visitor",
    "Star Pendant|Sun Pendant|Meadow Pendant|Water Pendant|Earth Pendant|Red Core|Yellow Core|Blue Core|Green Core|Big Crystal|Rune Crystal",
    "Iron|Bronze|Silver|Gold|Silver Pendant|Heart Pendant|Toyherb|Moondrop Flower|Pink Cat|Charm Blue|Amethyst|Aquamarine|Emerald|Ruby|Sapphire",
    "Floating Hood|Ancient Fish Bone|Dragon Bone|Can|Rare Can|Boot|Scrap Metal|Weeds|Withered Grass|Stone|Branch|Object X",
    "Skull",
    {
      notes: {
        de: "Gast aus Rune Factory 3; in Rune Factory 4 keine Heiratskandidatin. Die Geschenkvorlieben beziehen sich ausdrücklich auf ihren RF4-Auftritt.",
        en: "A guest from Rune Factory 3; not a marriage candidate in Rune Factory 4. These preferences refer specifically to her RF4 appearance.",
      },
    },
  ),
  make(
    "Noel",
    "child",
    "Steel Sword|Copper Bracelet|Vest|Straw Hat|Bronze Shield|Strider Boots",
    "Gyoza|Stew|French Fries|Croquettes|Tuna Sashimi|Pizza|Seafood Pizza|Doria|Seafood Doria|Ultimate Curry|Royal Curry|Curry Bread|Curry Udon|Curry Manju|Dry Curry|Curry Rice",
    "",
    "Cold Medicine",
    {
      source: wiki("Your Child"),
      disliked: commonDislikes("Veggie Smoothie|Pickle Mix"),
      notes: {
        de: "Möglicher Sohn nach der Heirat. Es erscheint nur eines der beiden Kinder; Geburtstag und Verfügbarkeit hängen von deinem Spielverlauf ab.",
        en: "Possible son after marriage. Only one of the two children appears; birthday and availability depend on your playthrough.",
      },
    },
  ),
  make(
    "Luna",
    "child",
    "Silver Pendant|Heart Pendant|Ruby Ring|Diamond Ring|Emerald Ring",
    "Gyoza|Stew|French Fries|Croquettes|Tuna Sashimi|Pizza|Seafood Pizza|Doria|Seafood Doria|Ultimate Curry|Royal Curry|Curry Bread|Curry Udon|Curry Manju|Dry Curry|Curry Rice",
    "",
    "Cold Medicine",
    {
      source: wiki("Your Child"),
      disliked: commonDislikes("Veggie Smoothie|Pickle Mix"),
      notes: {
        de: "Mögliche Tochter nach der Heirat. Es erscheint nur eines der beiden Kinder; Geburtstag und Verfügbarkeit hängen von deinem Spielverlauf ab.",
        en: "Possible daughter after marriage. Only one of the two children appears; birthday and availability depend on your playthrough.",
      },
    },
  ),
  ...[
    [
      "Pico",
      "resident",
      "Dolces Begleiterin; kein eigener Eintrag mit Geschenkvorlieben in der Freundesliste.",
      "Dolce's companion; no separate gift preference entry in the friendship list.",
      "https://strategywiki.org/wiki/Rune_Factory_4/Townsfolk#Pico",
    ],
    [
      "Frey",
      "story",
      "Spielbare Heldin. Sie hat im normalen Spiel kein eigenes NPC-Geschenksystem.",
      "Playable heroine. She has no separate NPC gift system in normal play.",
      "https://therunefactory.fandom.com/wiki/Frey",
    ],
    [
      "Lest",
      "story",
      "Spielbarer Held. Er hat im normalen Spiel kein eigenes NPC-Geschenksystem.",
      "Playable hero. He has no separate NPC gift system in normal play.",
      "https://therunefactory.fandom.com/wiki/Lest",
    ],
    [
      "Eliza",
      "story",
      "Auftragskasten im Schloss. Für ihn gibt es keine reguläre Geschenkvorliebenliste.",
      "The castle's request box. It has no regular gift preference list.",
      "https://therunefactory.fandom.com/wiki/Eliza",
    ],
    [
      "Ethelberd",
      "story",
      "Storycharakter; kein regulärer Bewohner mit Geschenkvorlieben.",
      "Story character; not a regular villager with gift preferences.",
      "https://therunefactory.fandom.com/wiki/Ethelberd",
    ],
    [
      "Yang Fan",
      "story",
      "Erscheint in Stadtereignissen. Keine belegte reguläre Geschenkvorliebenliste erfasst.",
      "Appears in town events. No documented regular gift preference list is recorded.",
      "https://therunefactory.fandom.com/wiki/Yang_Fan",
    ],
  ].map(([name, role, de, en, source]) => ({
    name,
    role,
    giftable: false,
    loved: [],
    liked: [],
    disliked: [],
    hated: [],
    source,
    notes: { de, en },
  })),
];

export const characterCoverage = {
  de: "Alle 25 Bewohner, Gäste und möglichen Kinder mit regulären Geschenkvorlieben sind enthalten; zusätzliche Storyfiguren sind als solche gekennzeichnet. Die Listen zeigen konkrete Geschenkbeispiele und bekannte Ausnahmen, keine vollständige Aufzählung jedes Items. Nicht aufgeführte Items sind nicht automatisch neutral.",
  en: "All 25 residents, visitors and possible children with regular gift preferences are included; additional story figures are identified separately. Lists show specific gift examples and known exceptions, not every item. Unlisted items are not automatically neutral.",
};

// Normalize unambiguous alternate English labels to this archive's item names.
const canonicalGiftNames = {
  "Choco Sponge": "Chocolate Sponge",
  "Yarn Ball": "Yarn",
  "Fried Egg": "Fried Eggs",
  "Corn Flakes": "Corn Cereal",
  Stone: "Material Stone",
  "Meadow Pendant": "Field Pendant",
  "Water Pendant": "Dew Pendant",
  "Dragon Bone": "Dragon Bones",
};
for (const character of characters) {
  for (const preference of ["loved", "liked", "disliked", "hated"]) {
    character[preference] = character[preference].map(
      (name) => canonicalGiftNames[name] || name,
    );
  }
}
