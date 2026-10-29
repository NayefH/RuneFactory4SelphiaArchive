# Selphia Archiv

Ein durchsuchbares Rune-Factory-4-Fanprojekt von Nayef Hajjaj mit Items,
Rezepten, Rezeptfundorten und Bestiarium.

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
