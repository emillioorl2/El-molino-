(function(){
"use strict";
/* ---------- Utilidades ---------- */
const KEY='libreta-finanzas-v1', PREF='libreta-finanzas-prefs';
const pad=n=>String(n).padStart(2,'0');
const toStr=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=s=>{const[y,m,d]=String(s).split('-').map(Number);return new Date(y,(m||1)-1,d||1)};
const today=()=>toStr(new Date());
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return toStr(d)};
const weekStart=s=>{const d=parse(s);d.setDate(d.getDate()-((d.getDay()+6)%7));return toStr(d)};
const weekEnd=s=>addDays(weekStart(s),6);
const monthStart=s=>s.slice(0,7)+'-01';
const lastDay=(y,m)=>new Date(y,m+1,0).getDate();
const monthEnd=s=>{const d=parse(s);return toStr(new Date(d.getFullYear(),d.getMonth(),lastDay(d.getFullYear(),d.getMonth())))};
const daysBetween=(a,b)=>Math.round((parse(b)-parse(a))/86400000);
const addMonths=(s,n)=>{const d=parse(s);const day=d.getDate();const t=new Date(d.getFullYear(),d.getMonth()+n,1);t.setDate(Math.min(day,lastDay(t.getFullYear(),t.getMonth())));return toStr(t)};
function nextDayOfMonth(from,day,strict){const f=parse(from);let y=f.getFullYear(),m=f.getMonth();for(let i=0;i<4;i++){const c=new Date(y,m,Math.min(day,lastDay(y,m)));if(strict?c>f:c>=f)return toStr(c);m++;if(m>11){m=0;y++}}return from}
const MES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DIA=['dom','lun','mar','mié','jue','vie','sáb'];
const fDate=(s,yr)=>{if(!s)return'—';const d=parse(s);return `${d.getDate()} ${MES[d.getMonth()]}`+(yr?` ${d.getFullYear()}`:'')};
const fDay=s=>{const d=parse(s);return `${DIA[d.getDay()]} ${d.getDate()} ${MES[d.getMonth()]}`};
const fWeek=s=>{const a=weekStart(s),b=weekEnd(s);const A=parse(a),B=parse(b);return A.getMonth()===B.getMonth()?`${A.getDate()}–${B.getDate()} ${MES[B.getMonth()]}`:`${A.getDate()} ${MES[A.getMonth()]} – ${B.getDate()} ${MES[B.getMonth()]}`};
const fMonth=s=>{const d=parse(s);return ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][d.getMonth()]+' '+d.getFullYear()};
const MXN=new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2,maximumFractionDigits:2});
const MXN0=new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0});
const money=n=>MXN.format(Math.round((+n||0)*100)/100);
const money0=n=>MXN0.format(+n||0);
const pct=(n,d=1)=>`${((+n||0)*100).toFixed(d)}%`;
const num=v=>{if(v===''||v==null)return null;const n=parseFloat(String(v).replace(/[$,\s]/g,''));return isFinite(n)?n:null};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,10);
const sum=(arr,f=x=>x)=>arr.reduce((a,x)=>a+(+f(x)||0),0);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const M=n=>`<span class="money">${money(n)}</span>`;
const Ms=(n)=>`<span class="money ${n<0?'neg':n>0?'pos':''}">${money(n)}</span>`;

