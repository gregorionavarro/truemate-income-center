(() => {
  if (window.__tmOwnerLinkLoaded) return;
  window.__tmOwnerLinkLoaded = true;
  const OWNER='gregorio.navarro@truemategroup.com';
  async function init(){
    try{
      const r=await fetch('/cdn-cgi/access/get-identity',{cache:'no-store'});
      if(!r.ok)return;
      const x=await r.json();
      const email=String(x.email||x.user?.email||'').trim().toLowerCase();
      if(email!==OWNER)return;
      const tabs=document.querySelector('.tabs');
      if(!tabs||document.getElementById('tmOwnerAdminLink'))return;
      const a=document.createElement('a');
      a.id='tmOwnerAdminLink';
      a.href='/admin.html';
      a.target='_blank';
      a.rel='noopener';
      a.className='tab';
      a.textContent='Owner · Administración ↗';
      a.style.textDecoration='none';
      tabs.appendChild(a);
    }catch(_){ }
  }
  setTimeout(init,500);
})();