(() => {
  if (window.__tmCarrierPaymentPortalsLoaded) return;
  window.__tmCarrierPaymentPortalsLoaded = true;

  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const DEFAULT_LINKS = {
    'RPS':'https://rpsins.epaypolicy.com/',
    'Guardian':'https://guardian-ins.epaypolicy.com/',
    'Rocklake':'https://rocklakeig.epaypolicy.com/',
    'Burns and Wilcox':'https://burnsandwilcox.epaypolicy.com/'
  };

  function links(){
    try{
      const raw=JSON.parse(localStorage.getItem('tmic_l')||'null');
      if(raw && typeof raw==='object' && !Array.isArray(raw)) return raw;
    }catch(_){ }
    localStorage.setItem('tmic_l',JSON.stringify(DEFAULT_LINKS));
    return {...DEFAULT_LINKS};
  }
  function saveLinks(obj){localStorage.setItem('tmic_l',JSON.stringify(obj));}
  function norm(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ');}
  function getPortal(carrier){
    const all=links();
    if(all[carrier]) return all[carrier];
    const n=norm(carrier);
    const exact=Object.entries(all).find(([k])=>norm(k)===n);
    if(exact) return exact[1];
    const partial=Object.entries(all).find(([k])=>n.startsWith(norm(k))||norm(k).startsWith(n));
    return partial?.[1]||'';
  }

  function ensureStyle(){
    if($('tm-payment-portals-style')) return;
    const st=document.createElement('style');
    st.id='tm-payment-portals-style';
    st.textContent=`
      .tm-portals-card{grid-column:1/-1}.tm-portal-row{display:grid;grid-template-columns:220px 1fr auto auto;gap:8px;align-items:center;padding:9px 0;border-bottom:1px solid #e8eef5}.tm-portal-row:last-child{border-bottom:0}.tm-portal-row input,.tm-portal-add select,.tm-portal-add input{width:100%;border:1px solid #d9e3ee;border-radius:9px;padding:9px;background:#fff;color:#20324d}.tm-portal-add{display:grid;grid-template-columns:220px 1fr auto;gap:8px;margin-top:12px}.tm-pay-link{display:inline-flex;align-items:center;gap:6px;background:#e8f3fd;color:#174675;border:1px solid #cfe0ef;border-radius:9px;padding:9px 12px;font-weight:900;text-decoration:none}.tm-pay-link:hover{background:#ddecf9}.tm-no-link{font-size:11px;color:#7a8798;margin-top:5px}.tm-portal-box{margin-top:12px;padding:12px;border:1px solid #d9e7f3;border-radius:12px;background:#f7fbff}.tm-portal-box b{color:#173f69}
      @media(max-width:800px){.tm-portal-row,.tm-portal-add{grid-template-columns:1fr}.tm-portals-card{grid-column:auto}}
    `;
    document.head.appendChild(st);
  }

  function renderSettings(){
    const panel=$('settings')?.querySelector('.panel'); if(!panel) return;
    const analytics=panel.querySelector('.analytics'); if(!analytics) return;
    let card=analytics.querySelector('.tm-portals-card');
    if(!card){card=document.createElement('div');card.className='card box tm-portals-card';analytics.appendChild(card);}
    const all=links();
    const names=[...new Set([...(S.c||[]),...Object.keys(all)])].sort((a,b)=>a.localeCompare(b));
    card.innerHTML=`<h3>Portales de pago Carrier / MGA / PFA</h3><div class="sub">Configura el enlace de pago de cada mercado. El equipo podrá abrirlo directamente desde el pendiente del Carrier/PFA.</div><div style="margin-top:12px">${names.map(name=>`<div class="tm-portal-row" data-name="${esc(name)}"><b>${esc(name)}</b><input class="tm-portal-url" value="${esc(all[name]||'')}" placeholder="https://..."><button class="btn soft tm-portal-open" type="button" ${all[name]?'':'disabled'}>Abrir ↗</button><button class="btn navy tm-portal-save" type="button">Guardar</button></div>`).join('')}</div><div class="tm-portal-add"><select id="tmPortalCarrier"><option value="">Seleccionar Carrier…</option>${(S.c||[]).map(c=>`<option>${esc(c)}</option>`).join('')}</select><input id="tmPortalNewUrl" placeholder="https://portal-de-pago.com/"><button class="btn navy" id="tmPortalAdd" type="button">Agregar / actualizar</button></div>`;
    card.querySelectorAll('.tm-portal-row').forEach(row=>{
      const name=row.dataset.name, inp=row.querySelector('.tm-portal-url');
      row.querySelector('.tm-portal-save').onclick=()=>{const x=links();const v=inp.value.trim();if(v)x[name]=v;else delete x[name];saveLinks(x);renderSettings();};
      const open=row.querySelector('.tm-portal-open'); if(open&&!open.disabled)open.onclick=()=>window.open(inp.value.trim(),'_blank','noopener');
    });
    card.querySelector('#tmPortalAdd').onclick=()=>{const name=card.querySelector('#tmPortalCarrier').value.trim(),url=card.querySelector('#tmPortalNewUrl').value.trim();if(!name||!url)return alert('Selecciona el Carrier y coloca el enlace de pago.');const x=links();x[name]=url;saveLinks(x);renderSettings();};
  }

  function injectPortalIntoOpenPopup(id){
    const r=(S.r||[]).find(x=>String(x.id)===String(id)); if(!r) return;
    const overlay=document.querySelector('.tm-overlay'); if(!overlay) return;
    const carrierSel=overlay.querySelector('#tmOpCarrier'); if(!carrierSel) return;
    let box=overlay.querySelector('.tm-portal-box');
    if(!box){box=document.createElement('div');box.className='tm-portal-box';carrierSel.closest('.tm-field')?.appendChild(box);}
    const refresh=()=>{
      const carrier=carrierSel.value||r.carrier||'';
      const url=getPortal(carrier);
      box.innerHTML=url?`<b>Portal de pago</b><div style="margin-top:8px"><a class="tm-pay-link" href="${esc(url)}" target="_blank" rel="noopener">Pagar en portal ↗</a></div>`:`<b>Portal de pago</b><div class="tm-no-link">No hay enlace configurado para este Carrier. Puedes agregarlo en 8 · Configuración.</div>`;
    };
    carrierSel.addEventListener('change',refresh); refresh();
  }

  function wrapCarrierPopup(){
    const prior=window.tmEditCarrierObligation;
    if(typeof prior!=='function'||prior.__tmPortalWrapped) return;
    const wrapped=function(id){prior(id);setTimeout(()=>injectPortalIntoOpenPopup(id),40);};
    wrapped.__tmPortalWrapped=true;
    window.tmEditCarrierObligation=wrapped;
  }

  function addCarrierTablePayLinks(){
    const body=$('carBody'); if(!body) return;
    [...body.querySelectorAll('tr')].forEach(tr=>{
      const cells=[...tr.cells]; if(cells.length<8) return;
      const carrier=(cells[2]?.textContent||'').trim(); const url=getPortal(carrier); if(!url) return;
      const action=cells[cells.length-1]; if(action.querySelector('.tm-table-pay-link')) return;
      const a=document.createElement('a');a.className='tm-pay-link tm-table-pay-link';a.style.marginLeft='6px';a.href=url;a.target='_blank';a.rel='noopener';a.textContent='Pagar ↗';action.appendChild(a);
    });
  }

  function apply(){ensureStyle();renderSettings();wrapCarrierPopup();addCarrierTablePayLinks();}
  const oldRender=window.render;if(typeof oldRender==='function')window.render=function(){oldRender();setTimeout(apply,220);};
  setInterval(()=>{wrapCarrierPopup();addCarrierTablePayLinks();},1500);
  setTimeout(apply,400);
})();