/* ---------- Estado ---------- */
const DEFAULT_CATS=[
  ['Comida','Gasto','Variable'],['Transporte','Gasto','Variable'],['Ocio','Gasto','Variable'],['Salud','Gasto','Variable'],
  ['Escuela','Gasto','Variable'],['Ropa y personal','Gasto','Variable'],['Hogar','Gasto','Variable'],['Otros gastos','Gasto','Variable'],
  ['Suscripciones','Gasto','Fijo'],['Renta y servicios','Gasto','Fijo'],['Gasolina','Gasto','Neutral'],['Pago de tarjetas','Gasto','Deuda'],
  ['Pago de préstamo','Gasto','Deuda'],['Ahorro / colchón','Gasto','Ahorro'],
  ['Préstamos a terceros','Gasto','Prestado'],['Cobro de préstamo','Ingreso','Prestado'],
  ['Depósito a caja de ahorro','Gasto','Ahorro'],['Retiro de caja de ahorro','Ingreso','Ahorro'],
  ['Sueldo','Ingreso','Ingreso'],['Ingresos extra','Ingreso','Ingreso'],['Apoyo gasolina','Ingreso','Neutral'],['Otros ingresos','Ingreso','Ingreso']
].map(([name,type,group])=>({name,type,group}));
const GROUPS={Variable:'Gasto del día a día',Fijo:'Fijos y suscripciones',Deuda:'Pago de deudas',Neutral:'Neutral (entra y sale)',Ahorro:'Ahorro',Ingreso:'Ingreso',Prestado:'Préstamos a terceros'};
function blank(){return{v:1,setupDone:false,example:false,
  settings:{name:'',startDate:today(),initialBalance:0,incomeAmount:0,incomeFreq:'semanal',extraFreq:'semanal',extraMin:0,extraMax:0,dailyGoal:0,emergency:0,utilWarn:.30,utilCrit:.70,redPct:.50},
  categories:DEFAULT_CATS.map(c=>({...c})),cards:[],loans:[],subs:[],txs:[],paid:{},lent:[],savings:[]}}
function ensureCoreCats(target){const st=target||S;const names=st.categories.map(c=>c.name);for(const c of DEFAULT_CATS){if((c.group==='Prestado'||c.group==='Ahorro')&&!names.includes(c.name))st.categories.push({...c})}}
function migrateSettings(raw){if(!raw)return raw;
  if(('extraPerDay' in raw||'extraDays' in raw)&&!('extraMin' in raw)){const wk=Math.round((+raw.extraPerDay||0)*(+raw.extraDays||0)*100)/100;raw.extraFreq='semanal';raw.extraMin=wk;raw.extraMax=wk}
  delete raw.extraPerDay;delete raw.extraDays;return raw}
let S=blank();
let saveMsg='';
function load(){try{const raw=localStorage.getItem(KEY);if(raw){const d=JSON.parse(raw);if(d&&d.settings){migrateSettings(d.settings);S=Object.assign(blank(),d);S.settings=Object.assign(blank().settings,d.settings);}}}catch(e){}ensureCoreCats()}
let saveT;
function save(){if(S.example)return;if(U.acct){cacheLocal();cloudPushSoon();return}clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(S));saveMsg='Guardado en este navegador';}catch(e){saveMsg='No se pudo guardar en este navegador. Exporta un respaldo.'}const el=document.getElementById('savedMsg');if(el)el.textContent=saveMsg},250)}
let P={theme:'system',charts:{}};
function loadPrefs(){try{const r=localStorage.getItem(PREF);if(r)P=Object.assign(P,JSON.parse(r))}catch(e){}}
function savePrefs(){try{localStorage.setItem(PREF,JSON.stringify(P))}catch(e){}}
function applyTheme(){const r=document.documentElement;if(P.theme==='system')r.removeAttribute('data-theme');else r.setAttribute('data-theme',P.theme)}

/* ---------- Catálogos ---------- */
const cat=name=>S.categories.find(c=>c.name===name);
const groupOf=t=>{const c=cat(t.cat);return c?c.group:(t.type==='Ingreso'?'Ingreso':'Variable')};
function methods(){return[{id:'Efectivo',name:'Efectivo',cash:true},{id:'Débito',name:'Débito / banco',cash:true},...S.cards.map(c=>({id:'card:'+c.id,name:c.name,cash:false,card:c}))]}
const methodName=id=>{if(!id)return'—';if(id.startsWith('card:')){const c=S.cards.find(c=>'card:'+c.id===id);return c?c.name:'Tarjeta eliminada'}return id==='Débito'?'Débito / banco':id};
const isCash=id=>!String(id||'').startsWith('card:');

/* ---------- Ingresos y metas ---------- */
const FREQ_W={semanal:1,quincenal:24/52,mensual:12/52};
function expectedWeekly(){const s=S.settings;return (s.incomeAmount||0)*(FREQ_W[s.incomeFreq]||1)+(+s.extraMin||0)*(FREQ_W[s.extraFreq]||1)}
const weeklyGoal=()=>(S.settings.dailyGoal||0)*7;
const monthlyGoal=()=>(S.settings.dailyGoal||0)*30;
const weeklyAvail=()=>expectedWeekly()-weeklyGoal();

