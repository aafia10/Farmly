/**
 * IVR orchestration shared by Twilio calls and the simulator: feeds caller input into the dialog
 * engine, performs the actions it requests (farmer lookup, lot registration, helper transfer,
 * callback requests), renders prompts in the caller's language and persists every turn.
 *
 * Duplicate protection: a session reserves its Batch ID before the lot insert, the insert never
 * overwrites, and the Batch ID is announced only after the backend returned the stored lot.
 */
import crypto from "crypto";
import { AuthUser } from "../types";
import { env } from "../config/env";
import { supabase, supabaseAdmin } from "../config/supabase";
import { createLotRecord, LotInput } from "../services/lotService";
import { CollectedFields, DialogEvent, DialogResult, DialogState, Expect, FarmerInfo, Utterance, initialState, step } from "./dialog";
import { DEFAULT_LANGUAGE, enabledLanguages, getLanguage } from "./languages";
import { PromptId, UNTRANSLATED_PROMPTS, renderPrompt } from "./script";
import { normalizeMobile } from "./parsers";
import * as speech from "./speech";
import { CallRecord, IvrStore, Turn, getStore } from "./store";

const RESUME_WINDOW_MS = 24 * 60 * 60 * 1000;
const BATCH_TOKEN = "#BATCH#";

export interface RenderedPrompt {
  id: PromptId;
  text: string; // in the caller's language when translation is available
  english: string;
  language: string; // language code of `text`
  ttsLanguage: string;
  audioId?: string; // cached WAV (Sarvam TTS)
}

export interface TurnOutput {
  say: RenderedPrompt[];
  expect: Expect;
  end: boolean;
  transferTo?: string; // helper phone number (Twilio <Dial>)
}

export type CallerInput =
  | { kind: "speech"; english: string; original?: string; detectedLanguage?: string }
  | { kind: "digits"; digits: string }
  | { kind: "noInput" }
  | { kind: "sttError"; message: string }
  | { kind: "transferFailed" };

export interface FarmerMatch extends FarmerInfo {
  helperName?: string | null;
}

export interface IvrDeps {
  store: IvrStore;
  findFarmerByMobile(mobile: string): Promise<FarmerMatch | null>;
  findHelperPhone(helperId: string): Promise<string | null>;
  lotExists(id: string): Promise<boolean>;
  createLot(input: LotInput, actor: AuthUser | undefined): Promise<{ lot: any; created: boolean }>;
  speech: {
    configured(): boolean;
    translate(text: string, target: string): Promise<string>;
    synthesize(text: string, language: string): Promise<string>;
  };
  allowPartialLanguages: boolean;
  now(): Date;
}

// ---------------------------------------------------------------------------
// Default dependencies (Supabase + Sarvam)
// ---------------------------------------------------------------------------

function db() {
  return supabaseAdmin || supabase;
}

