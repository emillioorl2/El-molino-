
/* ---------- Bienvenida / configuración inicial ---------- */
const OB=['Bienvenida','Tu dinero hoy','Ingresos y metas','Préstamos y créditos','Tarjetas de crédito','Suscripciones','Listo'];
function obHTML(){
  const st=U.ob.step,s=S.settings;
  const steps=`<ol class="ob-steps">${OB.map((n,i)=>`<li class="${i<st?'done':i===st?'cur':''}"><span class="n">${i<st?'✓':i+1}</span><span class="t">${n}</span></li>`).join('')}</ol>`;
  let body='';
  const yesNo=(k,q)=>`<p style="font-weight:600;margin-bottom:10px">${q}</p><div class="ob-q"><button class="btn" data-a="obHas" data-k="${k}" data-v="1" aria-pressed="${U.ob.has[k]===true}">Sí</button><button class="btn" data-a="obHas" data-k="${k}" data-v="0" aria-pressed="${U.ob.has[k]===false}">No</button></div>`;
  const added=(arr,fn,kind)=>arr.length?`<div class="added">${arr.map(x=>`<div class="it"><div><b style="font-weight:600">${esc(x.name)}</b><div class="m">${fn(x)}</div></div><button class="btn ghost sm" data-a="obDel" data-k="${kind}" data-id="${x.id}" aria-label="Quitar">${icon('del')}</button></div>`).join('')}</div>`:'';
  switch(st){
    case 0:body=`<h1>Organiza tu dinero en un solo lugar</h1><p class="lead">Te haremos unas preguntas para armar tu libreta: cuánto tienes hoy, cuánto ganas, qué debes y qué pagas cada mes. Tarda unos 3 minutos y puedes cambiar todo después.</p>
      <div class="form" style="max-width:420px">${field({k:'name',l:'¿Cómo te llamas?',ph:'Tu nombre'},s.name,'o_')}</div>
      <div class="ob-nav"><button class="btn ghost" data-a="loadExample">Ver con datos de ejemplo</button><button class="btn primary" data-a="obNext">Empezar</button></div>`;break;
    case 1:body=`<h1>¿Cuánto dinero tienes hoy?</h1><p class="lead">Suma tu efectivo y lo que tienes en tu cuenta de débito. Es tu balance inicial: desde aquí se cuentan tus ingresos y gastos.</p>
      ${formHTML([SET_F[2],SET_F[1]],s,'o_')}`;break;
    case 2:body=`<h1>Tus ingresos y metas</h1><p class="lead">Con esto calculamos cuánto te entra por semana y cuánto puedes gastar en el día a día.</p>${formHTML(SET_F.slice(3),s,'o_')}`;break;
    case 3:body=`<h1>Préstamos, créditos o hipoteca</h1><p class="lead">Agrega cada préstamo que estés pagando. Con la cuota y el número de pagos calculamos cuánto interés pagas y cuánto te falta.</p>
      ${yesNo('loans','¿Tienes algún préstamo, crédito o hipoteca por pagar?')}
      ${U.ob.has.loans?`${added(S.loans,l=>`${money(l.payment)} ${FREQ_L[l.freq]} · ${l.n} pagos`,'loan')}<div class="panel" id="obForm"><h3 style="margin-bottom:12px">${S.loans.length?'Agregar otro':'Agregar préstamo'}</h3>${formHTML(LOAN_F,{kind:LOAN_KINDS[0],freq:'quincenal',paidInit:0,nextDate:today()},'n_')}<div class="row" style="margin-top:14px"><button class="btn" data-a="obAdd" data-k="loan">${icon('plus')}Agregar</button><span class="err" id="obErr"></span></div></div>`:''}`;break;
    case 4:body=`<h1>Tarjetas de crédito</h1><p class="lead">Por cada tarjeta necesitamos el límite, el día de corte, el día límite de pago y cuánto debes hoy.</p>
      ${yesNo('cards','¿Tienes tarjetas de crédito?')}
      ${U.ob.has.cards?`${added(S.cards,c=>`Límite ${money0(c.limit)} · debes ${money(c.balance)} · corte el ${c.cutDay} · pago el ${c.dueDay} de cada mes`,'card')}<div class="panel" id="obForm"><h3 style="margin-bottom:12px">${S.cards.length?'Agregar otra':'Agregar tarjeta'}</h3>${formHTML(CARD_F,{},'n_')}<div class="row" style="margin-top:14px"><button class="btn" data-a="obAdd" data-k="card">${icon('plus')}Agregar</button><span class="err" id="obErr"></span></div></div>`:''}`;break;
    case 5:body=`<h1>Suscripciones y pagos fijos</h1><p class="lead">Streaming, teléfono, gimnasio, renta… todo lo que se cobra cada mes.</p>
      ${yesNo('subs','¿Tienes suscripciones o pagos fijos mensuales?')}
      ${U.ob.has.subs?`${added(S.subs,x=>`${money(x.amount)} · día ${x.day} · ${esc(methodName(x.method))}`,'sub')}<div class="panel" id="obForm"><h3 style="margin-bottom:12px">${S.subs.length?'Agregar otra':'Agregar suscripción'}</h3>${formHTML(subF(),{cat:'Suscripciones',method:'Efectivo'},'n_')}<div class="row" style="margin-top:14px"><button class="btn" data-a="obAdd" data-k="sub">${icon('plus')}Agregar</button><span class="err" id="obErr"></span></div></div>`:''}`;break;
    case 6:body=`<h1>Listo${s.name?', '+esc(s.name):''}</h1><p class="lead">Tu libreta está armada. Desde ahora solo agrega cada movimiento con el botón “+ Movimiento”.</p>
      <div class="kpis" style="margin-bottom:10px">${kpi('Dinero hoy',M(s.initialBalance))}${kpi('Te entra por semana',M(expectedWeekly()))}${kpi('Tarjetas',`<span class="num">${S.cards.length}</span>`,S.cards.length?`Debes ${money(cardTotals().used)}`:'')}${kpi('Préstamos',`<span class="num">${S.loans.length}</span>`,S.loans.length?`Por pagar ${money(loanTotals())}`:'')}${kpi('Suscripciones',`<span class="num">${S.subs.length}</span>`,S.subs.length?`${money(sum(S.subs,x=>x.amount))} al mes`:'')}</div>`;break}
  const nav=st===0?'':`<div class="ob-nav"><button class="btn ghost" data-a="obBack">Atrás</button><button class="btn primary" data-a="${st===6?'obFinish':'obNext'}">${st===6?'Ir a mi resumen':'Siguiente'}</button></div>`;
  const dir=U.obDir||0;U.obDir=0;
  body=body.replace(/<h1>(.*?)<\/h1>/,(m,t)=>`<h1 class="split" aria-label="${t.replace(/<[^>]+>/g,'')}">${t.split(' ').map((w,i)=>`<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ')}</h1>`);
  return `<div class="ob"><aside class="ob-side"><div class="brand"><span class="brand-mark">${icon('windmill')}</span><div><b>El Molino</b><span>finanzas personales</span></div></div>${steps}<div style="margin-top:auto">${themeSeg()}</div></aside><main class="ob-main${dir?' enter':''}" style="--dx:${dir<0?-36:36}px">${body}${nav}</main></div>`}
function obHarvest(){const st=U.ob.step,root=document.querySelector('.ob-main');if(!root)return true;
  const fs=st===0?[{k:'name'}]:st===1?[SET_F[2],SET_F[1]]:st===2?SET_F.slice(3):null;
  if(fs){const{o}=readForm(root,fs,'o_');for(const k in o){if(o[k]!=null&&o[k]!=='')S.settings[k]=o[k];else if(['initialBalance','incomeAmount','extraMin','extraMax','dailyGoal','emergency'].includes(k))S.settings[k]=0}save();return true}
  if(st>=3&&st<=5&&root.querySelector('#obForm')){const k=['loan','card','sub'][st-3];const nm=root.querySelector('#n_name');if(nm&&nm.value.trim())return obAdd(k)}
  return true}
function obAdd(k){const root=document.querySelector('#obForm');const fs=k==='loan'?LOAN_F:k==='card'?CARD_F:subF();const{o,errs}=readForm(root,fs,'n_');
  if(errs.length){const e=document.getElementById('obErr');if(e)e.textContent='Falta: '+errs.join(', ');return false}
  addEntity(k,o);render();return true}
function addEntity(k,o,id){
  if(k==='card'){const dayOf=v=>v?parse(v).getDate():null;const c={id:id||uid(),name:o.name,limit:+o.limit||0,balance:+o.balance||0,cutDay:dayOf(o.cutDate)||o.cutDay||1,dueDay:dayOf(o.dueDate)||o.dueDay||1,cutAnchor:o.cutDate||null,dueAnchor:o.dueDate||null,noInt:o.noInt,baseDate:today()};
    if(id){const old=S.cards.find(x=>x.id===id);const cur=Math.round(cardStats(old).used*100)/100;if(Math.abs(cur-c.balance)<0.005&&old.noInt==o.noInt){c.balance=old.balance;c.baseDate=old.baseDate}Object.assign(old,c)}else S.cards.push(c)}
  if(k==='loan'){const l={id:id||uid(),name:o.name,kind:o.kind,original:+o.original||0,payment:+o.payment||0,freq:o.freq,n:Math.max(1,Math.round(+o.n||1)),paidInit:Math.max(0,Math.round(+o.paidInit||0)),nextDate:o.nextDate||today(),capital:o.capital};
    if(id)Object.assign(S.loans.find(x=>x.id===id),l);else S.loans.push(l)}
  if(k==='sub'){const s={id:id||uid(),name:o.name,amount:+o.amount||0,day:o.day,method:o.method,cat:o.cat||'Suscripciones'};if(id)Object.assign(S.subs.find(x=>x.id===id),s);else S.subs.push(s)}
  save()}

/* ---------- Datos de ejemplo ---------- */
function exampleData(){const d=blank(),t=today(),a=n=>addDays(t,-n);d.setupDone=true;d.example=true;
  Object.assign(d.settings,{name:'',startDate:a(20),initialBalance:6200,incomeAmount:3800,incomeFreq:'semanal',extraFreq:'semanal',extraMin:600,extraMax:850,dailyGoal:100,emergency:1500});
  d.cards=[{id:'c1',name:'Tarjeta Azul',limit:18000,balance:3400,cutDay:12,dueDay:2,noInt:2900,baseDate:a(20)},{id:'c2',name:'Tarjeta Verde',limit:6000,balance:1850,cutDay:25,dueDay:15,noInt:null,baseDate:a(20)}];
  d.loans=[{id:'l1',name:'Préstamo personal',kind:'Préstamo personal',original:10000,payment:2150,freq:'quincenal',n:6,paidInit:1,nextDate:nextDayOfMonth(t,15),capital:null}];
  d.lent=[{id:'p1',name:'Karla',contact:'55 1234 5678',amount:1500,dateGiven:a(15),dueDate:a(1),method:'Efectivo',installments:false,instAmount:null,instFreq:null,remind:true,reminderDate:a(1),txId:'tp1'}];
  d.savings=[{id:'sv1',name:'Vacaciones',bank:'Débito',startAmount:2000,rate:0.08,visible:true,createdDate:a(20)}];
  d.subs=[{id:'s1',name:'Streaming de video',amount:219,day:5,method:'card:c2',cat:'Suscripciones'},{id:'s2',name:'Música',amount:129,day:18,method:'card:c2',cat:'Suscripciones'},{id:'s3',name:'Plan de celular',amount:300,day:10,method:'card:c1',cat:'Suscripciones'},{id:'s4',name:'Gimnasio',amount:450,day:1,method:'Débito',cat:'Suscripciones'}];
  const T=(n,type,cat,desc,amount,method,x={})=>({id:uid(),ts:n,date:a(n),type,cat,desc,amount,method,...x});
  d.txs=[T(19,'Ingreso','Sueldo','Pago semanal',3800,'Débito'),T(18,'Gasto','Comida','Comida del trabajo',85,'Efectivo'),T(17,'Ingreso','Ingresos extra','Trabajo extra',540,'Efectivo'),T(16,'Gasto','Transporte','Camión y metro',60,'Efectivo'),
    T(14,'Gasto','Ocio','Cine',260,'card:c1'),T(12,'Ingreso','Sueldo','Pago semanal',3800,'Débito'),T(12,'Gasto','Pago de préstamo','Cuota préstamo',2150,'Débito',{target:'l1',loanKind:'cuota'}),T(11,'Gasto','Comida','Súper',640,'card:c1'),
    T(10,'Gasto','Suscripciones','Plan de celular',300,'card:c1',{subId:'s3'}),T(9,'Ingreso','Ingresos extra','Venta',610,'Efectivo'),T(8,'Gasto','Ropa y personal','Tenis',1800,'card:c1',{msi:6}),T(6,'Gasto','Comida','Desayuno',70,'Efectivo'),
    T(5,'Ingreso','Sueldo','Pago semanal',3800,'Débito'),T(5,'Gasto','Pago de tarjetas','Pago Tarjeta Verde',1200,'Débito',{target:'c2'}),T(4,'Gasto','Gasolina','Gasolina',400,'Débito'),T(3,'Gasto','Ocio','Salida con amigos',520,'Efectivo'),
    T(2,'Ingreso','Ingresos extra','Comisión',480,'Efectivo'),T(1,'Gasto','Comida','Tacos',95,'Efectivo'),T(0,'Gasto','Transporte','Uber',120,'card:c2'),
    {id:'tp1',ts:15,date:a(15),type:'Gasto',cat:'Préstamos a terceros',desc:'Préstamo a Karla',amount:1500,method:'Efectivo',target:'p1'}];
  return d}

/* ---------- Modales ---------- */
function openTx(draft){U.modal={kind:'tx',d:Object.assign({type:'Gasto',date:today(),amount:null,cat:'Comida',desc:'',method:'Efectivo',msi:false,months:3,target:'',loanKind:'cuota'},draft)};render()}
function txModal(){const d=U.modal.d,cats=S.categories.filter(c=>c.type===d.type),ms=methods();
  if(!cats.some(c=>c.name===d.cat))d.cat=cats[0]?cats[0].name:'';
  const isCard=!isCash(d.method),cg=cat(d.cat),payCard=d.cat==='Pago de tarjetas',payLoan=cg&&cg.group==='Deuda'&&!payCard,lendCat=cg&&cg.group==='Prestado';
  const jarCat=cg&&cg.group==='Ahorro'&&(d.cat==='Depósito a caja de ahorro'||d.cat==='Retiro de caja de ahorro');
  return `<div class="modal-head"><h2>${d.id?'Editar movimiento':'Nuevo movimiento'}</h2><div class="seg"><button data-a="txType" data-v="Gasto" aria-pressed="${d.type==='Gasto'}">Gasto</button><button data-a="txType" data-v="Ingreso" aria-pressed="${d.type==='Ingreso'}">Ingreso</button></div></div>
   <div class="form" id="txForm">
    ${field({k:'amount',l:'Monto',t:'money',req:1},d.amount,'t_')}${field({k:'date',l:'Fecha',t:'date'},d.date,'t_')}
    ${field({k:'cat',l:'Categoría',t:'select',ch:'txRe',opts:cats.map(c=>c.name)},d.cat,'t_')}
    ${field({k:'method',l:d.type==='Ingreso'?'¿Dónde entró?':'Método de pago',t:'select',ch:'txRe',opts:(d.type==='Ingreso'?ms.filter(m=>m.cash):ms).map(m=>[m.id,m.name])},d.method,'t_')}
    ${field({k:'desc',l:'Descripción',ph:'Ej. comida, transporte, Amazon',wide:true},d.desc,'t_')}
    ${payCard?(S.cards.length?field({k:'target',l:'¿A qué tarjeta pagaste?',t:'select',opts:S.cards.map(c=>[c.id,c.name])},d.target,'t_'):`<p class="err fld wide">Primero agrega una tarjeta en “Tarjetas y deudas”.</p>`):''}
    ${payLoan?(S.loans.length?field({k:'target',l:'¿A qué préstamo?',t:'select',opts:S.loans.map(l=>[l.id,l.name])},d.target,'t_')+field({k:'loanKind',l:'Tipo de pago',t:'select',opts:[['cuota','Cuota normal'],['abono','Abono extra a capital']]},d.loanKind,'t_'):`<p class="err fld wide">Primero agrega un préstamo en “Tarjetas y deudas”.</p>`):''}
    ${lendCat?(S.lent.length?field({k:'target',l:'¿Con quién?',t:'select',opts:S.lent.map(l=>[l.id,l.name])},d.target,'t_'):`<p class="err fld wide">Primero agrega un préstamo en “Préstamos”.</p>`):''}
    ${jarCat?(S.savings.length?field({k:'target',l:'¿A qué caja de ahorro?',t:'select',opts:S.savings.map(j=>[j.id,j.name])},d.target,'t_'):`<p class="err fld wide">Primero agrega una caja en “Caja de ahorros”.</p>`):''}
    ${d.type==='Gasto'&&isCard&&!payCard?field({k:'msi',l:'Compra a meses sin intereses',t:'check',ch:'txRe'},d.msi,'t_')+(d.msi?field({k:'months',l:'Número de meses',t:'select',opts:[3,6,9,12,18,24]},d.months,'t_'):''):''}
   </div><p class="err" id="txErr"></p>
   <div class="modal-foot">${d.id?`<button class="btn danger" data-a="delTx" data-id="${d.id}" style="margin-right:auto">${icon('del')}Borrar</button>`:''}<button class="btn ghost" data-a="modalClose">Cancelar</button><button class="btn primary" data-a="saveTx">${d.id?'Guardar cambios':'Guardar'}</button></div>`}
const TXF=[{k:'amount',t:'money'},{k:'date'},{k:'cat'},{k:'method'},{k:'desc'},{k:'target'},{k:'loanKind'},{k:'msi',t:'check'},{k:'months',t:'number'}];
function harvestTx(){const f=document.getElementById('txForm');if(!f)return;const{o}=readForm(f,TXF,'t_');Object.assign(U.modal.d,o)}
function saveTx(){harvestTx();const d=U.modal.d,e=document.getElementById('txErr');
  if(!(d.amount>0)){e.textContent='Escribe un monto mayor a cero.';return}
  const cg=cat(d.cat);if(cg&&cg.group==='Deuda'&&!d.target){e.textContent='Elige a qué tarjeta o préstamo va el pago.';return}
  if(cg&&cg.group==='Prestado'&&!d.target){e.textContent='Elige a quién corresponde este préstamo.';return}
  const jarCatSave=cg&&cg.group==='Ahorro'&&(d.cat==='Depósito a caja de ahorro'||d.cat==='Retiro de caja de ahorro');
  if(jarCatSave&&!d.target){e.textContent='Elige a qué caja de ahorro corresponde.';return}
  const t={id:d.id||uid(),ts:Date.now(),date:d.date||today(),type:d.type,cat:d.cat,desc:d.desc,amount:+d.amount,method:d.method};
  if(cg&&cg.group==='Deuda'){t.target=d.target;if(d.cat!=='Pago de tarjetas')t.loanKind=d.loanKind||'cuota'}
  if(cg&&cg.group==='Prestado')t.target=d.target;
  if(jarCatSave)t.target=d.target;
  if(d.type==='Gasto'&&!isCash(d.method)&&d.msi)t.msi=+d.months||3;
  if(d.subId)t.subId=d.subId;
  if(d.id){const i=S.txs.findIndex(x=>x.id===d.id);if(i>=0){t.ts=S.txs[i].ts;S.txs[i]=t}}else S.txs.push(t);
  U.modal=null;save();render();toast(d.id?'Movimiento actualizado':'Movimiento guardado')}
function entityModal(){const m=U.modal,fs=m.kind==='card'?CARD_F:m.kind==='loan'?LOAN_F:m.kind==='sub'?subF():[{k:'name',l:'Nombre',req:1},{k:'type',l:'Tipo',t:'select',opts:['Gasto','Ingreso']},{k:'group',l:'Grupo',t:'select',opts:Object.entries(GROUPS)}];
  const title={card:'tarjeta',loan:'préstamo',sub:'suscripción',cat:'categoría'}[m.kind];
  return `<div class="modal-head"><h2>${m.id?'Editar':'Agregar'} ${title}</h2><button class="btn ghost sm" data-a="modalClose" aria-label="Cerrar">✕</button></div><div id="entForm">${formHTML(fs,m.v||{},'e_')}</div><p class="err" id="entErr"></p>
   <div class="modal-foot"><button class="btn ghost" data-a="modalClose">Cancelar</button><button class="btn primary" data-a="saveEnt">Guardar</button></div>`}
function saveEnt(){const m=U.modal,fs=m.kind==='card'?CARD_F:m.kind==='loan'?LOAN_F:m.kind==='sub'?subF():[{k:'name',req:1,l:'Nombre'},{k:'type'},{k:'group'}];
  const{o,errs}=readForm(document.getElementById('entForm'),fs,'e_');if(errs.length){document.getElementById('entErr').textContent='Falta: '+errs.join(', ');return}
  if(m.kind==='cat'){if(cat(o.name)){document.getElementById('entErr').textContent='Ya existe esa categoría.';return}S.categories.push({name:o.name,type:o.type,group:o.type==='Ingreso'&&o.group!=='Neutral'?'Ingreso':o.group});save()}
  else addEntity(m.kind,o,m.id);U.modal=null;render();toast('Guardado')}
function openLent(draft){U.modal={kind:'lent',d:Object.assign({name:'',contact:'',amount:null,method:'Efectivo',dateGiven:today(),dueDate:today(),installments:false,instAmount:null,instFreq:'quincenal',remind:false,reminderDate:today()},draft)};render()}
function lentModal(){const d=U.modal.d;
  return `<div class="modal-head"><h2>${d.id?'Editar préstamo':'Nuevo préstamo'}</h2></div>
   <div class="form" id="lentForm">
    ${field({k:'name',l:'Nombre de la persona',req:1},d.name,'l_')}
    ${field({k:'contact',l:'Número de contacto',ph:'Opcional'},d.contact,'l_')}
    ${field({k:'amount',l:'Monto prestado',t:'money',req:1},d.amount,'l_')}
    ${field({k:'method',l:'¿De dónde salió el dinero?',t:'select',opts:methods().map(m=>[m.id,m.name])},d.method,'l_')}
    ${field({k:'dateGiven',l:'Fecha en que prestaste el dinero',t:'date',req:1},d.dateGiven,'l_')}
    ${field({k:'dueDate',l:'Fecha en la que se acordó que te pagara',t:'date',req:1},d.dueDate,'l_')}
    ${field({k:'installments',l:'Se acordó pagar a plazos',t:'check',ch:'lentRe'},d.installments,'l_')}
    ${d.installments?field({k:'instAmount',l:'¿Cuánto se acordó cobrar por plazo?',t:'money',req:1},d.instAmount,'l_')+field({k:'instFreq',l:'¿Cada cuándo se cobra ese plazo?',t:'select',opts:LENT_FREQ},d.instFreq,'l_'):''}
    ${field({k:'remind',l:'Fijar un recordatorio para cobrar',t:'check',ch:'lentRe'},d.remind,'l_')}
    ${d.remind?field({k:'reminderDate',l:'Fecha del recordatorio',t:'date',req:1},d.reminderDate,'l_'):''}
   </div><p class="err" id="lentErr"></p>
   <div class="modal-foot">${d.id?`<button class="btn danger" data-a="delLent" data-id="${d.id}" style="margin-right:auto">${icon('del')}Borrar</button>`:''}<button class="btn ghost" data-a="modalClose">Cancelar</button><button class="btn primary" data-a="saveLent">${d.id?'Guardar cambios':'Guardar'}</button></div>`}
const LENT_F=[{k:'name'},{k:'contact'},{k:'amount',t:'money'},{k:'method'},{k:'dateGiven',t:'date'},{k:'dueDate',t:'date'},{k:'installments',t:'check'},{k:'instAmount',t:'money'},{k:'instFreq'},{k:'remind',t:'check'},{k:'reminderDate',t:'date'}];
function harvestLent(){const f=document.getElementById('lentForm');if(!f)return;const{o}=readForm(f,LENT_F,'l_');Object.assign(U.modal.d,o)}
function saveLent(){harvestLent();const d=U.modal.d,e=document.getElementById('lentErr');
  if(!d.name){e.textContent='Escribe el nombre de la persona.';return}
  if(!(d.amount>0)){e.textContent='Escribe un monto mayor a cero.';return}
  if(d.installments&&!(d.instAmount>0)){e.textContent='Escribe cuánto se acordó cobrar por plazo.';return}
  ensureCat('Préstamos a terceros','Gasto','Prestado');ensureCat('Cobro de préstamo','Ingreso','Prestado');
  const isNew=!d.id,id=d.id||uid();
  const l={id,name:d.name,contact:d.contact,amount:+d.amount,dateGiven:d.dateGiven||today(),dueDate:d.dueDate||today(),method:d.method||'Efectivo',
    installments:!!d.installments,instAmount:d.installments?+d.instAmount:null,instFreq:d.installments?d.instFreq:null,
    remind:!!d.remind,reminderDate:d.remind?(d.reminderDate||today()):null,txId:d.txId};
  if(isNew){const tx={id:uid(),ts:Date.now(),date:l.dateGiven,type:'Gasto',cat:'Préstamos a terceros',desc:'Préstamo a '+l.name,amount:l.amount,method:l.method,target:id};S.txs.push(tx);l.txId=tx.id;S.lent.push(l)}
  else{const i=S.lent.findIndex(x=>x.id===id);S.lent[i]=l;
    if(l.txId){const t=S.txs.find(x=>x.id===l.txId);if(t){t.date=l.dateGiven;t.amount=l.amount;t.method=l.method;t.desc='Préstamo a '+l.name}}}
  U.modal=null;save();render();toast(isNew?'Préstamo registrado':'Préstamo actualizado')}
function openJar(draft){U.modal={kind:'jar',d:Object.assign({name:'',bank:'Efectivo',startAmount:null,rate:null,visible:true,spendable:false},draft)};render()}
function jarModal(){const d=U.modal.d;
  return `<div class="modal-head"><h2>${d.id?'Editar caja de ahorro':'Nueva caja de ahorro'}</h2></div>
   <div class="form" id="jarForm">
    ${field({k:'name',l:'Nombre de la caja',ph:'Ej. Vacaciones',req:1},d.name,'j_')}
    ${field({k:'bank',l:'¿En cuál de tus bancos o efectivo?',t:'select',opts:methods().map(m=>[m.id,m.name])},d.bank,'j_')}
    ${field({k:'startAmount',l:'Cuánto tienes hoy en esta caja',t:'money'},d.startAmount,'j_')}
    ${field({k:'rate',l:'Rendimiento anual (%)',t:'number',step:0.01,min:0,ph:'Ej. 8',hint:'Como el que ofrecen algunos bancos. Opcional.'},d.rate,'j_')}
   </div><p class="err" id="jarErr"></p>
   <p class="small muted" style="margin-top:2px">Para mostrarla en tu balance o marcarla como disponible para gastos, usa las casillas en su tarjeta.</p>
   <div class="modal-foot">${d.id?`<button class="btn danger" data-a="delJar" data-id="${d.id}" style="margin-right:auto">${icon('del')}Borrar</button>`:''}<button class="btn ghost" data-a="modalClose">Cancelar</button><button class="btn primary" data-a="saveJar">${d.id?'Guardar cambios':'Guardar'}</button></div>`}
const JAR_F=[{k:'name'},{k:'bank'},{k:'startAmount',t:'money'},{k:'rate',t:'number'}];
function harvestJar(){const f=document.getElementById('jarForm');if(!f)return;const{o}=readForm(f,JAR_F,'j_');Object.assign(U.modal.d,o)}
function saveJar(){harvestJar();const d=U.modal.d,e=document.getElementById('jarErr');
  if(!d.name){e.textContent='Escribe el nombre de la caja.';return}
  const isNew=!d.id,id=d.id||uid();
  const j={id,name:d.name,bank:d.bank||'Efectivo',startAmount:+d.startAmount||0,rate:clamp(+d.rate||0,0,100)/100,visible:d.visible!==false,spendable:!!d.spendable};
  if(isNew){j.createdDate=today();S.savings.push(j)}else{const old=S.savings.find(x=>x.id===id);j.createdDate=old.createdDate||today();Object.assign(old,j)}
  U.modal=null;save();render();toast(isNew?'Caja de ahorro creada':'Caja actualizada')}
function confirmModal(){const c=U.confirm;return `<div class="modal-head"><h2>${esc(c.title)}</h2></div><p class="muted">${esc(c.msg)}</p><div class="modal-foot"><button class="btn ghost" data-a="confirmNo">Cancelar</button><button class="btn ${c.danger===false?'primary':'danger'}" data-a="confirmYes">${esc(c.yes||'Sí, borrar')}</button></div>`}
function ask(title,msg,fn,yes,danger){U.confirm={title,msg,fn,yes,danger};render()}

let toastT;function toast(msg){let el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=msg;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{el.hidden=true},2200)}

