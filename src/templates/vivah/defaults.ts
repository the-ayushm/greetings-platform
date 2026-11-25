import { SCHEMA_VERSION, type VivahContent } from "./schema";

/**
 * Starting content. DEMO_CONTENT drives /demo/shiv-parvati (the sample couple Rudra & Gauri);
 * newSiteContent() is what a customer gets after buying: the same wording, blessing and
 * functions, with names, dates, venues and the WhatsApp number left for them. Ids are fixed
 * strings so the database seed generated from this file is deterministic.
 */

const shared = () => ({
  schemaVersion: SCHEMA_VERSION,
  opening: { line1: "Written by destiny,", line2: "blessed by Mahadev" },
  blessing: {
    invocation: "॥ वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥",
    invocationMeaning: "With the divine grace of Lord Ganesha",
    hosts: "",
    message: "request the honour of your presence at the wedding of their children, and your blessings as they begin their journey together.",
  },
  music: { mode: "default" as const, audio: null },
  words: {
    countdownTitle: "Until we say “I do”",
    eventsTitle: "The celebrations",
    momentsTitle: "Before the big day",
    rsvpTitle: "Will you join us?",
    closing: "Har Har Mahadev. Your blessings will make our day complete.",
  },
  sections: { families: true, scratch: true, countdown: true, events: true, gallery: true, rsvp: true },
});

export const DEMO_CONTENT: VivahContent = {
  ...shared(),
  couple: {
    lead: "groom",
    groom: { first: "Rudra", full: "Rudra Mishra", parents: "Son of Mrs. Kavita & Mr. Alok Mishra" },
    bride: { first: "Gauri", full: "Gauri Pandey", parents: "Daughter of Mrs. Rekha & Mr. Sanjay Pandey" },
  },
  wedding: { date: "2027-02-18", time: "11:00", city: "Varanasi, Uttar Pradesh", hashtag: "#RudraKiGauri" },
  blessing: { ...shared().blessing, hosts: "The Mishra & Pandey families" },
  events: [
    { id: "ehaldi", name: "Haldi", date: "2027-02-16", time: "10:00", venue: "Mishra Niwas", address: "Lanka, Varanasi, Uttar Pradesh 221005", note: "A morning of turmeric, marigolds and laughter", dress: "Yellows" },
    { id: "esangeet", name: "Sangeet", date: "2027-02-17", time: "19:00", venue: "Ganga Darshan Lawns", address: "Assi Ghat Road, Varanasi, Uttar Pradesh 221005", note: "An evening of music and dance", dress: "" },
    { id: "ephere", name: "Wedding", date: "2027-02-18", time: "11:00", venue: "Kashi Vivah Mandap", address: "Dashashwamedh Road, Varanasi, Uttar Pradesh 221001", note: "Seven vows before the sacred fire", dress: "" },
    { id: "ereception", name: "Reception", date: "2027-02-18", time: "19:30", venue: "The Ramada Plaza", address: "The Mall, Cantonment, Varanasi, Uttar Pradesh 221002", note: "", dress: "Evening formal" },
  ],
  // The demo shows the sample photos bundled with the template (see DEMO_GALLERY).
  gallery: [],
  rsvp: { phone: "", by: "2027-02-05", maxGuests: 12 },
};

/** Sample photos for the demo only (customers upload their own). */
export const DEMO_GALLERY = ["m1.jpg", "m2.jpg", "m3.jpg", "m4.jpg"].map((f) => `/vivah-assets/moments/${f}`);

export function newSiteContent(): VivahContent {
  return {
    ...shared(),
    couple: {
      lead: "groom",
      groom: { first: "", full: "", parents: "" },
      bride: { first: "", full: "", parents: "" },
    },
    wedding: { date: "", time: "11:00", city: "", hashtag: "" },
    events: [
      { id: "ehaldi", name: "Haldi", date: "", time: "10:00", venue: "", address: "", note: "A morning of turmeric, marigolds and laughter", dress: "Yellows" },
      { id: "esangeet", name: "Sangeet", date: "", time: "19:00", venue: "", address: "", note: "An evening of music and dance", dress: "" },
      { id: "ephere", name: "Wedding", date: "", time: "11:00", venue: "", address: "", note: "Seven vows before the sacred fire", dress: "" },
      { id: "ereception", name: "Reception", date: "", time: "19:30", venue: "", address: "", note: "", dress: "Evening formal" },
    ],
    gallery: [],
    rsvp: { phone: "", by: "", maxGuests: 12 },
  };
}
