# Farmly phone agent — conversation script

This is the complete script the Farmly phone agent follows. On one call a farmer can:

1. **Register as a Farmly farmer**, if their number isn't registered yet.
2. **Register a crop lot**: a harvested crop they want to sell. The agent creates a batch with an `LT-` ID.
3. **Tell buyers about an upcoming harvest**: this records crop availability with a `CA-` ID.

They can do several of these in one call. For example, a new farmer registers, then registers two lots.

Every line below is written in English and lives in `script.ts`. During the call it is translated into the caller's language and spoken aloud. Everything the farmer says is transcribed to English, then read by the parsers in `parsers.ts`. The keypad works at every yes/no question (**1 = yes, 2 = no**) and in every menu.

**The golden rule:** nothing is saved until the farmer has heard the details read back and said *yes*. The farmer hears a Farmly ID, batch number or reference number only after the backend has stored the record.

---

## 1. What gets collected, and where it goes

Each confirmed answer set becomes a JSON body identical to the one the website's helper forms send. That body goes through the same backend service the forms use.

### Farmer profile → `POST /farmers` (helper "Register farmer" form)

| Field | Asked as | Required | Notes |
|---|---|---|---|
| `mobile` | "Shall I register the mobile number ending in 2 2 3 3?" | yes | Caller ID first; keypad entry if the caller ID is hidden or wrong |
| `name` | "Please tell me your full name." | yes | "My name is…" and honorifics are stripped |
| `village` | "Which village do you live in?" | yes | |
| `taluka` | "Which taluka or tehsil…? If you don't know, say don't know." | no | "don't know" → empty |
| `district` | "Which district is it in?" | yes | |
| `state` | "And which state?" | yes | Must match one of India's 28 states or 8 union territories, otherwise asked again |
| `farmingCategory` | "What do you mainly farm?" | yes | Crops / Vegetables / Fruits & Horticulture / Dairy & Livestock / Poultry / Fisheries / Mixed Farming |
| `fpo` | "Are you a member of a farmer producer organisation…?" | no | "no" → empty; "yes" without a name → asks for the name |
| `consent` | consent statement, then "Do you agree?" | **must be yes** | "no" ends the registration; nothing is saved |
| `language` | — | | The language chosen at the start of the call |
| `verificationLevel` | — | | Always `Basic` (self-declared by phone), so a helper can later verify in the field |
| `status` | — | | `Active` |

Example JSON (stored with the call and shown in the helper workspace):

```json
{
  "id": "FM-482913", "name": "Sunita Pawar", "mobile": "9811122233",
  "village": "Ozar", "taluka": "", "district": "Nashik", "state": "Maharashtra",
  "language": "Marathi", "farmingCategory": "Vegetables", "fpo": null,
  "consent": true, "verificationLevel": "Basic", "status": "Active"
}
```

### Crop lot → `POST /lots` (helper "Create lot" form)

Questions are asked in this order. Optional questions accept "don't know".

