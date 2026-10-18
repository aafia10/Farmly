/**
 * Parsers for the farmer's answers. Input is English text: speech in any language is converted
 * to English by Sarvam STT (translate mode) before it reaches these functions.
 */

export type Unit = "kg" | "quintals" | "tonnes";

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’`]/g, "") // "don't" -> "dont"
    .replace(/(\d),(\d)/g, "$1$2") // "1,200" -> "1200"
    .replace(/[“”".,!?;:()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const has = (text: string, words: string[]) => words.some((w) => new RegExp(`(^|\\s)${w}(\\s|$)`).test(text));

// ---------------------------------------------------------------------------
// Yes / no
// ---------------------------------------------------------------------------

const YES = ["yes", "yeah", "yep", "yup", "ok", "okay", "correct", "right", "sure", "fine", "true", "haan", "han", "ha", "ho", "hoy", "ji", "ji haan", "of course", "go ahead", "register", "confirm", "please do"];
const NO = ["no", "nope", "not", "wrong", "incorrect", "nahi", "nahin", "na", "change", "dont", "do not"];

export function parseYesNo(text: string): "yes" | "no" | undefined {
  const t = normalize(text);
  if (!t) return undefined;
  const no = has(t, NO);
  const yes = has(t, YES);
  if (no && !/\b(not wrong|no problem)\b/.test(t)) return "no";
  if (yes) return "yes";
  return undefined;
}

// ---------------------------------------------------------------------------
// Commands and questions the farmer may ask at any point
// ---------------------------------------------------------------------------

export type Intent =
  | "repeat"
  | "startOver"
  | "stop"
  | "helper"
  | "faqWhat"
  | "faqPrice"
  | "faqPayment"
  | "faqPrivacy"
  | "faqCertificate";

const INTENTS: [Intent, RegExp][] = [
  ["repeat", /\b(repeat|say (it |that )?again|once more|pardon|what did you say|didn'?t (hear|understand) (you|that))\b/],
  ["startOver", /\b(start (again|over)|from the beginning|restart)\b/],
  ["stop", /\b(stop|cancel|end the call|hang up|don'?t want to register|not now|bye|goodbye)\b/],
  ["helper", /\b(helper|human|person|agent|someone|talk to|speak to|connect me|call me back|operator|sathi)\b/],
  ["faqPayment", /\b(paid|payment|pay me|money|when will i get)\b/],
  ["faqPrice", /\b(price|rate|buyer|who will buy|bhav|good money)\b/],
  ["faqPrivacy", /\b(safe|privacy|private|secure|share my|my data|my number)\b/],
  ["faqCertificate", /\b(certificate|document|papers|certification)\b/],
  ["faqWhat", /\b(what is this|why (are you|do you)|who are you|what is farmly|what are you doing|why this call)\b/],
];

export function parseIntent(text: string): Intent | undefined {
  const t = normalize(text);
  for (const [intent, re] of INTENTS) if (re.test(t)) return intent;
  return undefined;
}

/** Commands that take priority over any answer (the farmer wants to stop, repeat or reach a person). */
export const COMMAND_INTENTS: Intent[] = ["repeat", "startOver", "stop", "helper"];

// ---------------------------------------------------------------------------
// Crop names
// ---------------------------------------------------------------------------

const CROPS: Record<string, string[]> = {
  Wheat: ["wheat", "gehun", "gahu", "gehu"],
  Rice: ["rice", "paddy", "dhan", "chawal", "basmati"],
  Maize: ["maize", "corn", "makka", "makai"],
  Soybean: ["soybean", "soyabean", "soya bean", "soya", "soybeans"],
  Cotton: ["cotton", "kapas", "kapus"],
  Sugarcane: ["sugarcane", "sugar cane", "ganna", "oos"],
  Onion: ["onion", "onions", "kanda", "pyaz", "pyaaz"],
  Tomato: ["tomato", "tomatoes", "tamatar"],
  Potato: ["potato", "potatoes", "aloo", "batata"],
  Groundnut: ["groundnut", "groundnuts", "peanut", "peanuts", "moongfali", "shengdana"],
  Mustard: ["mustard", "sarson", "rai"],
  Chickpea: ["chickpea", "chickpeas", "gram", "chana", "harbhara", "bengal gram"],
  "Pigeon Pea": ["pigeon pea", "pigeon peas", "tur", "toor", "arhar", "red gram"],
  "Green Gram": ["green gram", "moong", "mung"],
  "Black Gram": ["black gram", "urad"],
  "Pearl Millet": ["pearl millet", "bajra"],
  Sorghum: ["sorghum", "jowar", "jwari"],
  "Finger Millet": ["finger millet", "ragi", "nachni"],
  Turmeric: ["turmeric", "haldi"],
  Chilli: ["chilli", "chili", "chillies", "chilies", "mirchi", "red chilli", "green chilli"],
  Garlic: ["garlic", "lahsun"],
  Ginger: ["ginger", "adrak"],
  Grapes: ["grape", "grapes", "angoor"],
  Pomegranate: ["pomegranate", "pomegranates", "anar", "dalimb"],
  Banana: ["banana", "bananas", "kela", "keli"],
  Mango: ["mango", "mangoes", "aam", "amba"],
  Orange: ["orange", "oranges", "santra", "mosambi"],
  Cauliflower: ["cauliflower", "phool gobhi", "gobhi", "gobi"],
  Cabbage: ["cabbage", "patta gobhi", "kobi"],
  Brinjal: ["brinjal", "eggplant", "baingan", "vangi"],
  Okra: ["okra", "lady finger", "ladyfinger", "bhindi", "bhendi"],
  Coconut: ["coconut", "coconuts", "nariyal"],
  Tea: ["tea", "chai patti"],
  Coffee: ["coffee"],
  Jute: ["jute"],
  Sunflower: ["sunflower"],
  Sesame: ["sesame", "til"],
  Lentil: ["lentil", "lentils", "masoor"],
};

const CROP_ALIASES: [string, string][] = Object.entries(CROPS)
  .flatMap(([name, aliases]) => aliases.map((a) => [a, name] as [string, string]))
  .sort((a, b) => b[0].length - a[0].length); // prefer the longest match ("green gram" before "gram")

export function parseCrop(text: string): { crop?: string; heard: string } {
  const t = normalize(text);
  for (const [alias, name] of CROP_ALIASES) {
    if (new RegExp(`(^|\\s)${alias}(\\s|$)`).test(t)) return { crop: name, heard: t };
  }
  // Strip filler so an unknown crop can be read back to the farmer.
  const heard = t
    .replace(/\b(i want to register|i want to|register|my crop is|the crop is|crop|it is|it's|i have|i grow|of|the|a|an|my)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { heard };
}

export function cleanFreeText(text: string): string {
  const t = text.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
  return t.length > 80 ? t.slice(0, 80) : t;
}

export function parseVariety(text: string): { variety: string | null } | undefined {
  const t = normalize(text);
  if (!t) return undefined;
  if (/\b(don'?t know|do not know|not sure|no idea|unknown|no variety|normal|local|desi)\b/.test(t)) {
    return { variety: /\b(local|desi)\b/.test(t) ? "Local" : null };
  }
  const v = cleanFreeText(text.replace(/\b(the )?variety( is| of it is)?|it is|it's\b/gi, " "));
  return v ? { variety: v } : undefined;
}

// ---------------------------------------------------------------------------
// Numbers (digits or English words, including "two and a half", "lakh")
// ---------------------------------------------------------------------------

const SMALL: Record<string, number> = {
  zero: 0, one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const SCALE: Record<string, number> = { hundred: 100, thousand: 1000, lakh: 100000, lakhs: 100000, million: 1000000 };

export function parseNumber(text: string): number | undefined {
  const t = normalize(text).replace(/(\d),(\d)/g, "$1$2");

  // "500", "2.5", "2 and a half", "5 thousand", "1.5 lakh"
  const digits = t.match(/(\d+(?:\.\d+)?)(?:\s+(hundred|thousand|lakh|lakhs|million))?(\s+and (?:a )?half|\s*½)?/);
  if (digits) {
    let n = parseFloat(digits[1]);
    if (digits[2]) n *= SCALE[digits[2]];
    if (digits[3]) n += 0.5;
    return n;
  }

  const words = t.split(" ");
  let total = 0;
  let current = 0;
  let found = false;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w in SMALL && !(w === "a" || w === "an") ) {
      current += SMALL[w];
      found = true;
    } else if ((w === "a" || w === "an") && words[i + 1] && (words[i + 1] in SCALE)) {
      current += 1;
      found = true;
    } else if (w in SCALE) {
      if (!found && current === 0) current = 1;
      current *= SCALE[w];
      if (SCALE[w] >= 1000) {
        total += current;
        current = 0;
      }
      found = true;
    } else if (w === "half" && found) {
      current += 0.5;
    } else if (w === "half" && !found) {
      return 0.5;
    }
  }
  return found ? total + current : undefined;
}

// ---------------------------------------------------------------------------
// Quantity with unit
// ---------------------------------------------------------------------------

export type QuantityResult =
  | { kind: "ok"; quantity: number; unit: Unit }
  | { kind: "needUnit"; quantity: number }
  | { kind: "unsupportedUnit" }
  | { kind: "invalid" }
  | { kind: "none" };

const MAX_KG = 1_000_000; // 1,000 tonnes

export function toKg(quantity: number, unit: Unit): number {
  return unit === "kg" ? quantity : unit === "quintals" ? quantity * 100 : quantity * 1000;
}

export function parseUnit(text: string): Unit | undefined {
  const t = normalize(text);
  if (/\b(quintal|quintals|qtl|qtls|qt|cwt|kwintal)\b/.test(t)) return "quintals";
  if (/\b(tonne|tonnes|ton|tons|mt|metric ton|metric tons|metric tonnes)\b/.test(t)) return "tonnes";
  if (/\b(kg|kgs|kilo|kilos|kilogram|kilograms|kilogrammes)\b/.test(t)) return "kg";
  return undefined;
}

export function parseQuantity(text: string): QuantityResult {
  const t = normalize(text);
  if (!t) return { kind: "none" };
  const unit = parseUnit(t);
  const n = parseNumber(t);
  if (n === undefined) return /\b(bag|bags|sack|sacks|box|boxes|crate|crates|truck|trolley|acre|acres)\b/.test(t) ? { kind: "unsupportedUnit" } : { kind: "none" };
  if (!unit && /\b(bag|bags|sack|sacks|box|boxes|crate|crates|truck|trolley|acre|acres)\b/.test(t)) return { kind: "unsupportedUnit" };
  if (!(n > 0)) return { kind: "invalid" };
  if (!unit) return { kind: "needUnit", quantity: n };
  if (toKg(n, unit) > MAX_KG) return { kind: "invalid" };
  return { kind: "ok", quantity: Math.round(n * 100) / 100, unit };
}

// ---------------------------------------------------------------------------
// Harvest date
// ---------------------------------------------------------------------------

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4, jun: 5, june: 5,
  jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10,
  dec: 11, december: 11,
};

export type HarvestResult = { kind: "ok"; date: string; harvested: boolean } | { kind: "invalid" } | { kind: "none" };

const DAY_MS = 86_400_000;

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

export function parseHarvestDate(text: string, today = new Date()): HarvestResult {
  const t = normalize(text);
  if (!t) return { kind: "none" };
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const harvestedWords = /\b(already harvested|harvested|already done|done|completed|cut already|already cut|it is ready|it's ready|ready now|in stock|stored)\b/.test(t);

  let date: Date | undefined;
  const n = parseNumber(t);

  if (/\bday after tomorrow\b/.test(t)) date = addDays(base, 2);
  else if (/\btomorrow\b/.test(t)) date = addDays(base, 1);
  else if (/\b(today|now|right now)\b/.test(t)) date = base;
  else if (/\bday before yesterday\b/.test(t)) date = addDays(base, -2);
  else if (/\byesterday\b/.test(t)) date = addDays(base, -1);
  else if (/\b(next|coming) week\b/.test(t)) date = addDays(base, 7);
  else if (/\b(next|coming) month\b/.test(t)) date = addDays(base, 30);
  else if (/\blast week\b/.test(t)) date = addDays(base, -7);
  else if (/\blast month\b/.test(t)) date = addDays(base, -30);
  else if (n !== undefined && /\b(days?)\b/.test(t) && /\b(ago|back|before)\b/.test(t)) date = addDays(base, -Math.round(n));
  else if (n !== undefined && /\b(weeks?)\b/.test(t) && /\b(ago|back|before)\b/.test(t)) date = addDays(base, -Math.round(n * 7));
  else if (n !== undefined && /\b(days?)\b/.test(t)) date = addDays(base, Math.round(n));
  else if (n !== undefined && /\b(weeks?)\b/.test(t)) date = addDays(base, Math.round(n * 7));
  else if (n !== undefined && /\b(months?)\b/.test(t)) date = addDays(base, Math.round(n * 30));
  else if (n !== undefined && /\b(years?)\b/.test(t)) date = addDays(base, Math.round(n * 365));
  else {
    // Explicit dates: "15 november", "november 15", "15th nov 2026", "15/11", "15-11-2026"
    const numeric = t.match(/\b(\d{1,2})\s*[/-]\s*(\d{1,2})(?:\s*[/-]\s*(\d{2,4}))?\b/);
    const dayMonth = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)(?:\s+(\d{4}))?\b/);
    const monthDay = t.match(/\b([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?\b/);
    let day: number | undefined;
    let month: number | undefined;
    let year: number | undefined;
    if (numeric) {
      day = +numeric[1];
      month = +numeric[2] - 1;
      if (numeric[3]) year = numeric[3].length === 2 ? 2000 + +numeric[3] : +numeric[3];
    } else if (dayMonth && dayMonth[2] in MONTHS) {
      day = +dayMonth[1];
      month = MONTHS[dayMonth[2]];
      if (dayMonth[3]) year = +dayMonth[3];
    } else if (monthDay && monthDay[1] in MONTHS) {
      day = +monthDay[2];
      month = MONTHS[monthDay[1]];
      if (monthDay[3]) year = +monthDay[3];
    } else {
      const monthOnly = t.split(" ").find((w) => w in MONTHS && w !== "may");
      if (monthOnly) {
        month = MONTHS[monthOnly];
        day = 15; // "in November" -> mid-month estimate
      }
    }
    if (day !== undefined && month !== undefined && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const y = year ?? base.getFullYear();
      const candidate = new Date(y, month, day);
      if (candidate.getMonth() !== month) return { kind: "invalid" };
      // Without a year, a date far in the past most likely means next year.
      if (year === undefined && !harvestedWords && candidate.getTime() < base.getTime() - 90 * DAY_MS) {
        candidate.setFullYear(y + 1);
      }
      date = candidate;
    }
  }

  if (!date && harvestedWords) date = base;
  if (!date) return { kind: "none" };

  const diffDays = Math.round((date.getTime() - base.getTime()) / DAY_MS);
  if (diffDays < -90 || diffDays > 365) return { kind: "invalid" };
  return { kind: "ok", date: iso(date), harvested: harvestedWords || diffDays <= 0 };
}

// ---------------------------------------------------------------------------
// Which field to change after the read-back
// ---------------------------------------------------------------------------

export type Field = "crop" | "variety" | "quantity" | "harvest" | "location";

export function parseFieldChoice(text: string): Field | undefined {
  const t = normalize(text);
  if (/\b(variety|type|kind)\b/.test(t)) return "variety";
  if (/\b(quantity|amount|weight|how much|kilo|kilos|quintal|quintals|tonne|tonnes|kg)\b/.test(t)) return "quantity";
  if (/\b(date|harvest|when|day|month)\b/.test(t)) return "harvest";
  if (/\b(location|village|place|farm|where|district)\b/.test(t)) return "location";
  if (/\b(crop|name)\b/.test(t)) return "crop";
  return undefined;
}

/** Digits from the keypad or spoken ("nine eight seven..."). Returns the last 10 digits of a mobile number. */
export function normalizeMobile(value?: string | null): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10) return undefined;
  return digits.slice(-10);
}
