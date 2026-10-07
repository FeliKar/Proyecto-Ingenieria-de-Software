# language: es
Característica: US-01 Consultar información de un trámite
  Como vecino quiero consultar los requisitos de una licencia o permiso
  para saber qué necesito antes de acudir al municipio.

  Escenario: Camino feliz - consulta de un trámite existente
    Cuando consulto "¿Qué necesito para sacar licencia clase B?"
    Entonces la respuesta es exitosa con el trámite "Primera licencia clase B"
    Y el trámite incluye requisitos, pasos, vigencia y enlace oficial

  Escenario: Consulta sin coincidencia - el asistente se abstiene
    Cuando consulto "¿Cómo solicito una licencia de perro?"
    Entonces el asistente se abstiene de responder
    Y entrega un canal de derivación

  Escenario: Error - consulta inválida
    Cuando consulto ""
    Entonces el servidor responde con un error de solicitud inválida
