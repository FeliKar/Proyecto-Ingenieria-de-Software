export interface FichaTramite {
  id: string;
  tramite: string;
  requisitos: string[];
  pasos: string[];
  vigencia: string;
  alias: string[];
  enlace_oficial: string;
  clase?: string;
}
