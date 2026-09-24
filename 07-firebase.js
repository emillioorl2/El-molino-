
/* ---------- Cuentas: usuario + contraseña, cifrado en el navegador (Firebase) ----------
   Arquitectura de conocimiento cero: tu contraseña NUNCA se envía ni se guarda en ningún
   lado. Solo se usa en tu propio navegador para abrir (o crear) la llave con la que se
   cifran tus datos antes de subirlos. Firebase solo guarda datos ya cifrados.
   Para recuperación usamos un correo + contraseña independiente (Firebase Authentication)
   como "llave de emergencia": si vinculas un correo, guardamos ahí una copia de tu llave
   de cifrado, protegida por ESE inicio de sesión (no por tu contraseña de la libreta). */

/* ====== PON AQUÍ LAS LLAVES DE TU PROYECTO DE FIREBASE ======
   1. Ve a https://console.firebase.google.com → crea un proyecto (gratis).
   2. Agrega una "app web" (ícono </>) y copia el objeto de configuración que te den, aquí abajo.
   3. En el proyecto, activa: Authentication → Sign-in method → Anónimo, y también Correo/contraseña.
   4. Activa Firestore Database (modo producción) y pega las reglas del archivo firestore.rules.
   Mientras esto esté vacío, la libreta funciona igual pero SOLO guardada en este navegador
   (sin cuentas ni sincronizar entre dispositivos) — nunca truena. */
const FIREBASE_CONFIG={
  apiKey:"",
  authDomain:"",
  projectId:"",
  storageBucket:"",
  messagingSenderId:"",
  appId:""
};
const FIREBASE_READY=!!(FIREBASE_CONFIG.apiKey&&FIREBASE_CONFIG.projectId);

const SESSION='libreta-sesion', DEVICE=(()=>{try{let d=localStorage.getItem('libreta-device');if(!d){d=uid()+uid();localStorage.setItem('libreta-device',d)}return d}catch(e){return uid()}})();
let DB=null, AUTH=null, UID=null, unsubAcct=null;
const TE=new TextEncoder(), TD=new TextDecoder();
const b64=buf=>{const a=buf instanceof Uint8Array?buf:new Uint8Array(buf);let s='';for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000));return btoa(s)};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const ITER=210000;
async function pwKey(pw,salt,iter){const base=await crypto.subtle.importKey('raw',TE.encode(pw),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:iter||ITER,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function aesEnc(key,bytes){const iv=crypto.getRandomValues(new Uint8Array(12));return{iv:b64(iv),ct:b64(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes))}}
async function aesDec(key,o){return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(o.iv)},key,unb64(o.ct)))}
async function gz(bytes){if(!window.CompressionStream)return[bytes,false];const s=new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));return[new Uint8Array(await new Response(s).arrayBuffer()),true]}
async function ungz(bytes,flag){if(!flag)return bytes;const s=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));return new Uint8Array(await new Response(s).arrayBuffer())}
async function userHash(u){const h=await crypto.subtle.digest('SHA-256',TE.encode('libreta:'+u.trim().toLowerCase()));return[...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,40)}
const importDK=raw=>crypto.subtle.importKey('raw',raw,'AES-GCM',true,['encrypt','decrypt']);
const acctRef=h=>DB.doc('cuentas/'+h);
const recRef=h=>UID?DB.doc(`data/users/${UID}/rec_${h}`):null;
async function sealData(dk,obj){const[bytes,g]=await gz(TE.encode(JSON.stringify(obj)));return{data:await aesEnc(dk,bytes),gz:g}}
async function openData(dk,doc){return JSON.parse(TD.decode(await ungz(await aesDec(dk,doc.data),doc.gz)))}
async function wrapDK(pw,raw){const salt=crypto.getRandomValues(new Uint8Array(16));const k=await pwKey(pw,salt,ITER);return{salt:b64(salt),iter:ITER,wrap:await aesEnc(k,raw)}}
async function unwrapDK(pw,doc){const k=await pwKey(pw,unb64(doc.salt),doc.iter);return aesDec(k,doc.wrap)}
function normalizeState(d){migrateSettings(d.settings);const s=Object.assign(blank(),d);s.settings=Object.assign(blank().settings,d.settings||{});return s}
const validUser=u=>/^[a-zA-Z0-9._-]{3,30}$/.test(u);
const validEmail=e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
function setSession(){try{localStorage.setItem(SESSION,JSON.stringify({user:U.acct.user,hash:U.acct.hash,raw:U.acct.raw}))}catch(e){}}
function clearSession(){try{localStorage.removeItem(SESSION)}catch(e){}}

