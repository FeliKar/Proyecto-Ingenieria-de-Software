# language: es
Característica: US-09 Derivación al call center municipal
  Cuando el asistente no tiene información confiable, deriva al vecino por
  teléfono y por sitio web, sin inventar requisitos ni enlaces de trámite.

  Escenario: La abstención entrega teléfono y sitio web
    Cuando consulto "¿Cómo obtengo una compostera?"
    Entonces el asistente no encuentra el trámite
    Y el canal de derivación incluye teléfono "+56 2 2486 8000" y sitio web
    Y la respuesta no incluye enlace_oficial

  Escenario: Un empate también entrega el teléfono del call center
    Cuando consulto "licencia"
    Entonces el asistente ofrece opciones para elegir con motivo "empate"
    Y el canal de derivación incluye teléfono "+56 2 2486 8000" y sitio web

  Escenario: Una ambigüedad de primera vez o renovación también deriva por teléfono
    Cuando consulto "sacar licencia clase B"
    Entonces la respuesta incluye opciones para desambiguar
    Y el canal de derivación incluye teléfono "+56 2 2486 8000" y sitio web
