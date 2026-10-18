// End-to-end IVR flows through ivrService with fake farmer/lot/harvest backends (no network, no database).
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:54321";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "test";

const { createIvrService } = require("../dist/ivr/ivrService");
const { MemoryStore } = require("../dist/ivr/store");
const { validSignature, twiml } = require("../dist/ivr/twilio");

const RAMESH = { registryId: "FMR-MH-000421", name: "Ramesh Patil", mobile: "9876543210", village: "Pimpalgaon", district: "Nashik", state: "Maharashtra", helperId: "e1000000-0000-0000-0000-000000000002", helperName: "Sunita" };
const HELPER = { id: "e1000000-0000-0000-0000-000000000002", fullName: "Sunita", email: "", mobile: "", role: "helper" };

/** Fake backend: farmers / lots / harvests tables that behave like the insert-only services. */
function makeService({ failLots = 0, failFarmers = 0, defaultHelper = null } = {}) {
  const tables = { farmer: new Map([[RAMESH.registryId, RAMESH]]), lot: new Map(), availability: new Map() };
  const failures = { lot: failLots, farmer: failFarmers };
  const calls = { farmer: [], lot: [], availability: [] };
  const insert = (kind, key) => async (input, actor) => {
    calls[kind].push({ input, actor });
    await new Promise((r) => setTimeout(r, 5));
    if (failures[kind] > 0) {
      failures[kind]--;
      throw new Error("database unavailable");
    }
    const table = tables[kind];
    if (table.has(input.id)) return { [key]: table.get(input.id), created: false };
    const row = kind === "farmer" ? { ...input, registryId: input.id } : { ...input };
    table.set(input.id, row);
    return { [key]: row, created: true };
  };
  const deps = {
    store: new MemoryStore(),
    async findFarmerByMobile(mobile) {
      const f = [...tables.farmer.values()].find((x) => x.mobile === mobile);
      return f ? { registryId: f.registryId || f.id, name: f.name, village: f.village, district: f.district, state: f.state, helperId: f.helperId ?? null } : null;
    },
    async findHelperPhone() {
      return null;
    },
    async findDefaultHelper() {
      return defaultHelper;
    },
    async recordExists(kind, id) {
      return tables[kind].has(id);
    },
    createFarmer: insert("farmer", "farmer"),
    createLot: insert("lot", "lot"),
    createAvailability: insert("availability", "availability"),
    speech: { configured: () => false, translate: async (t) => t, synthesize: async () => "x" },
    allowPartialLanguages: true,
    now: () => new Date(),
  };
  return { service: createIvrService(deps), deps, tables, calls };
}

const say = (out) => out.say.map((p) => p.english).join(" ");
const speak = (english) => ({ kind: "speech", english });

async function answerLot(service, id) {
  await service.handle(id, { kind: "digits", digits: "1" }); // menu: crop lot
  await service.handle(id, speak("onion"));
  await service.handle(id, speak("Red onion"));
  await service.handle(id, speak("organic"));
  await service.handle(id, speak("yes")); // certified
  await service.handle(id, speak("4 months ago"));
  await service.handle(id, speak("25 quintals"));
  await service.handle(id, speak("B grade"));
  await service.handle(id, speak("next week"));
  await service.handle(id, speak("yes")); // location from profile
  await service.handle(id, speak("WB NSK 07"));
  return service.handle(id, speak("18 rupees per kilo"));
}

async function startEnglish(service, opts) {
  const { record } = await service.start(opts);
  await service.handle(record.id, { kind: "digits", digits: "3" }); // English
  return record.id;
}

