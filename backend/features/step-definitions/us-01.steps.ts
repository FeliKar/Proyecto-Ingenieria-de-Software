import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert";
import request from "supertest";
import app from "../../src/app";

let response: request.Response;

When("consulto {string}", async function (pregunta: string) {
  response = await request(app)
    .post("/api/tramites/consultar")
    .send({ pregunta });
});

Then(
  "la respuesta es exitosa con el trámite {string}",
  function (tramite: string) {
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.encontrado, true);
    assert.strictEqual(response.body.ficha.tramite, tramite);
  }
);

Then(
  "el trámite incluye requisitos, pasos, vigencia y enlace oficial",
  function () {
    const { ficha } = response.body;
    assert.ok(Array.isArray(ficha.requisitos) && ficha.requisitos.length > 0);
    assert.ok(Array.isArray(ficha.pasos) && ficha.pasos.length > 0);
    assert.ok(typeof ficha.vigencia === "string" && ficha.vigencia.length > 0);
    assert.ok(
      typeof ficha.enlace_oficial === "string" &&
        ficha.enlace_oficial.startsWith("http")
    );
  }
);

Then("el asistente se abstiene de responder", function () {
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.encontrado, false);
  assert.strictEqual(response.body.abstencion, true);
  assert.ok(typeof response.body.mensaje === "string");
});

Then("entrega un canal de derivación", function () {
  assert.ok(response.body.canal_derivacion);
  assert.ok(
    typeof response.body.canal_derivacion.nombre === "string" &&
      response.body.canal_derivacion.nombre.length > 0
  );
  assert.ok(
    typeof response.body.canal_derivacion.url === "string" &&
      response.body.canal_derivacion.url.startsWith("http")
  );
});

Then("el servidor responde con un error de solicitud inválida", function () {
  assert.strictEqual(response.status, 400);
  assert.ok(typeof response.body.error === "string");
});
