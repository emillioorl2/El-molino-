
/* ---------- Tarjetas y deudas ---------- */
function tabTarjetas(){
  const ct=cardTotals(),s=S.settings;
  const cards=S.cards.map(c=>{const st=cardStats(c);return `<div class="card-row">
    <div class="stack" style="gap:6px"><div class="row" style="justify-content:space-between"><h3>${esc(c.name)}</h3>${utilChip(st.util)}</div>
     ${meter(st.util,st.lvl,s.utilWarn)}
     <div class="facts"><span>Usado <b>${money(st.used)}</b></span><span>Límite <b>${money(st.limit)}</b></span><span>Disponible <b class="${st.avail<0?'neg':''}">${money(st.avail)}</b></span></div></div>
    <div class="facts" style="flex-direction:column;gap:3px">
     <span>Corte: día ${c.cutDay} · próximo <b>${fDate(st.nextCut)}</b></span>
     <span>Fecha límite: <b>${fDate(st.nextDue)}</b> ${st.daysToPay<=5?`<span class="chip bad">${st.daysToPay} días</span>`:st.daysToPay<=10?`<span class="chip warn">${st.daysToPay} días</span>`:`<span class="chip plain">${st.daysToPay} días</span>`}</span>
     <span>Pago sin intereses (est.): <b>${money(st.noInt)}</b></span>${st.msiMonthly?`<span>Meses sin intereses: <b>${money(st.msiMonthly)}</b>/mes</span>`:''}</div>
    <div class="row" style="justify-content:flex-end"><button class="btn sm" data-a="payCard" data-id="${c.id}">Registrar pago</button><button class="btn ghost sm" data-a="editCard" data-id="${c.id}" aria-label="Editar">${icon('edit')}</button><button class="btn ghost sm" data-a="delCard" data-id="${c.id}" aria-label="Eliminar">${icon('del')}</button></div></div>`}).join('');
  const loans=S.loans.map(l=>{const st=loanStats(l);return `<div class="panel"><div class="panel-head"><div><h3>${esc(l.name)}</h3><p>${esc(l.kind||'Préstamo')} · pagos ${FREQ_L[l.freq]||''}es de ${money(l.payment)}</p></div>
     <div class="row">${st.done?`<span class="chip good">Liquidado</span>`:`<button class="btn sm" data-a="payLoan" data-id="${l.id}">Registrar cuota</button><button class="btn sm ghost" data-a="extraLoan" data-id="${l.id}">Abono extra</button>`}<button class="btn ghost sm" data-a="editLoan" data-id="${l.id}" aria-label="Editar">${icon('edit')}</button><button class="btn ghost sm" data-a="delLoan" data-id="${l.id}" aria-label="Eliminar">${icon('del')}</button></div></div>
     <div class="row small muted" style="justify-content:space-between;margin-bottom:6px"><span>${st.paid} de ${l.n} pagos hechos</span><span>${st.next?'Próximo pago: '+fDate(st.next,1):''}</span></div>${meter(l.n?st.paid/l.n:0,'good')}
     <dl class="dl" style="margin-top:12px">
      <div><dt>Monto original</dt><dd>${money(l.original)}</dd></div><div><dt>Total a pagar (${l.n} pagos)</dt><dd>${money(st.total)}</dd></div>
      <div><dt>Interés total</dt><dd>${money(st.interest)} · ${pct(st.interestPct)}</dd></div><div><dt>Tasa ${FREQ_L[l.freq]||''} implícita (estimada)</dt><dd>${pct(st.rate,2)}</dd></div>
      <div><dt>Pagos restantes si no abonas extra</dt><dd>${money(st.remainingPay)}</dd></div>${st.abonos?`<div><dt>Abonos extra hechos</dt><dd>${money(st.abonos)}</dd></div>`:''}
      <div class="tot"><dt>Capital pendiente (para liquidar)</dt><dd>${money(st.capital)}</dd></div></dl></div>`}).join('');
  return `<div class="page-head"><div><h1>Tarjetas y deudas</h1><p>El saldo de cada tarjeta se actualiza solo: lo que debías + compras con esa tarjeta − pagos que registres.</p></div><div class="row">${chartToggle('tarjetas')}</div></div>
  <div class="stack">
   <div class="kpis">${kpi('Deuda en tarjetas',M(ct.used),S.cards.length?utilChip(ct.util):'')}${kpi('Crédito disponible',M(ct.avail),`De ${money0(ct.limit)}`)}${kpi('Pagos sin intereses (est.)',M(ct.noInt),'Suma de todas tus tarjetas')}${kpi('Préstamos por pagar',M(loanTotals()),'Capital pendiente')}</div>
   ${P.charts.tarjetas&&S.cards.length?`<div class="panel"><div class="panel-head"><h2>Uso de cada tarjeta</h2><p>Recomendado: menos de ${pct(s.utilWarn,0)}</p></div>${hbars(S.cards.map(c=>{const st=cardStats(c);return{name:c.name,value:st.util,color:st.lvl==='bad'?'var(--bad)':st.lvl==='warn'?'var(--warn)':'var(--good)'}}),{fmt:v=>pct(v)})}
     ${S.loans.length?`<h3 style="margin:16px 0 6px">Avance de préstamos</h3>${hbars(S.loans.map(l=>{const st=loanStats(l);return{name:l.name,value:l.n?st.paid/l.n:0,color:'var(--c2)'}}),{fmt:v=>pct(v,0)+' pagado'})}`:''}</div>`:''}
   <div class="panel"><div class="panel-head"><h2>Tarjetas de crédito</h2><button class="btn sm" data-a="newCard">${icon('plus')}Agregar tarjeta</button></div>
    ${S.cards.length?cards:`<div class="empty">No has agregado tarjetas.</div>`}
    ${S.cards.length?`<p class="note" style="margin-top:12px">¿Te llegó un estado de cuenta nuevo? Edita la tarjeta y actualiza “¿Cuánto debes hoy?”. El conteo vuelve a empezar desde hoy.</p>`:''}</div>
   <div class="panel-head" style="margin:6px 0 0"><h2>Préstamos, créditos e hipotecas</h2><button class="btn sm" data-a="newLoan">${icon('plus')}Agregar préstamo</button></div>
   ${S.loans.length?`<div class="grid g2">${loans}</div>`:`<div class="panel"><div class="empty">No tienes préstamos registrados.</div></div>`}
  </div>`}

