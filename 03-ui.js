
/* ---------- Gráficas (SVG) ---------- */
function nice(v){if(v<=0)return 1;const e=Math.pow(10,Math.floor(Math.log10(v)));const f=v/e;return(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*e}
function barChart({labels,series,goal,goalLabel,h=210,every,w=640}){
  const W=w,H=h,L=62,R=10,T=12,B=26,pw=W-L-R,ph=H-T-B;
  const all=series.flatMap(s=>s.values).concat(goal!=null?[goal]:[]);
  let mx=Math.max(0,...all),mn=Math.min(0,...all);
  const step=nice((mx-mn)/4||1);mx=Math.ceil(mx/step)*step||step;mn=Math.floor(mn/step)*step;
  const y=v=>T+ph-(v-mn)/(mx-mn)*ph;
  const gw=pw/labels.length,bw=Math.min(28,gw*.74/series.length);
  every=every||Math.ceil(labels.length/12);
  let g='';
  for(let v=mn;v<=mx+1e-9;v+=step){g+=`<line class="grid-l" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L-8}" y="${y(v)+3.5}" text-anchor="end">${money0(v)}</text>`}
  labels.forEach((lb,i)=>{const gx=L+gw*i+gw/2,x0=gx-bw*series.length/2;
    series.forEach((s,j)=>{const v=s.values[i]||0,y1=y(Math.max(v,0)),y2=y(Math.min(v,0));const hh=Math.max(v===0?0:1.5,y2-y1);
      g+=`<rect x="${x0+j*bw+.5}" y="${y1}" width="${Math.max(1,bw-1)}" height="${hh}" rx="2" style="fill:${v<0?'var(--bad)':s.color}"><title>${esc(lb)} · ${esc(s.name)}: ${money(v)}</title></rect>`});
    if(i%every===0)g+=`<text x="${gx}" y="${H-8}" text-anchor="middle">${esc(lb)}</text>`});
  if(goal!=null){g+=`<line x1="${L}" x2="${W-R}" y1="${y(goal)}" y2="${y(goal)}" style="stroke:var(--ink);stroke-dasharray:4 4;stroke-width:1.2;opacity:.55"/>`}
  const leg=series.map(s=>`<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')+(goal!=null?`<span><i style="background:none;border-top:2px dashed var(--ink);height:0;opacity:.6"></i>${esc(goalLabel||'Meta')}</span>`:'');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg><div class="legend">${leg}</div>`}
function hbars(rows,{color='var(--c1)',fmt=money}={}){const mx=Math.max(...rows.map(r=>r.value),0)||1;
  if(!rows.length)return `<div class="empty">Sin datos en este periodo.</div>`;
  return rows.map(r=>`<div class="hbar"><span class="nm" title="${esc(r.name)}">${esc(r.name)}</span><span class="bar"><i style="width:${(r.value/mx*100).toFixed(1)}%;background:${r.color||color}"></i></span><span class="money">${fmt(r.value)}</span></div>`).join('')}
function meter(frac,lvl,mark){return `<div class="meter ${lvl||''}"><i style="width:${clamp(frac*100,0,100).toFixed(1)}%"></i>${mark!=null?`<span class="mark" style="left:${clamp(mark*100,0,100)}%"></span>`:''}</div>`}
function goalChip(spent,goal){if(!(goal>0))return `<span class="chip plain">Sin meta</span>`;const f=spent/goal;return f>1?`<span class="chip bad">Pasaste la meta</span>`:f>.8?`<span class="chip warn">Cerca del límite</span>`:`<span class="chip good">Vas bien</span>`}
function utilChip(u){const s=S.settings;return u>=s.utilCrit?`<span class="chip bad">${pct(u)} usado</span>`:u>=s.utilWarn?`<span class="chip warn">${pct(u)} usado</span>`:`<span class="chip good">${pct(u)} usado</span>`}
function chartToggle(id){const on=!!P.charts[id];return `<button class="btn sm ${on?'':'ghost'}" data-a="toggleChart" data-id="${id}" aria-pressed="${on}"><svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>${on?'Ocultar gráfica':'Ver gráfica'}</button>`}
const kpi=(lbl,val,sub,cls='')=>`<div class="kpi ${cls}"><span class="lbl">${lbl}</span><span class="val">${val}</span>${sub?`<span class="sub">${sub}</span>`:''}</div>`;
const sheepLoader=(n,cls)=>`<div class="sheep-loader${cls?' '+cls:''}" role="status" aria-label="Cargando">${'<span aria-hidden="true">🐑</span>'.repeat(n||5)}</div>`;

/* ---------- Iconos ---------- */
const IC={
 windmill:'<circle cx="12" cy="9" r="1.4"/><path d="M12 9L7 4M12 9l5-5M12 9l-4 6M12 9l4 6M12 20V9M8 20h8"/>',
 resumen:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
 registro:'<path d="M12 5v14M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="3"/>',
 explorar:'<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
 balance:'<path d="M12 3v18M5 7h14M5 7l-3 7a4 3 0 0 0 6 0zM19 7l-3 7a4 3 0 0 0 6 0z"/>',
 tarjetas:'<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20M6 15h4"/>',
 prestado:'<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="18" cy="16.5" r="4"/><path d="M18 14.7v3.6M16.4 16h3.2"/>',
 plan:'<rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M3 9h18M8 2v4M16 2v4M8 14l2 2 4-4"/>',
 suscripciones:'<path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/>',
 simulador:'<path d="M6 2h12v20H6zM9 6h6M9 11h1M14 11h1M9 15h1M14 15h1M9 19h6"/>',
 config:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',del:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',plus:'<path d="M12 5v14M5 12h14"/>',
 left:'<path d="M15 5l-7 7 7 7"/>',right:'<path d="M9 5l7 7-7 7"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
 ahorros:'<path d="M3 10c0-3.3 4-6 9-6s9 2.7 9 6v3.5c0 1.1-.9 2-2 2h-1v3h-2v-3H9v3H7v-3H6a3 3 0 0 1-3-3z"/><circle cx="16" cy="9" r="1"/><path d="M3 12H1"/>',
 eye:'<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
 eyeOff:'<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22"/>'};
const icon=k=>`<svg viewBox="0 0 24 24">${IC[k]}</svg>`;
const TABS=[['resumen','Resumen'],['registro','Registro'],['explorar','Explorar movimientos'],['balance','Balance real'],['tarjetas','Tarjetas y deudas'],['prestado','Préstamos'],['ahorros','Caja de ahorros'],['plan','Plan de pagos'],['suscripciones','Suscripciones'],['simulador','Simulador de compra'],['config','Configuración']];

/* ---------- Formularios ---------- */
function field(f,v,pre='f_'){const id=pre+f.k;const val=v==null?'':v;const req=f.req?' required':'';let inp;
  switch(f.t){
    case'money':inp=`<input class="inp money" id="${id}" name="${f.k}" type="number" step="0.01" min="0" inputmode="decimal" placeholder="${esc(f.ph||'0.00')}" value="${esc(val)}"${req}>`;break;
    case'number':inp=`<input class="inp num" id="${id}" name="${f.k}" type="number" step="${f.step||1}" min="${f.min??0}" ${f.max!=null?`max="${f.max}"`:''} inputmode="decimal" placeholder="${esc(f.ph||'')}" value="${esc(val)}"${req}>`;break;
    case'day':inp=`<input class="inp num" id="${id}" name="${f.k}" type="number" min="1" max="31" inputmode="numeric" placeholder="1–31" value="${esc(val)}"${req}>`;break;
    case'date':inp=`<input class="inp" id="${id}" name="${f.k}" type="date" value="${esc(val)}"${req}>`;break;
    case'select':inp=`<select class="inp" id="${id}" name="${f.k}"${f.ch?` data-ch="${f.ch}"`:''}>${f.opts.map(o=>{const[a,b]=Array.isArray(o)?o:[o,o];return`<option value="${esc(a)}"${String(a)===String(val)?' selected':''}>${esc(b)}</option>`}).join('')}</select>`;break;
    case'check':return `<div class="fld ${f.wide?'wide':''}"><label class="chk"><input type="checkbox" id="${id}" name="${f.k}"${val?' checked':''}${f.ch?` data-ch="${f.ch}"`:''}> ${esc(f.l)}</label>${f.hint?`<span class="hint">${esc(f.hint)}</span>`:''}</div>`;
    default:inp=`<input class="inp" id="${id}" name="${f.k}" type="text" placeholder="${esc(f.ph||'')}" value="${esc(val)}" autocomplete="off"${req}>`}
  return `<div class="fld ${f.wide?'wide':''}"><label for="${id}">${esc(f.l)}</label>${inp}${f.hint?`<span class="hint">${esc(f.hint)}</span>`:''}</div>`}
const formHTML=(fields,vals,pre)=>`<div class="form">${fields.map(f=>field(f,vals?vals[f.k]:undefined,pre)).join('')}</div>`;
function readForm(root,fields,pre='f_'){const o={},errs=[];for(const f of fields){const el=root.querySelector('#'+CSS.escape(pre+f.k));if(!el)continue;let v;
  if(f.t==='check')v=el.checked;else if(['money','number'].includes(f.t))v=num(el.value);else if(f.t==='day'){v=num(el.value);if(v!=null)v=clamp(Math.round(v),1,31)}else v=el.value.trim();
  if(f.req&&(v===''||v==null))errs.push(f.l);o[f.k]=v}return{o,errs}}

const CARD_F=[{k:'name',l:'Nombre de la tarjeta',ph:'Ej. BBVA Azul',req:1},{k:'limit',l:'Límite de crédito',t:'money',req:1},{k:'balance',l:'¿Cuánto debes hoy?',t:'money',hint:'Lo que marca la app hoy (saldo usado).'},
  {k:'cutDate',l:'Próxima fecha de corte',t:'date',req:1,hint:'Se repite el mismo día cada mes.'},{k:'dueDate',l:'Próxima fecha límite de pago',t:'date',req:1,hint:'La que marca tu estado de cuenta o la app.'},{k:'noInt',l:'Pago para no generar intereses',t:'money',ph:'Opcional',hint:'Si no lo sabes, usamos lo que debes.'}];
const LOAN_KINDS=['Préstamo personal','Crédito de nómina','Hipoteca','Crédito automotriz','Tienda departamental','Otro'];
const LOAN_F=[{k:'name',l:'Nombre',ph:'Ej. Préstamo Coppel',req:1},{k:'kind',l:'Tipo',t:'select',opts:LOAN_KINDS},{k:'original',l:'Monto que te prestaron',t:'money',req:1},
  {k:'payment',l:'Cuota (cada pago)',t:'money',req:1},{k:'freq',l:'Cada cuándo pagas',t:'select',opts:[['semanal','Semanal'],['quincenal','Quincenal'],['mensual','Mensual']]},
  {k:'n',l:'Número total de pagos',t:'number',min:1,req:1},{k:'paidInit',l:'Pagos que ya hiciste',t:'number',min:0},{k:'nextDate',l:'Fecha de tu próximo pago',t:'date',req:1},
  {k:'capital',l:'Monto para liquidar hoy',t:'money',ph:'Opcional',hint:'Si la app te lo da, ponlo; si no, lo estimamos.'}];
const subF=()=>[{k:'name',l:'Servicio',ph:'Ej. Spotify, teléfono, gimnasio',req:1},{k:'amount',l:'Monto mensual',t:'money',req:1},{k:'day',l:'Día de cobro',t:'day',req:1},
  {k:'method',l:'Se cobra a',t:'select',opts:methods().map(m=>[m.id,m.name])},{k:'cat',l:'Categoría',t:'select',opts:S.categories.filter(c=>c.type==='Gasto').map(c=>c.name)}];
const LENT_FREQ=[['semanal','Semanal'],['quincenal','Quincenal'],['mensual','Mensual']];
const SET_F=[{k:'name',l:'Tu nombre',ph:'Cómo te llamamos'},{k:'startDate',l:'Fecha de inicio',t:'date',hint:'Desde aquí se cuentan tus movimientos.'},{k:'initialBalance',l:'Saldo disponible (efectivo + banco)',t:'money',hint:'Tu débito + tu efectivo, sin contar lo que ya está en tus cajas de ahorro. Se actualiza solo con tus movimientos en efectivo o débito (incluye pagos de tarjetas y préstamos). Edítalo aquí para corregirlo o rebalancearlo: no se crea ningún movimiento.'},
  {k:'incomeAmount',l:'Sueldo fijo',t:'money'},{k:'incomeFreq',l:'Te pagan',t:'select',opts:[['semanal','Cada semana'],['quincenal','Cada quincena'],['mensual','Cada mes']]},
  {k:'extraFreq',l:'Extra variable: ¿cada cuándo te llega?',t:'select',opts:[['semanal','Cada semana'],['quincenal','Cada quincena'],['mensual','Cada mes']],hint:'No es fijo ni tiene fecha exacta. Da un rango; usamos el mínimo para tus cálculos.'},
  {k:'extraMin',l:'Mínimo que sueles recibir',t:'money'},{k:'extraMax',l:'Máximo que sueles recibir',t:'money',ph:'Opcional'},
  {k:'dailyGoal',l:'Meta de gasto personal diario',t:'money',hint:'Comida, ocio, transporte… lo del día a día.'},{k:'emergency',l:'Colchón de emergencia',t:'money',hint:'Dinero que quieres tener apartado.'}];
