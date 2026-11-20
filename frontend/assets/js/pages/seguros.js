/* Seguros: as apólices no mesmo formato da planilha "Acompanhamento Clientes" da Wilma.
   Cada aba da planilha vira um ramo, as colunas são as mesmas e a cor da linha (verde, amarelo,
   vermelho) é a marcação que ela já usa. Importa e exporta o .xlsx no mesmo modelo. */

const RAMOS=['Condomínio','Vida Global','Auto','Vida Individual','Residencial','Empresarial'];
const CORES={verde:{n:'Verde',argb:'FF00FF00',bg:'#d3f9d0',bd:'#2fbf3a'},amarelo:{n:'Amarelo',argb:'FFFFD966',bg:'#fff1c2',bd:'#e0a800'},
  vermelho:{n:'Vermelho',argb:'FFFF0000',bg:'#ffd6d6',bd:'#e03131'}};
const MODELO_XLSX='assets/modelos/acompanhamento-seguros.xlsx';
let RAMO='',FSIT='',FCOR='',ORD='planilha';
const ramos=()=>[...new Set([...RAMOS,...DB.apolices.map(a=>a.ramo)])];
const apo=id=>DB.apolices.find(a=>a.id===id);
const _norm=s=>String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toUpperCase();
const _tit=s=>String(s).trim().toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase()).replace('Condominio','Condomínio');
function sitApo(a){
  const t=hoje();
  if(!a.fim)return {k:'',t:'',c:''};
  if(a.fim<t)return {k:'venc',t:'Vencida',c:'p-bad'};
  if(a.fim<=addD(t,DB.config.antecedencia))return {k:'renov',t:'Vence em breve',c:'p-pend'};
  return {k:'ok',t:'Vigente',c:'p-ok'};
}
const itemDe=a=>DB.apolices.filter(x=>x.ramo===a.ramo).indexOf(a)+1;

