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
| Frontend (la app) | http://localhost:5173 |
| Backend (API) | http://localhost:3001 |

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

3. Vite muestra una línea `Network: http://192.168.x.x:5173`. Abre esa dirección en el navegador del celular.
4. Si Windows pregunta por el firewall, permite el acceso en redes privadas.

El frontend llama al backend en la misma dirección desde donde se abrió la página, así que no hay que configurar nada más.

## Probar la app

En la app escribe, por ejemplo:

| Consulta | Qué debería pasar |
|---|---|
| `Quiero sacar mi primera licencia clase B` | Muestra la ficha con requisitos, pasos, vigencia y "Ver información oficial" |
| `licencia B` | Pregunta si es primera vez o renovación, con botones |
| `¿Cómo solicito una licencia de perro?` | Se abstiene y muestra "Ir al canal oficial" |

## Pruebas

Todas las pruebas (backend + frontend):

```bash
npm test
```

- Backend: escenarios Gherkin de US-01, US-06 y US-09 con Cucumber (`backend/features/`).
- Frontend: tests del componente de resultado (`frontend/tests/`).

Build del frontend:

```bash
npm run build --prefix frontend
```

## Qué es real y qué es fake

- **Datos:** las fichas de `backend/src/data/fichas.json` son sintéticas. No se usan las 850 preguntas oficiales del municipio ni datos personales.
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