/* ---------- Render ---------- */
const root=document.getElementById('root');
function render(){
  let html;
  if(U.booting)html=bootHTML();
  else if(!U.acct&&!U.localMode&&!S.example)html=authHTML();
  else if(!S.setupDone)html=obHTML();
  else{const tabFn={resumen:tabResumen,registro:tabRegistro,explorar:tabExplorar,balance:tabBalance,tarjetas:tabTarjetas,prestado:tabPrestado,ahorros:tabAhorros,plan:tabPlan,suscripciones:tabSubs,simulador:tabSimulador,config:tabConfig}[U.tab]||tabResumen;
    html=`<div class="mbar${U.appIn?' fade-in':''}"><button class="btn ghost sm menu-btn" data-a="toggleNav" aria-label="Abrir menú" aria-expanded="${U.navOpen?'true':'false'}">${icon('menu')}</button><div class="brand"><span class="brand-mark">${icon('windmill')}</span><div><b>El Molino</b><span>${S.settings.name?esc(S.settings.name):'finanzas personales'}</span></div></div></div>
     <div class="app${U.appIn?' fade-in':''}">
     ${U.navOpen?'<div class="nav-scrim" data-a="closeNav"></div>':''}
     <aside class="side${U.navOpen?' open':''}"><div class="brand"><span class="brand-mark">${icon('windmill')}</span><div><b>El Molino</b><span>${S.settings.name?esc(S.settings.name):'finanzas personales'}</span></div><button class="btn ghost sm side-close" data-a="closeNav" aria-label="Cerrar menú">✕</button></div>
     <nav class="nav" aria-label="Secciones">${TABS.map(([k,l])=>`<button data-a="tab" data-t="${k}"${U.tab===k?' aria-current="page"':''}>${icon(k)}<span>${l}</span></button>`).join('')}</nav>
     <div class="side-foot">${themeSeg()}${U.acct?`<span class="saved"><b style="color:var(--ink);font-weight:600">${esc(U.acct.user)}</b> · <button class="linkbtn" data-a="logout">Salir</button></span>`:''}<span class="saved" id="savedMsg">${esc(syncText())}</span></div></aside>
     <main class="main">${S.example?`<div class="banner"><span>Estás viendo datos de ejemplo. Nada de esto es tuyo.</span><button class="btn sm" data-a="clearExample">Borrar ejemplo y empezar con mis datos</button></div>`:''}${tabFn()}</main></div>
     <button class="btn primary fab" data-a="newTx">${icon('plus')}Movimiento</button>`}
  U.appIn=false;
  if(U.modal)html+=`<div class="scrim" data-a="scrim"><div class="modal" role="dialog" aria-modal="true">${U.modal.kind==='tx'?txModal():U.modal.kind==='lent'?lentModal():U.modal.kind==='jar'?jarModal():U.modal.kind==='reclink'?recLinkModal():entityModal()}</div></div>`;
  if(U.confirm)html+=`<div class="scrim"><div class="modal" role="alertdialog" aria-modal="true">${confirmModal()}</div></div>`;
  root.innerHTML=html}

