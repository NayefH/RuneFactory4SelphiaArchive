import test from "node:test";
import assert from "node:assert/strict";
import { resolvePublicPath } from "../src/public-url.js";

test("public file URLs work at the root and under a GitHub Pages project path", () => {
  for (const base of ["/", "/RuneFactory4SelphiaArchive/"]) {
    for (const file of [
      "data.json",
      "design/rf4-home.png",
      "images/icon.png",
    ]) {
      assert.equal(resolvePublicPath(file, base), base + file);
      assert.equal(resolvePublicPath("/" + file, base), base + file);
    }
    assert.equal(resolvePublicPath("", base), base);
  }
});