/* ---------- Préstamos (dinero que te deben) ---------- */
function tabPrestado(){
  const rt=lentTotals(),active=S.lent.filter(l=>!lentStats(l).done),done=S.lent.filter(l=>lentStats(l).done);
  const row=l=>{const st=lentStats(l);return `<div class="card-row">
    <div class="stack" style="gap:6px"><div class="row" style="justify-content:space-between"><h3>${esc(l.name)}</h3>${st.done?`<span class="chip good">Liquidado</span>`:st.overdue?`<span class="chip bad">Vencido</span>`:st.remindDue?`<span class="chip warn">Recordatorio</span>`:`<span class="chip plain">Activo</span>`}</div>
     ${l.contact?`<span class="small muted">${esc(l.contact)}</span>`:''}
     <div class="facts"><span>Prestado <b>${money(l.amount)}</b></span><span>Recibido <b>${money(st.received)}</b></span><span>Te deben <b class="${st.outstanding>0?'neg':''}">${money(st.outstanding)}</b></span></div></div>
    <div class="facts" style="flex-direction:column;gap:3px">
     <span>Prestado el: <b>${fDate(l.dateGiven)}</b></span>
     ${l.installments?`<span>A plazos: <b>${money(l.instAmount)}</b> ${l.instFreq==='semanal'?'cada semana':l.instFreq==='quincenal'?'cada quincena':'cada mes'}</span>`:`<span>Fecha acordada de pago: <b>${fDate(l.dueDate)}</b></span>`}
     ${!st.done&&st.nextDue?`<span>Próximo cobro: <b>${fDate(st.nextDue)}</b></span>`:''}
     ${l.remind&&l.reminderDate?`<span>Recordatorio: <b>${fDate(l.reminderDate)}</b></span>`:''}</div>
    <div class="row" style="justify-content:flex-end">${!st.done?`<button class="btn sm" data-a="collectLent" data-id="${l.id}">Registrar cobro</button>`:''}<button class="btn ghost sm" data-a="editLent" data-id="${l.id}" aria-label="Editar">${icon('edit')}</button><button class="btn ghost sm" data-a="delLent" data-id="${l.id}" aria-label="Eliminar">${icon('del')}</button></div></div>`};
  return `<div class="page-head"><div><h1>Préstamos</h1><p>Dinero que le prestaste a alguien más. Al registrar un préstamo, se descuenta de tu efectivo disponible.</p></div><button class="btn primary" data-a="newLent">${icon('plus')}Agregar préstamo</button></div>
  <div class="stack">
   <div class="kpis">${kpi('Total que te deben',M(rt),`${active.length} préstamo${active.length===1?'':'s'} activo${active.length===1?'':'s'}`,'hero')}${kpi('Prestado en total',M(sum(S.lent,l=>l.amount)),`${S.lent.length} registrados`)}${kpi('Ya te pagaron',M(sum(S.lent,l=>lentStats(l).received)))}</div>
   ${S.lent.length?`<div class="grid g2">${S.lent.map(row).join('')}</div>`:`<div class="panel"><div class="empty">No has registrado préstamos a otras personas.</div></div>`}
  </div>`}

