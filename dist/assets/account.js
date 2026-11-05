(() => {
 const fileInput=document.getElementById('avatar-file');
 if(!fileInput)return;
 const english=document.documentElement.lang==='en';
 const status=document.getElementById('avatar-upload-status');
 const submit=document.getElementById('avatar-upload-submit');
 const hidden=document.getElementById('avatar-png');
 let selection=0;
 fileInput.addEventListener('change',async()=>{
  const current=++selection,file=fileInput.files?.[0];
  hidden.value='';submit.disabled=true;
  document.querySelector('.upload-preview').hidden=true;
  if(!file){status.textContent='';return;}
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024){
   status.textContent=english?'Choose a PNG, JPG or WEBP smaller than 5 MB.':'Wähle PNG, JPG oder WEBP mit höchstens 5 MB.';return;
  }
  status.textContent=english?'Preparing picture …':'Bild wird vorbereitet …';
  let image;
  try{
   image=await createImageBitmap(file,{imageOrientation:'from-image'});
   if(selection!==current)return;
   if(image.width>8192||image.height>8192)throw new Error('dimensions');
   const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
   const context=canvas.getContext('2d');
   const size=Math.min(image.width,image.height);
   context.drawImage(image,(image.width-size)/2,(image.height-size)/2,size,size,0,0,128,128);
   const png=canvas.toDataURL('image/png');
   if(png.length>120000)throw new Error('size');
   hidden.value=png;document.getElementById('avatar-file-preview').src=png;
   document.querySelector('.upload-preview').hidden=false;submit.disabled=false;
   status.textContent=english?'Ready. Only the small preview will be uploaded.':'Bereit. Nur das verkleinerte Vorschaubild wird hochgeladen.';
  }catch{
   if(selection===current)status.textContent=english?'This picture could not be prepared. Choose another one.':'Dieses Bild konnte nicht vorbereitet werden. Wähle ein anderes.';
  }finally{image?.close();}
 });
 document.getElementById('avatar-upload-form').addEventListener('submit',event=>{
  if(!hidden.value){event.preventDefault();return;}
  submit.disabled=true;submit.textContent=english?'Saving …':'Wird gespeichert …';
 });
 document.querySelectorAll('.profile-avatar img').forEach(image=>image.addEventListener('error',()=>{
  image.closest('.profile-avatar').classList.remove('avatar-minecraft');
  image.src='/assets/logo.png';
 },{once:true}));
})();
