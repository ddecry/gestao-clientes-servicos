/* Página de acompanhamento do cliente: lê o link (portal#codigo) e mostra os dados vindos de /api/portal */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const brl = v => (+v || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
const fd = d => d ? d.split('-').reverse().join('/') : '';
const hoje = () => new Date().toISOString().slice(0, 10);
const view = document.getElementById('pView');

function erro(msg) {
  view.innerHTML = `<div class="p-card" style="text-align:center"><h2>Link indisponível</h2><p style="color:var(--muted)">${esc(msg)}</p></div>`;
}

function servico(s) {
  const feitos = s.checklist.filter(k => k.ok).length;
  const datas = [
    ['Prazo', s.prazo], ['Assinatura do contrato', s.assinatura],
    ['Entrega das chaves', s.chaves], ['Renovação do seguro', s.renovacao],
  ].filter(d => d[1]);
  return `<div class="p-card">
    <h2>${esc(s.nome)}</h2>
    <span class="pill ${s.status === 'finalizado' ? 'p-ok' : 'p-pend'}">${s.status === 'finalizado' ? 'Concluído' : 'Em andamento'}</span>
    ${datas.length ? `<h3>Datas</h3>${datas.map(d => `<div class="p-linha"><span>${d[0]}</span><b>${fd(d[1])}</b></div>`).join('')}` : ''}
    ${s.checklist.length ? `<h3>Etapas e documentos</h3>
      <div class="p-barra"><i style="width:${feitos / s.checklist.length * 100}%"></i></div>
      <small style="color:var(--muted)">${feitos} de ${s.checklist.length} concluídos</small>
      ${s.checklist.map(k => `<div class="p-check ${k.ok ? 'ok' : ''}"><span>${k.ok ? '✓' : ''}</span>${esc(k.item)}</div>`).join('')}` : ''}
    ${s.parcelas.length ? `<h3>Pagamentos</h3>${s.parcelas.map(p => {
      const atrasada = !p.paga && p.vencimento < hoje();
      return `<div class="p-linha"><span>${p.n}ª · ${brl(p.valor)} · vence ${fd(p.vencimento)}</span>
        <span class="pill ${p.paga ? 'p-ok' : atrasada ? 'p-bad' : 'p-pend'}">${p.paga ? 'Paga' : atrasada ? 'Atrasada' : 'A pagar'}</span></div>`;
    }).join('')}` : ''}
    <div class="p-linha"><span>Valor total</span><b>${brl(s.valor)}</b></div>
  </div>`;
}

async function abrir() {
  const codigo = location.hash.slice(1);
  if (!codigo) return erro('O endereço está incompleto. Peça um novo link para quem cuida do seu atendimento.');
  let d;
  try {
    const r = await fetch('/api/portal/' + encodeURIComponent(codigo), {cache: 'no-store'});
    d = await r.json();
    if (!r.ok) return erro(d.erro || 'Não foi possível abrir.');
  } catch (e) {
    return erro('Não foi possível conectar. Tente de novo em alguns minutos.');
  }
  if (d.empresa) document.getElementById('pEmpresa').textContent = d.empresa;
  document.title = d.nome + ' · WS Gestão';
  view.innerHTML = `
    <small style="color:var(--muted)">Acompanhamento de</small>
    <h1>${esc(d.nome)}</h1>
    ${d.etapa ? `<span class="p-etapa">${esc(d.etapa)}</span>` : ''}
    ${d.recados.length ? `<div class="p-card"><h2>Atualizações</h2>${d.recados.map(r => `<div class="p-recado">${esc(r.texto)}<small>${esc(r.data)}${r.autor ? ' · ' + esc(r.autor) : ''}</small></div>`).join('')}</div>` : ''}
    ${d.servicos.map(servico).join('') || '<div class="p-card empty">Nenhum serviço registrado ainda.</div>'}
    <div class="p-rodape">Dúvidas? Fale com ${esc(d.empresa || 'a gente')}${d.contato ? ' · ' + esc(d.contato) : ''}.</div>`;
}

abrir();
window.addEventListener('hashchange', abrir);
