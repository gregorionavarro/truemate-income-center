(() => {
  if (window.__tmMonthContextLoaded) return;
  window.__tmMonthContextLoaded = true;

  const MONTH_KEY='tmic_view_month';
  const YEAR_KEY='tmic_view_year';
  const NAMES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const $=id=>document.getElementById(id);
  const pad=v=>String(v).padStart(2,'0');
  const label=(y,m)=>`${NAMES[Math.max(0,(+m||1)-1)]} de ${y}`;

  function selected(){
    const y=$('yr')?.value||String(new Date().getFullYear());
    const m=$('mo')?.value||pad(new Date().getMonth()+1);
    return {y:String(y),m:pad(m),key:`${y}-${pad(m)}`};
  }

  function refreshMonthViews(){
    try{window.tmRefreshRecentMovements?.()}catch(_){ }
    try{window.tmRefreshSummaryPayments?.()}catch(_){ }
    try{window.render?.()}catch(_){ }
    // monthly-executive listens to these events; dispatch after render so its cards
    // always use the month currently visible in the selectors.
    try{$('mo')?.dispatchEvent(new Event('change'))}catch(_){ }
    try{$('yr')?.dispatchEvent(new Event('change'))}catch(_){ }
  }

  function persist(){
    const s=selected();
    try{localStorage.setItem(MONTH_KEY,s.m);localStorage.setItem(YEAR_KEY,s.y)}catch(_){ }
  }

  function restore(){
    const mo=$('mo'),yr=$('yr');
    if(!mo||!yr)return false;
    let m='',y='';
    try{m=localStorage.getItem(MONTH_KEY)||'';y=localStorage.getItem(YEAR_KEY)||''}catch(_){ }
    if(m&&[...mo.options].some(o=>o.value===m))mo.value=m;
    if(y&&[...yr.options].some(o=>o.value===y))yr.value=y;
    refreshMonthViews();
    return true;
  }

  function installSelectors(){
    const mo=$('mo'),yr=$('yr');if(!mo||!yr)return false;
    if(!mo.dataset.tmMonthPersist){
      mo.dataset.tmMonthPersist='1';
      mo.addEventListener('change',()=>{persist();setTimeout(refreshMonthViews,20)});
    }
    if(!yr.dataset.tmMonthPersist){
      yr.dataset.tmMonthPersist='1';
      yr.addEventListener('change',()=>{persist();setTimeout(refreshMonthViews,20)});
    }
    restore();
    return true;
  }

  function ensureDateWarning(){
    const date=$('date');if(!date)return;
    const wrap=date.closest('.f');if(!wrap)return;
    let box=wrap.querySelector('.tm-month-date-warning');
    if(!box){
      box=document.createElement('div');
      box.className='tm-month-date-warning';
      box.style.cssText='display:none;margin-top:7px;padding:8px 10px;border:1px solid #efd892;background:#fff7df;color:#7f5d0d;border-radius:9px;font-size:11px;line-height:1.35;font-weight:700';
      wrap.appendChild(box);
    }
    const update=()=>{
      const d=String(date.value||'');
      const s=selected();
      if(d&&d.slice(0,7)!==s.key){
        const [yy,mm]=d.split('-');
        box.style.display='block';
        box.textContent=`Atención: estás viendo ${label(s.y,s.m)}, pero este ingreso se guardará en ${label(yy,mm)}.`;
      }else box.style.display='none';
    };
    if(!date.dataset.tmMonthWarn){
      date.dataset.tmMonthWarn='1';
      date.addEventListener('change',update);
      date.addEventListener('input',update);
    }
    update();
  }

  function installSaveWarning(){
    if(window.__tmMonthSaveWrapped||typeof window.save!=='function')return;
    window.__tmMonthSaveWrapped=true;
    const prior=window.save;
    window.save=function(){
      const d=String($('date')?.value||'');
      const s=selected();
      const mismatch=!!d&&d.slice(0,7)!==s.key;
      const [yy,mm]=d.split('-');
      const target=mismatch?label(yy,mm):'';
      const out=prior.apply(this,arguments);
      if(mismatch){
        setTimeout(()=>{
          if(typeof window.tmNotice==='function')window.tmNotice(`El ingreso quedó guardado en ${target}. Tú continúas viendo ${label(s.y,s.m)}.`,'Ingreso guardado en otro mes','warning');
        },250);
      }
      return out;
    };
  }

  function improvePendingCarrierShortcut(){
    const b=$('tmCarrierPendingCount');if(!b)return;
    const rows=(()=>{try{return Array.isArray(S?.r)?S.r:[]}catch(_){return[]}})();
    const pending=rows.filter(r=>(+r.downPayment||+r.carrierAmt)>0&&!(r.carrier&&r.carrierDue)&&String(r.carrierStatus||'').toLowerCase()!=='pagado');
    if(pending.length===1){
      b.title='Abrir el único Carrier/PFA pendiente de completar';
      b.onclick=()=>{if(typeof window.tmEditCarrierObligation==='function')window.tmEditCarrierObligation(pending[0].id);else if(typeof window.go==='function')window.go('carrier')};
    }
  }

  const priorOpen=window.openModal;
  if(typeof priorOpen==='function'){
    window.openModal=function(){
      const r=priorOpen.apply(this,arguments);
      setTimeout(ensureDateWarning,80);
      return r;
    };
  }

  function boot(){
    if(!installSelectors()){setTimeout(boot,120);return;}
    installSaveWarning();
    setTimeout(()=>{refreshMonthViews();improvePendingCarrierShortcut()},350);
    setTimeout(()=>{refreshMonthViews();improvePendingCarrierShortcut()},1200);
  }
  boot();
})();