/* ---------- Transiciones de la configuración inicial ---------- */
const reduceMotion=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};
function obGo(dir,apply){const m=document.querySelector('.ob-main');
  const finish=()=>{apply();U.obDir=dir;U.obBusy=false;render();window.scrollTo(0,0)};
  if(!m||reduceMotion()){finish();return}
  U.obBusy=true;m.style.setProperty('--dx',(dir<0?-36:36)+'px');m.classList.remove('enter');m.classList.add('leave');setTimeout(finish,300)}
/* ---------- Acciones ---------- */
function ensureCat(name,type,group){if(!cat(name))S.categories.push({name,type,group})}
function markPaid(x){const t=today();
  if(x.paid){if(x.kind==='loan'){const l=S.txs.filter(y=>y.target===x.ref&&y.loanKind!=='abono'&&groupOf(y)==='Deuda').sort((a,b)=>(b.ts||0)-(a.ts||0))[0];if(l)S.txs=S.txs.filter(y=>y!==l)}
    else{const p=S.paid[x.key];if(p)S.txs=S.txs.filter(y=>y.id!==p.txId);delete S.paid[x.key]}save();render();toast('Pago desmarcado');return}
  let tx={id:uid(),ts:Date.now(),date:t,type:'Gasto',amount:x.amount,method:'Débito'};
  if(x.kind==='card'){ensureCat('Pago de tarjetas','Gasto','Deuda');Object.assign(tx,{cat:'Pago de tarjetas',desc:'Pago '+x.name,target:x.ref})}
  else if(x.kind==='loan'){ensureCat('Pago de préstamo','Gasto','Deuda');const l=S.loans.find(l=>l.id===x.ref);Object.assign(tx,{cat:'Pago de préstamo',desc:'Cuota '+(l?l.name:''),target:x.ref,loanKind:'cuota'})}
  else if(x.kind==='sub'){const s=S.subs.find(s=>s.id===x.ref);Object.assign(tx,{cat:s.cat||'Suscripciones',desc:s.name,method:s.method,subId:s.id,date:x.date<t?x.date:t})}
  else{ensureCat('Ahorro / colchón','Gasto','Ahorro');Object.assign(tx,{cat:'Ahorro / colchón',desc:'Colchón de emergencia'})}
  S.txs.push(tx);if(x.kind!=='loan')S.paid[x.key]={txId:tx.id,amount:x.amount,date:x.date};save();render();toast('Pago registrado como movimiento')}
