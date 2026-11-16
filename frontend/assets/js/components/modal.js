/* Janelas (modal), confirmação e atalhos de teclado */

/* ================= MODAIS ================= */
function modal(h,cls=''){const keep=cls==='dr'&&$('#modalRoot .ov.dr');$('#modalRoot').innerHTML=`<div class="ov ${cls}" style="${keep?'animation:none':''}" onclick="if(event.target===this)closeM()">${h}</div>`;if(keep)$('#modalRoot .modal').style.animation='none';const f=$('#modalRoot .modal input:not([type=checkbox]):not([type=file]),#modalRoot .modal select');if(f&&cls!=='dr')f.focus()}
let _cb=null;
function confirmBox(msg,cb,ok='Confirmar'){_cb=cb;modal(`<div class="modal sm confirm"><div class="ci">${ic('alert')}</div><h3 style="margin:0 0 6px">Tem certeza?</h3><p style="color:var(--muted);margin:0">${msg}</p><div class="actions"><button class="btn light" onclick="closeM()">Cancelar</button><button class="btn" style="background:var(--bad)" onclick="closeM();_cb&&_cb()">${ok}</button></div></div>`)}
function closeM(){$('#modalRoot').innerHTML=''}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if($('#modalRoot').innerHTML)closeM();else $('#bellDrop').classList.add('hidden');return}
  if(!ME||/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)||$('#modalRoot').innerHTML)return;
  if(e.key==='n'||e.key==='N'){e.preventDefault();editClient()}
  if(e.key==='/'){e.preventDefault();$('#q').focus()}
});
