/* Tarefas e compromissos, com exportação .ics */

/* ===== Tarefas (checklists + lembretes de todos os clientes) ===== */
function tarefas(){
  const out=[];DB.clients.filter(c=>c.ativo).forEach(c=>{
    c.contratos.forEach(x=>x.check.forEach(k=>out.push({c,kind:'check',x,k,txt:k.d,ok:k.ok,data:x.prazo||'',tipo:svc(x.serv).nome})));
    c.lembretes.forEach(l=>out.push({c,kind:'rem',l,txt:l.desc,ok:l.ok,data:l.data,tipo:l.tipo[0].toUpperCase()+l.tipo.slice(1)}));
  });
  return out.sort((a,b)=>(a.data||'9').localeCompare(b.data||'9'));
}
function toggleTask(cid,kind,a,b){const c=cli(cid);if(kind==='check'){const k=c.contratos.find(x=>x.id===a).check.find(k=>k.id===b);k.ok=!k.ok}else{const l=c.lembretes.find(l=>l.id===a);l.ok=!l.ok}save();render()}
function addTask(){
  const t=$('#tkT').value.trim(),cid=$('#tkC').value;if(!t)return toast('Descreva a tarefa');if(!cid)return toast('Escolha o cliente');
  cli(cid).lembretes.push({id:uid(),tipo:'tarefa',desc:t,data:$('#tkD').value||hoje(),ok:false});save();render();toast('Tarefa criada')
}
function vTasks(){
  const t=hoje(),q=$('#q').value.toLowerCase(),all=tarefas().filter(x=>!q||x.txt.toLowerCase().includes(q)||x.c.nome.toLowerCase().includes(q));
  const f={pend:x=>!x.ok,hoje:x=>!x.ok&&x.data&&x.data<=t,ok:x=>x.ok}[TF],list=all.filter(f);
  const cnt=k=>all.filter({pend:x=>!x.ok,hoje:x=>!x.ok&&x.data&&x.data<=t,ok:x=>x.ok}[k]).length;
  $('#view').innerHTML=`<div class="bar-row"><div class="vt">${[['pend','Pendentes'],['hoje','Hoje e atrasadas'],['ok','Concluídas']].map(([k,n])=>`<button class="${TF===k?'on':''}" onclick="TF='${k}';render()">${n} <span style="opacity:.7">${cnt(k)}</span></button>`).join('')}</div></div>
  <div class="box" style="padding:0">
    <div class="quick"><input type="text" id="tkT" placeholder="Nova tarefa... (ex.: Pedir certidão no cartório)" onkeydown="if(event.key==='Enter')addTask()">
      <select id="tkC"><option value="">Cliente...</option>${DB.clients.filter(c=>c.ativo).map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join('')}</select>
      <input type="date" id="tkD" value="${t}"><button class="btn" onclick="addTask()">${ic('plus')}Adicionar</button></div>
    ${list.map(x=>{const late=!x.ok&&x.data&&x.data<t;return `<div class="task ${x.ok?'done':''}"><input type="checkbox" ${x.ok?'checked':''} onchange="toggleTask('${x.c.id}','${x.kind}','${x.kind==='check'?x.x.id:x.l.id}','${x.kind==='check'?x.k.id:''}')">
      <div class="t"><span>${esc(x.txt)}</span><br><small>${esc(x.tipo)}</small></div>
      <span class="cli-chip" onclick="openClient('${x.c.id}')">${esc(x.c.nome)}</span>
      <span style="width:90px;text-align:right;font-size:12px" class="${late?'late':''}">${x.data?fd(x.data):'—'}</span></div>`}).join('')||'<div class="empty">Nenhuma tarefa aqui.</div>'}
  </div>`;
}

/* ===== Agenda + exportação para calendário (.ics) ===== */
function eventos(){
  const ev=[];DB.clients.filter(c=>c.ativo).forEach(c=>{
    c.contratos.forEach(x=>{const n=svc(x.serv).nome;
      if(x.status==='andamento'&&x.prazo)ev.push({c,data:x.prazo,tipo:'Prazo',txt:n});
      if(x.assin)ev.push({c,data:x.assin,tipo:'Assinatura',txt:n});
      if(x.chaves)ev.push({c,data:x.chaves,tipo:'Entrega das chaves',txt:n});
      if(x.renov)ev.push({c,data:x.renov,tipo:'Renovação',txt:n});
      x.parcelas.forEach(p=>{if(!p.paga)ev.push({c,data:p.venc,tipo:'Parcela',txt:`${p.n} · ${brl(p.valor)} · ${n}`})});
    });
    c.lembretes.forEach(l=>{if(!l.ok)ev.push({c,data:l.data,tipo:l.tipo[0].toUpperCase()+l.tipo.slice(1),txt:l.desc})});
  });
  return ev.filter(e=>e.data).sort((a,b)=>a.data.localeCompare(b.data));
}
function vAgenda(){
  const t=hoje(),ev=eventos(),q=$('#q').value.toLowerCase(),list=ev.filter(e=>!q||e.c.nome.toLowerCase().includes(q));
  const grupos={};list.forEach(e=>{const k=e.data<t?'Atrasados':e.data;(grupos[k]=grupos[k]||[]).push(e)});
  const cor={Prazo:'var(--warn)',Parcela:'var(--bad)','Renovação':'var(--n2)',Assinatura:'var(--n4)','Entrega das chaves':'var(--n4)'};
  const dia=d=>d==='Atrasados'?'Atrasados':d===t?'Hoje':d===addD(t,1)?'Amanhã':(s=>s[0].toUpperCase()+s.slice(1))(new Date(d+'T12:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'}));
  $('#view').innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px;flex-wrap:wrap"><span style="color:var(--muted)">${list.length} compromisso(s) pendente(s)</span>
  <button class="btn ghost" onclick="exportIcs()" title="Importe no Google Agenda, Outlook ou celular">${ic('down')}Exportar para calendário (.ics)</button></div>
  ${Object.entries(grupos).map(([k,es])=>`<div class="box" style="margin-bottom:12px"><h4 style="margin:0 0 6px" class="${k==='Atrasados'?'late':''}">${dia(k)}</h4>
    ${es.map(e=>`<div class="rem" onclick="openClient('${e.c.id}')"><span class="dot" style="background:${cor[e.tipo]||'var(--pri)'}"></span><div style="flex:1"><b>${esc(e.c.nome)}</b> — ${esc(e.txt)}<br><small style="color:var(--muted)">${esc(e.tipo)}${k==='Atrasados'?' · '+fd(e.data):''}</small></div></div>`).join('')}</div>`).join('')||'<div class="box empty">Nenhum compromisso pendente.</div>'}`;
}
function exportIcs(){
  const z=s=>String(s).replace(/[\\;,]/g,m=>'\\'+m).replace(/\n/g,' ');
  const st=new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Gestao Clientes e Servicos//PT-BR','CALSCALE:GREGORIAN'];
  eventos().forEach((e,i)=>{const d=e.data.replace(/-/g,''),d2=addD(e.data,1).replace(/-/g,'');
    L.push('BEGIN:VEVENT','UID:'+e.c.id+'-'+i+'-'+d+'@gestao','DTSTAMP:'+st,'DTSTART;VALUE=DATE:'+d,'DTEND;VALUE=DATE:'+d2,'SUMMARY:'+z(e.tipo+' - '+e.c.nome),'DESCRIPTION:'+z(e.txt),'END:VEVENT')});
  L.push('END:VCALENDAR');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([L.join('\r\n')],{type:'text/calendar'}));a.download='agenda-'+hoje()+'.ics';a.click();toast('Agenda exportada');
}
