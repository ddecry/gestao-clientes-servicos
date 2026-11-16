/* Pagamentos e relatórios */

function vPayments(){
  const t=hoje(),rows=[];
  DB.clients.forEach(c=>c.contratos.forEach(x=>x.parcelas.forEach(p=>rows.push({c,x,p}))));
  rows.sort((a,b)=>a.p.venc.localeCompare(b.p.venc));
  const rec=rows.filter(r=>r.p.paga).reduce((a,r)=>a+r.p.valor,0),pend=rows.filter(r=>!r.p.paga).reduce((a,r)=>a+r.p.valor,0),atr=rows.filter(r=>!r.p.paga&&r.p.venc<t).reduce((a,r)=>a+r.p.valor,0);
  $('#view').innerHTML=`<div class="grid"><div class="box kpi"><small>Recebido</small><span class="ki">${ic('check')}</span><div style="color:var(--ok)">${brl(rec)}</div></div><div class="box kpi"><small>A receber</small><span class="ki">${ic('cal')}</span><div>${brl(pend)}</div></div><div class="box kpi"><small>Em atraso</small><span class="ki">${ic('alert')}</span><div style="color:var(--bad)">${brl(atr)}</div></div></div>
  <div class="box tw"><table><tr><th>Cliente</th><th>Serviço / parcela</th><th>Vencimento</th><th class="r">Valor</th><th>Situação</th><th></th></tr>
  ${rows.map(r=>{const late=!r.p.paga&&r.p.venc<t;return `<tr><td class="nw"><a href="#" onclick="openClient('${r.c.id}');return false">${esc(r.c.nome)}</a></td><td>${esc(svc(r.x.serv).nome)}<br><small style="color:var(--muted)">Parcela ${r.p.n}</small></td><td class="${late?'late':''}">${fd(r.p.venc)}</td><td class="r nw">${brl(r.p.valor)}</td>
    <td><span class="pill ${r.p.paga?'p-ok':late?'p-bad':'p-pend'}">${r.p.paga?'Paga':late?'Atrasada':'Pendente'}</span></td><td><button class="btn light sm" onclick="togglePay('${r.c.id}','${r.x.id}','${r.p.id}')">${r.p.paga?'Desfazer':'Receber'}</button></td></tr>`}).join('')||'<tr><td colspan=6 class="empty">Nenhuma parcela</td></tr>'}</table></div>`;
}
function togglePay(cid,xid,pid){const p=cli(cid).contratos.find(x=>x.id===xid).parcelas.find(p=>p.id===pid);p.paga=!p.paga;p.dataPag=p.paga?hoje():'';save();render()}

function vReports(){
  if(!isAdmin())return $('#view').innerHTML='<div class="box empty">Apenas administradores.</div>';
  const t=hoje(),org={},sv={},mes={};let atras=[];
  DB.clients.forEach(c=>{const o=c.origem||'Não informado';org[o]=(org[o]||0)+1;
    c.contratos.forEach(x=>{const s=svc(x.serv).nome;sv[s]=(sv[s]||0)+1;if(x.status==='andamento'&&x.prazo&&x.prazo<t)atras.push({c,x});
      x.parcelas.forEach(p=>{if(p.paga){const m=(p.dataPag||p.venc).slice(0,7);mes[m]=(mes[m]||0)+p.valor}})})});
  const bars=(o,fmt=v=>v)=>{const e=Object.entries(o).sort((a,b)=>b[1]-a[1]),mx=Math.max(1,...e.map(x=>x[1]));return e.map(([k,v])=>`<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:12px"><span>${esc(k)}</span><b style="white-space:nowrap">${fmt(v)}</b></div><div class="bar"><i style="width:${v/mx*100}%"></i></div></div>`).join('')||'<div class="empty">Sem dados</div>'};
  const fech=DB.clients.filter(c=>c.col==='c4').length,perd=DB.clients.filter(c=>c.col==='c5').length;
  $('#view').innerHTML=`<div class="grid">
    <div class="box kpi"><small>Clientes ativos</small><span class="ki">${ic('users')}</span><div>${DB.clients.filter(c=>c.ativo).length}</div></div>
    <div class="box kpi"><small>Propostas fechadas</small><span class="ki">${ic('check')}</span><div>${fech}</div></div>
    <div class="box kpi"><small>Perdidas</small><span class="ki">${ic('x')}</span><div>${perd}</div></div>
    <div class="box kpi"><small>Serviços em atraso</small><span class="ki">${ic('alert')}</span><div style="color:var(--bad)">${atras.length}</div></div></div>
  <div class="grid">
    <div class="box"><h4 style="margin-top:0">Clientes por origem</h4>${bars(org)}</div>
    <div class="box"><h4 style="margin-top:0">Serviços mais vendidos</h4>${bars(sv)}</div>
    <div class="box"><h4 style="margin-top:0">Faturamento por mês</h4>${bars(Object.fromEntries(Object.entries(mes).sort().map(([k,v])=>[(x=>x[0].toUpperCase()+x.slice(1))(new Date(k+'-15').toLocaleDateString('pt-BR',{month:'short',year:'numeric'}).replace('.','').replace(' de ',' ')),v])),brl)}</div></div>
  <div class="box"><h4 style="margin-top:0">Serviços em atraso</h4>${atras.map(a=>`<div class="inst"><span>${esc(a.c.nome)} — ${esc(svc(a.x.serv).nome)}</span><span class="late">${fd(a.x.prazo)}</span></div>`).join('')||'<div class="empty">Nenhum serviço em atraso.</div>'}</div>`;
}
