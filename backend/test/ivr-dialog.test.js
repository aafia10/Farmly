// Tests for the IVR parsers and dialog engine. Run with: npm test (builds first).
const test = require("node:test");
const assert = require("node:assert/strict");
const p = require("../dist/ivr/parsers");
const { step, initialState } = require("../dist/ivr/dialog");
const { IVR_LANGUAGES } = require("../dist/ivr/languages");

const opts = { allowedLanguages: IVR_LANGUAGES.map((l) => l.code) };
const today = new Date(2026, 9, 18); // 18 Oct 2026

test("yes / no", () => {
  assert.equal(p.parseYesNo("Yes, that's correct"), "yes");
  assert.equal(p.parseYesNo("haan ji"), "yes");
  assert.equal(p.parseYesNo("No, change the quantity"), "no");
  assert.equal(p.parseYesNo("nahi"), "no");
  assert.equal(p.parseYesNo("hmm"), undefined);
});

test("crop names and local synonyms", () => {
  assert.equal(p.parseCrop("I want to register wheat").crop, "Wheat");
  assert.equal(p.parseCrop("kanda").crop, "Onion");
  assert.equal(p.parseCrop("green gram").crop, "Green Gram");
  assert.equal(p.parseCrop("gram").crop, "Chickpea");
  assert.equal(p.parseCrop("dragon fruit").crop, undefined);
  assert.equal(p.parseCrop("My crop is dragon fruit").heard, "dragon fruit");
});

test("numbers in digits and words", () => {
  assert.equal(p.parseNumber("500"), 500);
  assert.equal(p.parseNumber("1,200 kilos"), 1200);
  assert.equal(p.parseNumber("two and a half"), 2.5);
  assert.equal(p.parseNumber("five hundred"), 500);
  assert.equal(p.parseNumber("fifty thousand"), 50000);
  assert.equal(p.parseNumber("one lakh"), 100000);
  assert.equal(p.parseNumber("2 and a half"), 2.5);
  assert.equal(p.parseNumber("5 thousand"), 5000);
  assert.equal(p.parseNumber("twenty five"), 25);
});

test("quantity with units", () => {
  assert.deepEqual(p.parseQuantity("500 kilos"), { kind: "ok", quantity: 500, unit: "kg" });
  assert.deepEqual(p.parseQuantity("twenty quintals"), { kind: "ok", quantity: 20, unit: "quintals" });
  assert.deepEqual(p.parseQuantity("2 tonnes"), { kind: "ok", quantity: 2, unit: "tonnes" });
  assert.deepEqual(p.parseQuantity("about 300"), { kind: "needUnit", quantity: 300 });
  assert.equal(p.parseQuantity("fifty bags").kind, "unsupportedUnit");
  assert.equal(p.parseQuantity("0 kg").kind, "invalid");
  assert.equal(p.parseQuantity("5000 tonnes").kind, "invalid");
  assert.equal(p.parseQuantity("I don't know").kind, "none");
});

test("harvest dates", () => {
  assert.deepEqual(p.parseHarvestDate("today", today), { kind: "ok", date: "2026-10-18", harvested: true });
  assert.deepEqual(p.parseHarvestDate("already harvested", today), { kind: "ok", date: "2026-10-18", harvested: true });
  assert.deepEqual(p.parseHarvestDate("next week", today), { kind: "ok", date: "2026-10-25", harvested: false });
  assert.deepEqual(p.parseHarvestDate("in 10 days", today), { kind: "ok", date: "2026-10-28", harvested: false });
  assert.deepEqual(p.parseHarvestDate("15 November", today), { kind: "ok", date: "2026-11-15", harvested: false });
  assert.deepEqual(p.parseHarvestDate("November 20th", today), { kind: "ok", date: "2026-11-20", harvested: false });
  assert.deepEqual(p.parseHarvestDate("harvested 5 days ago", today), { kind: "ok", date: "2026-10-13", harvested: true });
  assert.deepEqual(p.parseHarvestDate("15/03", today), { kind: "ok", date: "2027-03-15", harvested: false });
  assert.equal(p.parseHarvestDate("2 years later in 2029", today).kind, "invalid");
  assert.equal(p.parseHarvestDate("blah", today).kind, "none");
});

test("questions and commands", () => {
  assert.equal(p.parseIntent("when will I get paid?"), "faqPayment");
  assert.equal(p.parseIntent("is my data safe"), "faqPrivacy");
  assert.equal(p.parseIntent("I want to talk to my helper"), "helper");
  assert.equal(p.parseIntent("please repeat"), "repeat");
  assert.equal(p.parseIntent("stop"), "stop");
  assert.equal(p.parseIntent("wheat"), undefined);
});

// --- Dialog -----------------------------------------------------------------

const farmer = { registryId: "FMR-MH-000421", name: "Ramesh Patil", village: "Sinnar", district: "Nashik", state: "Maharashtra" };

function run(events) {
  let state = initialState();
  const log = [];
  for (const ev of events) {
    const r = step(state, ev, opts);
    state = r.state;
    log.push(r);
  }
  return { state, log, last: log[log.length - 1] };
}

