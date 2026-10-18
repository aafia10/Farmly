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

test("registration answers", () => {
  assert.equal(p.parseName("My name is ramesh patil"), "Ramesh Patil");
  assert.equal(p.parseName("I am Sunita Devi ji"), "Sunita Devi");
  assert.equal(p.parsePlace("I live in Pimpalgaon"), "Pimpalgaon");
  assert.equal(p.parsePlace("the district is Nashik"), "Nashik");
  // A "yes" heard at the district question must be re-asked, never stored as the place (seen live).
  assert.equal(p.parsePlace("Yes"), undefined);
  assert.equal(p.parsePlace("haan ji"), undefined);
  assert.equal(p.parsePlace("okay"), undefined);
  assert.equal(p.parseName("yes"), undefined);
  assert.equal(p.parsePlace("Yeola"), "Yeola");
  assert.equal(p.parseState("Maharashtra"), "Maharashtra");
  assert.equal(p.parseState("we are in tamil nadu"), "Tamil Nadu");
  assert.equal(p.parseState("Mars"), undefined);
  assert.equal(p.parseFarmingCategory("mostly onion and tomato"), "Vegetables");
  assert.equal(p.parseFarmingCategory("wheat and also cows"), "Mixed Farming");
  assert.equal(p.parseFarmingCategory("dairy"), "Dairy & Livestock");
  assert.deepEqual(p.parseFpo("no"), { fpo: null });
  assert.deepEqual(p.parseFpo("Yes, Sahyadri Farmers Producer Company"), { fpo: "Sahyadri Farmers Producer Company" });
  assert.equal(p.parseFpo("yes"), undefined);
  assert.equal(p.parseTask("I want to sell my harvested crop"), "lot");
  assert.equal(p.parseTask("upcoming harvest"), "availability");
  assert.equal(p.parseTask("nothing else"), "finish");
  assert.equal(p.parseRegFieldChoice("change the district"), "district");
  assert.equal(p.parseRegFieldChoice("my name is wrong"), "name");
  assert.ok(p.isSkip("I don't know"));
  assert.equal(p.parseIntent("is there any fee?"), "faqCost");
  assert.equal(p.parseIntent("do I need aadhaar"), "faqDocuments");
});

// --- Dialog -----------------------------------------------------------------

const farmer = { registryId: "FMR-MH-000421", name: "Ramesh Patil", village: "Sinnar", district: "Nashik", state: "Maharashtra" };
const dopts = { ...opts, today };

function run(events, from = initialState()) {
  let state = from;
  const log = [];
  for (const ev of events) {
    const r = step(state, ev, dopts);
    state = r.state;
    log.push(r);
  }
  return { state, log, last: log[log.length - 1] };
}

const intoLot = [{ type: "start", callerNumber: "+919876543210" }, { type: "digits", digits: "3" }, { type: "identified", farmer }, { type: "digits", digits: "1" }];

