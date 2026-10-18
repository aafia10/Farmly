import { Request, Response, NextFunction } from "express";
import { getIvrService, CallerInput, TurnOutput } from "../ivr/ivrService";
import { CallRecord } from "../ivr/store";
import { IVR_LANGUAGES, enabledLanguages } from "../ivr/languages";
import { audioPath, speechConfigured, transcribeToEnglish, translateToEnglish } from "../ivr/speech";
import { downloadRecording, publicBase, twiml, twilioConfigured, twimlMessage, validSignature } from "../ivr/twilio";
import { toUuid } from "../utils/uuid";
import { AuthUser } from "../types";

const helperKey = (u: AuthUser) => toUuid(u.id) || u.id;

function canSee(rec: CallRecord, user: AuthUser): boolean {
  return user.role === "admin" || rec.source === "twilio" || rec.helperId === helperKey(user);
}

function sessionDto(rec: CallRecord) {
  return {
    id: rec.id,
    source: rec.source,
    phone: rec.phone,
    status: rec.status,
    step: rec.state.step,
    language: rec.language,
    farmer: rec.state.farmer ? { registryId: rec.state.farmer.registryId, name: rec.state.farmer.name } : null,
    fields: rec.state.fields,
    outcome: rec.state.outcome ?? rec.outcome ?? null,
    task: rec.state.task ?? null,
    registration: rec.state.reg,
    submissions: rec.submissions,
    batchId: [...rec.submissions].reverse().find((s) => s.kind === "lot" && s.recordId)?.recordId ?? null,
    farmerId: rec.farmerRegistryId ?? null,
    callbackRequested: rec.callbackRequested,
    callbackReason: rec.callbackReason ?? null,
    lastError: rec.lastError ?? null,
    helperName: rec.helperName ?? null,
    canRetry: rec.submissions.some((s) => s.status !== "registered") && rec.status !== "in_progress",
    turns: rec.turns,
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
  };
}

function sayDto(out: TurnOutput) {
  return {
    say: out.say.map((p) => ({
      text: p.text,
      english: p.english,
      language: p.language,
      audioUrl: p.audioId ? `/api/v1/ivr/audio/${p.audioId}.wav` : null,
    })),
    expect: out.expect,
    end: out.end,
  };
}

/** Transcribes once, retrying a transient failure once before giving up. */
async function transcribe(audio: Buffer, mime: string, hint?: string): Promise<CallerInput> {
  for (let attempt = 0; ; attempt++) {
    try {
      const t = await transcribeToEnglish(audio, mime, hint);
      return { kind: "speech", english: t.english, detectedLanguage: t.languageCode };
    } catch (err: any) {
      if (attempt >= 1 || err?.retryable === false) return { kind: "sttError", message: err.message };
    }
  }
}

function sttHint(rec: CallRecord | null): string | undefined {
  return rec && rec.state.language && rec.state.step !== "language" && rec.state.step !== "languageMenu2" ? rec.state.language : undefined;
}

const sendTwiml = (res: Response, xml: string) => res.type("text/xml").send(xml);