/* ---------- Movimientos ---------- */
const txIn=(a,b)=>S.txs.filter(t=>t.date>=a&&t.date<=b);
function stats(list){
  const r={income:0,personal:0,fijos:0,deuda:0,neutral:0,ahorro:0,gastos:0,count:list.length};
  for(const t of list){const g=groupOf(t),a=+t.amount||0;
    if(t.type==='Ingreso'){if(g==='Ingreso')r.income+=a;continue}
    r.gastos+=a;
    if(g==='Variable')r.personal+=a;else if(g==='Fijo')r.fijos+=a;else if(g==='Deuda')r.deuda+=a;else if(g==='Neutral')r.neutral+=a;else if(g==='Ahorro')r.ahorro+=a;}
  r.balance=r.income-r.personal-r.fijos-r.deuda;return r}
function cashNow(upTo){const s=S.settings;upTo=upTo||'9999-12-31';let c=+s.initialBalance||0;
  for(const t of S.txs){if(t.date<s.startDate||t.date>upTo)continue;if(t.type==='Ingreso')c+=+t.amount||0;else if(isCash(t.method))c-=+t.amount||0}
  c+=sum(S.savings,j=>j.spendable?jarStats(j).balance:0);
  return c}

/* ---------- Tarjetas ---------- */
function cardStats(c){
  const since=c.baseDate||S.settings.startDate, mid='card:'+c.id;
  const buys=S.txs.filter(t=>t.type==='Gasto'&&t.method===mid&&t.date>=since&&groupOf(t)!=='Deuda');
  const pays=S.txs.filter(t=>t.type==='Gasto'&&groupOf(t)==='Deuda'&&t.target===c.id&&t.date>=since);
  const buySum=sum(buys,t=>t.amount), paySum=sum(pays,t=>t.amount);
  const used=Math.max(0,(+c.balance||0)+buySum-paySum);
  const msiMonthly=sum(buys.filter(t=>t.msi>1),t=>t.amount/t.msi);
  const nonMsi=sum(buys.filter(t=>!(t.msi>1)),t=>t.amount);
  const baseNoInt=(c.noInt==null||c.noInt==='')?(+c.balance||0):+c.noInt;
  const noInt=clamp(baseNoInt+nonMsi+msiMonthly-paySum,0,used);
  const limit=+c.limit||0, avail=limit-used, util=limit>0?used/limit:0;
  const t=today(), nextCut=nextOcc(c.cutAnchor,c.cutDay), nextDue=nextOcc(c.dueAnchor,c.dueDay);
  const lvl=util>=S.settings.utilCrit?'bad':util>=S.settings.utilWarn?'warn':'good';
  const subsMonthly=sum(S.subs.filter(s=>s.method===mid),s=>s.amount);
  return{used,avail,util,limit,noInt,msiMonthly,subsMonthly,nextCut,nextDue,daysToPay:daysBetween(t,nextDue),lvl,buys,pays}}
function nextOcc(anchor,day){const t=today();return anchor&&anchor>=t?anchor:nextDayOfMonth(t,+day||1)}
function cardTotals(){const st=S.cards.map(cardStats);const used=sum(st,s=>s.used),limit=sum(st,s=>s.limit);return{used,limit,avail:limit-used,util:limit>0?used/limit:0,noInt:sum(st,s=>s.noInt)}}
function dueAfterPurchase(c,date){ // fecha en que pagarías una compra hecha en `date`
  const cut=nextDayOfMonth(date,+c.cutDay||1);return nextDayOfMonth(cut,+c.dueDay||1,true)}

/* ---------- Préstamos ---------- */
const FREQ_L={semanal:'semanal',quincenal:'quincenal',mensual:'mensual'};
function stepDate(s,freq){if(freq==='semanal')return addDays(s,7);if(freq==='mensual')return addMonths(s,1);
  const d=parse(s);if(d.getDate()<15)return toStr(new Date(d.getFullYear(),d.getMonth(),15));
  if(d.getDate()<lastDay(d.getFullYear(),d.getMonth())&&d.getDate()<30)return toStr(new Date(d.getFullYear(),d.getMonth(),Math.min(30,lastDay(d.getFullYear(),d.getMonth()))));
  return toStr(new Date(d.getFullYear(),d.getMonth()+1,15))}
