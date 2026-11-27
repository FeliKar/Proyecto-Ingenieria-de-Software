# MuniChat

Asistente virtual de trámites y servicios municipales para la Municipalidad de Peñalolén.

TICS331 — Ingeniería de Software · Universidad Adolfo Ibáñez · Equipo N.º 2

## Equipo

| Integrante | Rol |
|---|---|
| Joaquín Fernández | Product Owner |
| Pablo Tapia | Scrum Master |
| Felipe Karmy | Developer |
| Vicente Zapata | Developer |

## Alcance del Sprint 1

El vecino consulta un trámite de licencia de conducir (clase B, C o D, primera vez o renovación) o de permiso de circulación, y recibe los requisitos, los pasos, la vigencia y el enlace oficial en tramites.penalolen.cl. Si la consulta es ambigua, el asistente pregunta si es primera vez o renovación. Si no está cubierta, se abstiene y deriva al canal oficial en vez de inventar una respuesta.

Además, `backend/src/data/catalogo.json` incorpora los ~150 trámites publicados en tramites.penalolen.cl **solo con su nombre y enlace oficial** (nunca requisitos inventados); los enlaces que ya cubre una ficha del Sprint 1 se descartan como duplicados al cargar. La búsqueda es tolerante: si dos trámites empatan se ofrecen varias opciones para elegir, y alcanza con usar ~80% de las palabras de un trámite (p. ej. `préstamo de computadores`) para recibir la recomendación.

Historias: US-01 (consultar un trámite), US-06 (recibir el enlace oficial) y US-09 (no inventar información).

## Requisitos

- Node.js 20 o superior (incluye npm)
- Git

## Cómo levantarlo

Desde la raíz del repositorio:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
npm run dev
```

`npm run dev` levanta el backend y el frontend al mismo tiempo:

| Parte | URL |
|---|---|
| Frontend (la app) | https://localhost:5173 |
| Backend (API) | http://localhost:3001 |

El frontend corre sobre **HTTPS con certificado autofirmado** (necesario para que el navegador permita el micrófono y la voz fuera de localhost). La primera vez el navegador muestra un aviso de seguridad: pulsa **"Avanzado" → "Continuar a localhost (no seguro)"**. Es esperado: es un certificado local.

La app llama a la API en el mismo origen (`/api/...`) y Vite la reenvía al backend en el puerto 3001, así que no hay problemas de contenido mixto ni de CORS.

Para comprobar que el backend levantó, abre http://localhost:3001/api/health: debe responder `{"status":"ok"}`.

Si el puerto 5173 está ocupado, Vite usa el siguiente libre (5174, 5175…) y lo muestra en la terminal.

## Fuente de datos: Praxsuite (opcional)

El backend puede leer los trámites desde la base **MuniChatIA** en Praxsuite. Si
no hay credenciales configuradas, usa los JSON de `backend/src/data` como
respaldo, así que el desarrollo y las pruebas funcionan sin red.

Orden de preferencia:

1. **Praxsuite** (`https://gateway.praxsuite.com/<workspace>`), si hay API key.
2. **JSON locales** (`fichas.json` + `catalogo.json`), en cualquier otro caso.

Configuración en `backend/.env` (ver `backend/.env.example`):

