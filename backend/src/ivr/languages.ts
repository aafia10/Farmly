/**
 * Languages offered by the IVR, as verified against Sarvam's documentation (October 2026):
 * - Speech-to-text (saaras:v3) supports all of these.
 * - Text-to-speech (bulbul:v3) supports only 11: no Assamese or Urdu voice exists (Twilio has none either).
 * - Translation (sarvam-translate:v1) supports all of these.
 * "partial" languages are understood, but prompts are spoken with a closely related voice.
 */
export interface IvrLanguage {
  code: string; // BCP-47 code used by Sarvam STT and translation
  name: string; // English name
  nativeName: string;
  ttsCode: string; // voice language used for prompts
  promptLanguage: string; // language the prompt text is translated into before speaking
  support: "full" | "partial";
  note?: string;
}

export const IVR_LANGUAGES: IvrLanguage[] = [
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी", ttsCode: "hi-IN", promptLanguage: "hi-IN", support: "full" },
  { code: "mr-IN", name: "Marathi", nativeName: "मराठी", ttsCode: "mr-IN", promptLanguage: "mr-IN", support: "full" },
  { code: "en-IN", name: "English", nativeName: "English", ttsCode: "en-IN", promptLanguage: "en-IN", support: "full" },
  { code: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી", ttsCode: "gu-IN", promptLanguage: "gu-IN", support: "full" },
  { code: "bn-IN", name: "Bengali", nativeName: "বাংলা", ttsCode: "bn-IN", promptLanguage: "bn-IN", support: "full" },
  { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்", ttsCode: "ta-IN", promptLanguage: "ta-IN", support: "full" },
  { code: "te-IN", name: "Telugu", nativeName: "తెలుగు", ttsCode: "te-IN", promptLanguage: "te-IN", support: "full" },
  { code: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ", ttsCode: "kn-IN", promptLanguage: "kn-IN", support: "full" },
  { code: "ml-IN", name: "Malayalam", nativeName: "മലയാളം", ttsCode: "ml-IN", promptLanguage: "ml-IN", support: "full" },
  { code: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", ttsCode: "pa-IN", promptLanguage: "pa-IN", support: "full" },
  { code: "od-IN", name: "Odia", nativeName: "ଓଡ଼ିଆ", ttsCode: "od-IN", promptLanguage: "od-IN", support: "full" },
  {
    code: "as-IN",
    name: "Assamese",
    nativeName: "অসমীয়া",
    ttsCode: "bn-IN",
    promptLanguage: "as-IN",
    support: "partial",
    note: "Assamese speech is understood; prompts are Assamese text read by the Bengali voice.",
  },
  {
    code: "ur-IN",
    name: "Urdu",
    nativeName: "اردو",
    ttsCode: "hi-IN",
    promptLanguage: "hi-IN",
    support: "partial",
    note: "Urdu speech is understood; prompts are spoken in Hindi (Hindustani) by the Hindi voice.",
  },
];

/** Keypad menus: first menu keys 1-9, key 0 opens the second menu. */
export const LANGUAGE_MENU_1 = ["hi-IN", "mr-IN", "en-IN", "gu-IN", "bn-IN", "ta-IN", "te-IN", "kn-IN", "ml-IN"];
export const LANGUAGE_MENU_2 = ["pa-IN", "od-IN", "as-IN", "ur-IN"];

export const DEFAULT_LANGUAGE = "hi-IN";

export function getLanguage(code?: string | null): IvrLanguage | undefined {
  if (!code) return undefined;
  return IVR_LANGUAGES.find((l) => l.code.toLowerCase() === code.toLowerCase());
}

export function enabledLanguages(includePartial: boolean): IvrLanguage[] {
  return IVR_LANGUAGES.filter((l) => includePartial || l.support === "full");
}

/** Spoken language names (in English, as returned by translate-mode STT) mapped to codes. */
const SPOKEN_NAMES: Record<string, string> = {
  hindi: "hi-IN",
  marathi: "mr-IN",
  english: "en-IN",
  gujarati: "gu-IN",
  bengali: "bn-IN",
  bangla: "bn-IN",
  tamil: "ta-IN",
  telugu: "te-IN",
  kannada: "kn-IN",
  malayalam: "ml-IN",
  punjabi: "pa-IN",
  odia: "od-IN",
  oriya: "od-IN",
  assamese: "as-IN",
  urdu: "ur-IN",
};

export function languageFromSpokenName(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [name, code] of Object.entries(SPOKEN_NAMES)) {
    if (new RegExp(`\\b${name}\\b`).test(lower)) return code;
  }
  return undefined;
}