| # | Field | Asked as | Validation / stored as |
|---|---|---|---|
| 1 | `crop` | "Which crop do you want to register?" | Over 40 crops with local names (kanda → Onion, gehun → Wheat, tur → Pigeon Pea…). An unknown name is read back for confirmation |
| 2 | `cropCategory` (crop type) | *only for crops the agent doesn't know:* "What type of crop is {crop}? Say grain, pulse, oilseed, vegetable, fruit, spice, cash crop, or something else." | Cereal / Pulse / Oilseed / Vegetable / Fruit / Spice / Cash Crop / Plantation / Other. Known crops are filled in automatically (Onion → Vegetable) and read back |
| 3 | `variety` | "Which variety of {crop} is it? If you don't know, say don't know." | "don't know" → `Standard`; "local/desi" → `Local` |
| 4 | `farmingMethod` | "How is this {crop} grown? Say organic… natural… or chemical… You can also press 1, 2 or 3." | `Organic` (also "jaivik", "no chemical spray", "compost"), `Natural` ("zero budget"), `Conventional` ("urea", "spray", "fertiliser") |
| 5 | `organicCertified` | *only if organic:* "Do you have an organic certificate for this crop?" | yes / no |
| 6 | `sowingDate` | "When did you sow it? For example 3 months ago, or 15 June." | Optional. In the past, at most two years ago |
| 7 | `quantity` + `unit` | "How much {crop} do you have?…" | Units: kg, quintals, tonnes. A number without a unit gets a follow-up question. Bags are refused. Must be over 0 and at most 1,000 tonnes |
| 8 | `qualityGrade` | "What is the quality of the crop? Press 1 or say A grade… 2… B grade… 3… standard…" | `Grade A` / `Grade B` / `Standard`, the same options as the website form. "Not sure" → `Standard` (farmer-declared; checked again at collection) |
| 9 | `harvestDate` | "When will you harvest it, or have you already harvested it?" | "today", "next week", "15 November", "5 days ago"… Must fall between 90 days ago and a year ahead |
| 10 | `location` | "Is the crop at your farm in {village, district}?" | "no" → "Please tell me the village or place where the crop is kept." |
| 11 | `weighmentScaleId` | "Has the crop been weighed at a weighbridge or weighing scale? If yes, please say the scale or receipt number." | Optional. "WB NSK 07" → `WB-NSK-07`; "no" → empty (not weighed yet; no made-up ID) |
| 12 | `pricePerKg` | "What price do you expect per kilo? For example 25 rupees per kilo, or 2500 per quintal." | Optional. Per quintal ÷ 100, per tonne ÷ 1000. Stored as `price_per_kg`, with `total_price` calculated |

```json
{
  "id": "LT-482913", "farmerId": "FM-482913", "farmerName": "Sunita Pawar",
  "crop": "Onion", "cropCategory": "Vegetable", "variety": "Nashik Red",
  "farmingMethod": "Organic", "organicCertified": false, "sowingDate": "2026-07-20",
  "quantity": 25, "unit": "quintals", "qualityGrade": "Grade A",
  "location": "Ozar, Nashik", "harvestDate": "2026-10-25",
  "weighmentScaleId": "WB-NSK-07", "pricePerKg": 20
}
```

### Upcoming harvest → `POST /crop-availability` (helper "Crop availability" form)

The questions are the same as for a lot, except:
- the crop question is "Which crop are you growing that you will harvest soon?";
- quality grade and weighbridge are **not** asked, because the crop isn't harvested yet;
- the harvest date must be today or later ("That date has already passed. For a crop that is already harvested, please register a crop lot instead.");
- the expected price is stored as `expectedPricePerKg`;
- the last question is "Is there anything else buyers should know, for example soil type or irrigation? If nothing, say no." This answer becomes `notes`;
- if the farmer doesn't know the variety, it is stored as `Not specified`.

```json
{
  "id": "CA-551204", "farmerId": "FM-482913", "farmerName": "Sunita Pawar",
  "crop": "Soybean", "cropCategory": "Oilseed", "variety": "Not specified",
  "farmingMethod": "Conventional", "organicCertified": null, "sowingDate": null,
  "estimatedQuantity": 40, "unit": "quintals", "expectedHarvestDate": "2026-12-15",
  "location": "Ozar, Nashik", "expectedPricePerKg": 45, "notes": "drip irrigation, black soil"
}
```

The new fields (`cropCategory`, `farmingMethod`, `organicCertified`, `sowingDate`, price) need **migration 006** (`database/migrations/006_crop_details.sql`).

---

## 2. The call, step by step

### 2.1 Greeting and language

> **Agent (Hindi):** नमस्ते, Farmly में आपका स्वागत है। मैं किसान पंजीकरण, आने वाली फसल और फसल लॉट दर्ज करने में आपकी मदद कर सकता हूँ। कृपया अपनी भाषा का नाम बोलें, या फ़ोन पर बटन दबाएँ।
> **Agent (English):** Welcome to Farmly. Please say the name of your language, or press 1 Hindi, 2 Marathi, 3 English, 4 Gujarati, 5 Bengali, 6 Tamil, 7 Telugu, 8 Kannada, 9 Malayalam, or 0 for more languages.
> *(0)* Press 1 for Punjabi, 2 for Odia, 3 for Assamese, or 4 for Urdu.

- The farmer can say the language name ("Marathi", "मराठी"), just start talking (the language is detected), or press a key.
- If the agent still can't tell after two tries, or hears nothing, it continues in **Hindi**.

