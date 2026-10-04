import { SCHEMA_VERSION, THEME_PRESETS, type ScrapbookContent } from "./schema";

/**
 * DEMO_CONTENT is the legacy `birthdayConfig` carried over field for field (plus the UI phrases
 * that used to be hardcoded in the renderer). It drives /demo and is the visual-regression
 * fixture, so it must stay identical to the legacy file's text.
 */
export const DEMO_CONTENT: ScrapbookContent = {
  schemaVersion: SCHEMA_VERSION,
  recipientName: "My Love",
  senderName: "Your Name",
  petName: "baby",
  birthdayDate: "14 FEB",
  photoDateStamp: "'26 02 14",

  cover: {
    titleTop: "HAPPY BIRTHDAY,",
    handwritten: "I made a little something for you...",
    photo: null,
    photoCaption: "my favourite person",
    button: "OPEN YOUR SURPRISE ♡",
  },

  questions: [
    { q: "Are you expecting something like this, {pet}?", options: ["YES ♡", "NOT REALLY"], replies: ["you know me too well", "good. that was the plan"] },
    { q: "Are you ready for a little surprise?", options: ["DEFINITELY", "YESSS"], replies: ["love that energy", "that's my {pet}"] },
    { q: "How excited are you?", options: ["100%", "1000%"], replies: ["only 100?? okay okay", "correct answer ♡"] },
  ],
  startLine: ["Okay...", "LET'S START ♡"],
  startButton: "OPEN",

  menuTitle: "CLICK ANY CARD FOR YOU ♡",
  menuNote: "open them in any order, but save the gift for last",
  cards: { letter: "MY LETTER", memories: "OUR MEMORIES", coupons: "MEMORY COUPONS", song: "OUR SONG", gift: "ONE MORE SURPRISE" },

  letter: {
    envelopeLabel: "For You ♡",
    greeting: "Happy Birthday, my love...",
    body: [
      "I've been trying to find the right words for weeks, and none of them feel big enough. So here is the small, true version.",
      "You make ordinary days feel like something worth keeping. I notice it every single time, even when I forget to say it.",
    ],
    closing: "I hope this year brings you everything you've ever wished for.",
    signoff: "Love,",
  },

  memoriesTitle: "OUR MEMORIES",
  memories: [
    { image: null, caption: "core memory ♡" },
    { image: null, caption: "that day..." },
    { image: null, caption: "can't stop smiling" },
    { image: null, caption: "one of my favorites" },
    { image: null, caption: "still thinking about this" },
    { image: null, caption: "you didn't know I took this" },
    { image: null, caption: "us, being us" },
    { image: null, caption: "again, please" },
  ],

  couponsTitle: "MEMORY COUPONS",
  couponsNote: "tap a coupon to see what it's good for",
  coupons: [
    { title: "ONE MOVIE NIGHT", message: "Your pick, no complaints from me. I bring the snacks and the blanket." },
    { title: "ONE DATE NIGHT", message: "Dress up or pyjamas, you decide. I plan every single detail." },
    { title: "ONE BIG HUG", message: "Redeemable anywhere, any time. No expiry and no upper limit on length." },
    { title: "YOUR FAVORITE FOOD", message: "Whatever you're craving, wherever it's from. I'm paying." },
    { title: "ONE DAY, YOUR CHOICE", message: "A full day where you make the plans and I say yes to all of them." },
  ],

  reasonsTitle: "side A: things I love about you",
  reasons: ["Your smile", "Your kindness", "Your crazy side", "The way you say my name", "How safe you feel"],

  song: { title: "Our Song ♡", artist: "Artist Name", audio: null, cover: null },

  surprise: {
    titleTop: "HAPPY BIRTHDAY",
    small: "A little surprise made just for you.",
    hint: "tap the cupcake ♡",
    afterTap: "wish made. keep it secret ♡",
    next: "one more thing ♡",
    photos: [null, null],
    captions: ["then", "now ♡"],
  },

  final: {
    wait: ["WAIT...", "ONE MORE THING..."],
    heading: "HAPPY BIRTHDAY, MY LOVE ♡",
    finalMessage: "Thank you for being one of the most beautiful parts of my life.",
    photo: null,
    photoCaption: "us ♡",
    lines: ["Here's to more memories,", "more laughs,", "more chaos,", "and more moments together."],
    restart: "START AGAIN ↻",
  },

  theme: { ...THEME_PRESETS.classic!.theme },

  copy: {
    back: "← back",
    opened: "opened ♡",
    openedCount: "{n} of {total} opened",
    questionOf: "question {n} of {total}",
    readyBar: "ready.exe",
    tapEnvelope: "tap the envelope ♡",
    memoriesNote: "tap any photo to hold it closer ♡",
    putBack: "put it back ♡",
    couponGoodFor: "this coupon is good for",
    couponNo: "no. {n}, valid forever",
    finePrint: "the fine print",
    couponFrom: "from {sender}, with love",
    useIt: "use it now ♡",
    unuseIt: "un-use it",
    backToCoupons: "← coupons",
    usedStamp: "USED ♡",
    nowPlaying: "NOW PLAYING ♪",
    pressPlay: "press play when you're ready ♡",
    playingSong: "this one always makes me think of you ♡",
    playingMusicBox: "a little music-box tune, just for the demo ♡",
    audioError: "the song couldn't load right now. try again in a moment ♡",
  },
};

/**
 * Starting point for a freshly purchased site: the demo wording (customers edit from a
 * finished example rather than a blank form), with the names cleared so Publish requires them.
 */
export function newSiteContent(): ScrapbookContent {
  const c = structuredClone(DEMO_CONTENT);
  c.recipientName = "";
  c.senderName = "";
  c.copy.playingMusicBox = "a little music-box tune, just for you ♡";
  return c;
}
