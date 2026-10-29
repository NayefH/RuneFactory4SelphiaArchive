import test from "node:test";
import assert from "node:assert/strict";
import { createSitemap, renderHomepage } from "../scripts/search-discovery.mjs";

const data = {
  records: [
    { type: "item", name: "Turnip", image: "/images/turnip.png" },
    { type: "item", name: "Cooking Bread", image: "/images/bread.png" },
    { type: "monster", name: "Wooly", image: "/images/wooly.png" },
  ],
  recipes: [{ name: "Bread" }],
};

test("pre-rendered homepage exposes project content and real links under the deployment path", () => {
  for (const base of ["/", "/RuneFactory4SelphiaArchive/"]) {
    const html = renderHomepage(data, base);
    assert.ok(html.includes('<section id="home" aria-label="Startseite">'));
    assert.ok(
      html.includes('<section class="directory" id="directory" hidden>'),
    );
    assert.ok(html.includes("Dein Rune Factory 4 Archiv."));
    assert.ok(html.includes("Nayef Hajjaj"));
    assert.ok(html.includes(`href="${base}?tab=recipe"`));
    assert.ok(html.includes(`src="${base}images/wooly.png"`));
    assert.ok(html.includes('<i id="count-item">2</i>'));
    assert.ok(html.includes("<noscript>"));
  }
});

test("sitemap includes only the canonical deployment homepage", () => {
  const site = "https://nayefh.github.io/RuneFactory4SelphiaArchive";
  const xml = createSitemap(site);
  assert.ok(xml.includes(`<loc>${site}/</loc>`));
  assert.equal((xml.match(/<url>/g) || []).length, 1);
  assert.ok(!xml.includes("?tab="));
});
