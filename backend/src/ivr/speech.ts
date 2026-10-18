/**
 * Sarvam AI speech and translation (https://docs.sarvam.ai), with a small disk cache so fixed
 * prompts are translated and synthesised only once. The API key stays on the server.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { env } from "../config/env";

const BASE = "https://api.sarvam.ai";
const TIMEOUT_MS = 12_000;
const CACHE_DIR = path.resolve(process.cwd(), ".cache", "ivr");
const AUDIO_DIR = path.join(CACHE_DIR, "audio");
const TRANSLATION_FILE = path.join(CACHE_DIR, "translations.json");
export const TTS_SAMPLE_RATE = 16000;

export class SpeechError extends Error {
  constructor(message: string, public readonly retryable: boolean) {
    super(message);
    this.name = "SpeechError";
  }
}

export function speechConfigured(): boolean {
  return Boolean(env.SARVAM_API_KEY);
}

async function call(pathname: string, init: RequestInit): Promise<any> {
  if (!env.SARVAM_API_KEY) throw new SpeechError("Sarvam is not configured (SARVAM_API_KEY missing)", false);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${pathname}`, {
      ...init,
      headers: { "api-subscription-key": env.SARVAM_API_KEY, ...(init.headers || {}) },
      signal: controller.signal,
    });
    const body = await res.text();
    if (!res.ok) {
      throw new SpeechError(`Sarvam ${pathname} failed (${res.status}): ${body.slice(0, 200)}`, res.status >= 500 || res.status === 429);
    }
    return JSON.parse(body);
  } catch (err: any) {
    if (err instanceof SpeechError) throw err;
    throw new SpeechError(`Sarvam ${pathname} request failed: ${err?.name === "AbortError" ? "timeout" : err?.message}`, true);
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Speech-to-text
// ---------------------------------------------------------------------------

export interface Transcription {
  english: string; // translate mode: English text used for parsing
  languageCode?: string; // detected spoken language
}

/** Transcribes speech in any supported language straight to English (saaras:v3, translate mode). */
export async function transcribeToEnglish(audio: Buffer, mimeType: string, languageHint?: string): Promise<Transcription> {
  const form = new FormData();
  const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("ogg") ? "ogg" : mimeType.includes("mpeg") ? "mp3" : "wav";
  form.append("file", new Blob([audio], { type: mimeType }), `speech.${ext}`);
  form.append("model", "saaras:v3");
  form.append("mode", "translate");
  form.append("language_code", languageHint || "unknown");
  const r = await call("/speech-to-text", { method: "POST", body: form });
  return { english: String(r.transcript || "").trim(), languageCode: r.language_code || undefined };
}

// ---------------------------------------------------------------------------
// Translation (cached)
// ---------------------------------------------------------------------------

let translations: Record<string, string> | null = null;

function loadTranslations(): Record<string, string> {
  if (translations) return translations;
  try {
    translations = JSON.parse(fs.readFileSync(TRANSLATION_FILE, "utf8"));
  } catch {
    translations = {};
  }
  return translations!;
}

function saveTranslations() {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(TRANSLATION_FILE, JSON.stringify(translations, null, 1));
  } catch (err: any) {
    console.warn("[ivr] could not write translation cache:", err.message);
  }
}

export async function translate(text: string, target: string, source = "en-IN"): Promise<string> {
  if (target === source) return text;
  const key = `${source}>${target}:${text}`;
  const cache = loadTranslations();
  if (cache[key]) return cache[key];
  const r = await call("/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: text,
      source_language_code: source,
      target_language_code: target,
      model: "sarvam-translate:v1",
      numerals_format: "international",
    }),
  });
  const out = String(r.translated_text || "").trim();
  if (!out) throw new SpeechError("Translation returned empty text", true);
  cache[key] = out;
  saveTranslations();
  return out;
}

/** Typed answers in the simulator: convert to English for the parsers (mayura detects the language). */
export async function translateToEnglish(text: string): Promise<{ english: string; languageCode?: string }> {
  if (/^[\x00-\x7F]*$/.test(text)) return { english: text }; // already Latin script
  const r = await call("/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: text, source_language_code: "auto", target_language_code: "en-IN", model: "mayura:v1" }),
  });
  return { english: String(r.translated_text || "").trim(), languageCode: r.source_language_code || undefined };
}

// ---------------------------------------------------------------------------
// Text-to-speech (cached WAV files)
// ---------------------------------------------------------------------------

export function audioId(text: string, languageCode: string): string {
  const speaker = env.IVR_TTS_SPEAKER || "shubh";
  return crypto.createHash("sha256").update(`bulbul:v3|${speaker}|${TTS_SAMPLE_RATE}|${languageCode}|${text}`).digest("hex");
}

export function audioPath(id: string): string | undefined {
  if (!/^[0-9a-f]{64}$/.test(id)) return undefined;
  const p = path.join(AUDIO_DIR, `${id}.wav`);
  return fs.existsSync(p) ? p : undefined;
}

/** Returns the cache ID of a WAV file with the spoken text, synthesising it if needed. */
export async function synthesize(text: string, languageCode: string): Promise<string> {
  const id = audioId(text, languageCode);
  if (audioPath(id)) return id;
  const r = await call("/text-to-speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      language_code: languageCode,
      model: "bulbul:v3",
      speaker: env.IVR_TTS_SPEAKER || "shubh",
      speech_sample_rate: TTS_SAMPLE_RATE,
      output_audio_codec: "wav",
    }),
  });
  const b64 = Array.isArray(r.audios) ? r.audios.join("") : "";
  if (!b64) throw new SpeechError("Text-to-speech returned no audio", true);
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.writeFileSync(path.join(AUDIO_DIR, `${id}.wav`), Buffer.from(b64, "base64"));
  return id;
}
