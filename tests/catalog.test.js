import test from 'node:test';
import assert from 'node:assert/strict';
import {createCatalog,recipeUsesItem} from '../src/catalog.js';
import {loadFavorites,saveFavorites} from '../src/favorites.js';

const items=[
 {id:'iron',name:'Iron',de:'Eisen',type:'item',category:'Minerals',attributes:{upgrade:{DEF:1},base:{DEF:90}}},
 {id:'silver',name:'Silver',type:'item',category:'Minerals',attributes:{upgrade:{DEF:7}}},
 {id:'unknown',name:'Unknown',type:'item',category:'Minerals',attributes:{}},
 {id:'negative',name:'Scrap',type:'item',category:'Minerals',attributes:{upgrade:{DEF:-2}}},
 {id:'zero',name:'Zero',type:'item',category:'Minerals',attributes:{upgrade:{DEF:0}}},
 {id:'milk',name:'Milk (M)',type:'item',category:'Dairy'},
];
const recipe={id:'dish',name:'Stew',station:'Topf',category:'Kochen',level:87,ingredients:['Milk (S) / Milk (M)'],ingredientSlots:[{options:['Milk (S)','Milk (M)']} ]};
const catalog=createCatalog({records:items,recipes:[recipe],materialGroups:{Minerals:'Erze'}});
const filters={tab:'item',query:'',category:'',station:'',maxRecipeLevel:99,sort:'name',attributeContext:'upgrade',attribute:'DEF'};
test('attribute ranking separates upgrade values from equipment values and excludes unknowns',()=>{
 assert.deepEqual(catalog.select({...filters,sort:'bonus-desc'},new Set()).map(r=>r.id),['silver','iron','zero','negative']);
 assert.deepEqual(catalog.select({...filters,sort:'bonus-asc'},new Set()).map(r=>r.id),['negative','zero','iron','silver']);
});
test('German name and translated material category are searchable',()=>{
 assert.equal(catalog.select({...filters,query:'eisen'},new Set())[0].id,'iron');
 assert.equal(catalog.select({...filters,query:'erze'},new Set()).length,5);
});
test('recipe options support reverse material lookup',()=>{
 assert.equal(recipeUsesItem(recipe,'Milk (M)'),true);
 assert.equal(recipeUsesItem(recipe,'Milk (L)'),false);
});
test('level and station constraints apply to recipe results',()=>{
 assert.equal(catalog.select({...filters,tab:'recipe',maxRecipeLevel:86},new Set()).length,0);
 assert.equal(catalog.select({...filters,tab:'recipe',station:'Topf'},new Set()).length,1);
});
test('corrupt and unavailable local storage degrade safely',()=>{
 assert.deepEqual([...loadFavorites({getItem:()=>'{broken'})],[]);
 assert.deepEqual([...loadFavorites({getItem:()=>'{"unexpected":true}'})],[]);
 assert.equal(saveFavorites(new Set(['iron']),{setItem:()=>{throw new Error('storage disabled');}}),false);
});
