
/* ---------- Estado de la interfaz ---------- */
const U={tab:'resumen',navOpen:false,reg:{q:''},ex:{type:'Todos',cat:'Todas',method:'Todos'},
  per:{resumen:{p:'semana',from:addDays(today(),-6),to:today()},registro:{p:'todo',from:addDays(today(),-6),to:today()},explorar:{p:'semana',from:addDays(today(),-6),to:today()}},
  sim:{what:'',amount:null,cat:'Ocio',date:today(),mode:'efectivo',card:'',months:3},simLoan:{amount:null,freq:'quincenal',n:12,payment:null},simTab:'compra',jarSim:null,modal:null,confirm:null,ob:{step:0,has:{}}};

/* ---------- Selector de periodo (compartido) ---------- */
const PER_OPTS=[['hoy','Hoy'],['ayer','Ayer'],['semana','Esta semana'],['mes','Último mes'],['custom','Periodo']];
function perRange(k){const z=U.per[k],t=today();switch(z.p){
  case'hoy':return[t,t];case'ayer':{const y=addDays(t,-1);return[y,y]}case'semana':return[weekStart(t),weekEnd(t)];
  case'mes':return[addDays(t,-29),t];case'todo':return[null,null];default:return z.from<=z.to?[z.from,z.to]:[z.to,z.from]}}
function perLabel(k){const[a,b]=perRange(k);if(!a)return'Todos los movimientos';const n=daysBetween(a,b)+1;
  return a===b?fDay(a)+(a===today()?' · hoy':''):`Del ${fDate(a,parse(a).getFullYear()!==parse(b).getFullYear())} al ${fDate(b,1)} · ${n} días`}
function perPicker(k,withAll){const z=U.per[k],opts=(withAll?[['todo','Todo']]:[]).concat(PER_OPTS);
  return `<div class="per"><div class="row" style="gap:8px">
    ${z.p!=='todo'?`<button class="btn ghost sm" data-a="perShift" data-k="${k}" data-d="-1" aria-label="Periodo anterior">${icon('left')}</button>`:''}
    <div class="seg wrap" role="group" aria-label="Periodo">${opts.map(([v,l])=>`<button data-a="per" data-k="${k}" data-p="${v}" aria-pressed="${z.p===v}">${l}</button>`).join('')}</div>
    ${z.p!=='todo'?`<button class="btn ghost sm" data-a="perShift" data-k="${k}" data-d="1" aria-label="Periodo siguiente">${icon('right')}</button>`:''}</div>
   ${z.p==='custom'?`<div class="row per-dates"><label class="small muted" for="per_${k}_from">Desde</label><input class="inp" type="date" id="per_${k}_from" data-ch="per" data-k="${k}" data-f="from" value="${z.from}">
     <label class="small muted" for="per_${k}_to">Hasta</label><input class="inp" type="date" id="per_${k}_to" data-ch="per" data-k="${k}" data-f="to" value="${z.to}"></div>`:''}
   <span class="small muted">${perLabel(k)}</span></div>`}
const perTitle=k=>({hoy:'de hoy',ayer:'de ayer',semana:'de la semana',mes:'del último mes',custom:'del periodo',todo:''}[U.per[k].p]);

