import { SITE, SMS_CONSENT_LABEL, CONTACT_CONSENT } from '../../site.config.mjs';
import { esc, fact } from '../util.mjs';

/*
 * NOT REVIEWED BY AN ATTORNEY. Written conservatively: it describes only what
 * the site actually does. Calls are not recorded; if that changes, this page
 * changes first.
 */
const us = () => fact(SITE.legalName, 'operating entity legal name');
const updated = 'October 2026';

export const privacyBody = (id = '') => `
<section class="section"${id ? ` id="${id}"` : ''}>
  <div class="wrap prose">
    <h1>Privacy Policy</h1>
    <p class="muted">Last updated ${updated}</p>
    <h2>What we collect</h2>
    <p>When you ask for an offer we collect what you send: your name, email address, phone number and ZIP code if you give them, your description of the cards, any price you name, and the photos you upload. Our hosting provider records basic technical information, such as the type of browser that loaded a page. We do not use it to identify you.</p>
    <p>We never ask for bank or card numbers through this site, and you should not send them.</p>
    <h2>What we do with it</h2>
    <p>We use your submission to look at your cards, make an offer, and contact you about it. We do not sell your information or share it for anyone else's marketing.</p>
    <p>This is the consent shown above the button on the form:</p>
    <blockquote>${esc(CONTACT_CONSENT)}</blockquote>
    <p>Texting is separate. We only text you if you tick the box that says: "${esc(SMS_CONSENT_LABEL)}" Reply STOP to any text and we stop.</p>
    <h2>Who else handles it</h2>
    <p>Submissions and photos are stored in our customer management system, which a software company runs for us, and the site is hosted by a web hosting company. Both handle your information only to provide that service to us.</p>
    <h2>How long we keep it</h2>
    <p>We keep submissions while they are useful for the offer and our purchase records, and delete them when they are not. You can ask us to delete yours at any time.</p>
    <h2>Your choices</h2>
    <p>You can ask what we hold about you, ask us to correct or delete it, or tell us to stop contacting you. Reply to any message from us, or use the contact details on the home page.</p>
    <h2>Who we are</h2>
    <p>This site is operated by ${us()}.</p>
  </div>
</section>`;

export const termsBody = (id = '') => `
<section class="section"${id ? ` id="${id}"` : ''}>
  <div class="wrap prose">
    <h1>Terms of Use</h1>
    <p class="muted">Last updated ${updated}</p>
    <h2>Offers</h2>
    <p>Sending the form is a request for an offer, not a sale. An offer is based on the photos and description you send. Nothing is bought or sold until you and ${us()} agree on a price and how the cards change hands.</p>
    <p>If the cards are different from the photos or description when we see them in hand, for example in condition, count or authenticity, the offer may change or be withdrawn, and you are free to keep your cards.</p>
    <h2>What you send</h2>
    <p>By sending the form you confirm that the cards are yours to sell, or that you are authorized to sell them for their owner.</p>
    <h2>Information on the site</h2>
    <p>The pages describe how we buy cards in general terms. They are not an appraisal, and no figure on this site is a quote for your cards.</p>
    <h2>Changes</h2>
    <p>We may update these terms. The version on this page is the one that applies.</p>
    <h2>Governing law</h2>
    <p>These terms are governed by the laws of ${fact(SITE.jurisdiction, 'state')}.</p>
  </div>
</section>`;

export const thanksBody = () => `
<section class="section">
  <div class="wrap prose">
    <p class="eyebrow">Sent</p>
    <h1>Got it. Your cards are in the queue.</h1>
    <p>You will hear back ${SITE.replyTime ? esc(SITE.replyTime) : fact(null, 'reply time')}, by email or by phone if you gave a number.</p>
    <p id="photo-note" hidden>Your details came through, but the photos did not. When we contact you, reply with them and the offer can go ahead.</p>
    <p><a href="/">Back to the home page</a></p>
  </div>
</section>`;

export const notFoundBody = () => `
<section class="section">
  <div class="wrap prose">
    <p class="eyebrow">404</p>
    <h1>That page is not here</h1>
    <p><a href="/">Go to the home page</a> or <a href="/#sell">ask for an offer</a>.</p>
  </div>
</section>`;
