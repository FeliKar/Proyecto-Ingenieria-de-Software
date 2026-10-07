export interface FichaTramite {
  id: string;
  tramite: string;
  requisitos: string[];
  pasos: string[];
  vigencia: string;
  enlace_oficial: string;
}

export interface CanalDerivacion {
  nombre: string;
  descripcion: string;
  url: string;
}

export interface ConsultaSuccess {
  encontrado: true;
  ficha: FichaTramite;
}

export interface ConsultaNoMatch {
  encontrado: false;
  abstencion: true;
  mensaje: string;
  canal_derivacion: CanalDerivacion;
}

export type ConsultaResponse = ConsultaSuccess | ConsultaNoMatch;