/* ---------- Cajas de ahorro ---------- */
function jarSimPanel(j){
  const z=U.jarSim,r=compoundSim(z,j.rate||0);
  const f=(id,l,inp)=>`<div class="fld"><label for="${id}">${l}</label>${inp}</div>`;
  return `<div class="panel" style="margin-top:10px;background:var(--surface2)"><h3 style="margin-bottom:12px">Simular interés compuesto</h3>
   <div class="form">
    ${f('jsAmt','Cifra a guardar',`<input class="inp money" id="jsAmt" type="text" inputmode="decimal" autocomplete="off" data-ch="jarSim" placeholder="0.00" value="${z.amount??''}">`)}
    ${f('jsMonths','¿Cuántos meses lo dejarás guardado?',`<input class="inp num" id="jsMonths" type="text" inputmode="numeric" autocomplete="off" data-ch="jarSim" placeholder="Ej. 12" value="${z.months??''}">`)}
    ${f('jsFreq','¿Depositarás cada cierto tiempo?',`<select class="inp" id="jsFreq" data-ch="jarSim"><option value="unico"${z.freq==='unico'?' selected':''}>No, solo un depósito único</option><option value="mensual"${z.freq==='mensual'?' selected':''}>Sí, cada mes</option><option value="semanal"${z.freq==='semanal'?' selected':''}>Sí, cada semana</option></select>`)}
    ${z.freq!=='unico'?f('jsContrib','¿Cuánto depositarás cada vez?',`<input class="inp money" id="jsContrib" type="text" inputmode="decimal" autocomplete="off" data-ch="jarSim" placeholder="0.00" value="${z.contrib??''}">`):''}
   </div>
   ${!j.rate?`<p class="small muted" style="margin-top:10px">Esta caja no tiene rendimiento anual configurado. Edítala para agregarlo y ver el efecto del interés compuesto.</p>`:''}
   ${z.loading&&r.ok?`<div class="empty" style="margin-top:10px">${sheepLoader(5)}<p class="small muted" style="margin-top:10px">Calculando tu simulación…</p></div>`:
   r.ok?`<dl class="dl" style="margin-top:12px">
     <div><dt>Con lo que tuviste al inicio</dt><dd>${money(r.P0)}</dd></div>
     <div><dt>Te sumará el interés compuesto</dt><dd class="pos">+${money(r.growth)}</dd></div>
     <div><dt>Sin interés compuesto tendrías</dt><dd>${money(r.noCompound)}</dd></div>
     <div class="tot"><dt>Tendrías al final</dt><dd>${money(r.fv)}</dd></div>
    </dl>
    ${barChart({labels:r.pts.map(p=>String(p.k)),series:[{name:'Con interés compuesto',color:'var(--c2)',values:r.pts.map(p=>Math.round(p.fv*100)/100)},{name:'Sin interés compuesto',color:'var(--c4)',values:r.pts.map(p=>Math.round(p.lin*100)/100)}],every:1,h:200,w:420})}`
   :`<p class="empty" style="margin-top:10px">Escribe la cifra a guardar y los meses para ver la simulación.</p>`}
  </div>`}
function tabAhorros(){
  const rows=S.savings.map(j=>{const st=jarStats(j),sim=U.jarSim&&U.jarSim.id===j.id,vis=j.visible!==false;
    return `<div class="panel">
     <div class="panel-head"><div><h3>${esc(j.name)}</h3><p>${esc(methodName(j.bank))}${j.rate?` · rendimiento anual ${pct(j.rate,2)}`:''}</p></div>
      <div class="row">${j.spendable?`<span class="chip acc">Disponible para gastos</span>`:vis?`<span class="chip good">En tu balance</span>`:`<span class="chip plain">Oculta del balance</span>`}<button class="btn ghost sm" data-a="editJar" data-id="${j.id}" aria-label="Editar">${icon('edit')}</button><button class="btn ghost sm" data-a="delJar" data-id="${j.id}" aria-label="Eliminar">${icon('del')}</button></div></div>
     <div class="kpi hero" style="margin-bottom:10px"><span class="lbl">Tienes guardado</span><span class="val">${money(st.balance)}</span>${j.rate?`<span class="sub">+${money(st.interestEarned)} ganado por interés hasta hoy</span>`:''}</div>
     <div class="row" style="gap:16px;margin-bottom:10px">
      <label class="chk"><input type="checkbox" data-a="toggleJarVisible" data-id="${j.id}"${vis?' checked':''}> Mostrar en balance real</label>
      <label class="chk"><input type="checkbox" data-a="toggleJarSpendable" data-id="${j.id}"${j.spendable?' checked':''}> Disponible para gastos</label>
     </div>
     <div class="row"><button class="btn sm" data-a="depositJar" data-id="${j.id}">${icon('plus')}Depositar</button><button class="btn sm ghost" data-a="withdrawJar" data-id="${j.id}">Retirar</button><button class="btn sm ghost" data-a="toggleJarSim" data-id="${j.id}" aria-pressed="${sim}">${sim?'Ocultar simulación':'Simular interés compuesto'}</button></div>
     ${sim?jarSimPanel(j):''}
    </div>`}).join('');
  return `<div class="page-head"><div><h1>Cajas de ahorro</h1><p>Aparta dinero con un objetivo, separado de tu efectivo del día a día. Cada depósito o retiro se registra como movimiento, y si le pones un rendimiento anual, la caja crece sola cada día, como en la app de tu banco.</p></div><button class="btn primary" data-a="newJar">${icon('plus')}Agregar caja</button></div>
  <div class="stack">
   <div class="kpis">${kpi('Guardado en cajas',M(savingsTotal()),`${S.savings.length} caja${S.savings.length===1?'':'s'}`,'hero')}${kpi('Cuenta en tu balance',M(savingsTotal(true)))}</div>
   ${S.savings.length?`<div class="grid g2">${rows}</div>`:`<div class="panel"><div class="empty">No has creado cajas de ahorro.</div></div>`}
  </div>`}

