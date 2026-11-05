# Pruebas de estrés del backend

Endpoint probado: `POST /api/tramites/consultar` (buscador de trámites).

## Cómo reproducir

```bash
npm --prefix backend install
npm --prefix backend run test:estres
```

El script (`backend/tests/estres/consultar.estres.ts`) levanta el backend en el puerto 3001, aplica la carga con [autocannon](https://github.com/mcollina/autocannon) y apaga el servidor al terminar. El puerto 3001 tiene que estar libre: si `npm run dev` está abierto, el script se detiene sin medir nada. Dura unos 2 minutos.

Escenarios:

- Carga escalonada: 10, 50, 200 y 500 conexiones simultáneas, 20 s cada una, sin pausa entre peticiones. Las consultas rotan entre seis preguntas que recorren todos los caminos del buscador: encontrado, ambiguo, sin coincidencia, con faltas de ortografía y un trámite del catálogo.
- Antes de cada escenario el script espera a que el backend termine las consultas que quedaron en cola, para que un escenario no ensucie al siguiente.
- Abuso: durante 20 s, 10 conexiones consultan normal mientras otras 2 envían preguntas de unos 20.000 caracteres.

Meta para 10, 50 y 200 conexiones: 0 errores, 0 timeouts, 0 respuestas no-2xx y p99 < 500 ms. El nivel 500 y el abuso solo se reportan.

## Resultados

Corrida del 2026-11-05 sobre el commit `4148fad`. Máquina: Intel Core i7-9750H (12 hilos), 15 GB RAM, Node 26.13. autocannon y el backend corren en el mismo notebook, así que los números son de ese equipo y no de un servidor de producción.

| Escenario | Conexiones | Req/s | p50 (ms) | p99 (ms) | Máx (ms) | Peticiones | Errores | Timeouts | No-2xx |
|---|---|---|---|---|---|---|---|---|---|
| Carga | 10 | 352 | 23 | 75 | 113 | 7038 | 0 | 0 | 0 |
| Carga | 50 | 357 | 108 | 334 | 1130 | 7131 | 0 | 0 | 0 |
| Carga | 200 | 387 | 381 | 1125 | 1499 | 7738 | 0 | 0 | 0 |
| Carga | 500 | 386 | 1283 | 2848 | 9133 | 7713 | 3 | 3 | 0 |
| Abuso: usuarios normales | 10 | 3 | 2756 | 8287 | 8287 | 50 | 0 | 0 | 0 |
| Abuso: consultas largas | 2 | 0 | 5487 | 8212 | 8212 | 7 | 0 | 0 | 0 |

Resultado: cumple la meta con 10 y 50 conexiones. **No la cumple con 200**: no hubo errores, pero el p99 fue de 1.125 ms (la meta era menos de 500 ms).

Los números cambian entre corridas. En una corrida anterior, el nivel 200 tuvo un p99 de 466 ms, pero 224 peticiones (3 %) superaron el timeout de 10 s de autocannon. En las dos corridas el nivel 200 queda fuera de la meta y el techo fue el mismo, de unas 350 a 390 consultas por segundo.

## Análisis

- El backend atiende como máximo unas 360 consultas por segundo, sin importar cuántas conexiones haya. Corre en un solo proceso de Node y la búsqueda usa CPU: cada consulta cuesta entre 0,5 y 6,7 ms según la pregunta (las que no encuentran nada son las más caras, porque recorren todo el vocabulario).
- Con más conexiones las consultas solo esperan más en la cola: el p99 pasa de 75 ms con 10 conexiones a 1,1 s con 200 y 2,8 s con 500.
- Para comparar: Peñalolén tiene unos 266 mil habitantes. Aunque 1.000 personas consultaran en la misma hora, serían alrededor de 1 consulta por segundo. 360 por segundo equivalen a cerca de 1,3 millones de consultas por hora, así que la carga normal esperada queda muy por debajo del límite.

## Hallazgos (para otro ticket)

1. **Consultas largas bloquean al resto.** Con solo 2 conexiones enviando preguntas de 20.000 caracteres (unas 2.700 palabras desconocidas), los usuarios normales bajaron de 352 a 3 consultas por segundo y su p99 subió de 75 ms a 8,3 s. Cada pregunta larga ocupa el servidor unos 5,5 s: la corrección ortográfica compara cada palabra con todo el vocabulario y después la búsqueda vuelve a comparar cada palabra con el vocabulario de los trámites candidatos. Una persona podría dejar la página casi sin servicio con muy pocas peticiones. Corrección sugerida: limitar el largo de la pregunta en la ruta (por ejemplo, 300 caracteres) y responder 400 si se pasa.
2. **No hay límite de peticiones por usuario** (rate limiting). Sumado a lo anterior, facilita saturar el servidor.
3. **Un solo proceso.** El techo de ~360 consultas por segundo corresponde a un núcleo. Si algún día hiciera falta más, se podría correr un proceso por núcleo (por ejemplo, con el módulo `cluster` de Node o con varias instancias detrás de un balanceador).
