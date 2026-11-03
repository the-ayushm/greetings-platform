import { SCHEMA_VERSION, type AskContent } from "./schema";
import { DEFAULT_THEME } from "./theme";

/**
 * Starting content. DEMO_CONTENT drives /demo/do-you-love-me (sample names, no personal data);
 * newSiteContent() is what a customer gets after buying: the same wording with the two names
 * left for them. The database seed is generated from newSiteContent() (deterministic).
 */

/** Suggested "No" sequence — also offered in the studio as "restore the suggestions". */
export const SUGGESTED_NO_MESSAGES = [
  "Are you sure?",
  "Really sure?",
  "Think again!",
  "Last chance!",
  "Surely not?",
  "You might regret this!",
  "Don't break my heart!",
  "Please reconsider!",
  "My heart is waiting…",
  "One last chance!",
  "Just say YES! ❤️",
];

const base = (): Omit<AskContent, "people"> => ({
  schemaVersion: SCHEMA_VERSION,
  intro: {
    greeting: "Hey {partner}…",
    message: "I have something important to ask you…",
  },
  question: {
    text: "Do you love me?",
    yesText: "Yes",
    noText: "No",
    noMessages: [...SUGGESTED_NO_MESSAGES],
    takeoverHint: "There's only one answer now ♡",
  },
  finale: {
    heading: "I knew it! ❤️",
    subheading: "You just made my heart the happiest!",
    message: "Every day with you feels like my favourite day. Thank you for being my person — I love you more than words (and buttons) can say.",
    signature: "Forever yours, {sender}",
    photo: null,
    replay: true,
  },
  music: { mode: "musicbox", title: "Our little tune", audio: null, playOnYes: true },
  look: { character: "bunny", intensity: "playful", sounds: true },
  responses: { notify: true },
  theme: { ...DEFAULT_THEME },
});

export const DEMO_CONTENT: AskContent = {
  ...base(),
  people: { senderName: "Aarav", partnerName: "Riya" },
};

export function newSiteContent(): AskContent {
  return { ...base(), people: { senderName: "", partnerName: "" } };
}