/* ---------- Plan de pagos ---------- */
function tabPlan(){
  const items=planItems(),weeks=planWeeks(items),t=today();
  const body=weeks.filter(w=>w.items.length).map(w=>`<div class="day-h row" style="justify-content:space-between"><span>Semana ${fWeek(w.ws)}</span><span class="${w.sobra<0?'neg':''}">Te sobra ${money(w.sobra)}</span></div>
    ${w.items.map(x=>`<div class="li"><label class="chk" style="align-items:flex-start"><input type="checkbox" data-a="togglePaid" data-key="${esc(x.key)}"${x.paid?' checked':''}><span><span class="t" style="${x.paid?'text-decoration:line-through;color:var(--muted)':''}">${esc(x.name)}</span><br><span class="m">${x.type} · vence ${fDay(x.date)}${!x.paid&&x.date<t?' · <span class="neg">vencido</span>':''}</span></span></label>${M(x.amount)}</div>`).join('')}`).join('');
  return `<div class="page-head"><div><h1>Plan de pagos</h1><p>Lo que vence en las próximas ${WEEKS} semanas. Palomea cada pago al hacerlo: se registra como movimiento y baja tu deuda.</p></div>${chartToggle('plan')}</div>
  <div class="stack">
   <div class="kpis">${kpi('Dinero disponible hoy',Ms(cashNow()),'Efectivo + banco')}${kpi('Te entra por semana (neto)',M(weeklyAvail()),'Ingreso esperado − meta de gasto personal')}${kpi('Pendiente este mes',M(sum(items.filter(x=>!x.paid&&x.date<=monthEnd(t)),x=>x.amount)))}</div>
   ${P.charts.plan?`<div class="panel"><div class="panel-head"><h2>Lo que te sobra cada semana</h2><p>Rojo = te faltaría dinero</p></div>${barChart({labels:weeks.map(w=>fDate(w.ws)),series:[{name:'Sobra',color:'var(--c2)',values:weeks.map(w=>w.sobra)},{name:'Pagos',color:'var(--c4)',values:weeks.map(w=>w.pending)}]})}</div>`:''}
   <div class="panel"><div class="panel-head"><h2>Resumen por semana</h2></div><div class="tbl-wrap"><table><thead><tr><th>Semana</th><th class="r">Tarjetas</th><th class="r">Préstamos</th><th class="r">Fijos y ahorro</th><th class="r">Total</th><th class="r">Disponible</th><th class="r">Sobra</th></tr></thead>
    <tbody>${weeks.map(w=>`<tr><td>${fWeek(w.ws)}</td><td class="r">${M(w.byType.Tarjeta)}</td><td class="r">${M(w.byType.Préstamo)}</td><td class="r">${M(w.byType.Otros)}</td><td class="r">${M(w.pending)}</td><td class="r">${M(w.disp)}</td><td class="r">${Ms(w.sobra)}</td></tr>`).join('')}</tbody></table></div>
    <p class="small muted" style="margin-top:10px">Disponible = lo que sobró la semana anterior + lo que te entra por semana. La primera semana parte de tu dinero de hoy.</p></div>
   <div class="panel"><div class="panel-head"><h2>Pagos</h2></div>${body||`<div class="empty">No hay pagos programados. Agrega tarjetas, préstamos o suscripciones.</div>`}</div>
  </div>`}

