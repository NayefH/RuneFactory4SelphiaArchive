import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";
const targets = JSON.parse(
  execFileSync(
    "curl.exe",
    ["--noproxy", "*", "-s", "http://127.0.0.1:9223/json"],
    { encoding: "utf8" },
  ),
);
const target = targets.find((t) => t.type === "page");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});
let id = 0;
const pending = new Map(),
  errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    m.error ? p.reject(m.error) : p.resolve(m.result);
  }
  if (m.method === "Runtime.exceptionThrown")
    errors.push(m.params.exceptionDetails.text);
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const i = ++id;
    pending.set(i, { resolve, reject });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
};
const wait = async (expression) => {
  for (let i = 0; i < 80; i++) {
    if (await evaluate(expression)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error("Timeout: " + expression);
};
const check = async (name, expression) => {
  assert.ok(await evaluate(expression), name);
  console.log("PASS " + name);
};
await evaluate("try{localStorage.removeItem('rf4-saved')}catch{}");
try {
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url: "http://127.0.0.1:5175/" });
  await wait(
    "document.querySelector('#home h1') && !document.querySelector('#home').hidden",
  );
  await wait(
    "document.querySelector('.home-banner').complete && document.querySelector('.home-banner').naturalWidth>0",
  );
  await check(
    "homepage and RF4 artwork",
    "document.querySelector('#directory').hidden && document.querySelector('.nav[data-tab=home]').getAttribute('aria-pressed')==='true'",
  );
  mkdirSync("qa", { recursive: true });
  let homeShot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync("qa/home-desktop.png", Buffer.from(homeShot.data, "base64"));
  for (const width of [320, 390, 580, 768, 820, 1024, 1440]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 800,
    });
    await check(
      `homepage at ${width}px`,
      "document.documentElement.scrollWidth<=innerWidth && [...document.querySelectorAll('.home-card,.home-search input,.home-search select')].every(e=>e.getBoundingClientRect().right<=innerWidth)",
    );
    if (width === 390) {
      homeShot = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync("qa/home-mobile.png", Buffer.from(homeShot.data, "base64"));
    }
  }
  await evaluate(
    "document.querySelector('#home-scope').value='monster';document.querySelector('#home-query').value='Wooly';document.querySelector('#home-search-form').requestSubmit()",
  );
  await check(
    "homepage scoped search",
    "!document.querySelector('#directory').hidden && document.querySelector('#breadcrumb').textContent==='Bestiarium' && document.querySelector('#results').textContent.includes('Wooly')",
  );
  await evaluate(
    "document.querySelector('.nav[data-tab=home]').click();document.querySelector('.home-card[data-tab=item]').click()",
  );
  await wait("document.querySelectorAll('.result-row').length===30");
  await check(
    "initial data and German page",
    "document.documentElement.lang==='de' && document.querySelector('#count-monster').textContent==='178'",
  );
  await evaluate(
    "document.querySelector('#search').value='Eisen';document.querySelector('#search').dispatchEvent(new Event('input'))",
  );
  await check(
    "German search finds Iron",
    "document.querySelector('#results').textContent.includes('Iron')",
  );
  await evaluate(
    "document.querySelector('[data-tab=recipe]').click();document.querySelector('#search').value='Iron Shield';document.querySelector('#search').dispatchEvent(new Event('input'))",
  );
  await check(
    "recipe search",
    "document.querySelectorAll('.result-row').length===1",
  );
  await evaluate("document.querySelector('.entry').click()");
  await check(
    "ingredient quantity and modal",
    "document.querySelector('#detail').open && document.querySelector('#detail').textContent.includes('2 × Iron')",
  );
  await evaluate("document.querySelector('.ingredient').click()");
  await check(
    "material reverse links",
    "document.querySelector('#detail h2').textContent==='Iron' && document.querySelector('#detail').textContent.includes('Verwendet für')",
  );
  await evaluate(
    "document.querySelector('.close').click();document.querySelector('.favorite').click();document.querySelector('[data-tab=saved]').click();document.querySelector('[data-reset]').click();",
  );
  await check(
    "saved entries",
    "document.querySelectorAll('.result-row').length===1",
  );
  await send("Page.reload");
  await new Promise((r) => setTimeout(r, 500));
  await wait("document.querySelectorAll('.result-row').length===1");
  await check(
    "favorites persist after reload",
    "document.querySelector('#breadcrumb').textContent==='Merkliste'",
  );
  await evaluate(
    "document.querySelector('[data-tab=recipe]').click();document.querySelector('#max').value=5;document.querySelector('#max').dispatchEvent(new Event('change'))",
  );
  await check(
    "recipe level filter",
    "[...document.querySelectorAll('.category-cell small b')].every(x=>Number(x.textContent.replace('Lv. ',''))<=5)",
  );
  await evaluate(
    "document.querySelector('[data-reset]').click();document.querySelector('#station').value='Chemie-Set';document.querySelector('#station').dispatchEvent(new Event('change'))",
  );
  await check(
    "station filter",
    "(async()=>{const data=await(await fetch('/data.json')).json();return document.querySelector('#result-count').textContent.includes(String(data.recipes.filter(r=>r.station==='Chemie-Set').length))})()",
  );
  await evaluate(
    "document.querySelector('[data-tab=monster]').click();document.querySelector('#search').value='Ambrosia';document.querySelector('#search').dispatchEvent(new Event('input'));document.querySelector('.entry').click()",
  );
  await check(
    "monster details",
    "document.querySelector('#detail').textContent.includes('Ultra Toyherb') && document.querySelector('#detail').textContent.includes('Yokmir Forest')",
  );
  await evaluate(
    "document.querySelector('.close').click();document.querySelector('.nav[data-tab=recipe]').click();document.querySelector('[data-reset]').click();document.querySelector('#search').value='Rune Prana 4F';document.querySelector('#search').dispatchEvent(new Event('input'))",
  );
  await check(
    "recipe location is searchable and visible",
    "document.querySelector('#results').textContent.includes('Pineapple Juice') && document.querySelector('.recipe-location').textContent.includes('4F/A2')",
  );
  await evaluate("document.querySelector('.entry').click()");
  await check(
    "recipe directions and linked source",
    "document.querySelector('.acquisition-list').textContent.includes('Rune Prana 4F/A2') && document.querySelector('.acquisition-source').href.includes('Rune_Prana#Fourth_Floor')",
  );
  await evaluate(
    "document.querySelector('.close').click();document.querySelector('.nav[data-tab=item]').click();document.querySelector('#search').value='Miracle Axe';document.querySelector('#search').dispatchEvent(new Event('input'));document.querySelector('.entry').click()",
  );
  await check(
    "both documented recipe locations on item details",
    "document.querySelector('.acquisition-list').textContent.includes('Field 1/B1') && document.querySelector('.acquisition-list').textContent.includes('East/C6')",
  );
  await evaluate(
    "document.querySelector('.close').click();document.querySelector('[data-tab=item]').click();document.querySelector('[data-reset]').click()",
  );
  await check(
    "desktop no horizontal overflow",
    "document.documentElement.scrollWidth<=innerWidth",
  );
  mkdirSync("qa", { recursive: true });
  let shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync("qa/desktop.png", Buffer.from(shot.data, "base64"));
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await check(
    "mobile no horizontal overflow",
    "document.documentElement.scrollWidth<=innerWidth",
  );
  await check(
    "larger mobile text and images",
    "parseFloat(getComputedStyle(document.querySelector('.entry-name strong')).fontSize)>=22 && document.querySelector('.item-icon').getBoundingClientRect().width>=96 && getComputedStyle(document.querySelector('.info-cell')).display!=='none'",
  );
  shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync("qa/mobile.png", Buffer.from(shot.data, "base64"));
  for (const width of [320, 360, 580, 650, 768, 800, 820, 1024, 1440]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 800,
    });
    await check(
      `responsive layout at ${width}px`,
      "document.documentElement.scrollWidth<=innerWidth && [...document.querySelectorAll('.entry,.filters select,.attribute-controls select')].every(e=>{const r=e.getBoundingClientRect();return r.width===0 || (r.left>=0 && r.right<=innerWidth)})",
    );
  }
  await evaluate(
    "document.querySelector('#search').value='zzzxunknown';document.querySelector('#search').dispatchEvent(new Event('input'))",
  );
  await check(
    "empty search state",
    "document.querySelector('.empty').textContent.includes('Keine passenden')",
  );
  await evaluate(
    "document.querySelector('[data-reset]').click();document.querySelector('footer [data-sources]').click()",
  );
  await check(
    "sources and translation status",
    "document.querySelector('#detail').open && document.querySelector('#detail').textContent.includes('noch kein deutscher')",
  );
  await evaluate(
    "document.querySelector('.close').click();localStorage.removeItem('rf4-saved')",
  );
  assert.deepEqual(errors, []);
  console.log("PASS no JavaScript runtime errors");
} finally {
  ws.close();
}