function vSeguros(){
  const q=$('#q').value.toLowerCase(),rs=ramos();
  if(RAMO&&!rs.includes(RAMO))RAMO='';
  let lista=DB.apolices.filter(a=>(!RAMO||a.ramo===RAMO)&&(!FSIT||sitApo(a).k===FSIT)&&(!FCOR||(a.cor||'nenhuma')===FCOR)&&
    (!q||[a.cliente,a.doc,a.contato,a.numero,a.seguradora,a.produto].some(v=>(v||'').toLowerCase().includes(q))));
  if(ORD==='venc')lista=lista.slice().sort((a,b)=>(a.fim||'9').localeCompare(b.fim||'9'));
  const breve=DB.apolices.filter(a=>sitApo(a).k==='renov').length,vencidas=DB.apolices.filter(a=>sitApo(a).k==='venc').length;
  const cont=r=>DB.apolices.filter(a=>!r||a.ramo===r).length,docH=RAMO==='Auto'?'CPF':RAMO?'CNPJ':'CPF/CNPJ',comis=!RAMO||RAMO==='Condomínio';
  const sel=(v,set,opts)=>`<select onchange="${set}=this.value;render()">${opts.map(([k,t])=>`<option value="${k}" ${v===k?'selected':''}>${t}</option>`).join('')}</select>`;
  $('#view').innerHTML=`
  ${breve||vencidas?`<div class="box" style="margin-bottom:14px;display:flex;gap:14px;align-items:center;flex-wrap:wrap">${ic('alert')}
    ${breve?`<button class="link" onclick="FSIT='renov';render()"><b>${breve}</b> vence(m) nos próximos ${DB.config.antecedencia} dias</button>`:''}
    ${vencidas?`<button class="link" style="color:var(--bad)" onclick="FSIT='venc';render()"><b>${vencidas}</b> com vigência já encerrada</button>`:''}</div>`:''}
  <div class="subtabs" style="overflow-x:auto;white-space:nowrap">${['',...rs].map(r=>`<button class="tab ${r===RAMO?'on':''}" onclick="RAMO='${esc(r)}';render()">${esc(r?r.toUpperCase():'TODAS')} <span class="n">${cont(r)}</span></button>`).join('')}</div>
  <div class="filters">
    ${sel(FCOR,'FCOR',[['','Todas as cores'],...Object.entries(CORES).map(([k,c])=>[k,c.n]),['nenhuma','Sem cor']])}
    ${sel(FSIT,'FSIT',[['','Toda vigência'],['renov','Vence em breve'],['venc','Vigência encerrada'],['ok','Vigentes']])}
    ${sel(ORD,'ORD',[['planilha','Ordem da planilha'],['venc','Por vencimento']])}
    <button class="btn" onclick="editApo()">${ic('plus')}Nova linha</button>
    <label class="btn light" style="display:inline-flex;margin:0;color:var(--ink)">${ic('up')}Importar Excel<input type="file" accept=".xlsx" class="hidden" onchange="importarPlanilha(this)"></label>
    <button class="btn light" onclick="exportarPlanilha()">${ic('down')}Exportar Excel</button></div>
  <div class="box"><table class="planilha"><tr><th>Item</th><th>Cliente</th><th>${docH}</th><th>Contato</th><th>Produto</th><th>Seguradora</th><th>Apólice</th><th>Vigência inicial</th><th>Vigência final</th>${comis?'<th>Comissão</th>':''}<th>Observação</th></tr>
  ${lista.map(a=>{const s=sitApo(a),c=CORES[a.cor];return `<tr style="cursor:pointer;${c?`background:${c.bg};box-shadow:inset 4px 0 ${c.bd}`:''}" onclick="editApo('${a.id}')">
    <td>${itemDe(a)}</td><td><b>${esc(a.cliente)}</b>${RAMO?'':`<br><small style="color:var(--muted)">${esc(a.ramo)}</small>`}</td>
    <td class="nw">${esc(a.doc)}</td><td>${esc(a.contato)}</td><td>${esc(a.produto)}</td><td>${esc(a.seguradora)}</td>
    <td class="nw">${esc(a.numero)}</td><td class="nw">${fd(a.ini)}</td><td class="nw">${fd(a.fim)}${s.t&&s.k!=='ok'?`<br><span class="pill ${s.c}">${s.t}</span>`:''}</td>
    ${comis?`<td>${esc(a.comissao)}</td>`:''}<td>${esc(a.obs)}</td></tr>`}).join('')||`<tr><td colspan=11 class="empty">Nenhuma linha. Use "Importar Excel" para trazer a planilha de acompanhamento.</td></tr>`}</table></div>
  <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--muted);margin-top:10px">Cores das linhas, como na planilha:
    ${Object.values(CORES).map(c=>`<span style="display:inline-flex;gap:6px;align-items:center"><span style="width:12px;height:12px;border-radius:3px;background:${c.bg};border:2px solid ${c.bd}"></span>${c.n}</span>`).join('')}</div>`;
}

