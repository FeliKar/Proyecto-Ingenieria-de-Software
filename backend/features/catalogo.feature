# language: es
Característica: Catálogo de trámites con solo nombre y enlace oficial
  Como vecino quiero encontrar cualquier trámite del catálogo municipal para
  llegar al enlace oficial, aunque el trámite no tenga ficha detallada.

  Escenario: Inscripción a un taller de guitarra
    Cuando consulto "Quiero inscribirme a un taller de guitarra"
    Entonces la respuesta es exitosa con el trámite "Inscripción a Taller de Guitarra"
    Y la respuesta es un trámite de solo enlace con el enlace oficial

  Escenario: Pagar una multa de tránsito
    Cuando consulto "Necesito pagar una multa de tránsito"
    Entonces la respuesta es exitosa con el trámite "Pago Multas de Tránsito"
    Y la respuesta es un trámite de solo enlace con el enlace oficial

  Escenario: Adoptar un árbol del programa Crece Verde
    Cuando consulto "Quiero adoptar un árbol"
    Entonces la respuesta es exitosa con el trámite "Adopción de un árbol a través del Programa Crece Verde"
    Y la respuesta es un trámite de solo enlace con el enlace oficial

  Escenario: Registro Social de Hogares
    Cuando consulto "¿Cómo me inscribo en el Registro Social de Hogares?"
    Entonces la respuesta es exitosa con el trámite "Registro Social de Hogares (RSH)"
    Y la respuesta es un trámite de solo enlace con el enlace oficial

  Escenario: Préstamo de computadores usando solo parte del nombre oficial
    Cuando consulto "préstamo de computadores"
    Entonces la respuesta es exitosa con el trámite "Solicitud de préstamo de computadores con conexión a internet y acceso a zona wifi"
    Y la respuesta es un trámite de solo enlace con el enlace oficial

  Escenario: Dos becas municipales empatadas ofrecen opciones
    Cuando consulto "beca municipal"
    Entonces el asistente se abstiene de responder
    Y la respuesta ofrece 2 opciones de trámite
    Y entrega un canal de derivación

  Escenario: Los duplicados del catálogo no desplazan las fichas del Sprint 1
    Cuando consulto "Quiero renovar mi licencia clase B"
    Entonces la respuesta es exitosa con el trámite "Control o renovaciones de licencias clases B, C, D y F"
    Y el trámite incluye requisitos, pasos, vigencia y enlace oficial
