# language: es
Característica: US-09 No inventar información
  Como vecino quiero que el asistente me indique cuando no dispone de información
  oficial suficiente para no tomar decisiones basadas en una respuesta incorrecta.

  Escenario: Camino feliz - consulta fuera de cobertura
    Cuando consulto "¿Cómo solicito una licencia de perro?"
    Entonces el asistente se abstiene de responder
    Y entrega un canal de derivación
    Y el mensaje indica que no hay información suficiente para responder

  Escenario: Consulta ambigua - mismo comportamiento que sin cobertura
    Cuando consulto "licencia tipo b"
    Entonces el asistente se abstiene de responder
    Y entrega un canal de derivación
    Y la respuesta incluye opciones para desambiguar
    Y la respuesta no incluye una ficha de trámite

  Escenario: La respuesta no contiene requisitos, costos ni fechas generados
    Cuando consulto "Quiero tramitar algo de salud"
    Entonces el asistente se abstiene de responder
    Y la respuesta no contiene requisitos, costos ni fechas generados

  Escenario: La respuesta no contiene un enlace_oficial de una ficha
    Cuando consulto "¿Dónde pago el impuesto a los perros?"
    Entonces el asistente se abstiene de responder
    Y la respuesta no incluye una ficha de trámite
    Y la respuesta no incluye enlace_oficial

  Escenario: Consulta vacía - no se inventa una respuesta
    Cuando consulto ""
    Entonces el servidor responde con un error de solicitud inválida

  Escenario: Consulta sin palabras útiles - no se inventa una respuesta
    Cuando consulto "???"
    Entonces el asistente se abstiene de responder
    Y entrega un canal de derivación

  Esquema del escenario: Las consultas sin cobertura nunca devuelven una ficha
    Cuando consulto "<consulta>"
    Entonces el asistente se abstiene de responder
    Y entrega un canal de derivación
    Y la respuesta no incluye una ficha de trámite
    Y la respuesta no contiene requisitos, costos ni fechas generados
    Y la respuesta no incluye enlace_oficial

    Ejemplos:
      | consulta                              |
      | ¿Cómo solicito una licencia de perro? |
      | ¿Dónde pago el impuesto a los perros? |
      | Quiero tramitar algo de salud         |
      | Necesito hablar con un funcionario    |
      | ¿Cuánto cuesta el aseo domiciliario?  |
