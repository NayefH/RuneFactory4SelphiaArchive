import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const base = process.env.RF4_QA_URL || "http://127.0.0.1:5175/";
const targets = JSON.parse(
  execFileSync(
    "curl.exe",
    ["--noproxy", "*", "-s", "http://127.0.0.1:9224/json"],
    { encoding: "utf8" },
  ),
);
const target = targets.find((entry) => entry.type === "page");
assert.ok(target, "A Chrome debugging page is available");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});
let sequence = 0;
const pending = new Map();
const exceptions = [];
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const promise = pending.get(message.id);
    pending.delete(message.id);
    message.error
      ? promise.reject(message.error)
      : promise.resolve(message.result);
  }
  if (message.method === "Runtime.exceptionThrown")
    exceptions.push(message.params.exceptionDetails);
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails)
    throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const wait = async (expression) => {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if (await evaluate(expression)) return;
    } catch (error) {
      // A navigation briefly destroys the previous JavaScript context.
      const message = error.message || JSON.stringify(error);
      if (
        !/context.*destroyed|Cannot find context|target navigated/i.test(
          message,
        )
      )
        throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw Error("Timed out: " + expression);
};
const check = async (name, expression) => {
  assert.ok(await evaluate(expression), name);
  console.log("PASS " + name);
};
const language = (selected) =>
  evaluate(
    `document.querySelector('#language-switch').value=${JSON.stringify(selected)};document.querySelector('#language-switch').dispatchEvent(new Event('change',{bubbles:true}))`,
  );
const click = (selector) =>
  evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const search = (query) =>
  evaluate(
    `document.querySelector('#search').value=${JSON.stringify(query)};document.querySelector('#search').dispatchEvent(new Event('input',{bubbles:true}))`,
  );
const dataReady =
  "document.querySelector('#count-item')?.textContent.match(/1[.,]089/) && document.querySelector('#home h1')";
let navigation = 0;
const navigate = async (query = "", readyExpression = dataReady) => {
  const token = `navigation-${++navigation}`;
  await evaluate(`window.__rf4QaNavigationToken=${JSON.stringify(token)}`);
  await send("Page.navigate", { url: base + query });
  await wait(
    `window.__rf4QaNavigationToken!==${JSON.stringify(token)} && document.readyState==='complete' && (${readyExpression})`,
  );
};
const viewport = (width) =>
  send("Emulation.setDeviceMetricsOverride", {
    width,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: width < 800,
  });
const screenshot = async (name) => {
  await evaluate(
    "document.fonts.ready.then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))",
  );
  mkdirSync("qa", { recursive: true });
  const result = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`qa/${name}.png`, Buffer.from(result.data, "base64"));
};

