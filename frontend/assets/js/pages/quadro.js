/* Navegação, quadro de vendas e visões em lista e calendário */

/* ================= RENDER ================= */
const GRUPOS=[['board'],['clients'],['seguros'],['tasks','agenda'],['payments','reports'],['services','users']];
const SUBNOME={tasks:'Tarefas',agenda:'Compromissos',payments:'Pagamentos',reports:'Relatórios',services:'Serviços',users:'Usuários e empresa'};
const ADMINV=['reports','users'];
function grupo(v){return GRUPOS.find(g=>g.includes(v))}
function render(){
  if(ADMINV.includes(VIEW)&&!isAdmin())VIEW=grupo(VIEW)[0];
  const titles={board:'Quadro de vendas',clients:'Clientes',services:'Catálogo de serviços',payments:'Pagamentos',agenda:'Agenda',tasks:'Tarefas',reports:'Relatórios',users:'Usuários'};
  Object.assign(titles,{seguros:'Seguros',tasks:'Agenda',agenda:'Agenda',payments:'Financeiro',reports:'Financeiro',services:'Configurações',users:'Configurações'});
  $('#title').textContent=titles[VIEW];document.body.dataset.v=VIEW;
  document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('on',grupo(x.dataset.v).includes(VIEW)));
  const h=new Date().getHours(),saud=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite',ativos=DB.clients.filter(c=>c.ativo).length;
  $('#sub').textContent={board:`${saud}, ${ME.nome.split(' ')[0]}! Você tem ${ativos} cliente(s) ativo(s).`,clients:'Cadastro de pessoas físicas e jurídicas',seguros:'Apólices por ramo, como na planilha de acompanhamento',services:'Serviços oferecidos, organizados por nicho',payments:'Parcelas a receber e recebidas',agenda:'Próximos compromissos e prazos',tasks:'Checklists e lembretes de todos os clientes',reports:'Indicadores do negócio',users:'Acessos, empresa e cópia de segurança'}[VIEW]||'';
  const n=lembretes().length;$('#bellN').textContent=n;$('#bellN').classList.toggle('hidden',!n);
  ({board:vBoard,clients:vClients,seguros:vSeguros,services:vServices,payments:vPayments,agenda:vAgenda,tasks:vTasks,reports:vReports,users:vUsers})[VIEW]();
  const g=grupo(VIEW).filter(v=>isAdmin()||!ADMINV.includes(v));
  if(g.length>1){$('#view').insertAdjacentHTML('afterbegin',`<div class="subtabs">${g.map(v=>`<button class="tab ${v===VIEW?'on':''}" onclick="VIEW='${v}';render()">${SUBNOME[v]}</button>`).join('')}</div>`)}
}
function filtered(){
  const q=$('#q').value.toLowerCase();
  return DB.clients.filter(c=>c.ativo&&(!q||c.nome.toLowerCase().includes(q))&&(!NICHO||c.contratos.some(x=>svc(x.serv).nicho===NICHO)));
}

/* Pendências mostradas no topo do quadro */
function pendencias(){
  const t=hoje(),tips=[];
  const atras=[];DB.clients.forEach(c=>c.contratos.forEach(x=>x.parcelas.forEach(p=>{if(!p.paga&&p.venc<t)atras.push({c,p})})));
  if(atras.length)tips.push(`${atras.length} parcela(s) vencida(s). Mais antiga: ${esc(atras[0].c.nome)}, ${brl(atras[0].p.valor)}.`);
  const ren=DB.clients.flatMap(c=>c.contratos.filter(x=>x.renov&&x.renov>=t&&x.renov<=addD(t,DB.config.antecedencia)).map(x=>c));
  if(ren.length)tips.push(`${ren.length} seguro(s) para renovar nos próximos ${DB.config.antecedencia} dias.`);
  const parados=DB.clients.filter(c=>c.ativo&&c.col==='c1');
  if(parados.length)tips.push(`${parados.length} cliente(s) em "Novo contato".`);
  const org={};DB.clients.forEach(c=>{const o=c.origem||'Não informado';org[o]=(org[o]||0)+1});
  const top=Object.entries(org).sort((a,b)=>b[1]-a[1])[0];
  return tips;
}

