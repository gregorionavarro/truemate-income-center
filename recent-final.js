(() => {
  if (window.__tmRecentFinalLoaded) return;
  window.__tmRecentFinalLoaded = true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>typeof money==='function'?money(v):new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(+v||0);
  const fmtDate=v=>{if(!v)return'—';const d=new Date(v+'T12:00:00');return Number.isNaN(d.getTime())?esc(v):d.toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'})};
  const depBadge=r=>String(r.depStatus||'').toLowerCase()==='depositado'?'<span class="badge ok">Depositado</span>':'<span class="badge proc">En proceso</span>';
  const hasCarrier=r=>(+r.downPayment||+r.carrierAmt)>0;
  const carrierComplete=r=>!!r.carrier&&!!r.carrierDue;
  const carrierBadge=r=>{
    if(!hasCarrier(r)) return '<span style="color:#9aa8b8">—</span>';
    if(carrierComplete(r) || r.carrierStatus==='Pagado') return `<button class="tm-mini green" onclick="tmEditCarrierObligation('${r.id}')">Completo</button>`;
    return `<button class="tm-mini amber" onclick="tmEditCarrierObligation('${r.id}')">Pendiente de completar</button>`;
  };
  const getRows=()=>{try{return (typeof S!=='undefined'&&S&&Array.isArray(S.r))?S.r:[]}catch(_){return[]}};
  let busy=false,expanded=false;
  function setupHeader(card,total,rows){
    const head=card?.querySelector('.head');if(!head)return;
    const h3=head.querySelector('h3');if(h3){h3.textContent='Movimientos recientes';h3.style.cursor=total>5?'pointer':'default';h3.onclick=total>5?()=>{expanded=!expanded;renderRecentFinal()}:null}
    const sub=head.querySelector('.sub');if(sub)sub.style.display='none';
    let actions=head.querySelector('.tm-recent-head-actions');
    if(!actions){actions=document.createElement('div');actions.className='tm-recent-head-actions';actions.style.cssText='display:flex;gap:8px;align-items:center;margin-left:auto';const existing=head.querySelector('.btn.soft');if(existing){head.insertBefore(actions,existing);actions.appendChild(existing)}else head.appendChild(actions)}
    let pending=actions.querySelector('#tmCarrierPendingCount');
    const count=rows.filter(r=>hasCarrier(r)&&!carrierComplete(r)&&r.carrierStatus!=='Pagado').length;
    if(count>0){
      if(!pending){pending=document.createElement('button');pending.type='button';pending.id='tmCarrierPendingCount';pending.className='tm-mini amber';actions.insertBefore(pending,actions.firstChild)}
      pending.textContent=`Carrier / PFA por completar: ${count}`;
      pending.onclick=()=>{try{go('carrier')}catch(_){document.querySelector('[data-view="carrier"]')?.click()}};
    }else if(pending)pending.remove();
    const viewAll=actions.querySelector('.btn.soft:not(#tmRecentCollapse)');if(viewAll){viewAll.textContent='Ver todos →';viewAll.onclick=()=>go('income')}
    let collapse=actions.querySelector('#tmRecentCollapse');if(expanded&&total>5){if(!collapse){collapse=document.createElement('button');collapse.type='button';collapse.id='tmRecentCollapse';collapse.className='btn soft';actions.insertBefore(collapse,actions.firstChild)}collapse.textContent='Mostrar menos ↑';collapse.onclick=()=>{expanded=false;renderRecentFinal()}}else if(collapse)collapse.remove();
  }
  function renderRecentFinal(){
    if(busy)return;busy=true;
    try{
      const body=document.getElementById('recent');if(!body)return;
      const card=body.closest('.card'),table=body.closest('table');if(!card||!table)return;
      card.querySelectorAll('.tm-filters,.tm-recent-sort,#tmRecentExpand,.tm-recent-footer').forEach(x=>x.remove());
      const allRows=getRows().slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
      setupHeader(card,allRows.length,allRows);
      const hr=table.querySelector('thead tr');if(hr)hr.innerHTML='<th>Fecha pago</th><th>Cliente</th><th>Invoice</th><th>Producer</th><th>Método</th><th>Pagó cliente</th><th>Fee</th><th>Neto</th><th>Depósito</th><th>Carrier / PFA</th><th>Acción</th>';
      const rows=expanded?allRows:allRows.slice(0,5);
      body.innerHTML=rows.map(r=>`<tr><td>${fmtDate(r.date)}</td><td>${esc(r.client||'')}</td><td><button class="tm-link" onclick="tmInvoiceDetail('${String(r.invoice||'').replace(/'/g,"\\'")}')">${esc(r.invoice||'')}</button></td><td>${esc(r.producer||'')}</td><td>${esc(r.method||'')}</td><td>${fmt(r.gross)}</td><td>${fmt(r.agencyFee)}</td><td><b>${fmt(r.net)}</b></td><td>${depBadge(r)}</td><td>${carrierBadge(r)}</td><td><div class="tm-actions"><button class="btn soft" onclick="openModal('${r.id}')">Editar</button><button class="btn danger tm-delete" onclick="deleteIncome('${r.id}')">Eliminar</button></div></td></tr>`).join('')||'<tr><td colspan="11">Sin movimientos.</td></tr>';
    }finally{setTimeout(()=>{busy=false},20)}
  }
  const prior=window.render;if(typeof prior==='function')window.render=function(){prior();setTimeout(renderRecentFinal,120)};
  const observer=new MutationObserver(()=>{if(!busy)setTimeout(renderRecentFinal,30)});
  const start=()=>{const body=document.getElementById('recent');if(body){observer.observe(body,{childList:true,subtree:false});renderRecentFinal()}else setTimeout(start,100)};
  start();
})();