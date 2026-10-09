 # ADR-01 · Fichas sintéticas en JSON como fuente de verdad, sin LLM, en un monolito cliente-servidor

| Campo          | Contenido                                                              |
| -------------- | ---------------------------------------------------------------------- |
| **Estado**     | Aceptada · Sprint 1 · 09/10/2026                                       |
| **Decidieron** | Joaquín Fernández (PO), Pablo Tapia (SM), Felipe Karmy, Vicente Zapata |

## Contexto

El Must del Sprint 1 es que un vecino consulte un trámite (licencias y permiso de circulación) y reciba requisitos, pasos y el enlace oficial, y que si la consulta no está cubierta el sistema lo diga en vez de inventar (US-01, US-06, US-09).

- Las 850 preguntas oficiales del municipio todavía no están saneadas y no se pueden usar.
- La fuente de verdad tiene que ser auditable en la demo: Simón tiene que poder ver de dónde sale cada respuesta.
- Somos un solo equipo de 4 personas y no hay dolor de escala.

## Opciones

1. LLM que genere las respuestas. Pro: entiende preguntas libres. Contra: puede inventar requisitos o enlaces, que es justo lo que US-09 prohíbe, y no es auditable.
2. Base de datos (SQL) con las fichas. Pro: escala mejor. Contra: más infraestructura para solo 6 fichas sintéticas.
3. Archivo fichas.json con fichas sintéticas + matching por palabras clave (elegida). Pro: cada respuesta sale de una ficha que se puede abrir y revisar; simple de levantar. Contra: entiende menos variaciones de la pregunta.

Para la arquitectura:

- Microservicios: contra: red, consistencia y despliegue por servicio para un equipo de 4, sin dolor de escala.
- Monolito cliente-servidor (elegida): un frontend React y un backend Express que lee un único JSON.

## Decisión

- Las respuestas salen solo de backend/src/data/fichas.json (fichas sintéticas), con un matching determinístico por alias y palabras clave (tramiteMatcher.ts). Sin LLM ni APIs de IA.
- Al iniciar, el backend valida las fichas (fichaValidator.ts): las que vienen incompletas o sin enlace oficial https se descartan y nunca se reemplazan por una URL inventada.
- Si no hay coincidencia o la consulta es ambigua, el asistente se abstiene con un texto fijo (abstention.ts) y deriva al canal oficial.
- Arquitectura cliente-servidor: frontend React + TypeScript (Vite, puerto 5173) y backend Node.js + Express (puerto 3001). Dos procesos y un JSON no son microservicios.
- Todo corre en el PC del equipo. Desde un celular en la misma red WiFi se entra con la IP del PC; el frontend llama al backend en esa misma IP.

## Consecuencias / deuda

- El matching entiende menos formas de preguntar que un LLM. Se evalúa US-10 (interpretación con LLM) en sprints siguientes, siempre respondiendo desde fichas validadas.
- Agregar o cambiar trámites exige editar fichas.json a mano. El panel de actualización (US-05) queda para más adelante.
- No hay capa de servicio: el router carga las fichas y arma la respuesta (deuda anotada en el diagrama de clases, Fig. 4.2).
- Cuando lleguen las preguntas oficiales saneadas, se reemplazan las fichas sintéticas sin cambiar la arquitectura.
