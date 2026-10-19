/**
 * IVR orchestration shared by Twilio calls and the simulator: feeds caller input into the dialog
 * engine, performs the actions it requests (farmer lookup, farmer / lot / upcoming-harvest
 * registration, helper transfer, callback requests), renders prompts in the caller's language and
 * persists every turn.
 *
 * Every confirmed registration becomes a SubmissionEntry holding the exact JSON body the website's
 * helper forms send. Its record ID is reserved before the insert, the insert never overwrites, and
 * the ID is announced only after the backend returned the stored record — so retries, duplicate
 * webhooks and resumed calls never create a second farmer, lot or harvest record.
 */
import crypto from "crypto";
import { AuthUser } from "../types";
import { env } from "../config/env";
import { supabase, supabaseAdmin } from "../config/supabase";
import { createLotRecord, LotInput } from "../services/lotService";
import { createFarmerRecord, FarmerInput } from "../services/farmerService";
import { createCropAvailabilityRecord, CropAvailabilityInput } from "../services/cropAvailabilityService";
import { DialogEvent, DialogResult, DialogState, Expect, FarmerInfo, ResumeSnapshot, SubmitKind, Utterance, initialState, step } from "./dialog";
import { DEFAULT_LANGUAGE, enabledLanguages, getLanguage } from "./languages";
import { PromptId, UNTRANSLATED_PROMPTS, VERBATIM_VARS, renderPrompt } from "./script";
import { normalizeMobile } from "./parsers";
import * as speech from "./speech";
import { CallRecord, IvrStore, SubmissionEntry, SubmissionKind, Turn, getStore } from "./store";

const RESUME_WINDOW_MS = 24 * 60 * 60 * 1000;
const ID_PREFIX: Record<SubmissionKind, string> = { farmer: "FM", lot: "LT", availability: "CA" };

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
  /** Helper account phone registrations are filed under when no helper ran the call (IVR_HELPER_ID). */
  findDefaultHelper(): Promise<{ id: string; name: string } | null>;
  recordExists(kind: SubmissionKind, id: string): Promise<boolean>;
  createFarmer(input: FarmerInput, actor: AuthUser | undefined): Promise<{ farmer: any; created: boolean }>;
  createLot(input: LotInput, actor: AuthUser | undefined): Promise<{ lot: any; created: boolean }>;
  createAvailability(input: CropAvailabilityInput, actor: AuthUser | undefined): Promise<{ availability: any; created: boolean }>;
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

const TABLE: Record<SubmissionKind, string> = { farmer: "farmers", lot: "batches", availability: "crop_availabilities" };

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
    return { registryId: row.id, name: row.name, village: row.village, district: row.district, state: row.state, helperId: row.assisted_by_helper_id, helperName };
  },
  async findHelperPhone(helperId) {
    const { data } = await db().from("profiles").select("phone").eq("id", helperId).maybeSingle();
    return data?.phone || null;
  },
  async findDefaultHelper() {
    if (!env.IVR_HELPER_ID) return null;
    const { data } = await db().from("profiles").select("id, full_name").eq("id", env.IVR_HELPER_ID).maybeSingle();
    return data ? { id: data.id, name: data.full_name } : null;
  },
  async recordExists(kind, id) {
    const { data, error } = await db().from(TABLE[kind]).select("id").eq("id", id).maybeSingle();
    if (error) throw new Error(`ID check failed: ${error.message}`);
    return Boolean(data);
  },
  createFarmer: (input, actor) => createFarmerRecord(input, actor, { insertOnly: true }),
  // Anchoring (Pinata + Sepolia) runs after the call turn: a webhook cannot wait for a block.
  createLot: (input, actor) => createLotRecord(input, actor, { insertOnly: true, anchor: "background" }),
  createAvailability: (input, actor) => createCropAvailabilityRecord(input, actor, { insertOnly: true }),
  speech: {
    configured: speech.speechConfigured,
    translate: (text, target) => speech.translate(text, target),
    synthesize: (text, language) => speech.synthesize(text, language),
  },
  allowPartialLanguages: !/^(0|false|no|off)$/i.test(env.IVR_ENABLE_PARTIAL_LANGUAGES || "true"),
  now: () => new Date(),
});

// ---------------------------------------------------------------------------
// JSON bodies (identical to what the website's helper forms POST)
// ---------------------------------------------------------------------------

export function farmerPayload(state: DialogState, id: string): FarmerInput & { id: string } {
  const r = state.reg;
  return {
    id,
    name: r.name!,
    mobile: r.mobile!,
    village: r.village!,
    taluka: r.taluka || "",
    district: r.district!,
    state: r.state!,
    language: getLanguage(state.language)?.name || "Hindi",
    farmingCategory: r.category || "Crops",
    fpo: r.fpo || null,
    consent: true, // asked explicitly on the call; registration stops without it
    verificationLevel: "Basic", // self-declared by phone until a helper verifies in the field
    status: "Active",
  };
}

