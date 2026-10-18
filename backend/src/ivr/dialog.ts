/**
 * IVR dialog engine: a pure state machine shared by real Twilio calls and the local simulator.
 * It decides what to say and what to collect next; side effects (looking up the farmer, creating
 * the lot, transferring the call) are requested through `action` and performed by ivrService.
 */
import { DEFAULT_LANGUAGE, LANGUAGE_MENU_1, LANGUAGE_MENU_2, getLanguage, languageFromSpokenName } from "./languages";
import {
  COMMAND_INTENTS,
  Field,
  Intent,
  Unit,
  parseCrop,
  parseFieldChoice,
  parseHarvestDate,
  parseIntent,
  parseQuantity,
  parseUnit,
  parseVariety,
  parseYesNo,
  cleanFreeText,
  normalizeMobile,
} from "./parsers";
import type { PromptId } from "./script";

export type Step =
  | "language"
  | "languageMenu2"
  | "identifying"
  | "mobile"
  | "resume"
  | "crop"
  | "cropConfirm"
  | "variety"
  | "quantity"
  | "unit"
  | "harvest"
  | "locationConfirm"
  | "location"
  | "readback"
  | "changeWhich"
  | "submitting"
  | "done";

export interface FarmerInfo {
  registryId: string;
  name: string;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  helperId?: string | null;
}

export interface CollectedFields {
  crop?: string;
  variety?: string | null; // null = farmer doesn't know
  varietyAsked?: boolean;
  quantity?: number;
  unit?: Unit;
  harvestDate?: string; // YYYY-MM-DD
  harvested?: boolean;
  location?: string;
}

export interface DialogState {
  step: Step;
  language?: string;
  callerNumber?: string;
  triedCallerId?: boolean;
  askedMobile?: boolean;
  farmer?: FarmerInfo;
  fields: CollectedFields;
  resumeFields?: CollectedFields;
  pendingCrop?: string;
  pendingQuantity?: number;
  editing?: boolean;
  attempts: number; // failed attempts on the current question
  noInputs: number; // consecutive silences
  outcome?: "registered" | "failed" | "unregistered" | "callback" | "stopped" | "transferred";
}

export interface Utterance {
  id: PromptId;
  vars?: Record<string, string | number>;
  /** Spoken as written, in this language (used before the caller's language is known). */
  fixedLanguage?: string;
}

export type Expect = "speech" | "mobile" | "none";

export type DialogAction =
  | { type: "identify"; mobile: string | undefined; source: "callerId" | "keypad" }
  | { type: "submit" }
  | { type: "transfer" }
  | { type: "callback"; reason: string };

export type DialogEvent =
  | { type: "start"; callerNumber?: string }
  | { type: "speech"; text: string; detectedLanguage?: string }
  | { type: "digits"; digits: string }
  | { type: "noInput" }
  | { type: "sttError" }
  | { type: "identified"; farmer: FarmerInfo | null; resumeFields?: CollectedFields | null }
  | { type: "submitted"; batchId: string }
  | { type: "submitFailed" }
  | { type: "transferUnavailable" };

export interface DialogResult {
  state: DialogState;
  say: Utterance[];
  expect: Expect;
  action?: DialogAction;
  end?: boolean;
}

const MAX_ATTEMPTS = 3;
const MAX_NO_INPUT = 2;

export function initialState(): DialogState {
  return { step: "language", fields: {}, attempts: 0, noInputs: 0 };
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

function question(state: DialogState): Utterance[] {
  const f = state.fields;
  switch (state.step) {
    case "language":
      return [
        { id: "greetingHi", fixedLanguage: "hi-IN" },
        { id: "greetingEn", fixedLanguage: "en-IN" },
      ];
    case "languageMenu2":
      return [{ id: "languageMenu2", fixedLanguage: "en-IN" }];
    case "mobile":
      return [{ id: "askMobile" }];
    case "resume":
      return [{ id: "askResume", vars: { crop: state.resumeFields?.crop || "a crop" } }];
    case "crop":
      return [{ id: "askCrop" }];
    case "cropConfirm":
      return [{ id: "confirmUnknownCrop", vars: { crop: state.pendingCrop || "" } }];
    case "variety":
      return [{ id: "askVariety", vars: { crop: f.crop || "the crop" } }];
    case "quantity":
      return [{ id: "askQuantity", vars: { crop: f.crop || "the crop" } }];
    case "unit":
      return [{ id: "askUnit", vars: { number: state.pendingQuantity ?? "" } }];
    case "harvest":
      return [{ id: "askHarvest" }];
    case "locationConfirm":
      return [{ id: "askLocationConfirm", vars: { location: profileLocation(state.farmer) || "" } }];
    case "location":
      return [{ id: "askLocation" }];
    case "readback":
      return [{ id: "readback", vars: readbackVars(f) }];
    case "changeWhich":
      return [{ id: "askWhichChange" }];
    default:
      return [];
  }
}

function expectFor(step: Step): Expect {
  if (step === "mobile") return "mobile";
  if (step === "identifying" || step === "submitting" || step === "done") return "none";
  return "speech";
}

export function profileLocation(farmer?: FarmerInfo): string | undefined {
  if (!farmer) return undefined;
  const parts = [farmer.village, farmer.district].filter((p) => p && String(p).trim());
  return parts.length ? parts.join(", ") : undefined;
}

const UNIT_WORDS: Record<Unit, string> = { kg: "kilograms", quintals: "quintals", tonnes: "tonnes" };

export function formatDate(isoDate?: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][m - 1];
  return `${d} ${month} ${y}`;
}

