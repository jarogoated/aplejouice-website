import {readFile,writeFile} from 'node:fs/promises';
import {localizeHtml} from '../lib/i18n.mjs';
import {communityPage,siteHeader} from '../lib/community.mjs';
let source=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
source=source.replace(/<header[\s\S]*?<\/header>/,siteHeader(false,'/mod'));
if(!source.includes('/assets/community.css'))source=source.replace('</head>','<link rel="stylesheet" href="/assets/community.css"></head>');
await writeFile(new URL('../dist/index.en.html',import.meta.url),localizeHtml(source,'en','/mod').replace(/<header[\s\S]*?<\/header>/,siteHeader(true,'/mod')));
await writeFile(new URL('../dist/index.html',import.meta.url),localizeHtml(source,'de','/mod'));
const intro=source.slice(source.indexOf('<script>try{'),source.indexOf('<a class="skip"'));
const members=JSON.parse(await readFile(new URL('../data/clan-members.json',import.meta.url),'utf8'));
for(const [kind,name] of [['home','hub'],['clan','clan'],['teams','clan-teams']])for(const en of [false,true]){
 let html=communityPage(kind,en,members);if(kind==='home')html=html.replace('<main ',intro+'<main ');
 await writeFile(new URL('../dist/'+name+(en?'.en':'')+'.html',import.meta.url),html);
}
console.log('Built bilingual hub, clan and mod pages.');