/* ---------- Suscripciones ---------- */
function subCharged(s,mk){return S.txs.some(t=>t.subId===s.id&&t.date.startsWith(mk))}
function tabSubs(){
  const tot=sum(S.subs,s=>s.amount),wk=tot*12/52,inc=expectedWeekly(),mk=today().slice(0,7);
  const top=S.subs.slice().sort((a,b)=>b.amount-a.amount).slice(0,2);
  const rows=S.subs.slice().sort((a,b)=>a.day-b.day).map(s=>{const done=subCharged(s,mk);return `<tr><td><b style="font-weight:500">${esc(s.name)}</b><div class="small muted">${esc(s.cat)}</div></td><td class="r">${M(s.amount)}</td><td class="r num">${s.day}</td><td>${esc(methodName(s.method))}</td>
    <td>${done?'<span class="chip good">Cobrado este mes</span>':`<button class="btn sm" data-a="chargeSub" data-id="${s.id}">Registrar cobro</button>`}</td><td class="r"><button class="btn ghost sm" data-a="editSub" data-id="${s.id}" aria-label="Editar">${icon('edit')}</button><button class="btn ghost sm" data-a="delSub" data-id="${s.id}" aria-label="Eliminar">${icon('del')}</button></td></tr>`}).join('');
  return `<div class="page-head"><div><h1>Suscripciones y pagos fijos</h1><p>Lo que se cobra solo cada mes y cuánto pesa sobre tu ingreso.</p></div><div class="row">${chartToggle('subs')}<button class="btn primary" data-a="newSub">${icon('plus')}Agregar</button></div></div>
  <div class="stack">
   <div class="kpis">${kpi('Total mensual',M(tot),`${S.subs.length} servicios`,'hero')}${kpi('Total anual',M(tot*12))}${kpi('Equivalente semanal',M(wk))}${kpi('% de tu ingreso semanal',`<span class="num">${inc?pct(wk/inc):'—'}</span>`,inc?`Ingreso esperado ${money0(inc)}`:'Configura tu ingreso')}</div>
   ${P.charts.subs&&S.subs.length?`<div class="panel"><div class="panel-head"><h2>Cuánto cuesta cada una al mes</h2></div>${hbars(S.subs.map(s=>({name:s.name,value:+s.amount})).sort((a,b)=>b.value-a.value),{color:'var(--c3)'})}</div>`:''}
   <div class="panel">${S.subs.length?`<div class="tbl-wrap"><table><thead><tr><th>Servicio</th><th class="r">Mensual</th><th class="r">Día</th><th>Se cobra a</th><th>Este mes</th><th></th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td>Total</td><td class="r">${M(tot)}</td><td colspan="4"></td></tr></tfoot></table></div>`:`<div class="empty">No has agregado suscripciones.</div>`}</div>
   ${top.length>=2?`<p class="note">Si quieres recortar: ${esc(top[0].name)} + ${esc(top[1].name)} suman ${money(top[0].amount+top[1].amount)} al mes (${money((+top[0].amount+ +top[1].amount)*12)} al año).</p>`:''}
  </div>`}

/* ---------- Simulador de préstamo ---------- */
function simulateLoan(){
  const z=U.simLoan,P0=+z.amount||0,n=Math.max(0,Math.round(+z.n||0)),pay=+z.payment||0,freq=z.freq;
  const ok=P0>0&&n>0&&pay>0;
  const total=pay*n,interest=Math.max(0,total-P0),interestPct=P0>0?interest/P0:0,perPeriodInterest=n>0?interest/n:0;
  const rate=ok?impliedRate(P0,pay,n):0;
  const wCost=pay*(FREQ_W[freq]||1),wAvail=weeklyAvail(),wFree=wAvail-wCost,cushion=+S.settings.emergency||0;
  let lvl=0,why='Te alcanza sin apretar tu semana ni tocar tu colchón.';
  if(ok){
    if(wFree>=0){lvl=0;why=`Después de este pago te quedarían ${money(wFree)} libres cada semana.`}
    else if(-wFree<=cushion){lvl=1;why=`Te faltarían ${money(-wFree)} cada semana: tendrías que recortar gastos o usar tu colchón.`}
    else{lvl=2;why=`Te faltarían ${money(-wFree)} cada semana y tu colchón (${money(cushion)}) no alcanzaría para cubrirlo.`}}
  return{P0,n,pay,freq,ok,total,interest,interestPct,perPeriodInterest,rate,wCost,wAvail,wFree,cushion,lvl,why}}
