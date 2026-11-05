(() => {
 const curtain=document.querySelector('.brand-curtain');
 if(!document.documentElement.classList.contains('intro-active')){curtain?.remove();return;}
 try{sessionStorage.setItem('aple-intro-seen','1');}catch{}
 const finish=()=>{document.documentElement.classList.remove('intro-active');curtain?.remove();};
 const timer=setTimeout(finish,2600);
 const skip=event=>{if(event.key==='Escape'){clearTimeout(timer);finish();document.removeEventListener('keydown',skip);}};
 document.addEventListener('keydown',skip);
 setTimeout(()=>document.removeEventListener('keydown',skip),2700);
})();
