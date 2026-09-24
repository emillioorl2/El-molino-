# El Molino — Finanzas personales

App web instalable (PWA) de finanzas personales, con cuentas propias (usuario +
contraseña) y sincronización en la nube vía Firebase. Cifrado de conocimiento cero:
tu contraseña nunca se guarda en ningún lado, solo se usa en tu navegador para abrir
la llave con la que se cifran tus datos antes de subirlos.

## Cómo probarla ahora mismo (antes de publicarla)

Cualquiera puede probarla en su computadora o celular sin instalar nada:
1. Descomprime esta carpeta.
2. Abre `index.html` directamente haciendo doble clic (o arrástralo a Chrome/Safari).
3. La app funciona completa. Mientras no esté conectado un proyecto de Firebase (ver
   abajo), las cuentas y la nube no están disponibles — la persona puede probarla
   con "Usar solo en este navegador" o "Ver con datos de ejemplo", exactamente igual
   que como se ve una vez publicada, solo que sin cuentas todavía.
4. Para probar el instalado (ícono, funciona sin internet) hace falta abrirla desde
   un servidor real, no doble clic — eso ya no es necesario para juzgar cómo se ve
   y cómo funciona.

Esta app no depende de nada externo a ella misma: es un sitio autónomo, no requiere
ninguna cuenta ni servicio de terceros para abrirse y probarse.

## Cómo se guardan las cuentas (correo de recuperación)

Cada persona que crea una cuenta elige su propio usuario y contraseña, y liga un
correo electrónico propio como recuperación — es obligatorio al crear la cuenta.
Ese correo + una contraseña de recuperación (independiente de la contraseña
principal) funcionan como llave de emergencia: si alguien olvida su contraseña,
entra con ese correo y puede poner una contraseña nueva sin perder sus datos.
Es completamente independiente entre personas — cada quien liga su propio correo,
nadie depende de una cuenta de nadie más.

## Qué falta para que quede en línea de verdad

### 1. Crear el proyecto de Firebase (gratis, ~10-15 min)
1. Ve a **console.firebase.google.com** y entra con tu cuenta de Google.
2. "Agregar proyecto" → dale un nombre → puedes desactivar Google Analytics.
3. **Authentication** → pestaña "Sign-in method" → activa **Anónimo** y
   **Correo electrónico/contraseña**.
4. **Firestore Database** → "Crear base de datos" → modo producción → elige la
   región más cercana.
5. En la pestaña **Reglas** de Firestore, pega el contenido de `firestore.rules`
   (incluido en esta carpeta) y publica.
6. En la página principal del proyecto, click en `</>` ("agregar app web"). Ponle
   un apodo (no actives Firebase Hosting todavía). Copia el bloque de 6 valores
   que te va a mostrar (`apiKey`, `authDomain`, `projectId`, etc.).

### 2. Pegar las llaves
Abre `07-firebase.js`, busca `const FIREBASE_CONFIG={` (casi al inicio) y pega ahí
los 6 valores. Reconstruye `index.html` (o pásame las llaves y lo hago yo).

### 3. Publicarla en internet
Opción simple y gratis: **Firebase Hosting**.
1. `npm install -g firebase-tools`
2. `firebase login`, luego `firebase init hosting` en esta carpeta (elige tu
   proyecto, carpeta pública = esta carpeta, single-page app = No).
3. `firebase deploy` — te da una URL tipo `tu-proyecto.web.app`, con HTTPS.

### 4. Dominio propio (opcional, ~$10-15 USD/año)
Cómpralo en cualquier registrador y agrégalo desde Firebase Hosting →
"Agregar dominio personalizado".

### 5. App nativa en App Store / Google Play
Necesita la app ya publicada en internet (pasos 1-3), más:
- Cuenta de desarrollador de Apple ($99 USD/año, developer.apple.com) — se
  compila con Xcode (Mac), o con un servicio en la nube si no tienes una.
- Cuenta de desarrollador de Google Play ($25 USD pago único).
- Empaquetado con **Capacitor**, que convierte esta misma app web en un proyecto
  de Xcode/Android Studio. Lo dejo listo en cuanto la app esté publicada en
  internet; crear las cuentas y subir a revisión sí lo haces tú, desde tus
  propias cuentas.
- Sí se pueden lanzar actualizaciones después de publicada, sin límite: en la
  tienda pasan otra vez por revisión (horas en Google Play, 1-3 días en Apple),
  y en la web se publican al instante.