export function lotPayload(state: DialogState, id: string): LotInput & { id: string } {
  const f = state.fields;
  return {
    id,
    farmerId: state.farmer!.registryId,
    farmerName: state.farmer!.name,
    crop: f.crop!,
    variety: f.variety || "Standard",
    quantity: f.quantity!,
    unit: f.unit!,
    qualityGrade: f.grade || "Standard", // farmer-declared by phone; checked again at collection
    location: f.location!,
    harvestDate: f.harvestDate!,
    weighmentScaleId: f.scaleId ?? null, // null = not weighed yet
    cropCategory: f.cropCategory || null,
    farmingMethod: f.farmingMethod || null,
    organicCertified: f.farmingMethod === "Organic" ? Boolean(f.organicCertified) : null,
    sowingDate: f.sowingDate || null,
    pricePerKg: f.pricePerKg || null,
  };
}

export function availabilityPayload(state: DialogState, id: string): CropAvailabilityInput & { id: string } {
  const f = state.fields;
  return {
    id,
    farmerId: state.farmer!.registryId,
    farmerName: state.farmer!.name,
    crop: f.crop!,
    variety: f.variety || "Not specified",
    estimatedQuantity: f.quantity!,
    unit: f.unit!,
    expectedHarvestDate: f.harvestDate!,
    location: f.location!,
    notes: f.notes || null,
    cropCategory: f.cropCategory || null,
    farmingMethod: f.farmingMethod || null,
    organicCertified: f.farmingMethod === "Organic" ? Boolean(f.organicCertified) : null,
    sowingDate: f.sowingDate || null,
    expectedPricePerKg: f.pricePerKg || null,
  };
}

