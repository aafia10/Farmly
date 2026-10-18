/**
 * IVR dialog engine: a pure state machine shared by real Twilio calls and the local simulator.
 * It decides what to say and what to collect next; side effects (looking up or registering the
 * farmer, creating a lot or crop availability, transferring the call) are requested through
 * `action` and performed by ivrService, which reports the result back as an event.
 *
 * One call can register a new farmer and then any number of crop lots / upcoming harvests.
 * Nothing is submitted until the caller confirms the read-back.
 */
import { DEFAULT_LANGUAGE, LANGUAGE_MENU_1, LANGUAGE_MENU_2, getLanguage, languageFromSpokenName } from "./languages";
import {
  AvailField,
  COMMAND_INTENTS,
  Intent,
  RegField,
  Unit,
  cleanFreeText,
  isSkip,
  normalizeMobile,
  parseAvailFieldChoice,
  parseCrop,
  parseFarmingCategory,
  parseFieldChoice,
  parseFpo,
  parseHarvestDate,
  parseIntent,
  parseName,
  parsePlace,
  parseQuantity,
  parseRegFieldChoice,
  parseState,
  parseTask,
  parseUnit,
  parseVariety,
  parseYesNo,
} from "./parsers";
import type { PromptId } from "./script";

export type Task = "register" | "lot" | "availability";
export type SubmitKind = "lot" | "availability";

export type Step =
  | "language"
  | "languageMenu2"
  | "identifying"
  | "mobile"
  | "notRegistered"
  | "regMobileConfirm"
  | "regMobile"
  | "regName"
  | "regVillage"
  | "regTaluka"
  | "regDistrict"
  | "regState"
  | "regCategory"
  | "regFpo"
  | "regFpoName"
  | "regConsent"
  | "regReadback"
  | "regChangeWhich"
  | "registering"
  | "menu"
  | "menuAgain"
  | "resume"
  | "crop"
  | "cropConfirm"
  | "variety"
  | "quantity"
  | "unit"
  | "harvest"
  | "locationConfirm"
  | "location"
  | "notes"
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

/** Answers for a crop lot or an upcoming harvest. */
export interface CollectedFields {
  crop?: string;
  variety?: string | null; // null = farmer doesn't know
  varietyAsked?: boolean;
  quantity?: number;
  unit?: Unit;
  harvestDate?: string; // YYYY-MM-DD
  harvested?: boolean;
  location?: string;
  notes?: string | null; // upcoming harvest only
  notesAsked?: boolean;
}

/** Answers for a new farmer profile (same fields as the helper "Register farmer" form). */
export interface RegistrationFields {
  mobile?: string;
  name?: string;
  village?: string;
  taluka?: string | null;
  talukaAsked?: boolean;
  district?: string;
  state?: string;
  category?: string;
  fpo?: string | null;
  fpoAsked?: boolean;
  consent?: boolean;
}

export interface ResumeSnapshot {
  task: SubmitKind;
  fields: CollectedFields;
}

export interface DialogState {
  step: Step;
  language?: string;
  callerNumber?: string;
  askedMobile?: boolean;
  farmer?: FarmerInfo;
  task?: Task;
  reg: RegistrationFields;
  fields: CollectedFields;
  resume?: ResumeSnapshot;
  completed: { kind: "farmer" | SubmitKind; id: string }[];
  pendingCrop?: string;
  pendingQuantity?: number;
  editing?: boolean;
  attempts: number; // failed attempts on the current question
  noInputs: number; // consecutive silences
  outcome?: "registered" | "failed" | "unregistered" | "declined" | "callback" | "stopped" | "transferred";
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
  | { type: "registerFarmer" }
  | { type: "submit"; kind: SubmitKind }
  | { type: "transfer" }
  | { type: "callback"; reason: string };

export type DialogEvent =
  | { type: "start"; callerNumber?: string }
  | { type: "speech"; text: string; detectedLanguage?: string }
  | { type: "digits"; digits: string }
  | { type: "noInput" }
  | { type: "sttError" }
  | { type: "identified"; farmer: FarmerInfo | null; resume?: ResumeSnapshot | null }
  | { type: "farmerRegistered"; farmer: FarmerInfo; existing: boolean }
  | { type: "registerFailed" }
  | { type: "submitted"; kind: SubmitKind; id: string }
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
  return { step: "language", reg: {}, fields: {}, completed: [], attempts: 0, noInputs: 0 };
}

