/* Ficha do cliente: cadastro, serviços contratados, parcelas, checklist, comentários e anexos */

function editClient(id,col){NEWCOL=col||'';
  const c=cli(id)||{tipo:'F',nome:'',doc:'',tel:'',email:'',origem:'',indicado:'',ativo:true};
  modal(`<div class="modal sm"><div class="mh"><h3>${id?'Editar':'Novo'} cliente</h3></div>
  <label>Tipo de pessoa</label><select id="cT"><option value="F" ${c.tipo==='F'?'selected':''}>Pessoa física</option><option value="J" ${c.tipo==='J'?'selected':''}>Pessoa jurídica</option></select>
  <label>Nome ou razão social *</label><input id="cN" value="${esc(c.nome)}">
  <label>CPF ou CNPJ</label><input id="cD" value="${esc(c.doc)}" placeholder="Opcional">
  <div class="row"><div><label>Telefone</label><input id="cTel" value="${esc(c.tel)}"></div><div><label>E-mail</label><input id="cE" value="${esc(c.email)}"></div></div>
  <div class="row"><div><label>Origem</label><select id="cO" onchange="$('#indW').classList.toggle('hidden',this.value!=='Indicação')">${['','Instagram','Indicação','Outra'].map(o=>`<option ${c.origem===o?'selected':''} value="${o}">${o||'Não informado'}</option>`).join('')}</select></div>
  <div id="indW" class="${c.origem==='Indicação'?'':'hidden'}"><label>Quem indicou</label><input id="cI" value="${esc(c.indicado)}"></div></div>
  <div id="cErr" class="err"></div>
  <div class="actions">${id?`<button class="btn danger" style="margin-right:auto" onclick="inativar('${id}')">${c.ativo?'Inativar':'Reativar'}</button>`:''}<button class="btn light" onclick="${id?`openClient('${id}')`:'closeM()'}">Cancelar</button><button class="btn" onclick="saveClient('${id||''}')">Salvar</button></div></div>`);
}
function saveClient(id){
  const d={tipo:$('#cT').value,nome:$('#cN').value.trim(),doc:$('#cD').value.trim(),tel:$('#cTel').value.trim(),email:$('#cE').value.trim(),origem:$('#cO').value,indicado:$('#cO').value==='Indicação'?$('#cI').value.trim():''};
  const err=m=>$('#cErr').textContent=m;
  if(!d.nome)return err('Informe o nome (RN01).');
  if(!d.tel&&!d.email)return err('Informe telefone ou e-mail (RN01).');
  if(!validDoc(d.doc))return err('CPF/CNPJ inválido (RN02).');
  if(id){Object.assign(cli(id),d);save();openClient(id)}
  else{const c={id:uid(),col:(DB.cols.find(k=>k.id===NEWCOL)||DB.cols[0]).id,ativo:true,criado:hoje(),contratos:[],coments:[],anexos:[],lembretes:[],...d};DB.clients.push(c);save();openClient(c.id)}
  render();
}
function inativar(id){const c=cli(id);c.ativo=!c.ativo;if(!DB.cols.some(k=>k.id===c.col))c.col=DB.cols[0].id;save();closeM();render();toast(c.ativo?'Cliente reativado':'Cliente inativado (não é excluído — RN13)')}

