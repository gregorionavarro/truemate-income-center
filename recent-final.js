(() => {
  if (window.__tmRecentFinalLoaded) return;
  window.__tmRecentFinalLoaded = true;

  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = v => typeof money==='function' ? money(v) : new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(+v||0);
  const fmtDate = v => {
    if(!v) return '—';
    const d=new Date(v+'T12:00:00');
    return Number.isNaN(d.getTime()) ? esc(v) : d.toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'});
  };
  const badge = r => String(r.depStatus||'').toLowerCase()==='depositado'
    ? '<span class="badge ok">Depositado</span>'
    : '<span class="badge proc">En proceso</span>';

  let busy=false;
  function renderRecentFinal(){
    if(busy) return;
    busy=true;
    try{
      const body=document.getElementById('recent');
      if(!body) return;
      const card=body.closest('.card');
      const table=body.closest('table');
      if(!card||!table) return;

      card.querySelectorAll('.tm-filters,.tm-recent-sort,#tmRecentExpand').forEach(x=>x.remove());
      const head=card.querySelector('.head');
      if(head){
        const h3=head.querySelector('h3'); if(h3) h3.textContent='Movimientos recientes';
        const sub=head.querySelector('.sub'); if(sub) sub.style.display='none';
        const btn=head.querySelector('.btn.soft');
        if(btn){btn.textContent='Ver todos →';btn.onclick=()=>go('income');}
      }

      const hr=table.querySelector('thead tr');
      if(hr) hr.innerHTML='<th>Fecha pago</th><th>Cliente</th><th>Invoice</th><th>Producer</th><th>Método</th><th>Pagó cliente</th><th>Fee</th><th>Neto</th><th>Depósito</th><th>Acción</th>';

      const rows=(Array.isArray(window.S?.r)?S.r:[]).slice()
        .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))
        .slice(0,5);

      body.innerHTML=rows.map(r=>`<tr>
        <td>${fmtDate(r.date)}</td>
        <td>${esc(r.client||'')}</td>
        <td><button class="tm-link" onclick="tmInvoiceDetail('${String(r.invoice||'').replace(/'/g,"\\'")}')">${esc(r.invoice||'')}</button></td>
        <td>${esc(r.producer||'')}</td>
        <td>${esc(r.method||'')}</td>
        <td>${fmt(r.gross)}</td>
        <td>${fmt(r.agencyFee)}</td>
        <td><b>${fmt(r.net)}</b></td>
        <td>${badge(r)}</td>
        <td><div class="tm-actions"><button class="btn soft" onclick="openModal('${r.id}')">Editar</button><button class="btn danger" onclick="deleteIncome('${r.id}')">Eliminar</button></div></td>
      </tr>`).join('') || '<tr><td colspan="10">Sin movimientos.</td></tr>';
    } finally {
      setTimeout(()=>{busy=false},20);
    }
  }

  const prior=window.render;
  if(typeof prior==='function') window.render=function(){ prior(); setTimeout(renderRecentFinal,120); };

  const observer=new MutationObserver(()=>{ if(!busy) setTimeout(renderRecentFinal,30); });
  const start=()=>{
    const body=document.getElementById('recent');
    if(body){ observer.observe(body,{childList:true,subtree:false}); renderRecentFinal(); }
    else setTimeout(start,100);
  };
  start();
})();
