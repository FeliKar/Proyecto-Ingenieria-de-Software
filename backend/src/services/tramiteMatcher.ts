import { FichaTramite } from "../types/ficha";

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:"'()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreFicha(preguntaNormalizada: string, ficha: FichaTramite): number {
  let score = 0;
  for (const alias of ficha.alias) {
    const aliasNormalizado = normalize(alias);
    if (aliasNormalizado && preguntaNormalizada.includes(aliasNormalizado)) {
      // Aliases más específicos (más palabras) pesan más
      score += 1 + aliasNormalizado.split(" ").length * 0.1;
    }
  }
  return score;
}

export function matchTramite(
  pregunta: string,
  fichas: FichaTramite[]
): FichaTramite | null {
  const preguntaNormalizada = normalize(pregunta);
  if (!preguntaNormalizada) return null;

  const puntajes = fichas
    .map((ficha) => ({ ficha, score: scoreFicha(preguntaNormalizada, ficha) }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score);

  if (puntajes.length === 0) return null;

  // Empate entre los primeros → abstención
  if (puntajes.length > 1 && puntajes[0].score === puntajes[1].score) {
    return null;
  }

  return puntajes[0].ficha;
}
