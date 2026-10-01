(() => {
  if (window.__tmAdminUiCleanupLoaded) return;
  window.__tmAdminUiCleanupLoaded = true;

  function cleanupSettings(){
    document.querySelectorAll('#settings .tm-responsibilities-card').forEach(el=>el.remove());
  }

  function reorderTabs(){
    const tabs=document.querySelector('.tabs');
    if(!tabs)return;
    const order=['summary','income','deferred','carrier','fees','year','tasks','settings','audit','admin'];
    order.forEach(v=>{
      const b=tabs.querySelector(`.tab[data-v="${v}"]`);
      if(b)tabs.appendChild(b);
    });
  }

  function apply(){cleanupSettings();reorderTabs();}

  const obs=new MutationObserver(()=>setTimeout(apply,20));
  setTimeout(()=>{
    const settings=document.getElementById('settings');
    const tabs=document.querySelector('.tabs');
    if(settings)obs.observe(settings,{childList:true,subtree:true});
    if(tabs)obs.observe(tabs,{childList:true});
    apply();
  },250);

  setInterval(apply,1200);
})();