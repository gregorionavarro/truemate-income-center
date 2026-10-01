(() => {
  if(window.__tmIncomeClientNoteLoaded)return;
  window.__tmIncomeClientNoteLoaded=true;
  let editingId=null;
  const $=id=>document.getElementById(id);

  function ensureField(id){
    const client=$('client');if(!client)return;
    const fields=client.closest('.fields');if(!fields)return;
    let wrap=$('tmClientNoteWrap');
    if(!wrap){
      wrap=document.createElement('div');wrap.id='tmClientNoteWrap';wrap.className='f';wrap.style.gridColumn='1/-1';
      wrap.innerHTML='<label>Nota importante del cliente</label><textarea id="tmClientNote" placeholder="Información importante para seguimiento, servicio, documentos, pagos, etc."></textarea><div class="sub" style="font-size:10px;margin-top:4px">Esta nota pertenece al ingreso/cliente y no reemplaza la nota de Carrier/PFA.</div>';
      fields.appendChild(wrap);
    }
    const rec=id?(S.r||[]).find(x=>String(x.id)===String(id)):null;
    const input=$('tmClientNote');if(input)input.value=rec?.clientNote||'';
  }

  const prevOpen=window.openModal;
  if(typeof prevOpen==='function')window.openModal=function(id){
    editingId=id||null;
    prevOpen(id);
    setTimeout(()=>ensureField(id),60);
  };

  const prevClose=window.closeModal;
  if(typeof prevClose==='function')window.closeModal=function(){prevClose();setTimeout(()=>{editingId=null;},0);};

  const prevSave=window.save;
  if(typeof prevSave==='function')window.save=function(){
    const note=String($('tmClientNote')?.value||'').trim();
    const id=editingId;
    const invoice=String($('invoice')?.value||'').trim();
    const beforeIds=new Set((S.r||[]).map(x=>String(x.id)));
    prevSave();
    setTimeout(()=>{
      let rec=id?(S.r||[]).find(x=>String(x.id)===String(id)):null;
      if(!rec)rec=[...(S.r||[])].reverse().find(x=>!beforeIds.has(String(x.id)));
      if(!rec&&invoice)rec=[...(S.r||[])].reverse().find(x=>String(x.invoice||'').trim()===invoice);
      if(!rec)return;
      rec.clientNote=note;
      try{localStorage.setItem('tmic_r',JSON.stringify(S.r||[]));if(typeof store==='function')store();if(typeof render==='function')render();}catch(e){console.error('client note save',e);}
      editingId=null;
    },120);
  };

  setTimeout(()=>ensureField(editingId),500);
})();