function tabSimPrestamo(seg){
  const z=U.simLoan,r=simulateLoan(),labels=['VERDE: sí te conviene pedirlo','AMARILLO: te va a apretar','ROJO: mejor no lo pidas'],cls=['good','warn','bad'];
  const f=(id,l,inp,hint)=>`<div class="fld"><label for="${id}">${l}</label>${inp}${hint?`<span class="hint">${esc(hint)}</span>`:''}</div>`;
  return `<div class="page-head"><div><h1>Simulador de préstamo</h1><p>Antes de pedir un préstamo, calcula cuánto te va a costar y si te alcanza según cómo va tu dinero.</p></div><div class="row">${seg}${chartToggle('simLoan')}</div></div>
  <div class="grid g2" style="align-items:start">
   <div class="panel"><h2 style="margin-bottom:12px">El préstamo</h2><div class="form">
    ${f('slAmt','Monto a solicitar',`<input class="inp money" id="slAmt" type="text" inputmode="decimal" autocomplete="off" data-ch="simLoan" placeholder="0.00" value="${z.amount??''}">`)}
    ${f('slFreq','Plazo de pago',`<select class="inp" id="slFreq" data-ch="simLoan">${LENT_FREQ.map(([v,l])=>`<option value="${v}"${z.freq===v?' selected':''}>${l}</option>`).join('')}</select>`)}
    ${f('slN','¿Cuántos plazos son?',`<input class="inp num" id="slN" type="text" inputmode="numeric" autocomplete="off" data-ch="simLoan" placeholder="Ej. 12" value="${z.n??''}">`)}
    ${f('slPay','¿Cuánto pagarás en cada plazo?',`<input class="inp money" id="slPay" type="text" inputmode="decimal" autocomplete="off" data-ch="simLoan" placeholder="0.00" value="${z.payment??''}">`)}
   </div>${r.ok&&!z.loading?`<div class="row" style="margin-top:16px"><button class="btn" data-a="simRegisterLoan">Agregar este préstamo</button></div>`:''}</div>
   <div class="stack">
    ${z.loading&&r.ok?`<div class="panel"><div class="empty">${sheepLoader(5)}<p class="small muted" style="margin-top:10px">Calculando tu préstamo…</p></div></div>`:
    r.ok?`<div class="light-sig ${cls[r.lvl]}"><span class="dot"></span><span>${labels[r.lvl]}<small>${esc(r.why)}</small></span></div>
    <div class="panel"><dl class="dl">
     <div><dt>Monto solicitado</dt><dd>${money(r.P0)}</dd></div>
     <div><dt>Pago por plazo (${z.freq})</dt><dd>${money(r.pay)}</dd></div>
     <div><dt>Monto total a pagar (${r.n} plazos)</dt><dd>${money(r.total)}</dd></div>
     <div class="tot"><dt>Interés total</dt><dd>${money(r.interest)} · ${pct(r.interestPct)} del monto</dd></div>
     <div><dt>Interés por plazo (promedio)</dt><dd>${money(r.perPeriodInterest)}</dd></div>
     <div><dt>Tasa ${z.freq} implícita (estimada)</dt><dd>${pct(r.rate,2)}</dd></div>
    </dl>${r.total<r.P0?`<p class="err" style="margin-top:10px">Con esos números pagarías menos de lo que pides prestado; revisa el monto, los plazos o el pago por plazo.</p>`:''}</div>
    <div class="panel"><div class="panel-head"><h2>Cómo afecta tu balance</h2><p>Comparado con tu semana libre actual</p></div><dl class="dl">
     <div><dt>Lo que te queda libre por semana hoy</dt><dd class="${r.wAvail<0?'neg':''}">${money(r.wAvail)}</dd></div>
     <div><dt>Costo semanal equivalente de este préstamo</dt><dd>${money(r.wCost)}</dd></div>
     <div class="tot"><dt>Te quedaría libre por semana con el préstamo</dt><dd class="${r.wFree<0?'neg':'pos'}">${money(r.wFree)}</dd></div>
    </dl></div>
    ${P.charts.simLoan?`<div class="panel"><div class="panel-head"><h2>Capital vs. interés</h2><p>Del total que pagarías</p></div>${hbars([{name:'Capital',value:r.P0,color:'var(--c2)'},{name:'Interés',value:r.interest,color:'var(--c4)'}])}</div>`:''}`
    :`<div class="panel"><div class="empty">Escribe el monto, los plazos y cuánto pagarás en cada uno para ver el resultado.</div></div>`}
   </div></div>`}

/* ---------- Simulador ---------- */
function simulate(){
  const z=U.sim,amt=+z.amount||0,s=S.settings,card=S.cards.find(c=>c.id===z.card);
  const mode=(z.mode!=='efectivo'&&!card)?'efectivo':z.mode;
  const months=mode==='msi'?Math.max(2,+z.months||2):1;
  const impact=mode==='msi'?amt/months:amt;
  const outDate=mode==='efectivo'?z.date:dueAfterPurchase(card,z.date);
  const weeks=planWeeks(),w=weeks.find(x=>outDate>=x.ws&&outDate<=x.we);
  const libre=w?w.sobra:weeklyAvail();
  const covered=clamp(impact,0,Math.max(0,libre)),uncovered=impact-covered;
  const cushion=+s.emergency||0;
  let lvl=0,why='Se cubre con dinero libre de esa semana, sin tocar tus pagos ni tu colchón.';
  if(uncovered>0){if(uncovered<=cushion){lvl=1;why=`Te faltarían ${money(uncovered)} esa semana: tendrías que usar tu colchón o recortar pagos.`}else{lvl=2;why=`Te faltarían ${money(uncovered)} esa semana y tu colchón no alcanza.`}
    if(weeklyAvail()>0&&uncovered>s.redPct*weeklyAvail()){lvl=2;why=`La compra se come más del ${pct(s.redPct,0)} de lo que te entra por semana y no tienes dinero libre.`}}
  let cs=null;if(card&&mode!=='efectivo'){const st=cardStats(card);const after=st.limit?(st.used+amt)/st.limit:1;cs={st,after};
    if(amt>st.avail){lvl=2;why=`No te alcanza el crédito de ${card.name}: tienes ${money(st.avail)} disponibles.`}
    else if(after>=s.utilCrit){lvl=Math.max(lvl,2);why+=` Además ${card.name} quedaría al ${pct(after)} de uso.`}
    else if(after>=s.utilWarn){lvl=Math.max(lvl,1);why+=` ${card.name} quedaría al ${pct(after)} de uso (recomendado: menos de ${pct(s.utilWarn,0)}).`}}
  const g=cat(z.cat),personal=g&&g.group==='Variable';
  const m=stats(txIn(monthStart(z.date),monthEnd(z.date))).personal;
  return{amt,impact,outDate,w,libre,covered,uncovered,lvl,why,cs,months,mode,personal,m,mAfter:m+(personal?amt:0),card}}