function validatePayload(kind: SubmissionKind, p: Record<string, any>): string | undefined {
  const required: Record<SubmissionKind, string[]> = {
    farmer: ["name", "mobile", "village", "district", "state"],
    lot: ["farmerId", "farmerName", "crop", "quantity", "unit", "location", "harvestDate"],
    availability: ["farmerId", "farmerName", "crop", "variety", "estimatedQuantity", "unit", "expectedHarvestDate", "location"],
  };
  const missing = required[kind].filter((k) => p[k] === undefined || p[k] === null || p[k] === "");
  if (missing.length) return `Missing ${missing.join(", ")}`;
  if (kind === "farmer" && !/^\d{10}$/.test(String(p.mobile))) return "Mobile number must be 10 digits";
  if (kind !== "farmer" && !(Number(p.quantity ?? p.estimatedQuantity) > 0)) return "Quantity must be positive";
}

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
    }).catch(() => undefined);
    return run;
  }

  const allowedLanguages = () => enabledLanguages(deps.allowPartialLanguages).map((l) => l.code);

  async function render(u: Utterance, state: DialogState, rec: CallRecord): Promise<RenderedPrompt> {
    const lang = getLanguage(u.fixedLanguage || state.language || DEFAULT_LANGUAGE)!;
    // IDs and digits are read out as given: replace them with tokens the translator leaves alone.
    const verbatim: string[] = [];
    const vars: Record<string, string | number> = { ...(u.vars || {}) };
    for (const key of VERBATIM_VARS) {
      if (vars[key] !== undefined) {
        verbatim.push(String(vars[key]));
        vars[key] = `#V${verbatim.length - 1}#`;
      }
    }
    const english = renderPrompt(u.id, vars);
    const fill = (t: string) => {
      let out = t;
      verbatim.forEach((v, i) => {
        const token = `#V${i}#`;
        out = out.includes(token) ? out.replace(token, v) : `${out} ${v}`;
      });
      return out;
    };
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

  async function actorFor(rec: CallRecord): Promise<AuthUser | undefined> {
    if (!rec.helperId) {
      const fallback = await deps.findDefaultHelper().catch(() => null);
      if (fallback) {
        rec.helperId = fallback.id;
        rec.helperName = fallback.name;
      }
    }
    if (!rec.helperId) return undefined;
    return { id: rec.helperId, fullName: rec.helperName || "Field Helper", email: "", mobile: "", role: "helper" };
  }

  async function reserveId(kind: SubmissionKind): Promise<string> {
    for (let i = 0; i < 6; i++) {
      const candidate = `${ID_PREFIX[kind]}-${crypto.randomInt(100000, 1000000)}`;
      if (!(await deps.recordExists(kind, candidate))) return candidate;
    }
    throw new Error("Could not reserve a record ID");
  }

  /** Returns the open (not yet registered) entry for this kind, creating it with a reserved ID. */
  async function openEntry(rec: CallRecord, kind: SubmissionKind, build: (id: string) => object): Promise<SubmissionEntry> {
    let entry = rec.submissions.find((e) => e.kind === kind && e.status !== "registered");
    if (!entry) {
      const reservedId = await reserveId(kind);
      entry = {
        key: `${kind}-${rec.submissions.filter((e) => e.kind === kind).length + 1}`,
        kind,
        seq: rec.submissions.filter((e) => e.kind === kind).length + 1,
        reservedId,
        payload: build(reservedId) as Record<string, unknown>,
        status: "pending",
        createdAt: deps.now().toISOString(),
      };
      rec.submissions.push(entry);
    } else if (entry.status !== "registered" && rec.state.step !== "done") {
      // Corrected answers on the same call replace the draft body; the reserved ID stays.
      entry.payload = build(entry.reservedId) as Record<string, unknown>;
    }
    await deps.store.save(rec); // persist the reservation before inserting
    return entry;
  }

  /** Sends one entry's JSON body through the shared website service. Never creates a duplicate. */
  async function sendEntry(rec: CallRecord, entry: SubmissionEntry, actor: AuthUser | undefined): Promise<string> {
    if (entry.status === "registered" && entry.recordId) return entry.recordId;
    const invalid = validatePayload(entry.kind, entry.payload as any);
    if (invalid) {
      entry.status = "failed";
      entry.error = invalid;
      throw new Error(invalid);
    }
    try {
      let recordId: string | undefined;
      if (entry.kind === "farmer") recordId = (await deps.createFarmer(entry.payload as any, actor)).farmer?.id;
      else if (entry.kind === "lot") recordId = (await deps.createLot(entry.payload as any, actor)).lot?.id;
      else recordId = (await deps.createAvailability(entry.payload as any, actor)).availability?.id;
      if (!recordId) throw new Error("Backend did not confirm the record");
      entry.status = "registered";
      entry.recordId = recordId;
      entry.error = null;
      entry.registeredAt = deps.now().toISOString();
      rec.lastError = null;
      return recordId;
    } catch (err: any) {
      entry.status = "failed";
      entry.error = err.message;
      throw err;
    } finally {
      await deps.store.save(rec);
      try {
        await deps.store.recordSubmission({ callId: rec.id, farmerPhone: rec.phone, turns: rec.turns, helperId: actor?.id, entry });
      } catch (err: any) {
        // The record (if created) exists; a missing audit row must not make the farmer register twice.
        console.warn("[ivr] submission log failed:", err.message);
      }
    }
  }

  async function registerFarmer(rec: CallRecord): Promise<DialogEvent> {
    const mobile = rec.state.reg.mobile!;
    // A farmer already registered with this number is recognised, never registered twice.
    const existing = await deps.findFarmerByMobile(mobile).catch(() => null);
    if (existing) {
      rec.farmerRegistryId = existing.registryId;
      return { type: "farmerRegistered", farmer: existing, existing: true };
    }
    const actor = await actorFor(rec);
    const entry = await openEntry(rec, "farmer", (id) => farmerPayload(rec.state, id));
    const id = await sendEntry(rec, entry, actor);
    const p = entry.payload as any;
    rec.farmerRegistryId = id;
    return {
      type: "farmerRegistered",
      farmer: { registryId: id, name: p.name, village: p.village, district: p.district, state: p.state, helperId: actor?.id ?? null },
      existing: false,
    };
  }

  async function submit(rec: CallRecord, kind: SubmitKind): Promise<DialogEvent> {
    const actor = await actorFor(rec);
    const entry = await openEntry(rec, kind, (id) => (kind === "lot" ? lotPayload(rec.state, id) : availabilityPayload(rec.state, id)));
    const id = await sendEntry(rec, entry, actor);
    return { type: "submitted", kind, id };
  }

  /** Runs one caller event through the dialog, performing actions until it waits for the caller. */
  async function drive(rec: CallRecord, first: DialogEvent): Promise<TurnOutput> {
    let event: DialogEvent | undefined = first;
    const utterances: Array<{ u: Utterance; state: DialogState }> = [];
    let expect: Expect = "none";
    let ended = false;
    let transferTo: string | undefined;

    for (let guard = 0; event && guard < 8; guard++) {
      const prevStep = rec.state.step;
      const r: DialogResult = step(rec.state, event, { allowedLanguages: allowedLanguages(), today: deps.now() });
      event = undefined;
      rec.state = r.state;
      rec.language = r.state.language ?? rec.language;
      utterances.push(...r.say.map((u) => ({ u, state: r.state })));
      expect = r.expect;
      ended = Boolean(r.end);

      // Accepted a resume: carry over the earlier session's reserved ID so nothing is created twice.
      if (prevStep === "resume" && r.state.task && r.state.fields.crop && rec.resumeOf) {
        const earlier = await deps.store.get(rec.resumeOf);
        const kind = r.state.task as SubmissionKind;
        const reserved = earlier?.submissions.find((e) => e.kind === kind && e.status !== "registered");
        if (reserved && !rec.submissions.some((e) => e.kind === kind && e.status !== "registered")) {
          rec.submissions.push({ ...reserved, key: `${kind}-1`, seq: 1, status: "pending" });
        }
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
        let resume: ResumeSnapshot | null = null;
        if (farmer) {
          rec.farmerRegistryId = farmer.registryId;
          if (rec.source === "twilio" && farmer.helperId) {
            rec.helperId = farmer.helperId;
            rec.helperName = farmer.helperName ?? null;
          }
          const since = new Date(deps.now().getTime() - RESUME_WINDOW_MS).toISOString();
          const earlier = await deps.store.findResumable(farmer.registryId, rec.id, since);
          if (earlier) {
            resume = { task: earlier.state.task as SubmitKind, fields: earlier.state.fields };
            rec.resumeOf = earlier.id;
          }
        }
        event = { type: "identified", farmer, resume };
      } else if (a.type === "registerFarmer") {
        try {
          event = await registerFarmer(rec);
        } catch (err: any) {
          rec.lastError = `Farmer registration failed: ${err.message}`;
          event = { type: "registerFailed" };
        }
      } else if (a.type === "submit") {
        try {
          event = await submit(rec, a.kind);
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

    // Translate and synthesise all reply prompts at once: the caller is waiting.
    const say: RenderedPrompt[] = await Promise.all(utterances.map(({ u, state }) => render(u, state, rec)));
    for (const p of say) rec.turns.push({ at: deps.now().toISOString(), role: "agent", text: p.text, english: p.english, language: p.language });

    if (ended) {
      rec.status = statusFor(rec.state.outcome);
      rec.outcome = rec.state.outcome ?? null;
    }
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
        return "callback"; // unregistered, declined, callback
    }
  }

  return {
    deps,

    async start(opts: { source: CallRecord["source"]; callerNumber: string; callSid?: string; helper?: AuthUser }) {
      if (opts.callSid) {
        const existing = await deps.store.getByCallSid(opts.callSid);
        if (existing) return { record: existing, output: this.replay(existing) };
      }
      const rec = await deps.store.create({
        callSid: opts.callSid ?? null,
        source: opts.source,
        phone: opts.callerNumber,
        status: "in_progress",
        state: initialState(),
        turns: [],
        submissions: [],
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

    /** Twilio retried a webhook we already answered: keep listening without repeating actions. */
    replay(rec: CallRecord): TurnOutput {
      const live = rec.status === "in_progress";
      const expect: Expect = !live ? "none" : rec.state.step === "mobile" || rec.state.step === "regMobile" ? "mobile" : "speech";
      return { say: [], expect, end: !live };
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

    /** Helper action: resend failed registrations (same reserved IDs, so never a second record). */
    async retrySubmission(id: string, actor: AuthUser, key?: string) {
      return withLock(id, async () => {
        const rec = await deps.store.get(id);
        if (!rec) throw Object.assign(new Error("IVR session not found"), { statusCode: 404 });
        const open = rec.submissions.filter((e) => e.status !== "registered" && (!key || e.key === key));
        if (!open.length) {
          if (key) throw Object.assign(new Error("Nothing to retry for this registration"), { statusCode: 409 });
          return rec;
        }
        if (!rec.helperId) {
          rec.helperId = actor.id;
          rec.helperName = actor.fullName;
        }
        // A farmer must exist before their lots: retry in the order they were confirmed.
        for (const entry of open.sort((a, b) => (a.kind === "farmer" ? -1 : b.kind === "farmer" ? 1 : 0))) {
          try {
            const recordId = await sendEntry(rec, entry, actor);
            if (entry.kind === "farmer") {
              rec.farmerRegistryId = recordId;
              for (const e of rec.submissions) if (e.kind !== "farmer" && !e.payload.farmerId) e.payload.farmerId = recordId;
            }
            rec.turns.push({ at: deps.now().toISOString(), role: "agent", text: `[helper ${actor.fullName} retried: ${entry.kind} ${recordId} registered]` });
          } catch (err: any) {
            rec.lastError = `Retry failed: ${err.message}`;
            break;
          }
        }
        if (rec.submissions.length && rec.submissions.every((e) => e.status === "registered") && rec.status === "failed") {
          rec.state = { ...rec.state, outcome: "registered" };
          rec.status = "completed";
          rec.outcome = "registered";
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
        rec.outcome = "transferred";
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
