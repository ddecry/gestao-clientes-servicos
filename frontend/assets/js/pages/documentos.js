/* WhatsApp, e-mail, proposta e contrato em PDF */

/* ===== WhatsApp / e-mail (sem servidor: abre o app do usuário) ===== */
function waLink(tel,msg){let d=(tel||'').replace(/\D/g,'');if(d.length<=11)d='55'+d;return `https://wa.me/${d}?text=${encodeURIComponent(msg)}`}

/* ===== Proposta e contrato em PDF (via impressão do navegador) ===== */
function printDoc(title,body){
  const w=window.open('','_blank');if(!w)return toast('Permita pop-ups para gerar o documento');
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
  body{font-family:Arial,Helvetica,sans-serif;color:#222;max-width:760px;margin:32px auto;padding:0 28px;line-height:1.6;font-size:13.5px}
  h1{font-size:20px;margin:0}h2{font-size:14px;margin:22px 0 6px;text-transform:uppercase}.hd{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1d2140;padding-bottom:12px;margin-bottom:22px}
  .hd small{color:#666}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #ccc;padding:7px 9px;text-align:left}th{background:#f2f2f6}td.r,th.r{text-align:right}
  .sign{display:flex;gap:48px;margin-top:70px}.sign div{flex:1;border-top:1px solid #222;text-align:center;padding-top:6px;font-size:12px}
  .np{text-align:center;margin-bottom:20px}.np button{font:inherit;padding:10px 18px;border:0;border-radius:8px;background:#6c5ce7;color:#fff;cursor:pointer}@media print{.np{display:none}body{margin:0 auto}}
  </style></head><body><div class="np"><button onclick="print()">Salvar como PDF / Imprimir</button></div>${body}</body></html>`);
  w.document.close();
}
function hdDoc(t){const C=DB.config;return `<div class="hd"><div><h1>${esc(t)}</h1><small>${esc(C.empresa)}${C.doc?' · '+esc(C.doc):''}${C.contato?' · '+esc(C.contato):''}</small></div><small>${esc(C.cidade)}, ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}</small></div>`}
function parcTable(x){return x.parcelas.length?`<table><tr><th>Parcela</th><th>Vencimento</th><th class="r">Valor</th></tr>${x.parcelas.map(p=>`<tr><td>${p.n}</td><td>${fd(p.venc)}</td><td class="r">${brl(p.valor)}</td></tr>`).join('')}</table>`:'<p>Pagamento à vista, na assinatura.</p>'}
function proposta(id){
  const c=cli(id),xs=c.contratos.filter(x=>x.status==='andamento');
  if(!xs.length)return toast('Contrate ao menos um serviço em andamento para gerar a proposta');
  const tot=xs.reduce((a,x)=>a+x.valor,0);
  printDoc('Proposta - '+c.nome,`${hdDoc('Proposta comercial')}
  <p><b>Para:</b> ${esc(c.nome)}${c.doc?' — '+esc(c.doc):''}<br>${esc(c.tel)}${c.email?' · '+esc(c.email):''}</p>
  <p>Prezado(a), apresentamos abaixo a proposta para os serviços solicitados.</p>
  <table><tr><th>Serviço</th><th>Descrição</th><th>Prazo</th><th class="r">Valor</th></tr>
  ${xs.map(x=>{const s=svc(x.serv);return `<tr><td>${esc(s.nome)}</td><td>${esc(s.descricao)}</td><td>${fd(x.prazo)}</td><td class="r">${brl(x.valor)}</td></tr>`}).join('')}
  <tr><th colspan="3">Total</th><th class="r">${brl(tot)}</th></tr></table>
  ${xs.filter(x=>x.parcelas.length).map(x=>`<h2>Pagamento — ${esc(svc(x.serv).nome)}</h2>${parcTable(x)}`).join('')}
  <p style="margin-top:22px">Proposta válida por 15 dias a partir desta data.</p>
  <div class="sign"><div>${esc(DB.config.empresa)}</div><div>${esc(c.nome)}<br>De acordo</div></div>`);
}
function contrato(id,xid){
  const c=cli(id),x=c.contratos.find(x=>x.id===xid),s=svc(x.serv),C=DB.config;
  const extra=[x.prazo&&`prazo de conclusão previsto para ${fd(x.prazo)}`,x.assin&&`assinatura do contrato do imóvel em ${fd(x.assin)}`,x.chaves&&`entrega das chaves em ${fd(x.chaves)}`,x.renov&&`renovação da apólice em ${fd(x.renov)}`].filter(Boolean);
  printDoc('Contrato - '+c.nome,`${hdDoc('Contrato de prestação de serviços')}
  <p><b>CONTRATANTE:</b> ${esc(c.nome)}, ${c.tipo==='F'?'pessoa física':'pessoa jurídica'}${c.doc?', inscrita sob o nº '+esc(c.doc):''}, telefone ${esc(c.tel||'—')}${c.email?', e-mail '+esc(c.email):''}.</p>
  <p><b>CONTRATADA:</b> ${esc(C.empresa)}${C.doc?', inscrita sob o nº '+esc(C.doc):''}, com atuação em ${esc(C.cidade)}.</p>
  <p>As partes acima identificadas firmam o presente contrato, que se regerá pelas cláusulas a seguir.</p>
  <h2>Cláusula 1ª — Do objeto</h2><p>Prestação do serviço de <b>${esc(s.nome)}</b> (${esc(NICHOS[s.nicho-1].nome.toLowerCase())})${s.descricao?': '+esc(s.descricao):''}.</p>
  <h2>Cláusula 2ª — Do valor e pagamento</h2><p>Pelo serviço, a CONTRATANTE pagará o valor total de <b>${brl(x.valor)}</b>, conforme abaixo:</p>${parcTable(x)}
  <h2>Cláusula 3ª — Dos prazos</h2><p>${extra.length?'Ficam estabelecidos: '+extra.join('; ')+'.':'O serviço será executado em prazo combinado entre as partes.'}</p>
  <h2>Cláusula 4ª — Das obrigações</h2><p>A CONTRATADA compromete-se a executar o serviço com zelo e a manter a CONTRATANTE informada sobre o andamento. A CONTRATANTE compromete-se a fornecer os documentos e informações necessários e a efetuar os pagamentos nas datas acordadas.</p>
  <h2>Cláusula 5ª — Dos dados pessoais</h2><p>Os dados pessoais da CONTRATANTE serão utilizados exclusivamente para a execução deste contrato, conforme a Lei nº 13.709/2018 (LGPD).</p>
  <h2>Cláusula 6ª — Do foro</h2><p>Fica eleito o foro da comarca de ${esc(C.cidade)} para dirimir quaisquer dúvidas oriundas deste contrato.</p>
  <div class="sign"><div>${esc(C.empresa)}<br>CONTRATADA</div><div>${esc(c.nome)}<br>CONTRATANTE</div></div>`);
}
