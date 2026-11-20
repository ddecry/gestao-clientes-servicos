/* Seguros: apólices organizadas por ramo, no mesmo formato da planilha de acompanhamento */

const RAMOS=['Condomínio','Vida Global','Auto','Vida Individual','Residencial','Empresarial'];
let RAMO='',FSIT='';
const ramos=()=>[...new Set([...RAMOS,...DB.apolices.map(a=>a.ramo)])];
const apo=id=>DB.apolices.find(a=>a.id===id);
function sitApo(a){
  const t=hoje();
  if(!a.fim)return {k:'',t:'Sem vigência',c:''};
  if(a.fim<t)return {k:'venc',t:'Vencida',c:'p-bad'};
  if(a.fim<=addD(t,DB.config.antecedencia))return {k:'renov',t:'Renovar',c:'p-pend'};
  return {k:'ok',t:'Vigente',c:'p-ok'};
}

function vSeguros(){
  const q=$('#q').value.toLowerCase(),rs=ramos();
  if(RAMO&&!rs.includes(RAMO))RAMO='';
  const lista=DB.apolices.filter(a=>(!RAMO||a.ramo===RAMO)&&(!FSIT||sitApo(a).k===FSIT)&&
    (!q||[a.cliente,a.doc,a.contato,a.numero,a.seguradora].some(v=>(v||'').toLowerCase().includes(q))))
    .sort((a,b)=>(a.fim||'9').localeCompare(b.fim||'9'));
  const renovar=DB.apolices.filter(a=>sitApo(a).k==='renov').length,vencidas=DB.apolices.filter(a=>sitApo(a).k==='venc').length;
  const cont=r=>DB.apolices.filter(a=>!r||a.ramo===r).length;
  $('#view').innerHTML=`
  ${renovar||vencidas?`<div class="box" style="margin-bottom:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">${ic('alert')}
    ${renovar?`<button class="link" onclick="FSIT='renov';render()"><b>${renovar}</b> apólice(s) para renovar nos próximos ${DB.config.antecedencia} dias</button>`:''}
    ${vencidas?`<button class="link" style="color:var(--bad)" onclick="FSIT='venc';render()"><b>${vencidas}</b> vencida(s)</button>`:''}</div>`:''}
  <div class="subtabs" style="overflow-x:auto">${['',...rs].map(r=>`<button class="tab ${r===RAMO?'on':''}" onclick="RAMO='${esc(r)}';render()">${esc(r||'Todas')} <span class="n">${cont(r)}</span></button>`).join('')}</div>
  <div class="filters"><select onchange="FSIT=this.value;render()">${[['','Todas as situações'],['renov','Renovar'],['venc','Vencidas'],['ok','Vigentes']].map(([v,t])=>`<option value="${v}" ${FSIT===v?'selected':''}>${t}</option>`).join('')}</select>
    <button class="btn" onclick="editApo()">${ic('plus')}Nova apólice</button>
    <label class="btn light" style="display:inline-flex;margin:0;color:var(--ink)">${ic('up')}Importar planilha<input type="file" accept=".xlsx,.xls" class="hidden" onchange="importarPlanilha(this)"></label></div>
  <div class="box"><table><tr><th>Cliente</th><th>CPF/CNPJ</th><th>Contato</th><th>Produto</th><th>Seguradora</th><th>Apólice</th><th>Vigência</th><th>Comissão</th><th>Observação</th><th>Situação</th></tr>
  ${lista.map(a=>{const s=sitApo(a);return `<tr style="cursor:pointer" onclick="editApo('${a.id}')"><td><b>${esc(a.cliente)}</b>${RAMO?'':`<br><small style="color:var(--muted)">${esc(a.ramo)}</small>`}</td>
    <td class="nw">${esc(a.doc||'—')}</td><td>${esc(a.contato||'—')}</td><td>${esc(a.produto||'—')}</td><td>${esc(a.seguradora||'—')}</td>
    <td class="nw">${esc(a.numero||'—')}</td><td class="nw">${fd(a.ini)} a ${fd(a.fim)}</td><td>${esc(a.comissao||'—')}</td><td>${esc(a.obs||'—')}</td>
    <td>${s.c?`<span class="pill ${s.c}">${s.t}</span>`:'—'}</td></tr>`}).join('')||'<tr><td colspan=10 class="empty">Nenhuma apólice. Use "Importar planilha" para trazer as da planilha de acompanhamento.</td></tr>'}</table></div>`;
}

