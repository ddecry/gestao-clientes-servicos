/* Ponto de entrada: verifica o servidor e abre a sessão salva */

(async()=>{
  try{API=(await fetch('/api/ping',{cache:'no-store'})).ok}catch(e){API=false}
  const st=$('#modo');if(st)st.innerHTML=API?'<span class="dot" style="background:var(--ok)"></span>Conectado ao banco de dados':'<span class="dot" style="background:var(--warn)"></span>Modo local (dados no navegador)';
  if(!ME)return;
  if(API){if(!TOKEN){limparSessao();ME=null;return}try{await carregar();start()}catch(e){}}else start();
})();
