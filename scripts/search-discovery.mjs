import { readFileSync } from "node:fs";
import { createHome } from "../src/home.js";
import { createLayout, navigationLabels } from "../src/layout.js";
import { resolvePublicPath } from "../src/public-url.js";

/** Render useful homepage content before client-side search initializes. */
export function renderHomepage(data, base) {
  const assetUrl = (path = "") => resolvePublicPath(path, base);
  let layout = createLayout(navigationLabels, assetUrl)
    .replace(
      '<section id="home" hidden aria-label="Startseite"></section>',
      `<section id="home" aria-label="Startseite">${createHome(data, assetUrl)}</section>`,
    )
    .replace(
      '<section class="directory" id="directory">',
      '<section class="directory" id="directory" hidden>',
    )
    .replace('<b id="breadcrumb">Items</b>', '<b id="breadcrumb">Start</b>');
  const counts = {
    item: data.records.filter((record) => record.type === "item").length,
    monster: data.records.filter((record) => record.type === "monster").length,
    recipe: data.recipes.length,
    saved: 0,
  };
  for (const [type, count] of Object.entries(counts)) {
    layout = layout.replace(
      `<i id="count-${type}">—</i>`,
      `<i id="count-${type}">${count}</i>`,
    );
  }
  return (
    layout +
    "<noscript><p>Für die Suche, Filter und Detailansichten bitte JavaScript aktivieren.</p></noscript>"
  );
}

export function createSitemap(siteUrl) {
  const location = new URL(siteUrl).href.replace(/\/*$/, "/");
  const escaped = location
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escaped}</loc></url></urlset>\n`;
}

export function searchDiscoveryPlugin(siteUrl) {
  let base;
  return {
    name: "search-discovery",
    apply: "build",
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: "post",
      handler(html) {
        const data = JSON.parse(
          readFileSync(new URL("../public/data.json", import.meta.url), "utf8"),
        );
        const placeholder = '<div id="app"></div>';
        if (!html.includes(placeholder))
          throw new Error("Homepage placeholder is missing");
        return html.replace(
          placeholder,
          () => `<div id="app">${renderHomepage(data, base)}</div>`,
        );
      },
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: createSitemap(siteUrl),
      });
    },
  };
}