function openClient(id,tab){
  const c=cli(id);if(!c)return;if(tab)TAB=tab;
  const pend=c.lembretes.filter(l=>!l.ok).length;
  modal(`<div class="modal">
  <div class="dr-head">
  <div class="mh"><div class="av">${esc(c.nome[0])}</div><h3>${esc(c.nome)}</h3>${c.tel?`<a class="btn light sm" target="_blank" rel="noopener" href="${waLink(c.tel,'Olá, '+c.nome.split(' ')[0]+'! Tudo bem?')}" title="Abrir conversa no WhatsApp">${ic('wa')}WhatsApp</a>`:''}${c.email?`<a class="btn light sm" href="mailto:${esc(c.email)}" title="Enviar e-mail">${ic('mail')}E-mail</a>`:''}<button class="btn light sm" onclick="acessoCliente('${id}')" title="Link para o cliente acompanhar">${ic('link')}Acesso do cliente</button><button class="btn light sm" onclick="proposta('${id}')" title="Gerar proposta em PDF">${ic('file')}Proposta</button><button class="btn light sm" onclick="editClient('${id}')">${ic('edit')}Editar</button><button class="icon" title="Fechar (Esc)" onclick="closeM()">${ic('x')}</button></div>
  <div class="props">
    <div class="prop"><small>Etapa</small><select onchange="setCol('${id}',this.value);openClient('${id}')">${DB.cols.map(k=>`<option value="${k.id}" ${k.id===c.col?'selected':''}>${esc(k.nome)}</option>`).join('')}</select></div>
    <div class="prop"><small>Valor total</small><b>${brl(total(c))}</b></div>
    <div class="prop"><small>Contato</small>${esc(c.tel||c.email||'—')}</div>
    <div class="prop"><small>Origem</small>${esc(c.origem||'Não informada')}${c.indicado?' · '+esc(c.indicado):''}</div>
  </div>
  <div style="color:var(--muted);font-size:12px">${c.tipo==='F'?'Pessoa física':'Pessoa jurídica'}${c.doc?' · '+esc(c.doc):''}${c.email&&c.tel?' · '+esc(c.email):''}${c.ativo?'':' · <span class="late">INATIVO</span>'}</div>
  <div class="tabs">
    <button class="tab ${TAB==='serv'?'on':''}" onclick="openClient('${id}','serv')">${ic('brief')}Serviços <span class="n">${c.contratos.length}</span></button>
    <button class="tab ${TAB==='ativ'?'on':''}" onclick="openClient('${id}','ativ')">${ic('msg')}Atividade <span class="n">${c.coments.length+pend}</span></button>
    <button class="tab ${TAB==='arq'?'on':''}" onclick="openClient('${id}','arq')">${ic('clip')}Arquivos <span class="n">${c.anexos.length}</span></button>
  </div></div>
  <div class="dr-body">
  ${TAB==='serv'?`
  <div class="sec"><h5>Serviços contratados <button class="btn ghost sm" onclick="contratar('${id}')">${ic('plus')}Contratar serviço</button></h5>
  ${c.contratos.map(x=>{const s=svc(x.serv),soma=x.parcelas.reduce((a,p)=>a+p.valor,0);return `<div class="svc">
    <div class="svc-h"><span class="tag t${s.nicho}">${NICHOS[s.nicho-1].nome}</span><strong>${esc(s.nome)}</strong><b>${brl(x.valor)}</b>
      <button class="pill ${x.status==='finalizado'?'p-ok':'p-pend'}" style="border:0" title="Alterar status" onclick="toggleStatus('${id}','${x.id}')">${x.status==='finalizado'?'Finalizado':'Em andamento'}</button><button class="icon" title="Gerar contrato em PDF" onclick="contrato('${id}','${x.id}')">${ic('file')}</button><button class="icon" title="Editar datas e valor" onclick="editContr('${id}','${x.id}')">${ic('edit')}</button><button class="icon" title="Remover serviço" onclick="delContr('${id}','${x.id}')">${ic('trash')}</button></div>
    <div style="font-size:12px;color:var(--muted);margin:6px 0">${x.prazo?'Prazo: '+fd(x.prazo)+' ':''}${x.assin?'· Assinatura: '+fd(x.assin)+' ':''}${x.chaves?'· Chaves: '+fd(x.chaves)+' ':''}${x.renov?'· Renovação: '+fd(x.renov):''}</div>
    ${x.check.map(k=>`<label class="check"><input type="checkbox" ${k.ok?'checked':''} onchange="toggleCheck('${id}','${x.id}','${k.id}')"> ${esc(k.d)}</label>`).join('')}
    <div style="display:flex;gap:6px;margin:6px 0"><input placeholder="Novo item do checklist" id="ck_${x.id}" style="padding:6px 10px" onkeydown="if(event.key==='Enter')addCheck('${id}','${x.id}')"><button class="btn light sm" onclick="addCheck('${id}','${x.id}')">+</button></div>
    ${x.parcelas.map(p=>{const late=!p.paga&&p.venc<hoje();return `<div class="inst"><span>Parcela ${p.n} · ${brl(p.valor)} · vence ${fd(p.venc)}</span><span class="pill ${p.paga?'p-ok':late?'p-bad':'p-pend'}">${p.paga?'Paga':late?'Atrasada':'Pendente'}</span>${!p.paga&&c.tel?`<a class="btn light sm" target="_blank" rel="noopener" title="Lembrar o cliente pelo WhatsApp" href="${waLink(c.tel,`Olá, ${c.nome.split(' ')[0]}! Passando para lembrar da parcela ${p.n} de ${brl(p.valor)} referente a ${s.nome}, com vencimento em ${fd(p.venc)}. Qualquer dúvida, estou à disposição.`)}">${ic('wa')}Lembrar</a>`:''}<button class="btn light sm" onclick="togglePay('${id}','${x.id}','${p.id}');openClient('${id}')">${p.paga?'Desfazer':'Pagar'}</button></div>`}).join('')}
    ${x.parcelas.length&&Math.abs(soma-x.valor)>.01?`<div class="err">Atenção: soma das parcelas (${brl(soma)}) difere do valor combinado (RN11).</div>`:''}
  </div>`}).join('')||'<div class="empty">Nenhum serviço contratado ainda.</div>'}</div>

`:TAB==='ativ'?`
    <div class="sec"><h5>Lembretes</h5>
    ${c.lembretes.map(l=>`<label class="check"><input type="checkbox" ${l.ok?'checked':''} onchange="toggleRem('${id}','${l.id}')"> <span style="${l.ok?'text-decoration:line-through;color:var(--muted)':''}">${esc(l.desc)} — ${fd(l.data)} <small>(${l.tipo})</small></span></label>`).join('')}
    <input id="rD" placeholder="Ex.: Ligar para o cliente"><div class="row" style="margin-top:6px"><input type="date" id="rDt" value="${hoje()}"><select id="rT"><option value="retorno">Retorno</option><option value="prazo">Prazo</option></select></div>
    <button class="btn light sm" style="margin-top:6px" onclick="addRem('${id}')">${ic('plus')}Criar lembrete</button></div>
  <div class="sec"><h5>Histórico de conversas</h5>
    ${c.coments.slice().reverse().map(m=>`<div class="cmt">${esc(m.txt)}<br><small>${esc(m.u)} · ${esc(m.dt)}${m.pub?' · <b class="pub">visível para o cliente</b>':''}</small></div>`).join('')}
    <div style="display:flex;gap:8px"><input id="cm" placeholder="Escreva uma observação ou resumo da conversa..." onkeydown="if(event.key==='Enter')addCmt('${id}')"><button class="btn" onclick="addCmt('${id}')">Enviar</button></div>
    <label class="check" style="margin-top:8px"><input type="checkbox" id="cmPub"> Mostrar esta atualização para o cliente</label></div>

  <div class="sec"><h5>Histórico de alterações</h5>${(c.log||[]).slice().reverse().map(l=>`<div class="log">${esc(l.t)} · ${esc(l.u)} · ${esc(l.dt)}</div>`).join('')||'<div style="color:var(--muted);font-size:13px">Nenhuma alteração registrada ainda.</div>'}</div>
  `:`
  <div class="sec"><h5>Anexos</h5>
    ${c.anexos.map(a=>`<div class="inst"><span>${ic('clip')} <a href="${urlAnexo(a)}" target="_blank" rel="noopener" download="${esc(a.nome)}">${esc(a.nome)}</a></span><button class="icon" title="Remover" onclick="delAnexo('${id}','${a.id}')">${ic('x')}</button></div>`).join('')||'<div style="color:var(--muted);font-size:13px">Nenhum arquivo.</div>'}
    <label class="btn light sm" style="display:inline-flex;margin-top:8px;color:var(--ink)">${ic('clip')}Anexar arquivo<input type="file" class="hidden" onchange="addAnexo('${id}',this)"></label>
    <div style="font-size:11px;color:var(--muted);margin-top:4px">Até 1 MB por arquivo nesta versão.</div></div>`}
  </div></div>`,'dr');
}
function upd(id){save();openClient(id);render()}
function logA(c,t){(c.log=c.log||[]).push({t,u:ME?ME.nome:'',dt:fd(hoje())+' '+new Date().toTimeString().slice(0,5)})}
function setCol(id,col){const c=cli(id);if(!c||c.col===col)return;c.col=col;logA(c,'Moveu para '+(DB.cols.find(k=>k.id===col)||{}).nome);save();render()}

