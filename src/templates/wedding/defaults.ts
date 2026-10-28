import { SCHEMA_VERSION, type WeddingContent } from "./schema";
import { DEFAULT_THEME } from "./theme";

/**
 * Starting content. DEMO_CONTENT drives /demo/wedding (sample couple, sample venue, no
 * personal data); newSiteContent() is what a customer gets after buying: the same wording
 * and schedule, with names, date and venue left for them. Ids are fixed strings so the
 * database seed generated from this file is deterministic.
 */

const base = (): Omit<WeddingContent, "couple" | "event" | "location"> => ({
  schemaVersion: SCHEMA_VERSION,
  sections: { couple: true, countdown: true, schedule: true, location: true, dresscode: true, rsvp: true },
  envelope: { enabled: true, hint: "Tap the seal to open" },
  cover: { title: "Wedding Day", dateStyle: "dots", scrollHint: "Scroll down" },
  intro: {
    heading: "{bride} & {groom}\nwarmly invite you",
    message: "to celebrate with them as their families come together for their wedding ceremony and the joyful celebration that follows.",
    photos: [],
  },
  countdown: { title: "The Celebration Begins In", afterMessage: "The celebration has begun — thank you for being part of our day ♡" },
  schedule: {
    title: "Schedule of Events",
    items: [
      { id: "sarrival", time: "17:00", title: "Guest Arrival", note: "" },
      { id: "sceremony", time: "18:00", title: "Wedding Ceremony", note: "" },
      { id: "scocktail", time: "19:00", title: "Cocktail Hour", note: "" },
      { id: "sdinner", time: "20:00", title: "Dinner", note: "" },
      { id: "sdance", time: "21:00", title: "Dance", note: "" },
    ],
  },
  dresscode: {
    title: "Dress Code",
    message: "We kindly ask guests to adorn rose gold, burgundy and brown tones for the celebration.",
    colors: [
      { id: "crosegold", hex: "#b76e79", name: "Rose gold" },
      { id: "cburgundy", hex: "#5b1727", name: "Burgundy" },
      { id: "cbrown", hex: "#6b4433", name: "Brown" },
      { id: "cchampagne", hex: "#e9d3ad", name: "Champagne" },
    ],
    illustration: true,
  },
  rsvp: {
    title: "Confirm Your Attendance",
    message: "To help us prepare for a joyful celebration, kindly confirm your attendance.",
    button: "RSVP",
    deadline: "",
    maxGuests: 4,
    askMessage: true,
    acceptLabel: "Accepts with pleasure",
    declineLabel: "Declines with regret",
    thanks: "Thank you! Your reply has been sent to {bride} & {groom} ♡",
  },
  music: { mode: "musicbox", title: "Our wedding tune", audio: null, startOnOpen: true },
  closing: {
    title: "Hope to see you there!",
    message: "Your presence is the greatest gift. We can't wait to celebrate with you.",
    saveTheDate: true,
  },
  theme: { ...DEFAULT_THEME },
});

export const DEMO_CONTENT: WeddingContent = {
  ...base(),
  couple: { brideName: "Meera", groomName: "Arjun", initials: "M&A" },
  event: { date: "2027-02-14", time: "17:00", utcOffset: "+05:30" },
  location: {
    title: "Location",
    venueName: "The Rose Court",
    address: "Sample Palace Road, Udaipur, Rajasthan 313001, India",
    mapQuery: "City Palace, Udaipur",
    showMap: true,
    photo: null,
  },
};

export function newSiteContent(): WeddingContent {
  return {
    ...base(),
    couple: { brideName: "", groomName: "", initials: "" },
    event: { date: "", time: "17:00", utcOffset: "+05:30" },
    location: { title: "Location", venueName: "", address: "", mapQuery: "", showMap: true, photo: null },
  };
}
