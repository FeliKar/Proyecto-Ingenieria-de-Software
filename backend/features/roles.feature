# language: es
Característica: US-05 Roles de funcionario en la DB (ADR-05)
  Como administrador quiero asignar roles a los funcionarios desde el panel
  para controlar quién puede borrar trámites y administrar usuarios.
  El rol admin gestiona; el funcionario solo crea y edita trámites.

  Escenario: El admin lista los funcionarios de la DB
    Dado que inicié sesión como funcionario
    Cuando pido la lista de funcionarios
    Entonces la respuesta de usuarios es 200
    Y el funcionario "editor.demo@munichat.cl" tiene rol "funcionario"

  Escenario: El admin cambia el rol de un funcionario
    Dado que inicié sesión como funcionario
    Cuando cambio el rol del funcionario "editor-demo" a "admin"
    Entonces la respuesta de usuarios es 200
    Y el funcionario "editor-demo" tiene rol "admin"

  Escenario: Un funcionario sin rol admin no ve la lista de usuarios
    Dado que inicié sesión como editor
    Cuando pido la lista de funcionarios
    Entonces la respuesta de usuarios es 403

  Escenario: Un funcionario sin rol admin no puede cambiar roles
    Dado que inicié sesión como editor
    Cuando cambio el rol del funcionario "funcionario-demo" a "admin"
    Entonces la respuesta de usuarios es 403

  Escenario: Un funcionario sin rol admin no puede eliminar trámites
    Dado que inicié sesión como editor
    Cuando elimino la ficha "licencia-b-primera"
    Entonces la respuesta del panel es 403 con permiso

  Escenario: Un funcionario sin rol admin sí puede crear y editar
    Dado que inicié sesión como editor
    Cuando edito la vigencia de la ficha "licencia-b-primera" a "9 años desde su emisión."
    Entonces el panel responde 200

  Escenario: Nadie puede cambiar su propio rol
    Dado que inicié sesión como funcionario
    Cuando cambio mi propio rol a "funcionario"
    Entonces la respuesta de usuarios es 400 con "tu propio rol"

  Escenario: El rol debe ser uno de los definidos
    Dado que inicié sesión como funcionario
    Cuando cambio el rol del funcionario "editor-demo" a "superusuario"
    Entonces la respuesta de usuarios es 400 con "admin"