/* ---- Vínculo de recuperación (correo + contraseña independientes, vía Firebase Auth) ---- */
async function writeEscrow(hash,rawB64){const r=recRef(hash);if(!r)return false;try{await r.set({dk:rawB64,linkedAt:Date.now()});return true}catch(e){return false}}
async function checkLinked(){const r=recRef(U.acct.hash);if(!r){U.acct.linked=false;return}try{const s=await r.get();U.acct.linked=s.exists}catch(e){U.acct.linked=false}}
/* Liga (o adopta) una identidad de recuperación en Firebase Auth con correo+contraseña
   propios de la persona. No escribe nada en Firestore todavía; eso lo hace writeEscrow
   una vez que quien llama tiene el hash y la llave que quiere resguardar. */
async function linkRecoveryEmail(email,pw){
  const cred=firebase.auth.EmailAuthProvider.credential(email,pw);
  try{
    const cur=AUTH.currentUser;
    if(cur&&cur.isAnonymous){await cur.linkWithCredential(cred)}
    else{await AUTH.signInWithCredential(cred)}
  }catch(e){
    if(e&&(e.code==='auth/email-already-in-use'||e.code==='auth/credential-already-in-use')){
      await AUTH.signInWithEmailAndPassword(email,pw)
    }else if(e&&e.code==='auth/wrong-password'){throw new Error('Esa contraseña de recuperación no coincide con ese correo.')}
    else throw e
  }
  UID=AUTH.currentUser?AUTH.currentUser.uid:null}
function recLinkModal(){const d=U.modal.d||{};const e=d.err?`<p class="err" role="alert">${esc(d.err)}</p>`:'';
  return `<div class="modal-head"><h2>Cambiar correo de recuperación</h2></div>
   <p class="small muted" style="margin-bottom:12px">Si algún día olvidas tu contraseña, podrás recuperar tus datos entrando con este correo. Puede ser cualquier correo; la contraseña aquí es independiente de la contraseña de tu libreta.</p>
   <div class="form" id="recLinkForm" style="grid-template-columns:1fr">
    ${field({k:'email',l:'Correo de recuperación',t:'text',ph:'tu@correo.com'},d.email||'','rl_')}
    ${pwField('rl_pw','Contraseña de recuperación','new-password','Mínimo 6 caracteres. Distinta a tu contraseña de la libreta si quieres.')}
   </div>${e}
   <div class="modal-foot"><button class="btn ghost" data-a="modalClose">Cancelar</button><button class="btn primary" data-a="saveRecLink"${d.busy?' disabled':''}>${d.busy?'Ligando…':'Ligar correo'}</button></div>`}
async function saveRecLink(){const f=document.getElementById('recLinkForm'),v=id=>(f.querySelector('#'+id)||{}).value||'';
  const email=v('rl_email').trim(),pw=v('rl_pw');const d=U.modal.d=U.modal.d||{};
  if(!validEmail(email)){d.err='Escribe un correo válido.';render();return}
  if(pw.length<6){d.err='La contraseña debe tener al menos 6 caracteres.';render();return}
  d.email=email;d.busy=true;d.err='';render();
  try{await linkRecoveryEmail(email,pw);const ok=await writeEscrow(U.acct.hash,U.acct.raw);d.busy=false;
    if(ok){U.acct.linked=true;U.modal=null;render();toast('Correo de recuperación ligado')}
    else{d.err='No se pudo guardar. Inténtalo de nuevo.';render()}}
  catch(e){d.busy=false;d.err=e&&e.message?e.message:'No se pudo ligar ese correo. Inténtalo de nuevo.';render()}}