test("registered caller: menu, crop lot, confirm, then finish", () => {
  const { state, log } = run([
    { type: "start", callerNumber: "+919876543210" },
    { type: "speech", text: "Marathi", detectedLanguage: "mr-IN" },
    { type: "identified", farmer },
    { type: "speech", text: "crop lot" },
    { type: "speech", text: "onion" },
    { type: "speech", text: "Nashik red" },
    { type: "speech", text: "organic, we use only compost" },
    { type: "speech", text: "no" }, // not certified
    { type: "speech", text: "3 months ago" },
    { type: "speech", text: "twenty quintals" },
    { type: "speech", text: "A grade" },
    { type: "speech", text: "next week" },
    { type: "speech", text: "yes" },
    { type: "speech", text: "yes, weighbridge WB NSK 07" },
    { type: "speech", text: "2000 rupees per quintal" },
  ]);
  assert.equal(log[1].action.type, "identify");
  assert.equal(log[1].action.mobile, "9876543210");
  assert.deepEqual(log[2].say.map((u) => u.id), ["farmerFound", "mainMenu"]);
  assert.equal(state.language, "mr-IN");
  assert.equal(state.step, "readback");
  assert.ok(!log.some((r) => r.action && r.action.type === "submit"), "nothing submitted before confirmation");
  assert.deepEqual(
    { crop: state.fields.crop, variety: state.fields.variety, quantity: state.fields.quantity, unit: state.fields.unit, location: state.fields.location },
    { crop: "Onion", variety: "Nashik red", quantity: 20, unit: "quintals", location: "Sinnar, Nashik" }
  );
  const f = state.fields;
  assert.deepEqual(
    { category: f.cropCategory, method: f.farmingMethod, certified: f.organicCertified, sowing: f.sowingDate, grade: f.grade, scale: f.scaleId, price: f.pricePerKg },
    { category: "Vegetable", method: "Organic", certified: false, sowing: "2026-07-20", grade: "Grade A", scale: "WB-NSK-07", price: 20 }
  );
  const rb = log[log.length - 1].say[0];
  assert.equal(rb.id, "readback");
  assert.equal(rb.vars.method, "organic, not certified");
  assert.equal(rb.vars.price, "20 rupees per kilo");
  const confirm = step(state, { type: "digits", digits: "1" }, dopts);
  assert.deepEqual(confirm.action, { type: "submit", kind: "lot" });
  const done = step(confirm.state, { type: "submitted", kind: "lot", id: "LT-482913" }, dopts);
  assert.equal(done.end, undefined, "the call continues with 'anything else?'");
  assert.deepEqual(done.say.map((u) => u.id), ["registered", "menuAgain"]);
  assert.equal(done.say[0].vars.batch, "L T 4 8 2 9 1 3");
  const bye = step(done.state, { type: "digits", digits: "3" }, dopts);
  assert.ok(bye.end);
  assert.equal(bye.state.outcome, "registered");
});

test("keypad language menu, unit follow-up and correcting a field", () => {
  const { state } = run([
    { type: "start" },
    { type: "digits", digits: "0" },
    { type: "digits", digits: "1" }, // Punjabi
    { type: "identified", farmer: { ...farmer, village: null, district: null } },
    { type: "digits", digits: "1" },
    { type: "speech", text: "wheat" },
    { type: "speech", text: "don't know" },
    { type: "digits", digits: "3" }, // chemical
    { type: "speech", text: "I don't remember" },
    { type: "speech", text: "about 300" },
    { type: "speech", text: "kilos" },
    { type: "digits", digits: "2" }, // Grade B
    { type: "speech", text: "already harvested" },
    { type: "speech", text: "Kalwan" },
    { type: "digits", digits: "2" }, // not weighed
    { type: "speech", text: "don't know" }, // price
    { type: "speech", text: "no" },
    { type: "speech", text: "the quantity" },
    { type: "speech", text: "350 kg" },
  ]);
  assert.equal(state.language, "pa-IN");
  assert.equal(state.step, "readback", "returns to the read-back after the correction");
  assert.equal(state.fields.quantity, 350);
  assert.equal(state.fields.variety, null);
  assert.equal(state.fields.location, "Kalwan");
  assert.equal(state.fields.farmingMethod, "Conventional");
  assert.equal(state.fields.organicCertified, null);
  assert.equal(state.fields.sowingDate, null);
  assert.equal(state.fields.grade, "Grade B");
  assert.equal(state.fields.scaleId, null);
  assert.equal(state.fields.pricePerKg, null);
});

test("unknown crops are asked for their crop type; changing a detail returns to the read-back", () => {
  const { state, log } = run([
    ...intoLot,
    { type: "speech", text: "dragon fruit" },
    { type: "speech", text: "yes" }, // confirm the unknown crop name
    { type: "speech", text: "it is a fruit" },
    { type: "speech", text: "don't know" },
    { type: "digits", digits: "1" }, // organic
    { type: "digits", digits: "1" }, // certified
    { type: "speech", text: "in June" },
    { type: "speech", text: "2 tonnes" },
    { type: "speech", text: "standard" },
    { type: "speech", text: "today" },
    { type: "speech", text: "yes" },
    { type: "speech", text: "no" },
    { type: "speech", text: "60 per kilo" },
    { type: "speech", text: "no" },
    { type: "speech", text: "change the farming method" },
    { type: "speech", text: "natural farming" },
  ]);
  assert.equal(log[5].say[0].id, "askCropCategory");
  assert.equal(state.fields.cropCategory, "Fruit");
  assert.equal(state.fields.farmingMethod, "Natural");
  assert.equal(state.fields.organicCertified, null);
  assert.equal(state.fields.sowingDate, "2026-06-15");
  assert.equal(state.step, "readback");
});