/* ---------- Resumen ---------- */
function tabResumen(){
  const t=today(),[a,b]=perRange('resumen'),nd=daysBetween(a,b)+1,pt=perTitle('resumen');
  const list=txIn(a,b),w=stats(list),ct=cardTotals(),lt=loanTotals(),goal=(S.settings.dailyGoal||0)*nd;
  const remind=S.lent.map(l=>({l,st:lentStats(l)})).filter(x=>x.st.remindDue);
  const expected=expectedWeekly()*nd/7;
  const items=planItems().filter(x=>!x.paid&&x.date>=t&&x.date<=addDays(t,7));
  const ws=weekStart(b>t?t:b);
  const weeks=[...Array(8)].map((_,i)=>{const s=addDays(ws,-7*(7-i));return{a:s,s:stats(txIn(s,addDays(s,6)))}});
  const dEnd=b>t?t:b,span=nd>=7&&nd<=62?nd:14,dStart=nd>=7&&nd<=62?a:addDays(dEnd,-13);
  const days=[...Array(span)].map((_,i)=>{const d=addDays(dStart,i);return{d,v:stats(txIn(d,d)).personal}});
  const byCat={};list.filter(x=>x.type==='Gasto').forEach(x=>{byCat[x.cat]=(byCat[x.cat]||0)+ +x.amount});
  const catRows=Object.entries(byCat).map(([name,value])=>({name,value})).sort((x,y)=>y.value-x.value);
  const byM={};list.filter(x=>x.type==='Gasto'&&groupOf(x)!=='Deuda').forEach(x=>{const k=x.method;byM[k]=byM[k]||{v:0,n:0};byM[k].v+=+x.amount;byM[k].n++});
  const mTot=sum(Object.values(byM),x=>x.v);
  const hi=S.settings.name?`Hola, ${esc(S.settings.name)}`:'Resumen';
  const lvl=goal&&w.personal>goal?'bad':goal&&w.personal>.8*goal?'warn':'good';
  return `
  <div class="page-head"><div><h1>${hi}</h1><p>Así van tus finanzas en el periodo que elijas.</p></div></div>
  <div class="stack">
   ${remind.length?`<div class="banner"><span>${remind.length===1?`Recordatorio: cóbrale a ${esc(remind[0].l.name)} (${money(remind[0].st.outstanding)})`:`Tienes ${remind.length} recordatorios de cobro pendientes`}</span><button class="btn sm" data-a="tab" data-t="prestado">Ver Préstamos</button></div>`:''}
   <div class="panel per-panel">${perPicker('resumen')}</div>
   <div class="kpis">
    ${kpi('Balance '+pt,Ms(w.balance),'Ingresos menos gastos personales, fijos y deudas','hero')}
    ${kpi('Ingresos '+pt,M(w.income),expected?`Esperado: ${money0(expected)}`:'')}
    <div class="kpi"><span class="lbl">Gasto personal ${pt}</span><span class="val">${money(w.personal)}</span>${meter(goal?w.personal/goal:0,lvl)}<span class="sub row" style="justify-content:space-between">Meta ${money0(goal)} ${goalChip(w.personal,goal)}</span></div>
    ${kpi('Suscripciones y fijos',M(w.fijos),'En el periodo')}
    ${kpi('Pagos de deuda',M(w.deuda),'En el periodo')}
    ${kpi('Promedio diario',M(w.personal/nd),`Gasto personal · meta ${money0(S.settings.dailyGoal)}`)}
    <div class="kpi"><span class="lbl">Deuda en tarjetas</span><span class="val">${money(ct.used)}</span><span class="sub">${S.cards.length?utilChip(ct.util):'Sin tarjetas'}</span></div>
    ${kpi('Préstamos por pagar',M(lt),S.loans.length?'Capital pendiente estimado':'Sin préstamos')}
   </div>
   <div class="grid g2">
    <div class="panel"><div class="panel-head"><h2>Próximos 7 días</h2><button class="linkbtn" data-a="tab" data-t="plan">Ver plan de pagos</button></div>
     ${items.length?`<div class="list">${items.map(x=>`<div class="li"><div><div class="t">${esc(x.name)}</div><div class="m">${fDay(x.date)} · ${x.type} · ${daysBetween(t,x.date)===0?'vence hoy':'faltan '+daysBetween(t,x.date)+' días'}</div></div>${M(x.amount)}</div>`).join('')}</div>`:`<div class="empty">No tienes pagos en los próximos 7 días.</div>`}
    </div>
    <div class="panel"><div class="panel-head"><h2>Gasto por categoría</h2><p>${esc(perLabel('resumen'))}</p></div>${hbars(catRows)}</div>
   </div>
   <div class="panel"><div class="panel-head"><h2>Últimas 8 semanas</h2><p>Hasta la semana del ${fWeek(ws)}</p></div>
    ${barChart({labels:weeks.map(x=>fDate(x.a)),series:[{name:'Ingresos',color:'var(--c2)',values:weeks.map(x=>x.s.income)},{name:'Gasto personal',color:'var(--c1)',values:weeks.map(x=>x.s.personal)},{name:'Fijos',color:'var(--c3)',values:weeks.map(x=>x.s.fijos)},{name:'Deudas',color:'var(--c4)',values:weeks.map(x=>x.s.deuda)}],every:1})}
   </div>
   <div class="grid g2">
    <div class="panel"><div class="panel-head"><h2>Gasto personal por día</h2><p>${span===nd?'En el periodo':'Últimos 14 días'} · meta ${money0(S.settings.dailyGoal)}</p></div>
     ${barChart({labels:days.map(x=>String(parse(x.d).getDate())),series:[{name:'Gasto personal',color:'var(--c1)',values:days.map(x=>x.v)}],goal:S.settings.dailyGoal||null,goalLabel:'Meta diaria',h:200,every:Math.ceil(span/12),w:420})}</div>
    <div class="panel"><div class="panel-head"><h2>Gasto por método de pago</h2><p>Compras, sin pagos de deuda</p></div>
     ${mTot?`<div class="tbl-wrap"><table><thead><tr><th>Método</th><th class="r">Gasto</th><th class="r">Mov.</th><th class="r">%</th></tr></thead><tbody>${Object.entries(byM).sort((x,y)=>y[1].v-x[1].v).map(([k,v])=>`<tr><td>${esc(methodName(k))}</td><td class="r">${M(v.v)}</td><td class="r num">${v.n}</td><td class="r num">${pct(v.v/mTot)}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty">No hay gastos en este periodo.</div>`}</div>
   </div>
  </div>`}

/* ---------- Registro ---------- */
function txMeta(t){const extra=[t.cat,methodName(t.method)];if(t.msi>1)extra.push(`${t.msi} MSI · ${money(t.amount/t.msi)}/mes`);
  if(t.target){const c=S.cards.find(c=>c.id===t.target),l=S.loans.find(l=>l.id===t.target),p=S.lent.find(p=>p.id===t.target),j=S.savings.find(j=>j.id===t.target);
   if(c)extra.push('a '+c.name);if(l)extra.push((t.loanKind==='abono'?'abono a ':'cuota de ')+l.name);if(p)extra.push((t.type==='Ingreso'?'cobro a ':'préstamo a ')+p.name);if(j)extra.push((t.type==='Ingreso'?'retiro de ':'depósito a ')+j.name)}return extra}
function tabRegistro(){
  const[a,b]=perRange('registro');let list=a?txIn(a,b):S.txs.slice();
  const q=U.reg.q.toLowerCase();if(q)list=list.filter(t=>(t.desc+' '+t.cat+' '+methodName(t.method)).toLowerCase().includes(q));
  list.sort((x,y)=>y.date.localeCompare(x.date)||(y.ts||0)-(x.ts||0));
  const st=stats(list);let html='',cur='';
  for(const t of list){if(t.date!==cur){cur=t.date;html+=`<div class="day-h">${fDay(t.date)}</div>`}
    html+=`<div class="li tx-row" data-a="editTx" data-id="${t.id}" tabindex="0" role="button" aria-label="Editar ${esc(t.desc||t.cat)}"><div><div class="t">${esc(t.desc||t.cat)}</div><div class="m">${txMeta(t).map(esc).join(' · ')}</div></div><div class="row" style="gap:8px;flex-wrap:nowrap"><span class="money ${t.type==='Ingreso'?'pos':''}">${t.type==='Ingreso'?'+':'−'}${money(t.amount)}</span><span class="acts"><button class="btn sm" data-a="editTx" data-id="${t.id}">${icon('edit')}Editar</button><button class="btn ghost sm" data-a="delTx" data-id="${t.id}" aria-label="Borrar">${icon('del')}</button></span></div></div>`}
  return `<div class="page-head"><div><h1>Registro</h1><p>Anota cada ingreso o gasto. Toca cualquier movimiento para editarlo.</p></div>
   <button class="btn primary" data-a="newTx">${icon('plus')}Agregar movimiento</button></div>
   <div class="stack"><div class="panel per-panel">${perPicker('registro',true)}</div>
    <div class="panel"><div class="row" style="justify-content:space-between">
    <input class="inp" id="regQ" placeholder="Buscar descripción, categoría o método" value="${esc(U.reg.q)}" style="width:min(340px,100%)">
    <div class="row small muted"><span>${list.length} movimientos</span><span>Ingresos ${M(st.income)}</span><span>Gastos ${M(st.gastos)}</span></div></div>
    ${list.length?`<div class="list">${html}</div>`:`<div class="empty">No hay movimientos${q||a?' con ese filtro':''}. Usa “Agregar movimiento” para empezar.</div>`}</div></div>`}

/* ---------- Explorar ---------- */
function tabExplorar(){
  const e=U.ex,[a,b]=perRange('explorar');let list=txIn(a,b);
  if(e.type!=='Todos')list=list.filter(t=>t.type===e.type);if(e.cat!=='Todas')list=list.filter(t=>t.cat===e.cat);if(e.method!=='Todos')list=list.filter(t=>t.method===e.method);
  const st=stats(list),nd=daysBetween(a,b)+1,goal=(S.settings.dailyGoal||0)*nd,daysWith=new Set(list.map(t=>t.date)).size;
  const byCat=S.categories.map(c=>{const l=list.filter(t=>t.cat===c.name);return{name:c.name,value:sum(l,t=>t.amount),n:l.length}}).filter(x=>x.n).sort((x,y)=>y.value-x.value);
  const days=nd<=62?[...Array(nd)].map((_,i)=>{const d=addDays(a,i),l=list.filter(t=>t.date===d);return{d,inc:sum(l.filter(t=>t.type==='Ingreso'),t=>t.amount),gas:sum(l.filter(t=>t.type==='Gasto'),t=>t.amount),n:l.length}}):null;
  const sel=(id,opts,val)=>`<select class="inp" id="${id}" data-ch="ex">${opts.map(o=>{const[v,l]=Array.isArray(o)?o:[o,o];return`<option value="${esc(v)}"${v===val?' selected':''}>${esc(l)}</option>`}).join('')}</select>`;
  const funnel=[['Ingresos',st.income,'var(--c2)'],['Gasto personal',-st.personal,'var(--c1)'],['Suscripciones y fijos',-st.fijos,'var(--c3)'],['Pagos de deuda',-st.deuda,'var(--c4)']];
  const fmax=Math.max(st.income,st.personal+st.fijos+st.deuda,1);
  return `<div class="page-head"><div><h1>Explorar movimientos</h1><p>Elige un periodo y filtra por tipo, categoría o método de pago.</p></div>${chartToggle('explorar')}</div>
  <div class="stack">
   <div class="panel per-panel">${perPicker('explorar')}
    <div class="form" style="margin-top:14px">
    <div class="fld"><label for="exTy">Tipo</label>${sel('exTy',['Todos','Gasto','Ingreso'],e.type)}</div>
    <div class="fld"><label for="exC">Categoría</label>${sel('exC',['Todas',...S.categories.map(c=>c.name)],e.cat)}</div>
    <div class="fld"><label for="exMe">Método de pago</label>${sel('exMe',[['Todos','Todos'],...methods().map(m=>[m.id,m.name])],e.method)}</div>
   </div></div>
   <div class="kpis">
    ${kpi('Balance',Ms(st.balance),'Ingresos − gastos','hero')}${kpi('Ingresos',M(st.income))}${kpi('Gastos',M(st.gastos),'Todos, incluye deudas y neutrales')}
    <div class="kpi"><span class="lbl">Gasto personal</span><span class="val">${money(st.personal)}</span><span class="sub row" style="justify-content:space-between">Meta ${money0(goal)} ${goalChip(st.personal,goal)}</span></div>
    ${kpi('Promedio por día',M(st.personal/nd),'Gasto personal')}${kpi('Movimientos',`<span class="num">${st.count}</span>`,`${daysWith} días con movimientos`)}
   </div>
   ${P.charts.explorar&&days&&nd>1?`<div class="panel"><div class="panel-head"><h2>Por día</h2></div>${barChart({labels:days.map(x=>String(parse(x.d).getDate())),series:[{name:'Ingresos',color:'var(--c2)',values:days.map(x=>x.inc)},{name:'Gastos',color:'var(--c1)',values:days.map(x=>x.gas)}]})}</div>`:''}
   <div class="grid g2">
    <div class="panel"><div class="panel-head"><h2>Del ingreso al balance</h2><p>Sin gasolina ni ahorro (neutrales)</p></div>
     ${funnel.map(([n,v,c])=>`<div class="hbar"><span class="nm">${n}</span><span class="bar"><i style="width:${(Math.abs(v)/fmax*100).toFixed(1)}%;background:${c}"></i></span><span class="money">${v<0?'−':''}${money(Math.abs(v))}</span></div>`).join('')}
     <div class="hbar" style="border-top:1px solid var(--line);margin-top:6px;padding-top:9px"><b class="nm">Balance</b><span></span>${Ms(st.balance)}</div></div>
    <div class="panel"><div class="panel-head"><h2>Por categoría</h2></div>${byCat.length?`<div class="tbl-wrap"><table><thead><tr><th>Categoría</th><th class="r">Monto</th><th class="r">Mov.</th></tr></thead><tbody>${byCat.map(x=>`<tr><td>${esc(x.name)}</td><td class="r">${M(x.value)}</td><td class="r num">${x.n}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty">Sin movimientos.</div>`}</div>
   </div>
   ${days&&nd>1?`<div class="panel"><div class="panel-head"><h2>Por día</h2></div><div class="tbl-wrap"><table><thead><tr><th>Día</th><th class="r">Ingresos</th><th class="r">Gastos</th><th class="r">Mov.</th></tr></thead><tbody>${days.map(x=>`<tr${x.n?'':' class="faint"'}><td>${fDay(x.d)}</td><td class="r">${M(x.inc)}</td><td class="r">${M(x.gas)}</td><td class="r num">${x.n}</td></tr>`).join('')}</tbody></table></div></div>`:''}
   <div class="panel"><div class="panel-head"><h2>Detalle</h2><p>Toca “Editar” para corregir un movimiento</p></div>${list.length?`<div class="tbl-wrap"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th class="r">Monto</th><th>Método</th><th></th></tr></thead><tbody>${list.slice().sort((x,y)=>x.date.localeCompare(y.date)).map(t=>`<tr><td>${fDate(t.date)}</td><td>${t.type}</td><td>${esc(t.cat)}</td><td>${esc(t.desc)}</td><td class="r">${M(t.amount)}</td><td>${esc(methodName(t.method))}</td><td class="r"><button class="btn sm" data-a="editTx" data-id="${t.id}">${icon('edit')}Editar</button></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty">No hay movimientos con estos filtros.</div>`}</div>
  </div>`}

/* ---------- Balance real ---------- */
function tabBalance(){
  const s=S.settings,st=S.txs.filter(t=>t.date>=s.startDate);
  const inc=sum(st.filter(t=>t.type==='Ingreso'),t=>t.amount),gas=st.filter(t=>t.type==='Gasto');
  const ahorro=sum(gas.filter(t=>groupOf(t)==='Ahorro'),t=>t.amount),cashOut=sum(gas.filter(t=>isCash(t.method)&&!['Deuda','Ahorro'].includes(groupOf(t))),t=>t.amount),payCards=sum(gas.filter(t=>isCash(t.method)&&t.cat==='Pago de tarjetas'),t=>t.amount),
    payLoans=sum(gas.filter(t=>isCash(t.method)&&groupOf(t)==='Deuda'&&t.cat!=='Pago de tarjetas'),t=>t.amount),cardBuys=sum(gas.filter(t=>!isCash(t.method)),t=>t.amount);
  const cash=cashNow(),ct=cardTotals(),lt=loanTotals(),spendableTotal=sum(S.savings,j=>j.spendable?jarStats(j).balance:0);
  const savVis=sum(S.savings,j=>(j.visible!==false&&!j.spendable)?jarStats(j).balance:0);
  const debts=ct.used+lt,net=cash+ahorro+savVis-debts;
  const receivable=lentTotals();
  const weeks=[...Array(8)].map((_,i)=>{const e=addDays(weekEnd(today()),-7*(7-i));return{e,c:cashNow(e)}});
  const mx=Math.max(cash+ahorro+savVis,ct.used,lt,1);
  return `<div class="page-head"><div><h1>Balance real</h1><p>Cuánto has ganado, cuánto has gastado y cuánto es realmente tuyo descontando lo que debes.</p></div></div>
  <div class="stack">
   <div class="kpis">${kpi('Balance real (lo que tienes − lo que debes)',Ms(net),net<0?'Debes más de lo que tienes hoy':'Tienes más de lo que debes','hero')}${kpi('Efectivo disponible',Ms(cash),spendableTotal>0?`Incluye ${money(spendableTotal)} de cajas disponibles para gastos`:(ahorro?`Más ${money(ahorro)} en tu colchón`:'En mano o en el banco'))}${kpi('Total de deudas',M(debts),'Tarjetas + préstamos')}${S.savings.length?kpi('En cajas de ahorro',M(savingsTotal()),'Suma de todas tus cajas'):''}</div>
   ${receivable>0?`<p class="small" style="color:var(--warn);margin:-8px 0 4px">Te deben: ${money(receivable)} <span class="muted">(no cuenta como dinero disponible)</span></p>`:''}
   <div class="panel"><div class="panel-head"><h2>Lo que tienes contra lo que debes</h2></div>
    <div class="hbar"><span class="nm">Tienes</span><span class="bar" style="height:16px"><i style="width:${(Math.max(cash+ahorro+savVis,0)/mx*100).toFixed(1)}%;background:var(--good)"></i></span>${M(cash+ahorro+savVis)}</div>
    <div class="hbar"><span class="nm">Debes en tarjetas</span><span class="bar" style="height:16px"><i style="width:${(ct.used/mx*100).toFixed(1)}%;background:var(--c4)"></i></span>${M(ct.used)}</div>
    <div class="hbar"><span class="nm">Debes en préstamos</span><span class="bar" style="height:16px"><i style="width:${(lt/mx*100).toFixed(1)}%;background:var(--c3)"></i></span>${M(lt)}</div></div>
   <div class="grid g2">
    <div class="panel"><h2 style="margin-bottom:10px">Cómo se calcula</h2><dl class="dl">
     <div><dt>Saldo inicial (${fDate(s.startDate,1)})</dt><dd>${money(s.initialBalance)}</dd></div>
     <div><dt>+ Ingresos registrados</dt><dd>${money(inc)}</dd></div>
     <div><dt>− Gastos en efectivo o débito</dt><dd>${money(cashOut)}</dd></div>
     <div><dt>− Pagos a tarjetas</dt><dd>${money(payCards)}</dd></div>
     <div><dt>− Pagos a préstamos</dt><dd>${money(payLoans)}</dd></div>
     <div><dt>− Apartado al colchón y cajas de ahorro</dt><dd>${money(ahorro)}</dd></div>
     ${spendableTotal>0?`<div><dt>+ Cajas de ahorro disponibles para gastos</dt><dd>${money(spendableTotal)}</dd></div>`:''}
     <div class="tot"><dt>= Efectivo disponible</dt><dd>${money(cash)}</dd></div>
     <div><dt>Compras con tarjeta (suben tu deuda, no tocan tu efectivo)</dt><dd>${money(cardBuys)}</dd></div>
     ${ahorro?`<div><dt>+ Colchón apartado (sigue siendo tuyo)</dt><dd>${money(ahorro)}</dd></div>`:''}
     ${savVis>0?`<div><dt>+ ${spendableTotal>0?'Otras cajas':'Cajas'} de ahorro visibles en tu balance</dt><dd>${money(savVis)}</dd></div>`:''}
     <div><dt>− Tarjetas de crédito (saldo usado)</dt><dd>${money(ct.used)}</dd></div>
     <div><dt>− Préstamos (capital pendiente)</dt><dd>${money(lt)}</dd></div>
     <div class="tot"><dt>= Balance real</dt><dd class="${net<0?'neg':'pos'}">${money(net)}</dd></div></dl></div>
    <div class="panel"><div class="panel-head"><h2>Efectivo al cierre de cada semana</h2></div>${barChart({labels:weeks.map(x=>fDate(x.e)),series:[{name:'Efectivo disponible',color:'var(--c2)',values:weeks.map(x=>x.c)}],every:2,h:240,w:420})}</div>
   </div>
   <p class="note">Registra tus compras con tarjeta usando esa tarjeta como método, y cuando pagues una tarjeta anótalo con la categoría “Pago de tarjetas”. Así el balance no cuenta el mismo dinero dos veces. Las cajas “disponibles para gastos” cuentan como efectivo; las demás cajas ocultas no se suman aquí.</p>
  </div>`}