| Variable | Descripción |
|---|---|
| `PRAXSUITE_API_KEY` | Server API key `sk_live_…`. |
| `PRAXSUITE_API_KEY_FILE` | Ruta a un archivo con la key (alternativa a la anterior). |
| `PRAXSUITE_GATEWAY_URL` | Base del gateway. Por defecto, el workspace MuniChatIA. |
| `PRAXSUITE_TABLE_TRAMITES` | UUID de la tabla `Tramites`. |
| `PRAXSUITE_TABLE_CLASES` | UUID de la tabla `Clases`. |
| `PRAXSUITE_TABLE_ALIAS` | UUID de la tabla `Alias`. |
| `PRAXSUITE_TABLE_TRAMITE_CLASE` | UUID de la tabla `TramiteClase`. |
| `PRAXSUITE_TABLE_REQUISITOS` | UUID de la tabla `Requisitos`. |
| `PRAXSUITE_TABLE_PASOS` | UUID de la tabla `Pasos`. |
| `PRAXSUITE_CACHE_TTL_MS` | Vigencia de la caché en memoria (5 min por defecto). |
| `PRAXSUITE_DISABLED` | `1` fuerza el uso de los JSON locales. |
| `PRAXSUITE_TABLE_USUARIOS` | Tabla de funcionarios (por defecto, `Usuarios`). |
| `JWT_SECRET` | Secreto de los JWT del panel; sin él es temporal. |
| `PANEL_TOKEN_TTL_MINUTOS` | Vigencia de la sesión (480 min = 8 h por defecto). |
| `PANEL_INTENTOS_MAXIMOS` / `PANEL_VENTANA_INTENTOS_MS` | Límite de logins fallidos (5 en 15 min por defecto). |
| `CALL_CENTER_TELEFONO` | Teléfono de derivación (`+56 2 2486 8000` por defecto, fuente penalolen.cl). |

Para comprobar qué fuente está activa:

```bash
curl http://localhost:3001/api/tramites/estado
# {"origen":"praxsuite","total":158,"fichas":6,"catalogo":152}
```

La suite de Cucumber fija `PRAXSUITE_DISABLED=1`, de modo que nunca depende del
gateway ni de credenciales.

## Panel de funcionarios (US-05)

Los **vecinos nunca inician sesión**: el asistente sigue siendo anónimo. La
sesión es solo para el funcionario que actualiza el catálogo.

1. Abre <https://localhost:5173/panel> (en el chat hay un botón "Panel de
   funcionarios").
2. Inicia sesión con uno de los usuarios de prueba:

   | Correo | Contraseña | Rol |
   |---|---|---|
   | `funcionario.demo@munichat.cl` | `Panel-Demo-2026` | `admin` |
   | `editor.demo@munichat.cl` | `Panel-Editor-2026` | `funcionario` |

   Son los usuarios de `backend/src/data/usuarios.json`, que se usan cuando
   **no** hay API key de Praxsuite. Con Praxsuite configurado, los funcionarios
   salen de la tabla `Usuarios` del workspace (`PRAXSUITE_TABLE_USUARIOS`),
   columna `Rol` incluida.

3. Desde el panel puedes **crear y editar** trámites. **Eliminar** y usar la
   sección **Funcionarios** (para asignar roles) son acciones solo de `admin`.
   Todo lo que guardes aparece en la consulta del vecino en el momento.

   Un admin no puede cambiar su propio rol (así el equipo nunca se queda sin
   administradores). El rol nuevo se escribe en la DB, pero el JWT ya firmado
   conserva el anterior: el cambio se aplica en el **próximo inicio de sesión**
   (o al vencer la sesión, a las 8 h). Ver `docs/adr-05.md`.

Reglas que el panel respeta (igual que la carga de datos):

- Ninguna ficha se guarda sin enlace oficial `https://` (US-09).
- Un trámite del **catálogo** solo tiene nombre y enlace: la API rechaza
  requisitos, pasos o vigencia inventados.
- Una ficha incompleta (sin requisitos, pasos o vigencia) se rechaza con un
  mensaje en lenguaje simple.

API (todas menos `/api/auth/login` exigen `Authorization: Bearer <token>`):

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/api/auth/login` | usuario y contraseña → JWT |
| GET | `/api/auth/me` | quién tiene la sesión |
| GET | `/api/panel/tramites` | lista completa para editar |
| POST | `/api/panel/tramites` | crear un trámite |
| PUT | `/api/panel/tramites/:id` | editar un trámite |
| DELETE | `/api/panel/tramites/:id` | eliminar un trámite (**solo admin**) |
| GET | `/api/panel/usuarios` | listar funcionarios y roles (**solo admin**) |
| PUT | `/api/panel/usuarios/:id/rol` | cambiar el rol a `admin` o `funcionario` (**solo admin**; no permite el propio) |

Si `JWT_SECRET` no está definido, el servidor genera uno temporal y las sesiones
se cierran al reiniciar: en producción va en `backend/.env` (ver
`backend/.env.example`). El límite de intentos fallidos de login es de 5 por
correo e IP cada 15 minutos.

## Abrir desde el celular

1. Conecta el celular a la misma red WiFi que el PC.
2. En vez de `npm run dev`, levanta cada parte en una terminal distinta, con el frontend abierto a la red:

   ```bash
   npm run dev:backend
   ```

   ```bash
   npm --prefix frontend run dev -- --host
   ```

3. Vite muestra una línea `Network: https://192.168.x.x:5173`. Abre esa dirección en el navegador del celular.
4. Acepta el aviso de certificado autofirmado: **"Avanzado" → "Continuar a 192.168.x.x (no seguro)"**. Sin eso, el navegador bloquea el micrófono.
5. Si Windows pregunta por el firewall, permite el acceso en redes privadas.

