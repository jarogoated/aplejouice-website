import {readFile,writeFile} from 'node:fs/promises';
import {localizeHtml} from '../lib/i18n.mjs';
const source=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
await writeFile(new URL('../dist/index.en.html',import.meta.url),localizeHtml(source,'en','/'));
await writeFile(new URL('../dist/index.html',import.meta.url),localizeHtml(source,'de','/'));
console.log('Built German and English feature pages.');
