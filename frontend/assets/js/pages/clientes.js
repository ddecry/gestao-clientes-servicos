/* Lista de clientes */

let FC={st:'',org:'',serv:''};
function vClients(){
  const q=$('#q').value.toLowerCase(),all=DB.clients.filter(c=>(!q||c.nome.toLowerCase().includes(q))&&(!FC.st||(FC.st==='ativo')===c.ativo)&&(!FC.org||(c.origem||'')===FC.org)&&(!FC.serv||c.contratos.some(x=>x.serv===FC.serv)));
  const sel=(k,opts)=>`<select onchange="FC.${k}=this.value;render()">${opts.map(([v,t])=>`<option value="${v}" ${FC[k]===v?'selected':''}>${t}</option>`).join('')}</select>`;
  $('#view').innerHTML=`<div class="filters">${sel('st',[['','Todas as situações'],['ativo','Ativos'],['inativo','Inativos']])}${sel('org',[['','Todas as origens'],['Instagram','Instagram'],['Indicação','Indicação'],['Outra','Outra']])}${sel('serv',[['','Todos os serviços'],...DB.services.map(s=>[s.id,s.nome])])}</div><div class="box"><table><tr><th>Cliente</th><th>Contato</th><th>Origem</th><th>Serviços</th><th>Total</th><th>Situação</th></tr>
  ${all.map(c=>`<tr style="cursor:pointer" onclick="openClient('${c.id}')"><td><b>${esc(c.nome)}</b><br><small style="color:var(--muted)">${c.tipo==='F'?'Pessoa física':'Pessoa jurídica'}</small></td>
    <td><span class="nw">${esc(c.tel)}</span><br><small style="color:var(--muted)">${esc(c.email)}</small></td><td>${esc(c.origem||'—')}${c.indicado?'<br><small style="color:var(--muted)">por '+esc(c.indicado)+'</small>':''}</td>
    <td>${c.contratos.length}</td><td>${brl(total(c))}</td><td><span class="pill ${c.ativo?'p-ok':'p-bad'}">${c.ativo?'Ativo':'Inativo'}</span></td></tr>`).join('')||'<tr><td colspan=6 class="empty">Nenhum cliente</td></tr>'}</table></div>`;
}
