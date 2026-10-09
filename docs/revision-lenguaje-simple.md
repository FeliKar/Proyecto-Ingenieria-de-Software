# Revisión de textos de fichas — Checklist de lenguaje simple (T6)

Aplicado sobre las 3 fichas sintéticas actuales de US-01
(`backend/src/data/fichas.json`).

## Criterios de la checklist

| # | Criterio | Cómo verificarlo |
|---|----------|------------------|
| 1 | Sin jerga técnica ni siglas sin explicar | Leer cada requisito/paso en voz alta |
| 2 | Frases cortas (máx. ~20 palabras) | Contar palabras por enunciado |
| 3 | Verbos en infinitivo para acciones del usuario | Revisar inicio de cada paso |
| 4 | Unidades y plazos claros | Ej.: "6 años desde su emisión" |
| 5 | Requisitos como lista escaneable | Formato de lista, sin párrafos |
| 6 | Nombres oficiales de instituciones completos | Ej.: Dirección de Tránsito Municipal |
| 7 | Enlace oficial presente y accionable al final | Campo `enlace_oficial` |

## Resultado por ficha

| Ficha | C1 | C2 | C3 | C4 | C5 | C6 | C7 | Observaciones |
|-------|----|----|----|----|----|----|----|---------------|
| Primera licencia clase B | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Requisito de certificado de estudios especifica "mínimo 8° básico aprobado" — claro |
| Renovación de licencia clase B | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | "No tener multas graves impagas" podría precisar dónde consultar multas (mejora futura) |
| Permiso de circulación | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | SOAP explicado como "Seguro obligatorio (SOAP)" — OK |

## Conclusión

Las 3 fichas cumplen la checklist de lenguaje simple. Se registran como mejora futura:
- Precisar en "Renovación de licencia clase B" el canal para consultar multas impagas.
- Revisar nuevamente la checklist cada vez que se agregue una ficha nueva.
