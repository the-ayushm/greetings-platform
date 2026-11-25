/*
 * Invitation content — recovered verbatim from the original page's data payload.
 * Edit this file to change names, dates, venues, music, photos or the RSVP number.
 * All dates are ISO-8601 with the +05:30 (IST) offset and are displayed in Asia/Kolkata time.
 */
window.INVITE = {
  slug: 'rudra-weds-gauri',
  template: 'gaurishankar',
  lead: 'groom', // whose name appears first
  groom: {
    first: 'Rudra',
    full: 'Rudra Mishra',
    parents: 'Son of Mrs. Kavita & Mr. Alok Mishra',
  },
  bride: {
    first: 'Gauri',
    full: 'Gauri Pandey',
    parents: 'Daughter of Mrs. Rekha & Mr. Sanjay Pandey',
  },
  invocation: '॥ वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥',
  invocationMeaning: 'With the divine grace of Lord Ganesha',
  hosts: 'The Mishra & Pandey families',
  message:
    'request the honour of your presence at the wedding of their children, and your blessings as they begin their journey together.',
  date: '2027-02-18T11:00:00+05:30',
  city: 'Varanasi, Uttar Pradesh',
  hashtag: '#RudraKiGauri',
  events: [
    {
      kind: 'haldi',
      name: 'Haldi',
      start: '2027-02-16T10:00:00+05:30',
      venue: 'Mishra Niwas',
      address: 'Lanka, Varanasi, Uttar Pradesh 221005',
      note: 'A morning of turmeric, marigolds and laughter',
      dress: 'Yellows',
    },
    {
      kind: 'sangeet',
      name: 'Sangeet',
      start: '2027-02-17T19:00:00+05:30',
      venue: 'Ganga Darshan Lawns',
      address: 'Assi Ghat Road, Varanasi, Uttar Pradesh 221005',
      note: 'An evening of music and dance',
    },
    {
      kind: 'phere',
      name: 'Wedding',
      start: '2027-02-18T11:00:00+05:30',
      venue: 'Kashi Vivah Mandap',
      address: 'Dashashwamedh Road, Varanasi, Uttar Pradesh 221001',
      note: 'Seven vows before the sacred fire',
    },
    {
      kind: 'reception',
      name: 'Reception',
      start: '2027-02-18T19:30:00+05:30',
      venue: 'The Ramada Plaza',
      address: 'The Mall, Cantonment, Varanasi, Uttar Pradesh 221002',
      dress: 'Evening formal',
    },
  ],
  rsvp: {
    // WhatsApp number in international format without "+" (value recovered from the original page data).
    phone: '919699711809',
    by: '2027-02-05T00:00:00+05:30',
    contact: 'Mishra family',
    // The original page is flagged as a platform *demo*: pressing "Send RSVP" only showed a notice.
    // false = really open WhatsApp with the pre-filled RSVP (default); true = reproduce the demo notice.
    demo: false,
  },
  closing: 'Har Har Mahadev. Your blessings will make our day complete.',
  music: 'assets/music/piya-ghar-aavenge.mp3',
  gallery: ['assets/moments/m1.jpg', 'assets/moments/m2.jpg', 'assets/moments/m3.jpg', 'assets/moments/m4.jpg'],
  // footer credit (set noBranding: true to hide it)
  noBranding: false,
  brandName: 'Aavjoo',
  brandHref: 'https://aavjoo.in/',
};

/* UI strings (English) — recovered from the original i18n bundle. */
window.STRINGS = {
  tapAnywhere: 'Tap anywhere to open',
  scrollToSeeMore: 'Scroll to see more',
  openingLine: ['Written by destiny,', 'blessed by Mahadev'],
  heroKicker: 'We cordially invite you to the wedding of',
  togetherWithFamilies: 'Together with their families',
  with: 'with',
  eventsKicker: 'Join us for',
  eventsTitle: 'The celebrations',
  dress: (e) => `Dress: ${e}`,
  directions: 'Directions',
  saveDate: 'Save date',
  countdownKicker: 'Counting down',
  countdownTitle: 'Until we say “I do”',
  justMarried: 'Just married!',
  units: ['Days', 'Hours', 'Minutes', 'Seconds'],
  momentsKicker: 'Our moments',
  momentsTitle: 'Before the big day',
  photoOf: (e, a) => `Open photo ${e} of ${a}`,
  tapOutside: 'tap outside to close',
  scratchKicker: 'A little surprise',
  scratchTitle: 'Save the date',
  scratchFoil: '✦  SCRATCH TO REVEAL THE DATE  ✦',
  scratchAria: 'Scratch to reveal the wedding date',
  revealInstead: 'Tap here to reveal instead',
  rsvpKicker: 'RSVP',
  rsvpTitle: 'Will you join us?',
  replyBy: (e) => `Kindly reply by ${e}`,
  accept: 'Joyfully accept',
  decline: 'Regretfully decline',
  yourName: 'Your name',
  namePlaceholder: 'e.g. Sharma family',
  guests: 'Number of guests',
  attendingAt: 'Celebrating with us at',
  tapToPick: "Tap each function you'll attend",
  pickOne: "Tap the functions you'll attend, then send.",
  note: 'A note for the couple',
  optional: 'Optional',
  sendRsvp: 'Send RSVP on WhatsApp',
  rsvpYes: (g, b, name, guests, fns) => [
    `Namaste! RSVP for ${g} & ${b}'s wedding 🌸`,
    `Name: ${name}`,
    `Guests: ${guests}`,
    `Attending: ${fns || '—'}`,
  ],
  rsvpNo: (g, b, name) => [
    `Namaste! RSVP for ${g} & ${b}'s wedding`,
    `Name: ${name}`,
    `Sadly we can't make it, but sending all our love 🙏`,
  ],
  rsvpNote: (e) => `Note: ${e}`,
  demoNotice:
    'This is a demo invitation, so nothing was sent. On your own invite, guests’ replies arrive straight on your WhatsApp. 💌',
  craftedBy: (e) => `Crafted with love by ${e}`,
};