test("registered farmer registers a crop lot and an upcoming harvest on one call", async () => {
  const { service, tables, calls, deps } = makeService();
  const id = await startEnglish(service, { source: "simulator", callerNumber: "+919876543210", helper: HELPER });
  const rb = await answerLot(service, id);
  assert.match(say(rb.output), /Onion, a vegetable, variety Red onion. Farming: organic, certified..*25 quintals, Grade B..*Weighbridge: WB-NSK-07. Expected price: 18 rupees per kilo/);
  assert.equal(calls.lot.length, 0, "no lot before the farmer confirms");

  const lot = await service.handle(id, speak("yes, correct"));
  assert.equal(tables.lot.size, 1);
  const lotEntry = lot.record.submissions.find((s) => s.kind === "lot");
  assert.equal(lotEntry.status, "registered");
  assert.match(lotEntry.recordId, /^LT-\d{6}$/);
  assert.match(say(lot.output), new RegExp(lotEntry.recordId.replace(/[^A-Z0-9]/g, "").split("").join(" ")));
  assert.match(say(lot.output), /anything else/i);
  // The JSON is exactly the body the website's lot form posts.
  assert.deepEqual(Object.keys(lotEntry.payload).sort(), [
    "crop", "cropCategory", "farmerId", "farmerName", "farmingMethod", "harvestDate", "id", "location", "organicCertified",
    "pricePerKg", "qualityGrade", "quantity", "sowingDate", "unit", "variety", "weighmentScaleId",
  ]);
  assert.deepEqual(
    { grade: lotEntry.payload.qualityGrade, scale: lotEntry.payload.weighmentScaleId, method: lotEntry.payload.farmingMethod, certified: lotEntry.payload.organicCertified, category: lotEntry.payload.cropCategory, price: lotEntry.payload.pricePerKg },
    { grade: "Grade B", scale: "WB-NSK-07", method: "Organic", certified: true, category: "Vegetable", price: 18 }
  );
  assert.equal(lotEntry.payload.location, "Pimpalgaon, Nashik");
  assert.equal(calls.lot[0].actor.role, "helper");

  await service.handle(id, { kind: "digits", digits: "2" }); // upcoming harvest
  await service.handle(id, speak("soybean"));
  await service.handle(id, speak("don't know"));
  await service.handle(id, speak("we use fertiliser and spray"));
  await service.handle(id, speak("don't know"));
  await service.handle(id, speak("40 quintals"));
  await service.handle(id, speak("15 December"));
  await service.handle(id, speak("yes"));
  await service.handle(id, speak("4500 per quintal"));
  await service.handle(id, speak("no"));
  const avail = await service.handle(id, { kind: "digits", digits: "1" });
  assert.equal(tables.availability.size, 1);
  const availEntry = avail.record.submissions.find((s) => s.kind === "availability");
  assert.match(availEntry.recordId, /^CA-\d{6}$/);
  assert.equal(availEntry.payload.variety, "Not specified");
  assert.equal(availEntry.payload.farmingMethod, "Conventional");
  assert.equal(availEntry.payload.expectedPricePerKg, 45);
  assert.equal(availEntry.payload.cropCategory, "Oilseed");
  assert.equal(availEntry.payload.sowingDate, null);
  assert.equal(availEntry.payload.expectedHarvestDate.slice(5), "12-15");
  assert.match(say(avail.output), /upcoming harvest is recorded/);

  const bye = await service.handle(id, { kind: "digits", digits: "3" });
  assert.ok(bye.output.end);
  assert.equal(bye.record.status, "completed");
  assert.equal(deps.store.submissions.length, 2, "one audit row per registration");

  // A late duplicate webhook after the call finished does nothing.
  await service.handle(id, speak("yes"));
  assert.equal(calls.lot.length, 1);
});