El celular solo necesita alcanzar el puerto 5173: las llamadas a la API viajan por el mismo puerto y Vite las reenvía al backend en el PC.

## Probar la app

En la app escribe, por ejemplo:

| Consulta | Qué debería pasar |
|---|---|
| `Quiero sacar mi primera licencia clase B` | Muestra la ficha con requisitos, pasos, vigencia y "Ver información oficial" |
| `licencia B` | Pregunta si es primera vez o renovación, con botones |
| `licencia` (una sola palabra) | Ofrece las opciones de licencia para elegir; si solo hay un trámite, lo muestra |
| `guitarra` (una sola palabra) | Muestra la ficha del taller de guitarra |
| `¿Cómo solicito una licencia de perro?` | Se abstiene y muestra "Ir al canal oficial" y "Llamar al +56 2 2486 8000" |
| `beca municipal` | Ofrece las becas municipales como botones para elegir |
| `Quiero inscribirme a un taller de guitarra` | Muestra el trámite del catálogo con "Ver información oficial" (sin requisitos inventados) |

No hace falta escribir una frase: **una sola palabra** (`licencia`, `beca`,
`guitarra`) también busca. Si hay un único trámite lo muestra; si hay varios,
ofrece botones para elegir. Una palabra que no es del catálogo (`perro`,
`conpostera`) sigue absteniéndose (US-09).

Cuando no hay respuesta confiable, la derivación ofrece **web + teléfono**: el
enlace a penalolen.cl y un botón `tel:` al call center municipal. El número se
configura con `CALL_CENTER_TELEFONO` (`+56 2 2486 8000` por defecto).

### Consulta por voz (modo accesibilidad)

La página opera normalmente (solo texto) hasta que la persona activa el botón **"Modo accesibilidad"** (arriba a la derecha). Solo con ese modo activo aparece el micrófono y se leen las respuestas en voz alta; la preferencia se guarda en el navegador, así que la próxima visita ya está activa.

Con el modo activado:

1. Toca el botón circular del micrófono 🎤 y di, por ejemplo, "quiero saber para sacar mi primera licencia clase B".
2. Al terminar, el asistente **lee en voz alta** lo que escuchó y ofrece botones grandes: **Buscar**, **Hablar otra vez** y **Escuchar de nuevo**.
3. Al encontrar la ficha (o la abstención), la **lee completa en voz alta**. Hay botones "Escuchar de nuevo" y "Detener".
4. Al desactivar el modo, se corta cualquier lectura y la página vuelve a operar solo con texto.

Requiere Chrome o Microsoft Edge (usa la Web Speech API del navegador) y permiso de micrófono. En navegadores sin soporte, el micrófono se deshabilita con un aviso y el campo de texto sigue funcionando. Las consultas habladas suelen traer muletillas ("eh", "hola…"), que el backend ignora al buscar. Además, las letras dictadas se interpretan como la letra correspondiente: si el navegador escribe "be", "ve" o "ví", el asistente lo entiende como B o V (por ejemplo, "licencia tipo be renovar" encuentra lo mismo que "licencia tipo b renovar").

### Si el micrófono dice que no puede conectarse

El reconocimiento de voz del navegador se procesa en los servidores del propio navegador (Google en Chrome, Microsoft en Edge), no en este proyecto. Si aparece un error de conexión:

