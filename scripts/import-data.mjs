import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const base='https://therunefactory.fandom.com/wiki/';
const url=n=>base+encodeURIComponent(n.replaceAll(' ','_'));
const read=n=>readFileSync(new URL('../data-sources/'+n+'.txt',import.meta.url),'utf8');
const lines=(...names)=>{const m=new Map();for(const name of names)for(const l of read(name).split('\n')){const x=l.match(/^L(\d+): ?(.*)$/);if(x)m.set(+x[1],x[2]);}return [...m].sort((a,b)=>a[0]-b[0]);};
const clean=s=>s.replace(/【\d+†Image[^】]*】/g,'').replace(/【\d+†([^†】]+)(?:†[^】]*)?】/g,'$1').trim();
const links=s=>[...s.matchAll(/【\d+†([^†】]+)(?:†[^】]*)?】/g)].map(m=>m[1].trim()).filter(n=>!n.startsWith('Image'));
const records=[], recipes=[];
function recipe(name,level,ingredients,category,station,source,extra={}){if(!name||!ingredients.length)return;recipes.push({id:'r'+recipes.length,name,level:+level,ingredients,category,station,source,...extra});}
let category='Accessoires';
const cats={Accessories:'Accessoires',Shields:'Schilde',Headgear:'Kopfbedeckungen',Shoes:'Schuhe',Armor:'Rüstungen'};
for(const [n,l] of lines('craft600','craftEnd')){if(n<578||n>759)continue;const h=l.match(/^### (.*?)\[\]/);if(h)category=cats[h[1]]||h[1];const t=clean(l);const m=t.match(/^(.+?)\s{2,}(\d+)\s{2,}(.+)$/);if(m&&/Image/.test(l)){const ingredients=m[3].replace(/(】)/g,'$1 ').split(/\s{2,}/).map(s=>s.trim()).filter(Boolean); // Linked adjacent categories need explicit boundaries.
const raw=l.replace(/【\d+†Image[^】]*】/g,'');const first=raw.match(/【\d+†[^】]*】\s+(\d+)\s+/);const tail=first?raw.slice(first.index+first[0].length):'';
const parts=tail.replace(/【\d+†([^†】]+)(?:†[^】]*)?】/g,'|$1|').split('|').map(s=>s.trim()).filter(Boolean);
recipe(m[1],m[2],parts.length?parts:ingredients,category,'Fertigungstisch',url('Crafting (RF4)'));}}
const stations={Simple:'Ohne Gerät','Frying Pan':'Bratpfanne',Pot:'Topf',Steamer:'Dampfgarer',Knife:'Messer',Mixer:'Mixer',Oven:'Ofen'};let station='Ohne Gerät';
const cookingLines=lines('cookStart','cook','cookEnd');
for(let idx=0;idx<cookingLines.length;idx++){let [n,l]=cookingLines[idx];if(n<586||n>779)continue;const h=l.match(/^## (.*?)\[\]/);if(h)station=stations[h[1]]||h[1];if(/Image/.test(l))for(let j=idx+1;j<cookingLines.length&&!/Image|^##/.test(cookingLines[j][1]);j++)l+=' '+cookingLines[j][1];const raw=l.replace(/【\d+†Image[^】]*】/g,'');const first=raw.match(/^\s*【\d+†([^】]+)】\s*(.*)$/);if(!first)continue;const m=first[2].match(/^(.*?)\b(\d{1,2})\s+(\d[\d,]*)G\s+(.*)$/);if(!m)continue;
let ingredients=links(m[4]);ingredients=ingredients.filter(x=>!/^\([ML]\)$/.test(x)).map(x=>x.replace(/^(Milk|Egg) \(S\)$/,'$1 (beliebige Größe)'));if(first[1]==='Stew')ingredients=ingredients.map(x=>x.startsWith('Milk')?'Milk (M)':x);if(first[1]==='Donuts')ingredients=ingredients.map(x=>x.startsWith('Egg')?'Egg (M)':x);
recipe(first[1].trim(),m[2],ingredients,'Kochen',station,url('Cooking (RF4)'),{effects:m[1].replace('[Effects]','').trim(),sell:+m[3].replaceAll(',','')});}
let section='Kurzschwerter';const sections={'Short Swords':'Kurzschwerter','Long Swords':'Langschwerter',Spears:'Speere',Hammers:'Hämmer',Axes:'Äxte','Dual Blades':'Doppelklingen',Gloves:'Handschuhe',Staves:'Stäbe',Hoe:'Hacken',Waterpot:'Gießkannen',Sickle:'Sicheln',Axe:'Äxte (Werkzeug)',Hammer:'Hämmer (Werkzeug)','Fishing Pole':'Angeln'};
const fl=lines('forgeStart','forgeA','forgeMid','forgeB');
for(let i=0;i<fl.length;i++){const [n,l]=fl[i];if(n<599||n>1014)continue;const h=l.match(/^### (.*?)\[\]/);if(h)section=sections[h[1]]||h[1];if(!/【\d+†Image/.test(l))continue;let raw=l.replace(/【\d+†Image[^】]*】/g,'');const first=raw.match(/^\s*【\d+†([^】]+)】\s+(\d+)\s+(.*)$/);if(!first)continue;let tail=first[3];for(let j=i+1;j<fl.length&&fl[j][0]<n+5&&!/Image|^###|^##|^Item|^A listing/.test(fl[j][1]);j++){tail+=' '+fl[j][1];}
const ingredients=links(tail);const extra=clean(tail).match(/(?:^|\s)(Feathers|Shells and Bones)(?:$|\s)/);if(extra)ingredients.push(extra[1]);const effect=clean(tail.split(/【/)[0]).replaceAll('[Ability]','').replaceAll('[Atr]','').trim();
recipe(first[1],first[2],ingredients,section,'Schmiede',url('Forging (RF4)'),{effects:effect});}
const pharm=read('pharmSearch').split('--------------------------------------------------------------------------------')[1]||'';
for(const l of pharm.split('\n')){const c=l.split('|').map(s=>s.trim());if(c.length>3&&/^\d+$/.test(c[2]))recipe(c[1],c[2],c.slice(3).filter(Boolean),'Alchemie','Chemie-Set',url('Pharmacy (RF4)'));}
const monsterLines=lines('monsterStart','monsters');
for(let i=0;i<monsterLines.length;i++){let [n,l]=monsterLines[i];if(n<792||n>974)continue;if(n===900)continue;if(n===899)l+=' '+monsterLines.find(x=>x[0]===900)?.[1];let raw=l.replace(/【\d+†Image[^】]*】/g,'').replace(/Recipe Bread\+\s+(?=【|Not tameable)/g,'Recipe Bread+  ');const first=raw.match(/^\s*【\d+†([^】]+)】\s*(.*)$/);if(!first){if(n===953)records.push({id:'m'+records.length,name:'Soldier',type:'monster',category:'Gegner',location:'WIP',drops:[],favorite:'WIP',produce:'WIP',source:url('Monsters (RF4)')});continue;}const cols=clean(first[2]).split(/\s{2,}/).map(s=>s.trim());if(cols.length<3)continue;records.push({id:'m'+records.length,name:first[1],type:'monster',category:'Gegner',location:cols[0],drops:(cols[1]||'').split(/,\s*/).filter(Boolean),favorite:cols[2]||'Unbekannt',produce:cols.slice(3).join(' ')||'Unbekannt',source:url('Monsters (RF4)')});}
const itemMap=new Map();const item=(name,props={})=>{if(!name||/^(WIP|N\/A|ー|Not tameable|Not Tameable|Unbekannt|See )/i.test(name))return;const key=name.toLowerCase();if(!itemMap.has(key))itemMap.set(key,{id:'i'+itemMap.size,name,type:'item',category:'Material / Zutat',source:url(name)});Object.assign(itemMap.get(key),props);};
for(const r of recipes){item(r.name,{category:r.category,source:r.source,...(r.effects?{effects:r.effects}:{}),...(r.sell!=null?{sell:r.sell}:{})});for(const ing of r.ingredients)item(ing);}
for(const m of records){for(const drop of m.drops)item(drop);for(const p of m.produce.split(/,\s*/))item(p);}
let group='Materialien';
for(const [n,l] of lines('otherStart','other')){if(n<560||n>785)continue;const h=l.match(/^### (.*?)\[\]/);if(h)group=h[1];if(!/Image/.test(l))continue;const cols=clean(l).split(/\s{2,}/);if(cols.length>=6&&/^(\d+|N\/A)$/.test(cols[1])&&/^\d+$/.test(cols[2]))item(cols[0],{category:group,difficulty:cols[1],rarity:+cols[2],effects:cols[3],sell:cols[4],buy:cols[5],location:cols[6]||'',source:url('Other Items (RF4)')});}
const aliases={'Minerals':'Erze','Cloths and Skins':'Stoffe und Häute','Furs':'Felle','Strings':'Fäden','Claws and Fangs':'Klauen und Zähne','Powders and Spores':'Pulver und Sporen','Sticks and Stems':'Stöcke und Stängel','Crystals':'Kristalle','Jewels':'Edelsteine','Liquids':'Flüssigkeiten','Feathers':'Federn','Scales':'Schuppen','Shells and Bones':'Panzer und Knochen','Shards':'Scherben'};
const shippingLines=lines('shipping','ship850','ship990','ship1080','ship1300','ship1430','ship1520','ship1740');
let shippingGroup='Items',priceOrder=['sell','buy'];
const shippingNames=[];
for(let idx=0;idx<shippingLines.length;idx++){let [n,l]=shippingLines[idx];if(n<596||n>1870)continue;const heading=l.match(/^#{2,5} (.*?)\[\]/);if(heading){shippingGroup=heading[1].replace('Collectible: ','');continue;}if(/^Name\s+Buy\s+Sell/.test(l))priceOrder=['buy','sell'];if(/^Name\s+Sell\s+Buy/.test(l))priceOrder=['sell','buy'];if(!/【\d+†Image/.test(l))continue;
// Some food rows carry a cooking method before the image, not part of the name.
l=l.slice(l.indexOf('【',l.indexOf('Image')-8));
const imageAt=l.search(/【\d+†Image/);if(imageAt>=0)l=l.slice(imageAt);
let t=clean(l);let m=t.match(/^(.+?)\s{2,}([\d,]+G?|N\/A|---|ー)\s{2,}([\d,]+G?|N\/A|---|ー)(?:\s{2,}|$)/);
if(!m){const next=shippingLines[idx+1];if(next&&next[0]===n+1){t+='  '+clean(next[1]);m=t.match(/^(.+?)\s{2,}([\d,]+G?|N\/A|---|ー)\s{2,}([\d,]+G?|N\/A|---|ー)(?:\s{2,}|$)/);}}
if(!m)continue;const name=m[1].trim();if(name.length>45)continue;shippingNames.push(name);const old=itemMap.get(name.toLowerCase());const props={priceSource:url('Shipping List (RF4)'),[priceOrder[0]]:m[2].replaceAll(',','').replace(/G$/,''),[priceOrder[1]]:m[3].replaceAll(',','').replace(/G$/,'')};if(!old||old.category==='Material / Zutat'){props.category=shippingGroup;props.source=url('Shipping List (RF4)');}item(name,props);}
// Material categories are recipe selectors, not standalone collectible items.
for(const [name,label] of Object.entries(aliases)){const r=itemMap.get(name.toLowerCase());if(r){r.category='Materialgruppen';r.groupLabel=label;}}
// Search helpers are intentionally distinct from verified localization names.
const german={'Iron':'Eisen','Bronze':'Bronze','Silver':'Silber','Gold':'Gold','Platinum':'Platin','Orichalcum':'Orichalkum','Turnip':'Rübe','Pink Turnip':'Rosa Rübe','Spinach':'Spinat','Rice':'Reis','Flour':'Mehl','Apple':'Apfel','Orange':'Orange','Potato':'Kartoffel','Tomato':'Tomate','Cucumber':'Gurke','Carrot':'Karotte','Eggplant':'Aubergine','Strawberry':'Erdbeere','Honey':'Honig','Bread':'Brot','Cheese':'Käse','Milk (beliebige Größe)':'Milch (beliebige Größe)','Egg (beliebige Größe)':'Ei (beliebige Größe)','Wooly':'Wolli','Pickled Turnip':'Saure Rübe',...aliases};
const report='https://n-switch-on.de/2020/tests/rune-factory-4-special-fantasy-farming-deluxe/';
const reported=new Set(['Iron','Bronze','Spinach','Turnip','Rice','Flour','Pickled Turnip']);
const all=[...itemMap.values(),...records];for(const r of all){if(german[r.name]){r.de=german[r.name];r.translationStatus=reported.has(r.name)?'Spielbericht · offiziell unbestätigt':'Suchhilfe · offiziell unbestätigt';if(reported.has(r.name))r.translationSource=report;}}
const data={game:'Rune Factory 4',retrieved:'2026-10-29',records:all,recipes,materialGroups:aliases,coverage:'Import aus den RF4-Wiki-Tabellen für Herstellung, Schmieden, Kochen, Alchemie, Gegner und Materialien. Kein vollständiger Import aller einzelnen Item- und Gegnerseiten. Kampfwerte von Gegnern und manche Itemwerte fehlen. Deutsche Suchhilfen sind keine verifizierten offiziellen Namen.'};
mkdirSync(new URL('../public/',import.meta.url),{recursive:true});writeFileSync(new URL('../public/data.json',import.meta.url),JSON.stringify(data,null,2));console.log(JSON.stringify({items:itemMap.size,monsters:records.length,recipes:recipes.length}));
