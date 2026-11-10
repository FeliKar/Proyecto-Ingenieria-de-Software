# ADR-02 · Validar la consulta en un middleware y limitar su largo

- **Estado:** Aceptada · Sprint 2
- **Requerimiento no funcional:** disponibilidad. Un vecino no debe poder dejar sin servicio al resto.
- **Relacionado:** riesgo R7, `docs/pruebas-estres.md`, ticket #65.

## Contexto

La prueba de estrés mostró que dos clientes que mandan preguntas de unos 20.000 caracteres bajan a los demás usuarios de unas 390 a 7 consultas por segundo. El problema es que la corrección ortográfica compara cada palabra con todo el vocabulario, así que su costo crece con el largo del texto. La ruta no tenía límite de largo.

Además, la ruta `POST /api/tramites/consultar` validaba la entrada, buscaba la ficha y armaba la respuesta en una sola función (deuda T4b del Sprint 1).

## Opciones

1. **Limitar el largo dentro de la ruta.** Es lo más rápido, pero suma otra responsabilidad a una función que ya hacía demasiado.
2. **Limitar de peticiones por usuario (rate limiting).** Ayuda contra muchas peticiones, pero no contra pocas peticiones muy caras. Además agrega una dependencia.
3. **Middleware de validación (elegida).** Una función `validarConsulta` que revisa la petición antes de que llegue a la lógica de negocio. Si no es válida, responde y corta la cadena. Si lo es, llama a `next()`.

## Decisión

Opción 3: `src/middleware/validarConsulta.ts`.

- Pregunta vacía o que no es texto → **400**.
- Pregunta de más de **300 caracteres** → **413**, sin buscar nada.
- Elección por `tramiteId` → pasa directo.

Junto con esto, la lógica de negocio pasó a `src/services/tramiteService.ts` (refactor T4b). La ruta solo encadena el middleware y el servicio y traduce el resultado a HTTP.

## Consecuencias

- Con el ataque de consultas largas, los usuarios normales siguen atendidos: de 7 a 383 consultas por segundo, y el p99 baja de 3,6 s a 55 ms (ver `docs/pruebas-estres.md`).
- Las preguntas reales caben de sobra en 300 caracteres. La más larga de los escenarios Gherkin tiene unos 95.
- El límite de peticiones por usuario y el resto de los RNF del ticket #65 (autenticación, autorización, no repudio, privacidad del audio) quedan para el Sprint 3.
- Cubierto por `tests/unit/validarConsulta.test.ts` y por el escenario "Una consulta de más de 300 caracteres se rechaza sin buscar" de `casos-borde.feature`.
