# language: es
Característica: US-16 Iniciar sesión solo los funcionarios
  Como funcionario de la Municipalidad quiero entrar al panel con mi usuario y
  contraseña para mantener actualizado el catálogo de trámites.
  El vecino no inicia sesión: el asistente sigue siendo anónimo.

  Escenario: Camino feliz - el funcionario inicia sesión
    Cuando inicio sesión con "funcionario.demo@munichat.cl" y "Panel-Demo-2026"
    Entonces el login responde 200 con un token de sesión
    Y el nombre del usuario devuelto es "Funcionario Demo"

  Escenario: Contraseña incorrecta
    Cuando inicio sesión con "funcionario.demo@munichat.cl" y "clave-equivocada"
    Entonces el login responde 401 con "Usuario o contraseña incorrectos"

  Escenario: Usuario que no existe
    Cuando inicio sesión con "nadie@munichat.cl" y "cualquiera"
    Entonces el login responde 401 con "Usuario o contraseña incorrectos"

  Escenario: Faltan el correo o la contraseña
    Cuando inicio sesión con "" y ""
    Entonces el login responde 400 con "Ingresa tu correo y tu contraseña"

  Escenario: Sin token no se entra al panel
    Cuando pido la lista del panel sin token
    Entonces la respuesta del panel es 401 y pide iniciar sesión

  Escenario: Un token falsificado no abre el panel
    Cuando pido la lista del panel con token "esto-no-es-un-token"
    Entonces la respuesta del panel es 401 y pide iniciar sesión

  Escenario: El vecino consulta un trámite sin iniciar sesión
    Cuando consulto "Quiero sacar mi primera licencia clase B"
    Entonces la respuesta es exitosa con el trámite "Primera licencia clase B"