/* ===== Editar serviço contratado ===== */
function editContr(id,xid){
  const x=cli(id).contratos.find(x=>x.id===xid),n=svc(x.serv).nicho;
  modal(`<div class="modal sm"><div class="mh"><h3>Editar ${esc(svc(x.serv).nome)}</h3></div>
  <div class="row"><div><label>Valor combinado (R$)</label><input id="eV" type="number" step="0.01" value="${x.valor}"></div><div><label>Prazo</label><input id="eP" type="date" value="${x.prazo}"></div></div>
  ${n===2?`<div class="row"><div><label>Assinatura do contrato</label><input id="eA" type="date" value="${x.assin}"></div><div><label>Entrega das chaves</label><input id="eC" type="date" value="${x.chaves}"></div></div>`:''}
  ${n===4?`<label>Data de renovação</label><input id="eR" type="date" value="${x.renov}">`:''}
  <div class="actions"><button class="btn light" onclick="openClient('${id}')">Cancelar</button><button class="btn" onclick="saveEditContr('${id}','${xid}')">Salvar</button></div></div>`);
}
function saveEditContr(id,xid){
  const x=cli(id).contratos.find(x=>x.id===xid),v=+$('#eV').value;
  if(!(v>0))return toast('Informe o valor combinado');
  if(x.parcelas.length&&Math.abs(x.parcelas.reduce((a,p)=>a+p.valor,0)-v)>.01)return toast('O valor deve bater com a soma das parcelas (RN11)');
  x.valor=v;x.prazo=$('#eP').value;if($('#eA'))x.assin=$('#eA').value;if($('#eC'))x.chaves=$('#eC').value;if($('#eR'))x.renov=$('#eR').value;upd(id);toast('Serviço atualizado');
}

