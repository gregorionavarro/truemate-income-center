(() => {
  const addStyles = () => {
    if (document.getElementById('tm-delete-style')) return;
    const st = document.createElement('style');
    st.id = 'tm-delete-style';
    st.textContent = `.btn.danger{background:#fff0f2;color:#a72f43;border:1px solid #f2c9d0;margin-left:6px}.btn.danger:hover{background:#ffe2e7}`;
    document.head.appendChild(st);
  };

  window.deleteIncome = function(id){
    try {
      const rec = S.r.find(x => x.id === id);
      if (!rec) return alert('No encontré este ingreso. Actualiza la página e intenta de nuevo.');
      const label = `${rec.client || 'Cliente'} · ${rec.invoice || 'Sin invoice'} · ${money(rec.gross || 0)}`;
      const ok = confirm(`¿Eliminar este ingreso?\n\n${label}\n\nTambién se eliminarán las tareas automáticas relacionadas con este invoice. Esta acción no se puede deshacer.`);
      if (!ok) return;

      S.r = S.r.filter(x => x.id !== id);
      S.t = S.t.filter(t => !(t.auto && t.invoice === rec.invoice));
      store();
      render();
      alert('Ingreso eliminado correctamente.');
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

  function decorate(){
    addStyles();
    decorateTable('recent');
    decorateTable('incomeBody');
  }

  if (typeof render === 'function' && !window.__tmDeleteRenderPatched) {
    window.__tmDeleteRenderPatched = true;
    const originalRender = render;
    render = function(){
      originalRender();
      decorate();
    };
  }

  decorate();
})();