export const defaultDeps = (): IvrDeps => ({
  store: getStore(),
  async findFarmerByMobile(mobile) {
    const { data, error } = await db()
      .from("farmers")
      .select("id, name, mobile, village, district, state, assisted_by_helper_id")
      .ilike("mobile", `%${mobile}`)
      .limit(5);
    if (error) throw new Error(`Farmer lookup failed: ${error.message}`);
    const row = (data || []).find((f: any) => normalizeMobile(f.mobile) === mobile);
    if (!row) return null;
    let helperName: string | null = null;
    if (row.assisted_by_helper_id) {
      const { data: p } = await db().from("profiles").select("full_name").eq("id", row.assisted_by_helper_id).maybeSingle();
      helperName = p?.full_name ?? null;
    }
    return {
      registryId: row.id,
      name: row.name,
      village: row.village,
      district: row.district,
      state: row.state,
      helperId: row.assisted_by_helper_id,
      helperName,
    };
  },
  async findHelperPhone(helperId) {
    const { data } = await db().from("profiles").select("phone").eq("id", helperId).maybeSingle();
    return data?.phone || null;
  },
  async lotExists(id) {
    const { data, error } = await db().from("batches").select("id").eq("id", id).maybeSingle();
    if (error) throw new Error(`Batch lookup failed: ${error.message}`);
    return Boolean(data);
  },
  createLot: (input, actor) => createLotRecord(input, actor, { insertOnly: true }),
  speech: {
    configured: speech.speechConfigured,
    translate: (text, target) => speech.translate(text, target),
    synthesize: (text, language) => speech.synthesize(text, language),
  },
  allowPartialLanguages: !/^(0|false|no|off)$/i.test(env.IVR_ENABLE_PARTIAL_LANGUAGES || "true"),
  now: () => new Date(),
});

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export function createIvrService(deps: IvrDeps) {
  const locks = new Map<string, Promise<unknown>>();

  /** Serialises work per session so concurrent webhooks/retries can't double-submit. */
  function withLock<T>(id: string, fn: () => Promise<T>): Promise<T> {
    const prev = locks.get(id) || Promise.resolve();
    const run = prev.catch(() => undefined).then(fn);
    locks.set(id, run);
    run.finally(() => {
      if (locks.get(id) === run) locks.delete(id);
    });
    return run;
  }

  const allowedLanguages = () => enabledLanguages(deps.allowPartialLanguages).map((l) => l.code);

  async function render(u: Utterance, state: DialogState, rec: CallRecord): Promise<RenderedPrompt> {
    const lang = getLanguage(u.fixedLanguage || state.language || DEFAULT_LANGUAGE)!;
    const batch = u.vars?.batch !== undefined ? String(u.vars.batch) : undefined;
    const vars = batch !== undefined ? { ...u.vars, batch: BATCH_TOKEN } : u.vars;
    const english = renderPrompt(u.id, vars);
    const fill = (t: string) => (batch === undefined ? t : t.includes(BATCH_TOKEN) ? t.replace(BATCH_TOKEN, batch) : `${t} ${batch}`);
    const out: RenderedPrompt = { id: u.id, text: fill(english), english: fill(english), language: "en-IN", ttsLanguage: "en-IN" };

    if (UNTRANSLATED_PROMPTS.includes(u.id)) {
      out.language = lang.code;
      out.ttsLanguage = lang.ttsCode;
    } else if (lang.promptLanguage !== "en-IN" && deps.speech.configured()) {
      try {
        out.text = fill(await deps.speech.translate(english, lang.promptLanguage));
        out.language = lang.promptLanguage;
        out.ttsLanguage = lang.ttsCode;
      } catch (err: any) {
        rec.lastError = `Translation failed, used English: ${err.message}`;
      }
    } else if (lang.promptLanguage === "en-IN") {
      out.ttsLanguage = lang.ttsCode;
    }

    if (deps.speech.configured()) {
      try {
        out.audioId = await deps.speech.synthesize(out.text, out.ttsLanguage);
      } catch (err: any) {
        rec.lastError = `Text-to-speech failed: ${err.message}`;
      }
    }
    return out;
  }

  function toEvent(input: CallerInput): DialogEvent {
    switch (input.kind) {
      case "speech":
        return input.english.trim() ? { type: "speech", text: input.english, detectedLanguage: input.detectedLanguage } : { type: "noInput" };
      case "digits":
        return { type: "digits", digits: input.digits };
      case "noInput":
        return { type: "noInput" };
      case "sttError":
        return { type: "sttError" };
      case "transferFailed":
        return { type: "transferUnavailable" };
    }
  }

  function actorFor(rec: CallRecord): AuthUser | undefined {
    if (!rec.helperId) return undefined;
    return { id: rec.helperId, fullName: rec.helperName || "Field Helper", email: "", mobile: "", role: "helper" };
  }

  /** Creates the lot exactly once for this session. Returns the confirmed Batch ID. */
  async function register(rec: CallRecord, fields: CollectedFields, actor: AuthUser | undefined): Promise<string> {
    if (rec.batchId) return rec.batchId;
    const farmer = rec.state.farmer;
    if (!farmer) throw new Error("No identified farmer on this session");
    if (!fields.crop || !fields.quantity || !fields.unit || !fields.harvestDate || !fields.location) {
      throw new Error("Lot details are incomplete");
    }

    if (!rec.pendingBatchId) {
      for (let i = 0; i < 5 && !rec.pendingBatchId; i++) {
        const candidate = `LT-${crypto.randomInt(100000, 1000000)}`;
        if (!(await deps.lotExists(candidate))) rec.pendingBatchId = candidate;
      }
      if (!rec.pendingBatchId) throw new Error("Could not reserve a Batch ID");
      await deps.store.save(rec); // persist the reservation before inserting
    }

    const { lot } = await deps.createLot(
      {
        id: rec.pendingBatchId,
        farmerId: farmer.registryId,
        farmerName: farmer.name,
        crop: fields.crop,
        variety: fields.variety || "Standard",
        quantity: fields.quantity,
        unit: fields.unit,
        qualityGrade: "Standard", // farmer-declared by phone; graded later at collection
        location: fields.location,
        harvestDate: fields.harvestDate,
      },
      actor
    );
    if (!lot?.id) throw new Error("Backend did not confirm the lot");
    rec.batchId = lot.id;
    rec.lastError = null;
    await deps.store.save(rec);

    try {
      await deps.store.recordSubmission({
        callId: rec.id,
        farmerPhone: rec.phone,
        fields,
        turns: rec.turns,
        helperId: actor?.id,
        batchId: lot.id,
      });
    } catch (err: any) {
      // The lot exists; a missing audit row must not make the farmer register twice.
      console.warn("[ivr] submission log failed:", err.message);
    }
    return lot.id;
  }

  /** Runs one caller event through the dialog, performing actions until it waits for the caller. */
  async function drive(rec: CallRecord, first: DialogEvent): Promise<TurnOutput> {
    let event: DialogEvent | undefined = first;
    const utterances: Array<{ u: Utterance; state: DialogState }> = [];
    let expect: Expect = "none";
    let ended = false;
    let transferTo: string | undefined;

    for (let guard = 0; event && guard < 6; guard++) {
      const prevStep = rec.state.step;
      const r: DialogResult = step(rec.state, event, { allowedLanguages: allowedLanguages() });
      event = undefined;
      rec.state = r.state;
      rec.language = r.state.language ?? rec.language;
      utterances.push(...r.say.map((u) => ({ u, state: r.state })));
      expect = r.expect;
      ended = Boolean(r.end);

      // Accepted a resume: reuse the earlier session's reserved Batch ID so nothing is created twice.
      if (prevStep === "resume" && r.state.step !== "resume" && r.state.fields.crop && rec.resumeOf) {
        const earlier = await deps.store.get(rec.resumeOf);
        if (earlier?.pendingBatchId && !rec.pendingBatchId) rec.pendingBatchId = earlier.pendingBatchId;
        if (earlier && earlier.status !== "completed") {
          earlier.status = "ended";
          earlier.outcome = "resumed";
          await deps.store.save(earlier);
        }
      }

      const a = r.action;
      if (!a) break;
      if (a.type === "identify") {
        let farmer: FarmerMatch | null = null;
        if (a.mobile) {
          try {
            farmer = await deps.findFarmerByMobile(a.mobile);
          } catch (err: any) {
            rec.lastError = err.message;
          }
        }
        let resumeFields: CollectedFields | null = null;
        if (farmer) {
          rec.farmerRegistryId = farmer.registryId;
          if (rec.source === "twilio" && farmer.helperId) {
            rec.helperId = farmer.helperId;
            rec.helperName = farmer.helperName ?? null;
          }
          const since = new Date(deps.now().getTime() - RESUME_WINDOW_MS).toISOString();
          const earlier = await deps.store.findResumable(farmer.registryId, rec.id, since);
          if (earlier) {
            resumeFields = earlier.state.fields;
            rec.resumeOf = earlier.id;
          }
        }
        event = { type: "identified", farmer, resumeFields };
      } else if (a.type === "submit") {
        try {
          const batchId = await register(rec, rec.state.fields, actorFor(rec));
          event = { type: "submitted", batchId };
        } catch (err: any) {
          rec.lastError = `Registration failed: ${err.message}`;
          event = { type: "submitFailed" };
        }
      } else if (a.type === "transfer") {
        const phone = rec.source === "twilio" && rec.helperId ? await deps.findHelperPhone(rec.helperId).catch(() => null) : null;
        if (phone) {
          // Stays in progress until Twilio reports the dial result (see transferResult).
          transferTo = phone;
          expect = "none";
        } else {
          event = { type: "transferUnavailable" };
        }
      } else if (a.type === "callback") {
        rec.callbackRequested = true;
        rec.callbackReason = a.reason;
      }
    }

    const say: RenderedPrompt[] = [];
    for (const { u, state } of utterances) say.push(await render(u, state, rec));
    for (const p of say) rec.turns.push({ at: deps.now().toISOString(), role: "agent", text: p.text, english: p.english, language: p.language });

    if (ended) rec.status = statusFor(rec.state.outcome);
    return { say, expect, end: ended, transferTo };
  }

  function statusFor(outcome: DialogState["outcome"]): CallRecord["status"] {
    switch (outcome) {
      case "registered":
        return "completed";
      case "failed":
        return "failed";
      case "transferred":
        return "transferred";
      case "stopped":
        return "ended";
      default:
        return "callback";
    }
  }

  return {
    deps,

    async start(opts: { source: CallRecord["source"]; callerNumber: string; callSid?: string; helper?: AuthUser }) {
      if (opts.callSid) {
        const existing = await deps.store.getByCallSid(opts.callSid);
        if (existing) return { record: existing, output: await this.replay(existing) };
      }
      const rec = await deps.store.create({
        callSid: opts.callSid ?? null,
        source: opts.source,
        phone: opts.callerNumber,
        status: "in_progress",
        state: initialState(),
        turns: [],
        callbackRequested: false,
        helperId: opts.helper?.id ?? null,
        helperName: opts.helper?.fullName ?? null,
      });
      return withLock(rec.id, async () => {
        const output = await drive(rec, { type: "start", callerNumber: opts.callerNumber });
        await deps.store.save(rec);
        return { record: rec, output };
      });
    },

    /** Re-asks the current question (Twilio retried a webhook we already answered). */
    async replay(rec: CallRecord): Promise<TurnOutput> {
      return { say: [], expect: rec.state.step === "mobile" ? "mobile" : rec.status === "in_progress" ? "speech" : "none", end: rec.status !== "in_progress" };
    },

    async handle(id: string, input: CallerInput) {
      return withLock(id, async () => {
        const rec = await deps.store.get(id);
        if (!rec) throw Object.assign(new Error("IVR session not found"), { statusCode: 404 });
        if (rec.status !== "in_progress") {
          return { record: rec, output: { say: [], expect: "none" as Expect, end: true } };
        }
        const turn: Turn = { at: deps.now().toISOString(), role: "caller", text: "" };
        if (input.kind === "speech") Object.assign(turn, { text: input.original || input.english, english: input.english, language: input.detectedLanguage });
        else if (input.kind === "digits") Object.assign(turn, { text: `[keypad ${input.digits}]`, digits: input.digits });
        else if (input.kind === "noInput") turn.text = "[silence]";
        else if (input.kind === "sttError") {
          turn.text = "[speech not recognised]";
          rec.lastError = input.message;
        } else turn.text = "[helper did not answer]";
        rec.turns.push(turn);

        const output = await drive(rec, toEvent(input));
        await deps.store.save(rec);
        return { record: rec, output };
      });
    },

    /** Helper action: retry a registration that failed in the backend (never creates a second lot). */
    async retrySubmission(id: string, actor: AuthUser) {
      return withLock(id, async () => {
        const rec = await deps.store.get(id);
        if (!rec) throw Object.assign(new Error("IVR session not found"), { statusCode: 404 });
        if (rec.batchId) return rec;
        if (rec.state.outcome !== "failed") {
          throw Object.assign(new Error("Only confirmed registrations that failed can be retried"), { statusCode: 409 });
        }
        if (!rec.helperId) {
          rec.helperId = actor.id;
          rec.helperName = actor.fullName;
        }
        try {
          await register(rec, rec.state.fields, actor);
          rec.state = { ...rec.state, outcome: "registered" };
          rec.status = "completed";
          rec.turns.push({ at: deps.now().toISOString(), role: "agent", text: `[helper ${actor.fullName} retried: lot ${rec.batchId} registered]` });
        } catch (err: any) {
          rec.lastError = `Retry failed: ${err.message}`;
        }
        await deps.store.save(rec);
        return rec;
      });
    },

    /** Twilio <Dial> finished: either the helper took the call, or we continue the dialog. */
    async transferResult(id: string, answered: boolean) {
      if (!answered) return this.handle(id, { kind: "transferFailed" });
      return withLock(id, async () => {
        const rec = await deps.store.get(id);
        if (!rec) throw Object.assign(new Error("IVR session not found"), { statusCode: 404 });
        rec.state = { ...rec.state, step: "done", outcome: "transferred" };
        rec.status = "transferred";
        rec.turns.push({ at: deps.now().toISOString(), role: "agent", text: "[call transferred to helper]" });
        await deps.store.save(rec);
        return { record: rec, output: { say: [], expect: "none" as Expect, end: true } };
      });
    },

    /** Twilio status callback: a call that ended mid-dialog stays resumable for 24 hours. */
    async callEnded(callSid: string, durationSeconds?: number) {
      const rec = await deps.store.getByCallSid(callSid);
      if (!rec) return;
      await withLock(rec.id, async () => {
        const fresh = (await deps.store.get(rec.id))!;
        if (durationSeconds !== undefined) fresh.durationSeconds = durationSeconds;
        if (fresh.status === "in_progress") {
          fresh.status = "abandoned";
          fresh.turns.push({ at: deps.now().toISOString(), role: "caller", text: "[caller hung up]" });
        }
        await deps.store.save(fresh);
      });
    },
  };
}

export type IvrService = ReturnType<typeof createIvrService>;

let service: IvrService | undefined;
export function getIvrService(): IvrService {
  if (!service) service = createIvrService(defaultDeps());
  return service;
}
