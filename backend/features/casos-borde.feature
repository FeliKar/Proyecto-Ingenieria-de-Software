# language: es
Característica: Casos de borde de US-01, US-06 y US-09 (#62)
  Como vecino quiero que el asistente me entienda aunque escriba con mayúsculas,
  sin tildes o con muletillas, y que nunca invente una respuesta cuando no tiene
  el trámite.

  Esquema del escenario: Mayúsculas y tildes mezcladas entregan la ficha
    Cuando consulto "<consulta>"
    Entonces la respuesta es exitosa con el trámite "<tramite>"

    Ejemplos:
      | consulta                                | tramite                                                |
      | LICENCIA CLASE B PRIMERA VEZ            | Primera licencia clase B                               |
      | LiCeNcIa ClAsE b PrImErA vEz            | Primera licencia clase B                               |
      | renovación de licéncia clase B          | Control o renovaciones de licencias clases B, C, D y F |
      | renovacion permiso circulacion          | Renovación de permiso de circulación                   |
      | REGISTRO SOCIAL DE HOGARES              | Registro Social de Hogares (RSH)                       |
      | esterilizacion de MASCOTAS              | Esterilización de mascotas                             |

  Esquema del escenario: Faltas de ortografía fuertes entregan la ficha
    Cuando consulto "<consulta>"
    Entonces la respuesta es exitosa con el trámite "<tramite>"

    Ejemplos:
      | consulta                                | tramite                                                |
      | lisensia b primra vez                   | Primera licencia clase B                               |
      | kiero sacar mi primera lisencia clase b | Primera licencia clase B                               |
      | renobar licensia clase b                | Control o renovaciones de licencias clases B, C, D y F |
      | renovasion de permizo de sirculacion    | Renovación de permiso de circulación                   |
      | solisitud de lisencias clase e          | Solicitud de Licencias clase E                         |
      | inscrivirme al taler de gitarra         | Inscripción a Taller de Guitarra                       |
      | registro social de ogares               | Registro Social de Hogares (RSH)                       |
      | certifikado de numero                   | Solicitud de certificado de número                     |

  Escenario: Una falta de ortografía en una consulta ambigua ofrece las mismas opciones
    Cuando consulto "permizo de circulasion"
    Entonces el asistente ofrece opciones para elegir con motivo "ambiguo"
    Y las opciones incluyen el trámite "Obtención de permiso de circulación"
    Y las opciones incluyen el trámite "Renovación de permiso de circulación"

  Esquema del escenario: Una consulta larga con muletillas entrega la ficha
    Cuando consulto "<consulta>"
    Entonces la respuesta es exitosa con el trámite "<tramite>"

    Ejemplos:
      | consulta                                                                                   | tramite                              |
      | Hola, buenas, mire, quería saber qué necesito para renovar el permiso de circulación del auto | Renovación de permiso de circulación |
      | Oye, eh, quiero sacar mi primera licencia clase B, por favor                                 | Primera licencia clase B             |

  Esquema del escenario: Una consulta ambigua ofrece opciones
    Cuando consulto "<consulta>"
    Entonces el asistente ofrece opciones para elegir con motivo "<motivo>"
    Y las opciones incluyen el trámite "<opcion>"

    Ejemplos:
      | consulta                | motivo  | opcion                              |
      | LICENCIA TIPO B         | ambiguo | Primera licencia clase B            |
      | permiso de circulación  | ambiguo | Obtención de permiso de circulación |

  Esquema del escenario: Fuera de cobertura no se inventa una respuesta
    Cuando consulto "<consulta>"
    Entonces el asistente no encuentra el trámite
    Y entrega un canal de derivación

    Ejemplos:
      | consulta                              |
      | ¿CÓMO SOLICITO UNA LICENCIA DE PERRO? |
      | quiero tramitar algo de SALUD         |
      | lisencia de perro                     |
      | conpostera                            |
      | dispositibo sos mujer                 |

  # Pendiente: hoy el asistente responde solo uno de los dos trámites. Requiere
  # soporte de varias intenciones por consulta (issue aparte, según el #62).
  @pendiente
  Escenario: Dos trámites en una consulta ofrecen ambos como opciones
    Cuando consulto "licencia B y permiso de circulación"
    Entonces las opciones incluyen el trámite "Primera licencia clase B"
    Y las opciones incluyen el trámite "Obtención de permiso de circulación"
