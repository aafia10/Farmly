# Farmly IVR — Crop Lot Registration Script

This is the conversation the Farmly phone assistant follows to register a crop lot for a farmer. It mirrors the Field Helper's **Lot Documentation** form (`frontend/app/helper/lots`) and the backend `createLot` API, so a lot registered by phone is the same as one a helper enters by hand.

The script is written in English. At runtime every line is translated into the caller's language with Sarvam Translate and spoken with Sarvam text-to-speech (see `backend/src/ivr/script.ts`, which holds the exact strings). The farmer may answer in any supported language or mix languages; answers are converted to English by Sarvam speech-to-text before they are checked.

## Fields collected

| Field | Source | Required | Validation |
|---|---|---|---|
| Farmer | Caller's number, or 10-digit mobile typed on the keypad | Yes | Must match a registered farmer (`farmers.mobile`) |
| Crop | Asked | Yes | Matched to the crop list; unknown crops are read back for confirmation |
| Variety | Asked | No | Free text; "I don't know" is accepted |
| Quantity and unit | Asked | Yes | Number greater than 0 and at most 1,000 tonnes; unit is kg, quintals or tonnes |
| Harvest date | Asked | Yes | Already harvested, today, or a future date within 365 days; not more than 90 days in the past |
| Location | From the farmer's profile, confirmed | Yes | Village and district from the profile, or a new place name |

Quality grade is **not** asked: a farmer cannot certify the grade of their own produce, so phone registrations use the existing default (`Standard`) and are marked as farmer-declared. Weighment details come from the physical weighing at collection and are not asked either.

## Call flow

### 1. Greeting and language

> **Agent (Hindi and English):** "Namaste, welcome to Farmly. I can help you register your crop. Please say the name of your language, for example Hindi, Marathi or Tamil. You can also press a key on your phone: 1 Hindi, 2 Marathi, 3 English, 4 Gujarati, 5 Bengali, 6 Tamil, 7 Telugu, 8 Kannada, 9 Malayalam, or 0 for more languages."

- The spoken reply is sent to speech-to-text with language auto-detection; the detected language is used.
- **0** plays the second menu: 1 Punjabi, 2 Odia, 3 Assamese, 4 Urdu.
- If nothing is understood after two tries, the call continues in Hindi.
- Assamese and Urdu are *partial*: the farmer may speak them, but prompts are spoken with the Bengali and Hindi voices because no Assamese or Urdu voice is available.

> **Agent:** "Thank you. We will continue in {language}."

### 2. Identify the farmer

- The caller's number is matched against registered farmers.
- If it matches:
  > **Agent:** "Namaste {first name}. I found your Farmly registration."
- If it does not match, or matches more than one farmer:
  > **Agent:** "Please type your 10-digit mobile number registered with Farmly on your phone keypad."
- If the typed number is not registered:
  > **Agent:** "This number is not registered with Farmly yet. Please ask your field helper to register you first. We have noted your call and your helper will call you back. Thank you."
  The call ends and a callback request appears in the helper's workspace.

### 3. Resume an unfinished registration

If the same farmer has an unfinished phone registration from the last 24 hours:

> **Agent:** "Last time you started registering {crop}. Would you like to continue it? Say yes or no."

- **Yes:** continue from the first missing field.
- **No:** start a new registration.

### 4. Crop

> **Agent:** "Which crop do you want to register? For example wheat, onion, soybean or cotton."

- **Recognised crop:** move on.
- **Unrecognised name:**
  > "I heard {answer}. Is that the crop name? Say yes or no."
- **No answer:**
  > "Sorry, I didn't hear you. Please tell me the crop name."

### 5. Variety

> **Agent:** "Which variety of {crop} is it? If you don't know, say 'don't know'."

### 6. Quantity

> **Agent:** "How much {crop} do you have? Please say the amount with the unit, for example 500 kilos, 20 quintals or 2 tonnes."

- **Number without a unit:**
  > "Is that {number} kilos, quintals or tonnes?"