function subscribeAcct(){if(unsubAcct)unsubAcct();unsubAcct=acctRef(U.acct.hash).onSnapshot(async snap=>{
  if(!U.acct)return;if(!snap.exists)return;const d=snap.data();
  if(d.device!==DEVICE&&d.updatedAt>(U.lastSeen||0)&&!pushing){U.lastSeen=d.updatedAt;try{S=normalizeState(await openData(U.acct.dk,d));ensureCoreCats();cacheLocal();render();toast('Datos actualizados desde otro dispositivo')}catch(e){}}
},()=>{})}
function cacheLocal(){try{if(U.acct)localStorage.setItem(KEY+':'+U.acct.hash,JSON.stringify(S))}catch(e){}}
async function startAccount(user,hash,raw,dk,doc,{fresh}={}){
  U.acct={user,hash,raw:b64(raw),dk,linked:false};U.localMode=false;U.lastSeen=doc.updatedAt||0;
  S=normalizeState(await openData(dk,doc));ensureCoreCats();setSession();cacheLocal();subscribeAcct();
  U.tab='resumen';U.sync='Guardado en tu cuenta';
  if(!S.setupDone){U.ob={step:fresh?1:0,has:{}};U.obDir=1}else U.appIn=true;
  if(S.cards[0])U.sim.card=S.cards[0].id;
  await checkLinked();render()}

/* Guardado en la nube (una escritura a la vez) */
let pushing=false,pendingPush=false,pushT;
function cloudPushSoon(){if(!U.acct||!DB||S.example)return;U.sync='Guardando…';updSync();clearTimeout(pushT);pushT=setTimeout(cloudPush,900)}
async function cloudPush(){if(!U.acct||!DB||S.example)return;if(pushing){pendingPush=true;return}pushing=true;
  try{const sealed=await sealData(U.acct.dk,S);const t=Date.now();await acctRef(U.acct.hash).update({...sealed,device:DEVICE,updatedAt:t});U.lastSeen=t;U.sync='Guardado en tu cuenta'}
  catch(e){U.sync=e&&e.code==='permission-denied'?'Sin permiso para guardar en la nube':e&&e.code==='resource-exhausted'?'Tu cuenta llegó al límite de espacio':'No se pudo guardar en la nube. Se reintentará.';if(!(e&&['permission-denied','resource-exhausted'].includes(e.code)))setTimeout(cloudPushSoon,8000)}
  pushing=false;updSync();if(pendingPush){pendingPush=false;cloudPush()}}
function updSync(){const el=document.getElementById('savedMsg');if(el)el.textContent=syncText()}
function syncText(){if(S.example)return'Datos de ejemplo: no se guardan';if(U.acct)return U.sync||'Guardado en tu cuenta';return saveMsg||'Se guarda solo en este navegador'}

