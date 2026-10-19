/**
 * Minimal Twilio Voice support without the SDK: webhook signature validation, TwiML generation
 * and recording download. See https://www.twilio.com/docs/usage/webhooks/webhooks-security and
 * https://www.twilio.com/docs/voice/twiml/record.
 */
import crypto from "crypto";
import { env } from "../config/env";
import type { RenderedPrompt, TurnOutput } from "./ivrService";
import { audioPath, saveAudio } from "./speech";

export function twilioConfigured(): boolean {
  return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.IVR_PUBLIC_BASE_URL);
}

export function publicBase(): string {
  return (env.IVR_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
}

/** X-Twilio-Signature: base64(HMAC-SHA1(authToken, fullUrl + sorted POST params)). */
export function validSignature(fullUrl: string, params: Record<string, unknown>, signature: string | undefined, authToken = env.TWILIO_AUTH_TOKEN): boolean {
  if (!signature || !authToken) return false;
  const data =
    fullUrl +
    Object.keys(params)
      .sort()
      .map((k) => k + (params[k] ?? ""))
      .join("");
  const expected = crypto.createHmac("sha1", authToken).update(Buffer.from(data, "utf8")).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Twilio <Say> fallback voices (used only when Sarvam TTS is unavailable).
const SAY_LANGS = new Set(["en-IN", "hi-IN", "mr-IN", "gu-IN", "bn-IN", "ta-IN", "te-IN", "kn-IN", "ml-IN", "pa-IN"]);

function speak(p: RenderedPrompt): string {
  if (p.audioId) return `<Play>${esc(`${publicBase()}/api/v1/ivr/audio/${p.audioId}.wav`)}</Play>`;
  const lang = SAY_LANGS.has(p.language) ? p.language : "en-IN";
  const text = lang === p.language ? p.text : p.english;
  return `<Say language="${lang}">${esc(text)}</Say>`;
}

export function twiml(sessionId: string, out: TurnOutput): string {
  const url = (path: string, extra = "") => esc(`${publicBase()}/api/v1/ivr/twilio/${path}?s=${encodeURIComponent(sessionId)}${extra}`);
  const prompts = out.say.map(speak).join("");
  let body: string;
  if (out.transferTo) {
    const callerId = env.TWILIO_PHONE_NUMBER ? ` callerId="${esc(env.TWILIO_PHONE_NUMBER)}"` : "";
    body = `${prompts}<Dial timeout="20"${callerId} action="${url("dial-status")}" method="POST">${esc(out.transferTo)}</Dial>`;
  } else if (out.end) {
    body = `${prompts}<Hangup/>`;
  } else if (out.expect === "mobile") {
    body =
      `<Gather input="dtmf" numDigits="10" timeout="10" action="${url("mobile")}" method="POST">${prompts}</Gather>` +
      `<Redirect method="POST">${url("turn", "&amp;noInput=1")}</Redirect>`;
  } else {
    // Speak, then record the answer. Pressing any key ends the recording and is sent as Digits.
    // If nothing is recorded Twilio skips the action URL, so the Redirect reports silence.
    body =
      `${prompts}<Record action="${url("turn")}" method="POST" timeout="2" maxLength="20" playBeep="true" trim="trim-silence" finishOnKey="0123456789*#"/>` +
      `<Redirect method="POST">${url("turn", "&amp;noInput=1")}</Redirect>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

export function twimlMessage(text: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say language="en-IN">${esc(text)}</Say><Hangup/></Response>`;
}

/** Downloads a call recording as WAV. Twilio may still be processing it, so 404s are retried. */
export async function downloadRecording(recordingUrl: string): Promise<Buffer> {
  const u = new URL(recordingUrl);
  if (u.protocol !== "https:" || !/(^|\.)twilio\.com$/.test(u.hostname)) throw new Error("Unexpected recording host");
  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64");
  // The recording is usually ready within a few hundred ms of the callback: poll quickly first.
  const waits = [150, 250, 350, 500, 700, 900, 1200];
  for (let attempt = 0; attempt <= waits.length; attempt++) {
    const res = await fetch(`${recordingUrl}.wav`, { headers: { Authorization: `Basic ${auth}` } });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (res.status !== 404) throw new Error(`Recording download failed (${res.status})`);
    if (attempt < waits.length) await new Promise((r) => setTimeout(r, waits[attempt]));
  }
  throw new Error("Recording was not ready in time");
}

// ---------------------------------------------------------------------------
// Instant acknowledgement while the answer is processed
// ---------------------------------------------------------------------------

/** Fixed content ID of the acknowledgement tone in the audio cache. */
export const ACK_TONE_ID = crypto.createHash("sha256").update("farmly-ack-tone-v1").digest("hex");

/** A soft two-note chime (8 kHz, 16-bit mono WAV), generated locally: no speech service needed. */
function ackToneWav(): Buffer {
  const rate = 8000;
  const notes = [
    { freq: 784, ms: 90 },
    { freq: 1047, ms: 130 },
  ];
  const samples: number[] = [];
  for (const { freq, ms } of notes) {
    const n = Math.round((rate * ms) / 1000);
    for (let i = 0; i < n; i++) {
      const env = Math.min(1, i / 40, (n - i) / 160); // soft attack and release
      samples.push(Math.round(Math.sin((2 * Math.PI * freq * i) / rate) * 9000 * env));
    }
  }
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(v, i * 2));
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

export function ensureAckTone(): void {
  if (!audioPath(ACK_TONE_ID)) saveAudio(ACK_TONE_ID, ackToneWav());
}

/**
 * Answer heard: play the chime at once and fetch the reply from /turn-result, so the caller
 * never sits in silence (and repeats themselves) while speech is recognised and the reply prepared.
 */
export function ackTwiml(sessionId: string, ticket: string): string {
  ensureAckTone();
  const result = esc(`${publicBase()}/api/v1/ivr/twilio/turn-result?s=${encodeURIComponent(sessionId)}&t=${ticket}`);
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Play>${esc(`${publicBase()}/api/v1/ivr/audio/${ACK_TONE_ID}.wav`)}</Play><Redirect method="POST">${result}</Redirect></Response>`;
}

/** The reply is still being prepared: wait briefly and ask again. */
export function waitTwiml(sessionId: string, ticket: string): string {
  const result = esc(`${publicBase()}/api/v1/ivr/twilio/turn-result?s=${encodeURIComponent(sessionId)}&t=${ticket}`);
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Pause length="1"/><Redirect method="POST">${result}</Redirect></Response>`;
}
