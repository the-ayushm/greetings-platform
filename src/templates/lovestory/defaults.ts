import { SCHEMA_VERSION, SECTION_IDS, type LoveContent } from "./schema";
import { presetTheme } from "./theme";

/**
 * Starting content. DEMO_CONTENT drives /demo/love-story (sample names, no personal data);
 * newSiteContent() is what a customer gets right after paying: the same structure and
 * wording, but names and personal dates left for them to fill in. Ids are fixed strings so
 * the database seed generated from this file is deterministic.
 */

const sections = (): LoveContent["sections"] => SECTION_IDS.map((id) => ({ id, enabled: true }));

const base = (): Omit<LoveContent, "people"> => ({
  schemaVersion: SCHEMA_VERSION,
  sections: sections(),
  welcome: {
    greeting: "Hey {partner}...",
    intro: "I have something really special\nthat I've been wanting to show you...\nA little world, just for us ♡",
    button: "Let's Begin",
    note: "Same Sky\nSame Always\nUs ♡",
    photo: null,
  },
  music: { mode: "musicbox", title: "Our little tune", artist: "made for you", audio: null },
  quiz: {
    questions: [
      {
        id: "qfirsttalk",
        type: "choice",
        prompt: "Do you still remember when we first talked?",
        options: [{ label: "Of course! ♡" }, { label: "Maybe... 🙈" }, { label: "How can I forget? ♡" }],
        correct: null,
        note: "That one hi was the start of all my favorite moments... ♡",
        photo: null,
        wrongMessage: "",
      },
      {
        id: "qlikemost",
        type: "choice",
        prompt: "What do you like the most about us?",
        options: [{ label: "Our endless conversations ♡" }, { label: "The way we make each other laugh ♡" }, { label: "Our little silly fights ♡" }, { label: "Everything about us ♡" }],
        correct: 3,
        note: "It's the little things with you that make big days... ♡",
        photo: null,
        wrongMessage: "",
      },
      {
        id: "qourplace",
        type: "image",
        prompt: "Which place feels most like 'us'?",
        options: [
          { label: "A cozy cafe with long talks", image: null },
          { label: "A beach with sunsets", image: null },
          { label: "A peaceful road trip", image: null },
          { label: "Just at home together", image: null },
        ],
        correct: null,
        note: "Anywhere is home when it's with you ♡",
        wrongMessage: "",
      },
      {
        id: "qhowmuch",
        type: "slider",
        prompt: "How much do you love me?",
        labels: ["A little", "A lot", "A whole universe ♡"],
        replies: ["Hmm... I'll take it, and I'll still love you more ♡", "A lot is a lot! My heart is doing a little dance ♡", "A whole universe? That's exactly how much I love you too ♡"],
        note: "No matter what you choose, I'll always choose you. ♡",
      },
      {
        id: "qwhatami",
        type: "text",
        prompt: "Tell me in a few words... What am I to you?",
        placeholder: "Type something...",
        note: "There's no right or wrong answer here... Just your honest feelings. ♡",
      },
    ],
    correctReply: "Yay, you remember! ♡",
    wrong: {
      title: "Are you sure? 🥺",
      message: "Aww... that's not quite right!\nBut it's okay, because every answer from you is special to me ♡",
      bubble: "Even when you guess wrong, you still make my heart smile because you're trying...\nAnd that's what matters most. ♡",
      button: "Try Again",
    },
  },
  unlock: {
    title: "You did it! ♡",
    message: "Thank you for answering all my questions...\nNow let's step into our world ♡",
    button: "Open Our Story",
    photo: null,
  },
  timeline: {
    title: "Our Story",
    subtitle: "Different days, same beautiful us...",
    events: [
      { id: "tfirstchat", date: "", title: "First Chat", description: "A random message turned into something so special.. ♡", photo: null },
      { id: "tfirstmeet", date: "", title: "The Day We Met", description: "Butterflies, nervous smiles and the start of us ♡", photo: null },
      { id: "tcloser", date: "", title: "Getting Closer", description: "More conversations, more laughter.. ♡", photo: null },
      { id: "tfirsttrip", date: "", title: "Our First Trip", description: "New places, same favourite person ♡", photo: null },
      { id: "tbeyond", date: "", title: "Today and Beyond", description: "More love, more memories to make.. ♡", photo: null },
    ],
  },
  scrapbook: {
    title: "Our Little Scrapbook",
    subtitle: "Snapshots of our happy moments...",
    categories: [
      { id: "cspecial", label: "Special Days" },
      { id: "cfun", label: "Fun Moments" },
      { id: "cplaces", label: "Our Places" },
      { id: "csilly", label: "Silly Moments" },
    ],
    photos: [
      { id: "pone", image: null, caption: "you + me ♡", date: "", category: "cspecial" },
      { id: "ptwo", image: null, caption: "best day ever", date: "", category: "cfun" },
      { id: "pthree", image: null, caption: "our spot", date: "", category: "cplaces" },
      { id: "pfour", image: null, caption: "can't stop laughing", date: "", category: "csilly" },
      { id: "pfive", image: null, caption: "golden hour", date: "", category: "cspecial" },
      { id: "psix", image: null, caption: "always us", date: "", category: "cfun" },
    ],
    note: "Collecting memories\nwith you...\nForever ♡",
  },
  calendar: {
    title: "Our Calendar",
    listTitle: "Our Special Dates",
    dates: [
      { id: "dfirstchat", date: "", label: "First Chat ♡", repeatsYearly: true },
      { id: "dmet", date: "", label: "The Day We Met ♡", repeatsYearly: true },
      { id: "dbirthday", date: "", label: "Your Birthday ♡", repeatsYearly: true },
    ],
  },
  letter: {
    heading: "To My Favorite Person...",
    tabs: [
      {
        id: "lopen",
        label: "Open Letter",
        body: "You make my days brighter, my worries lighter and my life so much happier.\n\nI just want you to know how much you mean to me, and how grateful I am to have you in my life. Here's a little letter filled with all my love...",
      },
      { id: "lreasons", label: "Reasons I Love You", body: "- The way you laugh at your own jokes\n- How you always know when I need a hug\n- Your **kindness**, every single day\n- You, just being *you*" },
      { id: "ladmire", label: "Things I Admire", body: "How brave you are, even on the hard days. How you care for the people you love. How you never stop trying." },
      { id: "lpromise", label: "My Promises", body: "- I promise to listen, always\n- I promise to make you laugh when you're sad\n- I promise to choose you, every day" },
      { id: "lfuture", label: "Our Future", body: "More late-night talks, more trips, more silly photos, more *us*. I can't wait for every chapter." },
      { id: "lnotes", label: "Little Notes", body: "You're my favourite notification.\n\nP.S. I'm smiling while writing this ♡" },
    ],
    signoff: "Forever Yours,",
    signature: "{me}",
  },
  coupons: {
    title: "Love Coupons",
    subtitle: "Little promises, big happiness...",
    items: [
      { id: "khug", title: "One Tight Hug", description: "Redeem anytime you need it ♡", redeem: "Show me this coupon and open your arms.", color: "pink", icon: "hug" },
      { id: "kmovie", title: "Movie Date", description: "Your choice, my company ♡", redeem: "Pick the movie — I bring the snacks.", color: "butter", icon: "movie" },
      { id: "kday", title: "A Day Just for You", description: "No plans, just you. Your happiness comes first ♡", redeem: "Tell me the day; I'll clear my schedule.", color: "sky", icon: "sun" },
      { id: "ktreat", title: "Your Favorite Treat", description: "Because you deserve it always ♡", redeem: "Name the treat and it's yours.", color: "lilac", icon: "treat" },
      { id: "kcuddle", title: "Cuddle Time", description: "For lazy days and longer nights ♡", redeem: "Blanket, playlist, and me. No time limit.", color: "peach", icon: "cuddle" },
      { id: "kanything", title: "Anything You Want", description: "Because your smile is everything ♡", redeem: "Whisper your wish — I'll make it happen.", color: "mint", icon: "gift" },
    ],
    redeemButton: "Redeem ♡",
    redeemedLabel: "Redeemed ♡",
    footer: "Redeem Happiness Together ♡",
  },
  photowall: {
    title: "Our Little Photo Wall",
    subtitle: "Because every picture tells a story...",
    photos: [
      { id: "wone", image: null, caption: "My favorite ♡" },
      { id: "wtwo", image: null, caption: "Good times ♡" },
      { id: "wthree", image: null, caption: "Always you ♡" },
      { id: "wfour", image: null, caption: "You & Me ♡" },
      { id: "wfive", image: null, caption: "Forever ♡" },
    ],
  },
  final: {
    title: "You Are My Everything",
    message: "No matter where life takes us,\nI'm always choosing you... ♡",
    notes: ["Thank you for being you ♡", "For all the love ♡", "For all the support ♡", "For all the good days ♡", "For staying, always ♡"],
    signature: "— {me}",
    button: "Spend Forever Together ♡",
    afterMessage: "Forever starts with you, {partner}. I love you ♡",
    photo: null,
    heart: "glow",
  },
  theme: presetTheme("cherry", { motion: "subtle", hearts: true, sparkles: true, lights: true }),
  responses: { collect: false },
  copy: { next: "Next", back: "Back", restart: "Start again ♡" },
});

export const DEMO_CONTENT: LoveContent = (() => {
  const c = base();
  const dated: Record<string, string> = { tfirstchat: "2022-10-06", tfirstmeet: "2023-01-12", tcloser: "2023-03-05", tfirsttrip: "2023-08-20", tbeyond: "2023-10-22" };
  for (const e of c.timeline.events) e.date = dated[e.id] ?? "";
  const cal: Record<string, string> = { dfirstchat: "2022-10-06", dmet: "2023-01-12", dbirthday: "2001-10-20" };
  for (const d of c.calendar.dates) d.date = cal[d.id] ?? "";
  return {
    ...c,
    people: { creatorName: "Your Name", partnerName: "You", petName: "love", relationship: "partner", occasion: "anniversary", startDate: "2023-01-12", firstMetDate: "2023-01-12" },
  };
})();

export function newSiteContent(): LoveContent {
  return {
    ...base(),
    people: { creatorName: "", partnerName: "", petName: "", relationship: "girlfriend", occasion: "birthday", startDate: "", firstMetDate: "" },
  };
}