function importBackupText(text,src){try{const d=JSON.parse(text);if(!d||!d.settings||!Array.isArray(d.txs))throw 0;
    ask('¿Reemplazar tus datos con el respaldo?',`El respaldo tiene ${d.txs.length} movimientos. Lo que tienes ahora se reemplaza.`,()=>{migrateSettings(d.settings);S=Object.assign(blank(),d);S.settings=Object.assign(blank().settings,d.settings);save();toast('Respaldo importado')},'Sí, reemplazar',false)}
  catch(x){toast(src==='texto'?'Ese texto no es un respaldo válido. Revisa que lo hayas copiado completo.':'Ese archivo no es un respaldo válido de la libreta.')}}
async function doExport(){const data=JSON.stringify(S,null,1),name=`libreta-finanzas-${today()}.json`;
  try{const blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);toast('Respaldo exportado');return}catch(e){}
  const box=document.getElementById('exportBox');if(box){box.innerHTML=`<p class="small muted" style="margin:12px 0 6px">Copia este texto y guárdalo en un archivo .json:</p><textarea class="inp num" id="expTxt" rows="6" readonly style="font-size:.75rem">${esc(data)}</textarea><button class="btn sm" data-a="copyExp" style="margin-top:8px">Copiar</button>`}}
const A={
  tab:b=>{U.tab=b.dataset.t;U.navOpen=false;render();window.scrollTo(0,0)},
  toggleNav:()=>{U.navOpen=!U.navOpen;render()},
  closeNav:()=>{U.navOpen=false;render()},
  per:b=>{const z=U.per[b.dataset.k];if(b.dataset.p==='custom'&&z.p!=='custom'&&z.p!=='todo'){const r=perRange(b.dataset.k);z.from=r[0];z.to=r[1]}z.p=b.dataset.p;render()},
  perShift:b=>{const k=b.dataset.k,z=U.per[k],[x,y]=perRange(k),n=daysBetween(x,y)+1,d=+b.dataset.d;z.from=addDays(x,d*n);z.to=addDays(y,d*n);z.p='custom';render()},
  toggleChart:b=>{P.charts[b.dataset.id]=!P.charts[b.dataset.id];savePrefs();render()},
  theme:b=>{P.theme=b.dataset.v;savePrefs();applyTheme();render()},
  newTx:()=>openTx({}),
  editTx:b=>{const t=S.txs.find(x=>x.id===b.dataset.id);if(t)openTx({...t,msi:t.msi>1,months:t.msi||3})},
  delTx:b=>{const t=S.txs.find(x=>x.id===b.dataset.id);U.modal=null;ask('¿Borrar este movimiento?',`${t.desc||t.cat} · ${money(t.amount)}`,()=>{S.txs=S.txs.filter(x=>x!==t);for(const k in S.paid)if(S.paid[k].txId===t.id)delete S.paid[k];save()})},
  txType:b=>{harvestTx();U.modal.d.type=b.dataset.v;if(b.dataset.v==='Ingreso'&&!isCash(U.modal.d.method))U.modal.d.method='Efectivo';render()},
  saveTx,saveEnt,
  modalClose:()=>{U.modal=null;render()},
  scrim:(b,e)=>{if(e.target===b){U.modal=null;render()}},
  confirmNo:()=>{U.confirm=null;render()},
  confirmYes:()=>{const f=U.confirm.fn;U.confirm=null;f();render()},
  newCard:()=>{U.modal={kind:'card'};render()},
  editCard:b=>{const c=S.cards.find(x=>x.id===b.dataset.id);U.modal={kind:'card',id:c.id,v:{...c,cutDate:nextOcc(c.cutAnchor,c.cutDay),dueDate:nextOcc(c.dueAnchor,c.dueDay),balance:Math.round(cardStats(c).used*100)/100,noInt:c.noInt}};render()},
  delCard:b=>{const c=S.cards.find(x=>x.id===b.dataset.id);ask(`¿Eliminar ${c.name}?`,'Los movimientos hechos con esta tarjeta se quedan en tu registro.',()=>{S.cards=S.cards.filter(x=>x!==c);save()})},
  payCard:b=>{const c=S.cards.find(x=>x.id===b.dataset.id);openTx({cat:'Pago de tarjetas',target:c.id,method:'Débito',amount:Math.round(cardStats(c).noInt*100)/100||null,desc:'Pago '+c.name})},
  newLoan:()=>{U.modal={kind:'loan',v:{kind:LOAN_KINDS[0],freq:'quincenal',paidInit:0,nextDate:today()}};render()},
  editLoan:b=>{const l=S.loans.find(x=>x.id===b.dataset.id);U.modal={kind:'loan',id:l.id,v:{...l}};render()},
  delLoan:b=>{const l=S.loans.find(x=>x.id===b.dataset.id);ask(`¿Eliminar ${l.name}?`,'Los pagos registrados se quedan en tu registro.',()=>{S.loans=S.loans.filter(x=>x!==l);save()})},
  payLoan:b=>{const l=S.loans.find(x=>x.id===b.dataset.id);openTx({cat:'Pago de préstamo',target:l.id,loanKind:'cuota',method:'Débito',amount:l.payment,desc:'Cuota '+l.name})},
  extraLoan:b=>{const l=S.loans.find(x=>x.id===b.dataset.id);openTx({cat:'Pago de préstamo',target:l.id,loanKind:'abono',method:'Débito',desc:'Abono extra '+l.name})},
  togglePaid:b=>{const x=planItems().find(i=>i.key===b.dataset.key);if(x)markPaid(x)},
  newLent:()=>openLent({}),
  editLent:b=>{const l=S.lent.find(x=>x.id===b.dataset.id);if(l)openLent({...l})},
  delLent:b=>{const l=S.lent.find(x=>x.id===b.dataset.id);U.modal=null;ask(`¿Eliminar el préstamo a ${l.name}?`,'El movimiento del préstamo y los cobros ya registrados se quedan en tu registro.',()=>{S.lent=S.lent.filter(x=>x!==l);save()})},
  collectLent:b=>{const l=S.lent.find(x=>x.id===b.dataset.id);const st=lentStats(l);const amt=l.installments&&l.instAmount?Math.min(l.instAmount,st.outstanding):st.outstanding;
    openTx({type:'Ingreso',cat:'Cobro de préstamo',target:l.id,method:l.method||'Efectivo',amount:Math.round(amt*100)/100||null,desc:'Cobro a '+l.name})},
  saveLent,
  newJar:()=>openJar({}),
  editJar:b=>{const j=S.savings.find(x=>x.id===b.dataset.id);if(j)openJar({...j,rate:j.rate?Math.round(j.rate*10000)/100:null})},
  delJar:b=>{const j=S.savings.find(x=>x.id===b.dataset.id);U.modal=null;ask(`¿Eliminar ${j.name}?`,'Los depósitos y retiros ya registrados se quedan en tu registro.',()=>{S.savings=S.savings.filter(x=>x!==j);save()})},
  depositJar:b=>{const j=S.savings.find(x=>x.id===b.dataset.id);openTx({cat:'Depósito a caja de ahorro',target:j.id,method:j.bank||'Efectivo',desc:'Depósito a '+j.name})},
  withdrawJar:b=>{const j=S.savings.find(x=>x.id===b.dataset.id);openTx({type:'Ingreso',cat:'Retiro de caja de ahorro',target:j.id,method:j.bank||'Efectivo',desc:'Retiro de '+j.name})},
  toggleJarSim:b=>{const id=b.dataset.id;if(U.jarSim&&U.jarSim.id===id)U.jarSim=null;else{const j=S.savings.find(x=>x.id===id);U.jarSim={id,amount:jarStats(j).balance||null,months:12,freq:'mensual',contrib:null};scheduleCalc('jarSim',U.jarSim)}render()},
  toggleJarVisible:b=>{const j=S.savings.find(x=>x.id===b.dataset.id);if(j){j.visible=j.visible===false?true:false;save();render()}},
  toggleJarSpendable:b=>{const j=S.savings.find(x=>x.id===b.dataset.id);if(j){j.spendable=!j.spendable;save();render()}},
  saveJar,
  newSub:()=>{U.modal={kind:'sub',v:{cat:'Suscripciones',method:'Efectivo'}};render()},
  editSub:b=>{const s=S.subs.find(x=>x.id===b.dataset.id);U.modal={kind:'sub',id:s.id,v:{...s}};render()},
  delSub:b=>{const s=S.subs.find(x=>x.id===b.dataset.id);ask(`¿Eliminar ${s.name}?`,'Los cobros ya registrados se quedan en tu registro.',()=>{S.subs=S.subs.filter(x=>x!==s);save()})},
  chargeSub:b=>{const s=S.subs.find(x=>x.id===b.dataset.id);const t=today();const d=t.slice(0,8)+pad(Math.min(+s.day||1,lastDay(parse(t).getFullYear(),parse(t).getMonth())));
    S.txs.push({id:uid(),ts:Date.now(),date:d>t?t:d,type:'Gasto',cat:s.cat||'Suscripciones',desc:s.name,amount:+s.amount,method:s.method,subId:s.id});save();render();toast(`Cobro de ${s.name} registrado`)},
  simRegister:()=>{const z=U.sim,r=simulate();openTx({type:'Gasto',cat:z.cat,desc:z.what,amount:+z.amount,date:z.date,method:r.mode==='efectivo'?'Efectivo':'card:'+z.card,msi:r.mode==='msi',months:r.months})},
  simTab:b=>{U.simTab=b.dataset.v;if(b.dataset.v==='prestamo')scheduleCalc('simLoan',U.simLoan);else scheduleCalc('sim',U.sim);render()},
  simRegisterLoan:()=>{const r=simulateLoan();if(!r.ok)return;U.modal={kind:'loan',v:{name:'',kind:LOAN_KINDS[0],original:r.P0,payment:r.pay,freq:r.freq,n:r.n,paidInit:0,nextDate:stepDate(today(),r.freq),capital:null}};render()},
  saveSettings:()=>{const p=document.getElementById('setPanel');const{o}=readForm(p,SET_F.concat([{k:'utilWarn',t:'number'},{k:'utilCrit',t:'number'},{k:'redPct',t:'number'}]),'s_');
    const flow=cashNow()-(+S.settings.initialBalance||0); // movimientos en efectivo/débito ya registrados, para no duplicarlos al rebalancear
    for(const k in o){
      if(['utilWarn','utilCrit','redPct'].includes(k)){if(o[k]!=null)S.settings[k]=clamp(o[k],0,100)/100}
      else if(k==='initialBalance'){const target=o[k]!=null?o[k]:0;S.settings.initialBalance=Math.round((target-flow)*100)/100}
      else if(o[k]!=null)S.settings[k]=o[k];
      else if(k!=='name'&&k!=='startDate')S.settings[k]=0}
    save();render();toast('Cambios guardados')},
  newCat:()=>{U.modal={kind:'cat',v:{type:'Gasto',group:'Variable'}};render()},
  delCat:b=>{const c=S.categories[+b.dataset.i];if(['Pago de tarjetas','Pago de préstamo','Ahorro / colchón','Préstamos a terceros','Cobro de préstamo','Depósito a caja de ahorro','Retiro de caja de ahorro'].includes(c.name)){toast('Esta categoría la usa la libreta; no se puede borrar.');return}
    ask(`¿Borrar la categoría ${c.name}?`,'Los movimientos que ya la usan conservan el nombre.',()=>{S.categories=S.categories.filter(x=>x!==c);save()})},
  export:doExport,
  pickImport:()=>{const el=document.getElementById('impFile');if(el)el.click()},
  pasteImport:()=>{const t=document.getElementById('impPaste');if(!t||!t.value.trim()){toast('Pega primero el contenido del respaldo.');return}importBackupText(t.value,'texto')},
  copyExp:()=>{const t=document.getElementById('expTxt');try{navigator.clipboard.writeText(t.value).then(()=>toast('Copiado'),()=>{t.select()})}catch(e){t.select()}},
  reset:()=>ask('¿Borrar todos tus datos?',(U.acct?'Se borran tus movimientos, tarjetas, préstamos y suscripciones de tu cuenta. Tu usuario y contraseña siguen funcionando.':'Se borran tus movimientos, tarjetas, préstamos y suscripciones de este navegador.')+' No se puede deshacer.',()=>{const nm=S.settings.name;S=blank();S.settings.name=nm;U.tab='resumen';U.ob={step:0,has:{}};save()}),
  rerunSetup:()=>{S.setupDone=false;U.ob={step:0,has:{loans:S.loans.length>0||undefined,cards:S.cards.length>0||undefined,subs:S.subs.length>0||undefined}};save();render()},
  loadExample:()=>{S=exampleData();U.tab='resumen';save();render()},
  clearExample:()=>ask('¿Borrar el ejemplo?','Vamos a empezar tu libreta desde cero con tus propios datos.',()=>{S=blank();U.ob={step:0,has:{}};save()},'Sí, empezar',false),
  obNext:()=>{if(U.obBusy||!obHarvest())return;obGo(1,()=>{U.ob.step=Math.min(6,U.ob.step+1)})},
  obBack:()=>{if(U.obBusy)return;obHarvest();obGo(-1,()=>{U.ob.step=Math.max(0,U.ob.step-1)})},
  obHas:b=>{U.ob.has[b.dataset.k]=b.dataset.v==='1';render()},
  obAdd:b=>{obAdd(b.dataset.k)},
  obDel:b=>{const k=b.dataset.k,id=b.dataset.id;if(k==='loan')S.loans=S.loans.filter(x=>x.id!==id);if(k==='card')S.cards=S.cards.filter(x=>x.id!==id);if(k==='sub')S.subs=S.subs.filter(x=>x.id!==id);save();render()},
  obFinish:()=>{if(U.obBusy)return;obGo(1,()=>{S.setupDone=true;S.example=false;U.tab='resumen';U.appIn=true;save()})},
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const f=A[b.dataset.a];if(!f)return;
  if(b.dataset.a==='scrim'){f(b,e);return}if(b.tagName!=='INPUT')e.preventDefault();f(b,e)});