/* Pantalla de acceso */
function pwField(id,label,ac,hint){return `<div class="fld"><label for="${id}">${esc(label)}</label><div class="pw-wrap"><input class="inp" id="${id}" type="password" autocomplete="${ac}"><button type="button" class="pw-eye" data-a="togglePw" data-target="${id}" aria-label="Mostrar contraseña" aria-pressed="false">${icon('eye')}</button></div>${hint?`<span class="hint">${esc(hint)}</span>`:''}</div>`}
function authHTML(){const m=U.auth||'login',e=U.authErr?`<p class="err" role="alert">${esc(U.authErr)}</p>`:'',busy=U.authBusy;
  const busyRow=busy?`<div style="margin-top:14px">${sheepLoader(3,'sm')}</div>`:'';
  const side=`<aside class="ob-side"><div class="brand"><span class="brand-mark">${icon('windmill')}</span><div><b>El Molino</b><span>finanzas personales</span></div></div>
    <p class="small muted" style="max-width:32ch">Tu usuario y contraseña te dejan abrir tus datos en cualquier dispositivo. Tus datos viajan cifrados con tu contraseña: nadie más puede leerlos.</p><div style="margin-top:auto">${themeSeg()}</div></aside>`;
  let body='';
  if(!DB&&!U.authPreview){body=`<h1>Entrar a tu libreta</h1><p class="lead">No pudimos conectar con el servidor, así que las cuentas no están disponibles en este momento. Revisa tu conexión a internet, o usa la libreta solo en este navegador mientras tanto.</p>
    <div class="row"><button class="btn primary" data-a="useLocal">Usar solo en este navegador</button><button class="btn ghost" data-a="loadExample">Ver con datos de ejemplo</button></div>
    <p class="small muted" style="margin-top:24px"><button class="linkbtn" data-a="authPreview">Ver cómo se ve el inicio de sesión y el registro</button></p>`}
  else if(m==='login')body=`<h1>Entrar a tu libreta</h1><p class="lead">Escribe tu usuario y contraseña para abrir tus datos.</p>
    <form class="form" id="authForm" style="max-width:440px;grid-template-columns:1fr" data-form="login">
     ${field({k:'user',l:'Usuario',ph:'tu.usuario'},U.authUser||'','a_')}
     ${pwField('a_pw','Contraseña','current-password')}
     ${e}<div class="row" style="justify-content:space-between"><button class="linkbtn" type="button" data-a="authMode" data-m="recover">¿Olvidaste tu contraseña?</button><button class="btn primary" type="submit"${busy?' disabled':''}>${busy?'Entrando…':'Entrar'}</button></div></form>${busyRow}
    <p class="small muted" style="margin-top:24px">¿Primera vez? <button class="linkbtn" data-a="authMode" data-m="signup">Crea tu cuenta</button> · <button class="linkbtn" data-a="loadExample">Ver con datos de ejemplo</button></p>`;
  else if(m==='signup')body=`<h1>Crea tu cuenta</h1><p class="lead">Elige un usuario y una contraseña, y liga un correo de recuperación: es obligatorio, es la única forma de recuperar tus datos si algún día olvidas tu contraseña.</p>
    <form class="form" id="authForm" style="max-width:440px;grid-template-columns:1fr" data-form="signup">
     ${field({k:'owner',l:'Nombre del propietario',ph:'Tu nombre'},U.authOwner||'','a_')}
     ${field({k:'user',l:'Usuario',ph:'tu.usuario',hint:'De 3 a 30 caracteres: letras, números, punto, guion o guion bajo.'},U.authUser||'','a_')}
     ${pwField('a_pw','Contraseña','new-password','Mínimo 6 caracteres.')}
     ${pwField('a_pw2','Confirma tu contraseña','new-password')}
     <p class="small muted" style="margin:4px 0 -6px">Correo de recuperación (obligatorio)</p>
     ${field({k:'recEmail',l:'Tu correo',t:'text',ph:'tu@correo.com'},U.authRecEmail||'','a_')}
     ${pwField('a_recPw','Contraseña de recuperación','new-password','Mínimo 6 caracteres. Puede ser distinta a tu contraseña de arriba.')}
     ${pwField('a_recPw2','Confírmala','new-password')}
     ${e}<div class="row" style="justify-content:flex-end"><button class="btn primary" type="submit"${busy?' disabled':''}>${busy?'Creando…':'Crear cuenta'}</button></div></form>${busyRow}
    <p class="small muted" style="margin-top:24px">¿Ya tienes cuenta? <button class="linkbtn" data-a="authMode" data-m="login">Entra aquí</button></p>`;
  else if(m==='recover')body=`<h1>Recupera tu contraseña</h1><p class="lead">Esto solo funciona si ya habías ligado un correo de recuperación a este usuario. Escribe tu usuario y el correo y contraseña de recuperación que ligaste.</p>
    <form class="form" id="authForm" style="max-width:440px;grid-template-columns:1fr" data-form="recover">
     ${field({k:'user',l:'Usuario',ph:'tu.usuario'},U.authUser||'','a_')}
     ${field({k:'email',l:'Correo de recuperación',t:'text',ph:'tu@correo.com'},U.authEmail||'','a_')}
     ${pwField('a_pw','Contraseña de recuperación','current-password')}
     ${e}<div class="row" style="justify-content:space-between"><button class="linkbtn" type="button" data-a="authMode" data-m="login">Volver a entrar</button><button class="btn primary" type="submit"${busy?' disabled':''}>${busy?'Buscando…':'Continuar'}</button></div></form>${busyRow}`;
  else if(m==='recover2')body=`<h1>Nueva contraseña</h1><p class="lead">Encontramos tu usuario <b>${esc(U.authUser)}</b>. Elige una contraseña nueva para tu libreta; tus datos se quedan igual.</p>
    <form class="form" id="authForm" style="max-width:440px;grid-template-columns:1fr" data-form="recover2">
     ${pwField('a_pw','Contraseña nueva','new-password','Mínimo 6 caracteres.')}
     ${pwField('a_pw2','Confírmala','new-password')}
     ${e}<div class="row" style="justify-content:space-between"><button class="linkbtn" type="button" data-a="authMode" data-m="login">Cancelar</button><button class="btn primary" type="submit"${busy?' disabled':''}>${busy?'Guardando…':'Guardar y entrar'}</button></div></form>${busyRow}`;
  const previewNote=(!DB&&U.authPreview)?`<p class="small muted" style="background:var(--surface2);padding:8px 12px;border-radius:8px;margin-bottom:14px">Vista previa: así se ve, pero las cuentas se activan cuando conectemos el servidor. <button class="linkbtn" data-a="authPreviewExit">Salir de la vista previa</button></p>`:'';
  return `<div class="ob">${side}<main class="ob-main enter" style="--dx:36px">${previewNote}${body}</main></div>`}
