/* Constantes, funções de data e dados de exemplo */

const NICHOS=[
  {id:1,nome:'Assessoria comercial'},{id:2,nome:'Compra e venda de imóveis'},
  {id:3,nome:'Despachante documentalista'},{id:4,nome:'Seguros'}];
const KEY='crm_wilma_v1';
const hoje=()=>new Date().toISOString().slice(0,10);
const addD=(d,n)=>{const x=new Date(d+'T12:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
const uid=()=>Math.random().toString(36).slice(2,9);
async function hash(s){if(!(window.crypto&&crypto.subtle)){alert('Abra o sistema pelo Chrome, Edge ou Firefox atualizados.');throw new Error('no subtle')}const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}

function seed(){
  const t=hoje();
  return {
    config:{antecedencia:30,empresa:'Wilma Silva Soares',doc:'',cidade:'Teresina - PI',contato:''},
    users:[
      {id:'u1',nome:'Wilma Soares',email:'admin@crm.com',senha:'240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',perfil:'administrador',ativo:true},
      {id:'u2',nome:'Assistente',email:'assistente@crm.com',senha:'8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',perfil:'assistente',ativo:true}],
    cols:[
      {id:'c1',nome:'Novo contato'},{id:'c2',nome:'Em negociação'},{id:'c6',nome:'Aguardando documento'},
      {id:'c3',nome:'Em andamento'},{id:'c4',nome:'Finalizado'},{id:'c5',nome:'Perdido'}],
    services:[
      {id:'s1',nome:'Assessoria para abertura de empresa',descricao:'Orientação comercial completa',nicho:1},
      {id:'s2',nome:'Venda de imóvel',descricao:'Intermediação de venda',nicho:2},
      {id:'s3',nome:'Compra de imóvel',descricao:'Busca e negociação de imóvel',nicho:2},
      {id:'s4',nome:'Transferência de veículo',descricao:'Documentação no DETRAN',nicho:3},
      {id:'s5',nome:'Seguro auto',descricao:'Cotação e contratação',nicho:4},
      {id:'s6',nome:'Seguro residencial',descricao:'Cotação e contratação',nicho:4}],
    clients:[],apolices:[]
  };
}
