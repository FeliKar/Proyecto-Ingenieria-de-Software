# language: es
Característica: US-06 Acceder a la fuente oficial
  Como vecino quiero recibir el enlace oficial correspondiente al trámite
  para poder continuar el proceso en el canal municipal adecuado.

  Escenario: Camino feliz - enlace oficial de una primera licencia clase B
    Cuando consulto "Quiero sacar mi primera licencia clase B"
    Entonces la respuesta es exitosa con el trámite "Primera licencia clase B"
    Y el enlace_oficial de la respuesta no está vacío
    Y el enlace_oficial de la respuesta comienza con "https://"
    Y el enlace_oficial de la respuesta apunta a tramites.penalolen.cl

  Escenario: El enlace oficial corresponde al trámite consultado
    Cuando consulto "Quiero renovar mi permiso de circulación"
    Entonces la respuesta es exitosa con el trámite "Renovación de permiso de circulación"
    Y el enlace_oficial de la respuesta coincide con el de la ficha "permiso-circulacion-renovacion"

  Escenario: Renovar licencia clase B entrega el enlace de control o renovaciones
    Cuando consulto "Quiero renovar mi licencia clase B"
    Entonces la respuesta es exitosa con el trámite "Control o renovaciones de licencias clases B, C, D y F"
    Y el enlace_oficial de la respuesta coincide con el de la ficha "control-o-renovaciones-licencias"

  Escenario: La abstención no entrega un enlace oficial inventado
    Cuando consulto "¿Cómo solicito una licencia de perro?"
    Entonces el asistente se abstiene de responder
    Y la respuesta no incluye enlace_oficial

  Escenario: Una ficha sin enlace oficial se rechaza en la validación
    Dada una ficha sin el campo enlace_oficial
    Entonces la validación rechaza la ficha
    Y no se sustituye por un enlace construido
    Y la ficha no queda disponible para responder consultas

  Esquema del escenario: Cada trámite entrega su propio enlace oficial
    Cuando consulto "<consulta>"
    Entonces la respuesta es exitosa con el trámite "<tramite>"
    Y el enlace_oficial de la respuesta coincide con el de la ficha "<id_tramite>"

    Ejemplos:
      | consulta                                                    | tramite                                                | id_tramite                       |
      | Quiero sacar mi primera licencia clase B                    | Primera licencia clase B                               | licencia-b-primera               |
      | Quiero renovar mi licencia clase B                          | Control o renovaciones de licencias clases B, C, D y F | control-o-renovaciones-licencias |
      | Quiero sacar mi primera licencia clase C                    | Solicitud de licencia clase C                          | licencia-c-primera               |
      | Quiero sacar mi primera licencia clase D                    | Solicitud de licencia clase D                          | licencia-d-primera               |
      | Compré un auto nuevo, ¿cómo saco el permiso de circulación? | Obtención de permiso de circulación                    | permiso-circulacion-primera      |
      | ¿Cómo renuevo mi permiso de circulación?                    | Renovación de permiso de circulación                   | permiso-circulacion-renovacion   |
