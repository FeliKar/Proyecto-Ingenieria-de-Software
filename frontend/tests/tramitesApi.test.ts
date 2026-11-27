import test from "node:test";
import assert from "node:assert/strict";
import { consultarTramite } from "../src/services/tramitesApi";

/** Fija un fetch de prueba y lo restaura siempre (tests sin red). */
function conFetchFalso(
  fetchFalso: (url: string, init?: RequestInit) => Promise<Response>
): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = fetchFalso as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

const respuestaNoMatch = {
  encontrado: false,
  abstencion: true,
  mensaje: "Elige una opción",
  motivo: "empate",
  canal_derivacion: {
    nombre: "Municipalidad de Peñalolén",
    descripcion: "Canal oficial.",
    url: "https://www.penalolen.cl",
    telefono: "+56 2 2486 8000",
  },
  opciones: [{ id: "licencia-b-primera", tramite: "Primera licencia clase B" }],
};

test("una sola palabra se consulta sin sesión (vecino anónimo)", async () => {
  const restaurar = conFetchFalso(async (url, init) => {
    assert.equal(url, "/api/tramites/consultar");
    assert.equal(init?.method, "POST");
    assert.deepEqual(init?.headers, { "Content-Type": "application/json" });
    assert.deepEqual(JSON.parse(String(init?.body)), { pregunta: "licencia" });
    return new Response(JSON.stringify(respuestaNoMatch), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  try {
    const data = await consultarTramite("licencia");
    assert.equal(data.encontrado, false);
    if (!data.encontrado) {
      assert.equal(data.motivo, "empate");
      assert.equal(data.canal_derivacion.telefono, "+56 2 2486 8000");
      assert.equal(data.opciones?.length, 1);
    }
  } finally {
    restaurar();
  }
});

test("al elegir una opción se consulta por id, también sin sesión", async () => {
  const restaurar = conFetchFalso(async (_url, init) => {
    assert.deepEqual(JSON.parse(String(init?.body)), {
      tramiteId: "licencia-b-primera",
    });
    assert.ok(!JSON.stringify(init?.headers).includes("Authorization"));
    return new Response(
      JSON.stringify({
        encontrado: true,
        ficha: {
          id: "licencia-b-primera",
          tramite: "Primera licencia clase B",
          requisitos: [],
          pasos: [],
          vigencia: "",
          enlace_oficial: "https://tramites.penalolen.cl/x",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  });
  try {
    const data = await consultarTramite("", "licencia-b-primera");
    assert.equal(data.encontrado, true);
    assert.equal(data.ficha.id, "licencia-b-primera");
  } finally {
    restaurar();
  }
});

test("un error del servidor se propaga como excepción", async () => {
  const restaurar = conFetchFalso(async () => new Response("falló", { status: 500 }));
  try {
    await assert.rejects(consultarTramite("licencia"), /Error del servidor: 500/);
  } finally {
    restaurar();
  }
});
