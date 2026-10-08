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
    Entonces la respuesta es exitosa con el trámite "Control o renovaciones de licencias clases B, C, D y F"

  Escenario: Renovar licencia B sin la palabra "clase"
    Cuando consulto "Necesito renovar la licencia B"
    Entonces la respuesta es exitosa con el trámite "Control o renovaciones de licencias clases B, C, D y F"

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
    Entonces la respuesta es exitosa con el trámite "Control o renovaciones de licencias clases B, C, D y F"

  Escenario: Primera licencia clase C
    Cuando consulto "Quiero sacar mi primera licencia clase C"
    Entonces la respuesta es exitosa con el trámite "Solicitud de licencia clase C"
    Y la ficha incluye el enlace oficial de tramites.penalolen.cl

  Escenario: Primera licencia clase D
    Cuando consulto "Quiero sacar mi primera licencia clase D"
    Entonces la respuesta es exitosa con el trámite "Solicitud de licencia clase D"

  Escenario: Renovar licencia clase D
    Cuando consulto "Quiero renovar licencia clase D"
    Entonces la respuesta es exitosa con el trámite "Control o renovaciones de licencias clases B, C, D y F"

  Escenario: Sacar licencia clase C sin especificar primera vez o renovación
    Cuando consulto "Quiero sacar licencia clase C"
    Entonces el asistente se abstiene de responder
    Y entrega un canal de derivación

  Escenario: Renovar permiso de circulación
    Cuando consulto "¿Cómo renuevo mi permiso de circulación?"
    Entonces la respuesta es exitosa con el trámite "Renovación de permiso de circulación"

  Escenario: Obtener permiso de circulación por primera vez
    Cuando consulto "Compré un auto nuevo, ¿cómo saco el permiso de circulación?"
    Entonces la respuesta es exitosa con el trámite "Obtención de permiso de circulación"

  Escenario: Consulta ambigua - licencia tipo B sin primera/renovación
    Cuando consulto "licencia tipo b"
    Entonces el asistente se abstiene de responder
    Y el mensaje pregunta si es primera licencia o renovación
    Y la respuesta incluye opciones para desambiguar

  Escenario: Elegir una opción en la consulta ambigua devuelve la ficha correcta
    Cuando consulto "licencia tipo b"
    Y elijo la opción "Control o renovaciones" por su identificador
    Entonces la respuesta es exitosa con el trámite "Control o renovaciones de licencias clases B, C, D y F"

  Escenario: Consulta sin coincidencia - el asistente se abstiene
    Cuando consulto "¿Cómo solicito una licencia de perro?"
    Entonces el asistente se abstiene de responder
    Y entrega un canal de derivación

  Escenario: Error - consulta inválida
    Cuando consulto ""
    Entonces el servidor responde con un error de solicitud inválida
