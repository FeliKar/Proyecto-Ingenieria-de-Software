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

Then(
  "la ficha incluye el enlace oficial de tramites.penalolen.cl",
  function () {
    assert.ok(
      typeof response.body.ficha.enlace_oficial === "string" &&
        response.body.ficha.enlace_oficial.startsWith(
          "https://tramites.penalolen.cl/"
        )
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

Then(
  "el mensaje pregunta si es primera licencia o renovación",
  function () {
    const mensaje: string = response.body.mensaje.toLowerCase();
    assert.ok(mensaje.includes("primera") && mensaje.includes("renovar"));
    assert.strictEqual(response.body.motivo, "ambiguo");
  }
);

Then(
  "el mensaje pregunta si es primera vez o renovación",
  function () {
    const mensaje: string = response.body.mensaje.toLowerCase();
    assert.ok(mensaje.includes("primera vez") && mensaje.includes("renovar"));
    assert.strictEqual(response.body.motivo, "ambiguo");
  }
);

Then("la respuesta incluye opciones para desambiguar", function () {
  const opciones = response.body.opciones as { id: string; tramite: string }[];
  assert.ok(Array.isArray(opciones) && opciones.length === 2);
});

Then(
  "elijo la opción {string} por su identificador",
  async function (termino: string) {
    const opciones = response.body.opciones as { id: string; tramite: string }[];
    const elegida = opciones.find((o) =>
      o.tramite.toLowerCase().includes(termino.toLowerCase())
    );
    assert.ok(elegida, `No se encontró opción con '${termino}'`);
    response = await request(app)
      .post("/api/tramites/consultar")
      .send({ tramiteId: elegida.id });
  }
);

Then("el servidor responde con un error de solicitud inválida", function () {
  assert.strictEqual(response.status, 400);
  assert.ok(typeof response.body.error === "string");
});