- **Bags or other units:**
  > "Please tell me the amount in kilos, quintals or tonnes."
- **Zero, negative or unrealistic (more than 1,000 tonnes):**
  > "That amount doesn't look right. Please say it again."

### 7. Harvest date

> **Agent:** "When will you harvest it, or have you already harvested it? For example today, next week, or 15 November."

- "Already harvested", "done" or a past date: recorded as harvested on that date (today if no date is given).
- Relative answers ("tomorrow", "in 10 days", "next week", "next month") are converted to a date.
- **Unclear:**
  > "Please tell me the harvest date again, for example 20 November."
- **More than 90 days in the past or more than a year ahead:**
  > "That date doesn't look right. Please tell me the harvest date again."

### 8. Location

> **Agent:** "Is the crop at your farm in {village}, {district}? Say yes or no."

- **Yes:** the profile location is used.
- **No:**
  > "Please tell me the village where the crop is."
- **No village on the profile:** the agent asks the village question directly.

### 9. Read back and confirm

> **Agent:** "Please check the details. Crop: {crop}, variety {variety}. Quantity: {quantity} {unit}. Harvest: {harvest date}. Location: {location}. Shall I register this crop lot? Say yes to register, or no to change something. You can also press 1 for yes or 2 for no."

- **Yes, or key 1:** submit (step 10).
- **No, or key 2:**
  > "What would you like to change: the crop, variety, quantity, harvest date or location?"
  The agent asks that question again and returns to the read-back.

**Nothing is registered until the farmer says yes here.**

### 10. Register

The confirmed details are submitted through the same backend path a field helper uses, on behalf of the farmer's assigned helper.

- **Success:**
  > "Your crop lot is registered. Your batch number is {batch ID, read in groups}. Your helper can see it in Farmly. Thank you for using Farmly."
- **Backend failure:**
  > "Your details are saved, but the registration could not be completed right now. Your field helper will complete it and call you. Thank you."
  The batch number is **never** announced unless the backend has confirmed the lot.

## Questions the farmer may ask

These are recognised at any question. The agent answers, then repeats the question that was pending.

| Farmer asks | Agent answers |
|---|---|
| "What is this?" / "Why are you asking?" | "Farmly records your crop so that buyers can see it and buy from you. I am asking only the details needed to register your crop lot." |
| "Will I get a good price?" / "Who will buy it?" | "After registration, registered distributors can see your lot and make a purchase. Your helper will tell you about offers. Prices are agreed with the buyer, not on this call." |
| "When will I get paid?" | "Payment is made by the buyer after purchase, and you can see the status in Farmly or ask your helper." |
| "Is my information safe?" | "Your phone number and personal details are not shown to buyers. Only your helper and Farmly can see them." |
| "Do I need a certificate?" | "Buyers can purchase your lot after a certificate is added. Your helper can help you upload one after registration." |
| "Talk to my helper" / "I want a person" | "I will connect you to your field helper now." The call is transferred to the assigned helper with numbers masked. If no helper is assigned or the helper does not answer, a callback request is recorded. |
| "Repeat" / "Say again" | The last question is repeated. |
| "Start again" | "Okay, let's start again." Collected crop details are cleared. |
| "Stop" / "Cancel" | "Okay, I have stopped. Nothing has been registered. You can call again any time." The call ends. |

## Silence, errors and disconnection

| Situation | Behaviour |
|---|---|
| No answer | "Sorry, I didn't hear you." The question is repeated, up to 2 times. Then the agent offers a helper callback and ends the call. The unfinished registration can be resumed later. |
| Speech not understood | "Sorry, I didn't understand." The question is repeated. After 3 failed attempts on the same question, a helper callback is offered. |
| Speech service unavailable | "Sorry, I am having trouble understanding right now. Your helper will call you back." A callback request is recorded and no lot is created. |
| Caller hangs up | The session is saved as incomplete and can be resumed within 24 hours. No lot is created. |
| Duplicate confirmation (retried webhook, pressing yes twice) | The same lot is returned; a second lot is never created. |
