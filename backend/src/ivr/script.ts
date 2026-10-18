/**
 * Conversation script (English source). Documented in conversation-script.md (same folder).
 * Lines are translated into the caller's language at runtime and spoken with text-to-speech.
 * {placeholders} are filled before translation.
 */
export const PROMPTS = {
  // Greeting is spoken bilingually (Hindi + English) before a language is known.
  greetingHi:
    "नमस्ते, Farmly में आपका स्वागत है। मैं आपकी फसल पंजीकरण में मदद कर सकता हूँ। कृपया अपनी भाषा का नाम बोलें, या फ़ोन पर बटन दबाएँ।",
  greetingEn:
    "Welcome to Farmly. Please say the name of your language, or press 1 Hindi, 2 Marathi, 3 English, 4 Gujarati, 5 Bengali, 6 Tamil, 7 Telugu, 8 Kannada, 9 Malayalam, or 0 for more languages.",
  languageMenu2: "Press 1 for Punjabi, 2 for Odia, 3 for Assamese, or 4 for Urdu.",
  languageChosen: "Thank you. We will continue in {language}.",

  askMobile: "Please type your 10-digit mobile number registered with Farmly on your phone keypad.",
  farmerFound: "Namaste {name}. I found your Farmly registration.",
  farmerNotFound:
    "This number is not registered with Farmly yet. Please ask your field helper to register you first. We have noted your call and your helper will call you back. Thank you.",

  askResume: "Last time you started registering {crop}. Would you like to continue it? Say yes or no.",

  askCrop: "Which crop do you want to register? For example wheat, onion, soybean or cotton.",
  confirmUnknownCrop: "I heard {crop}. Is that the crop name? Say yes or no.",
  askVariety: "Which variety of {crop} is it? If you don't know, say don't know.",
  askQuantity:
    "How much {crop} do you have? Please say the amount with the unit, for example 500 kilos, 20 quintals or 2 tonnes.",
  askUnit: "Is that {number} kilos, quintals or tonnes?",
  quantityUnsupportedUnit: "Please tell me the amount in kilos, quintals or tonnes.",
  quantityInvalid: "That amount doesn't look right. Please say it again.",
  askHarvest:
    "When will you harvest it, or have you already harvested it? For example today, next week, or 15 November.",
  harvestInvalid: "That date doesn't look right. Please tell me the harvest date again, for example 20 November.",
  askLocationConfirm: "Is the crop at your farm in {location}? Say yes or no.",
  askLocation: "Please tell me the village where the crop is.",

  readback:
    "Please check the details. Crop: {crop}, variety {variety}. Quantity: {quantity} {unit}. Harvest: {harvest}. Location: {location}. Shall I register this crop lot? Say yes to register, or no to change something. You can also press 1 for yes or 2 for no.",
  askWhichChange: "What would you like to change: the crop, variety, quantity, harvest date or location?",

  registered:
    "Your crop lot is registered. Your batch number is {batch}. Your helper can see it in Farmly. Thank you for using Farmly.",
  submitFailed:
    "Your details are saved, but the registration could not be completed right now. Your field helper will complete it and call you. Thank you.",

  noInput: "Sorry, I didn't hear you.",
  notUnderstood: "Sorry, I didn't understand.",
  handOffCallback:
    "I'm sorry this is difficult. Your field helper will call you back to complete the registration. Thank you for calling Farmly.",
  speechUnavailable:
    "Sorry, I am having trouble understanding right now. Your field helper will call you back. Thank you.",
  connectingHelper: "I will connect you to your field helper now. Please stay on the line.",
  noHelper: "Your field helper is not available right now. We have noted your request and your helper will call you back.",
  startOver: "Okay, let's start again.",
  stopped: "Okay, I have stopped. Nothing has been registered. You can call again any time.",
  yesNoAgain: "Please say yes or no. You can also press 1 for yes or 2 for no.",

  // Answers to questions a farmer may ask (see the script document).
  faqWhat:
    "Farmly records your crop so that buyers can see it and buy from you. I am asking only the details needed to register your crop lot.",
  faqPrice:
    "After registration, registered distributors can see your lot and make a purchase. Your helper will tell you about offers. Prices are agreed with the buyer, not on this call.",
  faqPayment: "Payment is made by the buyer after purchase, and you can see the status in Farmly or ask your helper.",
  faqPrivacy: "Your phone number and personal details are not shown to buyers. Only your helper and Farmly can see them.",
  faqCertificate:
    "Buyers can purchase your lot after a certificate is added. Your helper can help you upload one after registration.",
} as const;

export type PromptId = keyof typeof PROMPTS;

export function renderPrompt(id: PromptId, vars: Record<string, string | number> = {}): string {
  return PROMPTS[id].replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? String(vars[key]) : ""));
}

/** Prompts spoken before a language is chosen are not translated. */
export const UNTRANSLATED_PROMPTS: PromptId[] = ["greetingHi", "greetingEn", "languageMenu2"];
