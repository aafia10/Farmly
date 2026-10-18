/**
 * Persistence for IVR sessions (one per phone call or simulator run). Uses the voicegenie_calls /
 * voicegenie_submissions tables through the service-role client. Without a service-role key it falls
 * back to process memory so the simulator still works locally (sessions are lost on restart).
 */
import crypto from "crypto";
import { supabaseAdmin } from "../config/supabase";
import type { DialogState } from "./dialog";

export type CallStatus = "in_progress" | "completed" | "failed" | "callback" | "ended" | "transferred" | "abandoned";
export type SubmissionKind = "farmer" | "lot" | "availability";

export interface Turn {
  at: string;
  role: "agent" | "caller";
  text: string; // what was said / shown (caller's language)
  english?: string; // English used for parsing (caller) or the source prompt (agent)
  language?: string;
  digits?: string;
}

/**
 * One registration made on a call. `payload` is the exact JSON body the website's helper forms send
 * (POST /farmers, /lots or /crop-availability); `reservedId` is fixed before the insert so a retry
 * can never create a second record.
 */
export interface SubmissionEntry {
  key: string; // `${kind}-${seq}`
  kind: SubmissionKind;
  seq: number;
  reservedId: string;
  payload: Record<string, unknown>;
  status: "pending" | "registered" | "failed";
  recordId?: string | null; // set only after the backend confirmed the record
  error?: string | null;
  createdAt: string;
  registeredAt?: string | null;
}

export interface CallRecord {
  id: string;
  callSid?: string | null;
  source: "twilio" | "simulator";
  phone: string;
  language?: string | null;
  status: CallStatus;
  state: DialogState;
  turns: Turn[];
  submissions: SubmissionEntry[];
  outcome?: string | null;
  farmerRegistryId?: string | null;
  helperId?: string | null; // helper acting on the session (simulator) or assigned to the farmer
  helperName?: string | null;
  callbackRequested: boolean;
  callbackReason?: string | null;
  lastError?: string | null;
  resumeOf?: string | null;
  durationSeconds?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionRow {
  callId: string;
  farmerPhone: string;
  turns: Turn[];
  helperId?: string | null;
  entry: SubmissionEntry;
}

export interface IvrStore {
  readonly persistent: boolean;
  create(rec: Omit<CallRecord, "id" | "createdAt" | "updatedAt">): Promise<CallRecord>;
  get(id: string): Promise<CallRecord | null>;
  getByCallSid(callSid: string): Promise<CallRecord | null>;
  save(rec: CallRecord): Promise<void>;
  list(opts: { helperId?: string; limit?: number }): Promise<CallRecord[]>;
  /** Latest unfinished lot / upcoming-harvest conversation of this farmer since `sinceIso` (for resume). */
  findResumable(farmerRegistryId: string, excludeId: string, sinceIso: string): Promise<CallRecord | null>;
  recordSubmission(row: SubmissionRow): Promise<void>;
}

const RESUMABLE: CallStatus[] = ["in_progress", "abandoned", "failed", "callback"];

export const isResumable = (r: CallRecord) =>
  RESUMABLE.includes(r.status) && (r.state.task === "lot" || r.state.task === "availability") && Boolean(r.state.fields?.crop);

/** Fills defaults for rows written before multi-registration sessions existed. */
function upgradeState(state: any): DialogState {
  return { reg: {}, fields: {}, completed: [], attempts: 0, noInputs: 0, step: "language", ...(state || {}) };
}

// ---------------------------------------------------------------------------
// In-memory (local simulator without a service-role key)
// ---------------------------------------------------------------------------

export class MemoryStore implements IvrStore {
  readonly persistent = false;
  private rows = new Map<string, CallRecord>();
  submissions: SubmissionRow[] = [];