function delContr(id,xid){const c=cli(id),x=c.contratos.find(x=>x.id===xid);if(x.parcelas.some(p=>p.paga))return toast('Serviço com parcela paga não pode ser removido. Marque como finalizado.');confirmBox('O serviço e suas parcelas serão removidos deste cliente.',()=>{c.contratos=c.contratos.filter(x=>x.id!==xid);logA(c,'Removeu o serviço '+svc(x.serv).nome);upd(id)},'Remover')}
function toggleStatus(id,xid){const c=cli(id),x=c.contratos.find(x=>x.id===xid);x.status=x.status==='finalizado'?'andamento':'finalizado';logA(c,`Marcou ${svc(x.serv).nome} como ${x.status==='finalizado'?'finalizado':'em andamento'}`);upd(id)}
function toggleCheck(id,xid,kid){const k=cli(id).contratos.find(x=>x.id===xid).check.find(k=>k.id===kid);k.ok=!k.ok;save()}
function addCheck(id,xid){const v=$('#ck_'+xid).value.trim();if(!v)return;cli(id).contratos.find(x=>x.id===xid).check.push({id:uid(),d:v,ok:false});upd(id)}
function addCmt(id){const v=$('#cm').value.trim();if(!v)return;const n=new Date();cli(id).coments.push({id:uid(),u:ME.nome,txt:v,dt:fd(hoje())+' '+n.toTimeString().slice(0,5),pub:$('#cmPub').checked});upd(id)}
function addRem(id){const v=$('#rD').value.trim();if(!v)return toast('Descreva o lembrete');cli(id).lembretes.push({id:uid(),tipo:$('#rT').value,desc:v,data:$('#rDt').value||hoje(),ok:false});upd(id)}
function toggleRem(id,lid){const l=cli(id).lembretes.find(l=>l.id===lid);l.ok=!l.ok;upd(id)}
function urlAnexo(a){return a.url.startsWith('/api/')?a.url+'?t='+encodeURIComponent(TOKEN):a.url}
async function addAnexo(id,inp){
  const f=inp.files[0];if(!f)return;
  if(!API){ // sem servidor o arquivo fica no navegador, que tem pouco espaço
    if(f.size>1048576)return toast('Sem o servidor, o limite é 1 MB');
    const r=new FileReader();r.onload=()=>{cli(id).anexos.push({id:uid(),nome:f.name,url:r.result});upd(id)};return r.readAsDataURL(f);
  }
  if(f.size>20*1048576)return toast('Arquivo maior que 20 MB');
  toast('Enviando '+f.name+'...');
  try{const a=await api('/anexos?nome='+encodeURIComponent(f.name),{method:'POST',body:f});
    cli(id).anexos.push({id:a.id,nome:a.nome,url:a.url});upd(id);toast('Arquivo anexado')}
  catch(e){toast(e.message)}
}
function delAnexo(id,aid){const c=cli(id);c.anexos=c.anexos.filter(a=>a.id!==aid);upd(id)}

