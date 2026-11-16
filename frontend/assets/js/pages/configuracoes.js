/* Usuários, dados da empresa e backup */

function vUsers(){
  if(!isAdmin())return $('#view').innerHTML='<div class="box empty">Apenas administradores.</div>';
  $('#view').innerHTML=`<div class="box" style="margin-bottom:16px"><b>Dados da empresa</b><p style="color:var(--muted);margin:4px 0 0;font-size:13px">Aparecem nas propostas e contratos gerados.</p>
  <div class="row"><div><label>Nome / razão social</label><input value="${esc(DB.config.empresa)}" onchange="DB.config.empresa=this.value;save()"></div><div><label>CPF / CNPJ</label><input value="${esc(DB.config.doc)}" onchange="DB.config.doc=this.value;save()"></div></div>
  <div class="row"><div><label>Cidade</label><input value="${esc(DB.config.cidade)}" onchange="DB.config.cidade=this.value;save()"></div><div><label>Telefone / e-mail</label><input value="${esc(DB.config.contato)}" onchange="DB.config.contato=this.value;save()"></div></div></div>
  <div class="box" style="margin-bottom:16px;display:flex;gap:16px;align-items:center"><span style="flex:1">Antecedência do lembrete de renovação de seguros</span><input type="number" style="width:90px" value="${DB.config.antecedencia}" onchange="DB.config.antecedencia=+this.value||30;save();toast('Salvo')"> dias</div>
  <div style="margin-bottom:12px"><button class="btn ghost" onclick="editUser()">${ic('plus')}Novo usuário</button></div>
  <div class="box"><table><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th></th></tr>
  ${DB.users.map(u=>`<tr><td><b>${esc(u.nome)}</b></td><td>${esc(u.email)}</td><td>${u.perfil[0].toUpperCase()+u.perfil.slice(1)}</td><td><span class="pill ${u.ativo?'p-ok':'p-bad'}">${u.ativo?'Ativo':'Inativo'}</span>${u.pedido?' <span class="pill p-pend">Pediu nova senha</span>':''}</td>
   <td style="white-space:nowrap;text-align:right"><button class="btn ${u.pedido?'':'light'} sm" onclick="redefinir('${u.id}')">${ic('key')}Redefinir senha</button> ${u.id!==ME.id?`<button class="btn light sm" onclick="toggleUser('${u.id}')">${u.ativo?'Inativar':'Ativar'}</button>`:''}</td></tr>`).join('')}</table></div>
  <div class="box" style="margin-top:16px"><b>Backup dos dados</b><p style="color:var(--muted);margin:6px 0 12px">Exporte uma cópia de segurança ou restaure a partir de um arquivo.</p>
  <button class="btn light" onclick="exportar()">${ic('down')}Exportar backup</button> <label class="btn light" style="display:inline-flex;margin:0;color:var(--ink)">${ic('up')}Importar<input type="file" accept=".json" class="hidden" onchange="importar(this)"></label>
  <button class="btn danger" onclick="confirmBox('Todos os dados serão apagados e substituídos pelos dados de exemplo.',()=>{const us=DB.users;DB=seed();if(API)DB.users=us;save();render();toast('Dados de exemplo restaurados')},'Apagar tudo')">Restaurar exemplo</button></div>`;
}
function editUser(){
  modal(`<div class="modal sm"><div class="mh"><h3>Novo usuário</h3></div><label>Nome</label><input id="uN"><label>E-mail</label><input id="uE" type="email"><label>Senha</label><input id="uS" type="password">
  <label>Perfil</label><select id="uP"><option value="assistente">Assistente</option><option value="administrador">Administrador</option></select>
  <div class="actions"><button class="btn light" onclick="closeM()">Cancelar</button><button class="btn" onclick="saveUser()">Salvar</button></div></div>`);
}
async function saveUser(){
  const n=$('#uN').value.trim(),e=$('#uE').value.trim().toLowerCase(),s=$('#uS').value;
  if(!n||!e||s.length<6)return toast('Preencha tudo (senha com 6+ caracteres)');
  if(DB.users.some(u=>u.email===e))return toast('E-mail já cadastrado');
  if(API){try{await api('/usuarios',{method:'POST',body:JSON.stringify({nome:n,email:e,senha:s,perfil:$('#uP').value})});await carregar();closeM();render();toast('Usuário criado')}catch(err){toast(err.message)}return}
  DB.users.push({id:uid(),nome:n,email:e,senha:await hash(s),perfil:$('#uP').value,ativo:true});save();closeM();render();
}
function toggleUser(id){const u=DB.users.find(x=>x.id===id);u.ativo=!u.ativo;save();render()}
function exportar(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(DB,null,1)],{type:'application/json'}));a.download='backup-crm-'+hoje()+'.json';a.click()}
function importar(inp){const f=inp.files[0];if(!f)return;f.text().then(t=>{try{const d=JSON.parse(t);if(!d.clients)throw 0;const us=DB.users;DB=d;if(API)DB.users=us;fixCfg();save();render();toast('Backup restaurado')}catch(e){toast('Arquivo inválido')}})}
