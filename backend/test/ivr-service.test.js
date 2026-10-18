// End-to-end IVR flow through ivrService with fake farmer/lot backends (no network, no database).
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:54321";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "test";

const { createIvrService } = require("../dist/ivr/ivrService");
const { MemoryStore } = require("../dist/ivr/store");
const { validSignature, twiml } = require("../dist/ivr/twilio");

const FARMER = { registryId: "FM-100001", name: "Ramesh Patil", village: "Pimpalgaon", district: "Nashik", state: "Maharashtra", helperId: "e1000000-0000-0000-0000-000000000002", helperName: "Sunita" };
const HELPER = { id: "e1000000-0000-0000-0000-000000000002", fullName: "Sunita", email: "", mobile: "", role: "helper" };

function makeService({ failLots = 0 } = {}) {
  const lots = new Map();
  let failures = failLots;
  const calls = { createLot: [] };
  const deps = {
    store: new MemoryStore(),
    async findFarmerByMobile(mobile) {
      return mobile === "9876543210" ? FARMER : null;
    },
    async findHelperPhone() {
      return null;
    },
    async lotExists(id) {
      return lots.has(id);
    },
    async createLot(input, actor) {
      calls.createLot.push({ input, actor });
      await new Promise((r) => setTimeout(r, 5));
      if (failures > 0) {
        failures--;
        throw new Error("database unavailable");
      }
      if (lots.has(input.id)) return { lot: lots.get(input.id), created: false };
      const lot = { id: input.id, ...input };
      lots.set(input.id, lot);
      return { lot, created: true };
    },
    speech: { configured: () => false, translate: async (t) => t, synthesize: async () => "x" },
    allowPartialLanguages: true,
    now: () => new Date(),
  };
  return { service: createIvrService(deps), deps, lots, calls };
}

const say = (out) => out.say.map((p) => p.english).join(" ");
const speak = (english) => ({ kind: "speech", english });

async function answerUntilReadback(service, id) {
  await service.handle(id, { kind: "digits", digits: "3" }); // English
  await service.handle(id, speak("onion"));
  await service.handle(id, speak("Red onion"));
  await service.handle(id, speak("25 quintals"));
  await service.handle(id, speak("next week"));
  return service.handle(id, speak("yes")); // location from profile
}

test("simulator call registers exactly one lot, only after confirmation", async () => {
  const { service, lots, calls } = makeService();
  const { record } = await service.start({ source: "simulator", callerNumber: "+919876543210", helper: HELPER });
  const rb = await answerUntilReadback(service, record.id);
  assert.match(say(rb.output), /Onion.*Red onion.*25 quintals/);
  assert.equal(calls.createLot.length, 0, "no lot before the farmer confirms");

  const done = await service.handle(record.id, speak("yes, correct"));
  assert.equal(calls.createLot.length, 1);
  assert.equal(lots.size, 1);
  const batchId = done.record.batchId;
  assert.match(batchId, /^LT-\d{6}$/);
  assert.match(say(done.output), new RegExp(batchId.replace(/[^A-Z0-9]/g, "").split("").join(" ")));
  assert.equal(done.record.status, "completed");
  assert.equal(calls.createLot[0].actor.role, "helper");
  assert.equal(calls.createLot[0].input.harvestDate.length, 10);
  assert.equal(calls.createLot[0].input.location, "Pimpalgaon, Nashik");

  // A late duplicate webhook after the call finished does nothing.
  await service.handle(record.id, speak("yes"));
  assert.equal(calls.createLot.length, 1);
});

test("concurrent confirmations are serialised and create one lot", async () => {
  const { service, lots } = makeService();
  const { record } = await service.start({ source: "simulator", callerNumber: "9876543210", helper: HELPER });
  await answerUntilReadback(service, record.id);
  await Promise.all([service.handle(record.id, speak("yes")), service.handle(record.id, speak("yes")), service.handle(record.id, { kind: "digits", digits: "1" })]);
  assert.equal(lots.size, 1);
});

test("backend failure: no Batch ID announced, callback queued, helper retry reuses the reserved ID", async () => {
  const { service, lots, calls } = makeService({ failLots: 1 });
  const { record } = await service.start({ source: "simulator", callerNumber: "9876543210", helper: HELPER });
  await answerUntilReadback(service, record.id);
  const failed = await service.handle(record.id, speak("yes"));
  assert.equal(failed.record.status, "failed");
  assert.equal(failed.record.batchId, undefined);
  assert.ok(failed.record.callbackRequested);
  assert.doesNotMatch(say(failed.output), /LT/);
  const reserved = failed.record.pendingBatchId;
  assert.ok(reserved);

  const retried = await service.retrySubmission(record.id, HELPER);
  assert.equal(retried.batchId, reserved);
  assert.equal(retried.status, "completed");
  assert.equal(lots.size, 1);
  assert.deepEqual(calls.createLot.map((c) => c.input.id), [reserved, reserved]);

  // Retrying again is a no-op.
  await service.retrySubmission(record.id, HELPER);
  assert.equal(calls.createLot.length, 2);
});

test("hang-up mid-call is resumable on the next call", async () => {
  const { service, deps } = makeService();
  const first = await service.start({ source: "twilio", callerNumber: "+919876543210", callSid: "CA1" });
  await service.handle(first.record.id, { kind: "digits", digits: "3" });
  await service.handle(first.record.id, speak("wheat"));
  await service.callEnded("CA1", 40);
  assert.equal((await deps.store.get(first.record.id)).status, "abandoned");

  const second = await service.start({ source: "twilio", callerNumber: "+919876543210", callSid: "CA2" });
  const resumed = await service.handle(second.record.id, { kind: "digits", digits: "3" });
  assert.match(say(resumed.output), /Wheat/);
  const next = await service.handle(second.record.id, speak("yes"));
  assert.match(say(next.output), /variety/i);
  assert.equal(next.record.state.fields.crop, "Wheat");
  assert.equal((await deps.store.get(first.record.id)).outcome, "resumed");
});

test("unknown caller is not registered and gets a callback", async () => {
  const { service, calls } = makeService();
  const { record } = await service.start({ source: "twilio", callerNumber: "+911111111111", callSid: "CA9" });
  const askMobile = await service.handle(record.id, { kind: "digits", digits: "3" });
  assert.equal(askMobile.output.expect, "mobile");
  const r = await service.handle(record.id, { kind: "digits", digits: "2222222222" });
  assert.ok(r.output.end);
  assert.equal(r.record.status, "callback");
  assert.equal(calls.createLot.length, 0);
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
  const { record } = await service.start({ source: "twilio", callerNumber: "9876543210", callSid: "CA4" });
  await service.handle(record.id, { kind: "digits", digits: "3" });
  const r = await service.handle(record.id, speak("I want to talk to a helper"));
  assert.equal(r.output.end, false);
  assert.equal(r.output.transferTo, undefined);
  assert.ok(r.record.callbackRequested);
  assert.match(say(r.output), /crop/i);
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