function contratar(id){
  modal(`<div class="modal sm"><div class="mh"><h3>Contratar serviço</h3></div>
  <label>Serviço do catálogo</label><select id="xS" onchange="nichoFields()">${DB.services.map(s=>`<option value="${s.id}" data-n="${s.nicho}">${esc(s.nome)} — ${NICHOS[s.nicho-1].nome}</option>`).join('')}</select>
  <div class="row"><div><label>Valor combinado (R$)</label><input id="xV" type="number" min="0" step="0.01" oninput="checkSum()"></div><div><label>Prazo</label><input id="xP" type="date"></div></div>
  <div id="fImovel" class="row hidden"><div><label>Assinatura do contrato</label><input id="xA" type="date"></div><div><label>Entrega das chaves</label><input id="xC" type="date"></div></div>
  <div id="fSeguro" class="hidden"><label>Data de renovação</label><input id="xR" type="date"></div>
  <label style="display:flex;justify-content:space-between;align-items:center">Parcelas <span><button class="btn light sm" onclick="autoParc()">Dividir automaticamente</button> <button class="btn ghost sm" onclick="addParc()">+ Parcela</button></span></label>
  <div id="parcs"></div><div id="sumW" class="err"></div>
  <div class="actions"><button class="btn light" onclick="openClient('${id}')">Cancelar</button><button class="btn" onclick="saveContr('${id}')">Salvar contratação</button></div></div>`);
  nichoFields();
}
function nichoFields(){const n=+$('#xS').selectedOptions[0].dataset.n;$('#fImovel').classList.toggle('hidden',n!==2);$('#fSeguro').classList.toggle('hidden',n!==4)}
function addParc(v='',d=''){const w=document.createElement('div');w.className='row parc';w.style.marginBottom='6px';w.innerHTML=`<input type="number" step="0.01" placeholder="Valor" value="${v}" oninput="checkSum()"><input type="date" value="${d}"><button class="icon" style="flex:0" onclick="this.parentNode.remove();checkSum()">${ic('x')}</button>`;$('#parcs').append(w);checkSum()}
function autoParc(){const v=+$('#xV').value;if(!v)return toast('Informe o valor primeiro');const n=+prompt('Quantas parcelas?','2');if(!n||n<1)return;$('#parcs').innerHTML='';const base=Math.floor(v/n*100)/100;for(let i=0;i<n;i++)addParc(i===n-1?(v-base*(n-1)).toFixed(2):base,addD(hoje(),30*(i+1)))}
function getParcs(){return [...document.querySelectorAll('.parc')].map((w,i)=>{const [a,b]=w.querySelectorAll('input');return {id:uid(),n:i+1,valor:+a.value||0,venc:b.value,paga:false}})}
function checkSum(){const ps=getParcs(),v=+$('#xV').value||0,s=ps.reduce((a,p)=>a+p.valor,0);$('#sumW').textContent=ps.length&&Math.abs(s-v)>.01?`Atenção: soma das parcelas ${brl(s)} difere do valor combinado ${brl(v)}.`:''}
function saveContr(id){
  const v=+$('#xV').value,ps=getParcs();
  if(!(v>0))return toast('Informe o valor combinado (RN04)');
  if(ps.some(p=>!p.venc||!p.valor))return toast('Preencha valor e vencimento das parcelas');
  if(ps.length&&Math.abs(ps.reduce((a,p)=>a+p.valor,0)-v)>.01)return toast('As parcelas devem somar o valor combinado (RN11)');
  const n=+$('#xS').selectedOptions[0].dataset.n;
  cli(id).contratos.push({id:uid(),serv:$('#xS').value,valor:v,status:'andamento',prazo:$('#xP').value,assin:n===2?$('#xA').value:'',chaves:n===2?$('#xC').value:'',renov:n===4?$('#xR').value:'',criado:hoje(),check:[],parcelas:ps});
  upd(id);toast('Serviço contratado!');
}