function vBoard(){
  const cs=filtered();
  $('#view').innerHTML=`
  ${(t=>t.length?`<div class="ai"><b>Pendências</b><ul>${t.map(x=>`<li>${x}</li>`).join('')}</ul></div>`:'')(pendencias())}
  <div class="bar-row"><div class="vt">${[['quadro','board','Quadro'],['lista','list','Lista'],['cal','cal','Calendário']].map(([k,i,t])=>`<button class="${BV===k?'on':''}" onclick="BV='${k}';render()">${ic(i)}${t}</button>`).join('')}</div>
  <div class="chips">${[{id:0,nome:'Todos'},...NICHOS].map(n=>`<button class="chip ${NICHO===n.id?'on':''}" onclick="NICHO=${n.id};render()">${n.nome}</button>`).join('')}</div></div>
  ${BV==='lista'?vLista(cs):BV==='cal'?vCal(cs):`<div class="board">
    ${DB.cols.map((col,i)=>{const list=cs.filter(c=>c.col===col.id);return `
      <div class="col" data-col="${col.id}" ondragover="event.preventDefault();this.classList.add('drag')" ondragleave="this.classList.remove('drag')" ondrop="dropCard(event,'${col.id}')">
        <div class="col-h"><strong>${esc(col.nome)}</strong><span class="cnt">${list.length}</span>
          <span class="tools"><button class="icon" title="Mover para esquerda" onclick="moveCol(${i},-1)">${ic('left')}</button>
          <button class="icon" title="Mover para direita" onclick="moveCol(${i},1)">${ic('right')}</button>
          <button class="icon" title="Renomear" onclick="renameCol('${col.id}')">${ic('edit')}</button>
          <button class="icon" title="Arquivar" onclick="archiveCol('${col.id}')">${ic('archive')}</button></span></div>
        ${list.map(card).join('')||'<div class="empty">Arraste cartões para cá</div>'}
        <button class="add-card" onclick="editClient(null,'${col.id}')">${ic('plus')}Adicionar cliente</button>
      </div>`}).join('')}
    <div class="add-col"><button class="btn light full" style="margin:0" onclick="newCol()">${ic('plus')}Nova coluna</button></div>
  </div>`}`;
}
function card(c){
  const p=proxPrazo(c),late=p&&p<hoje();
  const nichos=[...new Set(c.contratos.map(x=>svc(x.serv).nicho))];
  return `<div class="card" draggable="true" ondragstart="event.dataTransfer.setData('id','${c.id}');this.classList.add('dragging')" ondragend="this.classList.remove('dragging')" onclick="openClient('${c.id}')">
    <div class="tags">${nichos.map(n=>`<span class="tag t${n}">${NICHOS[n-1].nome}</span>`).join('')}</div>
    <h4>${esc(c.nome)}</h4>
    <div class="meta"><b>${brl(total(c))}</b><span class="${late?'late':''}">${p?ic(late?'alert':'cal')+fd(p):''}</span></div>
    ${(()=>{const ck=c.contratos.flatMap(x=>x.check),d=ck.filter(k=>k.ok).length;return ck.length||c.coments.length?`<div class="foot">${ck.length?`<span title="Checklist">${ic('check')}${d}/${ck.length}</span>`:''}${c.coments.length?`<span title="Comentários">${ic('msg')}${c.coments.length}</span>`:''}</div>`:''})()}</div>`;
}
function dropCard(e,col){e.preventDefault();setCol(e.dataTransfer.getData('id'),col)}
function ask(title,val,cb){modal(`<div class="modal sm"><div class="mh"><h3>${title}</h3></div><input id="askV" value="${esc(val)}" onkeydown="if(event.key==='Enter')$('#askOk').click()"><div class="actions"><button class="btn light" onclick="closeM()">Cancelar</button><button class="btn" id="askOk">Salvar</button></div></div>`);$('#askV').focus();$('#askOk').onclick=()=>{const v=$('#askV').value.trim();if(!v)return toast('Informe um nome');cb(v);closeM()}}
function newCol(){ask('Nova coluna','',n=>{DB.cols.push({id:uid(),nome:n});save();render()})}
function renameCol(id){const c=DB.cols.find(x=>x.id===id);ask('Renomear coluna',c.nome,n=>{c.nome=n;save();render()})}
function moveCol(i,d){const j=i+d;if(j<0||j>=DB.cols.length)return;[DB.cols[i],DB.cols[j]]=[DB.cols[j],DB.cols[i]];save();render()}
function archiveCol(id){
  if(DB.cols.length<=1)return toast('O quadro precisa de pelo menos uma coluna.');if(DB.clients.some(c=>c.col===id&&c.ativo))return toast('Esvazie a coluna antes de arquivar (RN14).');
  confirmBox('A coluna será arquivada.',()=>{DB.cols=DB.cols.filter(c=>c.id!==id);save();render();toast('Coluna arquivada')},'Arquivar')
}

