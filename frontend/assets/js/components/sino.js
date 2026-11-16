/* Sino de lembretes no topo */

/* ================= SINO ================= */
function toggleBell(){
  const d=$('#bellDrop');if(!d.classList.contains('hidden'))return d.classList.add('hidden');
  const cor={prazo:'var(--warn)',parcela:'var(--bad)','renovação':'var(--n2)',retorno:'var(--pri)'};
  d.innerHTML='<b>Lembretes</b>'+(lembretes().map(l=>`<div class="rem" onclick="openClient('${l.c.id}');$('#bellDrop').classList.add('hidden')"><span class="dot" style="background:${cor[l.tipo]||'var(--pri)'}"></span><div style="flex:1"><b>${esc(l.c.nome)}</b><br>${esc(l.txt)}<br><small class="${l.data<hoje()?'late':''}" style="color:var(--muted)">${l.tipo} · ${fd(l.data)}</small></div></div>`).join('')||'<div class="empty">Nenhum lembrete pendente.</div>');
  d.classList.remove('hidden');
}