test("new caller registers as a farmer, then registers a lot under the new profile", async () => {
  const { service, tables, calls } = makeService({ defaultHelper: { id: HELPER.id, name: "Sunita" } });
  const id = await startEnglish(service, { source: "twilio", callerNumber: "+919811122233", callSid: "CA-new" });
  const steps = ["yes", "yes", "My name is Sunita Pawar", "Ozar", "don't know", "Nashik", "Maharashtra", "vegetables", "no", "yes I agree"];
  let r;
  for (const s of steps) r = await service.handle(id, speak(s));
  assert.match(say(r.output), /Name: Sunita Pawar\. Mobile number ending in 2 2 3 3\. Village Ozar, taluka not given, district Nashik, Maharashtra/);
  assert.equal(calls.farmer.length, 0, "no farmer created before confirmation");

  r = await service.handle(id, { kind: "digits", digits: "1" });
  assert.equal(calls.farmer.length, 1);
  const farmerEntry = r.record.submissions.find((s) => s.kind === "farmer");
  assert.equal(farmerEntry.status, "registered");
  assert.deepEqual(farmerEntry.payload, {
    id: farmerEntry.reservedId, name: "Sunita Pawar", mobile: "9811122233", village: "Ozar", taluka: "", district: "Nashik",
    state: "Maharashtra", language: "English", farmingCategory: "Vegetables", fpo: null, consent: true, verificationLevel: "Basic", status: "Active",
  });
  assert.equal(calls.farmer[0].actor.id, HELPER.id, "filed under IVR_HELPER_ID when no helper ran the call");
  assert.match(say(r.output), /You are now registered.*F M \d \d \d \d \d \d.*What would you like to do/);
  assert.equal(r.record.farmerRegistryId, farmerEntry.recordId);

  await service.handle(id, { kind: "digits", digits: "1" });
  await service.handle(id, speak("tomato"));
  await service.handle(id, speak("local"));
  await service.handle(id, speak("natural"));
  await service.handle(id, speak("2 months ago"));
  await service.handle(id, speak("800 kg"));
  await service.handle(id, speak("not sure"));
  await service.handle(id, speak("today"));
  await service.handle(id, speak("yes"));
  await service.handle(id, speak("no"));
  await service.handle(id, speak("don't know"));
  r = await service.handle(id, speak("yes"));
  const lot = [...tables.lot.values()][0];
  assert.equal(lot.farmerId, farmerEntry.recordId);
  assert.equal(lot.location, "Ozar, Nashik");
  assert.equal(lot.weighmentScaleId, null, "not weighed: no made-up scale ID");
  assert.equal(lot.qualityGrade, "Standard");
  assert.equal(lot.farmingMethod, "Natural");
  assert.equal(r.record.submissions.length, 2);
});

test("registering a mobile that already exists recognises the farmer instead of duplicating", async () => {
  const { service, calls } = makeService();
  // Caller ID hidden, farmer types Ramesh's registered number during registration.
  const id = await startEnglish(service, { source: "twilio", callerNumber: "", callSid: "CA-dup" });
  await service.handle(id, { kind: "digits", digits: "1" }); // register
  for (const s of [{ kind: "digits", digits: "9876543210" }, speak("Ramesh Patil"), speak("Sinnar"), speak("Sinnar"), speak("Nashik"), speak("Maharashtra"), speak("crops"), speak("no"), speak("yes")]) {
    await service.handle(id, s);
  }
  const r = await service.handle(id, speak("yes"));
  assert.equal(calls.farmer.length, 0);
  assert.match(say(r.output), /already registered.*Namaste Ramesh/);
  assert.equal(r.record.farmerRegistryId, RAMESH.registryId);
});

test("concurrent confirmations are serialised and create one lot", async () => {
  const { service, tables } = makeService();
  const id = await startEnglish(service, { source: "simulator", callerNumber: "9876543210", helper: HELPER });
  await answerLot(service, id);
  await Promise.all([service.handle(id, speak("yes")), service.handle(id, speak("yes")), service.handle(id, { kind: "digits", digits: "1" })]);
  assert.equal(tables.lot.size, 1);
});

test("backend failure: no ID announced, callback queued, helper retry reuses the reserved ID", async () => {
  const { service, tables, calls } = makeService({ failLots: 1 });
  const id = await startEnglish(service, { source: "simulator", callerNumber: "9876543210", helper: HELPER });
  await answerLot(service, id);
  const failed = await service.handle(id, speak("yes"));
  assert.equal(failed.record.status, "failed");
  assert.ok(failed.record.callbackRequested);
  assert.doesNotMatch(say(failed.output), /L T/);
  const entry = failed.record.submissions[0];
  assert.equal(entry.status, "failed");
  assert.equal(entry.error, "database unavailable");

  const retried = await service.retrySubmission(id, HELPER);
  assert.equal(retried.submissions[0].recordId, entry.reservedId);
  assert.equal(retried.status, "completed");
  assert.equal(tables.lot.size, 1);
  assert.deepEqual(calls.lot.map((c) => c.input.id), [entry.reservedId, entry.reservedId]);

  await service.retrySubmission(id, HELPER); // nothing left to retry
  assert.equal(calls.lot.length, 2);
});

