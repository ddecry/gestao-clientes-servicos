/* Login, recuperação e troca de senha */

/* ================= LOGIN ================= */
async function doLogin(e){
  e.preventDefault();
  const em=$('#lEmail').value.trim().toLowerCase();
  if(API){try{const j=await api('/login',{method:'POST',body:JSON.stringify({email:em,senha:$('#lPass').value})});
    TOKEN=j.token;ME=j.usuario;guardarSessao();await carregar();start()}
    catch(err){$('#lErr').textContent=err.message}return false}
  const h=await hash($('#lPass').value);
  const u=DB.users.find(u=>u.email===em&&u.senha===h&&u.ativo);
  if(!u){$('#lErr').textContent='E-mail ou senha inválidos.';return false}
  ME={id:u.id,nome:u.nome,perfil:u.perfil};guardarSessao();start();return false;
}
/* ===== Recuperação e troca de senha ===== */
function showForgot(on){$('#fLogin').classList.toggle('hidden',on);$('#fForgot').classList.toggle('hidden',!on);$('#fMsg').innerHTML='';if(on){$('#fEmail').value=$('#lEmail').value;$('#fEmail').focus()}}
async function doForgot(e){
  e.preventDefault();const em=$('#fEmail').value.trim().toLowerCase();
  if(API){try{await api('/esqueci',{method:'POST',body:JSON.stringify({email:em})})}catch(err){$('#fMsg').innerHTML=`<div class="err">${esc(err.message)}</div>`;return false}}
  else{const u=DB.users.find(u=>u.email===em);if(u){u.pedido=true;save()}}
  $('#fMsg').innerHTML='<div class="ok-box">Pedido enviado ao administrador.</div>';return false;
}
function minhaConta(){
  modal(`<div class="modal sm"><div class="mh"><h3>Alterar minha senha</h3></div>
  <label>Senha atual</label><input id="pA" type="password" autocomplete="current-password">
  <label>Nova senha</label><input id="pN" type="password" autocomplete="new-password" placeholder="Mínimo de 6 caracteres">
  <label>Confirmar nova senha</label><input id="pC" type="password" autocomplete="new-password">
  <div id="pErr" class="err"></div>
  <div class="actions"><button class="btn light" onclick="closeM()">Cancelar</button><button class="btn" onclick="trocarSenha()">Salvar</button></div></div>`);
}
async function trocarSenha(){
  const a=$('#pA').value,n=$('#pN').value,c=$('#pC').value,err=m=>$('#pErr').textContent=m;
  if(n.length<6)return err('A nova senha precisa ter pelo menos 6 caracteres.');if(n!==c)return err('As senhas não conferem.');
  if(API){try{await api('/senha',{method:'POST',body:JSON.stringify({atual:a,nova:n})})}catch(e){return err(e.message)}}
  else{const u=DB.users.find(u=>u.id===ME.id);if(u.senha!==await hash(a))return err('Senha atual incorreta.');u.senha=await hash(n);save()}
  closeM();toast('Senha alterada');
}
function redefinir(id){
  const u=DB.users.find(x=>x.id===id);
  modal(`<div class="modal sm"><div class="mh"><h3>Nova senha para ${esc(u.nome)}</h3></div><p style="color:var(--muted);margin:0">Defina uma senha provisória e passe para a pessoa. Ela pode trocá-la depois em "Alterar minha senha".</p>
  <label>Nova senha</label><input id="rN" type="text" placeholder="Mínimo de 6 caracteres">
  <div class="actions"><button class="btn light" onclick="closeM()">Cancelar</button><button class="btn" onclick="salvarRedef('${id}')">Redefinir</button></div></div>`);
}
async function salvarRedef(id){
  const n=$('#rN').value;if(n.length<6)return toast('Mínimo de 6 caracteres');
  if(API){try{await api('/usuarios/senha',{method:'POST',body:JSON.stringify({id,nova:n})});await carregar()}catch(e){return toast(e.message)}}
  else{const u=DB.users.find(x=>x.id===id);u.senha=await hash(n);u.pedido=false;save()}
  closeM();render();toast('Senha redefinida');
}

async function logout(){if(API)try{await api('/logout',{method:'POST'})}catch(e){}limparSessao();ME=null;location.reload()}
function start(){
  $('#login').classList.add('hidden');$('#app').classList.remove('hidden');
  $('#meName').textContent=ME.nome;$('#meRole').textContent=ME.perfil[0].toUpperCase()+ME.perfil.slice(1);$('#meAv').textContent=ME.nome.split(' ').map(p=>p[0]).slice(0,2).join('');
  document.querySelectorAll('.admin').forEach(b=>b.classList.toggle('hidden',!isAdmin()));
  render();
}
document.addEventListener('click',e=>{if(!e.target.closest('.me-w'))$('#meMenu').classList.add('hidden')});
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{VIEW=b.dataset.v;$('#bellDrop').classList.add('hidden');$('#meMenu').classList.add('hidden');render()});