function keepFocus(fn){const a=document.activeElement,id=a&&a.id,pos=a&&a.selectionStart;fn();if(id){const el=document.getElementById(id);if(el){el.focus();try{if(pos!=null){const p=Math.min(pos,el.value.length);el.setSelectionRange(p,p)}}catch(e){}}}}
const simTimers={};
function scheduleCalc(key,z){z.loading=true;clearTimeout(simTimers[key]);simTimers[key]=setTimeout(()=>{z.loading=false;render()},2000+Math.random()*3000)}
const SIM_MAP={simWhat:'what',simAmt:'amount',simCat:'cat',simDate:'date',simMode:'mode',simCard:'card',simMonths:'months'};
document.addEventListener('input',e=>{const el=e.target;
  if(el.id==='regQ'){U.reg.q=el.value;keepFocus(render)}
  else if(el.id==='simAmt'||el.id==='simWhat'){U.sim[SIM_MAP[el.id]]=el.value;scheduleCalc('sim',U.sim);keepFocus(render)}
  else if(el.id==='slAmt'||el.id==='slN'||el.id==='slPay'){const k=el.id==='slAmt'?'amount':el.id==='slN'?'n':'payment';U.simLoan[k]=el.value;scheduleCalc('simLoan',U.simLoan);keepFocus(render)}
  else if(el.id==='jsAmt'||el.id==='jsMonths'||el.id==='jsContrib'){const k=el.id==='jsAmt'?'amount':el.id==='jsMonths'?'months':'contrib';U.jarSim[k]=el.value;scheduleCalc('jarSim',U.jarSim);keepFocus(render)}});