/* ===== Visualização em Lista (estilo ClickUp) ===== */
function progresso(c){const ck=c.contratos.flatMap(x=>x.check);if(!ck.length)return '<span style="color:var(--muted);font-size:12px">—</span>';const d=ck.filter(k=>k.ok).length;return `<div class="prog"><div class="bar"><i style="width:${d/ck.length*100}%"></i></div>${d}/${ck.length}</div>`}
function vLista(cs){
  return DB.cols.map(col=>{const list=cs.filter(c=>c.col===col.id);return `<div class="grp ${COLL[col.id]?'closed':''}">
    <div class="grp-h" onclick="COLL['${col.id}']=!COLL['${col.id}'];render()">${ic('down2')}${esc(col.nome)}<span class="cnt">${list.length}</span><span style="margin-left:auto;font-weight:500;color:var(--muted);font-size:13px">${brl(list.reduce((a,c)=>a+total(c),0))}</span></div>
    <div class="box" style="padding:4px 8px"><table><tr><th>Cliente</th><th>Serviços</th><th>Etapa</th><th>Valor</th><th>Próximo prazo</th><th>Checklist</th></tr>
    ${list.map(c=>{const p=proxPrazo(c),late=p&&p<hoje();return `<tr class="lrow" onclick="openClient('${c.id}')"><td><b>${esc(c.nome)}</b></td>
      <td><div class="tags" style="margin:0">${[...new Set(c.contratos.map(x=>svc(x.serv).nicho))].map(n=>`<span class="tag t${n}">${NICHOS[n-1].nome}</span>`).join('')||'—'}</div></td>
      <td onclick="event.stopPropagation()"><select onchange="setCol('${c.id}',this.value)">${DB.cols.map(k=>`<option value="${k.id}" ${k.id===c.col?'selected':''}>${esc(k.nome)}</option>`).join('')}</select></td>
      <td>${brl(total(c))}</td><td class="${late?'late':''}">${p?fd(p):'—'}</td><td style="min-width:130px">${progresso(c)}</td></tr>`}).join('')||`<tr><td colspan="6" class="empty">Nenhum cliente nesta etapa</td></tr>`}
    </table><button class="add-card" style="justify-content:flex-start" onclick="editClient(null,'${col.id}')">${ic('plus')}Adicionar cliente</button></div></div>`}).join('');
}
/* ===== Visualização em Calendário mensal ===== */
const EVCOR={Prazo:['#fff4e0','#f5a524'],Parcela:['#fdecef','#ef4f6b'],'Renovação':['#e0f7fc','#00b8d9'],Assinatura:['#e3f8f1','#1fbf8f'],'Entrega das chaves':['#e3f8f1','#1fbf8f']};
function vCal(cs){
  const ids=new Set(cs.map(c=>c.id)),ev=eventos().filter(e=>ids.has(e.c.id)),t=hoje();
  const base=new Date();base.setDate(1);base.setMonth(base.getMonth()+CM);
  const y=base.getFullYear(),m=base.getMonth(),start=new Date(y,m,1-new Date(y,m,1).getDay());
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  let cells='';for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const k=iso(d),es=ev.filter(e=>e.data===k);
    cells+=`<div class="d ${d.getMonth()!==m?'out':''} ${k===t?'today':''}"><span class="num">${d.getDate()}</span>${es.slice(0,3).map(e=>{const [bg,bd]=EVCOR[e.tipo]||['#efedff','#6c5ce7'];return `<button class="ev" style="background:${bg};border-color:${bd}" title="${esc(e.tipo+': '+e.c.nome+' — '+e.txt)}" onclick="openClient('${e.c.id}')">${esc(e.c.nome.split(' ')[0])} · ${esc(e.tipo)}</button>`}).join('')}${es.length>3?`<small style="color:var(--muted)">+${es.length-3} mais</small>`:''}</div>`}
  return `<div class="bar-row"><div class="cal-nav"><button class="btn light sm" onclick="CM--;render()">${ic('left')}</button><b>${(x=>x[0].toUpperCase()+x.slice(1))(base.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}))}</b><button class="btn light sm" onclick="CM++;render()">${ic('right')}</button><button class="btn light sm" onclick="CM=0;render()">Hoje</button></div>
    <div class="chips" style="margin:0">${Object.entries(EVCOR).slice(0,4).map(([k,[bg,bd]])=>`<span class="tag" style="background:${bg};color:${bd}">${k}</span>`).join('')}</div></div>
  <div class="cal">${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=>`<div class="h">${d}</div>`).join('')}${cells}</div>`;
}
