(() => {
  if (window.__tmOwnerAdminWorkflowLoaded) return;
  window.__tmOwnerAdminWorkflowLoaded = true;

  const OWNER_EMAIL='gregorio.navarro@truemategroup.com';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>typeof money==='function'?money(v):new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(+v||0);
  const nowIso=()=>new Date().toISOString();
  const today=()=>new Date().toISOString().slice(0,10);
  let currentUser={name:'Usuario',email:''};

  function cfg(){try{return JSON.parse(localStorage.getItem('tmic_w')||'{}')||{};}catch(_){return{};}}
  function saveCfg(x){localStorage.setItem('tmic_w',JSON.stringify(x));}
  function isOwner(){return String(currentUser.email||'').toLowerCase()===OWNER_EMAIL;}
  function userName(email){const e=String(email||'').toLowerCase();return (cfg().users||[]).find(u=>String(u.email||'').toLowerCase()===e)?.name || (e?e.split('@')[0]:'Sin asignar');}
  function portalFor(carrier){try{const l=JSON.parse(localStorage.getItem('tmic_l')||'{}');if(l[carrier])return l[carrier];const n=String(carrier||'').toLowerCase();const hit=Object.entries(l).find(([k])=>n.startsWith(String(k).toLowerCase())||String(k).toLowerCase().startsWith(n));return hit?.[1]||'';}catch(_){return'';}}
  function audit(action,module,ref,detail){if(typeof window.tmAddAudit==='function')window.tmAddAudit(action,module,ref,detail);}

  async function loadIdentity(){
    try{const r=await fetch('/cdn-cgi/access/get-identity',{cache:'no-store'});if(!r.ok)return;const x=await r.json();const email=String(x.email||x.user?.email||'').toLowerCase();if(email)currentUser={email,name:userName(email)};}catch(_){ }
    applyAccessUI();
  }

  function ensureStyle(){
    if($('tm-owner-admin-style'))return;
    const s=document.createElement('style');s.id='tm-owner-admin-style';s.textContent=`
      .tm-admin-card{margin-bottom:14px}.tm-admin-grid{display:grid;grid-template-columns:1.15fr 1fr 1fr;gap:10px;align-items:end}.tm-admin-grid label,.tm-admin-user label{display:block;font-size:10px;font-weight:900;text-transform:uppercase;color:#6a7f96;margin-bottom:5px}.tm-admin-grid select,.tm-admin-user input{width:100%;border:1px solid #d9e3ee;border-radius:9px;padding:9px;background:#fff}.tm-admin-user{display:grid;grid-template-columns:1fr 1.35fr auto;gap:8px;align-items:end;padding:8px 0;border-bottom:1px solid #edf1f5}.tm-owner-chip{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;background:#e6f7ee;color:#16754c;font-size:11px;font-weight:900}.tm-flow-banner{grid-column:1/-1;padding:11px 13px;border-radius:11px;background:#eef7ff;border:1px solid #cfe3f5;color:#315d83;font-size:12px}.tm-flow-status{display:inline-flex;padding:6px 9px;border-radius:999px;font-weight:900;font-size:11px}.tm-flow-reviewed{background:#fff3d2;color:#8b6600}.tm-flow-paid{background:#e5f7ee;color:#16744e}.tm-flow-pending{background:#edf4fb;color:#245887}.tm-owner-pay{grid-column:1/-1;border:1px solid #cfe2f5;background:#f7fbff;border-radius:12px;padding:12px}.tm-owner-pay label{display:block;font-size:10px;font-weight:900;text-transform:uppercase;color:#6a7f96;margin-bottom:5px}.tm-owner-pay input{border:1px solid #d9e3ee;border-radius:9px;padding:9px;background:#fff}.tm-pay-link2{display:inline-flex;text-decoration:none;background:#e8f3fd;color:#174675;border:1px solid #cfe0ef;border-radius:9px;padding:9px 12px;font-weight:900;margin-right:8px}@media(max-width:850px){.tm-admin-grid,.tm-admin-user{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function ensureAdminTab(){
    if(!isOwner())return;
    let b=document.querySelector('.tab[data-v="admin"]');
    if(!b){const tabs=document.querySelector('.tabs');if(!tabs)return;b=document.createElement('button');b.className='tab';b.dataset.v='admin';b.textContent='10 · Administración';tabs.appendChild(b);b.onclick=()=>{if(typeof go==='function')go('admin');renderAdmin();};}
    let sec=$('admin');
    if(!sec){sec=document.createElement('section');sec.id='admin';sec.className='view';sec.innerHTML='<div class="panel"><div class="head"><div><h2>Administración</h2><div class="sub">Controles exclusivos del Owner. Responsables, usuarios y permisos operativos.</div></div><span class="tm-owner-chip">Owner · Gregorio Navarro</span></div><div id="tmAdminBody"></div></div>';document.querySelector('.footer')?.before(sec);}
  }

  function renderAdmin(){
    if(!isOwner())return;
    ensureAdminTab();const body=$('tmAdminBody');if(!body)return;const x=cfg();x.users=Array.isArray(x.users)?x.users:[];x.assignments=x.assignments||{};
    const opts=sel=>x.users.filter(u=>u.active!==false).map(u=>`<option value="${esc(u.email)}" ${String(u.email).toLowerCase()===String(sel||'').toLowerCase()?'selected':''}>${esc(u.name)} · ${esc(u.email)}</option>`).join('');
    body.innerHTML=`<div class="card box tm-admin-card"><h3>Responsables de procesos</h3><div class="sub">Solo el Owner puede modificar estas asignaciones.</div><div class="tm-admin-grid" style="margin-top:14px"><div><label>Proceso</label><b>Completar / revisar Down Payment</b></div><div><label>Responsable</label><select id="tmAdmReview">${opts(x.assignments.carrierReview)}</select></div><div><label>Al terminar</label><span class="badge proc">Marcar Revisado</span></div><div><label>Proceso</label><b>Pagar Carrier / MGA / PFA</b></div><div><label>Responsable</label><select id="tmAdmPay">${opts(x.assignments.carrierPayment)}</select></div><div><label>Acción</label><span class="badge late">Registrar pago</span></div><div><label>Proceso</label><b>Cobrar diferidos</b></div><div><label>Responsable</label><select id="tmAdmDef">${opts(x.assignments.deferredCollection)}</select></div><div><label>Acción</label><span class="badge proc">Cobro diferido</span></div></div><div style="margin-top:14px;text-align:right"><button class="btn navy" id="tmAdmSave">Guardar responsables</button></div></div><div class="card box tm-admin-card"><h3>Usuarios del equipo</h3><div class="sub">Activa, desactiva o actualiza quién participa en el flujo.</div><div id="tmAdmUsers">${x.users.map((u,i)=>`<div class="tm-admin-user" data-i="${i}"><div><label>Nombre</label><input class="nm" value="${esc(u.name)}"></div><div><label>Email</label><input class="em" value="${esc(u.email)}"></div><button class="btn soft tg">${u.active===false?'Activar':'Desactivar'}</button></div>`).join('')}</div><div style="margin-top:10px"><button class="btn soft" id="tmAdmAdd">+ Agregar usuario</button></div></div>`;
    body.querySelector('#tmAdmSave').onclick=()=>{const y=cfg();y.assignments=y.assignments||{};y.assignments.carrierReview=body.querySelector('#tmAdmReview').value;y.assignments.carrierPayment=body.querySelector('#tmAdmPay').value;y.assignments.deferredCollection=body.querySelector('#tmAdmDef').value;saveCfg(y);audit('Configuración','Administración','Responsables','Owner actualizó responsables de procesos');alert('Responsables guardados.');};
    body.querySelectorAll('.tm-admin-user').forEach(row=>{const i=+row.dataset.i;row.querySelector('.nm').onchange=e=>{const y=cfg();y.users[i].name=e.target.value.trim();saveCfg(y);audit('Configuración','Administración',y.users[i].email,'Owner actualizó nombre de usuario');renderAdmin();};row.querySelector('.em').onchange=e=>{const y=cfg();const old=y.users[i].email;y.users[i].email=e.target.value.trim().toLowerCase();saveCfg(y);audit('Configuración','Administración',y.users[i].email,`Owner cambió email de ${old}`);renderAdmin();};row.querySelector('.tg').onclick=()=>{const y=cfg();y.users[i].active=y.users[i].active===false;saveCfg(y);audit('Configuración','Administración',y.users[i].email,y.users[i].active?'Owner activó usuario':'Owner desactivó usuario');renderAdmin();};});
    body.querySelector('#tmAdmAdd').onclick=()=>{const y=cfg();y.users=Array.isArray(y.users)?y.users:[];y.users.push({name:'Nuevo usuario',email:'',active:true});saveCfg(y);audit('Configuración','Administración','Usuario','Owner agregó un usuario');renderAdmin();};
  }

  function applyAccessUI(){
    ensureStyle();
    document.querySelectorAll('#settings .tm-responsibilities-card').forEach(x=>x.style.display='none');
    const auditTab=document.querySelector('.tab[data-v="audit"]');const auditSec=$('audit');
    if(!isOwner()){if(auditTab)auditTab.style.display='none';if(auditSec)auditSec.style.display='none';document.querySelector('.tab[data-v="admin"]')?.remove();$('admin')?.remove();}
    else{if(auditTab)auditTab.style.display='';if(auditSec)auditSec.style.display='';ensureAdminTab();renderAdmin();}
  }

  function popup(title,body,footer=''){document.querySelector('.tm-overlay')?.remove();const o=document.createElement('div');o.className='tm-overlay';o.innerHTML=`<div class="tm-pop"><div class="tm-pop-h"><h3>${title}</h3><button class="tm-close" type="button">×</button></div><div class="tm-pop-b">${body}</div>${footer?`<div class="tm-pop-f">${footer}</div>`:''}</div>`;o.querySelector('.tm-close').onclick=()=>o.remove();o.addEventListener('click',e=>{if(e.target===o)o.remove()});document.body.appendChild(o);return o;}
  function statusHtml(st){const s=String(st||'Pendiente de completar'),cl=s==='Pagado'?'tm-flow-paid':s==='Revisado'?'tm-flow-reviewed':'tm-flow-pending';return `<span class="tm-flow-status ${cl}">${esc(s)}</span>`;}

  window.tmEditCarrierObligation=function(id){
    ensureStyle();const r=(S.r||[]).find(x=>String(x.id)===String(id));if(!r)return alert('No encontré este pendiente.');
    const x=cfg(),payEmail=x.assignments?.carrierPayment||OWNER_EMAIL,payName=userName(payEmail),st=String(r.carrierStatus||'Pendiente de completar');
    const options='<option value="">Seleccionar…</option>'+(S.c||[]).map(c=>`<option value="${esc(c)}" ${c===r.carrier?'selected':''}>${esc(c)}</option>`).join('');
    const url=portalFor(r.carrier||'');const owner=isOwner();
    const payBlock=owner&&st==='Revisado'?`<div class="tm-owner-pay"><b style="color:#173f69">Listo para pago</b><div class="sub" style="margin:4px 0 9px">Revisado por ${esc(r.carrierReviewedBy||r.carrierPreparedBy||'Operaciones')}. Registra el pago cuando lo realices.</div>${url?`<a class="tm-pay-link2" href="${esc(url)}" target="_blank" rel="noopener">Pagar en portal ↗</a>`:''}<label style="margin-top:10px">Fecha de pago al Carrier</label><input id="tmOwnerPaidDate" type="date" value="${esc(r.carrierPaidDate||today())}"></div>`:'';
    const body=`<div class="tm-kpis"><div class="tm-kpi"><small>Cliente</small><b style="font-size:16px">${esc(r.client||'')}</b></div><div class="tm-kpi"><small>Invoice</small><b style="font-size:16px">${esc(r.invoice||'')}</b></div><div class="tm-kpi"><small>Down Payment</small><b>${fmt(r.downPayment||r.carrierAmt)}</b></div><div class="tm-kpi"><small>Estado actual</small><b>${statusHtml(st)}</b></div></div><div class="tm-grid"><div class="tm-field"><label>Carrier / MGA / PFA</label><select id="tmFlowCarrier">${options}</select></div><div class="tm-field"><label>Monto a pagar</label><input id="tmFlowAmt" type="number" min="0" step="0.01" value="${+r.carrierAmt||+r.downPayment||0}"></div><div class="tm-field"><label>Fecha límite</label><input id="tmFlowDue" type="date" value="${esc(r.carrierDue||'')}"></div><div class="tm-field" style="grid-column:1/-1"><label>Nota / número de póliza / referencia</label><textarea id="tmFlowNote">${esc(r.note||'')}</textarea></div><div class="tm-flow-banner">${st==='Pagado'?'Este pago ya está registrado como Pagado.':st==='Revisado'?`Este registro ya fue Revisado y está asignado para pago a <b>${esc(payName)}</b>.`:`Operaciones completa la información y usa <b>Marcar como Revisado</b>. No puede marcarlo como Pagado.`}</div>${payBlock}</div>`;
    let footer=`<button class="btn soft" id="tmFlowCancel">Cancelar</button>`;
    if(st==='Pagado') footer+=`<button class="btn navy" id="tmFlowSave">Guardar nota</button>`;
    else if(owner&&st==='Revisado') footer+=`<button class="btn navy" id="tmFlowPay">Registrar pago</button>`;
    else if(st==='Revisado') footer+=`<button class="btn navy" id="tmFlowSave">Guardar cambios</button>`;
    else footer+=`<button class="btn navy" id="tmFlowReview">✓ Marcar como Revisado</button>`;
    const o=popup(`Completar Carrier / PFA · ${esc(r.invoice||'')}`,body,footer);o.querySelector('#tmFlowCancel').onclick=()=>o.remove();
    const read=()=>({carrier:o.querySelector('#tmFlowCarrier').value,amt:+(o.querySelector('#tmFlowAmt').value||0),due:o.querySelector('#tmFlowDue').value,note:o.querySelector('#tmFlowNote').value.trim()});
    const persist=()=>{try{if(typeof store==='function')store();localStorage.setItem('tmic_r',JSON.stringify(S.r||[]));}catch(e){console.error(e);alert('No se pudo guardar.');return false}o.remove();try{if(typeof render==='function')render();}catch(_){}return true;};
    o.querySelector('#tmFlowReview')?.addEventListener('click',()=>{const v=read();if(!v.carrier||!v.due||v.amt<=0)return alert('Completa Carrier, monto y fecha límite.');if(!v.note)return alert('Agrega nota, número de póliza o referencia.');const stamp=nowIso();r.carrier=v.carrier;r.carrierAmt=v.amt;r.downPayment=r.downPayment||v.amt;r.carrierDue=v.due;r.note=v.note;r.carrierStatus='Revisado';r.carrierPreparedBy=currentUser.name;r.carrierPreparedEmail=currentUser.email;r.carrierPreparedAt=stamp;r.carrierReviewedBy=currentUser.name;r.carrierReviewedEmail=currentUser.email;r.carrierReviewedAt=stamp;r.carrierAssignedTo=payName;r.carrierAssignedEmail=payEmail;r.carrierNeedsCompletion=false;if(persist()){audit('Revisó','Carrier/PFA',r.invoice,`${currentUser.name} marcó el caso como Revisado y lo asignó a ${payName}`);alert(`Revisado. Quedó asignado para pago a ${payName}.`);}});
    o.querySelector('#tmFlowSave')?.addEventListener('click',()=>{const v=read();r.carrier=v.carrier||r.carrier;r.carrierAmt=v.amt||r.carrierAmt;r.carrierDue=v.due||r.carrierDue;r.note=v.note;r.carrierPreparedBy=currentUser.name;r.carrierPreparedEmail=currentUser.email;r.carrierPreparedAt=nowIso();if(persist())audit('Actualizó','Carrier/PFA',r.invoice,`${currentUser.name} actualizó información sin cambiar el estado ${st}`);});
    o.querySelector('#tmFlowPay')?.addEventListener('click',()=>{const d=o.querySelector('#tmOwnerPaidDate')?.value;if(!d)return alert('Coloca la fecha de pago al Carrier.');r.carrierStatus='Pagado';r.carrierPaidDate=d;r.carrierPaidBy=currentUser.name;r.carrierPaidEmail=currentUser.email;r.carrierPaidAt=nowIso();r.carrierAssignedTo='';r.carrierAssignedEmail='';if(persist()){audit('Pagó','Carrier/PFA',r.invoice,`${currentUser.name} registró el pago al Carrier`);alert('Pago al Carrier registrado correctamente.');}});
  };

  const oldRender=window.render;if(typeof oldRender==='function')window.render=function(){oldRender();setTimeout(applyAccessUI,350);};
  ensureStyle();setTimeout(applyAccessUI,700);setInterval(applyAccessUI,1800);loadIdentity();
})();