try {
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Network.enable");
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await viewport(1440);
  await navigate("?lang=de");
  await evaluate(
    "localStorage.removeItem('rf4-saved');localStorage.removeItem('rf4-language')",
  );
  await navigate();
  await check(
    "default German homepage",
    "document.documentElement.lang==='de' && document.querySelector('#home h1').textContent==='Dein Rune Factory 4 Archiv.'",
  );
  await language("en");
  await check(
    "English chrome, title, metadata and URL",
    "document.documentElement.lang==='en' && document.title.includes('Database') && document.querySelector('meta[name=description]').content.includes('search Rune Factory 4') && new URLSearchParams(location.search).get('lang')==='en' && document.querySelector('.nav[data-tab=recipe]').textContent.includes('Recipes')",
  );
  await check(
    "English home text and accessibility",
    "document.querySelector('#home h1').textContent==='Your Rune Factory 4 archive.' && document.querySelector('#home-scope').getAttribute('aria-label')==='Search section' && !document.querySelector('footer').textContent.includes('Suchhilfen')",
  );
  await screenshot("language-en-desktop");
  await navigate();
  await check(
    "English preference persists on a clean URL",
    "document.documentElement.lang==='en' && document.querySelector('#language-switch').value==='en'",
  );
  await navigate("?lang=de");
  await check(
    "explicit German URL overrides stored English",
    "document.documentElement.lang==='de'",
  );
  await click('[data-tab="item"]');
  await search("Eisen");
  await check(
    "German data names and bilingual search",
    "document.querySelector('#results').textContent.includes('Eisen') && document.querySelector('#results').textContent.includes('Iron')",
  );
  await language("en");
  await check(
    "search and selected tab survive switching",
    "document.querySelector('#search').value==='Eisen' && document.querySelector('#section-title').textContent==='Items & Materials' && document.querySelector('#results').textContent.includes('Iron') && !document.querySelector('#results').textContent.includes('DE*')",
  );
  await click(".favorite");
  await check(
    "English favorite toast",
    "document.querySelector('#toast').textContent==='Added to your favorites'",
  );
  await language("de");
  await click('[data-tab="saved"]');
  await check(
    "favorite retained across switch",
    "document.querySelector('.favorite').getAttribute('aria-pressed')==='true'",
  );
  await click(".favorite");
  await check(
    "German favorite toast",
    "document.querySelector('#toast').textContent==='Aus deiner Merkliste entfernt'",
  );
  await click('[data-tab="recipe"]');
  await search("Iron Shield");
  await click(".entry");
  await check(
    "German recipe and ingredient data",
    "document.querySelector('#detail').open && document.querySelector('#detail h2').textContent==='Eisenschild' && document.querySelector('#detail').textContent.includes('2 × Eisen')",
  );
  await language("en");
  await check(
    "open modal translates in place",
    "document.querySelector('#detail').open && document.querySelector('#detail h2').textContent==='Iron Shield' && document.querySelector('#detail').textContent.includes('2 × Iron') && document.querySelector('.close').getAttribute('aria-label')==='Close details'",
  );
  await click(".ingredient");
  await check(
    "ingredient links still resolve",
    "document.querySelector('#detail h2').textContent==='Iron' && document.querySelector('#detail').textContent.includes('Used for')",
  );
  await click(".close");
  await click("[data-sources]");
  await check(
    "English sources and license",
    "document.querySelector('#detail').textContent.includes('Sources & data') && document.querySelector('#detail').textContent.includes('License') && !document.querySelector('#detail').textContent.includes('Vollständigkeitsprüfung')",
  );
  await language("de");
  await check(
    "open source modal translates",
    "document.querySelector('#detail').open && document.querySelector('#detail').textContent.includes('Quellen & Datenstand')",
  );
  await click(".close");
  await click('[data-tab="recipe"]');
  await search("");
  await evaluate(
    "document.querySelector('#station').value='Topf';document.querySelector('#station').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#max').value='80';document.querySelector('#max').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#sort').value='level';document.querySelector('#sort').dispatchEvent(new Event('change',{bubbles:true}))",
  );
  await language("en");
  await check(
    "translated station keeps raw filter and recipe settings",
    "document.querySelector('#station').value==='Topf' && document.querySelector('#station').selectedOptions[0].textContent==='Pot' && document.querySelector('#max').value==='80' && document.querySelector('#sort').value==='level' && document.querySelectorAll('.result-row').length>0",
  );
  await click('[data-tab="item"]');
  await search("");
  await click('[data-page="2"]');
  await language("de");
  await check(
    "pagination survives language switch",
    "document.querySelector('#pagination').textContent.includes('Seite 2 /')",
  );
  for (const selected of ["de", "en"]) {
    await language(selected);
    await click('[data-tab="home"]');
    await evaluate("window.scrollTo(0,0)");
    await check(
      `${selected} preparation box removed`,
      "!document.querySelector('.home-guide') && !document.querySelector('#home').textContent.includes('GUT VORBEREITET') && !document.querySelector('#home').textContent.includes('GET READY FOR SELPHIA')",
    );
    for (const tab of ["item", "recipe", "monster"]) {
      await click(`#home [data-tab="${tab}"]`);
      await check(
        `${selected} ${tab} category opens its directory`,
        `!document.querySelector('#directory').hidden && document.querySelector('#home').hidden && document.querySelector('.nav[data-tab="${tab}"]').getAttribute('aria-pressed')==='true' && new URLSearchParams(location.search).get('tab')===${JSON.stringify(tab)}`,
      );
      await click('.nav[data-tab="home"]');
    }
    for (const width of [320, 390, 580, 768, 1024, 1440]) {
      await viewport(width);
      await check(
        `${selected} mobile layout ${width}px`,
        "document.documentElement.scrollWidth<=innerWidth && document.querySelector('#language-switch').getBoundingClientRect().width>0 && document.querySelector('#language-switch').getBoundingClientRect().right<=innerWidth && document.querySelector('#language-switch').getBoundingClientRect().left>=0 && [...document.querySelectorAll('#home [data-tab],.home-search input,.home-search select')].every(element=>{const rect=element.getBoundingClientRect();return rect.width===0 || (rect.left>=0 && rect.right<=innerWidth)})",
      );
      if (selected === "en" && width === 390)
        await screenshot("language-en-mobile");
      if (selected === "de" && width === 390)
        await screenshot("wiki-home-mobile");
      if (selected === "de" && width === 1440)
        await screenshot("wiki-home-desktop");
    }
    await click('.nav[data-tab="item"]');
    await click("[data-reset]");
    await evaluate("window.scrollTo(0,0)");
    for (const width of [320, 390, 580, 768, 1024, 1440]) {
      await viewport(width);
      await check(
        `${selected} item directory layout ${width}px`,
        "document.documentElement.scrollWidth<=innerWidth && [...document.querySelectorAll('.entry,.filters select,.attribute-controls select,.category-cell,.info-cell,#language-switch')].every(element=>{const rect=element.getBoundingClientRect();return rect.width===0 || (rect.left>=0 && rect.right<=innerWidth)})",
      );
      if (selected === "de" && width === 390)
        await screenshot("wiki-items-mobile");
      if (selected === "de" && width === 1440)
        await screenshot("wiki-items-desktop");
    }
    await viewport(390);
    await search("Unbroken Ivory Tusk");
    await click(".entry");
    await check(
      `${selected} long item details fit mobile`,
      "document.querySelector('#detail').open && document.querySelector('#detail').getBoundingClientRect().left>=0 && document.querySelector('#detail').getBoundingClientRect().right<=innerWidth && document.querySelector('#detail').scrollWidth<=document.querySelector('#detail').clientWidth && document.querySelector('#detail-body').scrollWidth<=document.querySelector('#detail-body').clientWidth",
    );
    await click(".close");
    await click("footer [data-sources]");
    await check(
      `${selected} source details fit mobile`,
      "document.querySelector('#detail').open && document.querySelector('#detail').getBoundingClientRect().left>=0 && document.querySelector('#detail').getBoundingClientRect().right<=innerWidth && document.querySelector('#detail').scrollWidth<=document.querySelector('#detail').clientWidth",
    );
    await click(".close");
  }
  await send("Network.setBlockedURLs", { urls: ["*data.json*"] });
  await navigate(
    "?lang=en",
    "document.querySelector('#results')?.textContent.includes('The archive is currently unavailable.')",
  );
  await language("de");
  await check(
    "load failure switches language",
    "document.querySelector('#results').textContent.includes('Das Archiv ist gerade nicht erreichbar.') && document.querySelector('#total').textContent==='Daten nicht verfügbar'",
  );
  await send("Network.setBlockedURLs", { urls: [] });
  await navigate("?lang=en");
  assert.deepEqual(exceptions, [], "No uncaught runtime errors");
  console.log("PASS no uncaught runtime errors");
} finally {
  await send("Network.setBlockedURLs", { urls: [] });
  ws.close();
}