export const ivrController = {
  // ------------------------------------------------------------------ Twilio
  /** Rejects webhooks that are not signed by Twilio with our auth token. */
  twilioGuard(req: Request, res: Response, next: NextFunction): void {
    if (!twilioConfigured()) {
      res.status(503).type("text/xml").send(twimlMessage("This number is not configured yet. Please try again later."));
      return;
    }
    const url = `${publicBase()}${req.originalUrl}`;
    if (!validSignature(url, req.body || {}, req.header("X-Twilio-Signature"))) {
      res.status(403).send("Invalid Twilio signature");
      return;
    }
    next();
  },

  async twilioVoice(req: Request, res: Response): Promise<void> {
    try {
      const { record, output } = await getIvrService().start({
        source: "twilio",
        callerNumber: String(req.body.From || ""),
        callSid: String(req.body.CallSid || "") || undefined,
      });
      sendTwiml(res, twiml(record.id, output));
    } catch (err: any) {
      console.error("[ivr] voice webhook:", err.message);
      sendTwiml(res, twimlMessage("Sorry, we cannot take your call right now. Please call again later."));
    }
  },

  async twilioTurn(req: Request, res: Response): Promise<void> {
    const id = String(req.query.s || "");
    const service = getIvrService();
    try {
      let input: CallerInput;
      const digits = String(req.body.Digits || "");
      if (req.query.noInput) input = { kind: "noInput" };
      else if (/^[0-9*#]+$/.test(digits)) input = { kind: "digits", digits: digits.replace(/#$/, "") || "#" };
      else if (req.body.RecordingUrl) {
        const rec = await service.deps.store.get(id);
        try {
          const audio = await downloadRecording(String(req.body.RecordingUrl));
          input = await transcribe(audio, "audio/wav", sttHint(rec));
        } catch (err: any) {
          input = { kind: "sttError", message: err.message };
        }
      } else input = { kind: "noInput" };
      const { output } = await service.handle(id, input);
      sendTwiml(res, twiml(id, output));
    } catch (err: any) {
      console.error("[ivr] turn webhook:", err.message);
      sendTwiml(res, twimlMessage("Sorry, something went wrong. A Farmly helper will call you back."));
    }
  },

  async twilioMobile(req: Request, res: Response): Promise<void> {
    const id = String(req.query.s || "");
    try {
      const digits = String(req.body.Digits || "");
      const { output } = await getIvrService().handle(id, digits ? { kind: "digits", digits } : { kind: "noInput" });
      sendTwiml(res, twiml(id, output));
    } catch (err: any) {
      console.error("[ivr] mobile webhook:", err.message);
      sendTwiml(res, twimlMessage("Sorry, something went wrong. A Farmly helper will call you back."));
    }
  },

  async twilioDialStatus(req: Request, res: Response): Promise<void> {
    const id = String(req.query.s || "");
    try {
      const answered = String(req.body.DialCallStatus || "") === "completed";
      const { output } = await getIvrService().transferResult(id, answered);
      sendTwiml(res, twiml(id, output));
    } catch (err: any) {
      console.error("[ivr] dial-status webhook:", err.message);
      sendTwiml(res, twimlMessage("Sorry, something went wrong. A Farmly helper will call you back."));
    }
  },

  async twilioStatus(req: Request, res: Response): Promise<void> {
    try {
      const duration = req.body.CallDuration !== undefined ? Number(req.body.CallDuration) : undefined;
      if (req.body.CallSid) await getIvrService().callEnded(String(req.body.CallSid), Number.isFinite(duration) ? duration : undefined);
    } catch (err: any) {
      console.error("[ivr] status webhook:", err.message);
    }
    res.status(204).end();
  },

  /** Cached prompt audio for Twilio <Play> and the simulator. IDs are content hashes. */
  audio(req: Request, res: Response): void {
    const id = String(req.params.file || "").replace(/\.wav$/, "");
    const file = audioPath(id);
    if (!file) {
      res.status(404).end();
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    res.type("audio/wav").sendFile(file);
  },

  // ------------------------------------------------------------------ Helper workspace
  config(req: Request, res: Response): void {
    const enabled = new Set(enabledLanguages(true).map((l) => l.code));
    res.json({
      success: true,
      data: {
        speechConfigured: speechConfigured(),
        twilioConfigured: twilioConfigured(),
        twilioNumber: twilioConfigured() ? process.env.TWILIO_PHONE_NUMBER || null : null,
        languages: IVR_LANGUAGES.filter((l) => enabled.has(l.code)).map((l) => ({
          code: l.code,
          name: l.name,
          nativeName: l.nativeName,
          support: l.support,
          note: l.note ?? null,
        })),
      },
    });
  },

  async listSessions(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const rows = await getIvrService().deps.store.list({ helperId: user.role === "admin" ? undefined : helperKey(user), limit: 50 });
      res.json({ success: true, persistent: getIvrService().deps.store.persistent, data: rows.map(sessionDto) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const rec = await getIvrService().deps.store.get(req.params.id);
      if (!rec || !canSee(rec, req.user!)) {
        res.status(404).json({ success: false, message: "Session not found" });
        return;
      }
      res.json({ success: true, data: sessionDto(rec) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async retry(req: Request, res: Response): Promise<void> {
    try {
      const service = getIvrService();
      const existing = await service.deps.store.get(req.params.id);
      if (!existing || !canSee(existing, req.user!)) {
        res.status(404).json({ success: false, message: "Session not found" });
        return;
      }
      const user = req.user!;
      const key = typeof req.body?.key === "string" ? req.body.key : undefined;
      const rec = await service.retrySubmission(req.params.id, { ...user, id: helperKey(user) }, key);
      const open = rec.submissions.filter((s) => s.status !== "registered");
      res.json({ success: open.length === 0, data: sessionDto(rec), message: open.length ? rec.lastError : "All registrations on this call are complete" });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  },

  // ------------------------------------------------------------------ Simulator
  async simStart(req: Request, res: Response): Promise<void> {
    const callerNumber = String(req.body?.callerNumber || "").trim();
    if (!/^\+?\d{10,13}$/.test(callerNumber.replace(/[\s-]/g, ""))) {
      res.status(400).json({ success: false, message: "Enter the farmer's 10-digit mobile number to simulate the caller" });
      return;
    }
    try {
      const user = req.user!;
      const { record, output } = await getIvrService().start({
        source: "simulator",
        callerNumber: callerNumber.replace(/[\s-]/g, ""),
        helper: { ...user, id: helperKey(user) },
      });
      res.status(201).json({ success: true, data: { session: sessionDto(record), ...sayDto(output) } });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async simTurn(req: Request, res: Response): Promise<void> {
    const service = getIvrService();
    try {
      const rec = await service.deps.store.get(req.params.id);
      const user = req.user!;
      if (!rec || rec.source !== "simulator" || (user.role !== "admin" && rec.helperId !== helperKey(user))) {
        res.status(404).json({ success: false, message: "Simulator session not found" });
        return;
      }
      const b = req.body || {};
      let input: CallerInput;
      if (b.noInput) input = { kind: "noInput" };
      else if (typeof b.digits === "string" && /^[0-9*#]{1,12}$/.test(b.digits)) input = { kind: "digits", digits: b.digits };
      else if (typeof b.audioBase64 === "string" && b.audioBase64) {
        if (!speechConfigured()) {
          res.status(400).json({ success: false, message: "Voice input needs SARVAM_API_KEY. Type the answer instead." });
          return;
        }
        input = await transcribe(Buffer.from(b.audioBase64, "base64"), String(b.mimeType || "audio/webm"), sttHint(rec));
      } else if (typeof b.text === "string" && b.text.trim()) {
        const text = b.text.trim().slice(0, 500);
        if (/^[\x00-\x7F]*$/.test(text)) input = { kind: "speech", english: text, original: text };
        else if (!speechConfigured()) {
          res.status(400).json({ success: false, message: "Answers in Indian scripts need SARVAM_API_KEY for translation. Type in English or romanised text." });
          return;
        } else {
          try {
            const t = await translateToEnglish(text);
            input = { kind: "speech", english: t.english, original: text, detectedLanguage: t.languageCode };
          } catch (err: any) {
            input = { kind: "sttError", message: err.message };
          }
        }
      } else {
        res.status(400).json({ success: false, message: "Send text, digits, audioBase64 or noInput" });
        return;
      }
      const { record, output } = await service.handle(rec.id, input);
      res.json({ success: true, data: { session: sessionDto(record), ...sayDto(output) } });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  },
};
