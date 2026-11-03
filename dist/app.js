const counts = { web: 0, totem: 0, pearl: 0, crystal: 0 };
let round = 1;
document.querySelectorAll('[data-item]').forEach(button => button.addEventListener('click', () => {
  const item = button.dataset.item;
  const counter = document.getElementById(`count-${item}`);
  counter.textContent = ++counts[item];
  counter.classList.remove('bump');
  void counter.offsetWidth;
  counter.classList.add('bump');
  const skin=document.querySelector('.skin-character');skin.classList.remove('item-pulse');void skin.offsetWidth;skin.classList.add('item-pulse');
  const effect=document.getElementById('skin-effect');effect.textContent={web:'✳',totem:'✦',pearl:'●',crystal:'◇'}[item];effect.dataset.item=item;effect.classList.remove('item-burst');void effect.offsetWidth;effect.classList.add('item-burst');
}));
document.getElementById('reset').addEventListener('click', () => {
  Object.keys(counts).forEach(item => { counts[item] = 0; document.getElementById(`count-${item}`).textContent = '0'; });
  document.getElementById('round').textContent = String(++round).padStart(2, '0');
  document.getElementById('skin-effect').textContent='';
});
const english=document.documentElement.lang==='en';
const language=english?'en':'de';
const modules=await (await fetch('assets/modules.json')).json();
const tabs=[...document.querySelectorAll('[data-gui-module]')];
let selectedModule='menu';
function animateChange(element){
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches) element.animate([{opacity:.3,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});
}
function selectModule(tab){
 if(!tab)return;
 selectedModule=tab.dataset.guiModule;
 tabs.forEach(button=>button.setAttribute('aria-pressed',button===tab));
 const module=modules.find(item=>item.id===selectedModule);
 document.getElementById('module-title').textContent=module[language].title;
 document.getElementById('module-description').textContent=module[language].description;
 const image=document.getElementById('menu-shot');image.src=`assets/current/${module.id}-${language}.png`;image.alt=`${module[language].label} · Aplejouice Mod 1.7.0`;
 document.getElementById('screenshot-panel').setAttribute('aria-label',module[language].label);
 document.querySelector('.interface-figure figcaption').textContent=selectedModule==='coordinates'?(english?'Menu capture 1.7.0. Independent axis switches are available in 1.7.1.':'Menüaufnahme 1.7.0. Einzelne Achsenschalter sind ab 1.7.1 verfügbar.'):(english?'Menu capture 1.7.0 · Local test world.':'Menüaufnahme 1.7.0 · Lokale Testwelt.');
 image.onload=()=>animateChange(image);
 animateChange(document.querySelector('.module-description'));
}
tabs.forEach((tab,index)=>{
 tab.addEventListener('click',()=>selectModule(tab));
 tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowDown')next=tabs[(index+1)%tabs.length];if(event.key==='ArrowUp')next=tabs[(index+tabs.length-1)%tabs.length];if(next){event.preventDefault();selectModule(next);next.focus();}});
});
document.querySelectorAll('[data-open-module]').forEach(button=>button.addEventListener('click',()=>selectModule(tabs.find(tab=>tab.dataset.guiModule===button.dataset.openModule))));
const dialog=document.getElementById('screenshot-dialog');
document.querySelector('.shot-open').addEventListener('click',()=>{
 const source=document.getElementById('menu-shot'),large=document.getElementById('large-screenshot');large.src=source.src;large.alt=source.alt;dialog.showModal();
});
document.getElementById('close-screenshot').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
document.querySelector('[data-show-settings]').addEventListener('click',()=>selectModule(tabs.at(-1)));
const positions={X:111.7,Y:47.2,Z:-79.8};
document.querySelectorAll('[data-axis]').forEach(button=>button.addEventListener('click',()=>{
 button.setAttribute('aria-pressed',button.getAttribute('aria-pressed')!=='true');
 const axes=[...document.querySelectorAll('[data-axis][aria-pressed="true"]')].map(item=>item.dataset.axis);
 document.getElementById('coordinate-value').textContent=axes.map(axis=>Math.floor(positions[axis])).join(' ') || '—';
 document.getElementById('copy-coordinates').disabled=axes.length===0;
 document.getElementById('copy-result').textContent=axes.length===0?(english?'Enable at least one axis.':'Aktiviere mindestens eine Achse.'):'';
 document.querySelectorAll('.axis-readout>span').forEach((item,i)=>item.classList.toggle('axis-muted',!axes.includes('XYZ'[i])));
 animateChange(document.getElementById('coordinate-value'));
}));
document.getElementById('copy-coordinates').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(document.getElementById('coordinate-value').textContent);document.getElementById('copy-result').textContent=english?'Copied!':'Kopiert!';}
 catch{document.getElementById('copy-result').textContent=english?'Select and copy the values above.':'Werte oben markieren und kopieren.';}
});
const arenaDetails={
 galaxy:{floor:37,ceiling:54,de:{title:'Ein Stück Welt im All.',facts:['Grüne Hügel und verstreute Bäume','Planeten und schwebende Inseln im Hintergrund','Offene Landschaft mit Höhenunterschieden']},en:{title:'A world among the stars.',facts:['Green hills and scattered trees','Planets and floating islands in the background','Open terrain with changes in elevation']}},
 colloseum:{floor:43,ceiling:60,de:{title:'Sand. Stein. Große Arena.',facts:['Sandboden im Zentrum der Arena','Mehrstöckige Ränge mit hohen Bögen','Helle Sandstein-Optik und große Statuen']},en:{title:'Sand. Stone. A grand arena.',facts:['A sandy arena floor','Multi-level stands with tall arches','Pale sandstone styling and large statues']}},
 japan:{floor:38,ceiling:56,de:{title:'Zwischen Kirschblüten.',facts:['Rosa Kirschbäume in grünem Gelände','Dunkle Felsformationen rund um die Arena','Pagoden, Laternen und Drachen-Dekoration']},en:{title:'Among cherry blossoms.',facts:['Pink cherry trees on green terrain','Dark rock formations around the arena','Pagodas, lanterns and dragon decorations']}}
};
const arenas={galaxy:{name:'Galaxy',biome:'Plains',bounds:'Y 37 — 54'},colloseum:{name:'Colloseum',biome:english?'Desert':'Wüste',bounds:'Y 43 — 60'},japan:{name:'Japan',biome:'Cherry',bounds:'Y 38 — 56'}};
document.querySelectorAll('[data-arena]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-arena]').forEach(item=>item.setAttribute('aria-pressed',item===button));
 animateChange(document.querySelector('.arena-facts'));
 const arena=arenas[button.dataset.arena],details=arenaDetails[button.dataset.arena];
 document.getElementById('arena-fact-title').textContent=details[language].title;
 const list=document.getElementById('arena-fact-list');list.replaceChildren(...details[language].facts.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
 document.getElementById('arena-floor').textContent=`Y ${details.floor}`;document.getElementById('arena-ceiling').textContent=`Y ${details.ceiling}`;
 const image=document.getElementById('arena-image');image.src=`assets/maps/${button.dataset.arena}.png`;image.alt=`${arena.name} Arena`;
 document.getElementById('arena-name').textContent=arena.name;document.getElementById('arena-biome').textContent=arena.biome;document.getElementById('arena-bounds').textContent=arena.bounds;
}));

// Account personalization is optional; no tracking request or session data enters localStorage.
fetch('/portal/me',{credentials:'same-origin'}).then(response=>response.ok?response.json():null).then(account=>{
 if(account?.signedIn){document.querySelector('.opponent-name').textContent=account.displayName;
 if(account.hasSkin)document.querySelector('.skin-character').style.setProperty('--player-skin','url("/portal/skin")');
 const link=document.querySelector('.account-link');if(link)link.textContent=english?'My account':'Mein Konto';}
}).catch(()=>{});