function editApo(id){
  const a=apo(id)||{ramo:RAMO||RAMOS[0],cliente:'',doc:'',contato:'',produto:'',seguradora:'',numero:'',ini:'',fim:'',comissao:'',obs:''};
  const inp=(k,l,t='text')=>`<div><label>${l}</label><input id="a_${k}" type="${t}" value="${esc(a[k])}"></div>`;
  modal(`<div class="modal"><div class="mh"><h3>${id?'Editar':'Nova'} apólice</h3></div>
  <div class="row"><div><label>Ramo</label><input id="a_ramo" list="ramosL" value="${esc(a.ramo)}"><datalist id="ramosL">${ramos().map(r=>`<option value="${esc(r)}">`).join('')}</datalist></div>${inp('cliente','Cliente *')}</div>
  <div class="row">${inp('doc','CPF/CNPJ')}${inp('contato','Contato')}</div>
  <div class="row">${inp('produto','Produto')}${inp('seguradora','Seguradora')}</div>
  <div class="row">${inp('numero','Nº da apólice')}${inp('comissao','Comissão')}</div>
  <div class="row">${inp('ini','Vigência inicial','date')}${inp('fim','Vigência final','date')}</div>
  <label>Observação</label><input id="a_obs" list="obsL" value="${esc(a.obs)}"><datalist id="obsL"><option value="NOVO"><option value="RENOVAÇÃO"><option value="ENDOSSO"></datalist>
  <div id="aErr" class="err"></div>
  <div class="actions">${id?`<button class="btn danger" style="margin-right:auto" onclick="delApo('${id}')">Excluir</button>`:''}<button class="btn light" onclick="closeM()">Cancelar</button><button class="btn" onclick="saveApo('${id||''}')">Salvar</button></div></div>`);
}
function saveApo(id){
  const d={};['ramo','cliente','doc','contato','produto','seguradora','numero','ini','fim','comissao','obs'].forEach(k=>d[k]=$('#a_'+k).value.trim());
  if(!d.ramo||!d.cliente)return $('#aErr').textContent='Informe o ramo e o cliente.';
  if(d.ini&&d.fim&&d.fim<d.ini)return $('#aErr').textContent='A vigência final é antes da inicial.';
  if(id)Object.assign(apo(id),d);else DB.apolices.push({id:uid(),...d});
  save();closeM();render();toast('Apólice salva');
}
function delApo(id){confirmBox('Esta apólice será excluída.',()=>{DB.apolices=DB.apolices.filter(a=>a.id!==id);save();closeM();render()},'Excluir')}

/* Importação da planilha "Acompanhamento Clientes" (uma aba por ramo) */
function carregarXLSX(){
  if(window.XLSX)return Promise.resolve();
  return new Promise((ok,erro)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=ok;s.onerror=()=>erro(new Error('Não foi possível carregar o leitor de planilhas'));document.head.append(s)});
}
const _norm=s=>String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toUpperCase();
const _tit=s=>String(s).trim().toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase()).replace('Condominio','Condomínio');
function _data(v){
  if(v instanceof Date&&!isNaN(v))return new Date(v.getTime()-v.getTimezoneOffset()*6e4).toISOString().slice(0,10);
  const m=String(v||'').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:'';
}
async function importarPlanilha(inp){
  const f=inp.files[0];inp.value='';if(!f)return;
  try{
    await carregarXLSX();
    const wb=XLSX.read(await f.arrayBuffer(),{cellDates:true});
    const novas=[];
    wb.SheetNames.forEach(nome=>{
      const linhas=XLSX.utils.sheet_to_json(wb.Sheets[nome],{header:1,defval:''});
      const hi=linhas.findIndex(l=>l.some(c=>_norm(c)==='CLIENTE'));if(hi<0)return;
      const cab=linhas[hi].map(_norm),col=(...ns)=>cab.findIndex(c=>ns.includes(c));
      const ix={cliente:col('CLIENTE'),doc:col('CNPJ','CPF','CPF/CNPJ'),contato:col('CONTATO'),produto:col('PRODUTO'),seguradora:col('SEGURADORA'),
        numero:col('APOLICE'),ini:col('VIGENCIA INICIAL'),fim:col('VIGENCIA FINAL'),comissao:col('COMISSAO'),obs:col('OBSERVACAO')};
      linhas.slice(hi+1).forEach(l=>{
        const v=k=>ix[k]<0?'':l[ix[k]],cliente=String(v('cliente')).trim();if(!cliente)return;
        novas.push({ramo:_tit(nome),cliente,doc:String(v('doc')).trim(),contato:String(v('contato')).trim(),produto:String(v('produto')).trim(),
          seguradora:String(v('seguradora')).trim(),numero:String(v('numero')).trim(),ini:_data(v('ini')),fim:_data(v('fim')),
          comissao:String(v('comissao')).trim(),obs:String(v('obs')).trim()});
      });
    });
    if(!novas.length)return toast('Nenhuma apólice encontrada na planilha');
    let add=0,atu=0;
    novas.forEach(n=>{const e=DB.apolices.find(a=>a.ramo===n.ramo&&(n.numero?a.numero===n.numero:!a.numero&&_norm(a.cliente)===_norm(n.cliente)&&a.ini===n.ini));if(e){Object.assign(e,n);atu++}else{DB.apolices.push({id:uid(),...n});add++}});
    save();render();toast(`${add} apólice(s) importada(s)${atu?`, ${atu} atualizada(s)`:''}`);
  }catch(e){toast('Erro ao importar: '+e.message)}
}