function readbackVars(f: CollectedFields): Record<string, string | number> {
  return {
    crop: f.crop || "",
    variety: f.variety || "not known",
    quantity: f.quantity ?? "",
    unit: f.unit ? UNIT_WORDS[f.unit] : "",
    harvest: f.harvested ? `harvested on ${formatDate(f.harvestDate)}` : `expected on ${formatDate(f.harvestDate)}`,
    location: f.location || "",
  };
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

/** The next question to ask, given what has been collected. */
function nextStep(state: DialogState): Step {
  const f = state.fields;
  if (state.editing && f.crop && f.quantity && f.unit && f.harvestDate && f.location) return "readback";
  if (!f.crop) return "crop";
  if (!f.varietyAsked) return "variety";
  if (!f.quantity || !f.unit) return "quantity";
  if (!f.harvestDate) return "harvest";
  if (!f.location) return profileLocation(state.farmer) ? "locationConfirm" : "location";
  return "readback";
}

function goTo(state: DialogState, step: Step, prefix: Utterance[] = []): DialogResult {
  const next = { ...state, step, attempts: 0, noInputs: 0 };
  return { state: next, say: [...prefix, ...question(next)], expect: expectFor(step) };
}

function advance(state: DialogState, prefix: Utterance[] = []): DialogResult {
  return goTo(state, nextStep(state), prefix);
}

function end(state: DialogState, say: Utterance[], outcome: DialogState["outcome"], action?: DialogAction): DialogResult {
  return { state: { ...state, step: "done", outcome }, say, expect: "none", end: true, action };
}

function retry(state: DialogState, lead: PromptId): DialogResult {
  const attempts = state.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    return end({ ...state, attempts }, [{ id: "handOffCallback" }], "callback", { type: "callback", reason: `Could not understand answer at step ${state.step}` });
  }
  return { state: { ...state, attempts }, say: [{ id: lead }, ...question(state)], expect: expectFor(state.step) };
}

function handleIntent(state: DialogState, intent: Intent): DialogResult | undefined {
  switch (intent) {
    case "repeat":
      return { state, say: question(state), expect: expectFor(state.step) };
    case "startOver":
      return advance({ ...state, fields: {}, editing: false, pendingCrop: undefined, pendingQuantity: undefined }, [{ id: "startOver" }]);
    case "stop":
      return end(state, [{ id: "stopped" }], "stopped");
    case "helper":
      return { state, say: [{ id: "connectingHelper" }], expect: "none", action: { type: "transfer" } };
    case "faqWhat":
    case "faqPrice":
    case "faqPayment":
    case "faqPrivacy":
    case "faqCertificate":
      return { state, say: [{ id: intent }, ...question(state)], expect: expectFor(state.step) };
  }
  return undefined;
}

function chooseLanguage(state: DialogState, code: string): DialogResult {
  const lang = getLanguage(code)!;
  const next = { ...state, language: lang.code, step: "identifying" as Step, attempts: 0, noInputs: 0, triedCallerId: true };
  return {
    state: next,
    say: [{ id: "languageChosen", vars: { language: lang.name } }],
    expect: "none",
    action: { type: "identify", mobile: normalizeMobile(state.callerNumber), source: "callerId" },
  };
}

export interface DialogOptions {
  /** Language codes the farmer may choose (partial languages can be disabled). */
  allowedLanguages: string[];
}

