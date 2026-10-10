/* Analytics shared across the arcade. Existing inline GA tags take precedence. */
(()=>{
  const gamePath=location.pathname.match(/\/(flappy-vladi|vladi-[a-z0-9-]+)\/?(?:index\.html)?$/i);
  if(!gamePath)return;
  const slug=gamePath[1];
  const retro=new URLSearchParams(location.search).get('game');
  const gameId=slug==='vladi-retro'&&retro?'vladi-retro-'+retro:slug;
  // Recent games stay on this device; no gameplay state is changed.
  try {
    const key='vladyerik-recent-games-v1';
    const href=slug==='vladi-retro'&&retro
      ? './vladi-retro/index.html?game='+encodeURIComponent(retro)
      : './'+slug+'/';
    const saved=JSON.parse(localStorage.getItem(key)||'[]');
    const history=Array.isArray(saved)?saved.filter(item=>typeof item==='string'&&item!==href):[];
    localStorage.setItem(key,JSON.stringify([href,...history].slice(0,12)));
  } catch (_) {}
  const name=slug==='vladi-retro'&&retro?retro.replace(/-/g,' '):document.title.split(/[—|]/)[0].trim();
  if(typeof window.gtag!=='function'){
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){window.dataLayer.push(arguments)};
    window.gtag('js',new Date());
    window.gtag('config','G-QWN2XREXY7');
    const tag=document.createElement('script');tag.async=true;
    tag.src='https://www.googletagmanager.com/gtag/js?id=G-QWN2XREXY7';
    document.head.appendChild(tag);
  }
  // Keep game identity consistent for events emitted by individual games.
  window.vladyAnalyticsGame={game_id:gameId,game_name:name};
  window.gtag('event','game_page_open',{game_id:gameId,game_name:name});
  document.addEventListener('click',function(event){
    const button=event.target.closest('button');
    if(!button)return;
    const id=(button.id||'').toLowerCase();
    const label=(button.textContent||'').trim().toLowerCase();
    if(!/^(start|play|playbtn|again|retry|restart|main-action)$/.test(id)&&!(/^(▶|►|↻)?\s*(jugar|volver a jugar|iniciar partida|nueva partida|reintentar)/i.test(label)))return;
    window.gtag('event','game_play_click',{game_id:gameId,game_name:name,button_id:id||'unnamed'});
  },{capture:true});

})();
(()=>{"use strict";const headerLink=document.querySelector(".top a.back");const link=headerLink||document.createElement("a");link.classList.add("arcade-return");link.href="../arcade.html";link.textContent="← VOLVER AL ARCADE";link.setAttribute("aria-label","Volver al mi arcade");link.title="Volver al arcade";if(!headerLink){document.body.append(link)}link.addEventListener("click",event=>event.stopPropagation(),true)})();