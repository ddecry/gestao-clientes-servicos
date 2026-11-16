/* Estado da aplicação, sessão e comunicação com a API */

/* ================= PERSISTÊNCIA =================
   Com o servidor (backend/server.py) os dados ficam no banco SQLite (database/crm.db).
   Aberto direto pelo arquivo, funciona em "modo local" guardando no navegador. */
let API=false,TOKEN=sessionStorage.getItem('crm_tok')||localStorage.getItem('crm_tok')||'',_st=null;
let DB=JSON.parse(localStorage.getItem(KEY)||'null')||seed();
function fixCfg(){DB.config=Object.assign({antecedencia:30,empresa:'Wilma Silva Soares',doc:'',cidade:'Teresina - PI',contato:''},DB.config)}
fixCfg();
function save(){
  if(!API){try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){toast('Armazenamento cheio: remova anexos grandes')}return}
  clearTimeout(_st);_st=setTimeout(sync,200);
}
async function api(path,opt={}){
  const r=await fetch('/api'+path,{...opt,headers:{'Content-Type':'application/json',Authorization:'Bearer '+TOKEN}});
  const j=await r.json().catch(()=>({}));
  if(r.status===401&&path!=='/login'&&path!=='/senha'){limparSessao();location.reload();throw new Error('Sessão expirada')}
  if(!r.ok)throw new Error(j.erro||'Erro '+r.status);return j;
}
async function sync(){try{await api('/dados',{method:'PUT',body:JSON.stringify(DB)})}catch(e){toast('Não foi possível salvar no banco: '+e.message)}}
async function carregar(){
  const d=await api('/dados');
  if(d.vazio){DB=seed();DB.users=d.users;fixCfg();await api('/dados',{method:'PUT',body:JSON.stringify(DB)})}
  else{DB=d;fixCfg()}
}
let ME=JSON.parse(sessionStorage.getItem('crm_me')||localStorage.getItem('crm_me')||'null');
function limparSessao(){sessionStorage.clear();localStorage.removeItem('crm_tok');localStorage.removeItem('crm_me')}
function guardarSessao(){const st=$('#lRem')&&$('#lRem').checked?localStorage:sessionStorage;st.setItem('crm_tok',TOKEN);st.setItem('crm_me',JSON.stringify(ME))}
let VIEW='board',NICHO=0,BV='quadro',TAB='serv',NEWCOL='',CM=0,TF='pend',COLL={};