/** "LT-482913" -> "L T 4 8 2 9 1 3" so text-to-speech reads it character by character. */
export function spell(id: string): string {
  return id.replace(/[^A-Za-z0-9]/g, "").split("").join(" ");
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

const UNIT_WORDS: Record<Unit, string> = { kg: "kilograms", quintals: "quintals", tonnes: "tonnes" };

export function profileLocation(farmer?: FarmerInfo): string | undefined {
  if (!farmer) return undefined;
  const parts = [farmer.village, farmer.district].filter((p) => p && String(p).trim());
  return parts.length ? parts.join(", ") : undefined;
}

export function formatDate(isoDate?: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][m - 1];
  return `${d} ${month} ${y}`;
}

const last4 = (mobile?: string) => spell((mobile || "").slice(-4));

function readbackVars(f: CollectedFields): Record<string, string | number> {
  return {
    crop: f.crop || "",
    variety: f.variety || "not known",
    quantity: f.quantity ?? "",
    unit: f.unit ? UNIT_WORDS[f.unit] : "",
    harvest: f.harvested ? `harvested on ${formatDate(f.harvestDate)}` : `expected on ${formatDate(f.harvestDate)}`,
    location: f.location || "",
    notes: f.notes || "none",
  };
}

function regReadbackVars(r: RegistrationFields): Record<string, string | number> {
  return {
    name: r.name || "",
    last4: last4(r.mobile),
    village: r.village || "",
    taluka: r.taluka || "not given",
    district: r.district || "",
    state: r.state || "",
    category: r.category || "",
    fpo: r.fpo || "none",
  };
}

function question(state: DialogState): Utterance[] {
  const f = state.fields;
  const avail = state.task === "availability";
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
    case "notRegistered":
      return [{ id: "notRegisteredOffer" }];
    case "regMobileConfirm":
      return [{ id: "regConfirmMobile", vars: { last4: last4(normalizeMobile(state.callerNumber)) } }];
    case "regMobile":
      return [{ id: "askRegMobile" }];
    case "regName":
      return [{ id: "askName" }];
    case "regVillage":
      return [{ id: "askVillage" }];
    case "regTaluka":
      return [{ id: "askTaluka" }];
    case "regDistrict":
      return [{ id: "askDistrict" }];
    case "regState":
      return [{ id: "askState" }];
    case "regCategory":
      return [{ id: "askCategory" }];
    case "regFpo":
      return [{ id: "askFpo" }];
    case "regFpoName":
      return [{ id: "askFpoName" }];
    case "regConsent":
      return [{ id: "askConsent" }];
    case "regReadback":
      return [{ id: "regReadback", vars: regReadbackVars(state.reg) }];
    case "regChangeWhich":
      return [{ id: "regAskWhichChange" }];
    case "menu":
      return [{ id: "mainMenu" }];
    case "menuAgain":
      return [{ id: "menuAgain" }];
    case "resume":
      return [{ id: "askResume", vars: { crop: state.resume?.fields.crop || "a crop" } }];
    case "crop":
      return [{ id: avail ? "askAvailCrop" : "askCrop" }];
    case "cropConfirm":
      return [{ id: "confirmUnknownCrop", vars: { crop: state.pendingCrop || "" } }];
    case "variety":
      return [{ id: "askVariety", vars: { crop: f.crop || "the crop" } }];
    case "quantity":
      return [{ id: avail ? "askAvailQuantity" : "askQuantity", vars: { crop: f.crop || "the crop" } }];
    case "unit":
      return [{ id: "askUnit", vars: { number: state.pendingQuantity ?? "" } }];
    case "harvest":
      return [{ id: avail ? "askExpectedHarvest" : "askHarvest" }];
    case "locationConfirm":
      return [{ id: "askLocationConfirm", vars: { location: profileLocation(state.farmer) || "" } }];
    case "location":
      return [{ id: "askLocation" }];
    case "notes":
      return [{ id: "askNotes" }];
    case "readback":
      return [{ id: avail ? "availReadback" : "readback", vars: readbackVars(f) }];
    case "changeWhich":
      return [{ id: avail ? "availAskWhichChange" : "askWhichChange" }];
    default:
      return [];
  }
}