1. **¿Estás en Chrome?** Prueba con **Microsoft Edge**: usa los servidores de voz de Microsoft y suele funcionar donde Chrome falla.
2. **Extensiones bloqueadoras** (uBlock Origin, AdGuard, bloqueadores de DNS): añade `localhost` a la lista permitida o desactívalas en la página de la app. Abre DevTools (F12) → pestaña Network y revisa si aparece bloqueada una petición a `speech.googleapis.com`.
3. **Red corporativa o proxy** que bloquee los servidores de voz del navegador.
4. **¿La página no es https ni localhost?** El navegador bloquea el micrófono por seguridad; abre la dirección con https (ver "Abrir desde el celular").
5. Mientras tanto, el **campo de texto siempre funciona**: al fallar la voz, el asistente lo resalta y pone el cursor ahí automáticamente.

## Pruebas

Todas las pruebas (backend + frontend):

```bash
npm test
```

- Backend: escenarios Gherkin de US-01, US-06 y US-09 con Cucumber (`backend/features/`), incluidos escenarios de consultas habladas con muletillas, más `catalogo.feature` (catálogo de solo enlace, empate con opciones y tolerancia al 80%), `palabras-solas.feature`, `call-center.feature`, `auth.feature` (sesión del funcionario), `panel.feature` (alta, edición y baja de trámites) y `roles.feature` (permisos y asignación de roles).
- Backend unitarias: `npm --prefix backend run test:unit` (validación, matching —incluidas las palabras solas—, contraseñas, JWT, panel y roles sobre archivos temporales).
- Frontend: tests del componente de resultado, de las opciones de desempate, de la derivación con teléfono, de los textos hablados, del formulario con micrófono, del botón de modo accesibilidad, del login, del editor del panel, de la lista de funcionarios, de los permisos por rol y del API anónima (`frontend/tests/`).


Build del frontend:

```bash
npm run build --prefix frontend
```

## Qué es real y qué es fake

- **Datos:** las fichas de `backend/src/data/fichas.json` son sintéticas. No se usan las 850 preguntas oficiales del municipio ni datos personales. La base de Praxsuite replica esas mismas fichas y el catálogo: no agrega información inventada.
- **Catálogo:** `backend/src/data/catalogo.json` lista los trámites oficiales **solo con nombre y enlace**; jamás se inventan requisitos, pasos ni vigencia (US-09 / `docs/adr-01.md`). Los duplicados de enlaces del Sprint 1 se excluyen al cargar.
- **Validación:** al iniciar, el backend descarta las fichas incompletas o sin enlace oficial https (`backend/src/services/fichaValidator.ts`).
- **Sin API municipal:** no hay conexión con sistemas de la Municipalidad.
- **Sin LLM:** las respuestas salen de un matching por palabras clave, no de un modelo de IA (ver `docs/adr-01.md`).
- **Enlaces:** apuntan a páginas reales de https://tramites.penalolen.cl.

## Estructura

```
backend/    API Express + TypeScript (puerto 3001), fichas, matching y pruebas Gherkin
frontend/   App React + TypeScript con Vite (puerto 5173)
docs/       UML (docs/uml), ADR-01..05 y documentos del sprint
```

## Documentación

- `docs/uml/` — diagramas UML del Sprint 1 (casos de uso, clases, secuencia y componentes) y de los sprints 2 y 3 (`componentes_sprint3.puml`, `secuencia_panel.puml`, `secuencia_roles.puml`)
- `docs/adr-01.md` — decisión de arquitectura: fichas JSON sin LLM, monolito cliente-servidor
- `docs/adr-02.md` — seguridad y datos personales
- `docs/adr-03.md` — manejo de la incertidumbre y derivación
- `docs/adr-04.md` — autenticación: solo los funcionarios inician sesión
- `docs/adr-05.md` — autorización: roles `admin` y `funcionario`
- `docs/revision-lenguaje-simple.md` — checklist de lenguaje simple de las fichas
- `team-charter.md` — acuerdos del equipo
- `riesgos.md` — riesgos del proyecto
- `TECNOLOGIAS.md` — tecnologías y dependencias