export function step(state: DialogState, event: DialogEvent, opts: DialogOptions): DialogResult {
  // ----- Events that are not answers --------------------------------------
  if (event.type === "start") {
    const s: DialogState = { ...initialState(), callerNumber: event.callerNumber };
    return { state: s, say: question(s), expect: "speech" };
  }

  if (event.type === "identified") {
    if (event.farmer) {
      const s: DialogState = { ...state, farmer: event.farmer };
      const greeting: Utterance = { id: "farmerFound", vars: { name: event.farmer.name.split(" ")[0] } };
      if (event.resumeFields && event.resumeFields.crop) {
        return goTo({ ...s, resumeFields: event.resumeFields }, "resume", [greeting]);
      }
      return advance(s, [greeting]);
    }
    // Caller ID didn't match: ask for the registered mobile number once, then give up.
    if (!state.askedMobile) return goTo({ ...state, askedMobile: true }, "mobile");
    return end(state, [{ id: "farmerNotFound" }], "unregistered", { type: "callback", reason: "Caller is not a registered farmer" });
  }

  if (event.type === "submitted") {
    const spelled = event.batchId.replace(/[^A-Za-z0-9]/g, "").split("").join(" ");
    return end(state, [{ id: "registered", vars: { batch: spelled } }], "registered");
  }
  if (event.type === "submitFailed") {
    return end(state, [{ id: "submitFailed" }], "failed", { type: "callback", reason: "Registration failed in the backend" });
  }
  if (event.type === "transferUnavailable") {
    return { state, say: [{ id: "noHelper" }, ...question(state)], expect: expectFor(state.step), action: { type: "callback", reason: "Farmer asked for the helper" } };
  }

  if (event.type === "sttError") {
    return end(state, [{ id: "speechUnavailable" }], "callback", { type: "callback", reason: "Speech recognition unavailable" });
  }

  if (event.type === "noInput") {
    if (state.step === "language" && state.noInputs + 1 >= MAX_NO_INPUT) return chooseLanguage(state, DEFAULT_LANGUAGE);
    const noInputs = state.noInputs + 1;
    if (noInputs > MAX_NO_INPUT) {
      return end({ ...state, noInputs }, [{ id: "handOffCallback" }], "callback", { type: "callback", reason: `No answer at step ${state.step}` });
    }
    return { state: { ...state, noInputs }, say: [{ id: "noInput" }, ...question(state)], expect: expectFor(state.step) };
  }

  // ----- Answers (speech or keypad) ----------------------------------------
  const s: DialogState = { ...state, noInputs: 0 };
  const text = event.type === "speech" ? event.text : "";
  const digits = event.type === "digits" ? event.digits : "";

  // Commands first: stop, repeat, start again, talk to a person.
  if (text) {
    const intent = parseIntent(text);
    if (intent && COMMAND_INTENTS.includes(intent) && s.step !== "language" && s.step !== "languageMenu2") {
      const r = handleIntent(s, intent);
      if (r) return r;
    }
  }

  const tryFaq = (): DialogResult | undefined => {
    const intent = text ? parseIntent(text) : undefined;
    return intent ? handleIntent(s, intent) : undefined;
  };
  const yesNo = (): "yes" | "no" | undefined => (digits === "1" ? "yes" : digits === "2" ? "no" : text ? parseYesNo(text) : undefined);

  switch (s.step) {
    case "language":
    case "languageMenu2": {
      if (digits) {
        if (s.step === "language" && digits === "0") return goTo(s, "languageMenu2");
        const menu = s.step === "language" ? LANGUAGE_MENU_1 : LANGUAGE_MENU_2;
        const code = menu[Number(digits) - 1];
        if (code && opts.allowedLanguages.includes(code)) return chooseLanguage(s, code);
        return retry(s, "notUnderstood");
      }
      const named = languageFromSpokenName(text);
      const detected = event.type === "speech" ? event.detectedLanguage : undefined;
      const code = [named, detected].find((c) => c && opts.allowedLanguages.includes(getLanguage(c)?.code || ""));
      if (code) return chooseLanguage(s, getLanguage(code)!.code);
      if (s.attempts + 1 >= 2) return chooseLanguage(s, DEFAULT_LANGUAGE);
      return retry(s, "notUnderstood");
    }

    case "mobile": {
      const mobile = normalizeMobile(digits || text);
      if (!mobile) return retry(s, "notUnderstood");
      return { state: { ...s, step: "identifying" }, say: [], expect: "none", action: { type: "identify", mobile, source: "keypad" } };
    }

    case "resume": {
      const yn = yesNo();
      if (yn === "yes") return advance({ ...s, fields: { ...s.resumeFields }, resumeFields: undefined });
      if (yn === "no") return advance({ ...s, fields: {}, resumeFields: undefined });
      return tryFaq() ?? retry(s, "yesNoAgain");
    }

    case "crop": {
      const { crop, heard } = parseCrop(text);
      if (crop) return advance({ ...s, fields: { ...s.fields, crop } });
      const faq = tryFaq();
      if (faq) return faq;
      if (heard && heard.length >= 2 && heard.split(" ").length <= 4) return goTo({ ...s, pendingCrop: cleanFreeText(heard) }, "cropConfirm");
      return retry(s, "notUnderstood");
    }

    case "cropConfirm": {
      const yn = yesNo();
      if (yn === "yes") {
        const crop = (s.pendingCrop || "").replace(/\b\w/g, (c) => c.toUpperCase());
        return advance({ ...s, pendingCrop: undefined, fields: { ...s.fields, crop } });
      }
      if (yn === "no") return goTo({ ...s, pendingCrop: undefined }, "crop");
      return retry(s, "yesNoAgain");
    }

    case "variety": {
      const faq = tryFaq();
      if (faq) return faq;
      const v = parseVariety(text);
      if (!v) return retry(s, "notUnderstood");
      return advance({ ...s, fields: { ...s.fields, variety: v.variety, varietyAsked: true } });
    }

    case "quantity": {
      const q = parseQuantity(text);
      if (q.kind === "ok") return advance({ ...s, fields: { ...s.fields, quantity: q.quantity, unit: q.unit } });
      if (q.kind === "needUnit") return goTo({ ...s, pendingQuantity: q.quantity }, "unit");
      if (q.kind === "unsupportedUnit") return retry(s, "quantityUnsupportedUnit");
      if (q.kind === "invalid") return retry(s, "quantityInvalid");
      return tryFaq() ?? retry(s, "notUnderstood");
    }

    case "unit": {
      const unit = parseUnit(text);
      if (unit && s.pendingQuantity) {
        const q = parseQuantity(`${s.pendingQuantity} ${unit}`);
        if (q.kind === "ok") return advance({ ...s, pendingQuantity: undefined, fields: { ...s.fields, quantity: q.quantity, unit: q.unit } });
        return goTo({ ...s, pendingQuantity: undefined }, "quantity", [{ id: "quantityInvalid" }]);
      }
      // The farmer may repeat the whole amount instead.
      const q = parseQuantity(text);
      if (q.kind === "ok") return advance({ ...s, pendingQuantity: undefined, fields: { ...s.fields, quantity: q.quantity, unit: q.unit } });
      return retry(s, "quantityUnsupportedUnit");
    }

    case "harvest": {
      const h = parseHarvestDate(text);
      if (h.kind === "ok") return advance({ ...s, fields: { ...s.fields, harvestDate: h.date, harvested: h.harvested } });
      if (h.kind === "invalid") return retry(s, "harvestInvalid");
      return tryFaq() ?? retry(s, "harvestInvalid");
    }

    case "locationConfirm": {
      const yn = yesNo();
      if (yn === "yes") return advance({ ...s, fields: { ...s.fields, location: profileLocation(s.farmer) } });
      if (yn === "no") return goTo(s, "location");
      return tryFaq() ?? retry(s, "yesNoAgain");
    }

    case "location": {
      const faq = tryFaq();
      if (faq) return faq;
      const place = cleanFreeText(text);
      if (place.length < 2) return retry(s, "notUnderstood");
      const district = s.farmer?.district;
      const location = district && !place.toLowerCase().includes(district.toLowerCase()) ? `${place}, ${district}` : place;
      return advance({ ...s, fields: { ...s.fields, location } });
    }

    case "readback": {
      const yn = yesNo();
      if (yn === "yes") return { state: { ...s, step: "submitting", attempts: 0 }, say: [], expect: "none", action: { type: "submit" } };
      if (yn === "no") return goTo(s, "changeWhich");
      return tryFaq() ?? retry(s, "yesNoAgain");
    }

    case "changeWhich": {
      const field: Field | undefined = parseFieldChoice(text);
      if (!field) return retry(s, "notUnderstood");
      const fields = { ...s.fields };
      if (field === "crop") delete fields.crop;
      if (field === "variety") delete fields.varietyAsked;
      if (field === "quantity") {
        delete fields.quantity;
        delete fields.unit;
      }
      if (field === "harvest") delete fields.harvestDate;
      if (field === "location") delete fields.location;
      const next: DialogState = { ...s, fields, editing: true };
      return goTo(next, field === "location" ? "location" : nextStep(next));
    }

    default:
      return { state: s, say: [], expect: "none" };
  }
}