test("farmer registration failure is retried once by the helper with the same farmer ID", async () => {
  const { service, tables } = makeService({ failFarmers: 1 });
  const id = await startEnglish(service, { source: "simulator", callerNumber: "9811122233", helper: HELPER });
  for (const s of ["yes", "yes", "Kiran Jadhav", "Ozar", "Niphad", "Nashik", "Maharashtra", "dairy", "no", "yes"]) await service.handle(id, speak(s));
  const r = await service.handle(id, speak("yes"));
  assert.equal(r.record.status, "failed");
  assert.match(say(r.output), /could not be completed/);
  const again = await service.retrySubmission(id, HELPER, "farmer-1");
  assert.equal(again.status, "completed");
  assert.equal(tables.farmer.size, 2);
  assert.equal(again.farmerRegistryId, again.submissions[0].reservedId);
});

test("hang-up mid-call is resumable on the next call", async () => {
  const { service, deps } = makeService();
  const first = await startEnglish(service, { source: "twilio", callerNumber: "+919876543210", callSid: "CA1" });
  await service.handle(first, { kind: "digits", digits: "1" });
  await service.handle(first, speak("wheat"));
  await service.callEnded("CA1", 40);
  assert.equal((await deps.store.get(first)).status, "abandoned");

  const { record } = await service.start({ source: "twilio", callerNumber: "+919876543210", callSid: "CA2" });
  const resumed = await service.handle(record.id, { kind: "digits", digits: "3" });
  assert.match(say(resumed.output), /Wheat/);
  const next = await service.handle(record.id, speak("yes"));
  assert.match(say(next.output), /variety/i);
  assert.equal(next.record.state.fields.crop, "Wheat");
  assert.equal((await deps.store.get(first)).outcome, "resumed");
});

test("unknown caller who declines registration gets a callback", async () => {
  const { service, calls } = makeService();
  const id = await startEnglish(service, { source: "twilio", callerNumber: "+911111111111", callSid: "CA9" });
  const r = await service.handle(id, speak("no"));
  assert.ok(r.output.end);
  assert.equal(r.record.status, "callback");
  assert.equal(calls.farmer.length + calls.lot.length, 0);
});

test("speech recognition failure ends politely with a callback", async () => {
  const { service } = makeService();
  const { record } = await service.start({ source: "twilio", callerNumber: "9876543210", callSid: "CA3" });
  const r = await service.handle(record.id, { kind: "sttError", message: "Sarvam timeout" });
  assert.ok(r.output.end);
  assert.ok(r.record.callbackRequested);
  assert.equal(r.record.lastError, "Sarvam timeout");
});

test("helper request without a reachable helper continues the dialog", async () => {
  const { service } = makeService();
  const id = await startEnglish(service, { source: "twilio", callerNumber: "9876543210", callSid: "CA4" });
  const r = await service.handle(id, speak("I want to talk to a helper"));
  assert.equal(r.output.end, false);
  assert.equal(r.output.transferTo, undefined);
  assert.ok(r.record.callbackRequested);
  assert.match(say(r.output), /What would you like to do/);
});

test("Twilio signature validation and TwiML", () => {
  const token = "test-token";
  const url = "https://example.test/api/v1/ivr/twilio/voice";
  const params = { CallSid: "CA1", From: "+919876543210" };
  const sig = crypto.createHmac("sha1", token).update(url + "CallSidCA1From+919876543210").digest("base64");
  assert.ok(validSignature(url, params, sig, token));
  assert.ok(!validSignature(url, { ...params, From: "+910000000000" }, sig, token));
  assert.ok(!validSignature(url, params, undefined, token));

  const xml = twiml("abc", { say: [{ id: "askCrop", text: "Which crop?", english: "Which crop?", language: "en-IN", ttsLanguage: "en-IN" }], expect: "speech", end: false });
  assert.match(xml, /<Say language="en-IN">Which crop\?<\/Say><Record [^>]*action="[^"]*\/ivr\/twilio\/turn\?s=abc"/);
  assert.match(xml, /<Redirect method="POST">[^<]*noInput=1<\/Redirect>/);
  const mobile = twiml("abc", { say: [], expect: "mobile", end: false });
  assert.match(mobile, /<Gather input="dtmf" numDigits="10"/);
});
