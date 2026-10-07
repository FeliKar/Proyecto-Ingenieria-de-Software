import type { FichaTramite } from "../types/ficha";

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:"'()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP_WORDS = new Set([
  "que", "necesito", "necesitan", "para", "el", "la", "los", "las", "de",
  "del", "mi", "mis", "como", "es", "un", "una", "en", "y", "o", "a", "al",
  "por", "con", "se", "su", "sus", "este", "esta", "ese", "esa", "cuanto",
  "cuando", "donde", "el", "yo", "me",
]);

// Raíces para unificar variantes verbales/nominales
function stem(token: string): string {
  if (/^renuev/.test(token) || /^renov/.test(token)) return "renov";
  if (/^vencid/.test(token) || /^venc/.test(token)) return "venc";
  if (/^(sacar|saco|saca|sacas|sacarme|obtener|obtengo|obtencion|conseguir|consigo|comprar|compro|tramitar)$/.test(token))
    return "obtener";
  if (/^pago|pagas|pagar|pagarme$/.test(token)) return "pagar";
  if (/^conducir/.test(token)) return "conducir";
  return token;
}

// Formas verbales frecuentes para la autocorrección
const FORMAS_EXTRA = [
  "renuevo", "renuevas", "renueva", "renovando", "sacar", "saco", "sacas",
  "sacarme", "obtener", "obtengo", "conseguir", "tengo", "quiero",
];

function tokensDe(texto: string): string[] {
  return normalize(texto)
    .split(" ")
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));
}

// Similitud de bigramas (coeficiente de Dice): tolera typos y orden de letras
function dice(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigramas = (s: string) => {
    const set = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      set.set(bg, (set.get(bg) ?? 0) + 1);
    }
    return set;
  };
  const A = bigramas(a);
  const B = bigramas(b);
  let comunes = 0;
  for (const [bg, n] of A) {
    if (B.has(bg)) comunes += Math.min(n, B.get(bg)!);
  }
  return (2 * comunes) / (a.length - 1 + (b.length - 1));
}

function scoreAlias(preguntaStems: Set<string>, alias: string): number {
  const aliasStems = new Set(tokensDe(alias).map(stem));
  if (aliasStems.size === 0) return 0;
  let overlap = 0;
  for (const s of aliasStems) {
    if (preguntaStems.has(s)) overlap++;
  }
  return overlap / aliasStems.size;
}

export function matchTramite(
  pregunta: string,
  fichas: FichaTramite[]
): FichaTramite | null {
  const tokensPregunta = tokensDe(pregunta);
  if (tokensPregunta.length === 0) return null;

  // Vocabulario: todas las palabras de aliases y nombres + formas extra
  const vocab = new Set<string>();
  for (const f of fichas) {
    for (const t of tokensDe(f.tramite)) vocab.add(t);
    for (const alias of f.alias) {
      for (const t of tokensDe(alias)) vocab.add(t);
    }
  }
  for (const t of FORMAS_EXTRA) vocab.add(t);

  // Autocorrección difusa: cada token se mapea a la palabra más cercana del vocabulario
  const preguntaStems = new Set<string>();
  for (const token of tokensPregunta) {
    let mejor: string | null = null;
    let mejorScore = 0;
    for (const v of vocab) {
      const s = dice(token, v);
      if (s > mejorScore) {
        mejorScore = s;
        mejor = v;
      }
    }
    if (mejor !== null && mejorScore >= 0.6) {
      const s = stem(mejor);
      // Ignorar verbos de intención que no aportan al matching
      if (!["quiero", "tengo", "necesito", "necesitan"].includes(s)) {
        preguntaStems.add(s);
      }
    }
  }

  const puntajes = fichas
    .map((ficha) => {
      let best = 0;
      let bestOverlap = 0;
      for (const alias of ficha.alias) {
        const s = scoreAlias(preguntaStems, alias);
        if (s > best) {
          best = s;
          const aliasStems = new Set(tokensDe(alias).map(stem));
          bestOverlap = [...aliasStems].filter((x) => preguntaStems.has(x)).length;
        }
      }
      return { ficha, score: best, overlap: bestOverlap };
    })
    .filter((p) => p.score >= 0.5 && p.overlap >= 2)
    .sort((a, b) => b.score - a.score);

  if (puntajes.length === 0) return null;

  // Empate → abstención
  if (puntajes.length > 1 && puntajes[0].score === puntajes[1].score) {
    return null;
  }

  return puntajes[0].ficha;
}
