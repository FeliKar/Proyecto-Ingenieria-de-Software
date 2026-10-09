import { When, Then } from "@cucumber/cucumber";
import assert from "node:assert";
import request from "supertest";
import app from "../../src/app";
import { contexto, respuesta } from "../support/contexto";

When("consulto {string}", async function (pregunta: string) {
  contexto.response = await request(app)
    .post("/api/tramites/consultar")
    .send({ pregunta });
});

Then(
  "la respuesta es exitosa con el trámite {string}",
  function (tramite: string) {
    assert.strictEqual(respuesta().status, 200);
    assert.strictEqual(respuesta().body.encontrado, true);
    assert.strictEqual(respuesta().body.ficha.tramite, tramite);
  }
);

Then(
  "el trámite incluye requisitos, pasos, vigencia y enlace oficial",
  function () {
    const { ficha } = respuesta().body;
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
      typeof respuesta().body.ficha.enlace_oficial === "string" &&
        respuesta().body.ficha.enlace_oficial.startsWith(
          "https://tramites.penalolen.cl/"
        )
    );
  }
);

Then("el asistente se abstiene de responder", function () {
  assert.strictEqual(respuesta().status, 200);
  assert.strictEqual(respuesta().body.encontrado, false);
  assert.strictEqual(respuesta().body.abstencion, true);
  assert.ok(typeof respuesta().body.mensaje === "string");
});

Then("entrega un canal de derivación", function () {
  assert.ok(respuesta().body.canal_derivacion);
  assert.ok(
    typeof respuesta().body.canal_derivacion.nombre === "string" &&
      respuesta().body.canal_derivacion.nombre.length > 0
  );
  assert.ok(
    typeof respuesta().body.canal_derivacion.url === "string" &&
      respuesta().body.canal_derivacion.url.startsWith("http")
  );
});

Then(
  "el mensaje pregunta si es primera licencia o renovación",
  function () {
    const mensaje: string = respuesta().body.mensaje.toLowerCase();
    assert.ok(mensaje.includes("primera") && mensaje.includes("renovar"));
    assert.strictEqual(respuesta().body.motivo, "ambiguo");
  }
);

Then(
  "el mensaje pregunta si es primera vez o renovación",
  function () {
    const mensaje: string = respuesta().body.mensaje.toLowerCase();
    assert.ok(mensaje.includes("primera vez") && mensaje.includes("renovar"));
    assert.strictEqual(respuesta().body.motivo, "ambiguo");
  }
);

Then("la respuesta incluye opciones para desambiguar", function () {
  const opciones = respuesta().body.opciones as {
    id: string;
    tramite: string;
  }[];
  assert.ok(Array.isArray(opciones) && opciones.length === 2);
});

Then(
  "elijo la opción {string} por su identificador",
  async function (termino: string) {
    const opciones = respuesta().body.opciones as {
      id: string;
      tramite: string;
    }[];
    const elegida = opciones.find((o) =>
      o.tramite.toLowerCase().includes(termino.toLowerCase())
    );
    assert.ok(elegida, `No se encontró opción con '${termino}'`);
    contexto.response = await request(app)
      .post("/api/tramites/consultar")
      .send({ tramiteId: elegida.id });
  }
);

Then("el servidor responde con un error de solicitud inválida", function () {
  assert.strictEqual(respuesta().status, 400);
  assert.ok(typeof respuesta().body.error === "string");
});