> **Agent:** Thank you. We will continue in Marathi.

### 2.2 Who is calling?

The agent looks up the caller ID in the Farmly farmer registry.

**Registered caller:**
> **Agent:** Namaste Ramesh. I found your Farmly registration.
> **Agent:** What would you like to do today? Press 1 or say *crop lot*, to register a crop you have harvested and want to sell. Press 2 or say *upcoming harvest*, to tell buyers about a crop you will harvest soon.

If the farmer hung up during a lot or harvest within the last 24 hours:
> **Agent:** Last time you started registering Wheat. Would you like to continue it? Say yes or no.
> *yes* → continues from the first unanswered question. *no* → main menu.

**Number not registered:**
> **Agent:** This mobile number is not registered with Farmly yet. I can register you now on this call. It takes about two minutes. Say yes to register. If you are already registered with a different mobile number, press 2.

| Farmer | Agent |
|---|---|
| "yes" / 1 | → **3. Farmer registration** |
| 2 / "I'm registered with another number" | "Please type the 10-digit mobile number you registered with Farmly, on your phone keypad." It looks that number up. If it's still not found, the registration offer is repeated |
| "no" | "Okay. Your field helper will call you back to help you. Thank you for calling Farmly." *(callback queued; call ends)* |

### 3. Farmer registration

> **Agent:** Let's register you. I will ask a few questions about you and your farm.
> **Agent:** Shall I register the mobile number ending in 2 2 3 3? Say yes or no.
> **Farmer:** Yes.
> **Agent:** Please tell me your full name.
> **Farmer:** My name is Sunita Pawar.
> **Agent:** Which village do you live in?
> **Farmer:** Ozar.
> **Agent:** Which taluka or tehsil is your village in? If you don't know, say don't know.
> **Farmer:** Niphad.
> **Agent:** Which district is it in?
> **Farmer:** Nashik.
> **Agent:** And which state?
> **Farmer:** Maharashtra.
> **Agent:** What do you mainly farm? For example crops, vegetables, fruits, dairy, poultry, or mixed farming.
> **Farmer:** Onion and tomato. *(→ Vegetables)*
> **Agent:** Are you a member of a farmer producer organisation or a cooperative society? If yes, please say its name. If not, say no.
> **Farmer:** Yes, Sahyadri Farmers Producer Company.
> **Agent:** To create your Farmly profile we will store your name, mobile number and village. Buyers will not see your mobile number. Your field helper and Farmly can see your details. Do you agree? Say yes or no.
> **Farmer:** Yes, I agree.
> **Agent:** Please check your details. Name: Sunita Pawar. Mobile number ending in 2 2 3 3. Village Ozar, taluka Niphad, district Nashik, Maharashtra. Farming: Vegetables. Producer organisation: Sahyadri Farmers Producer Company. Shall I register you? Say yes, or no to change something. You can also press 1 for yes or 2 for no.

| Farmer | Agent |
|---|---|
| "yes" / 1 | Registers the farmer (see below) |
| "no" / 2 | "What would you like to change: name, mobile number, village, taluka, district, state, farming type, or producer organisation?" It asks only that question again, then reads everything back again |
| says no at the consent question | "Okay. Without your agreement I cannot register you, and nothing has been saved. Your field helper can explain more and will call you. Thank you." *(callback queued; call ends)* |
| hidden caller ID, or "no" at the mobile question | "Please type the 10-digit mobile number you want to register, on your phone keypad." |

After the backend stores the profile:
> **Agent:** You are now registered with Farmly. Your Farmly ID is F M 4 8 2 9 1 3. Your field helper can see your profile.
> **Agent:** What would you like to do today? Press 1… *(main menu, so the farmer can register a crop straight away)*

If the mobile number turns out to be registered already, nothing is created twice:
> **Agent:** This mobile number is already registered with Farmly. Namaste Ramesh. I found your Farmly registration. *(main menu)*

If the backend fails:
> **Agent:** Your details are saved, but the registration could not be completed right now. Your field helper will complete it and call you. Thank you.
> *(The JSON and its reserved Farmly ID are kept. The helper presses **Retry** in the workspace and the same ID is used.)*