function editApo(id){
  const a=apo(id)||{ramo:RAMO||RAMOS[0],cliente:'',doc:'',contato:'',produto:'',seguradora:'',numero:'',ini:'',fim:'',comissao:'',obs:'',cor:''};
  const inp=(k,l,t='text')=>`<div><label>${l}</label><input id="a_${k}" type="${t}" value="${esc(a[k])}"></div>`;
  modal(`<div class="modal"><div class="mh"><h3>${id?`Item ${itemDe(a)} · ${esc(a.ramo)}`:'Nova linha'}</h3></div>
  <div class="row"><div><label>Aba (ramo)</label><input id="a_ramo" list="ramosL" value="${esc(a.ramo)}"><datalist id="ramosL">${ramos().map(r=>`<option value="${esc(r)}">`).join('')}</datalist></div>${inp('cliente','Cliente *')}</div>
  <div class="row">${inp('doc','CPF/CNPJ')}${inp('contato','Contato')}</div>
  <div class="row">${inp('produto','Produto')}${inp('seguradora','Seguradora')}</div>
  <div class="row">${inp('numero','Apólice')}${inp('comissao','Comissão')}</div>
  <div class="row">${inp('ini','Vigência inicial','date')}${inp('fim','Vigência final','date')}</div>
  <div class="row"><div><label>Observação</label><input id="a_obs" list="obsL" value="${esc(a.obs)}"><datalist id="obsL"><option value="NOVO"><option value="SEGURO NOVO"><option value="RENOVAÇÃO"><option value="ENDOSSO"></datalist></div>
  <div><label>Cor da linha</label><select id="a_cor">${[['','Sem cor'],...Object.entries(CORES).map(([k,c])=>[k,c.n])].map(([k,t])=>`<option value="${k}" ${a.cor===k?'selected':''}>${t}</option>`).join('')}</select></div></div>
  <div id="aErr" class="err"></div>
  <div class="actions">${id?`<button class="btn danger" style="margin-right:auto" onclick="delApo('${id}')">Excluir</button>`:''}<button class="btn light" onclick="closeM()">Cancelar</button><button class="btn" onclick="saveApo('${id||''}')">Salvar</button></div></div>`);
}
function saveApo(id){
  const d={};['ramo','cliente','doc','contato','produto','seguradora','numero','ini','fim','comissao','obs','cor'].forEach(k=>d[k]=$('#a_'+k).value.trim());
  if(!d.ramo||!d.cliente)return $('#aErr').textContent='Informe a aba e o cliente.';
  if(d.ini&&d.fim&&d.fim<d.ini)return $('#aErr').textContent='A vigência final é antes da inicial.';
  if(id)Object.assign(apo(id),d);else DB.apolices.push({id:uid(),...d});
  save();closeM();render();toast('Linha salva');
}
function delApo(id){confirmBox('Esta linha será excluída.',()=>{DB.apolices=DB.apolices.filter(a=>a.id!==id);save();closeM();render()},'Excluir')}