function tabSimulador(){
  const simTab=U.simTab==='prestamo'?'prestamo':'compra';
  const seg=`<div class="seg" role="group" aria-label="Tipo de simulador"><button data-a="simTab" data-v="compra" aria-pressed="${simTab==='compra'}">Compra</button><button data-a="simTab" data-v="prestamo" aria-pressed="${simTab==='prestamo'}">Préstamo</button></div>`;
  if(simTab==='prestamo')return tabSimPrestamo(seg);
  const z=U.sim,r=simulate(),labels=['VERDE: puedes hacerla','AMARILLO: piénsalo','ROJO: mejor no'],cls=['good','warn','bad'];
  const gastoCats=S.categories.filter(c=>c.type==='Gasto'&&c.group!=='Deuda').map(c=>c.name);
  const f=(id,l,inp)=>`<div class="fld"><label for="${id}">${l}</label>${inp}</div>`;
  return `<div class="page-head"><div><h1>Simulador de compra</h1><p>Antes de comprar algo, ve si te alcanza sin descuadrar tus pagos, tu colchón ni tus tarjetas.</p></div><div class="row">${seg}${chartToggle('sim')}</div></div>
  <div class="grid g2" style="align-items:start">
   <div class="panel"><h2 style="margin-bottom:12px">La compra</h2><div class="form">
    ${f('simWhat','¿Qué quieres comprar?',`<input class="inp" id="simWhat" data-ch="sim" placeholder="Ej. audífonos" value="${esc(z.what)}">`)}
    ${f('simAmt','Monto',`<input class="inp money" id="simAmt" type="text" inputmode="decimal" autocomplete="off" data-ch="sim" placeholder="0.00" value="${z.amount??''}">`)}
    ${f('simCat','Categoría',`<select class="inp" id="simCat" data-ch="sim">${gastoCats.map(c=>`<option${c===z.cat?' selected':''}>${esc(c)}</option>`).join('')}</select>`)}
    ${f('simDate','Fecha de compra',`<input class="inp" type="date" id="simDate" data-ch="sim" value="${z.date}">`)}
    ${f('simMode','Forma de pago',`<select class="inp" id="simMode" data-ch="sim"><option value="efectivo"${z.mode==='efectivo'?' selected':''}>Efectivo o débito</option>${S.cards.length?`<option value="tarjeta"${z.mode==='tarjeta'?' selected':''}>Tarjeta (pago completo)</option><option value="msi"${z.mode==='msi'?' selected':''}>Tarjeta a meses sin intereses</option>`:''}</select>`)}
    ${z.mode!=='efectivo'&&S.cards.length?f('simCard','Tarjeta',`<select class="inp" id="simCard" data-ch="sim">${S.cards.map(c=>`<option value="${c.id}"${c.id===z.card?' selected':''}>${esc(c.name)}</option>`).join('')}</select>`):''}
    ${z.mode==='msi'?f('simMonths','Meses',`<select class="inp" id="simMonths" data-ch="sim">${[3,6,9,12,18,24].map(n=>`<option${+z.months===n?' selected':''}>${n}</option>`).join('')}</select>`):''}
   </div>${r.amt>0&&!z.loading?`<div class="row" style="margin-top:16px"><button class="btn" data-a="simRegister">Registrar esta compra</button></div>`:''}</div>
   <div class="stack">
    ${z.loading&&r.amt>0?`<div class="panel"><div class="empty">${sheepLoader(5)}<p class="small muted" style="margin-top:10px">Calculando tu compra…</p></div></div>`:
    r.amt>0?`<div class="light-sig ${cls[r.lvl]}"><span class="dot"></span><span>${labels[r.lvl]}<small>${esc(r.why)}</small></span></div>
    <div class="panel"><dl class="dl">
     <div><dt>Lo que sale de tu bolsillo${r.mode==='msi'?' (primera mensualidad)':''}</dt><dd>${money(r.impact)}</dd></div>
     <div><dt>Fecha en que sale el dinero</dt><dd>${fDate(r.outDate,1)}</dd></div>
     <div><dt>Libre esa semana (según tu plan)</dt><dd class="${r.libre<0?'neg':''}">${money(r.libre)}</dd></div>
     <div><dt>Cubierto con lo libre</dt><dd>${money(r.covered)}</dd></div>
     <div><dt>Sin cubrir (tocaría colchón o pagos)</dt><dd class="${r.uncovered>0?'neg':''}">${money(r.uncovered)}</dd></div>
     ${r.cs?`<div><dt>Uso de ${esc(r.card.name)}: hoy → después</dt><dd>${pct(r.cs.st.util)} → ${pct(r.cs.after)}</dd></div><div><dt>Crédito disponible en esa tarjeta</dt><dd>${money(r.cs.st.avail)}</dd></div>`:''}
     ${r.personal?`<div><dt>Gasto personal del mes: real → con la compra</dt><dd>${money(r.m)} → ${money(r.mAfter)}</dd></div><div><dt>Meta de gasto personal del mes</dt><dd>${money(monthlyGoal())}</dd></div>`:''}
    </dl></div>
    ${P.charts.sim?`<div class="panel"><div class="panel-head"><h2>Antes y después</h2></div>${barChart({labels:['Libre esa semana','Gasto personal del mes'].concat(r.cs?['Deuda en la tarjeta']:[]),series:[{name:'Antes',color:'var(--c2)',values:[r.libre,r.m].concat(r.cs?[r.cs.st.used]:[])},{name:'Después',color:'var(--c1)',values:[r.libre-r.impact,r.mAfter].concat(r.cs?[r.cs.st.used+r.amt]:[])}],every:1,h:220,w:420})}</div>`:''}`
    :`<div class="panel"><div class="empty">Escribe el monto de la compra para ver el semáforo.</div></div>`}
   </div></div>`}

