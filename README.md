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
| `¿Cómo solicito una licencia de perro?` | Se abstiene y muestra "Ir al canal oficial" |
| `beca municipal` | Ofrece las dos becas municipales como botones para elegir |
| `Quiero inscribirme a un taller de guitarra` | Muestra el trámite del catálogo con "Ver información oficial" (sin requisitos inventados) |

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

- Backend: escenarios Gherkin de US-01, US-06 y US-09 con Cucumber (`backend/features/`), incluidos escenarios de consultas habladas con muletillas, más `catalogo.feature` (catálogo de solo enlace, empate con opciones y tolerancia al 80%).
- Frontend: tests del componente de resultado, de las opciones de desempate, de los textos hablados, del formulario con micrófono y del botón de modo accesibilidad (`frontend/tests/`).


Build del frontend:

```bash
npm run build --prefix frontend
```

## Qué es real y qué es fake

- **Datos:** las fichas de `backend/src/data/fichas.json` son sintéticas. No se usan las 850 preguntas oficiales del municipio ni datos personales.
- **Catálogo:** `backend/src/data/catalogo.json` lista los trámites oficiales **solo con nombre y enlace**; jamás se inventan requisitos, pasos ni vigencia (US-09 / `docs/adr-01.md`). Los duplicados de enlaces del Sprint 1 se excluyen al cargar.
- **Validación:** al iniciar, el backend descarta las fichas incompletas o sin enlace oficial https (`backend/src/services/fichaValidator.ts`).
- **Sin API municipal:** no hay conexión con sistemas de la Municipalidad.
- **Sin LLM:** las respuestas salen de un matching por palabras clave, no de un modelo de IA (ver `docs/adr-01.md`).
- **Enlaces:** apuntan a páginas reales de https://tramites.penalolen.cl.

## Estructura

```
backend/    API Express + TypeScript (puerto 3001), fichas, matching y pruebas Gherkin
frontend/   App React + TypeScript con Vite (puerto 5173)
docs/       UML (docs/uml), ADR-01 y documentos del sprint
```

## Documentación

- `docs/uml/` — diagramas UML del Sprint 1 (casos de uso, clases, secuencia y componentes)
- `docs/adr-01.md` — decisión de arquitectura: fichas JSON sin LLM, monolito cliente-servidor
- `docs/revision-lenguaje-simple.md` — checklist de lenguaje simple de las fichas
- `team-charter.md` — acuerdos del equipo
- `riesgos.md` — riesgos del proyecto
- `TECNOLOGIAS.md` — tecnologías y dependencias