### 4. Crop lot (menu 1)

> **Agent:** Which crop do you want to register? For example wheat, onion, soybean or cotton.
> **Farmer:** Kanda. *(→ Onion, a vegetable)*
> **Agent:** Which variety of Onion is it? If you don't know, say don't know.
> **Farmer:** Nashik red.
> **Agent:** How is this Onion grown? Say organic, if you use no chemical fertiliser or sprays. Say natural, for natural or zero-budget farming. Or say chemical, if you use chemical fertiliser or sprays. You can also press 1 for organic, 2 for natural, or 3 for chemical.
> **Farmer:** Organic, only compost.
> **Agent:** Do you have an organic certificate for this crop? Say yes or no.
> **Farmer:** No.
> **Agent:** When did you sow it? For example 3 months ago, or 15 June. If you don't remember, say don't know.
> **Farmer:** Three months ago.
> **Agent:** How much Onion do you have? Please say the amount with the unit, for example 500 kilos, 20 quintals or 2 tonnes.
> **Farmer:** Around 30.
> **Agent:** Is that 30 kilos, quintals or tonnes?
> **Farmer:** Quintal.
> **Agent:** What is the quality of the crop? Press 1 or say A grade, for export quality. Press 2 or say B grade, for good commercial quality. Press 3 or say standard, for local mandi quality. If you are not sure, say not sure.
> **Farmer:** A grade.
> **Agent:** When will you harvest it, or have you already harvested it? For example today, next week, or 15 November.
> **Farmer:** In 10 days.
> **Agent:** Is the crop at your farm in Ozar, Nashik? Say yes or no.
> **Farmer:** Yes.
> **Agent:** Has the crop been weighed at a weighbridge or weighing scale? If yes, please say the scale or receipt number. If not, say no.
> **Farmer:** No.
> **Agent:** What price do you expect per kilo? For example 25 rupees per kilo, or 2500 per quintal. If you don't know, say don't know.
> **Farmer:** 2000 per quintal. *(→ 20 rupees per kilo)*
> **Agent:** Please check the details. Crop: Onion, a vegetable, variety Nashik red. Farming: organic, not certified. Sown: 20 July 2026. Quantity: 30 quintals, Grade A. Harvest: expected on 28 October 2026. Location: Ozar, Nashik. Weighbridge: not weighed yet. Expected price: 20 rupees per kilo. Shall I register this crop lot? Say yes to register, or no to change something. You can also press 1 for yes or 2 for no.

- **"no"** → "What would you like to change: the crop, crop type, variety, farming method, sowing date, quantity, quality grade, harvest date, location, weighbridge or price?" The agent asks only that question again, then repeats the read-back.
- **"yes"** → after the backend stores the lot:

> **Agent:** Your crop lot is registered. Your batch number is L T 4 8 2 9 1 3. Your helper can see it in Farmly.
> **Agent:** Would you like to do anything else? Press 1 to register another crop lot, 2 for an upcoming harvest, or 3 to finish the call.

### 5. Upcoming harvest (menu 2)

> **Agent:** Which crop are you growing that you will harvest soon?
> **Farmer:** Soybean.
> **Agent:** Which variety of Soybean is it? If you don't know, say don't know.
> **Farmer:** Don't know.
> **Agent:** How is this Soybean grown? Say organic… natural… or chemical…
> **Farmer:** We use fertiliser and spray. *(→ chemical)*
> **Agent:** When did you sow it? For example 3 months ago, or 15 June. If you don't remember, say don't know.
> **Farmer:** Don't remember.
> **Agent:** About how much Soybean do you expect to harvest? Please say the amount with the unit, for example 500 kilos or 20 quintals.
> **Farmer:** 40 quintals.
> **Agent:** When do you expect to harvest it? For example next month, or 15 December.
> **Farmer:** 15 December.
> **Agent:** Is the crop at your farm in Ozar, Nashik? Say yes or no.
> **Farmer:** Yes.
> **Agent:** What price do you expect per kilo? For example 25 rupees per kilo, or 2500 per quintal. If you don't know, say don't know.
> **Farmer:** 4500 per quintal.
> **Agent:** Is there anything else buyers should know, for example soil type or irrigation? If nothing, say no.
> **Farmer:** Drip irrigation, black soil.
> **Agent:** Please check. Upcoming harvest of Soybean, an oilseed, variety not known. Farming: with chemical fertiliser or sprays. Sown: not known. About 40 quintals, expected on 15 December 2026. Location: Ozar, Nashik. Expected price: 45 rupees per kilo. Notes: drip irrigation, black soil. Shall I record this? Say yes, or no to change something.
> **Farmer:** Yes.
> **Agent:** Your upcoming harvest is recorded. Your reference number is C A 5 5 1 2 0 4. Buyers on Farmly can now see it.
> **Agent:** Would you like to do anything else? Press 1…, 2…, or 3 to finish the call.

