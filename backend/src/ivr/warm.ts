/**
 * Pre-translates and pre-synthesises the fixed phone prompts, so a language's first real call does
 * not wait for Sarvam on every question. Prompts with placeholders (names, crops, read-backs) are
 * still generated during the call.
 *
 * Usage: npm run ivr:warm -- hi-IN mr-IN        (no arguments = all enabled languages)
 * Cost: roughly 9,000 characters of translation and speech per language (see src/ivr/README.md).
 */
import { PROMPTS, PromptId, UNTRANSLATED_PROMPTS } from "./script";
import { IVR_LANGUAGES, getLanguage } from "./languages";
import { speechConfigured, synthesize, translate } from "./speech";

const FIXED_LANGUAGE: Partial<Record<PromptId, string>> = { greetingHi: "hi-IN", greetingEn: "en-IN", languageMenu2: "en-IN" };

async function main() {
  if (!speechConfigured()) {
    console.error("SARVAM_API_KEY is not set in backend/.env; nothing to warm.");
    process.exit(1);
  }
  const codes = process.argv.slice(2).length ? process.argv.slice(2) : IVR_LANGUAGES.map((l) => l.code);
  const ids = (Object.keys(PROMPTS) as PromptId[]).filter((id) => !PROMPTS[id].includes("{"));

  // Opening prompts are spoken as written, before a language is chosen.
  for (const id of UNTRANSLATED_PROMPTS) {
    const lang = getLanguage(FIXED_LANGUAGE[id])!;
    await synthesize(PROMPTS[id], lang.ttsCode);
  }

  for (const code of codes) {
    const lang = getLanguage(code);
    if (!lang) {
      console.warn(`Unknown language ${code}, skipped`);
      continue;
    }
    let done = 0;
    let chars = 0;
    for (const id of ids) {
      if (UNTRANSLATED_PROMPTS.includes(id)) continue;
      try {
        const text = lang.promptLanguage === "en-IN" ? PROMPTS[id] : await translate(PROMPTS[id], lang.promptLanguage);
        await synthesize(text, lang.ttsCode);
        done++;
        chars += text.length;
      } catch (err: any) {
        console.warn(`  ${code} ${id}: ${err.message}`);
      }
      // Sarvam text-to-speech allows 30 requests a minute.
      await new Promise((r) => setTimeout(r, 2100));
    }
    console.log(`${lang.name}: ${done}/${ids.length - UNTRANSLATED_PROMPTS.length} prompts cached (${chars} characters)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
