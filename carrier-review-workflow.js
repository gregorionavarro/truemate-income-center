(() => {
  if (window.__tmCarrierReviewWorkflowLoaded) return;
  window.__tmCarrierReviewWorkflowLoaded = true;

  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = v => typeof money==='function' ? money(v) : new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(+v||0);
  const today = () => new Date().toISOString().slice(0,10);
  const nowIso = () => new Date().toISOString();
  let currentUser={email:'',name:'Usuario'};

  function displayName(email){
    const known={
      'gregorio.navarro@truemategroup.com':'Gregorio Navarro',
      'fabiola.bermudez@truemategroup.com':'Fabiola Bermudez',
      'paula.bermudez@truemategroup.com':'Paula Bermudez',
      'camila@truemategroup.com':'Camila'
    };
    const e=String(email||'').toLowerCase();
    if(known[e]) return known[e];
    const local=(e||'Usuario').split('@')[0].replace(/[._-]+/g,' ');
    return local.replace(/\b\w/g,c=>c.toUpperCase());
  }

  async function loadIdentity(){
    try{
      const r=await fetch('/cdn-cgi/access/get-identity',{cache:'no-store'});
      if(!r.ok) return;
      const x=await r.json();
      const email=String(x.email||x.user?.email||'').toLowerCase();
      if(email) currentUser={email,name:displayName(email)};
    }catch(_){ }
  }
  loadIdentity();

  function ensureStyle(){
    if($('tm-carrier-review-style')) return;
    const s=document.createElement('style');s.id='tm-carrier-review-style';
    s.textContent=`
      .tm-audit-box{grid-column:1/-1;border:1px solid #cfe2f5;background:#f5faff;border-radius:14px;padding:14px 16px;margin:2px 0 8px}
      .tm-audit-title{font-size:16px;font-weight:900;color:#173f69;margin-bottom:12px}
      .tm-audit-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0}
      .tm-audit-item{padding:0 14px;border-right:1px solid #d6e3ef}.tm-audit-item:first-child{padding-left:0}.tm-audit-item:last-child{border-right:0}
      .tm-audit-item small{display:block;color:#6b8198;font-size:10px;font-weight:900;text-transform:uppercase;margin-bottom:4px}.tm-audit-item b{display:block;color:#173f69;font-size:14px}
      .tm-review-note{grid-column:1/-1;background:#eef7ff;border:1px solid #cfe4f8;border-radius:10px;padding:10px 12px;color:#315d83;font-size:12px}
      .tm-status-reviewed{background:#fff3d2;color:#8b6600}.tm-status-paid{background:#e5f7ee;color:#16744e}.tm-status-pending{background:#edf4fb;color:#245887}
      @media(max-width:850px){.tm-audit-grid{grid-template-columns:1fr 1fr}.tm-audit-item{border-right:0;padding:8px 0}}
    `;
    document.head.appendChild(s);
  }

  function formatStamp(v){
    if(!v) return '—';
    const d=new Date(v); if(Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US',{month:'2-digit',day:'2-digit',year:'numeric',hour:'numeric',minute:'2-digit'});
  }

  function popup(title,body,footer=''){
    document.querySelector('.tm-overlay')?.remove();
    const o=document.createElement('div');o.className='tm-overlay';
    o.innerHTML=`<div class="tm-pop"><div class="tm-pop-h"><h3>${title}</h3><button class="tm-close" type="button">×</button></div><div class="tm-pop-b">${body}</div>${footer?`<div class="tm-pop-f">${footer}</div>`:''}</div>`;
    o.querySelector('.tm-close').onclick=()=>o.remove();
    o.addEventListener('click',e=>{if(e.target===o)o.remove()});
    document.body.appendChild(o);return o;
  }

  function statusBadge(st){
    const s=String(st||'Pendiente de completar');
    const cls=s==='Pagado'?'tm-status-paid':s==='Revisado'?'tm-status-reviewed':'tm-status-pending';
    return `<span class="badge ${cls}">${esc(s)}</span>`;
  }

  window.tmEditCarrierObligation=function(id){
    ensureStyle();
    const r=(S.r||[]).find(x=>String(x.id)===String(id));
    if(!r) return alert('No encontré este pendiente.');
    const options='<option value="">Seleccionar…</option>'+(S.c||[]).map(c=>`<option value="${esc(c)}" ${c===r.carrier?'selected':''}>${esc(c)}</option>`).join('');
    const status=r.carrierStatus||'Pendiente de completar';
    const prepared=r.carrierPreparedBy||'—';
    const updated=r.carrierPreparedAt||r.carrierReviewedAt||r.carrierPaidAt||'';
    const assigned=status==='Revisado'?'Gregorio Navarro':(r.carrierAssignedTo||'—');
    const body=`
      <div class="tm-kpis">
        <div class="tm-kpi"><small>Cliente</small><b style="font-size:16px">${esc(r.client||'')}</b></div>
        <div class="tm-kpi"><small>Invoice</small><b style="font-size:16px">${esc(r.invoice||'')}</b></div>
        <div class="tm-kpi"><small>Down Payment</small><b>${fmt(r.downPayment||r.carrierAmt)}</b></div>
        <div class="tm-kpi"><small>Responsable</small><b style="font-size:16px">Operaciones</b></div>
      </div>
      <div class="tm-grid">
        <div class="tm-field"><label>Carrier / MGA / PFA</label><select id="tmOpCarrier">${options}</select></div>
        <div class="tm-field"><label>Monto a pagar</label><input id="tmOpAmount" type="number" min="0" step="0.01" value="${+r.carrierAmt||+r.downPayment||0}"></div>
        <div class="tm-field"><label>Fecha límite</label><input id="tmOpDue" type="date" value="${esc(r.carrierDue||'')}"></div>
        <div class="tm-audit-box">
          <div class="tm-audit-title">Trazabilidad / revisión interna</div>
          <div class="tm-audit-grid">
            <div class="tm-audit-item"><small>Preparado por</small><b>${esc(prepared)}</b></div>
            <div class="tm-audit-item"><small>Última actualización</small><b>${esc(formatStamp(updated))}</b></div>
            <div class="tm-audit-item"><small>Estado actual</small><b>${statusBadge(status)}</b></div>
            <div class="tm-audit-item"><small>Asignado para pago</small><b>${esc(assigned)}</b></div>
          </div>
        </div>
        <div class="tm-field"><label>Estado</label><select id="tmOpStatus"><option>Pendiente de completar</option><option>Pendiente</option><option>Revisado</option><option>Pagado</option><option>No aplica</option></select></div>
        <div class="tm-field tm-paid-date" id="tmPaidDateWrap"><label>Fecha de pago al Carrier</label><input id="tmOpPaidDate" type="date" value="${esc(r.carrierPaidDate||'')}"></div>
        <div class="tm-field" style="grid-column:1/-1"><label>Nota / número de póliza / referencia</label><textarea id="tmOpNote">${esc(r.note||'')}</textarea></div>
        <div class="tm-review-note">Al guardar como <b>Revisado</b>, el registro queda listo para que Gregorio realice el pago. El sistema guarda quién preparó la información y la hora de actualización.</div>
      </div>`;
    const o=popup(`Completar Carrier / PFA · ${esc(r.invoice||'')}`,body,`<button class="btn soft" id="tmOpCancel">Cancelar</button><button class="btn navy" id="tmOpSave">Guardar</button>`);
    const st=o.querySelector('#tmOpStatus');st.value=status;
    const paidWrap=o.querySelector('#tmPaidDateWrap'),paid=o.querySelector('#tmOpPaidDate');
    const syncPaid=()=>{const isPaid=st.value==='Pagado';paidWrap.classList.toggle('on',isPaid);if(isPaid&&!paid.value)paid.value=today();};
    st.onchange=syncPaid;syncPaid();
    o.querySelector('#tmOpCancel').onclick=()=>o.remove();
    o.querySelector('#tmOpSave').onclick=()=>{
      const carrier=o.querySelector('#tmOpCarrier').value;
      const due=o.querySelector('#tmOpDue').value;
      const amount=+(o.querySelector('#tmOpAmount').value||0);
      const note=o.querySelector('#tmOpNote').value.trim();
      let newStatus=st.value;
      if((newStatus==='Revisado'||newStatus==='Pagado')&&(!carrier||!due||amount<=0)) return alert('Completa Carrier, monto y fecha límite antes de continuar.');
      if(newStatus==='Revisado'&&!note) return alert('Agrega una nota o referencia antes de marcar como Revisado.');
      if(newStatus==='Pagado'&&!paid.value) return alert('Coloca la fecha de pago al Carrier.');
      const stamp=nowIso();
      r.carrier=carrier;r.carrierAmt=amount;r.downPayment=r.downPayment||amount;r.carrierDue=due;r.note=note;
      r.carrierStatus=newStatus;
      r.carrierPreparedBy=currentUser.name;r.carrierPreparedEmail=currentUser.email;r.carrierPreparedAt=stamp;
      if(newStatus==='Revisado'){
        r.carrierReviewedBy=currentUser.name;r.carrierReviewedEmail=currentUser.email;r.carrierReviewedAt=stamp;r.carrierAssignedTo='Gregorio Navarro';
      }
      if(newStatus==='Pagado'){
        r.carrierPaidDate=paid.value;r.carrierPaidBy=currentUser.name;r.carrierPaidEmail=currentUser.email;r.carrierPaidAt=stamp;r.carrierAssignedTo='';
      } else if(newStatus!=='Pagado') {
        r.carrierPaidDate='';
      }
      r.carrierNeedsCompletion=!(carrier&&due)&&newStatus!=='Pagado'&&newStatus!=='No aplica';
      try{
        if(typeof store==='function') store(); else localStorage.setItem('tmic_r',JSON.stringify(S.r||[]));
        localStorage.setItem('tmic_r',JSON.stringify(S.r||[]));
      }catch(e){console.error(e);return alert('No se pudo guardar el Carrier/PFA.');}
      o.remove();
      try{if(typeof render==='function')render();}catch(e){console.error('Refresh after carrier review',e)}
      alert(newStatus==='Revisado'?`Revisado por ${currentUser.name}. Quedó listo para pago.`:newStatus==='Pagado'?`Pago registrado por ${currentUser.name}.`:'Carrier/PFA actualizado correctamente.');
    };
  };

  function enhanceCarrierTable(){
    const body=$('carBody');if(!body)return;
    const table=body.closest('table'),hr=table?.querySelector('thead tr');
    if(hr)hr.innerHTML='<th>Cliente</th><th>Invoice</th><th>Carrier/PFA</th><th>Monto</th><th>Fecha límite</th><th>Estado</th><th>Preparado por</th><th>Fecha pago</th><th>Acción</th>';
    const rows=(S.r||[]).filter(r=>(+r.carrierAmt||+r.downPayment)>0);
    const fd=v=>{if(!v)return'—';const d=new Date(v+'T12:00:00');return Number.isNaN(d.getTime())?esc(v):d.toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'});};
    body.innerHTML=rows.map(r=>`<tr><td>${esc(r.client||'')}</td><td>${esc(r.invoice||'')}</td><td>${esc(r.carrier||'—')}</td><td><b>${fmt(r.carrierAmt||r.downPayment)}</b></td><td>${fd(r.carrierDue)}</td><td>${statusBadge(r.carrierStatus)}</td><td>${esc(r.carrierPreparedBy||'—')}</td><td>${fd(r.carrierPaidDate)}</td><td><button class="btn soft" onclick="tmEditCarrierObligation('${r.id}')">Editar</button></td></tr>`).join('')||'<tr><td colspan="9">Sin obligaciones</td></tr>';
  }

  const oldRender=window.render;
  if(typeof oldRender==='function') window.render=function(){oldRender();setTimeout(enhanceCarrierTable,260);};
  setTimeout(()=>{ensureStyle();enhanceCarrierTable();},500);
})();