document.addEventListener('change',e=>{const el=e.target,ch=el.dataset.ch;
  if(el.id==='impFile'&&el.files[0]){const r=new FileReader();r.onload=()=>{importBackupText(r.result,'archivo')};r.onerror=()=>toast('No se pudo leer ese archivo. Prueba pegando el texto abajo.');r.readAsText(el.files[0]);el.value='';return}
  if(!ch)return;
  if(ch==='per'){if(el.value){U.per[el.dataset.k][el.dataset.f]=el.value;render()}}
  else if(ch==='ex'){const m={exTy:'type',exC:'cat',exMe:'method'};U.ex[m[el.id]]=el.value;render()}
  else if(ch==='sim'){const k=SIM_MAP[el.id];if(!k||el.id==='simAmt'||el.id==='simWhat')return;U.sim[k]=el.value;if(k==='mode'&&el.value!=='efectivo'&&!S.cards.some(c=>c.id===U.sim.card))U.sim.card=S.cards[0]?.id||'';scheduleCalc('sim',U.sim);render()}
  else if(ch==='txRe'){harvestTx();render()}
  else if(ch==='lentRe'){harvestLent();render()}
  else if(ch==='simLoan'){if(el.id==='slFreq'){U.simLoan.freq=el.value;scheduleCalc('simLoan',U.simLoan);render()}}
  else if(ch==='jarSim'){if(el.id==='jsFreq'){U.jarSim.freq=el.value;scheduleCalc('jarSim',U.jarSim);render()}}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(U.modal||U.confirm)){U.modal=null;U.confirm=null;render()}
  else if(e.key==='Escape'&&U.navOpen){U.navOpen=false;render()}
  else if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('tx-row')){e.preventDefault();A.editTx(e.target)}});

