/* Funções de apoio: formatação, validação e lembretes */

/* ================= HELPERS ================= */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl=v=>(+v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const fd=d=>d?d.split('-').reverse().join('/'):'—';
const svc=id=>DB.services.find(s=>s.id===id)||{nome:'(removido)',nicho:1};
const cli=id=>DB.clients.find(c=>c.id===id);
const total=c=>c.contratos.reduce((a,x)=>a+(+x.valor||0),0);
const isAdmin=()=>ME&&ME.perfil==='administrador';
function toast(m){document.querySelectorAll('.toast').forEach(t=>t.remove());const d=document.createElement('div');d.className='toast';d.innerHTML=ic('check')+'<span></span>';d.lastChild.textContent=m;document.body.append(d);setTimeout(()=>d.remove(),2200)}
function proxPrazo(c){
  const ds=[];c.contratos.forEach(x=>{if(x.status==='andamento'&&x.prazo)ds.push(x.prazo);x.parcelas.forEach(p=>{if(!p.paga)ds.push(p.venc)})});
  c.lembretes.forEach(l=>{if(!l.ok)ds.push(l.data)});return ds.sort()[0]||'';
}
function validDoc(v){
  v=(v||'').replace(/\D/g,'');if(!v)return true;
  if(v.length===11){if(/^(\d)\1+$/.test(v))return false;let s=0;for(let i=0;i<9;i++)s+=v[i]*(10-i);let d=(s*10)%11%10;if(d!=v[9])return false;s=0;for(let i=0;i<10;i++)s+=v[i]*(11-i);return (s*10)%11%10==v[10]}
  if(v.length===14){if(/^(\d)\1+$/.test(v))return false;const calc=n=>{let s=0,p=n-7;for(let i=0;i<n;i++){s+=v[i]*p--;if(p<2)p=9}const r=s%11;return r<2?0:11-r};return calc(12)==v[12]&&calc(13)==v[13]}
  return false;
}

/* Lembretes automáticos (RF20, RF21, RN12) */
function lembretes(){
  const t=hoje(),lim=addD(t,DB.config.antecedencia),out=[];
  DB.clients.filter(c=>c.ativo).forEach(c=>{
    c.contratos.forEach(x=>{
      const s=svc(x.serv);
      if(x.status==='andamento'&&x.prazo&&x.prazo<=addD(t,7))out.push({c,tipo:'prazo',data:x.prazo,txt:`Prazo de "${s.nome}"`});
      if(x.renov&&x.renov<=lim)out.push({c,tipo:'renovação',data:x.renov,txt:`Renovação do seguro "${s.nome}"`});
      x.parcelas.forEach(p=>{if(!p.paga&&p.venc<=addD(t,5))out.push({c,tipo:'parcela',data:p.venc,txt:`Parcela ${p.n} de ${brl(p.valor)}`})});
    });
    c.lembretes.forEach(l=>{if(!l.ok&&l.data<=addD(t,3))out.push({c,tipo:l.tipo,data:l.data,txt:l.desc})});
  });
  return out.sort((a,b)=>a.data.localeCompare(b.data));
}
