/* Catálogo de serviços */

function vServices(){
  $('#view').innerHTML=`<div style="margin-bottom:12px"><button class="btn ghost" onclick="editService()">${ic('plus')}Novo serviço</button></div>
  <div class="box"><table><tr><th>Serviço</th><th>Nicho</th><th>Descrição</th><th></th></tr>
  ${DB.services.map(s=>`<tr><td><b>${esc(s.nome)}</b></td><td><span class="tag t${s.nicho}">${NICHOS[s.nicho-1].nome}</span></td><td>${esc(s.descricao)}</td><td><button class="btn light sm" onclick="editService('${s.id}')">Editar</button></td></tr>`).join('')}</table>
  <p style="color:var(--muted);font-size:12px">O valor é definido em cada contratação (RN04).</p></div>`;
}
function editService(id){
  const s=DB.services.find(x=>x.id===id)||{nome:'',descricao:'',nicho:1};
  modal(`<div class="modal sm"><div class="mh"><h3>${id?'Editar':'Novo'} serviço</h3></div>
    <label>Nome</label><input id="sN" value="${esc(s.nome)}"><label>Nicho</label><select id="sNi">${NICHOS.map(n=>`<option value="${n.id}" ${s.nicho==n.id?'selected':''}>${n.nome}</option>`).join('')}</select>
    <label>Descrição</label><textarea id="sD" rows=3>${esc(s.descricao)}</textarea>
    <div class="actions"><button class="btn light" onclick="closeM()">Cancelar</button><button class="btn" onclick="saveService('${id||''}')">Salvar</button></div></div>`);
}
function saveService(id){
  const n=$('#sN').value.trim();if(!n)return toast('Informe o nome');
  const d={nome:n,descricao:$('#sD').value,nicho:+$('#sNi').value};
  if(id)Object.assign(DB.services.find(x=>x.id===id),d);else DB.services.push({id:uid(),...d});save();closeM();render();
}
