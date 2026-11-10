# ADR-03 · Búsqueda tolerante a faltas de ortografía, determinística y sin LLM

- **Estado:** Aceptada · Sprint 2
- **Historias:** US-14 (faltas de ortografía), US-13 (voz), US-09 (no inventar)

## Contexto

Los vecinos escriben con faltas ("lisensia", "renobar") y la voz entrega texto con muletillas ("eh, hola…") y letras dictadas ("be" por B). El ADR-01 dejó fuera el LLM porque puede inventar, y US-09 exige abstenerse si no hay una coincidencia clara.

## Opciones

1. **LLM para interpretar la consulta.** Entiende más variaciones, pero puede responder con información que no está en las fichas.
2. **Pedir al vecino que escriba bien.** No resuelve el problema de accesibilidad.
3. **Corrección determinística en `tramiteMatcher.ts` (elegida).** Se quitan muletillas, se interpretan letras dictadas, se compara cómo suenan las palabras (s/c/z, b/v, h muda, ll/y) y se autocorrige cada palabra contra los alias de las fichas.

## Decisión

Opción 3. La corrección solo acerca la consulta a un alias que ya existe y nunca crea una respuesta. Si después de corregir no hay una coincidencia clara, el asistente se abstiene igual que antes.

## Consecuencias

- "lisencia de perro" sigue recibiendo abstención (CA14.3). Los casos están en `casos-borde.feature` y `tramiteMatcher.test.ts`.
- `tramiteMatcher.ts` creció bastante y su costo crece con el largo del texto. Eso explica el riesgo R7, que se resolvió con el ADR-02.
