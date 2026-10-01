(() => {
  if (window.__tmCarrierCardFinalLoaded) return;
  window.__tmCarrierCardFinalLoaded = true;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>typeof money==='function'?money(v):new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(+v||0);
  const fmtDate=v=>{if(!v)return'—';const d=new Date(v+'T12:00:00');return Number.isNaN(d.getTime())?esc(v):d.toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'})};
  const amountOf=r=>+r.carrierAmt||+r.downPayment||0;
  const isPaid=r=>String(r.carrierStatus||'').toLowerCase()==='pagado';
  const isIncomplete=r=>!(r.carrier&&r.carrierDue);

  function dayInfo(due){
    if(!due)return['Completar','tm-days-warn'];
    const d=new Date(due+'T12:00:00');if(Number.isNaN(d.getTime()))return['—','tm-days-ok'];
    const n=new Date(),t=new Date(n.getFullYear(),n.getMonth(),n.getDate(),12),diff=Math.ceil((d-t)/86400000);
    if(diff<0)return['Vencido','tm-days-danger'];
    if(diff===0)return['Hoy','tm-days-danger'];
    if(diff<=3)return[`${diff} día${diff===1?'':'s'}`,'tm-days-danger'];
    if(diff<=7)return[`${diff} días`,'tm-days-warn'];
    return[`${diff} días`,'tm-days-ok'];
  }

  window.tmFinalOpenCarrier=function(id){
    if(typeof window.tmEditCarrierObligation==='function') return window.tmEditCarrierObligation(id);
    if(typeof window.go==='function') return window.go('carrier');
  };

  function renderFinalCarrierCard(){
    const grid=document.querySelector('#summary .grid2');
    if(!grid||grid.children.length<2)return;
    const card=grid.children[1];
    const rows=(Array.isArray(window.S?.r)?S.r:[])
      .filter(r=>amountOf(r)>0&&!isPaid(r))
      .slice()
      .sort((a,b)=>{
        const ai=isIncomplete(a),bi=isIncomplete(b);
        if(ai!==bi)return ai?-1:1;
        return String(a.carrierDue||'9999-12-31').localeCompare(String(b.carrierDue||'9999-12-31'));
      })
      .slice(0,8);

    card.innerHTML=`<div class="head"><div><h3>Próximos pagos a Carrier / MGA / PFA</h3><div class="sub" style="display:block!important">Pendientes globales: siguen aquí aunque pertenezcan a meses anteriores.</div></div><button class="btn soft" type="button" onclick="go('carrier')">Ver todos los pagos →</button></div>
      <div class="tablewrap"><table><thead><tr><th>Carrier / MGA / PFA</th><th>Cliente</th><th>Invoice</th><th>Monto a pagar</th><th>Fecha límite</th><th>Estado</th><th>Acción</th></tr></thead><tbody>
      ${rows.length?rows.map(r=>{const incomplete=isIncomplete(r);const [txt,cls]=dayInfo(r.carrierDue);return `<tr style="cursor:pointer" onclick="tmFinalOpenCarrier('${r.id}')"><td><b>${esc(r.carrier||'Pendiente de completar')}</b></td><td>${esc(r.client||'')}</td><td>${esc(r.invoice||'')}</td><td><b>${fmt(amountOf(r))}</b></td><td>${fmtDate(r.carrierDue)}</td><td><span class="tm-days ${cls}">${txt}</span></td><td><button class="tm-open-pay ${incomplete?'setup':''}" onclick="event.stopPropagation();tmFinalOpenCarrier('${r.id}')">${incomplete?'Completar':'Abrir'}</button></td></tr>`}).join(''):'<tr><td colspan="7" style="color:#6d7d92">Sin obligaciones pendientes a Carrier / MGA / PFA.</td></tr>'}
      </tbody></table></div>`;
  }

  window.tmRefreshFinalCarrierCard=renderFinalCarrierCard;
  const prior=window.render;
  if(typeof prior==='function')window.render=function(){const out=prior.apply(this,arguments);setTimeout(renderFinalCarrierCard,220);return out;};
  document.getElementById('mo')?.addEventListener('change',()=>setTimeout(renderFinalCarrierCard,240));
  document.getElementById('yr')?.addEventListener('change',()=>setTimeout(renderFinalCarrierCard,240));
  setTimeout(renderFinalCarrierCard,500);
  setTimeout(renderFinalCarrierCard,1400);
})();