function impliedRate(P0,pay,n){if(!(P0>0&&pay>0&&n>0)||pay*n<=P0)return 0;let lo=0,hi=1;for(let i=0;i<80;i++){const r=(lo+hi)/2;const p=P0*r/(1-Math.pow(1+r,-n));if(p>pay)hi=r;else lo=r}return(lo+hi)/2}
function loanStats(l){
  const pays=S.txs.filter(t=>t.type==='Gasto'&&t.target===l.id&&groupOf(t)==='Deuda');
  const cuotasReg=pays.filter(t=>t.loanKind!=='abono').length, abonos=sum(pays.filter(t=>t.loanKind==='abono'),t=>t.amount);
  const n=+l.n||0, pay=+l.payment||0, paid=Math.min(n,(+l.paidInit||0)+cuotasReg), left=Math.max(0,n-paid);
  const r=impliedRate(+l.original||0,pay,n);
  const pv=r>0?pay*(1-Math.pow(1+r,-left))/r:pay*left;
  const capital=Math.max(0,(l.capital!=null&&l.capital!==''&&cuotasReg===0&&abonos===0)?+l.capital:pv-abonos);
  const total=pay*n, interest=Math.max(0,total-(+l.original||0));
  const pendingN=Math.max(0,n-(+l.paidInit||0));
  const sched=[];let d=l.nextDate||today();for(let i=0;i<pendingN;i++){sched.push(d);d=stepDate(d,l.freq)}
  const next=sched[cuotasReg]||null;
  return{paid,left,rate:r,capital,total,interest,interestPct:(+l.original>0)?interest/l.original:0,remainingPay:pay*left,next,sched,cuotasReg,abonos,done:left===0}}
const loanTotals=()=>sum(S.loans,l=>loanStats(l).capital);

/* ---------- Préstamos a terceros (me deben) ---------- */
function lentStats(l){
  const cobros=S.txs.filter(t=>t.type==='Ingreso'&&t.target===l.id&&groupOf(t)==='Prestado');
  const received=sum(cobros,t=>t.amount);
  const outstanding=Math.max(0,(+l.amount||0)-received);
  const done=outstanding<=0.004;
  let nextDue=l.dueDate||null;
  if(l.installments&&l.instFreq){let d=l.dueDate||l.dateGiven||today();for(let i=0;i<cobros.length;i++)d=stepDate(d,l.instFreq);nextDue=d}
  const overdue=!done&&nextDue&&nextDue<today();
  const remindDue=!!(l.remind&&l.reminderDate&&l.reminderDate<=today()&&!done);
  return{received,outstanding,done,nextDue,overdue,remindDue,cobros,count:cobros.length}}
const lentTotals=()=>sum(S.lent,l=>lentStats(l).outstanding);

/* ---------- Cajas de ahorro ---------- */
function jarStats(j){
  const rate=+j.rate||0,dr=rate>0?Math.pow(1+rate,1/365)-1:0;
  const events=S.txs.filter(t=>t.target===j.id&&(t.cat==='Depósito a caja de ahorro'||t.cat==='Retiro de caja de ahorro'))
    .map(t=>({date:t.date,amt:t.type==='Gasto'?(+t.amount||0):-(+t.amount||0)})).sort((a,b)=>a.date.localeCompare(b.date));
  let bal=Math.max(0,+j.startAmount||0),cur=j.createdDate||(events[0]?events[0].date:today());
  for(const e of events){const days=Math.max(0,daysBetween(cur,e.date));if(days>0&&dr>0)bal=bal*Math.pow(1+dr,days);bal=Math.max(0,bal+e.amt);cur=e.date}
  const daysLeft=Math.max(0,daysBetween(cur,today()));if(daysLeft>0&&dr>0)bal=bal*Math.pow(1+dr,daysLeft);
  const principal=Math.max(0,(+j.startAmount||0)+sum(events,e=>e.amt));
  const dep=sum(events.filter(e=>e.amt>0),e=>e.amt),wd=sum(events.filter(e=>e.amt<0),e=>-e.amt);
  return{balance:Math.max(0,bal),principal,interestEarned:Math.max(0,bal-principal),dep,wd}}
