import { Given, Then, When } from "@cucumber/cucumber";
import assert from "node:assert";
import request from "supertest";
import app from "../../src/app";
import { contexto, respuesta, token } from "../support/contexto";

/**
 * Pasos de US-16 / US-05: sesión del funcionario.
 *
 * El login es solo para el panel; el vecino consulta sin token (último
 * escenario de auth.feature).
 */

export const EMAIL_DEMO = "funcionario.demo@munichat.cl";
export const CLAVE_DEMO = "Panel-Demo-2026";

async function iniciarSesion(email: string, password: string): Promise<void> {
  contexto.response = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
}

When(
  "inicio sesión con {string} y {string}",
  async function (email: string, password: string) {
    await iniciarSesion(email, password);
  }
);

Then(
  "el login responde {int} con un token de sesión",
  function (estado: number) {
    assert.strictEqual(respuesta().status, estado);
    const { token: recibido, usuario } = respuesta().body;
    assert.ok(
      typeof recibido === "string" && recibido.length > 20,
      "El login debe devolver un token"
    );
    assert.ok(usuario && typeof usuario.email === "string");
    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(usuario, "hash"),
      false,
      "La respuesta nunca debe incluir la contraseña"
    );
    contexto.token = recibido;
  }
);

Then(
  "el nombre del usuario devuelto es {string}",
  function (nombre: string) {
    assert.strictEqual(respuesta().body.usuario.nombre, nombre);
  }
);

Then("el login responde {int} con {string}", function (estado: number, texto: string) {
  assert.strictEqual(respuesta().status, estado);
  assert.ok(
    String(respuesta().body.error ?? "").includes(texto),
    `Se esperaba un mensaje que contuviera '${texto}', llegó: '${respuesta().body.error}'`
  );
});

Given("que inicié sesión como funcionario", async function () {
  await iniciarSesion(EMAIL_DEMO, CLAVE_DEMO);
  assert.strictEqual(respuesta().status, 200);
  contexto.token = respuesta().body.token;
});

When("pido la lista del panel sin token", async function () {
  contexto.response = await request(app).get("/api/panel/tramites");
});

When(
  "pido la lista del panel con token {string}",
  async function (falso: string) {
    contexto.response = await request(app)
      .get("/api/panel/tramites")
      .set("Authorization", `Bearer ${falso}`);
  }
);

When("pido la lista del panel", async function () {
  contexto.response = await request(app)
    .get("/api/panel/tramites")
    .set("Authorization", `Bearer ${token()}`);
});

Then(
  "la respuesta del panel es {int} y pide iniciar sesión",
  function (estado: number) {
    assert.strictEqual(respuesta().status, estado);
    const error = String(respuesta().body.error ?? "");
    assert.ok(
      error.includes("iniciar sesión"),
      `Se esperaba que el error pidiera iniciar sesión, llegó: '${error}'`
    );
  }
);
