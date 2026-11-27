import type { FichaTramite } from "./tramite";

/** Funcionario que inició sesión en el panel (US-05). */
export interface UsuarioPanel {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
}

/** Roles del panel (ADR-05): admin gestiona, funcionario solo edita. */
export type Rol = "admin" | "funcionario";

/** Ficha tal como la lista el panel: incluye el tipo y los alias. */
export interface FichaPanel extends FichaTramite {
  tipo: "completa" | "catalogo";
  alias?: string[];
}

/** Entrada que se envía al crear o editar un trámite. */
export interface EntradaPanel {
  id?: string;
  tramite: string;
  tipo: "completa" | "catalogo";
  requisitos?: string[];
  pasos?: string[];
  vigencia?: string;
  alias?: string[];
  enlace_oficial: string;
  clase?: string;
}
