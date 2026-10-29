export interface FichaTramite {
  id: string;
  tramite: string;
  requisitos: string[];
  pasos: string[];
  vigencia: string;
  alias: string[];
  enlace_oficial: string;
  clase?: string;
  // Trámite del catálogo oficial: solo nombre y enlace, sin requisitos
  // inventados (la información vive en el sitio del municipio).
  solo_enlace?: boolean;
}
