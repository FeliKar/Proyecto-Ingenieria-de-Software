import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import PanelUsuarios from "../src/components/PanelUsuarios";
import type { UsuarioPanel } from "../src/types/panel";

const usuarios: UsuarioPanel[] = [
  {
    id: "funcionario-demo",
    nombre: "Funcionario Demo",
    email: "funcionario.demo@munichat.cl",
    rol: "admin",
  },
  {
    id: "editor-demo",
    nombre: "Editor Demo",
    email: "editor.demo@munichat.cl",
    rol: "funcionario",
  },
];

const base = {
  usuarios,
  idSesion: "funcionario-demo",
  actualizando: null,
  error: null,
  onCambioRol: () => {},
};

test("lista los funcionarios con su correo y rol", () => {
  const html = renderToStaticMarkup(<PanelUsuarios {...base} />);
  assert.match(html, /Funcionario Demo/);
  assert.match(html, /funcionario\.demo@munichat\.cl/);
  assert.match(html, /Editor Demo/);
  assert.match(html, /editor\.demo@munichat\.cl/);
  assert.match(html, /aria-label="Rol de Editor Demo"/);
});

test("cada fila ofrece los dos roles definidos (ADR-05)", () => {
  const html = renderToStaticMarkup(<PanelUsuarios {...base} />);
  const selects = html.match(/<select/g) ?? [];
  assert.equal(selects.length, 2);
  assert.match(html, /<option value="funcionario">/);
  assert.match(html, /<option value="admin">/);
});

test("la fila de la propia cuenta queda deshabilitada", () => {
  const html = renderToStaticMarkup(<PanelUsuarios {...base} />);
  // La fila del admin en sesión es la propia: no se puede auto-degradar.
  assert.match(
    html,
    /<select[^>]*disabled[^>]*aria-label="Rol de Funcionario Demo"/
  );
  assert.doesNotMatch(
    html,
    /<select[^>]*disabled[^>]*aria-label="Rol de Editor Demo"/
  );
});

test("marca al usuario de la sesión como 'tú'", () => {
  const html = renderToStaticMarkup(<PanelUsuarios {...base} />);
  assert.match(html, /funcionario\.demo@munichat\.cl · tú/);
});

test("mientras actualiza un rol, esa fila queda bloqueada", () => {
  const html = renderToStaticMarkup(
    <PanelUsuarios {...base} actualizando="editor-demo" />
  );
  assert.match(
    html,
    /<select[^>]*disabled[^>]*aria-label="Rol de Editor Demo"/
  );
});

test("muestra el error del backend", () => {
  const html = renderToStaticMarkup(
    <PanelUsuarios
      {...base}
      error="Tu rol no tiene permiso para esta acción."
    />
  );
  assert.match(html, /role="alert"/);
  assert.match(html, /no tiene permiso/);
});

test("sin usuarios muestra un mensaje", () => {
  const html = renderToStaticMarkup(<PanelUsuarios {...base} usuarios={[]} />);
  assert.match(html, /No hay funcionarios registrados/);
});
