# ADR-05 · Roles del panel: `admin` y `funcionario`

- **Estado:** Aceptada · Sprint 3
- **Historias:** US-05 (panel de actualización), ticket #65 (autorización)
- **Relacionadas:** ADR-04 (solo los funcionarios inician sesión)

## Contexto

ADR-04 definió que el vecino consulta sin cuenta y que solo el funcionario
entra al panel con usuario y contraseña. Pero "funcionario" no distingue entre
quien corrige una vigencia y quien puede borrar un trámite o cambiar los
permisos de todo el equipo. Después de abrir el panel, hay que decidir quién
puede hacer qué y dónde se guarda esa decisión.

Además, el JWT se firma al entrar y vive 8 horas: si el rol se leyera del token
en cada petición, un cambio de permisos no tendría efecto práctico hasta que
cada sesión venciera.

## Opciones

1. **Un solo rol para todos los funcionarios (rechazada).** Simple, pero
   cualquiera con la contraseña del panel podría borrar trámites o subirse a
   administrador. No cumple el RNF de autorización del ticket #65.
2. **Tres niveles: lector, editor y administrador (rechazada).** Más fino, pero
   el proyecto no tiene lectores: todos los funcionarios del panel editan
   fichas. Añadiría un tercer valor que nadie usa todavía.
3. **Dos roles: `admin` y `funcionario` (elegida).** Cubre la diferencia real:
   editar vs. administrar. Es fácil de explicar en el panel y de verificar en
   el backend.

## Decisión

Opción 3. El rol vive en la **misma fuente de datos que los usuarios**: columna
`Rol` de la tabla `Usuarios` en Praxsuite, o campo `rol` de
`backend/src/data/usuarios.json` cuando no hay credenciales.

Reglas:

| Acción | `funcionario` | `admin` |
|---|---|---|
| Crear y editar trámites | Sí | Sí |
| Eliminar trámites | No (403) | Sí |
| Listar funcionarios y cambiar roles | No (403) | Sí |

Detalles:

- `requiereRol(...roles)` envuelve a `requiereSesion`: sin token responde 401;
  con token pero sin rol, 403. Las rutas son `GET /api/panel/usuarios` y
  `PUT /api/panel/usuarios/:id/rol`; el borrado de trámites también pasa por
  `requiereRol("admin")`.
- El cambio de rol se escribe en la fuente activa: PraxQL
  `UPDATE Usuarios SET Rol = … WHERE ID = …`, o sobrescribiendo el JSON local
  conservando el hash de la contraseña.
- **Nadie puede cambiar su propio rol.** El backend lo rechaza con 400: si el
  único administrador se degradara, el equipo se quedaría sin nadie que pudiera
  administrar usuarios.
- El rol viaja en el JWT firmado, así que **el cambio aplica en el próximo
  inicio de sesión** (o cuando venza el token actual, a las 8 horas). Es una
  decisión conciente: evita una consulta a la DB en cada petición del panel y
  mantiene el middleware simple.
- El frontend usa `services/permisos.ts` solo para no mostrar botones que el
  servidor rechazaría. La fuente de verdad es el token, no la interfaz: si un
  funcionario llama a la API directamente, el backend igual responde 403.
- Los roles válidos son exactamente `admin` y `funcionario`; cualquier otro
  valor se rechaza con 400.

## Consecuencias

- Un administrador asigna roles desde el panel sin tocar archivos ni la DB a
  mano; el cambio es inmediato en la fuente y efectivo en el siguiente login.
- El vecino no nota nada: `POST /api/tramites/consultar` sigue sin sesión y sus
  respuestas no incluyen datos de funcionarios ni hashes.
- Aparece un mensaje de error claro (403) en vez de una pantalla en blanco cuando
  alguien intenta una acción que su rol no permite.
- Los tests siguen herméticos: `roles.feature` usa las dos cuentas demo de
  `usuarios.json` y el hook restaura el archivo entre escenarios.
- Queda para después: revocar sesiones activas al cambiar un rol (una deny-list
  de JWT o reducir el TTL).
