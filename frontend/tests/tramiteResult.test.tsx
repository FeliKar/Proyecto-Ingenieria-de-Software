import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import TramiteResult from "../src/components/TramiteResult";
import type { FichaTramite } from "../src/types/tramite";

const ficha: FichaTramite = {
  id: "licencia-b-primera",
  tramite: "Primera licencia clase B",
  requisitos: ["Ser mayor de 18 años."],
  pasos: ["Inscribirse en la Dirección de Tránsito Municipal."],
  vigencia: "6 años desde su emisión.",
  enlace_oficial:
    "https://tramites.penalolen.cl/Tramites/ver/solicitud-de-primera-licencia-no-profesional-clase-b-para-mayores-de-18-anos",
};

test("US-06: muestra el enlace oficial como un ancla clicable", () => {
  const html = renderToStaticMarkup(<TramiteResult ficha={ficha} />);
  assert.match(html, /<a[^>]*href="https:\/\/tramites\.penalolen\.cl\//);
  assert.match(html, /Ver información oficial/);
});

test("US-06: abre el enlace oficial en pestaña nueva de forma segura", () => {
  const html = renderToStaticMarkup(<TramiteResult ficha={ficha} />);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test("T18: sin enlace oficial no se renderiza un enlace alternativo", () => {
  const html = renderToStaticMarkup(
    <TramiteResult ficha={{ ...ficha, enlace_oficial: "" }} />
  );
  assert.doesNotMatch(html, /<a[^>]*href=/);
  assert.doesNotMatch(html, /Ver información oficial/);
});
