/**
 * Everything on the site that only Clint can state.
 *
 * A null here renders as a highlighted [bracket] on the page, and
 * `npm run check:launch` refuses to ship while any bracket is left.
 * Never fill one of these with a guess: an unknown stays null until Clint
 * says what it is.
 */
export const SITE = {
  name: 'Your Card Buyer',
  domain: 'yourcardbuyer.com',

  // Legal name of the business that buys the cards. Not Aidren LLC unless Clint says so.
  legalName: null,
  // For the terms page, e.g. 'the State of Kansas'.
  jurisdiction: null,

  // Shown on the site and used for tel: links. null = not shown.
  phone: null,
  email: null,

  // Where the buyer meets sellers in person, e.g. 'the Kansas City area'. null = unknown.
  serviceArea: null,
  // How cards change hands. Any of: 'in-person', 'mail'. null = unknown.
  handoff: null,
  // e.g. ['cash', 'Venmo', 'PayPal', 'check']. null = unknown.
  paymentMethods: null,
  // e.g. 'within one business day'. null = unknown.
  replyTime: null,
  // e.g. 'collections worth $250 or more'. null = no minimum stated.
  minimum: null,

  // Whether Clint wants his own name on the site (about section). null = undecided.
  ownerName: null,

  // What is bought. Each entry is a category Clint has confirmed. Until he
  // confirms, the full draft list shows with a bracket asking him to strike lines.
  buysConfirmed: false,
};

/** The draft list of what the site says it buys, pending Clint's edit. */
export const BUYS = [
  { title: 'Baseball, football, basketball and hockey', body: 'Singles, team sets and full collections from any era.' },
  { title: 'Vintage cards', body: 'Pre-1980 cards, including well-loved ones with soft corners.' },
  { title: 'Modern cards', body: 'Rookies, autos, numbered parallels, patches and other hits.' },
  { title: 'Graded slabs', body: 'PSA, BGS, SGC and CGC. Photos of the front and back of the label are enough to start.' },
  { title: 'Unopened product', body: 'Sealed hobby and retail boxes, packs and cases.' },
  { title: 'Whole collections', body: 'Binders, monster boxes and inherited collections, sorted or not.' },
];

export const SMS_CONSENT_LABEL =
  'You may text me about my cards at the number above. Message and data rates may apply. Reply STOP to opt out.';

export const CONTACT_CONSENT =
  'By sending this form you agree that Your Card Buyer may call or email you about the cards you described.';