/* ---------- Excel (ExcelJS lê e grava mantendo cores, bordas e formatação) ---------- */
function carregarExcelJS(){
  if(window.ExcelJS)return Promise.resolve();
  return new Promise((ok,erro)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';s.onload=ok;s.onerror=()=>erro(new Error('não foi possível carregar o leitor de Excel'));document.head.append(s)});
}
function _txt(v){
  if(v==null)return '';
  if(v instanceof Date)return v.toISOString().slice(0,10);
  if(typeof v==='object'){if(v.richText)return v.richText.map(t=>t.text).join('');if('result' in v)return _txt(v.result);if(v.text)return _txt(v.text);return ''}
  return String(v).trim();
}
function _data(v){
  if(v&&typeof v==='object'&&'result' in v)v=v.result;
  if(v instanceof Date&&!isNaN(v))return v.toISOString().slice(0,10);
  const m=String(v||'').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:'';
}
function _cor(cell){
  const f=cell.fill,a=f&&f.type==='pattern'&&f.fgColor&&f.fgColor.argb;
  return (Object.entries(CORES).find(([,c])=>c.argb===a)||[''])[0];
}
function _colunas(ws){
  for(let r=1;r<=15;r++){
    const cab={};ws.getRow(r).eachCell((c,i)=>cab[_norm(_txt(c.value))]=i);
    if(cab.CLIENTE){const col=(...ns)=>ns.map(n=>cab[n]).find(Boolean)||0;
      return {linha:r,item:col('ITEM'),cliente:cab.CLIENTE,doc:col('CNPJ','CPF','CPF/CNPJ'),contato:col('CONTATO'),produto:col('PRODUTO'),seguradora:col('SEGURADORA'),
        numero:col('APOLICE'),ini:col('VIGENCIA INICIAL'),fim:col('VIGENCIA FINAL'),comissao:col('COMISSAO'),obs:col('OBSERVACAO')}}
  }
}
async function importarPlanilha(inp){
  const f=inp.files[0];inp.value='';if(!f)return;
  try{
    await carregarExcelJS();
    const wb=new ExcelJS.Workbook();await wb.xlsx.load(await f.arrayBuffer());
    const novas=[];
    wb.worksheets.forEach(ws=>{
      const ix=_colunas(ws);if(!ix)return;
      for(let r=ix.linha+1;r<=ws.rowCount;r++){
        const row=ws.getRow(r),v=k=>ix[k]?row.getCell(ix[k]).value:null,cliente=_txt(v('cliente'));if(!cliente)continue;
        novas.push({ramo:_tit(ws.name),cliente,doc:_txt(v('doc')),contato:_txt(v('contato')),produto:_txt(v('produto')),seguradora:_txt(v('seguradora')),
          numero:_txt(v('numero')),ini:_data(v('ini')),fim:_data(v('fim')),comissao:_txt(v('comissao')),obs:_txt(v('obs')),cor:_cor(row.getCell(ix.cliente))});
      }
    });
    if(!novas.length)return toast('Nenhuma linha encontrada na planilha');
    let add=0,atu=0;
    novas.forEach(n=>{const e=DB.apolices.find(a=>a.ramo===n.ramo&&(n.numero?a.numero===n.numero:!a.numero&&_norm(a.cliente)===_norm(n.cliente)&&a.ini===n.ini));
      if(e){Object.assign(e,n);atu++}else{DB.apolices.push({id:uid(),...n});add++}});
    save();render();toast(`${add} linha(s) importada(s)${atu?`, ${atu} atualizada(s)`:''}`);
  }catch(e){toast('Erro ao importar: '+e.message)}
}
async function exportarPlanilha(){
  try{
    await carregarExcelJS();
    const wb=new ExcelJS.Workbook();await wb.xlsx.load(await (await fetch(MODELO_XLSX)).arrayBuffer());
    const base=wb.worksheets[1]||wb.worksheets[0],abas={};
    wb.worksheets.forEach(ws=>abas[_tit(ws.name)]=ws);
    ramos().filter(r=>!abas[r]&&DB.apolices.some(a=>a.ramo===r)).forEach(r=>{ // ramo novo: aba no mesmo formato
      const ws=wb.addWorksheet(r.toUpperCase(),{views:base.views});
      base.columns.forEach((c,i)=>{ws.getColumn(i+1).width=c.width});
      for(let l=1;l<=6;l++){const o=base.getRow(l),d=ws.getRow(l);d.height=o.height;o.eachCell({includeEmpty:true},(c,i)=>{d.getCell(i).value=c.value;d.getCell(i).style=JSON.parse(JSON.stringify(c.style))})}
      Object.keys(base._merges||{}).forEach(k=>{const m=base._merges[k].model;ws.mergeCells(m.top,m.left,m.bottom,m.right)});
      abas[r]=ws;
    });
    Object.entries(abas).forEach(([r,ws])=>{
      const ix=_colunas(ws);if(!ix)return;
      const modelo=ws.getRow(ix.linha+1),ultima=Math.max(...Object.values(ix).filter(n=>typeof n==='number'));
      DB.apolices.filter(a=>a.ramo===r).forEach((a,i)=>{
        const row=ws.getRow(ix.linha+1+i);row.height=modelo.height||18;
        for(let c=1;c<=ultima;c++){const st=JSON.parse(JSON.stringify(modelo.getCell(c).style||{}));
          st.fill=CORES[a.cor]?{type:'pattern',pattern:'solid',fgColor:{argb:CORES[a.cor].argb}}:{type:'pattern',pattern:'solid',fgColor:{argb:'FFFFFFFF'}};
          row.getCell(c).style=st}
        const put=(k,v)=>{if(ix[k])row.getCell(ix[k]).value=v};
        const dt=s=>{if(!s)return null;const[y,m,d]=s.split('-').map(Number);return new Date(Date.UTC(y,m-1,d))};
        put('item',i+1);put('cliente',a.cliente);put('doc',a.doc);put('contato',a.contato);put('produto',a.produto);put('seguradora',a.seguradora);
        put('numero',a.numero);put('ini',dt(a.ini));put('fim',dt(a.fim));put('comissao',a.comissao);put('obs',a.obs);
        ['ini','fim'].forEach(k=>{if(ix[k])row.getCell(ix[k]).numFmt='dd/mm/yyyy'});
      });
    });
    const blob=new Blob([await wb.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`Acompanhamento Clientes ${fd(hoje()).replace(/\//g,'-')}.xlsx`;
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
    toast('Planilha exportada');
  }catch(e){toast('Erro ao exportar: '+e.message)}
}