  async create(rec: Omit<CallRecord, "id" | "createdAt" | "updatedAt">): Promise<CallRecord> {
    const now = new Date().toISOString();
    const row: CallRecord = { ...rec, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    this.rows.set(row.id, structuredClone(row));
    return row;
  }
  async get(id: string) {
    const r = this.rows.get(id);
    return r ? structuredClone(r) : null;
  }
  async getByCallSid(callSid: string) {
    for (const r of this.rows.values()) if (r.callSid === callSid) return structuredClone(r);
    return null;
  }
  async save(rec: CallRecord) {
    this.rows.set(rec.id, structuredClone({ ...rec, updatedAt: new Date().toISOString() }));
  }
  async list(opts: { helperId?: string; limit?: number }) {
    return [...this.rows.values()]
      .filter((r) => !opts.helperId || r.source === "twilio" || r.helperId === opts.helperId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, opts.limit ?? 50)
      .map((r) => structuredClone(r));
  }
  async findResumable(farmerRegistryId: string, excludeId: string, sinceIso: string) {
    const rows = [...this.rows.values()]
      .filter((r) => r.farmerRegistryId === farmerRegistryId && r.id !== excludeId && r.createdAt >= sinceIso && isResumable(r))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return rows[0] ? structuredClone(rows[0]) : null;
  }
  async recordSubmission(row: SubmissionRow) {
    const i = this.submissions.findIndex((s) => s.callId === row.callId && s.entry.key === row.entry.key);
    if (i >= 0) this.submissions[i] = structuredClone(row);
    else this.submissions.push(structuredClone(row));
  }
}

// ---------------------------------------------------------------------------
// Supabase (voicegenie_calls / voicegenie_submissions)
// ---------------------------------------------------------------------------

function toRow(r: Partial<CallRecord>) {
  const lastLot = [...(r.submissions || [])].reverse().find((s) => s.kind === "lot" && s.recordId);
  return {
    call_sid: r.callSid ?? null,
    source: r.source,
    phone_number: r.phone,
    language: r.language ?? null,
    status: r.status,
    dialog_state: r.state,
    turns: r.turns,
    submissions: r.submissions ?? [],
    transcript: (r.turns || []).map((t) => `${t.role === "agent" ? "Agent" : "Caller"}: ${t.english || t.text}`).join("\n"),
    structured_intent: { reg: r.state?.reg ?? {}, fields: r.state?.fields ?? {}, helperName: r.helperName ?? null, resumeOf: r.resumeOf ?? null },
    outcome: r.outcome ?? null,
    farmer_registry_id: r.farmerRegistryId ?? null,
    helper_id: r.helperId ?? null,
    callback_requested: r.callbackRequested ?? false,
    callback_reason: r.callbackReason ?? null,
    last_error: r.lastError ?? null,
    batch_id: lastLot?.recordId ?? null,
    call_duration_seconds: r.durationSeconds ?? null,
    updated_at: new Date().toISOString(),
  };
}

function fromRow(row: any): CallRecord {
  const intent = row.structured_intent || {};
  return {
    id: row.id,
    callSid: row.call_sid,
    source: row.source,
    phone: row.phone_number,
    language: row.language,
    status: row.status,
    state: upgradeState(row.dialog_state),
    turns: row.turns || [],
    submissions: row.submissions || [],
    outcome: row.outcome,
    farmerRegistryId: row.farmer_registry_id,
    helperId: row.helper_id,
    helperName: intent.helperName ?? null,
    callbackRequested: Boolean(row.callback_requested),
    callbackReason: row.callback_reason,
    lastError: row.last_error,
    resumeOf: intent.resumeOf ?? null,
    durationSeconds: row.call_duration_seconds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const isUuid = (v?: string | null) => Boolean(v && /^[0-9a-f-]{36}$/i.test(v));

export class SupabaseStore implements IvrStore {
  readonly persistent = true;
  constructor(private db: NonNullable<typeof supabaseAdmin>) {}

  private fail(op: string, error: { message: string }): never {
    throw new Error(`IVR store ${op} failed: ${error.message}`);
  }

  async create(rec: Omit<CallRecord, "id" | "createdAt" | "updatedAt">) {
    const { data, error } = await this.db.from("voicegenie_calls").insert(toRow(rec)).select().single();
    if (error) this.fail("create", error);
    return fromRow(data);
  }
  async get(id: string) {
    if (!isUuid(id)) return null;
    const { data, error } = await this.db.from("voicegenie_calls").select("*").eq("id", id).maybeSingle();
    if (error) this.fail("get", error);
    return data ? fromRow(data) : null;
  }
  async getByCallSid(callSid: string) {
    const { data, error } = await this.db.from("voicegenie_calls").select("*").eq("call_sid", callSid).maybeSingle();
    if (error) this.fail("getByCallSid", error);
    return data ? fromRow(data) : null;
  }
  async save(rec: CallRecord) {
    const { error } = await this.db.from("voicegenie_calls").update(toRow(rec)).eq("id", rec.id);
    if (error) this.fail("save", error);
  }
  async list(opts: { helperId?: string; limit?: number }) {
    let q = this.db.from("voicegenie_calls").select("*").order("created_at", { ascending: false }).limit(opts.limit ?? 50);
    if (opts.helperId) q = q.or(`source.eq.twilio,helper_id.eq.${opts.helperId}`);
    const { data, error } = await q;
    if (error) this.fail("list", error);
    return (data || []).map(fromRow);
  }
  async findResumable(farmerRegistryId: string, excludeId: string, sinceIso: string) {
    const { data, error } = await this.db
      .from("voicegenie_calls")
      .select("*")
      .eq("farmer_registry_id", farmerRegistryId)
      .neq("id", excludeId)
      .gte("created_at", sinceIso)
      .in("status", RESUMABLE)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) this.fail("findResumable", error);
    return (data || []).map(fromRow).find(isResumable) || null;
  }
  async recordSubmission(row: SubmissionRow) {
    const e = row.entry;
    const { error } = await this.db.from("voicegenie_submissions").upsert(
      {
        call_id: row.callId,
        kind: e.kind,
        seq: e.seq,
        farmer_phone: row.farmerPhone,
        raw_payload: { turns: row.turns },
        extracted_crop_data: e.payload,
        status: e.status,
        registered_at: e.registeredAt ?? null,
        record_id: e.recordId ?? null,
        batch_id: e.kind === "lot" ? e.recordId ?? null : null,
        rejection_reason: e.error ?? null,
        helper_id: isUuid(row.helperId) ? row.helperId : null,
      },
      { onConflict: "call_id,kind,seq" }
    );
    if (error) this.fail("recordSubmission", error);
  }
}

let store: IvrStore | undefined;

export function getStore(): IvrStore {
  if (!store) {
    if (supabaseAdmin) store = new SupabaseStore(supabaseAdmin);
    else {
      console.warn("[ivr] SUPABASE_SERVICE_ROLE_KEY not set: IVR sessions are kept in memory only (simulator use).");
      store = new MemoryStore();
    }
  }
  return store;
}
