import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fichas from "../../src/data/fichas.json";
import type { FichaTramite } from "../../src/types/ficha";
import {
  matchTramite,
  matchTramiteDetalle,
  normalize,
} from "../../src/services/tramiteMatcher";

const FICHAS = fichas as FichaTramite[];

function ficha(id: string, alias: string[], clase?: string): FichaTramite {
  return {
    id,
    tramite: id,
    alias,
    requisitos: ["r"],
    pasos: ["p"],
    vigencia: "v",
    enlace_oficial: "https://x.cl",
    clase,
  };
}

describe("normalize", () => {
  it("pasa a minúsculas, quita tildes, signos y espacios de más", () => {
    assert.equal(normalize("  ¿Permiso   de Circulación?  "), "permiso de circulacion");
  });

  it("quita todos los signos de puntuación", () => {
    assert.equal(normalize(`Hola, "vecino" (Peñalolén); sí: ok.`), "hola vecino penalolen si ok");
  });

  it("devuelve vacío para un texto vacío", () => {
    assert.equal(normalize(""), "");
  });

  it("devuelve vacío para un texto que es solo signos", () => {
    assert.equal(normalize("¿¡?!"), "");
  });

  it("devuelve vacío para un texto que es solo espacios", () => {
    assert.equal(normalize("   "), "");
  });
});

describe("matchTramiteDetalle con fichas.json real", () => {
  const casosOk: Array<[string, string]> = [
    ["quiero sacar mi primera licencia clase B", "licencia-b-primera"],
    ["renovar licencia clase B", "control-o-renovaciones-licencias"],
    ["renuevo licencia b", "control-o-renovaciones-licencias"],
    ["renovar permiso de circulación", "permiso-circulacion-renovacion"],
    ["renovar lisencia clase b", "control-o-renovaciones-licencias"],
    // Typo en el verbo: la corrección fonética (b/v) lo resuelve.
    ["renobar lisencia clase b", "control-o-renovaciones-licencias"],
  ];
  for (const [pregunta, id] of casosOk) {
    it(`encuentra "${pregunta}"`, () => {
      const r = matchTramiteDetalle(pregunta, FICHAS);
      assert.equal(r.motivo, "ok");
      assert.equal(r.ficha?.id, id);
    });
  }

  it("pregunta primera vez o renovación si falta la intención (licencia B)", () => {
    const r = matchTramiteDetalle("sacar licencia clase B", FICHAS);
    assert.equal(r.motivo, "ambiguo");
    assert.equal(r.clase, "b");
    assert.deepEqual(r.opciones?.map((o) => o.id), [
      "licencia-b-primera",
      "control-o-renovaciones-licencias",
    ]);
  });

  it("pregunta primera vez o renovación si falta la intención (permiso)", () => {
    const r = matchTramiteDetalle("permiso de circulación", FICHAS);
    assert.equal(r.motivo, "ambiguo");
    assert.equal(r.ficha, null);
  });

  const casosSinMatch: Array<[string, string]> = [
    ["tema ajeno", "horario de la piscina municipal"],
    ["solo stop words", "que el la"],
    ["texto vacío", ""],
  ];
  for (const [nombre, pregunta] of casosSinMatch) {
    it(`se abstiene: ${nombre}`, () => {
      const r = matchTramiteDetalle(pregunta, FICHAS);
      assert.equal(r.motivo, "sin-match");
      assert.equal(r.ficha, null);
    });
  }
});

describe("matchTramiteDetalle con fichas de prueba", () => {
  it("ofrece opciones cuando dos fichas empatan en puntaje", () => {
    const empatadas = [
      ficha("a", ["certificado residencia vecino"]),
      ficha("b", ["certificado residencia vecino"]),
    ];
    const r = matchTramiteDetalle("certificado residencia vecino comuna", empatadas);
    assert.equal(r.motivo, "empate");
    assert.equal(r.ficha, null);
    assert.deepEqual(r.opciones?.map((o) => o.id), ["a", "b"]);
  });

  it("se abstiene si se pide una clase que ninguna ficha tiene", () => {
    const soloB = [ficha("licencia-b-primera", ["licencia conducir primera"], "B")];
    const r = matchTramiteDetalle("licencia clase z primera vez", soloB);
    assert.equal(r.motivo, "sin-match");
  });
});

describe("matchTramite", () => {
  it("devuelve la ficha cuando hay coincidencia", () => {
    assert.equal(
      matchTramite("quiero sacar mi primera licencia clase B", FICHAS)?.id,
      "licencia-b-primera"
    );
  });

  it("devuelve null para una consulta vacía", () => {
    assert.equal(matchTramite("", FICHAS), null);
  });

  it("devuelve null cuando no hay coincidencia", () => {
    assert.equal(matchTramite("horario de la piscina municipal", FICHAS), null);
  });

  it("devuelve null cuando la consulta es ambigua", () => {
    assert.equal(matchTramite("sacar licencia clase B", FICHAS), null);
  });
});
