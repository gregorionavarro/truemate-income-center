(() => {
  if (window.__tmExecutiveRankingsLoaded) return;
  window.__tmExecutiveRankingsLoaded = true;

  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = v => typeof money === 'function' ? money(v) : new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(+v||0);

  function ensureStyle(){
    if ($('tm-exec-rank-style')) return;
    const s=document.createElement('style'); s.id='tm-exec-rank-style';
    s.textContent=`
      .tm-exec-card{padding:15px!important}.tm-exec-title{font-size:10px;text-transform:uppercase;color:#657990;font-weight:900;letter-spacing:.55px;margin-bottom:10px}.tm-exec-list{display:flex;flex-direction:column;gap:9px}.tm-exec-row{display:grid;grid-template-columns:24px minmax(0,1fr) 92px;gap:8px;align-items:center}.tm-exec-num{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#edf4fb;color:#365b82;font-weight:900;font-size:11px}.tm-exec-main{min-width:0}.tm-exec-name{font-weight:900;color:#1f416a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;text-decoration:underline;text-underline-offset:2px}.tm-exec-track{height:6px;background:#edf1f5;border-radius:99px;overflow:hidden;margin-top:5px}.tm-exec-fill{height:100%;background:linear-gradient(90deg,#249b62,#73d8a0);border-radius:99px}.tm-exec-fill.blue{background:linear-gradient(90deg,#2f7ac0,#77b9ee)}.tm-exec-value{text-align:right;font-weight:900;color:#173f69;font-size:12px}.tm-exec-toggle{margin-top:10px;border:0;background:transparent;color:#195b93;font-weight:900;cursor:pointer;padding:0;font-size:12px}.tm-exec-empty{padding:10px 0;color:#6d7d92;font-size:12px;line-height:1.4}.tm-exec-empty b{display:block;color:#1f416a;margin-bottom:4px}.tm-exec-detail-table{width:100%;border-collapse:collapse;font-size:13px}.tm-exec-detail-table th{background:#edf4fb;color:#50657f;text-transform:uppercase;font-size:10px;text-align:left;padding:9px}.tm-exec-detail-table td{padding:9px;border-bottom:1px solid #e9eef4}.tm-exec-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}.tm-exec-kpi{border:1px solid #dde6ef;border-radius:12px;padding:12px}.tm-exec-kpi small{display:block;color:#70859b;text-transform:uppercase;font-weight:900;font-size:10px}.tm-exec-kpi b{display:block;color:#173f69;font-size:20px;margin-top:4px}.analytics{display:none!important}@media(max-width:950px){.tm-exec-row{grid-template-columns:24px 1fr 80px}.tm-exec-summary{grid-template-columns:1fr}}
    `; document.head.appendChild(s);
  }

  function popup(title, body){
    document.querySelector('.tm-overlay')?.remove();
    const o=document.createElement('div');o.className='tm-overlay';
    o.innerHTML=`<div class="tm-pop"><div class="tm-pop-h"><h3>${title}</h3><button class="tm-close" type="button">×</button></div><div class="tm-pop-b">${body}</div></div>`;
    o.querySelector('.tm-close').onclick=()=>o.remove();o.addEventListener('click',e=>{if(e.target===o)o.remove()});document.body.appendChild(o);
  }

  function producerDetail(name){
    const rows=S.r.filter(r=>r.producer===name && (+r.agencyFee||0)>0).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    const byClient={}; rows.forEach(r=>{const k=r.client||'Sin cliente'; if(!byClient[k])byClient[k]={fee:0,n:0}; byClient[k].fee+=+r.agencyFee||0;byClient[k].n++;});
    const total=rows.reduce((a,r)=>a+(+r.agencyFee||0),0);
    const clients=Object.entries(byClient).sort((a,b)=>b[1].fee-a[1].fee);
    const body=`<div class="tm-exec-summary"><div class="tm-exec-kpi"><small>Fee total</small><b>${fmt(total)}</b></div><div class="tm-exec-kpi"><small>Clientes</small><b>${clients.length}</b></div><div class="tm-exec-kpi"><small>Operaciones</small><b>${rows.length}</b></div></div>
      <div class="tablewrap"><table class="tm-exec-detail-table"><thead><tr><th>Cliente</th><th>Operaciones</th><th>Fee cobrado</th></tr></thead><tbody>${clients.map(([c,x])=>`<tr><td>${esc(c)}</td><td>${x.n}</td><td><b>${fmt(x.fee)}</b></td></tr>`).join('')||'<tr><td colspan="3">Sin fees registrados.</td></tr>'}</tbody></table></div>
      <div style="height:14px"></div><div class="tablewrap"><table class="tm-exec-detail-table"><thead><tr><th>Fecha</th><th>Cliente</th><th>Invoice</th><th>Fee</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.date||'')}</td><td>${esc(r.client||'')}</td><td>${esc(r.invoice||'')}</td><td><b>${fmt(r.agencyFee)}</b></td></tr>`).join('')||'<tr><td colspan="4">Sin movimientos.</td></tr>'}</tbody></table></div>`;
    popup(`Producer · ${esc(name)}`,body);
  }
  window.tmExecutiveProducerDetail=producerDetail;

  function carrierDetail(name){
    const rows=S.r.filter(r=>r.carrier===name && r.carrierStatus==='Pagado' && (+r.carrierAmt||0)>0).slice().sort((a,b)=>(b.carrierDue||b.date||'').localeCompare(a.carrierDue||a.date||''));
    const total=rows.reduce((a,r)=>a+(+r.carrierAmt||0),0);
    const body=`<div class="tm-exec-summary"><div class="tm-exec-kpi"><small>Total pagado</small><b>${fmt(total)}</b></div><div class="tm-exec-kpi"><small>Pagos</small><b>${rows.length}</b></div><div class="tm-exec-kpi"><small>Clientes</small><b>${new Set(rows.map(r=>r.client)).size}</b></div></div><div class="tablewrap"><table class="tm-exec-detail-table"><thead><tr><th>Cliente</th><th>Invoice</th><th>Fecha</th><th>Monto</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.client||'')}</td><td>${esc(r.invoice||'')}</td><td>${esc(r.carrierDue||r.date||'')}</td><td><b>${fmt(r.carrierAmt)}</b></td></tr>`).join('')||'<tr><td colspan="4">Sin pagos registrados.</td></tr>'}</tbody></table></div>`;
    popup(`Carrier / PFA · ${esc(name)}`,body);
  }
  window.tmExecutiveCarrierDetail=carrierDetail;

  function build(){
    ensureStyle();
    const insightWrap=document.querySelector('#summary .insights'); if(!insightWrap) return;
    const cards=[...insightWrap.children]; if(cards.length<4) return;
    const prodCard=cards[0], carCard=cards[1];
    prodCard.classList.add('tm-exec-card'); carCard.classList.add('tm-exec-card');

    const pAgg={}; S.r.forEach(r=>{if(r.producer)pAgg[r.producer]=(pAgg[r.producer]||0)+(+r.agencyFee||0)});
    const producers=Object.entries(pAgg).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
    const maxP=producers[0]?.[1]||1; const expanded=prodCard.dataset.expanded==='1'; const visible=expanded?producers:producers.slice(0,3);
    prodCard.innerHTML=`<div class="tm-exec-title">Top Producers · Últimos 12 meses</div><div class="tm-exec-list">${visible.map(([n,v],i)=>`<div class="tm-exec-row"><div class="tm-exec-num">${i+1}</div><div class="tm-exec-main"><div class="tm-exec-name" data-producer="${esc(n)}">${esc(n)}</div><div class="tm-exec-track"><div class="tm-exec-fill" style="width:${Math.max(5,v/maxP*100)}%"></div></div></div><div class="tm-exec-value">${fmt(v)}</div></div>`).join('')||'<div class="tm-exec-empty"><b>Aún no hay fees registrados</b>Los producers aparecerán aquí cuando se registren fees.</div>'}</div>${producers.length>3?`<button class="tm-exec-toggle">${expanded?'Ver menos ↑':'Ver más ↓'}</button>`:''}`;
    prodCard.querySelectorAll('[data-producer]').forEach(el=>el.onclick=()=>producerDetail(el.dataset.producer));
    const tog=prodCard.querySelector('.tm-exec-toggle'); if(tog) tog.onclick=()=>{prodCard.dataset.expanded=expanded?'0':'1';build()};

    const cAgg={}; S.r.forEach(r=>{if(r.carrier&&r.carrierStatus==='Pagado')cAgg[r.carrier]=(cAgg[r.carrier]||0)+(+r.carrierAmt||0)});
    const carriers=Object.entries(cAgg).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]); const maxC=carriers[0]?.[1]||1;
    carCard.innerHTML=`<div class="tm-exec-title">Pagos a aseguradoras · Histórico</div>${carriers.length?`<div class="tm-exec-list">${carriers.slice(0,3).map(([n,v],i)=>`<div class="tm-exec-row"><div class="tm-exec-num">${i+1}</div><div class="tm-exec-main"><div class="tm-exec-name" data-carrier="${esc(n)}">${esc(n)}</div><div class="tm-exec-track"><div class="tm-exec-fill blue" style="width:${Math.max(5,v/maxC*100)}%"></div></div></div><div class="tm-exec-value">${fmt(v)}</div></div>`).join('')}</div>`:`<div class="tm-exec-empty"><b>Aún no hay pagos registrados</b>Aquí aparecerán Carrier / MGA / PFA por monto pagado.</div>`}`;
    carCard.querySelectorAll('[data-carrier]').forEach(el=>el.onclick=()=>carrierDetail(el.dataset.carrier));
  }

  const originalRender=window.render;
  if(typeof originalRender==='function') window.render=function(){originalRender();setTimeout(build,0)};
  setTimeout(build,0);
})();