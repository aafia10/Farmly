/**
 * Conversation script (English source). Documented in conversation-script.md (same folder).
 * Lines are translated into the caller's language at runtime and spoken with text-to-speech.
 * {placeholders} are filled before translation.
 */
export const PROMPTS = {
  // ----- Opening (spoken bilingually before a language is known) -----------------------------
  greetingHi:
    "नमस्ते, Farmly में आपका स्वागत है। मैं किसान पंजीकरण, आने वाली फसल और फसल लॉट दर्ज करने में आपकी मदद कर सकता हूँ। कृपया अपनी भाषा का नाम बोलें, या फ़ोन पर बटन दबाएँ।",
  greetingEn:
    "Welcome to Farmly. Please say the name of your language, or press 1 Hindi, 2 Marathi, 3 English, 4 Gujarati, 5 Bengali, 6 Tamil, 7 Telugu, 8 Kannada, 9 Malayalam, or 0 for more languages.",
  languageMenu2: "Press 1 for Punjabi, 2 for Odia, 3 for Assamese, or 4 for Urdu.",
  languageChosen: "Thank you. We will continue in {language}.",

  // ----- Identification --------------------------------------------------------------------------
  askMobile: "Please type the 10-digit mobile number you registered with Farmly, on your phone keypad.",
  farmerFound: "Namaste {name}. I found your Farmly registration.",
  mainMenu:
    "What would you like to do today? Press 1 or say crop lot, to register a crop you have harvested and want to sell. Press 2 or say upcoming harvest, to tell buyers about a crop you will harvest soon.",
  menuAgain:
    "Would you like to do anything else? Press 1 to register another crop lot, 2 for an upcoming harvest, or 3 to finish the call.",
  goodbye: "Thank you for calling Farmly. Goodbye.",
  askResume: "Last time you started registering {crop}. Would you like to continue it? Say yes or no.",

  // ----- New farmer registration ---------------------------------------------------------------
  notRegisteredOffer:
    "This mobile number is not registered with Farmly yet. I can register you now on this call. It takes about two minutes. Say yes to register. If you are already registered with a different mobile number, press 2.",
  notRegisteredDeclined: "Okay. Your field helper will call you back to help you. Thank you for calling Farmly.",
  regIntro: "Let's register you. I will ask a few questions about you and your farm.",
  regConfirmMobile: "Shall I register the mobile number ending in {last4}? Say yes or no.",
  askRegMobile: "Please type the 10-digit mobile number you want to register, on your phone keypad.",
  regMobileTaken: "This mobile number is already registered with Farmly.",
  askName: "Please tell me your full name.",
  askVillage: "Which village do you live in?",
  askTaluka: "Which taluka or tehsil is your village in? If you don't know, say don't know.",
  askDistrict: "Which district is it in?",
  askState: "And which state?",
  stateInvalid: "Sorry, I didn't recognise the state. Please say the state name, for example Maharashtra or Gujarat.",
  askCategory: "What do you mainly farm? For example crops, vegetables, fruits, dairy, poultry, or mixed farming.",
  askFpo:
    "Are you a member of a farmer producer organisation or a cooperative society? If yes, please say its name. If not, say no.",
  askFpoName: "Please say the name of your farmer producer organisation or cooperative.",
  askConsent:
    "To create your Farmly profile we will store your name, mobile number and village. Buyers will not see your mobile number. Your field helper and Farmly can see your details. Do you agree? Say yes or no.",
  consentDeclined:
    "Okay. Without your agreement I cannot register you, and nothing has been saved. Your field helper can explain more and will call you. Thank you.",
  regReadback:
    "Please check your details. Name: {name}. Mobile number ending in {last4}. Village {village}, taluka {taluka}, district {district}, {state}. Farming: {category}. Producer organisation: {fpo}. Shall I register you? Say yes, or no to change something. You can also press 1 for yes or 2 for no.",
  regAskWhichChange: "What would you like to change: name, mobile number, village, taluka, district, state, farming type, or producer organisation?",
  farmerRegistered: "You are now registered with Farmly. Your Farmly ID is {farmerId}. Your field helper can see your profile.",
  registerFailed:
    "Your details are saved, but the registration could not be completed right now. Your field helper will complete it and call you. Thank you.",

  // ----- Crop lot (harvested crop to sell) ------------------------------------------------------
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
  askLocation: "Please tell me the village or place where the crop is kept.",

  // Crop details asked for both lots and upcoming harvests (same answers as the website forms, plus farming method).
  askCropCategory:
    "What type of crop is {crop}? Say grain, pulse, oilseed, vegetable, fruit, spice, cash crop, or something else.",
  askFarmingMethod:
    "How is this {crop} grown? Say organic, if you use no chemical fertiliser or sprays. Say natural, for natural or zero-budget farming. Or say chemical, if you use chemical fertiliser or sprays. You can also press 1 for organic, 2 for natural, or 3 for chemical.",
  askOrganicCertified: "Do you have an organic certificate for this crop? Say yes or no.",
  askSowing: "When did you sow it? For example 3 months ago, or 15 June. If you don't remember, say don't know.",
  sowingInvalid: "That sowing date doesn't look right. Please say it again, for example 3 months ago, or say don't know.",
  askGrade:
    "What is the quality of the crop? Press 1 or say A grade, for export quality. Press 2 or say B grade, for good commercial quality. Press 3 or say standard, for local mandi quality. If you are not sure, say not sure.",
  askScale:
    "Has the crop been weighed at a weighbridge or weighing scale? If yes, please say the scale or receipt number. If not, say no.",
  askScaleNumber: "Please say the weighbridge or scale number, or say no if you don't have it.",
  askPrice:
    "What price do you expect per kilo? For example 25 rupees per kilo, or 2500 per quintal. If you don't know, say don't know.",
  priceInvalid: "Sorry, I didn't get the price. Please say it like 25 rupees per kilo, or say don't know.",

  readback:
    "Please check the details. Crop: {crop}, {category}, variety {variety}. Farming: {method}. Sown: {sowing}. Quantity: {quantity} {unit}, {grade}. Harvest: {harvest}. Location: {location}. Weighbridge: {scale}. Expected price: {price}. Shall I register this crop lot? Say yes to register, or no to change something. You can also press 1 for yes or 2 for no.",
  askWhichChange:
    "What would you like to change: the crop, crop type, variety, farming method, sowing date, quantity, quality grade, harvest date, location, weighbridge or price?",
  registered: "Your crop lot is registered. Your batch number is {batch}. Your helper can see it in Farmly.",
  submitFailed:
    "Your details are saved, but the registration could not be completed right now. Your field helper will complete it and call you. Thank you.",

  // ----- Upcoming harvest (crop availability) ---------------------------------------------------
  askAvailCrop: "Which crop are you growing that you will harvest soon?",
  askAvailQuantity:
    "About how much {crop} do you expect to harvest? Please say the amount with the unit, for example 500 kilos or 20 quintals.",
  askExpectedHarvest: "When do you expect to harvest it? For example next month, or 15 December.",
  availPastDate:
    "That date has already passed. For a crop that is already harvested, please register a crop lot instead. When do you expect to harvest?",
  askNotes: "Is there anything else buyers should know, for example soil type or irrigation? If nothing, say no.",
  availReadback:
    "Please check. Upcoming harvest of {crop}, {category}, variety {variety}. Farming: {method}. Sown: {sowing}. About {quantity} {unit}, {harvest}. Location: {location}. Expected price: {price}. Notes: {notes}. Shall I record this? Say yes, or no to change something. You can also press 1 for yes or 2 for no.",
  availAskWhichChange:
    "What would you like to change: the crop, crop type, variety, farming method, sowing date, quantity, harvest date, location, price or notes?",
  availabilityRecorded: "Your upcoming harvest is recorded. Your reference number is {ref}. Buyers on Farmly can now see it.",

  // ----- Errors, silence and commands -----------------------------------------------------------
  noInput: "Sorry, I didn't hear you.",
  notUnderstood: "Sorry, I didn't understand.",
  handOffCallback:
    "I'm sorry this is difficult. Your field helper will call you back to complete it. Thank you for calling Farmly.",
  speechUnavailable:
    "Sorry, I am having trouble understanding right now. Your field helper will call you back. Thank you.",
  connectingHelper: "I will connect you to your field helper now. Please stay on the line.",
  noHelper: "Your field helper is not available right now. We have noted your request and your helper will call you back.",
  startOver: "Okay, let's start again.",
  stopped: "Okay, I have stopped. Nothing more will be registered. You can call again any time.",
  yesNoAgain: "Please say yes or no. You can also press 1 for yes or 2 for no.",
  menuAgainHelp: "Please press 1 for a crop lot, 2 for an upcoming harvest, or 3 to finish.",

  // ----- Answers to questions a farmer may ask --------------------------------------------------
  faqWhat:
    "Farmly registers farmers and their crops so that buyers can find them and buy directly. I am asking only the details needed for your registration.",
  faqPrice:
    "After registration, registered distributors can see your crop and make a purchase. Your helper will tell you about offers. Prices are agreed with the buyer, not on this call.",
  faqPayment: "Payment is made by the buyer after purchase, and you can see the status in Farmly or ask your helper.",
  faqPrivacy: "Your phone number and personal details are not shown to buyers. Only your helper and Farmly can see them.",
  faqCertificate:
    "Buyers can purchase your lot after a certificate is added. Your helper can help you upload one after registration.",
  faqCost: "Registering with Farmly is free. This call does not charge you anything extra.",
  faqDocuments:
    "You don't need any documents for this call. Your helper may visit later to verify your details and upload certificates.",
} as const;

export type PromptId = keyof typeof PROMPTS;

export function renderPrompt(id: PromptId, vars: Record<string, string | number> = {}): string {
  return PROMPTS[id].replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? String(vars[key]) : ""));
}

/** Prompts spoken before a language is chosen are not translated. */
export const UNTRANSLATED_PROMPTS: PromptId[] = ["greetingHi", "greetingEn", "languageMenu2"];

/** Placeholders read out exactly (IDs, digits) and never sent through translation. */
export const VERBATIM_VARS = ["batch", "farmerId", "ref", "last4"];
