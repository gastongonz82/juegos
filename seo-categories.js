(()=> {
  const notice=document.createElement('div');
  notice.className='share-notice';
  notice.setAttribute('role','status');
  notice.hidden=true;
  document.body.append(notice);
  let noticeTimer;
  const showNotice=message=>{
    notice.textContent=message;
    notice.hidden=false;
    clearTimeout(noticeTimer);
    noticeTimer=setTimeout(()=>{notice.hidden=true},3200);
  };
  document.addEventListener('click',async event=>{
    const button=event.target.closest('.share-game');
    if(!button)return;
    const card=button.closest('.game-card');
    const link=card?.querySelector('.game-cover');
    const title=card?.querySelector('h3')?.textContent.trim();
    if(!link||!title)return;
    const url=new URL(link.getAttribute('href'),location.href).href;
    const text='🎮 ¡Probá '+title+'!';
    if(navigator.share){
      try{await navigator.share({title,text,url});return}
      catch(error){if(error.name==='AbortError')return}
    }
    document.querySelector('.share-dialog')?.remove();
    const dialog=document.createElement('dialog');
    dialog.className='share-dialog';
    const heading=document.createElement('h2');
    heading.textContent='Compartir '+title;
    dialog.append(heading);
    const whatsapp=document.createElement('a');
    whatsapp.textContent='Compartir por WhatsApp';
    whatsapp.href='https://wa.me/?text='+encodeURIComponent(text+'\n'+url);
    whatsapp.target='_blank';
    whatsapp.rel='noopener noreferrer';
    dialog.append(whatsapp);
    const copy=document.createElement('button');
    copy.type='button';
    copy.textContent='Copiar enlace';
    copy.addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(url);dialog.close();showNotice('Enlace copiado')}
      catch(_){showNotice('No se pudo copiar el enlace')}
    });
    dialog.append(copy);
    const close=document.createElement('button');
    close.type='button';
    close.textContent='Cerrar';
    close.addEventListener('click',()=>dialog.close());
    dialog.append(close);
    dialog.addEventListener('close',()=>dialog.remove());
    document.body.append(dialog);
    dialog.showModal();
  });
})();