/* Acesso do próprio cliente: um link secreto que abre a página de acompanhamento (portal.html) */
function linkPortal(c){return location.origin+'/portal#'+c.portal}
function acessoCliente(id){
  const c=cli(id);
  if(!API)return toast('O acesso do cliente só funciona com o servidor ligado');
  if(!c.portal){c.portal=Array.from(crypto.getRandomValues(new Uint8Array(18)),b=>b.toString(16).padStart(2,'0')).join('');logA(c,'Criou o link de acesso do cliente');save()}
  const link=linkPortal(c),msg=`Olá, ${c.nome.split(' ')[0]}! Por este link você acompanha o andamento dos seus serviços: ${link}`;
  modal(`<div class="modal sm"><div class="mh"><h3>Acesso do cliente</h3></div>
  <p style="margin:0 0 12px;color:var(--muted)">Com este link, ${esc(c.nome.split(' ')[0])} vê a etapa, os serviços, o checklist, as parcelas e as atualizações marcadas como visíveis. Não precisa de senha.</p>
  <input id="plink" value="${esc(link)}" readonly onclick="this.select()">
  <div class="actions" style="flex-wrap:wrap"><button class="btn light" onclick="desativarPortal('${id}')">Desativar link</button><button class="btn light" onclick="navigator.clipboard.writeText($('#plink').value);toast('Link copiado')">${ic('copy')}Copiar</button>${c.tel?`<a class="btn" target="_blank" rel="noopener" href="${waLink(c.tel,msg)}">${ic('wa')}Enviar no WhatsApp</a>`:''}</div>
  <div style="text-align:center;margin-top:12px"><button class="link" onclick="openClient('${id}')">Voltar para a ficha</button></div></div>`);
}
function desativarPortal(id){confirmBox('O link atual vai parar de funcionar. Se precisar, depois é só gerar outro.',()=>{const c=cli(id);c.portal='';logA(c,'Desativou o link de acesso do cliente');save();openClient(id);toast('Link desativado')},'Desativar')}