test("happy path registers only after confirmation", () => {
  const { state, log } = run([
    { type: "start", callerNumber: "+919876543210" },
    { type: "speech", text: "Marathi", detectedLanguage: "mr-IN" },
    { type: "identified", farmer },
    { type: "speech", text: "onion" },
    { type: "speech", text: "Nashik red" },
    { type: "speech", text: "twenty quintals" },
    { type: "speech", text: "next week" },
    { type: "speech", text: "yes" },
  ]);
  assert.equal(log[1].action.type, "identify");
  assert.equal(log[1].action.mobile, "9876543210");
  assert.equal(state.language, "mr-IN");
  assert.equal(state.step, "readback");
  assert.ok(!log.some((r) => r.action && r.action.type === "submit"), "nothing submitted before confirmation");
  assert.deepEqual(
    { crop: state.fields.crop, variety: state.fields.variety, quantity: state.fields.quantity, unit: state.fields.unit, location: state.fields.location },
    { crop: "Onion", variety: "Nashik red", quantity: 20, unit: "quintals", location: "Sinnar, Nashik" }
  );
  const confirm = step(state, { type: "digits", digits: "1" }, opts);
  assert.equal(confirm.action.type, "submit");
  const done = step(confirm.state, { type: "submitted", batchId: "LT-482913" }, opts);
  assert.equal(done.end, true);
  assert.equal(done.say[0].id, "registered");
  assert.equal(done.say[0].vars.batch, "L T 4 8 2 9 1 3");
});

test("keypad language menu, unit follow-up and correcting a field", () => {
  const { state } = run([
    { type: "start" },
    { type: "digits", digits: "0" },
    { type: "digits", digits: "1" }, // Punjabi
    { type: "identified", farmer: { ...farmer, village: null, district: null } },
    { type: "speech", text: "wheat" },
    { type: "speech", text: "don't know" },
    { type: "speech", text: "about 300" },
    { type: "speech", text: "kilos" },
    { type: "speech", text: "already harvested" },
    { type: "speech", text: "Kalwan" },
    { type: "speech", text: "no" },
    { type: "speech", text: "the quantity" },
    { type: "speech", text: "350 kg" },
  ]);
  assert.equal(state.language, "pa-IN");
  assert.equal(state.step, "readback", "returns to the read-back after the correction");
  assert.equal(state.fields.quantity, 350);
  assert.equal(state.fields.variety, null);
  assert.equal(state.fields.location, "Kalwan");
});

test("unknown caller is asked for the mobile number, then told to register", () => {
  const { log, state } = run([
    { type: "start", callerNumber: "+15550001111" },
    { type: "digits", digits: "3" },
    { type: "identified", farmer: null },
    { type: "digits", digits: "9999999999" },
    { type: "identified", farmer: null },
  ]);
  assert.equal(log[2].state.step, "mobile");
  assert.equal(log[3].action.mobile, "9999999999");
  assert.equal(state.outcome, "unregistered");
  assert.equal(log[4].action.type, "callback");
});

test("silence and repeated misunderstanding hand off to the helper", () => {
  const silent = run([{ type: "start" }, { type: "digits", digits: "3" }, { type: "identified", farmer }, { type: "noInput" }, { type: "noInput" }, { type: "noInput" }]);
  assert.equal(silent.state.outcome, "callback");
  const confused = run([{ type: "start" }, { type: "digits", digits: "3" }, { type: "identified", farmer }, { type: "speech", text: "wheat" }, { type: "speech", text: "x" }, { type: "speech", text: "fifty bags" }, { type: "speech", text: "fifty bags" }, { type: "speech", text: "fifty bags" }]);
  assert.equal(confused.state.outcome, "callback");
  assert.ok(!confused.log.some((r) => r.action && r.action.type === "submit"));
});

test("farmer questions are answered and the pending question repeated", () => {
  const { last } = run([{ type: "start" }, { type: "digits", digits: "3" }, { type: "identified", farmer }, { type: "speech", text: "when will I get paid?" }]);
  assert.equal(last.say[0].id, "faqPayment");
  assert.equal(last.say[1].id, "askCrop");
  const helper = run([{ type: "start" }, { type: "digits", digits: "3" }, { type: "identified", farmer }, { type: "speech", text: "connect me to my helper" }]);
  assert.equal(helper.last.action.type, "transfer");
  const stop = run([{ type: "start" }, { type: "digits", digits: "3" }, { type: "identified", farmer }, { type: "speech", text: "stop" }]);
  assert.equal(stop.state.outcome, "stopped");
});

test("resume offers the unfinished crop", () => {
  const { state, log } = run([
    { type: "start" },
    { type: "digits", digits: "3" },
    { type: "identified", farmer, resumeFields: { crop: "Wheat", varietyAsked: true, variety: null } },
    { type: "speech", text: "yes" },
  ]);
  assert.equal(log[2].say[1].id, "askResume");
  assert.equal(state.step, "quantity");
});

test("backend failure is never announced as success", () => {
  const r = step({ ...initialState(), step: "submitting", language: "hi-IN", fields: {} }, { type: "submitFailed" }, opts);
  assert.equal(r.say[0].id, "submitFailed");
  assert.equal(r.state.outcome, "failed");
});
