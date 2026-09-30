(() => {
  const addStyles = () => {
    if (document.getElementById('tm-delete-style')) return;
    const st = document.createElement('style');
    st.id = 'tm-delete-style';
    st.textContent = `.btn.danger{background:#fff0f2;color:#a72f43;border:1px solid #f2c9d0;margin-left:6px}.btn.danger:hover{background:#ffe2e7}`;
    document.head.appendChild(st);
  };

  function toast(msg){
    let x=document.getElementById('tm-delete-toast');
    if(!x){x=document.createElement('div');x.id='tm-delete-toast';x.style.cssText='position:fixed;right:22px;top:22px;z-index:99999;background:#173f69;color:#fff;padding:12px 16px;border-radius:12px;font-weight:800;box-shadow:0 12px 28px rgba(0,0,0,.20)';document.body.appendChild(x)}
    x.textContent=msg;x.style.display='block';clearTimeout(x._t);x._t=setTimeout(()=>x.style.display='none',2600);
  }

  window.deleteIncome = function(id){
    const rec = (S.r||[]).find(x => String(x.id) === String(id));
    if (!rec) return alert('No encontré este ingreso. Actualiza la página e intenta de nuevo.');
    const label = `${rec.client || 'Cliente'} · ${rec.invoice || 'Sin invoice'} · ${money(rec.gross || 0)}`;
    const ok = confirm(`¿Eliminar este ingreso?\n\n${label}\n\nTambién se eliminarán las tareas automáticas relacionadas con este invoice. Esta acción no se puede deshacer.`);
    if (!ok) return;

    try {
      const ri=(S.r||[]).findIndex(x=>String(x.id)===String(id));
      if(ri>=0) S.r.splice(ri,1);
      for(let i=(S.t||[]).length-1;i>=0;i--){
        const t=S.t[i];
        if(t.auto && t.invoice===rec.invoice) S.t.splice(i,1);
      }
      try{store()}catch(_){
        localStorage.setItem('tmic_r',JSON.stringify(S.r||[]));
        localStorage.setItem('tmic_t',JSON.stringify(S.t||[]));
      }
      toast('Ingreso eliminado correctamente.');
      setTimeout(()=>{try{render()}catch(e){console.error('Render después de eliminar',e)}},40);
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar el ingreso.');
    }
  };

  function decorateTable(tbodyId){
    const body = document.getElementById(tbodyId);
    if (!body) return;
    body.querySelectorAll('button[onclick^="openModal("]').forEach(editBtn => {
      const cell = editBtn.closest('td');
      if (!cell || cell.querySelector('.tm-delete')) return;
      const raw = editBtn.getAttribute('onclick') || '';
      const m = raw.match(/openModal\('([^']+)'\)/);
      if (!m) return;
      const id = m[1];
      const del = document.createElement('button');
      del.className = 'btn danger tm-delete';
      del.type = 'button';
      del.textContent = 'Eliminar';
      del.onclick = () => window.deleteIncome(id);
      cell.appendChild(del);
    });
  }

  function decorate(){addStyles();decorateTable('recent');decorateTable('incomeBody');}

  if (typeof render === 'function' && !window.__tmDeleteRenderPatched) {
    window.__tmDeleteRenderPatched = true;
    const originalRender = render;
    render = function(){originalRender();decorate();};
  }

  decorate();
})();