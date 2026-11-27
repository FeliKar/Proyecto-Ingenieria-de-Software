import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import LoginPage from "../src/components/LoginPage";

const base = {
  error: null,
  cargando: false,
  onLogin: () => {},
};

test("el login tiene correo, contraseña y botón de entrar", () => {
  const html = renderToStaticMarkup(<LoginPage {...base} />);
  assert.match(html, /type="email"/);
  assert.match(html, /type="password"/);
  assert.match(html, /Entrar al panel/);
  assert.match(html, /Panel de funcionarios/);
});

test("aclara que los vecinos no necesitan cuenta", () => {
  const html = renderToStaticMarkup(<LoginPage {...base} />);
  assert.match(html, /Los vecinos no necesitan cuenta para consultar/);
});

test("muestra el error del backend en lenguaje simple", () => {
  const html = renderToStaticMarkup(
    <LoginPage
      {...base}
      error="Usuario o contraseña incorrectos. Vuelve a intentarlo."
    />
  );
  assert.match(html, /role="alert"/);
  assert.match(html, /Usuario o contraseña incorrectos/);
});

test("sin error no hay mensaje de alerta", () => {
  const html = renderToStaticMarkup(<LoginPage {...base} />);
  assert.doesNotMatch(html, /role="alert"/);
});

test("mientras entra, el botón está deshabilitado", () => {
  const html = renderToStaticMarkup(<LoginPage {...base} cargando={true} />);
  assert.match(html, /<button[^>]*disabled/);
  assert.match(html, /Entrando/);
});

test("tiene enlace para volver al asistente", () => {
  const html = renderToStaticMarkup(<LoginPage {...base} />);
  assert.match(html, /href="\/"/);
  assert.match(html, /Volver al asistente/);
});
