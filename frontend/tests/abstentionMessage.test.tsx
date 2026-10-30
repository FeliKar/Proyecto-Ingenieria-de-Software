import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import AbstentionMessage from "../src/components/AbstentionMessage";
import type { CanalDerivacion } from "../src/types/tramite";

const canal: CanalDerivacion = {
  nombre: "Municipalidad de Peñalolén",
  descripcion: "Módulos de atención presencial.",
  url: "https://www.penalolen.cl/",
};

const opcionesEmpate = [
  {
    id: "beca-municipal-educacion-superior",
    tramite: "Beca Municipal Educación Superior",
  },
  {
    id: "beca-municipal-para-apoyo-escolar",
    tramite: "Beca Municipal para Apoyo Escolar",
  },
];

test("Empate: las opciones se muestran como botones con su nombre", () => {
  const html = renderToStaticMarkup(
    <AbstentionMessage
      mensaje="Encontré varios trámites que podrían ser el que buscas."
      canal={canal}
      opciones={opcionesEmpate}
    />
  );
  assert.match(html, /Encontré varios trámites/);
  assert.match(html, /¿Cuál de estos trámites necesitas\?/);
  const botones = html.match(/<button[^>]*type="button"/g) ?? [];
  assert.strictEqual(botones.length, 2);
  assert.match(html, /Beca Municipal Educación Superior/);
  assert.match(html, /Beca Municipal para Apoyo Escolar/);
});

test("Sin opciones no se muestran botones de elección", () => {
  const html = renderToStaticMarkup(
    <AbstentionMessage mensaje="No cuento con información suficiente." canal={canal} />
  );
  assert.doesNotMatch(html, /<button/);
  assert.match(html, /No cuento con información suficiente/);
  assert.match(html, /Ir al canal oficial/);
});
