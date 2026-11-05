const english=document.documentElement.lang==='en';
fetch('/portal/me',{credentials:'same-origin'}).then(r=>r.ok?r.json():null).then(account=>{
 if(!account?.signedIn)return;
 const name=document.querySelector('.site-topbar .account-name'),image=document.querySelector('.site-topbar .nav-avatar img');
 if(name)name.textContent=account.displayName;
 const admin=document.querySelector('.admin-menu-link'),logout=document.querySelector('.nav-logout');if(admin)admin.hidden=!account.owner;if(logout)logout.hidden=false;
 if(image){image.src='/portal/avatar';image.addEventListener('error',()=>image.src='/assets/logo.png',{once:true});}
}).catch(()=>{});
document.querySelector('[data-copy-server]')?.addEventListener('click',async event=>{
 const button=event.currentTarget;
 try{await navigator.clipboard.writeText(button.dataset.copyServer);button.querySelector('span').textContent=english?'Copied':'Kopiert';}
 catch{button.querySelector('span').textContent=english?'Select and copy':'Markieren & kopieren';}
});
document.querySelectorAll('.world-card').forEach(card=>card.addEventListener('click',event=>{
 if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 event.preventDefault();document.body.classList.add('world-leaving');card.classList.add('world-selected');setTimeout(()=>location.assign(card.href),220);
}));
addEventListener('pageshow',()=>document.body.classList.remove('world-leaving'));
const menu=document.querySelector('.site-topbar .account-menu');
document.addEventListener('click',event=>{if(menu&&!menu.contains(event.target))menu.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu)menu.open=false;});
