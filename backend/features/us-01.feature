# language: es
Característica: US-01 Consultar información de un trámite
  Como vecino quiero consultar los requisitos de una licencia o permiso
  para saber qué necesito antes de acudir al municipio.

  Escenario: Camino feliz - primera licencia clase B
    Cuando consulto "Quiero sacar mi primera licencia clase B"
    Entonces la respuesta es exitosa con el trámite "Primera licencia clase B"
    Y el trámite incluye requisitos, pasos, vigencia y enlace oficial

  Escenario: Primera licencia por primera vez
    Cuando consulto "Quiero sacar licencia B por primera vez"
    Entonces la respuesta es exitosa con el trámite "Primera licencia clase B"

  Escenario: Renovar licencia clase B
    Cuando consulto "Quiero renovar mi licencia clase B"
    Entonces la respuesta es exitosa con el trámite "Renovación de licencia clase B"

  Escenario: Renovar licencia B sin la palabra "clase"
    Cuando consulto "Necesito renovar la licencia B"
    Entonces la respuesta es exitosa con el trámite "Renovación de licencia clase B"

  Escenario: Sacar licencia clase B sin especificar primera vez o renovación
    Cuando consulto "Necesito sacar licencia clase B"
    Entonces el asistente se abstiene de responder
    Y entrega un canal de derivación

  Escenario: Licencia de clase distinta a B
    Cuando consulto "Quiero sacar licencia clase C"
    Entonces el asistente se abstiene de responder
    Y entrega un canal de derivación

  Escenario: Licencia de clase numérica distinta a B
    Cuando consulto "Quiero sacar licencia clase 1"
    Entonces el asistente se abstiene de responder
    Y entrega un canal de derivación

  Escenario: Renovar licencia de clase distinta a B
    Cuando consulto "Quiero renovar licencia C"
    Entonces el asistente se abstiene de responder
    Y entrega un canal de derivación

  Escenario: Renovar permiso de circulación
    Cuando consulto "¿Cómo renuevo mi permiso de circulación?"
    Entonces la respuesta es exitosa con el trámite "Renovación de permiso de circulación"

  Escenario: Obtener permiso de circulación por primera vez
    Cuando consulto "Compré un auto nuevo, ¿cómo saco el permiso de circulación?"
    Entonces la respuesta es exitosa con el trámite "Obtención de permiso de circulación"

  Escenario: Consulta sin coincidencia - el asistente se abstiene
    Cuando consulto "¿Cómo solicito una licencia de perro?"
    Entonces el asistente se abstiene de responder
    Y entrega un canal de derivación

  Escenario: Error - consulta inválida
    Cuando consulto ""
    Entonces el servidor responde con un error de solicitud inválida