const savingsTotal=onlyVisible=>sum(S.savings,j=>(!onlyVisible||j.visible!==false)?jarStats(j).balance:0);
function compoundSim(z,rate){
  const P0=+z.amount||0,months=Math.max(0,Math.round(+z.months||0)),freq=z.freq||'mensual',contribIn=+z.contrib||0;
  const ok=P0>0&&months>0;
  const perYear=freq==='semanal'?52:12;
  const nPeriods=freq==='semanal'?Math.round(months*52/12):months;
  const i=(rate||0)/perYear,C=freq==='unico'?0:contribIn;
  let fv=P0,lin=P0;const pts=[{k:0,fv,lin}];const step=Math.max(1,Math.ceil(nPeriods/10));
  for(let k=1;k<=nPeriods;k++){fv=fv*(1+i)+C;lin=lin+C;if(k%step===0||k===nPeriods)pts.push({k,fv,lin})}
  const noCompound=P0+C*nPeriods,growth=fv-noCompound;
  return{ok,P0,months,nPeriods,freq,contrib:C,fv,noCompound,growth,pts}}

/* ---------- Plan de pagos ---------- */
const WEEKS=12;
function planItems(){
  const t=today(), start=weekStart(t), end=addDays(start,WEEKS*7-1), items=[];
  for(const c of S.cards){const st=cardStats(c);let d=st.nextDue,first=true;
    while(d<=end){const key=`card:${c.id}:${d}`;const pd=S.paid[key];
      const amt=pd?pd.amount:(first?st.noInt:st.subsMonthly+st.msiMonthly);
      if(amt>0.004||pd)items.push({key,kind:'card',ref:c.id,date:d,name:c.name,type:'Tarjeta',amount:amt,paid:!!pd});
      first=false;d=nextDayOfMonth(d,+c.dueDay||1,true)}}
  for(const l of S.loans){const st=loanStats(l);st.sched.forEach((d,i)=>{if(d<start||d>end)return;
    items.push({key:`loan:${l.id}:${i}`,kind:'loan',ref:l.id,idx:i,date:d,name:`${l.name} · cuota ${(+l.paidInit||0)+i+1} de ${l.n}`,type:'Préstamo',amount:+l.payment||0,paid:i<st.cuotasReg})})}
  for(const s of S.subs){if(!isCash(s.method))continue;let d=nextDayOfMonth(start,+s.day||1);
    while(d<=end){const key=`sub:${s.id}:${d}`;items.push({key,kind:'sub',ref:s.id,date:d,name:s.name,type:'Fijo',amount:+s.amount||0,paid:!!S.paid[key]});d=nextDayOfMonth(d,+s.day||1,true)}}
  const em=+S.settings.emergency||0;if(em>0){const key='colchon';const pd=S.paid[key];const saved=sum(S.txs.filter(x=>groupOf(x)==='Ahorro'),x=>x.amount);
    const rem=pd?pd.amount:Math.max(0,em-saved);if(rem>0||pd)items.push({key,kind:'colchon',date:pd?pd.date:weekEnd(t),name:'Apartar colchón de emergencia',type:'Ahorro',amount:rem,paid:!!pd})}
  return items.sort((a,b)=>a.date.localeCompare(b.date))}
function planWeeks(items){items=items||planItems();const start=weekStart(today()),wa=weeklyAvail();let prev=null;const out=[];
  for(let i=0;i<WEEKS;i++){const ws=addDays(start,i*7),we=addDays(ws,6);const its=items.filter(x=>x.date>=ws&&x.date<=we);
    const pending=sum(its.filter(x=>!x.paid),x=>x.amount);const disp=i===0?cashNow():prev+wa;const sobra=disp-pending;
    out.push({ws,we,items:its,pending,byType:{Tarjeta:sum(its.filter(x=>!x.paid&&x.type==='Tarjeta'),x=>x.amount),Préstamo:sum(its.filter(x=>!x.paid&&x.type==='Préstamo'),x=>x.amount),Otros:sum(its.filter(x=>!x.paid&&(x.type==='Fijo'||x.type==='Ahorro')),x=>x.amount)},disp,sobra});prev=sobra}
  return out}
