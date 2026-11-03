import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {localizeHtml} from '../lib/i18n.mjs';
test('every module has a real screenshot in both languages and English copy is localized',async()=>{
 const modules=JSON.parse(await readFile(new URL('../dist/assets/modules.json',import.meta.url),'utf8'));
 assert.equal(modules.length,6);
 for(const module of modules){
  for(const lang of ['de','en']) await access(new URL(`../dist/assets/current/${module.id}-${lang}.png`,import.meta.url));
  assert.match(localizeHtml(`<p>${module.de.description}</p>`,'en'),new RegExp(module.en.description.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 }
 const source=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
 const english=localizeHtml(source,'en');
 assert.match(english,/assets\/current\/menu-en.png/);
 assert.doesNotMatch(english,/assets\/current\/menu-de.png/);
 for(const arena of ['galaxy','colloseum','japan']) await access(new URL(`../dist/assets/maps/${arena}.png`,import.meta.url));
});
