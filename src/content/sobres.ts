/**
 * Contenido de los sobres de la gincana, transcrito de las hojas impresas.
 * Para reutilizar la web otro año, este es el archivo que hay que cambiar (junto con los QR en /admin/qr).
 *
 * Marcadores que se sustituyen por el equipo del jugador:
 *   {EQUIPO} → nombre en mayúsculas · {equipo} → nombre · {inicial} → primera letra
 */

export type TitlePart = { text: string; tone?: "ink" | "blood" | "pumpkin" };
export type CalloutKind = "objetivo" | "importante" | "puntuacion" | "regla" | "especial" | "final" | "bonus";
export type Callout = { kind: CalloutKind; label?: string; text: string };
export type Section = { heading?: string; items: string[] };

export type Envelope = {
  number: number;
  title: TitlePart[];
  /** Frase bajo el título. */
  tagline: string;
  /** Banda roja destacada (como «Este sobre se abre AHORA…»). */
  banner?: string;
  objective: string;
  sections: Section[];
  /** Cajas al final: importante, puntuación, regla, prueba especial, prueba final… */
  callouts: Callout[];
  /** El sobre del mapa muestra la ruta del equipo en vez de una lista. */
  map?: boolean;
};

export const ENVELOPES: Envelope[] = [
  {
    number: 0,
    title: [{ text: "Un " }, { text: "amigo", tone: "blood" }, { text: " es un " }, { text: "tesoro", tone: "pumpkin" }],
    tagline: "No todas las pruebas están dentro de los sobres. Algunas personas son el verdadero tesoro.",
    banner: "Este sobre se abre AHORA y os acompañará durante toda la noche.",
    objective: "Completar tantos retos como sea posible durante el resto de la gincana.",
    sections: [
      {
        items: [
          "Hacer una figura de acrosport usando todos los miembros del equipo.",
          "Encontrar a alguien con un disfraz que haga «match» con vuestro equipo y haceros una foto juntos.",
          "Conseguir que alguien que no esté en la fiesta se tome una cerveza con el equipo y hacer una foto.",
          "Conseguir que una persona disfrazada se haga un «selfi» con todo el equipo.",
          "Vídeo del equipo compartiendo unas cervezas.",
          "Hacer una foto con alguien que lleve algo naranja.",
          "Conseguir que alguien diga en vídeo: «FELIZ HALLOWEEN, EQUIPO {EQUIPO}».",
          "Encontrar a alguien con un disfraz que dé más miedo que el de cualquier miembro del equipo.",
        ],
      },
    ],
    callouts: [
      { kind: "puntuacion", text: "Cada prueba = 3 puntos. Completar las 10 = +10 puntos extra." },
      { kind: "regla", text: "Pedid. No obliguéis. El tesoro está en conseguir aliados, no enemigos." },
    ],
  },
  {
    number: 1,
    title: [{ text: "La " }, { text: "casa", tone: "pumpkin" }, { text: " maldita", tone: "blood" }],
    tagline: "El primer tesoro está más cerca de lo que pensáis.",
    objective: "Encontrar objetos dentro de la casa y demostrar cada descubrimiento mediante una foto o vídeo.",
    sections: [
      {
        items: [
          "Encontrad algo que utilizaría un vampiro.",
          "Encontrad el objeto más extraño de la casa y haced una foto de todo el equipo adorándolo como si fuera una reliquia sagrada.",
          "Encontrad un objeto y recread con él una escena de película de terror.",
          "Encontrad un objeto que no debería estar donde está y haced una foto dramática señalándolo.",
          "Encontrad un «tesoro» y haced una foto del equipo como si acabara de robarlo.",
          "Encontrad un objeto pequeño y grabad un vídeo de 10 segundos vendiéndolo como si fuera un producto de lujo.",
        ],
      },
    ],
    callouts: [{ kind: "puntuacion", text: "Cada prueba = 2 puntos. La prueba más creativa = +5 puntos." }],
  },
  {
    number: 2,
    title: [{ text: "Los objetos " }, { text: "perdidos", tone: "pumpkin" }],
    tagline: "Ahora tendréis que abandonar la seguridad de la casa.",
    objective: "Conseguir objetos fuera de la casa.",
    sections: [
      {
        heading: "Fáciles",
        items: [
          "Una hoja seca.",
          "Algo verde.",
          "Una piedra grande.",
          "Ceniza (fría).",
          "Un objeto que empiece por la misma letra que el nombre del equipo: la «{inicial}».",
        ],
      },
      {
        heading: "Difíciles",
        items: ["Un objeto de disfraz que pertenezca a alguien que NO esté en la fiesta.", "Una calabaza."],
      },
    ],
    callouts: [
      {
        kind: "importante",
        text: "No vale comprarlos. Hay que encontrarlos, pedirlos o conseguir que alguien os los entregue.",
      },
      {
        kind: "especial",
        label: "Prueba especial",
        text: "Conseguid un objeto que nadie del equipo haya pensado que sería posible conseguir.",
      },
      { kind: "puntuacion", text: "Objetos fáciles = 1 punto. Objetos difíciles = 3 puntos. Prueba especial = 5 puntos." },
      { kind: "regla", text: "Si alguien os dice que no, sonreíd, dad las gracias y seguid buscando." },
    ],
  },
  {
    number: 3,
    title: [{ text: "El mapa " }, { text: "del muerto", tone: "blood" }],
    tagline: "El mapa os mostrará el camino. El resto depende de vosotros.",
    objective: "Completar 4 de las 5 localizaciones.",
    sections: [],
    map: true,
    callouts: [
      { kind: "regla", text: "Debéis permanecer juntos durante todo el recorrido." },
      { kind: "bonus", text: "Completar las 5 localizaciones = +10 puntos." },
    ],
  },
  {
    number: 4,
    title: [{ text: "El ritual", tone: "pumpkin" }],
    tagline: "El último sobre. Aquí se acaba el sentido común.",
    objective: "Superar 5 de las siguientes pruebas.",
    sections: [
      {
        items: [
          "Crear una coreografía de 20 segundos.",
          "Recrear una escena de terror sin poder hablar.",
          "Hacer una foto en la que TODO el equipo esté en el aire al mismo tiempo.",
          "Inventar una leyenda sobre la casa y contarla en vídeo con voz misteriosa.",
          "Crear un conjuro absurdo usando cinco palabras inventadas.",
          "Crear una pócima falsa con tres ingredientes y presentarla como si fuera un anuncio de televisión.",
          "Representar una película de terror para que una persona externa adivine cuál es.",
          "Hacer una foto que parezca el cartel de una película de terror protagonizada por vuestro equipo.",
        ],
      },
    ],
    callouts: [
      {
        kind: "puntuacion",
        text: "Cada prueba = 4 puntos. Completar las 5 mínimas = +5 puntos. Completar las 10 = +15 puntos.",
      },
      { kind: "final", label: "Prueba final", text: "Inventad vuestro propio grito de guerra y grabadlo en vídeo." },
    ],
  },
];