function bootHTML(){return `<div class="ob"><aside class="ob-side"><div class="brand"><span class="brand-mark">${icon('windmill')}</span><div><b>El Molino</b><span>finanzas personales</span></div></div></aside>
  <main class="ob-main"><h1>Abriendo tu libreta…</h1><p class="lead">Conectando con el servidor.</p>${sheepLoader(5)}${U.bootSlow?`<button class="btn" data-a="useLocal" style="margin-top:18px">Usar solo en este navegador</button>`:''}</main></div>`}

async function authSubmit(kind){
  if(!DB){U.authErr='Esto todavía es solo una vista previa: conecta el servidor para poder crear cuentas de verdad.';render();return}
  const f=document.getElementById('authForm'),v=id=>(f.querySelector('#'+id)||{}).value||'';
  const user=kind==='recover2'?U.authUser:v('a_user').trim(),pw=v('a_pw'),pw2=v('a_pw2'),email=v('a_email').trim();
  const recEmail=v('a_recEmail').trim(),recPw=v('a_recPw'),recPw2=v('a_recPw2');
  U.authUser=user;if(kind==='signup'){U.authOwner=v('a_owner').trim();U.authRecEmail=recEmail}if(kind==='recover')U.authEmail=email;
  const fail=(msg,focus)=>{U.authErr=msg;U.authBusy=false;render();const el=document.getElementById(focus||(kind==='recover2'?'a_pw':kind==='recover'?'a_email':'a_user'));if(el)el.focus()};
  if((kind==='login'||kind==='signup'||kind==='recover')&&!validUser(user))return fail(user?'Ese usuario no es válido. Usa de 3 a 30 letras, números, punto o guion.':'Escribe tu usuario.');
  if(kind==='login'&&!pw)return fail('Escribe tu contraseña.');
  if(kind==='recover'&&!validEmail(email))return fail('Escribe un correo válido.');
  if(kind==='recover'&&!pw)return fail('Escribe la contraseña de recuperación.');
  if((kind==='signup'||kind==='recover2')&&pw.length<6)return fail('La contraseña debe tener al menos 6 caracteres.');
  if((kind==='signup'||kind==='recover2')&&pw!==pw2)return fail('Las contraseñas no coinciden.');
  if(kind==='signup'&&!U.authOwner)return fail('Escribe el nombre del propietario.');
  if(kind==='signup'&&!validEmail(recEmail))return fail('Escribe un correo de recuperación válido: es obligatorio.','a_recEmail');
  if(kind==='signup'&&recPw.length<6)return fail('La contraseña de recuperación debe tener al menos 6 caracteres.','a_recPw');
  if(kind==='signup'&&recPw!==recPw2)return fail('Las contraseñas de recuperación no coinciden.','a_recPw2');
  U.authErr='';U.authBusy=true;render();
  try{const hash=await userHash(user),ref=acctRef(hash);
    if(kind==='signup'){const snap=await ref.get();if(snap.exists)return fail('Ese usuario ya existe. Elige otro.');
      try{await linkRecoveryEmail(recEmail,recPw)}catch(e){return fail(e&&e.message?e.message:'No se pudo preparar tu correo de recuperación. Revisa el correo y la contraseña.','a_recEmail')}
      const dk=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);const raw=new Uint8Array(await crypto.subtle.exportKey('raw',dk));
      const escrowOk=await writeEscrow(hash,b64(raw));if(!escrowOk)return fail('No se pudo guardar tu recuperación por correo. Inténtalo de nuevo.');
      let init=blank();try{const legacy=JSON.parse(localStorage.getItem(KEY)||'null');if(legacy&&legacy.setupDone&&!legacy.example)init=normalizeState(legacy)}catch(e){}
      ensureCoreCats(init);init.settings.name=U.authOwner;
      const t=Date.now(),doc={v:1,...await wrapDK(pw,raw),...await sealData(dk,init),device:DEVICE,created:t,updatedAt:t};
      await ref.set(doc);U.authBusy=false;await startAccount(user,hash,raw,dk,doc,{fresh:true});toast(init.setupDone?'Cuenta creada con los datos de este navegador':'Cuenta creada');return}
    if(kind==='login'){const snap=await ref.get();if(!snap.exists)return fail('Este usuario no existe.');const doc=snap.data();
      let raw;try{raw=await unwrapDK(pw,doc)}catch(e){return fail('La contraseña no es correcta.')}
      const dk=await importDK(raw);U.authBusy=false;await startAccount(user,hash,raw,dk,doc);toast('Bienvenido de vuelta');return}
    if(kind==='recover'){const snap=await ref.get();if(!snap.exists)return fail('Este usuario no existe.');
      let cred;try{cred=await AUTH.signInWithEmailAndPassword(email,pw)}catch(e){return fail('Ese correo y contraseña de recuperación no coinciden con ninguna cuenta ligada.')}
      UID=cred.user.uid;const r=recRef(hash);const rs=r?await r.get():null;
      if(!rs||!rs.exists)return fail('Ese correo no está ligado a este usuario. Recupéralo desde el correo con el que lo ligaste, o si nunca ligaste uno, no es posible recuperar la contraseña.');
      U.recRaw=rs.data().dk;U.authMode='recover2';U.auth='recover2';U.authBusy=false;U.authErr='';render();return}
    if(kind==='recover2'){const raw=unb64(U.recRaw),dk=await importDK(raw);const snap=await ref.get();if(!snap.exists)return fail('Este usuario ya no existe.');const doc=snap.data();
      try{await openData(dk,doc)}catch(e){return fail('No se pudo recuperar: la llave guardada ya no coincide con este usuario.')}
      const w=await wrapDK(pw,raw);await ref.update({...w});U.recRaw=null;U.authBusy=false;await startAccount(user,hash,raw,dk,{...doc,...w});toast('Contraseña cambiada');return}
  }catch(e){fail(e&&e.code==='permission-denied'?'No tienes permiso para guardar aquí. Revisa las reglas de seguridad de tu proyecto de Firebase.':'No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.')}}
