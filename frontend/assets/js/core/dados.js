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
    clients:[
      {id:'k1',col:'c3',tipo:'F',nome:'Maria Oliveira',doc:'',tel:'(86) 99999-1111',email:'maria@email.com',origem:'Instagram',indicado:'',ativo:true,criado:addD(t,-40),
       contratos:[{id:'x1',serv:'s2',valor:12000,status:'andamento',prazo:addD(t,5),assin:addD(t,10),chaves:addD(t,30),renov:'',criado:addD(t,-40),
         check:[{id:uid(),d:'Avaliação do imóvel',ok:true},{id:uid(),d:'Documentação do vendedor',ok:false}],
         parcelas:[{id:uid(),n:1,valor:6000,venc:addD(t,-20),paga:true},{id:uid(),n:2,valor:6000,venc:addD(t,-2),paga:false}]}],
       coments:[{id:uid(),u:'Wilma Soares',txt:'Cliente pediu visita no sábado.',dt:addD(t,-3)+' 10:20'}],anexos:[],lembretes:[{id:uid(),tipo:'retorno',desc:'Ligar para confirmar visita',data:t,ok:false}]},
      {id:'k2',col:'c2',tipo:'J',nome:'Padaria Pão Quente LTDA',doc:'',tel:'(86) 3222-0000',email:'',origem:'Indicação',indicado:'João Lima',ativo:true,criado:addD(t,-15),
       contratos:[{id:'x2',serv:'s1',valor:3500,status:'andamento',prazo:addD(t,12),assin:'',chaves:'',renov:'',criado:addD(t,-15),check:[],parcelas:[{id:uid(),n:1,valor:3500,venc:addD(t,12),paga:false}]}],
       coments:[],anexos:[],lembretes:[]},
      {id:'k3',col:'c4',tipo:'F',nome:'Carlos Mendes',doc:'',tel:'(86) 98888-2222',email:'carlos@email.com',origem:'Indicação',indicado:'Maria Oliveira',ativo:true,criado:addD(t,-300),
       contratos:[{id:'x3',serv:'s5',valor:1800,status:'finalizado',prazo:'',assin:'',chaves:'',renov:addD(t,20),criado:addD(t,-300),check:[],parcelas:[{id:uid(),n:1,valor:900,venc:addD(t,-60),paga:true},{id:uid(),n:2,valor:900,venc:addD(t,-30),paga:true}]}],
       coments:[],anexos:[],lembretes:[]},
      {id:'k4',col:'c1',tipo:'F',nome:'Ana Beatriz',doc:'',tel:'(86) 97777-3333',email:'',origem:'Instagram',indicado:'',ativo:true,criado:t,
       contratos:[{id:'x4',serv:'s4',valor:450,status:'andamento',prazo:addD(t,3),assin:'',chaves:'',renov:'',criado:t,check:[{id:uid(),d:'Receber CRV assinado',ok:false}],parcelas:[]}],
       coments:[],anexos:[],lembretes:[]}]
  };
}
