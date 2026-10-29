import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import BotonModoAccesibilidad from "../src/components/BotonModoAccesibilidad";

test("muestra el nombre accesible y el texto visible del modo", () => {
  const html = renderToStaticMarkup(
    <BotonModoAccesibilidad activo={false} onToggle={() => {}} />
  );
  assert.match(html, /Modo accesibilidad/);
  assert.match(html, /aria-label="Modo accesibilidad: hablar y escuchar los trámites"/);
});

test("apagado usa aria-pressed=false", () => {
  const html = renderToStaticMarkup(
    <BotonModoAccesibilidad activo={false} onToggle={() => {}} />
  );
  assert.match(html, /aria-pressed="false"/);
  assert.doesNotMatch(html, /modo-accesibilidad--activo/);
});

test("encendido usa aria-pressed=true y resalta el botón", () => {
  const html = renderToStaticMarkup(
    <BotonModoAccesibilidad activo={true} onToggle={() => {}} />
  );
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /modo-accesibilidad--activo/);
});