/* ---------- Configuración ---------- */
function tabConfig(){
  const s=S.settings;
  const cats=S.categories.map((c,i)=>`<tr><td>${esc(c.name)}</td><td>${c.type}</td><td>${esc(GROUPS[c.group]||c.group)}</td><td class="r"><button class="btn ghost sm" data-a="delCat" data-i="${i}" aria-label="Eliminar">${icon('del')}</button></td></tr>`).join('');
  return `<div class="page-head"><div><h1>Configuración</h1><p>${U.acct?'Tus datos se guardan cifrados en tu cuenta y se abren en cualquier dispositivo con tu usuario y contraseña.':'Tus datos se guardan solo en este navegador. Exporta un respaldo de vez en cuando para no perderlos.'}</p></div></div>
  <div class="stack">${accountPanel()}
   <div class="panel" id="setPanel"><div class="panel-head"><h2>Tus datos</h2></div>
    ${formHTML(SET_F,Object.assign({},s,{initialBalance:Math.round(cashNow()*100)/100}),'s_')}
    <h3 style="margin:18px 0 10px">Alertas</h3><div class="form">
     ${field({k:'utilWarn',l:'Uso de tarjeta recomendado (%)',t:'number',max:100},Math.round(s.utilWarn*100),'s_')}
     ${field({k:'utilCrit',l:'Uso de tarjeta crítico (%)',t:'number',max:100},Math.round(s.utilCrit*100),'s_')}
     ${field({k:'redPct',l:'Semáforo rojo si la compra supera este % de lo que te entra por semana',t:'number',max:100},Math.round(s.redPct*100),'s_')}</div>
    <div class="row" style="margin-top:16px"><button class="btn primary" data-a="saveSettings">Guardar cambios</button><span class="small muted">Ingreso semanal esperado: ${money(expectedWeekly())} · Meta semanal: ${money(weeklyGoal())}</span></div></div>
   <div class="panel"><div class="panel-head"><h2>Categorías</h2><button class="btn sm" data-a="newCat">${icon('plus')}Agregar categoría</button></div>
    <div class="tbl-wrap"><table><thead><tr><th>Categoría</th><th>Tipo</th><th>Grupo</th><th></th></tr></thead><tbody>${cats}</tbody></table></div>
    <p class="small muted" style="margin-top:10px">El grupo decide dónde cuenta cada gasto: “del día a día” va contra tu meta, “fijos” son suscripciones, “deudas” son pagos a tarjetas o préstamos, “neutral” entra y sale (como la gasolina).</p></div>
   <div class="panel"><div class="panel-head"><h2>Apariencia</h2></div>${themeSeg()}</div>
   <div class="panel"><div class="panel-head"><h2>Respaldo</h2></div>
    <div class="row"><button class="btn" data-a="export">Exportar respaldo (.json)</button><button class="btn" data-a="pickImport">Importar respaldo (archivo)</button><input type="file" id="impFile" accept=".json,application/json" hidden>
     <button class="btn ghost" data-a="rerunSetup">Volver a la configuración inicial</button><button class="btn danger" data-a="reset">Borrar todos mis datos</button></div>
    <div id="exportBox"></div>
    <p class="small muted" style="margin-top:14px">¿El botón de arriba no abre nada? Pega aquí el contenido del archivo de respaldo.</p>
    <div class="row"><textarea class="inp num" id="impPaste" rows="3" placeholder="Pega aquí el JSON del respaldo" style="font-size:.75rem;flex:1;min-width:220px"></textarea></div>
    <div class="row" style="margin-top:8px"><button class="btn" data-a="pasteImport">Importar este texto</button></div></div>
  </div>`}
function themeSeg(){return `<div class="seg" role="group" aria-label="Tema">${[['system','Sistema'],['light','Claro'],['dark','Oscuro']].map(([v,l])=>`<button data-a="theme" data-v="${v}" aria-pressed="${P.theme===v}">${l}</button>`).join('')}</div>`}
