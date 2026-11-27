# ADR-04 · Autenticación: solo los funcionarios inician sesión

- **Estado:** Aceptada · Sprint 3
- **Historias:** US-05 (panel de actualización), ticket #65 (RNF de autenticación y autorización)

## Contexto

El ticket #65 pidió revisar qué requerimientos no funcionales aplican a MuniChat
y el ADR-02 dejó autenticación y autorización para el Sprint 3. Al llegar el
panel de actualización (US-05), queda la pregunta concreta: ¿quién debe entrar
con usuario y contraseña?

El asistente es público: cualquier vecino consulta un trámite sin registrarse,
y así está diseñado desde el ADR-01 (sin datos personales, sin cuentas). Pero
el panel sí modifica la información que ven todos, y eso no puede quedar abierto
en internet.

## Opciones

1. **Todos con sesión (vecino y funcionario).** Rechaza el uso anónimo del
   asistente y obliga a crear cuentas para algo que solo informa. Añade fricción
   al vecino sin que aporte seguridad a la consulta.
2. **Nadie con sesión (panel público).** Cualquiera podría inventar o borrar
   requisitos: viola US-09 y la confianza en la información oficial.
3. **Solo el funcionario inicia sesión (elegida).** El vecino sigue anónimo y
   el panel queda protegido. Es el mínimo que exige tener un editor en línea.

## Decisión

Opción 3. El backend expone `/api/auth/login` (usuario y contraseña → JWT) y
`/api/panel/*` detrás del middleware `requiereSesion`. El chat
`POST /api/tramites/consultar` no cambia: se sigue consultando sin token.

Detalles:

- **Contraseñas** con `scrypt` de `node:crypto` (sin dependencias nativas),
  sal propia por usuario y comparación en tiempo constante.
- **JWT (HS256)** con `jose`, claims `sub`, `nombre`, `email`, `rol`, vigencia
  de 8 horas. Sin `JWT_SECRET` el servidor genera uno temporal y avisa: las
  sesiones se cierran al reiniciar.
- **Usuarios** en la tabla `Usuarios` de Praxsuite; sin credenciales, en
  `backend/src/data/usuarios.json` (mismo patrón de respaldo que las fichas).
- **Límite de intentos**: 5 fallos por correo e IP cada 15 minutos, en memoria.
- El login siempre responde *"Usuario o contraseña incorrectos"* y corre un
  `scrypt` aunque el correo no exista: no se revela quién está registrado.

## Consecuencias

- El vecino no ve ningún cambio: consulta, voz y modo accesibilidad siguen
  iguales y sin cuenta.
- El panel escribe en la fuente que está respondiendo (Praxsuite o JSON) y
  borra la caché después de cada operación, así el cambio se refleja en la
  consulta del vecino en el mismo segundo.
- Los tests siguen herméticos: Cucumber fija `PRAXSUITE_DISABLED=1`, redirige
  los JSON a un directorio temporal y limpia los intentos de login entre
  escenarios (`features/support/entorno.ts` y `step-definitions/hooks.ts`).
- Queda pendiente para después del curso: rotación de secretos, sesiones
  revocables y rate limiting general del ADR-02.