async function changePassword(){const g=id=>(document.getElementById(id)||{}).value||'',out=document.getElementById('pwMsg');
  const cur=g('cp_cur'),n1=g('cp_new'),n2=g('cp_new2');const say=(m,ok)=>{out.textContent=m;out.className=ok?'small pos':'err'};
  if(n1.length<6)return say('La contraseña nueva debe tener al menos 6 caracteres.');if(n1!==n2)return say('Las contraseñas nuevas no coinciden.');
  try{const snap=await acctRef(U.acct.hash).get();const doc=snap.data();try{await unwrapDK(cur,doc)}catch(e){return say('La contraseña actual no es correcta.')}
    await acctRef(U.acct.hash).update({...await wrapDK(n1,unb64(U.acct.raw))});['cp_cur','cp_new','cp_new2'].forEach(i=>{const el=document.getElementById(i);if(el)el.value=''});say('Contraseña cambiada.',true)}
  catch(e){say('No se pudo cambiar. Inténtalo de nuevo.')}}
function accountPanel(){if(!U.acct)return U.localMode?`<div class="panel"><div class="panel-head"><h2>Cuenta</h2></div><p class="muted" style="margin-bottom:12px">Estás usando la libreta sin cuenta: tus datos viven solo en este navegador.</p>${DB?`<button class="btn" data-a="leaveLocal">Crear cuenta o entrar</button>`:''}</div>`:'';
  return `<div class="panel"><div class="panel-head"><h2>Cuenta</h2><button class="btn sm" data-a="logout">Salir</button></div>
   <dl class="dl"><div><dt>Usuario</dt><dd>${esc(U.acct.user)}</dd></div><div><dt>Nombre del propietario</dt><dd>${esc(S.settings.name||'—')}</dd></div><div><dt>Estado</dt><dd>${esc(syncText())}</dd></div>
    <div><dt>Recuperación por correo</dt><dd>${U.acct.linked?`<span class="chip good">Ligada</span> <button class="btn sm ghost" data-a="linkRec">Cambiar correo</button>`:`<button class="btn sm" data-a="linkRec">Ligar correo de recuperación</button>`}</dd></div></dl>
   <h3 style="margin:18px 0 10px">Cambiar contraseña</h3><div class="form">
    ${pwField('cp_cur','Contraseña actual','current-password','La escribes tú: por seguridad, tu contraseña no se guarda en ningún lado, así que no podemos mostrártela. Usa el ojo para ver lo que tecleas.')}
    ${pwField('cp_new','Contraseña nueva','new-password')}
    ${pwField('cp_new2','Confírmala','new-password')}</div>
   <div class="row" style="margin-top:12px"><button class="btn" data-a="changePw">Cambiar contraseña</button><span id="pwMsg"></span></div>
   <p class="note" style="margin-top:14px">Si olvidas la contraseña de arriba, la recuperas con el correo que ligaste al crear tu cuenta. Esta computadora o celular recuerda tu sesión hasta que toques “Salir”.</p></div>`}

