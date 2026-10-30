# language: es
Característica: Trámites municipales sin ficha ni enlace oficial (#61)
  Como vecino quiero que, si pregunto por un trámite municipal real que el
  asistente no tiene, me lo diga y me derive al canal oficial, en vez de
  inventar requisitos o mandarme a otro trámite.

  Esquema del escenario: Un trámite municipal sin enlace se deriva sin inventar
    Cuando consulto "<consulta>"
    Entonces el asistente no encuentra el trámite
    Y entrega un canal de derivación
    Y la respuesta no incluye enlace_oficial

    Ejemplos:
      | consulta                                               |
      | ¿Cómo obtengo una compostera?                          |
      | Quiero postular a una vermicompostera                  |
      | ¿Cómo obtengo el dispositivo SOS Mujer?                |
      | Necesito solicitar un lutocar                          |
      | ¿Cómo pido un bus municipal?                           |
      | ¿Cuáles son los requisitos del sello verde?            |
      | ¿Cómo inscribo mi carro de arrastre?                   |
      | Quiero autorización para cerrar mi pasaje              |
      | ¿Dónde consigo sacos de reciclaje?                     |
      | Necesito ayuda con mercadería                          |
      | ¿Cómo pido un ministro de fe para mi junta de vecinos? |
      | Personalidad jurídica para mi club deportivo           |
