import { Then, When } from "@cucumber/cucumber";
import assert from "node:assert";
import request from "supertest";
import app from "../../src/app";
import { contexto, respuesta, token } from "../support/contexto";

/**
 * Pasos del panel de funcionarios (US-05).
 *
 * Cada escenario parte de los JSON originales: el hook de `entorno.ts`
 * restaura fichas.json y catalogo.json después de cada uno.
 */

const ENLACE_BASE = "https://tramites.penalolen.cl/Tramites/ver/";

function cuerpoTramite(
  tramite: string,
  tipo: string,
  opciones: {
    enlace?: string;
    sinContenido?: boolean;
    conRequisitos?: boolean;
  } = {}
): Record<string, unknown> {
  const enlace = opciones.enlace ?? `${ENLACE_BASE}${tramite.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  if (tipo === "catalogo") {
    return {
      tramite,
      tipo,
      enlace_oficial: enlace,
      ...(opciones.conRequisitos
        ? { requisitos: ["Requisito inventado por el funcionario."] }
        : {}),
    };
  }

  if (opciones.sinContenido) {
    return { tramite, tipo, enlace_oficial: enlace, requisitos: [], pasos: [], vigencia: "" };
  }

  return {
    tramite,
    tipo,
    enlace_oficial: enlace,
    requisitos: ["Cédula de identidad vigente.", "Llenar el formulario de inscripción."],
    pasos: ["Completar el formulario.", "Pagar los derechos correspondientes."],
    vigencia: "1 año desde la inscripción.",
    alias: [tramite],
  };
}

async function crearTramite(
  tramite: string,
  tipo: string,
  opciones: Parameters<typeof cuerpoTramite>[2] = {},
  conToken = true
): Promise<void> {
  const peticion = request(app).post("/api/panel/tramites");
  if (conToken) peticion.set("Authorization", `Bearer ${token()}`);
  contexto.response = await peticion.send(cuerpoTramite(tramite, tipo, opciones));
}

When(
  "creo el trámite {string} de tipo {string} con requisitos, pasos, vigencia y enlace oficial",
  async function (tramite: string, tipo: string) {
    await crearTramite(tramite, tipo);
  }
);

When(
  "creo el trámite {string} de tipo {string} con requisitos, pasos, vigencia y enlace oficial sin token",
  async function (tramite: string, tipo: string) {
    await crearTramite(tramite, tipo, {}, false);
  }
);

When(
  "creo el trámite {string} de tipo {string} con enlace {string}",
  async function (tramite: string, tipo: string, enlace: string) {
    await crearTramite(tramite, tipo, { enlace });
  }
);

When(
  "creo el trámite {string} de tipo {string} con enlace {string} sin requisitos ni pasos ni vigencia",
  async function (tramite: string, tipo: string, enlace: string) {
    await crearTramite(tramite, tipo, { enlace, sinContenido: true });
  }
);

When(
  "creo el trámite {string} de tipo {string} con enlace {string} y requisitos",
  async function (tramite: string, tipo: string, enlace: string) {
    await crearTramite(tramite, tipo, { enlace, conRequisitos: true });
  }
);

When(
  "edito la vigencia de la ficha {string} a {string}",
  async function (id: string, vigencia: string) {
    const lista = await request(app)
      .get("/api/panel/tramites")
      .set("Authorization", `Bearer ${token()}`);
    assert.strictEqual(lista.status, 200, "El panel debe listar las fichas");

    const ficha = (lista.body.tramites as Record<string, unknown>[]).find(
      (f) => f.id === id
    );
    assert.ok(ficha, `El panel no lista la ficha '${id}'`);

    contexto.response = await request(app)
      .put(`/api/panel/tramites/${id}`)
      .set("Authorization", `Bearer ${token()}`)
      .send({ ...ficha, vigencia });
  }
);

When("elimino la ficha {string}", async function (id: string) {
  contexto.response = await request(app)
    .delete(`/api/panel/tramites/${id}`)
    .set("Authorization", `Bearer ${token()}`);
});

When(
  "consulto por el identificador {string}",
  async function (tramiteId: string) {
    contexto.response = await request(app)
      .post("/api/tramites/consultar")
      .send({ tramiteId });
  }
);

Then("el panel responde {int}", function (estado: number) {
  assert.strictEqual(respuesta().status, estado);
});

Then("el panel responde {int} con {string}", function (estado: number, texto: string) {
  assert.strictEqual(respuesta().status, estado);
  assert.ok(
    String(respuesta().body.error ?? "").includes(texto),
    `Se esperaba un error que contuviera '${texto}', llegó: '${respuesta().body.error}'`
  );
});

Then(
  "el trámite de la respuesta incluye los requisitos creados",
  function () {
    const requisitos = respuesta().body.ficha.requisitos as string[];
    assert.ok(Array.isArray(requisitos) && requisitos.length > 0);
    assert.ok(requisitos.some((r) => r.includes("Cédula de identidad vigente")));
  }
);

Then("la vigencia de la respuesta es {string}", function (vigencia: string) {
  assert.strictEqual(respuesta().body.ficha.vigencia, vigencia);
});

Then("el servidor responde que no existe la ficha", function () {
  assert.strictEqual(respuesta().status, 404);
  assert.ok(String(respuesta().body.error ?? "").length > 0);
});
