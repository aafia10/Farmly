/**
 * Minimal Twilio Voice support without the SDK: webhook signature validation, TwiML generation
 * and recording download. See https://www.twilio.com/docs/usage/webhooks/webhooks-security and
 * https://www.twilio.com/docs/voice/twiml/record.
 */
import crypto from "crypto";
import { env } from "../config/env";
import type { RenderedPrompt, TurnOutput } from "./ivrService";

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
      `${prompts}<Record action="${url("turn")}" method="POST" timeout="3" maxLength="25" playBeep="false" trim="trim-silence" finishOnKey="0123456789*#"/>` +
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
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${recordingUrl}.wav`, { headers: { Authorization: `Basic ${auth}` } });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (res.status !== 404) throw new Error(`Recording download failed (${res.status})`);
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
  throw new Error("Recording was not ready in time");
}