test("new caller registers as a farmer on the call, then records an upcoming harvest", () => {
  const { state, log } = run([
    { type: "start", callerNumber: "+919811122233" },
    { type: "digits", digits: "1" }, // Hindi
    { type: "identified", farmer: null },
    { type: "speech", text: "yes please register me" },
    { type: "speech", text: "yes" }, // caller-ID mobile
    { type: "speech", text: "My name is Sunita Pawar" },
    { type: "speech", text: "I live in Ozar" },
    { type: "speech", text: "I don't know" }, // taluka
    { type: "speech", text: "Nashik" },
    { type: "speech", text: "Maharashtra" },
    { type: "speech", text: "grapes and pomegranate" },
    { type: "speech", text: "no" }, // FPO
    { type: "speech", text: "yes I agree" },
  ]);
  assert.equal(log[2].say[0].id, "notRegisteredOffer");
  assert.equal(log[3].say[0].id, "regIntro");
  assert.equal(log[3].say[1].vars.last4, "2 2 3 3");
  assert.equal(state.step, "regReadback");
  assert.deepEqual(state.reg, {
    mobile: "9811122233", name: "Sunita Pawar", village: "Ozar", taluka: null, talukaAsked: true,
    district: "Nashik", state: "Maharashtra", category: "Fruits & Horticulture", fpo: null, fpoAsked: true, consent: true,
  });
  assert.ok(!log.some((r) => r.action && r.action.type === "registerFarmer"), "nothing registered before confirmation");

  // Correct the district, then confirm.
  const fixed = run([{ type: "speech", text: "no" }, { type: "speech", text: "the district" }, { type: "speech", text: "Niphad" }], state);
  assert.equal(fixed.state.step, "regReadback");
  assert.equal(fixed.state.reg.district, "Niphad");
  const confirm = step(fixed.state, { type: "digits", digits: "1" }, dopts);
  assert.equal(confirm.action.type, "registerFarmer");
  const registered = step(confirm.state, { type: "farmerRegistered", farmer: { registryId: "FM-123456", name: "Sunita Pawar", village: "Ozar", district: "Niphad" }, existing: false }, dopts);
  assert.deepEqual(registered.say.map((u) => u.id), ["farmerRegistered", "mainMenu"]);
  assert.equal(registered.say[0].vars.farmerId, "F M 1 2 3 4 5 6");

  const harvest = run([
    { type: "speech", text: "upcoming harvest" },
    { type: "speech", text: "grapes" },
    { type: "speech", text: "Thompson seedless" },
    { type: "speech", text: "no chemical spray at all" },
    { type: "speech", text: "yes" }, // certified organic
    { type: "speech", text: "5 months ago" },
    { type: "speech", text: "5 tonnes" },
    { type: "speech", text: "15 days ago" },
    { type: "speech", text: "next month" },
    { type: "speech", text: "yes" },
    { type: "speech", text: "we expect 60 rupees per kilo" },
    { type: "speech", text: "drip irrigation, black soil" },
    { type: "speech", text: "yes" },
  ], registered.state);
  assert.equal(harvest.log[7].say[0].id, "availPastDate", "a past date is refused for an upcoming harvest");
  assert.equal(harvest.state.fields.farmingMethod, "Organic");
  assert.equal(harvest.state.fields.organicCertified, true);
  assert.equal(harvest.state.fields.cropCategory, "Fruit");
  assert.equal(harvest.state.fields.pricePerKg, 60);
  assert.equal(harvest.state.fields.grade, undefined, "grade is asked for lots only");
  assert.deepEqual(harvest.last.action, { type: "submit", kind: "availability" });
  assert.equal(harvest.state.fields.location, "Ozar, Niphad");
  assert.equal(harvest.state.fields.notes, "drip irrigation, black soil");
  assert.equal(harvest.state.fields.harvestDate, p.parseHarvestDate("next month", today).date);
});

