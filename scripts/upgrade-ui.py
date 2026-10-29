from pathlib import Path

p = Path(__file__).resolve().parent.parent / "src/main.js"
s = p.read_text(encoding="utf8")
s = s.replace(
    "import './style.css';",
    "import './style.css';\nimport {contextLabels,attributeLabel,bonus,formatBonus,attributePanel} from './attributes.js';",
)
s = s.replace(
    "let data,tab='item'",
    "let attributeContext='upgrade',attribute='ATK';\nlet data,tab='item'",
)
s = s.replace(
    '<div class="results-heading">',
    '<div class="attribute-controls" id="attribute-controls"><div class="attribute-intro"><b>✦ Boni vergleichen</b><span>Einzelne Attribute wie in der Itemliste sortieren.</span></div><label>Bonusart<select id="attribute-context">'
    + "".join(
        '<option value="' + k + '">' + v + "</option>"
        for k, v in [
            ("upgrade", "Upgrade-Bonus"),
            ("base", "Ausrüstung · Grundwerte"),
            ("consume", "Beim Verzehr"),
            ("cook", "Als Kochzutat"),
        ]
    )
    + '</select></label><label>Attribut<select id="attribute"></select></label><button id="sort-attribute" class="bonus-sort">Höchster Bonus ↓</button></div><div class="results-heading">',
    1,
)
s = s.replace(
    '<option value="level">Rezeptlevel ↑</option>',
    '<option value="level">Rezeptlevel ↑</option><option value="bonus-desc">Attributbonus ↓</option><option value="bonus-asc">Attributbonus ↑</option>',
)
s = s.replace(
    "const icon=r=>",
    'const thumbnail=r=>{const rec=r.station?itemByName(r.name):r;return rec?.image?`<img src="${esc(rec.image)}" alt="${esc(r.name)} (RF4)" loading="lazy" decoding="async">`:icon(r);};\nconst icon=r=>',
)
s = s.replace(
    "r.location,r.station,r.effects,r.favorite",
    "r.location,r.station,r.effects,JSON.stringify(r.attributeText||{}),r.aliases,r.favorite",
)
s = s.replace(
    "function options(){",
    "function updateAttributeOptions(){if(!data)return;const keys=[...new Set(data.records.filter(r=>r.type==='item').flatMap(r=>Object.keys(r.attributes?.[attributeContext]||{})))];const priority=['ATK','DEF','M.ATK','M.DEF','STR','VIT','INT','HP','RP','HP MAX','RP MAX'];keys.sort((a,b)=>(priority.indexOf(a)<0?100:priority.indexOf(a))-(priority.indexOf(b)<0?100:priority.indexOf(b))||a.localeCompare(b));if(!keys.includes(attribute))attribute=keys[0]||'ATK';$('#attribute').innerHTML=keys.map(k=>`<option value=\"${esc(k)}\">${esc(attributeLabel(k))} · ${esc(k)}</option>`).join('');$('#attribute').value=attribute;$('#attribute-context').value=attributeContext;$('#attribute-controls').hidden=!['item','saved'].includes(tab);}\nfunction options(){updateAttributeOptions();",
)
s = s.replace(
    "if(sort!=='name')p.set('sort',sort);",
    "if(sort!=='name')p.set('sort',sort);if(sort.startsWith('bonus')){p.set('context',attributeContext);p.set('attribute',attribute);}",
)
s = s.replace(
    "terms.every(t=>searchable(r).includes(t)))",
    "terms.every(t=>searchable(r).includes(t))&&(!sort.startsWith('bonus')||bonus(r,attributeContext,attribute)!==undefined))",
)
s = s.replace(
    "list.sort((a,b)=>sort==='level'?",
    "list.sort((a,b)=>sort.startsWith('bonus')?((bonus(b,attributeContext,attribute)-bonus(a,attributeContext,attribute))*(sort==='bonus-asc'?-1:1)||a.name.localeCompare(b.name)):sort==='level'?",
)
s = s.replace(
    "const german=r.de||de(r.name);return",
    "const german=r.de||de(r.name);const score=bonus(r,attributeContext,attribute);return",
)
s = s.replace(
    '${icon(r)}</span><span class="entry-name">',
    '${thumbnail(r)}</span><span class="entry-name">',
)
s = s.replace(
    '${esc(info)}</button><button class="favorite',
    '${sort.startsWith(\'bonus\')?`<span class="bonus-value">${esc(formatBonus(score,attribute))}</span><small>${esc(attributeLabel(attribute))} · ${esc(contextLabels[attributeContext])}</small>`:esc(info)}</button><button class="favorite',
)
s = s.replace(
    "function switchTab(t){tab=t;",
    "function switchTab(t){tab=t;if(!['item','saved'].includes(t)&&sort.startsWith('bonus')){sort='name';$('#sort').value='name';}",
)
s = s.replace(
    "function openDetail(id){",
    "function monsterStats(r){return r.stats?`<h3>Kampfwerte</h3><div class=\"attribute-grid\">${Object.entries(r.stats).map(([key,value])=>`<div><span>${esc(key)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>${r.resistances?`<h3>Resistenzen & Status</h3><div class=\"attribute-grid\">${Object.entries(r.resistances).map(([key,value])=>`<div><span>${esc(key)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>`:''}`:'<p class=\"subtle\">Kampfwerte in der zugänglichen RF4-Quelle noch nicht erfasst.</p>';}\nfunction openDetail(id){",
)
s = s.replace(
    '<p class="subtle">HP, Angriff, Verteidigung und Resistenzen sind aus den einzelnen Gegnerseiten noch nicht importiert.</p>',
    "${monsterStats(r)}${r.dropDetails?`<h3>Beute & Dropraten</h3><p>${esc(r.dropDetails)}</p>`:''}",
)
s = s.replace(
    '<span class="detail-icon">${icon(r)}</span>',
    '<span class="detail-icon">${thumbnail(r)}</span>',
)
s = s.replace(
    '${body}<div class="detail-source">',
    '${body}${attributePanel(r.station?itemByName(r.name)||r:r,esc)}${r.sourceConflicts?.length?`<h3>Quellenabweichung</h3><p class="subtle">Die Einzelartikel nennen teilweise andere Materialien:</p>${r.sourceConflicts.map(c=>`<p>${esc(c.ingredients.join(\' · \'))} · <a href="${esc(c.source)}" target="_blank" rel="noreferrer">Quelle ↗</a></p>`).join(\'\')}:\'\'}<div class="detail-source">',
)
s = s.replace("RF4-Quelle im Rune Factory Wiki ↗", "RF4-Datenquelle ↗")
s = s.replace(
    "Datenstand: 29. Oktober 2026 · Fehlende Werte ≠ 0",
    "Datenstand: 29. Oktober 2026 · Fehlende Werte ≠ 0",
)
s = s.replace(
    "if(t.dataset.tab)switchTab",
    "if(t.id==='sort-attribute'){sort='bonus-desc';$('#sort').value=sort;page=1;render();}if(t.dataset.tab)switchTab",
)
s = s.replace(
    "$('#search').addEventListener('input'",
    "$('#attribute-context').addEventListener('change',e=>{attributeContext=e.target.value;updateAttributeOptions();sort='bonus-desc';$('#sort').value=sort;page=1;render();});$('#attribute').addEventListener('change',e=>{attribute=e.target.value;sort='bonus-desc';$('#sort').value=sort;page=1;render();});document.addEventListener('error',e=>{if(e.target.tagName==='IMG'){e.target.replaceWith(document.createTextNode('◇'));}},true);\n$('#search').addEventListener('input'",
)
s = s.replace(
    "['name','name-desc','level'].includes(p.get('sort'))",
    "['name','name-desc','level','bonus-desc','bonus-asc'].includes(p.get('sort'))",
)
s = s.replace(
    "max=Math.max(1,Math.min(99,Number(p.get('max'))||99));options();",
    "max=Math.max(1,Math.min(99,Number(p.get('max'))||99));attributeContext=Object.hasOwn(contextLabels,p.get('context'))?p.get('context'):'upgrade';attribute=p.get('attribute')||'ATK';options();",
)
s = s.replace(
    "Die Spielwerte stammen ausschließlich aus den RF4-Seiten des Rune Factory Wiki.",
    "Die Spielwerte stammen aus den RF4-Seiten des Rune Factory Wiki und der Itemliste von Ranch Story. Die Bilder sind aus den zugehörigen RF4-Einträgen übernommen.",
)
s = s.replace(
    "<h3>Wiki-Quellen</h3>",
    '<h3>Vollständigkeitsprüfung</h3><p>${data.audit?`${data.audit.detailPages} RF4-Einzelseiten ausgewertet · ${data.audit.itemsWithAttributes} Items mit Attributen · ${data.audit.monstersWithStats} Gegner mit Kampfwerten. ${data.audit.conflicts.length} Quellenabweichungen erfasst.`:\'Import läuft.\'}</p><a href="/completeness.json" target="_blank">Prüfbericht mit offenen Einträgen ↗</a><h3>Wiki-Quellen</h3><p><a href="https://ranchstory.miraheze.org/wiki/Item_List_(Rune_Factory_4)" target="_blank" rel="noreferrer">Ranch Story · RF4 Item List & Bilder ↗</a></p>',
)
s = s.replace(
    "Spielinformationen: Rune Factory Wiki und dessen Mitwirkende,",
    "Spielinformationen: Rune Factory Wiki, Ranch Story und deren Mitwirkende. Bilder: zugehörige Wiki-Einträge; Spielgrafiken © Marvelous / XSEED. Wiki-Texte nach jeweiliger Quellenlizenz,",
)
p.write_text(s, encoding="utf8")
