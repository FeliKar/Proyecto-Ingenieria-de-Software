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
  // Muletillas del habla (consultas por voz)
  "eh", "e", "ah", "hmm", "o", "sea", "bueno", "buenas", "buenos", "hola",
  "oye", "mira", "porfavor", "favor", "queria", "quisiera", "dime", "ahi",
]);

// Raíces para unificar variantes verbales/nominales
function stem(token: string): string {
  if (/^renuev/.test(token) || /^renov/.test(token) || /^control/.test(token)) return "renov";
  if (/^vencid/.test(token) || /^venc/.test(token)) return "venc";
  if (/^adopc/.test(token) || /^adopt/.test(token)) return "adopcion";
  if (/^(sacar|saco|saca|sacas|sacarme|obtener|obtengo|obtencion|conseguir|consigo|comprar|compro|tramitar)$/.test(token))
    return "obtener";
  if (/^pago|pagas|pagar|pagarme$/.test(token)) return "pagar";
  if (/^conducir/.test(token)) return "conducir";
  if (/^licencias?$/.test(token)) return "licencia";
  if (/^clases?$/.test(token)) return "clase";
  return token;
}

// Formas verbales frecuentes para la autocorrección
const FORMAS_EXTRA = [
  "renuevo", "renuevas", "renueva", "renovando", "sacar", "saco", "sacas",
  "sacarme", "obtener", "obtengo", "conseguir", "tengo", "quiero",
  "adoptar", "adopto",
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

// --- Corrección ortográfica previa -----------------------------------------
// Se corrige la consulta antes de detectar clase e intención, para que
// "lisensia b primra vez" se entienda igual que "licencia b primera vez".

// Palabras clave del dominio que deben corregirse aunque no estén en un trámite.
const PALABRAS_DOMINIO = [
  "primera", "primer", "renovar", "renovacion", "vencida", "clase", "tipo",
  "licencia", "permiso", "circulacion", "sacar", "obtener", "solicitar",
  "inscribir", "postular",
];

// Clave fonética del español: iguala letras que suenan igual (s/c/z, b/v,
// h muda, ll/y, gu/g, qu/k) para que los errores típicos no cuenten.
function claveFonetica(palabra: string): string {
  return palabra
    .replace(/(?<!c)h/g, "")
    .replace(/qu/g, "k")
    .replace(/c([eiy])/g, "s$1")
    .replace(/c/g, "k")
    .replace(/z/g, "s")
    .replace(/v/g, "b")
    .replace(/ll/g, "y")
    .replace(/gu([ei])/g, "g$1")
    .replace(/(.)\1+/g, "$1");
}

// Distancia de Damerau-Levenshtein (con transposición), cortando apenas supera `max`.
function distanciaAcotada(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = [];
  for (let i = 0; i <= a.length; i++) d.push([i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let minFila = Number.POSITIVE_INFINITY;
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + costo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
      minFila = Math.min(minFila, d[i][j]);
    }
    if (minFila > max) return max + 1;
  }
  return d[a.length][b.length];
}

// Vocabulario por conjunto de fichas, calculado una sola vez.
const vocabularios = new WeakMap<FichaTramite[], Map<string, string>>();

function vocabularioDe(fichas: FichaTramite[]): Map<string, string> {
  let vocab = vocabularios.get(fichas);
  if (vocab) return vocab;
  const palabras = new Set<string>([
    ...PALABRAS_DOMINIO,
    ...FORMAS_EXTRA,
    ...Object.keys(LETRAS_DICTADAS),
  ]);
  for (const f of fichas) {
    for (const t of tokensDe(f.tramite)) palabras.add(t);
    for (const alias of f.alias) for (const t of tokensDe(alias)) palabras.add(t);
  }
  // palabra → su clave fonética
  vocab = new Map([...palabras].map((p) => [p, claveFonetica(p)]));
  vocabularios.set(fichas, vocab);
  return vocab;
}

function corregirPalabra(palabra: string, vocab: Map<string, string>): string {
  // Palabras cortas ("de", "b", "efe"), números y conocidas no se tocan.
  if (palabra.length < 4 || /\d/.test(palabra) || STOP_WORDS.has(palabra) || vocab.has(palabra)) {
    return palabra;
  }
  const max = palabra.length <= 5 ? 1 : 2;
  const clave = claveFonetica(palabra);
  let mejor: string | null = null;
  let mejorDistancia = max + 1;
  let empatada = false;
  for (const [candidata, claveCandidata] of vocab) {
    const dist = distanciaAcotada(clave, claveCandidata, max);
    if (dist < mejorDistancia) {
      mejor = candidata;
      mejorDistancia = dist;
      empatada = false;
    } else if (dist === mejorDistancia && dist <= max) {
      empatada = true;
    }
  }
  // Solo se corrige si hay un único candidato claro.
  return mejor !== null && !empatada ? mejor : palabra;
}

function corregirConsulta(pregunta: string, fichas: FichaTramite[]): string {
  const vocab = vocabularioDe(fichas);
  return normalize(pregunta)
    .split(" ")
    .map((p) => corregirPalabra(p, vocab))
    .join(" ");
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

// Letras dictadas por voz que suenan como palabras: "be" para la letra B, "efe"
// para la letra F, "ví" para la letra V, etc. Se interpretan como la letra
// correspondiente para que la búsqueda por voz dé los mismos resultados que la
// escrita.
const LETRAS_DICTADAS: Record<string, string> = {
  be: "b",
  ve: "b",
  vi: "v",
  uve: "v",
  uvi: "v",
  ce: "c",
  ese: "s",
  efe: "f",
  ele: "l",
  eme: "m",
  ene: "n",
  pe: "p",
  ge: "g",
  equis: "x",
};

// Nota: "de" y "te" no se mapean para no romper frases como "tipo de licencia".
function letraClase(token: string): string {
  return LETRAS_DICTADAS[token] ?? token;
}

function detectarClase(preguntaNormalizada: string): string | null {
  const conPalabraClase = preguntaNormalizada.match(
    /(?:clase|tipo)\s+(?:(?:de|del|la|el|los|las|un|una)\s+)*([a-z0-9]+)/
  );
  if (conPalabraClase) return letraClase(conPalabraClase[1]);
  const trasLicencia = preguntaNormalizada.match(
    /licencia\s+(?:de\s+conducir\s+)?([a-z0-9])\b/
  );
  if (trasLicencia) return trasLicencia[1];
  return null;
}

function tipoFicha(ficha: FichaTramite): "primera" | "renovacion" | null {
  if (/renov/.test(ficha.id)) return "renovacion";
  if (/primer/.test(ficha.id)) return "primera";
  return null;
}

export interface OpcionTramite {
  id: string;
  tramite: string;
}

export interface ResultadoMatch {
  ficha: FichaTramite | null;
  motivo: "ok" | "ambiguo" | "empate" | "sin-match";
  clase?: string;
  opciones?: OpcionTramite[];
}

// Nivel fuerte: al menos la mitad de las palabras del trámite cubiertas.
const UMBRAL_FUERTE = 0.5;

// Nivel recomendación: el usuario cubrió al menos el 80% de lo que dijo con
// este trámite, aunque el trámite sea largo (nombres oficiales extensos).
const UMBRAL_RECOMENDACION = 0.8;

// Similitud mínima que debe tener una palabra no reconocida para que la consulta
// siga buscando: por debajo se considera un tema ajeno a los trámites del
// catálogo y se abstiene (US-09: no inventar).
const UMBRAL_PALABRA_DESCONOCIDA = 0.5;

// Tamaño máximo de la lista de opciones al haber empate.
const TOPE_OPCIONES = 5;

interface Puntaje {
  ficha: FichaTramite;
  score: number;
  overlap: number;
}

// Varios trámites empatados en el primer lugar → se ofrecen como opciones.
function opcionesEmpate(puntajes: Puntaje[]): OpcionTramite[] {
  const mejor = puntajes[0].score;
  return puntajes
    .filter((p) => p.score === mejor)
    .slice(0, TOPE_OPCIONES)
    .map((p) => ({ id: p.ficha.id, tramite: p.ficha.tramite }));
}

function buscarNombreExacto(
  preguntaNormalizada: string,
  fichas: FichaTramite[]
): FichaTramite | undefined {
  return fichas.find((f) => normalize(f.tramite) === preguntaNormalizada);
}

export function matchTramiteDetalle(
  pregunta: string,
  fichas: FichaTramite[]
): ResultadoMatch {
  if (tokensDe(pregunta).length === 0) return { ficha: null, motivo: "sin-match" };

  // Si la consulta es el nombre exacto de un trámite, ese gana (antes y después
  // de corregir la ortografía).
  const exactaOriginal = buscarNombreExacto(normalize(pregunta), fichas);
  if (exactaOriginal) return { ficha: exactaOriginal, motivo: "ok" };
  const preguntaNormalizada = corregirConsulta(pregunta, fichas);
  const exacta = buscarNombreExacto(preguntaNormalizada, fichas);
  if (exacta) return { ficha: exacta, motivo: "ok" };
  const tokensPregunta = tokensDe(preguntaNormalizada);
  const clasePregunta = detectarClase(preguntaNormalizada);
  const intencionPrimera = tokensPregunta.some((t) =>
    /^(primer|nuev|compr)/.test(t)
  );
  const intencionRenovacion = tokensPregunta.some(
    (t) => stem(t) === "renov" || /^venc/.test(t)
  );
  // Marca cuando la consulta llegó al caso "primera vez vs renovación" sin tratar
  // realmente de eso (p. ej. una beca o un taller): entonces se continúa la
  // búsqueda normal, pero con cuidado si contiene palabras desconocidas.
  let consultaSinIntencion = false;

  // Filtrar candidatas por clase explícita y por intención (primera vs renovación)
  let candidatas = fichas;
  if (clasePregunta !== null) {
    candidatas = candidatas.filter(
      (f) =>
        f.clase === undefined ||
        f.clase
          .toLowerCase()
          .split(",")
          .map((c) => c.trim())
          .includes(clasePregunta)
    );
    // Si hay trámites de esa clase, los que no son de licencias no compiten.
    const deLaClase = candidatas.filter((f) => f.clase !== undefined);
    if (deLaClase.length > 0) candidatas = deLaClase;
  }
  // Solo las fichas completas vienen en pares primera vez / renovación.
  const completas = candidatas.filter((f) => !f.solo_enlace);
  const hayPrimera = completas.some((f) => tipoFicha(f) === "primera");
  const hayRenovacion = completas.some((f) => tipoFicha(f) === "renovacion");
  if (intencionPrimera && !intencionRenovacion) {
    candidatas = candidatas.filter((f) => f.solo_enlace || tipoFicha(f) === "primera");
  } else if (intencionRenovacion && !intencionPrimera) {
    candidatas = candidatas.filter((f) => f.solo_enlace || tipoFicha(f) === "renovacion");
  } else if (!intencionPrimera && !intencionRenovacion && hayPrimera && hayRenovacion) {
    // Sin intención explícita hay dos opciones (primera vez vs renovación).
    // Considerar solo las fichas con overlap real con la pregunta.
    const preguntaStemsTmp = new Set(tokensPregunta.map((t) => stem(t)));
    // La desambigüedad "primera vez vs renovación" solo aplica a las fichas
    // completas; las de solo enlace (catálogo) no forman parte de esa pregunta.
    const relacionadas = candidatas.filter((f) => {
      let maxOverlap = 0;
      for (const alias of f.alias) {
        const aliasStems = new Set(tokensDe(alias).map(stem));
        const overlap = [...aliasStems].filter((x) => preguntaStemsTmp.has(x))
          .length;
        if (overlap > maxOverlap) maxOverlap = overlap;
      }
      // Un trámite del catálogo entra como opción solo si coincide con más
      // palabras (p. ej. "eximirse de pago de permiso de circulación").
      return maxOverlap >= (f.solo_enlace ? 3 : 2);
    });
    // Hay ambigüedad real solo si alguna ficha completa está relacionada; los
    // trámites del catálogo se suman como opciones extra.
    if (relacionadas.some((f) => !f.solo_enlace)) {
      return {
        ficha: null,
        motivo: "ambiguo",
        clase: clasePregunta ?? undefined,
        opciones: relacionadas.map((f) => ({ id: f.id, tramite: f.tramite })),
      };
    }
    // No es una consulta de primera vez vs renovación: se continúa la búsqueda
    // normal en todas las fichas (catálogo incluido).
    consultaSinIntencion = true;
  }
  if (candidatas.length === 0) return { ficha: null, motivo: "sin-match" };

  fichas = candidatas;

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
  // Mejor similitud de las palabras que no se pudieron mapear (solo interesa si
  // la consulta vino del caso "sin intención"): si una palabra es muy ajena al
  // vocabulario de trámites, la consulta trata de otra cosa.
  let similitudDesconocida = Number.POSITIVE_INFINITY;
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
    } else if (consultaSinIntencion) {
      similitudDesconocida = Math.min(similitudDesconocida, mejorScore);
    }
  }

  // Consulta sin intención clara con palabras ajenas a los trámites (p. ej.
  // "perro", "impuesto") → se abstiene en vez de forzar una coincidencia (US-09).
  if (
    consultaSinIntencion &&
    similitudDesconocida < UMBRAL_PALABRA_DESCONOCIDA
  ) {
    return { ficha: null, motivo: "sin-match" };
  }

  const puntajes: Puntaje[] = fichas
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
    .filter((p) => p.overlap >= 2)
    .sort((a, b) => b.score - a.score);

  // Nivel fuerte: coincide al menos la mitad de las palabras del trámite.
  const fuertes = puntajes.filter((p) => p.score >= UMBRAL_FUERTE);
  if (fuertes.length > 0) {
    if (fuertes.length > 1 && fuertes[0].score === fuertes[1].score) {
      return { ficha: null, motivo: "empate", opciones: opcionesEmpate(fuertes) };
    }
    return { ficha: fuertes[0].ficha, motivo: "ok" };
  }

  // Nivel recomendación: aunque la consulta use solo el 80% de sus palabras
  // en un trámite extenso, se entrega la mejor opción (o varias si empatan).
  if (preguntaStems.size >= 2) {
    const recomendaciones = puntajes.filter(
      (p) => p.overlap / preguntaStems.size >= UMBRAL_RECOMENDACION
    );
    if (recomendaciones.length > 0) {
      if (
        recomendaciones.length > 1 &&
        recomendaciones[0].score === recomendaciones[1].score
      ) {
        return {
          ficha: null,
          motivo: "empate",
          opciones: opcionesEmpate(recomendaciones),
        };
      }
      return { ficha: recomendaciones[0].ficha, motivo: "ok" };
    }
  }

  return { ficha: null, motivo: "sin-match" };
}

export function matchTramite(
  pregunta: string,
  fichas: FichaTramite[]
): FichaTramite | null {
  return matchTramiteDetalle(pregunta, fichas).ficha;
}
