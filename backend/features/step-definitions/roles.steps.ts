import { Given, Then, When } from "@cucumber/cucumber";
import assert from "node:assert";
import request from "supertest";
import app from "../../src/app";
import { contexto, respuesta, token } from "../support/contexto";

/**
 * Pasos de los roles del panel (ADR-05).
 *
 * Dos cuentas de prueba: `funcionario.demo` (admin) y `editor.demo`
 * (funcionario). El hook de entorno.ts restaura usuarios.json después de
 * cada escenario.
 */

const EMAIL_EDITOR = "editor.demo@munichat.cl";
const CLAVE_EDITOR = "Panel-Editor-2026";

async function iniciarSesion(email: string, password: string): Promise<void> {
  contexto.response = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
}

Given("que inicié sesión como editor", async function () {
  await iniciarSesion(EMAIL_EDITOR, CLAVE_EDITOR);
  assert.strictEqual(respuesta().status, 200, "El editor debe poder entrar");
  contexto.token = respuesta().body.token;
});

When("pido la lista de funcionarios", async function () {
  contexto.response = await request(app)
    .get("/api/panel/usuarios")
    .set("Authorization", `Bearer ${token()}`);
});

When(
  "cambio el rol del funcionario {string} a {string}",
  async function (id: string, rol: string) {
    contexto.response = await request(app)
      .put(`/api/panel/usuarios/${id}/rol`)
      .set("Authorization", `Bearer ${token()}`)
      .send({ rol });
  }
);

When("cambio mi propio rol a {string}", async function (rol: string) {
  const yo = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${token()}`);
  contexto.response = await request(app)
    .put(`/api/panel/usuarios/${yo.body.usuario.id}/rol`)
    .set("Authorization", `Bearer ${token()}`)
    .send({ rol });
});

Then("la respuesta de usuarios es {int}", function (estado: number) {
  assert.strictEqual(respuesta().status, estado);
});

Then(
  "la respuesta de usuarios es {int} con {string}",
  function (estado: number, texto: string) {
    assert.strictEqual(respuesta().status, estado);
    assert.ok(
      String(respuesta().body.error ?? "").includes(texto),
      `Se esperaba un error que contuviera '${texto}', llegó: '${respuesta().body.error}'`
    );
  }
);

Then(
  "el funcionario {string} tiene rol {string}",
  async function (id: string, rol: string) {
    const lista = await request(app)
      .get("/api/panel/usuarios")
      .set("Authorization", `Bearer ${token()}`);
    assert.strictEqual(lista.status, 200);
    // Se puede referenciar por id o por correo.
    const usuario = (
      lista.body.usuarios as { id: string; email: string; rol: string }[]
    ).find((u) => u.id === id || u.email === id);
    assert.ok(usuario, `No está el funcionario '${id}' en la lista`);
    assert.strictEqual(usuario.rol, rol);
  }
);

Then("la respuesta del panel es 403 con permiso", function () {
  assert.strictEqual(respuesta().status, 403);
  assert.ok(
    String(respuesta().body.error ?? "").includes("permiso"),
    `Se esperaba un error de permisos, llegó: '${respuesta().body.error}'`
  );
});