Object.assign(A,{
  authMode:b=>{U.auth=b.dataset.m;U.authErr='';render()},
  authPreview:()=>{U.authPreview=true;U.auth='login';U.authErr='';render()},
  authPreviewExit:()=>{U.authPreview=false;U.authErr='';render()},
  useLocal:()=>{U.booting=false;U.localMode=true;load();U.obDir=S.setupDone?0:1;render()},
  leaveLocal:()=>{U.localMode=false;U.auth='signup';render()},
  logout:()=>ask('¿Salir de tu cuenta?','Tus datos quedan guardados en tu cuenta. Para volver a verlos, entra con tu usuario y contraseña.',()=>{if(unsubAcct)unsubAcct();unsubAcct=null;
    try{localStorage.removeItem(KEY+':'+U.acct.hash)}catch(e){}clearSession();U.acct=null;S=blank();U.auth='login';U.authErr='';U.modal=null},'Salir',false),
  linkRec:()=>{U.modal={kind:'reclink',d:{}};render()},
  saveRecLink:()=>{saveRecLink()},
  changePw:()=>{changePassword()},
  togglePw:b=>{const inp=document.getElementById(b.dataset.target);if(!inp)return;const show=inp.type==='password';inp.type=show?'text':'password';
    b.setAttribute('aria-pressed',show?'true':'false');b.setAttribute('aria-label',show?'Ocultar contraseña':'Mostrar contraseña');b.innerHTML=icon(show?'eyeOff':'eye')},
});
document.addEventListener('submit',e=>{const f=e.target;if(f.id==='authForm'){e.preventDefault();if(!U.authBusy)authSubmit(f.dataset.form)}});

/* ---------- Inicio ---------- */
loadPrefs();applyTheme();
U.booting=true;render();
setTimeout(()=>{if(U.booting){U.bootSlow=true;render()}},4000);
(async()=>{
  if(!FIREBASE_READY||typeof firebase==='undefined'){DB=null;AUTH=null;if(!U.booting)return;U.booting=false;U.auth='login';render();return}
  try{
    const app=firebase.initializeApp(FIREBASE_CONFIG);
    DB=firebase.firestore();AUTH=firebase.auth();
    try{await AUTH.setPersistence(firebase.auth.Auth.Persistence.LOCAL)}catch(e){}
    if(!AUTH.currentUser)await AUTH.signInAnonymously();
    UID=AUTH.currentUser?AUTH.currentUser.uid:null;
  }catch(e){DB=null;AUTH=null;if(!U.booting)return;U.booting=false;U.auth='login';render();return}
  if(!U.booting)return;
  let sess=null;try{sess=JSON.parse(localStorage.getItem(SESSION)||'null')}catch(e){}
  if(DB&&sess&&sess.hash&&sess.raw){try{const snap=await acctRef(sess.hash).get();if(snap.exists){const raw=unb64(sess.raw);const dk=await importDK(raw);U.booting=false;await startAccount(sess.user,sess.hash,raw,dk,snap.data());return}clearSession()}catch(e){U.booting=true;U.authUser=sess.user}}
  if(!U.booting)return;
  U.booting=false;U.auth='login';render();
})();
})();