test("registration stops without consent; declining registration queues a callback", () => {
  const declined = run([{ type: "start", callerNumber: "9811122233" }, { type: "digits", digits: "3" }, { type: "identified", farmer: null }, { type: "speech", text: "no" }]);
  assert.equal(declined.state.outcome, "unregistered");
  assert.equal(declined.last.action.type, "callback");
  const noConsent = run([
    { type: "start", callerNumber: "9811122233" }, { type: "digits", digits: "3" }, { type: "identified", farmer: null },
    { type: "digits", digits: "1" }, { type: "digits", digits: "1" }, { type: "speech", text: "Raju" }, { type: "speech", text: "Ozar" },
    { type: "speech", text: "Niphad" }, { type: "speech", text: "Nashik" }, { type: "speech", text: "Maharashtra" },
    { type: "speech", text: "crops" }, { type: "digits", digits: "2" }, { type: "speech", text: "no" },
  ]);
  assert.equal(noConsent.state.outcome, "declined");
  assert.ok(!noConsent.log.some((r) => r.action && r.action.type === "registerFarmer"));
});

test("caller registered with another number can type it", () => {
  const { log } = run([
    { type: "start", callerNumber: "+15550001111" },
    { type: "digits", digits: "3" },
    { type: "identified", farmer: null },
    { type: "digits", digits: "2" },
    { type: "digits", digits: "9876543210" },
    { type: "identified", farmer },
  ]);
  assert.equal(log[3].state.step, "mobile");
  assert.equal(log[4].action.mobile, "9876543210");
  assert.equal(log[5].say[0].id, "farmerFound");
});

test("caller ID hidden: registration asks for the mobile on the keypad", () => {
  const { log, state } = run([{ type: "start" }, { type: "digits", digits: "3" }, { type: "identified", farmer: null }, { type: "digits", digits: "1" }, { type: "digits", digits: "9811122233" }]);
  assert.equal(log[3].expect, "mobile");
  assert.equal(state.reg.mobile, "9811122233");
  assert.equal(state.step, "regName");
});

test("silence and repeated misunderstanding hand off to the helper", () => {
  const silent = run([...intoLot, { type: "noInput" }, { type: "noInput" }, { type: "noInput" }]);
  assert.equal(silent.state.outcome, "callback");
  const confused = run([...intoLot, { type: "speech", text: "wheat" }, { type: "speech", text: "x" }, { type: "speech", text: "fifty bags" }, { type: "speech", text: "fifty bags" }, { type: "speech", text: "fifty bags" }]);
  assert.equal(confused.state.outcome, "callback");
  assert.ok(!confused.log.some((r) => r.action && r.action.type === "submit"));
});

test("farmer questions are answered and the pending question repeated", () => {
  const { last } = run([...intoLot, { type: "speech", text: "when will I get paid?" }]);
  assert.equal(last.say[0].id, "faqPayment");
  assert.equal(last.say[1].id, "askCrop");
  const helper = run([...intoLot, { type: "speech", text: "connect me to my helper" }]);
  assert.equal(helper.last.action.type, "transfer");
  const stop = run([...intoLot, { type: "speech", text: "stop" }]);
  assert.equal(stop.state.outcome, "stopped");
});

test("resume offers the unfinished crop", () => {
  const { state, log } = run([
    { type: "start" },
    { type: "digits", digits: "3" },
    { type: "identified", farmer, resume: { task: "lot", fields: { crop: "Wheat", cropCategory: "Cereal", varietyAsked: true, variety: null, farmingMethod: "Conventional", organicCertified: null, sowingAsked: true, sowingDate: null } } },
    { type: "speech", text: "yes" },
  ]);
  assert.equal(log[2].say[1].id, "askResume");
  assert.equal(state.task, "lot");
  assert.equal(state.step, "quantity");
});

test("backend failures are never announced as success", () => {
  const r = step({ ...initialState(), step: "submitting", language: "hi-IN", task: "lot" }, { type: "submitFailed" }, dopts);
  assert.equal(r.say[0].id, "submitFailed");
  assert.equal(r.state.outcome, "failed");
  const f = step({ ...initialState(), step: "registering", language: "hi-IN", task: "register" }, { type: "registerFailed" }, dopts);
  assert.equal(f.say[0].id, "registerFailed");
  assert.equal(f.action.type, "callback");
});