### 6. Ending the call

> **Farmer:** 3 / "That's all."
> **Agent:** Thank you for calling Farmly. Goodbye.

If the farmer stays silent at "anything else?", the agent says goodbye. Everything already registered stays registered.

---

## 7. Questions a farmer may ask (any time)

The agent answers, then repeats the question it was waiting on.

| Farmer asks (any language) | Agent answers |
|---|---|
| "What is this?" / "Why are you asking?" | Farmly registers farmers and their crops so that buyers can find them and buy directly. I am asking only the details needed for your registration. |
| "What price will I get?" / "Who will buy?" | After registration, registered distributors can see your crop and make a purchase. Your helper will tell you about offers. Prices are agreed with the buyer, not on this call. |
| "When will I get paid?" | Payment is made by the buyer after purchase, and you can see the status in Farmly or ask your helper. |
| "Is my data safe?" / "Will you share my number?" | Your phone number and personal details are not shown to buyers. Only your helper and Farmly can see them. |
| "Do I need a certificate?" | Buyers can purchase your lot after a certificate is added. Your helper can help you upload one after registration. |
| "Is there any fee?" / "Does it cost money?" | Registering with Farmly is free. This call does not charge you anything extra. |
| "Do I need Aadhaar / documents?" | You don't need any documents for this call. Your helper may visit later to verify your details and upload certificates. |

**Commands (any time):**

| Farmer says | Agent does |
|---|---|
| "Repeat" / "Say again" | Repeats the current question |
| "Start again" | Restarts the current registration from its first question |
| "Stop" / "Cancel" / "Bye" | "Okay, I have stopped. Nothing more will be registered. You can call again any time." Anything already confirmed stays registered |
| "Talk to my helper" / "Connect me to a person" | "I will connect you to your field helper now. Please stay on the line." It dials the helper's phone. If the helper is unavailable: "Your field helper is not available right now. We have noted your request and your helper will call you back." Then it repeats the question |

---

## 8. Silence, misunderstanding and failures

| Situation | Agent |
|---|---|
| Silence | "Sorry, I didn't hear you." and the question again. After the 3rd silence in a row: "I'm sorry this is difficult. Your field helper will call you back to complete it. Thank you for calling Farmly." *(callback queued)* |
| Answer not understood | "Sorry, I didn't understand." and the question again. After the 3rd failed try at the same question, the call ends with the callback message above |
| Speech service down | "Sorry, I am having trouble understanding right now. Your field helper will call you back. Thank you." |
| Backend can't save | "Your details are saved, but the registration could not be completed right now. Your field helper will complete it and call you. Thank you." **No ID is read out.** The JSON is kept for **Retry** |
| Caller hangs up | The session is marked *hung up (resumable)*. On the next call within 24 hours the agent offers to continue (2.2) |
| Same webhook delivered twice / farmer presses 1 twice | Turns are processed one at a time per call, and every record ID is reserved before saving, so only one record is ever created |

---

## 9. What the helper sees

The **Phone Registrations** page (`/helper/calls`) shows, for every call:
- status and outcome;
- the answers collected so far;
- missing fields and errors;
- each registration made on the call: farmer, lot or harvest, with its ID and the generated JSON;
- **Retry** for any registration that failed. Retry resends the same JSON with the same ID;
- callback requests;
- the full transcript, in the farmer's words and in English.

Registrations made on a call with no helper are filed under the helper account set in `IVR_HELPER_ID`. They then appear in that helper's activity log, exactly as if the helper had entered them in the forms.