/* ---------- El mapa del muerto ---------- */

export type LocationKey = "vito-sara" | "parkour" | "rocodromo" | "zigzag" | "anfiteatro" | "harley" | "vito-gorra";

export type MapLocation = {
  name: string;
  task: string;
  /** «qr»: hay un QR escondido; el valor es el prefijo de su URL (/p/<prefijo>-…). */
  proof: "foto" | { qr: string };
};

export const LOCATIONS: Record<LocationKey, MapLocation> = {
  "vito-sara": { name: "Vito y Sara", task: "Presentar vuestros respetos a Pepi.", proof: "foto" },
  parkour: { name: "El Parkour", task: "Encontrad y escanead el QR escondido en el parkour.", proof: { qr: "parkour" } },
  rocodromo: { name: "El Rocódromo", task: "Encontrad y escanead el QR escondido en el rocódromo.", proof: { qr: "rocodromo" } },
  zigzag: { name: "Zigzag", task: "Encontrad y escanead el QR escondido en los muros rojos.", proof: { qr: "zigzag" } },
  anfiteatro: { name: "El Anfiteatro", task: "Encontrad y escanead el QR escondido en el anfiteatro.", proof: { qr: "anfiteatro" } },
  harley: { name: "La Harley", task: "Haced una foto como si fuerais la portada de vuestro primer álbum musical.", proof: "foto" },
  "vito-gorra": {
    name: "Vito, gorra azul",
    task: "Haced una foto en la que parezca que uno de vosotros está siendo bautizado por el resto.",
    proof: "foto",
  },
};

/** Ruta de cada equipo (de la hoja del coordinador). Todos salen y vuelven a Casa. */
export const ROUTES: Record<string, LocationKey[]> = {
  calabaza: ["vito-sara", "parkour", "rocodromo", "harley", "vito-gorra"],
  fantasma: ["vito-sara", "zigzag", "anfiteatro", "harley", "vito-gorra"],
  bruja: ["vito-gorra", "harley", "zigzag", "parkour", "vito-sara"],
  zombie: ["vito-gorra", "harley", "anfiteatro", "rocodromo", "vito-sara"],
};

/** Clave de equipo para rutas y mapas («Zombi» y «Zombie» son el mismo equipo). */
export function teamKey(teamName: string): string {
  const key = teamName.trim().toLowerCase();
  return key === "zombi" ? "zombie" : key;
}

export function getEnvelope(number: number): Envelope | undefined {
  return ENVELOPES.find((e) => e.number === number);
}

/** Sustituye los marcadores por los datos del equipo. */
export function personalize(text: string, teamName: string): string {
  const name = teamName.trim();
  return text
    .replaceAll("{EQUIPO}", name.toUpperCase())
    .replaceAll("{equipo}", name)
    .replaceAll("{inicial}", name.charAt(0).toUpperCase());
}
