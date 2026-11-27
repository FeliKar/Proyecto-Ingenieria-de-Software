import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";
import { hashPassword, verificarPassword } from "../../src/auth/password";
import { firmarSesion, verificarSesion } from "../../src/auth/jwt";
import {
  limpiarIntentos,
  puedeIntentar,
  registrarFallo,
  reiniciarIntentos,
} from "../../src/auth/intentos";
import { panel } from "../../src/config";

describe("contraseñas (scrypt)", () => {
  it("verifica la contraseña correcta y rechaza la incorrecta", () => {
    const hash = hashPassword("Panel-Demo-2026");
    assert.equal(verificarPassword("Panel-Demo-2026", hash), true);
    assert.equal(verificarPassword("cualquiera", hash), false);
  });

  it("genera un hash distinto cada vez (sal propia)", () => {
    assert.notEqual(hashPassword("otra"), hashPassword("otra"));
  });

  it("rechaza un hash con formato inválido sin lanzar", () => {
    assert.equal(verificarPassword("x", "sin-formato"), false);
    assert.equal(verificarPassword("x", "scrypt$abc$!!$??"), false);
    assert.equal(verificarPassword("x", ""), false);
  });
});

describe("sesión JWT", () => {
  it("firma y verifica una sesión válida", async () => {
    const token = await firmarSesion({
      sub: "funcionario-demo",
      nombre: "Funcionario Demo",
      email: "funcionario.demo@munichat.cl",
      rol: "funcionario",
    });
    const sesion = await verificarSesion(token);
    assert.equal(sesion?.sub, "funcionario-demo");
    assert.equal(sesion?.nombre, "Funcionario Demo");
    assert.equal(sesion?.rol, "funcionario");
  });

  it("rechaza un token falsificado", async () => {
    assert.equal(await verificarSesion("esto-no-es-un-token"), null);
    const token = await firmarSesion({
      sub: "x",
      nombre: "x",
      email: "x@y.cl",
      rol: "funcionario",
    });
    assert.equal(await verificarSesion(`${token}x`), null);
  });

  it("rechaza un token vencido", async () => {
    const secreto = new TextEncoder().encode(panel.secreto);
    const vencido = await new SignJWT({ rol: "funcionario" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("funcionario-demo")
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(secreto);
    assert.equal(await verificarSesion(vencido), null);
  });

  it("rechaza un token firmado con otro secreto", async () => {
    const ajeno = new TextEncoder().encode("otro-secreto-completamente-distinto");
    const token = await new SignJWT({ rol: "funcionario" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("funcionario-demo")
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(ajeno);
    assert.equal(await verificarSesion(token), null);
  });
});

describe("límite de intentos de login", () => {
  it("bloquea al superar el máximo de la ventana", () => {
    reiniciarIntentos();
    const clave = "funcionario.demo@munichat.cl::127.0.0.1";
    for (let i = 0; i < panel.intentosMaximos - 1; i++) registrarFallo(clave);
    assert.equal(puedeIntentar(clave), true);

    registrarFallo(clave);
    assert.equal(puedeIntentar(clave), false);

    limpiarIntentos(clave);
    assert.equal(puedeIntentar(clave), true);
    reiniciarIntentos();
  });
});
