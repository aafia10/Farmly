# Phone crop registration (multilingual IVR)

A farmer phones Farmly, answers a few questions in their own language, hears the details read back, and confirms. Only then does the backend create the crop lot. It uses the same lot service as the Field Helper "Create lot" form. The farmer hears the real Batch ID only after the backend has stored the lot.

The conversation script, the questions, and the answers to farmer FAQs are in [conversation-script.md](conversation-script.md).

## How it works

```
Caller ──► Twilio number ──► POST /api/v1/ivr/twilio/voice   (signed webhook)
                │                    │
                │   <Play> prompt ◄──┤  dialog engine (src/ivr/dialog.ts)
                │   <Record> answer ─►  /ivr/twilio/turn ──► Sarvam STT (saaras:v3, translate → English)
                │                    │      parsers (crop, quantity+unit, date, yes/no, FAQ)
                │                    │  confirmed? ──► createLotRecord()  (src/services/lotService.ts)
                │   "Batch L T 4 8…" ◄┘
Helper ──► /helper/calls  (session list, fields, errors, retry, simulator)
```

- **One engine, two front doors.** Real Twilio calls and the local simulator run the same state machine (`src/ivr/dialog.ts`), so a simulated call tests exactly what a caller hears.
- **Prompts** are written once in English (`src/ivr/script.ts`). At runtime they are translated with Sarvam `sarvam-translate:v1` and spoken with Sarvam `bulbul:v3`. Both results are cached under `backend/.cache/ivr/` (git-ignored), so each fixed prompt costs money only once.
- **Answers** are transcribed straight to English with Sarvam `saaras:v3` in `translate` mode. This also handles code-mixed speech (Hinglish and similar), and one set of English parsers works for every language. Keypad presses work everywhere (1 = yes, 2 = no, language menu digits).
- **No duplicates.** A session reserves its Batch ID before the insert, the insert never overwrites (`insertOnly`), turns of one session are serialised, `voicegenie_submissions` allows one row per call, and a resumed call reuses the earlier reservation.
- **Failures.** Silence is re-asked twice, and an answer that isn't understood is re-asked up to three times. After that the call ends politely and the session is flagged for a helper callback. If speech recognition fails, or the backend fails to register the lot, the call also ends with a callback, and no Batch ID is announced. A helper can press **Retry registration**, which reuses the same Batch ID. A caller who hangs up can call back within 24 hours and continue where they left off.

## Languages

Sarvam's documentation lists these capabilities. None of the voices or recognisers has been tested yet with live calls in this project; do that before announcing a language to farmers.

| Language | Speech recognition (saaras:v3) | Spoken prompts (bulbul:v3) | Status in Farmly |
|---|---|---|---|
| Hindi, Marathi, English, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Odia | yes | yes | full |
| Assamese | yes | **no** | partial: prompts are translated to Assamese and read with the Bengali voice |
| Urdu | yes | **no** | partial: prompts are spoken in Hindi (mutually intelligible when spoken) |

Set `IVR_ENABLE_PARTIAL_LANGUAGES=false` to hide Assamese and Urdu from the menu.

## Running it for free (simulator)

1. Run migrations `002` and `003` in Supabase (see the backend README) and set `SUPABASE_SERVICE_ROLE_KEY`. Without the service-role key, sessions are kept in memory only, which is enough to try the simulator.
2. Start the backend and frontend, sign in as a **Field Helper**, and open **Phone Registrations** (`/helper/calls`).
3. Enter a registered farmer's mobile number (this acts as the caller ID) and press **Call**.
   - Without `SARVAM_API_KEY`, prompts are shown in English. You type answers in English or romanised text, or use the keypad buttons.
   - With `SARVAM_API_KEY`, prompts are translated and spoken. You can type in any Indian script, or press the mic button and speak.

A confirmed simulated call registers a **real** lot, labelled as coming from the simulator in the session list.

## Real phone calls (Twilio)

1. Create a Twilio account. The trial includes a small credit and a phone number, but it can only receive calls from numbers you have verified.
2. Expose the backend over HTTPS with a free tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:5000
   ```
   or `ngrok http 5000`.
3. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_PHONE_NUMBER`. Set `IVR_PUBLIC_BASE_URL` to the tunnel URL, with no trailing slash. Restart the backend.
4. In the Twilio console, open the number's **Voice configuration**:
   - **A call comes in:** Webhook, `POST https://<tunnel>/api/v1/ivr/twilio/voice`
   - **Call status changes:** `POST https://<tunnel>/api/v1/ivr/twilio/status`
5. Call the number from a verified phone.

Every webhook is checked against `X-Twilio-Signature`, and an unsigned request gets HTTP 403. `IVR_PUBLIC_BASE_URL` must exactly match the URL Twilio calls, or the signature check fails.

The *talk to a helper* option dials the phone number on the helper's profile (`profiles.phone`), using the Twilio number as caller ID. If no helper number exists or the helper doesn't answer, the call continues and a callback is queued.

## Costs (checked October 2026; confirm on the providers' pricing pages)

| Item | Price | Typical 3-minute registration call |
|---|---|---|
| Sarvam speech-to-text | ₹30 per hour of audio | about 45 s of answers ≈ ₹0.40 |
| Sarvam text-to-speech | ₹30 per 10,000 characters | fixed prompts cached; readback ≈ 300 chars ≈ ₹0.10 |
| Sarvam translation | ₹20 per 10,000 characters | readback only ≈ ₹0.05 |
| Twilio US number | $1.15 per month | — |
| Twilio inbound minutes + recording | $0.0085 + $0.0025 per minute | ≈ $0.035 |

Sarvam gives ₹100 of free credit at sign-up, enough for a few hundred test calls. The simulator without Sarvam is completely free.

From India, a US Twilio number is an **international call for the farmer**. For real farmers you need an Indian number. Twilio requires a regulatory bundle (business documents) before it issues one, or you can use an Indian telephony provider with a similar webhook model.

## Limits and known gaps

- Twilio waits about 15 seconds for each webhook. The first call in a new language translates and synthesises its prompts on the fly, so ring each language once to warm the cache.
- `<Record>` answers are limited to 25 seconds, and Sarvam's REST speech-to-text accepts up to 30 seconds.
- The quality grade is not asked on the phone. It is recorded as "Standard" (farmer-declared) and graded later at collection, the same as an ungraded helper entry.
- Prompt audio is served from `/api/v1/ivr/audio/<sha256>.wav` without login, because Twilio has to fetch it. The IDs can't be guessed, but a readback file contains the farmer's crop details.