function expectFor(step: Step): Expect {
  if (step === "mobile" || step === "regMobile") return "mobile";
  if (step === "identifying" || step === "registering" || step === "submitting" || step === "done") return "none";
  return "speech";
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

/** Next registration question, given what has been collected. */
function nextRegStep(state: DialogState): Step {
  const r = state.reg;
  if (!r.mobile) return normalizeMobile(state.callerNumber) ? "regMobileConfirm" : "regMobile";
  if (state.editing && r.name && r.village && r.talukaAsked && r.district && r.state && r.category && r.fpoAsked && r.consent) return "regReadback";
  if (!r.name) return "regName";
  if (!r.village) return "regVillage";
  if (!r.talukaAsked) return "regTaluka";
  if (!r.district) return "regDistrict";
  if (!r.state) return "regState";
  if (!r.category) return "regCategory";
  if (!r.fpoAsked) return "regFpo";
  if (!r.consent) return "regConsent";
  return "regReadback";
}

/** Next crop question for a lot or an upcoming harvest. */
function nextCropStep(state: DialogState): Step {
  const f = state.fields;
  const avail = state.task === "availability";
  const complete = f.crop && f.quantity && f.unit && f.harvestDate && f.location && (!avail || f.notesAsked);
  if (state.editing && complete) return "readback";
  if (!f.crop) return "crop";
  if (!f.varietyAsked) return "variety";
  if (!f.quantity || !f.unit) return "quantity";
  if (!f.harvestDate) return "harvest";
  if (!f.location) return profileLocation(state.farmer) ? "locationConfirm" : "location";
  if (avail && !f.notesAsked) return "notes";
  return "readback";
}

function nextStep(state: DialogState): Step {
  if (state.task === "register") return nextRegStep(state);
  if (state.task === "lot" || state.task === "availability") return nextCropStep(state);
  return state.completed.length ? "menuAgain" : "menu";
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

/** Outcome when the caller leaves normally: registered if anything was registered on this call. */
const doneOutcome = (state: DialogState): DialogState["outcome"] => (state.completed.length ? "registered" : "stopped");

function retry(state: DialogState, lead: PromptId): DialogResult {
  const attempts = state.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    return end({ ...state, attempts }, [{ id: "handOffCallback" }], state.completed.length ? "registered" : "callback", {
      type: "callback",
      reason: `Could not understand answer at step ${state.step}`,
    });
  }
  return { state: { ...state, attempts }, say: [{ id: lead }, ...question(state)], expect: expectFor(state.step) };
}

function startTask(state: DialogState, task: Task, prefix: Utterance[] = []): DialogResult {
  const s: DialogState = { ...state, task, fields: {}, editing: false, pendingCrop: undefined, pendingQuantity: undefined };
  if (task === "register") return advance({ ...s, reg: {} }, [...prefix, { id: "regIntro" }]);
  return advance(s, prefix);
}

function handleIntent(state: DialogState, intent: Intent): DialogResult | undefined {
  switch (intent) {
    case "repeat":
      return { state, say: question(state), expect: expectFor(state.step) };
    case "startOver":
      if (!state.task) return goTo(state, nextStep(state), [{ id: "startOver" }]);
      return startTask(state, state.task, [{ id: "startOver" }]);
    case "stop":
      return end(state, [{ id: state.completed.length ? "goodbye" : "stopped" }], doneOutcome(state));
    case "helper":
      return { state, say: [{ id: "connectingHelper" }], expect: "none", action: { type: "transfer" } };
    case "faqWhat":
    case "faqPrice":
    case "faqPayment":
    case "faqPrivacy":
    case "faqCertificate":
    case "faqCost":
    case "faqDocuments":
      return { state, say: [{ id: intent }, ...question(state)], expect: expectFor(state.step) };
  }
  return undefined;
}

function chooseLanguage(state: DialogState, code: string): DialogResult {
  const lang = getLanguage(code)!;
  const next = { ...state, language: lang.code, step: "identifying" as Step, attempts: 0, noInputs: 0 };
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
  /** Today's date, for harvest-date checks (tests pass a fixed date). */
  today?: Date;
}

export function step(state: DialogState, event: DialogEvent, opts: DialogOptions): DialogResult {
  // ----- Events that are not answers --------------------------------------
  if (event.type === "start") {
    const s: DialogState = { ...initialState(), callerNumber: event.callerNumber };
    return { state: s, say: question(s), expect: "speech" };
  }

  if (event.type === "identified") {
    if (event.farmer) {
      const s: DialogState = { ...state, farmer: event.farmer, task: undefined };
      const greeting: Utterance = { id: "farmerFound", vars: { name: event.farmer.name.split(" ")[0] } };
      if (event.resume?.fields.crop) return goTo({ ...s, resume: event.resume }, "resume", [greeting]);
      return goTo(s, "menu", [greeting]);
    }
    // Not registered under this number: offer registration on the call.
    return goTo(state, "notRegistered");
  }

  if (event.type === "farmerRegistered") {
    const s: DialogState = {
      ...state,
      farmer: event.farmer,
      task: undefined,
      editing: false,
      completed: event.existing ? state.completed : [...state.completed, { kind: "farmer", id: event.farmer.registryId }],
    };
    const say: Utterance[] = event.existing
      ? [{ id: "regMobileTaken" }, { id: "farmerFound", vars: { name: event.farmer.name.split(" ")[0] } }]
      : [{ id: "farmerRegistered", vars: { farmerId: spell(event.farmer.registryId) } }];
    return goTo(s, "menu", say);
  }
  if (event.type === "registerFailed") {
    return end(state, [{ id: "registerFailed" }], "failed", { type: "callback", reason: "Farmer registration failed in the backend" });
  }

  if (event.type === "submitted") {
    const s: DialogState = {
      ...state,
      task: undefined,
      fields: {},
      editing: false,
      completed: [...state.completed, { kind: event.kind, id: event.id }],
    };
    const say: Utterance =
      event.kind === "lot" ? { id: "registered", vars: { batch: spell(event.id) } } : { id: "availabilityRecorded", vars: { ref: spell(event.id) } };
    return goTo(s, "menuAgain", [say]);
  }
  if (event.type === "submitFailed") {
    return end(state, [{ id: "submitFailed" }], "failed", { type: "callback", reason: "Registration failed in the backend" });
  }
  if (event.type === "transferUnavailable") {
    return { state, say: [{ id: "noHelper" }, ...question(state)], expect: expectFor(state.step), action: { type: "callback", reason: "Farmer asked for the helper" } };
  }

  if (event.type === "sttError") {
    return end(state, [{ id: "speechUnavailable" }], state.completed.length ? "registered" : "callback", { type: "callback", reason: "Speech recognition unavailable" });
  }

  if (event.type === "noInput") {
    if (state.step === "language" && state.noInputs + 1 >= MAX_NO_INPUT) return chooseLanguage(state, DEFAULT_LANGUAGE);
    const noInputs = state.noInputs + 1;
    if (noInputs > MAX_NO_INPUT) {
      if (state.step === "menuAgain") return end({ ...state, noInputs }, [{ id: "goodbye" }], doneOutcome(state));
      return end({ ...state, noInputs }, [{ id: "handOffCallback" }], state.completed.length ? "registered" : "callback", {
        type: "callback",
        reason: `No answer at step ${state.step}`,
      });
    }
    return { state: { ...state, noInputs }, say: [{ id: "noInput" }, ...question(state)], expect: expectFor(state.step) };
  }

  // ----- Answers (speech or keypad) ----------------------------------------
  const s: DialogState = { ...state, noInputs: 0 };
  const text = event.type === "speech" ? event.text : "";
  const digits = event.type === "digits" ? event.digits : "";

  // Commands first: stop, repeat, start again, talk to a person.
  if (text && s.step !== "language" && s.step !== "languageMenu2") {
    const intent = parseIntent(text);
    if (intent && COMMAND_INTENTS.includes(intent)) {
      const r = handleIntent(s, intent);
      if (r) return r;
    }
  }

  const tryFaq = (): DialogResult | undefined => {
    const intent = text ? parseIntent(text) : undefined;
    return intent ? handleIntent(s, intent) : undefined;
  };
  const yesNo = (): "yes" | "no" | undefined => (digits === "1" ? "yes" : digits === "2" ? "no" : text ? parseYesNo(text) : undefined);
  const setReg = (patch: Partial<RegistrationFields>) => advance({ ...s, reg: { ...s.reg, ...patch } });
  const setFields = (patch: Partial<CollectedFields>) => advance({ ...s, fields: { ...s.fields, ...patch } });

  switch (s.step) {
    // ----- Language -------------------------------------------------------
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

    // ----- Identification ---------------------------------------------------
    case "mobile": {
      const mobile = normalizeMobile(digits || text);
      if (!mobile) return retry(s, "notUnderstood");
      return { state: { ...s, step: "identifying", askedMobile: true }, say: [], expect: "none", action: { type: "identify", mobile, source: "keypad" } };
    }

    case "notRegistered": {
      if (digits === "2" && !s.askedMobile) return goTo(s, "mobile");
      if (text && /\b((different|another|other) (number|mobile)|already registered)\b/i.test(text) && !s.askedMobile) return goTo(s, "mobile");
      const yn = digits === "1" ? "yes" : digits === "2" ? "no" : text ? parseYesNo(text) : undefined;
      if (yn === "yes") return startTask(s, "register");
      if (yn === "no") return end(s, [{ id: "notRegisteredDeclined" }], "unregistered", { type: "callback", reason: "Caller is not registered and declined phone registration" });
      return tryFaq() ?? retry(s, "yesNoAgain");
    }

    // ----- New farmer registration -------------------------------------------
    case "regMobileConfirm": {
      const yn = yesNo();
      if (yn === "yes") return setReg({ mobile: normalizeMobile(s.callerNumber) });
      if (yn === "no") return goTo(s, "regMobile");
      return tryFaq() ?? retry(s, "yesNoAgain");
    }

    case "regMobile": {
      const mobile = normalizeMobile(digits || text);
      if (!mobile) return retry(s, "notUnderstood");
      return setReg({ mobile });
    }

    case "regName": {
      const faq = tryFaq();
      if (faq) return faq;
      const name = parseName(text);
      return name ? setReg({ name }) : retry(s, "notUnderstood");
    }

    case "regVillage":
    case "regDistrict": {
      const faq = tryFaq();
      if (faq) return faq;
      const place = parsePlace(text);
      if (!place) return retry(s, "notUnderstood");
      return setReg(s.step === "regVillage" ? { village: place } : { district: place });
    }

    case "regTaluka": {
      if (isSkip(text)) return setReg({ taluka: null, talukaAsked: true });
      const faq = tryFaq();
      if (faq) return faq;
      const place = parsePlace(text);
      return place ? setReg({ taluka: place, talukaAsked: true }) : retry(s, "notUnderstood");
    }

    case "regState": {
      const st = parseState(text);
      if (st) return setReg({ state: st });
      return tryFaq() ?? retry(s, "stateInvalid");
    }

    case "regCategory": {
      const category = parseFarmingCategory(text);
      if (category) return setReg({ category });
      return tryFaq() ?? retry(s, "notUnderstood");
    }

    case "regFpo":
    case "regFpoName": {
      if (s.step === "regFpo" && digits === "2") return setReg({ fpo: null, fpoAsked: true });
      const faq = tryFaq();
      if (faq) return faq;
      const r = parseFpo(text);
      if (r) return setReg({ fpo: r.fpo, fpoAsked: true });
      if (s.step === "regFpo" && (digits === "1" || parseYesNo(text) === "yes")) return goTo(s, "regFpoName");
      return retry(s, "notUnderstood");
    }

    case "regConsent": {
      const yn = yesNo();
      if (yn === "yes") return setReg({ consent: true });
      if (yn === "no") return end(s, [{ id: "consentDeclined" }], "declined", { type: "callback", reason: "Caller did not give consent for registration" });
      return tryFaq() ?? retry(s, "yesNoAgain");
    }

    case "regReadback": {
      const yn = yesNo();
      if (yn === "yes") return { state: { ...s, step: "registering", attempts: 0 }, say: [], expect: "none", action: { type: "registerFarmer" } };
      if (yn === "no") return goTo(s, "regChangeWhich");
      return tryFaq() ?? retry(s, "yesNoAgain");
    }

    case "regChangeWhich": {
      const field: RegField | undefined = parseRegFieldChoice(text);
      if (!field) return retry(s, "notUnderstood");
      const reg = { ...s.reg };
      if (field === "mobile") delete reg.mobile;
      if (field === "name") delete reg.name;
      if (field === "village") delete reg.village;
      if (field === "taluka") delete reg.talukaAsked;
      if (field === "district") delete reg.district;
      if (field === "state") delete reg.state;
      if (field === "category") delete reg.category;
      if (field === "fpo") delete reg.fpoAsked;
      const next: DialogState = { ...s, reg, editing: true };
      // Changing the mobile always asks for the keypad entry.
      return goTo(next, field === "mobile" ? "regMobile" : nextRegStep(next));
    }

    // ----- Menu -------------------------------------------------------------
    case "menu":
    case "menuAgain": {
      const task = digits === "1" ? "lot" : digits === "2" ? "availability" : digits === "3" ? "finish" : text ? parseTask(text) : undefined;
      if (task === "lot" || task === "availability") return startTask(s, task);
      if (task === "finish") return end(s, [{ id: "goodbye" }], doneOutcome(s));
      return tryFaq() ?? retry(s, s.step === "menuAgain" ? "menuAgainHelp" : "notUnderstood");
    }

    case "resume": {
      const yn = yesNo();
      if (yn === "yes" && s.resume) return advance({ ...s, task: s.resume.task, fields: { ...s.resume.fields }, resume: undefined });
      if (yn === "no") return goTo({ ...s, resume: undefined }, "menu");
      return tryFaq() ?? retry(s, "yesNoAgain");
    }

    // ----- Crop lot / upcoming harvest ----------------------------------------
    case "crop": {
      const { crop, heard } = parseCrop(text);
      if (crop) return setFields({ crop });
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
      return setFields({ variety: v.variety, varietyAsked: true });
    }

    case "quantity": {
      const q = parseQuantity(text);
      if (q.kind === "ok") return setFields({ quantity: q.quantity, unit: q.unit });
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
      const h = parseHarvestDate(text, opts.today);
      if (h.kind === "ok") {
        if (s.task === "availability" && h.harvested && h.date < isoToday(opts.today)) return retry(s, "availPastDate");
        return setFields({ harvestDate: h.date, harvested: s.task === "availability" ? false : h.harvested });
      }
      if (h.kind === "invalid") return retry(s, "harvestInvalid");
      return tryFaq() ?? retry(s, "harvestInvalid");
    }

    case "locationConfirm": {
      const yn = yesNo();
      if (yn === "yes") return setFields({ location: profileLocation(s.farmer) });
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
      return setFields({ location });
    }

    case "notes": {
      if (digits === "2" || isSkip(text)) return setFields({ notes: null, notesAsked: true });
      const faq = tryFaq();
      if (faq) return faq;
      const notes = cleanFreeText(text.replace(/^(yes|haan|ha)[,\s]*/i, ""));
      return notes.length >= 2 ? setFields({ notes, notesAsked: true }) : retry(s, "notUnderstood");
    }

    case "readback": {
      const yn = yesNo();
      if (yn === "yes") {
        return { state: { ...s, step: "submitting", attempts: 0 }, say: [], expect: "none", action: { type: "submit", kind: s.task === "availability" ? "availability" : "lot" } };
      }
      if (yn === "no") return goTo(s, "changeWhich");
      return tryFaq() ?? retry(s, "yesNoAgain");
    }

    case "changeWhich": {
      const field: AvailField | undefined = s.task === "availability" ? parseAvailFieldChoice(text) : parseFieldChoice(text);
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
      if (field === "notes") delete fields.notesAsked;
      const next: DialogState = { ...s, fields, editing: true };
      return goTo(next, field === "location" ? "location" : nextCropStep(next));
    }

    default:
      return { state: s, say: [], expect: "none" };
  }
}

function isoToday(today = new Date()): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
