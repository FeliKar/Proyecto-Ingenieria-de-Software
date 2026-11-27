import "./soporte/entornoPanel"; // debe ir primero: fija las rutas temporales
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { panel } from "../../src/config";
import {
  actualizarRol,
  esRol,
  ErrorUsuarios,
  listarUsuarios,
  ROLES,
} from "../../src/services/usuariosRepository";

function leerLocal() {
  return JSON.parse(readFileSync(panel.usuariosJson, "utf8")) as {
    id: string;
    rol: string;
    hash: string;
  }[];
}

describe("roles (ADR-05)", () => {
  it("solo admite los roles definidos", () => {
    assert.deepEqual([...ROLES], ["admin", "funcionario"]);
    assert.equal(esRol("admin"), true);
    assert.equal(esRol("funcionario"), true);
    assert.equal(esRol("superusuario"), false);
    assert.equal(esRol(1), false);
    assert.equal(esRol(null), false);
  });

  it("lista los funcionarios sin exponer el hash", async () => {
    const usuarios = await listarUsuarios();
    assert.ok(usuarios.length >= 2);
    for (const u of usuarios) {
      assert.ok(!Object.prototype.hasOwnProperty.call(u, "hash"));
      assert.ok(u.email.includes("@"));
      assert.ok(u.rol.length > 0);
    }
    const editor = usuarios.find((u) => u.id === "editor-demo");
    assert.equal(editor?.rol, "funcionario");
  });

  it("cambia el rol en el archivo local y conserva la contraseña", async () => {
    const antes = leerLocal().find((u) => u.id === "editor-demo");
    assert.equal(antes?.rol, "funcionario");

    const actualizado = await actualizarRol("editor-demo", "admin");
    assert.equal(actualizado.rol, "admin");

    const despues = leerLocal().find((u) => u.id === "editor-demo");
    assert.equal(despues?.rol, "admin");
    assert.equal(despues?.hash, antes?.hash, "El hash no debe cambiar");
  });

  it("devuelve 404 al cambiar el rol de alguien que no existe", async () => {
    await assert.rejects(
      actualizarRol("no-existe", "admin"),
      (error: unknown) => {
        assert.ok(error instanceof ErrorUsuarios);
        assert.equal(error.status, 404);
        return true;
      }
    );
  });

  it("restaura el rol del editor para el resto de las pruebas", async () => {
    await actualizarRol("editor-demo", "funcionario");
    const editor = (await listarUsuarios()).find((u) => u.id === "editor-demo");
    assert.equal(editor?.rol, "funcionario");
  });
});
