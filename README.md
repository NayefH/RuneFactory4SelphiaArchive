# Selphia Archiv – Rune Factory 4 Datenbank

**Items finden, Rezepte nachschlagen, Gegner kennenlernen und Boni vergleichen.**
Das Selphia Archiv ist ein deutschsprachiges, durchsuchbares Fanprojekt von
**Nayef Hajjaj** für **Rune Factory 4 (RF4)**. Die Website bündelt Spielwerte,
Materialien, Herstellung und bekannte Rezeptfundorte in einer für Desktop und
Smartphone angepassten Oberfläche.

**[Website öffnen](https://nayefh.github.io/RuneFactory4SelphiaArchive/)** ·
[Items & Materialien](https://nayefh.github.io/RuneFactory4SelphiaArchive/?tab=item) ·
[Rezepte](https://nayefh.github.io/RuneFactory4SelphiaArchive/?tab=recipe) ·
[Bestiarium](https://nayefh.github.io/RuneFactory4SelphiaArchive/?tab=monster)

![Lest, Frey und die Figuren aus Rune Factory 4 Special](public/design/rf4-home.png)

## Was bietet das Archiv?

- **Item-Datenbank:** englische Namen, Bilder, Preise, Attribute und Verwendung
  in Rezepten. Deutsche Suchhilfen sind zusätzlich gekennzeichnet.
- **Rezepte und Herstellung:** Zutaten, Mengen, Materialgruppen, Werkbänke und
  Rezeptlevel; belegte Rezeptfundorte mit Quellen und Zugangshinweisen.
- **Bestiarium:** Gegner und Bosse mit Fundorten, Beute, Kampfwerten und weiteren
  verfügbaren Angaben zum Zähmen und zur Produktion.
- **Boni vergleichen:** nach einzelnen Attributen wie ATK, DEF, STR oder INT
  sortieren; Ausrüstungswerte, Upgrade-Boni, Essens- und Koch-Effekte unterscheiden.
- **Suche und Filter:** Namen, Zutaten, Beute und Fundorte durchsuchen sowie nach
  Kategorie, Werkbank und maximalem Rezeptlevel filtern.
- **Merkliste:** Items, Rezepte und Gegner per Stern im verwendeten Browser speichern.

Der aktuelle Datenstand umfasst **1.089 Items und Materialien, 665 Rezeptvarianten
und 178 Gegner**. Für **28 Rezepte** sind besondere Fundorte dokumentiert. Diese
Zahlen beschreiben den importierten Bestand; Quellenlücken bleiben ausdrücklich
gekennzeichnet.

## So suchst du

Wähle auf der Startseite den Bereich **Items**, **Rezepte** oder **Gegner** und gib
einen Namen oder Fundort ein. Mit `/` springst du direkt in das Suchfeld.

| Gesucht                  | Beispiel                                                           |
| ------------------------ | ------------------------------------------------------------------ |
| Ein Item                 | `Iron` oder die gekennzeichnete Suchhilfe `Eisen`                  |
| Ein Gegner               | `Wooly`                                                            |
| Ein Rezept               | `Pineapple Juice`                                                  |
| Rezepte aus einem Gebiet | Im Rezeptbereich nach `Rune Prana` suchen                          |
| Ein bestimmter Bonus     | Unter **Items → Boni vergleichen** Bonusart und Attribut auswählen |

Details öffnen sich beim Anklicken eines Eintrags. Zutaten und verwandte Rezepte
sind miteinander verknüpft. Ein direkter Link inklusive Suchbegriff und Filtern
lässt sich aus der Adresszeile teilen.

## Quellen und deutsche Namen

Die Daten basieren auf dem [Rune Factory Wiki](https://therunefactory.fandom.com/wiki/Rune_Factory_4)
und der [RF4-Itemliste von Ranch Story](<https://ranchstory.miraheze.org/wiki/Item_List_(Rune_Factory_4)>).
Ergänzende Bild- und Fundortquellen sind bei den jeweiligen Einträgen verlinkt.
Es werden ausschließlich Daten für Rune Factory 4 verwendet.

Die englischen Namen stehen im Vordergrund. Mit **DE\*** markierte deutsche
Begriffe sind unbestätigte Suchhilfen und werden nicht als offizielle Übersetzung
ausgegeben. Fehlende Werte sind unbekannt und bedeuten nicht automatisch null.

**English:** Selphia Archive is a searchable **Rune Factory 4 / RF4 database** by
**Nayef Hajjaj**, with items, crafting and cooking recipes, recipe chest locations,
monster drops, equipment stats, upgrade bonuses and favorites. The interface is in
German; English item and monster names are searchable.

## GitHub Pages einrichten

1. Im Repository `NayefH/RuneFactory4SelphiaArchive` unter **Settings → Pages**
   bei **Build and deployment → Source** die Option **GitHub Actions** auswählen.
2. Die vorbereiteten Dateien auf den Branch `main` hochladen:

   ```powershell
   git add .
   git commit -m "Configure GitHub Pages deployment"
   git push origin main
   ```

3. Im Tab **Actions** den Workflow **Deploy to GitHub Pages** öffnen.
   Nach einem erfolgreichen Lauf ist die Website erreichbar unter:
   <https://nayefh.github.io/RuneFactory4SelphiaArchive/>

Weitere Änderungen auf `main` werden automatisch gebaut und veröffentlicht.
Über **Actions → Deploy to GitHub Pages → Run workflow** lässt sich der Vorgang
auch manuell starten. GitHub Pages veröffentlicht die Website öffentlich.

## Lokal entwickeln und prüfen

```powershell
npm ci
npm run dev
node --test tests/*.test.js
```

Build und Vorschau für den GitHub-Projektpfad:

```powershell
npm run build:pages
npm run preview -- --mode pages
```

`vite.config.js` setzt im Modus `pages` den Projektpfad. `src/public-url.js`
verwendet diesen Pfad auch für Daten, Bilder und Downloads. `.env.pages`
enthält die öffentliche GitHub-Pages-Adresse für die Metadaten.

`npm run build` verwendet weiterhin den Wurzelpfad und die in `.env`
konfigurierte Sites-Adresse. Die beiden Umgebungsdateien enthalten ausschließlich
öffentliche Website-Adressen, keine Zugangsdaten.

Die Datenquellen und Bildnachweise sind in der Website unter **Quellen & Lizenz**
und in den einzelnen Detailansichten verlinkt. Spielgrafiken gehören den jeweiligen
Rechteinhabern; es handelt sich um ein inoffizielles Fanprojekt.

## Auffindbarkeit

Die Startseite wird beim Build bereits als HTML mit Projektbeschreibung und
Bereichslinks ausgegeben. Autorenangaben, strukturierte Daten und Vorschautexte
für geteilte Links werden für die jeweilige Hosting-Adresse erzeugt.

Die öffentliche [Sitemap](https://nayefh.github.io/RuneFactory4SelphiaArchive/sitemap.xml)
enthält die kanonische Startseite. Sie kann nach Bestätigung der Website in der
[Google Search Console](https://search.google.com/search-console/) eingereicht
werden. Aufnahme und Platzierung in Suchmaschinen sind nicht garantiert.

GitHub-Themen des Projekts: `rune-factory-4`, `rune-factory`, `rf4`, `game-database`,
`crafting`, `recipes`, `bestiary`, `german`, `github-pages`.
