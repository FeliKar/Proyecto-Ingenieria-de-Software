# language: es
Característica: US-01 Consultas de una sola palabra
  Como vecino quiero escribir solo una palabra ("licencia", "guitarra") y que
  el asistente encuentre el trámite o me ofrezca opciones, sin tener que
  armar una frase completa. Si la palabra no es del catálogo, sigue
  absteniéndose (US-09).

  Escenario: Una sola palabra que nombra un único trámite responde la ficha
    Cuando consulto "guitarra"
    Entonces la respuesta es exitosa con el trámite "Inscripción a Taller de Guitarra"

  Escenario: Una sola palabra con varios trámites ofrece opciones en vez de adivinar
    Cuando consulto "licencia"
    Entonces el asistente ofrece opciones para elegir con motivo "empate"
    Y las opciones incluyen el trámite "Primera licencia clase B"

  Escenario: Entre varias opciones también se ven las becas
    Cuando consulto "beca"
    Entonces el asistente ofrece opciones para elegir con motivo "empate"
    Y las opciones incluyen el trámite "Beca Municipal para Apoyo Escolar"

  Escenario: Una sola palabra ajena al catálogo sigue absteniéndose
    Cuando consulto "conpostera"
    Entonces el asistente no encuentra el trámite
    Y entrega un canal de derivación

  Escenario: La autocorrección no cambia el tema de la consulta
    Cuando consulto "basura"
    Entonces el asistente no encuentra el trámite
    Y entrega un canal de derivación

  Escenario: Una sola muletilla sin tema no inventa nada
    Cuando consulto "quiero"
    Entonces el asistente no encuentra el trámite
