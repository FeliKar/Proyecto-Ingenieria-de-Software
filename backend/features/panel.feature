# language: es
Característica: US-05 Panel de funcionarios para actualizar el catálogo
  Como funcionario quiero crear, editar y eliminar trámites desde el panel
  para mantener actualizada la información que recibe el vecino.
  Las mismas reglas de la consulta se aplican al guardar: toda ficha necesita
  un enlace oficial https y el catálogo nunca lleva requisitos inventados.

  Escenario: Camino feliz - crear una ficha completa
    Dado que inicié sesión como funcionario
    Cuando creo el trámite "Taller de cerámica" de tipo "completa" con requisitos, pasos, vigencia y enlace oficial
    Entonces el panel responde 201
    Cuando consulto "taller de cerámica"
    Entonces la respuesta es exitosa con el trámite "Taller de cerámica"
    Y el trámite de la respuesta incluye los requisitos creados

  Escenario: Se rechaza una ficha sin enlace oficial https
    Dado que inicié sesión como funcionario
    Cuando creo el trámite "Trámite sin enlace" de tipo "completa" con enlace "http://ejemplo.cl/permiso"
    Entonces el panel responde 400 con "enlace oficial"

  Escenario: Una ficha incompleta no se guarda
    Dado que inicié sesión como funcionario
    Cuando creo el trámite "Trámite a medio escribir" de tipo "completa" con enlace "https://tramites.penalolen.cl/Tramites/ver/tramite-a-medio-escribir" sin requisitos ni pasos ni vigencia
    Entonces el panel responde 400 con "requisitos vacíos"

  Escenario: El catálogo no admite requisitos inventados
    Dado que inicié sesión como funcionario
    Cuando creo el trámite "Trámite de catálogo" de tipo "catalogo" con enlace "https://tramites.penalolen.cl/Tramites/ver/tramite-de-catalogo" y requisitos
    Entonces el panel responde 400 con "catálogo"

  Escenario: El cambio del funcionario se refleja en la consulta del vecino
    Dado que inicié sesión como funcionario
    Cuando edito la vigencia de la ficha "licencia-b-primera" a "12 años desde su emisión."
    Entonces el panel responde 200
    Cuando consulto "primera licencia clase B"
    Entonces la respuesta es exitosa con el trámite "Primera licencia clase B"
    Y la vigencia de la respuesta es "12 años desde su emisión."

  Escenario: Eliminar una ficha la saca de las consultas
    Dado que inicié sesión como funcionario
    Cuando elimino la ficha "licencia-c-primera"
    Entonces el panel responde 200
    Cuando consulto por el identificador "licencia-c-primera"
    Entonces el servidor responde que no existe la ficha

  Escenario: Sin sesión no se puede editar
    Cuando creo el trámite "Intento sin sesión" de tipo "completa" con requisitos, pasos, vigencia y enlace oficial sin token
    Entonces la respuesta del panel es 401 y pide iniciar sesión
