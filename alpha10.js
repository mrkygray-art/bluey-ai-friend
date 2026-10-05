// Alpha 10: visible photo confirmation and a reliable first-load composer.
const blueyPhotoPreview=document.querySelector('#bluey-photo-preview');
function blueyRenderPhotoPreview(){
 if(!blueyPhotoPreview)return;
 blueyPhotoPreview.replaceChildren();
 const pending=blueyPhotos.length>0,photos=pending?blueyPhotos:blueyRecentPhotos;
 if(!photos.length)return;
 photos.slice(0,4).forEach((photo,index)=>{
  const chip=document.createElement('span');chip.className='bluey-photo-chip';
  const image=document.createElement('img');image.src=photo.dataUrl;image.alt=photo.name||`Attached photo ${index+1}`;chip.appendChild(image);
  if(pending){
   const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label',`Remove ${photo.name||'photo'}`);
   remove.addEventListener('click',()=>{blueyPhotos.splice(index,1);blueySyncControls()});chip.appendChild(remove);
  }
  blueyPhotoPreview.appendChild(chip);
 });
 const note=document.createElement('span');note.className='bluey-photo-note';
 note.textContent=pending?`${photos.length} photo${photos.length===1?'':'s'} ready to send`:`${photos.length} recent photo${photos.length===1?'':'s'} available for follow-up`;
 blueyPhotoPreview.appendChild(note);
}
blueyRenderPhotoPreview();
