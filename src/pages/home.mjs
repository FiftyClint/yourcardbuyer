import { SITE, BUYS, SMS_CONSENT_LABEL, CONTACT_CONSENT } from '../../site.config.mjs';
import { esc, fact, todo, listJoin } from '../util.mjs';

import { MAX_PHOTOS } from '../limits.mjs';
export { MAX_PHOTOS };

const handoffText = () => {
  if (!SITE.handoff) return todo('in person, by mail, or both');
  const ways = [];
  if (SITE.handoff.includes('in-person')) ways.push(`meet in person${SITE.serviceArea ? ` in ${esc(SITE.serviceArea)}` : ''}`);
  if (SITE.handoff.includes('mail')) ways.push('ship them with a label we provide');
  return `You can ${listJoin(ways).replace(/ and /, ' or ')}.`;
};

const payText = () =>
  SITE.paymentMethods ? `Payment by ${esc(listJoin(SITE.paymentMethods))}.` : `Payment by ${todo('payment methods')}.`;

const replyText = () => (SITE.replyTime ? esc(SITE.replyTime) : todo('reply time, e.g. within one business day'));

const buys = () => `
<div class="buys">
  ${BUYS.map((b) => `<div class="buy"><h3>${esc(b.title)}</h3><p>${esc(b.body)}</p></div>`).join('\n  ')}
</div>
${SITE.buysConfirmed ? '' : `<p class="note">${todo('Clint: strike any line above you do not buy, and add any you do')}</p>`}
<p class="note">${SITE.minimum ? `We focus on ${esc(SITE.minimum)}.` : todo('minimum collection size or value, if any')}</p>`;

const tips = [
  ['Singles and slabs', 'Front and back of the cards that matter most. On a slab, the label and cert number should be readable.'],
  ['Binders and boxes', 'One wide shot of everything, then a few pages or rows up close so the names and years can be read.'],
  ['Sealed product', 'Every side of the box, including the shrink wrap and any seal stickers.'],
  ['Light', 'Daylight or a bright room, without flash. Glare hides corners, edges and surface wear.'],
];

const faqs = () => [
  ['Do I have to sell if I ask for an offer?', 'No. Asking costs nothing, and the offer is yours to take or turn down.'],
  [
    'How do you decide what to offer?',
    'Offers are based on what the same cards in similar condition have recently sold for. Photos of the front, back and corners are what that judgment is made from.',
  ],
  ['Do my cards need to be graded?', 'No. Raw cards are fine. If some are in slabs, include a photo of each label.'],
  ['How do I get paid?', payText()],
  ['Do you buy in person or by mail?', handoffText()],
  ['How long until I hear back?', `You hear back ${replyText()}.`],
  ['Is there a minimum?', SITE.minimum ? `We focus on ${esc(SITE.minimum)}.` : todo('minimum, or say there is none')],
  [
    'What happens to my photos and information?',
    'They are used to look at your cards and to contact you about them. They are not sold or shared for marketing. The privacy page has the details.',
  ],
];

export function homeBody(mode) {
  const sports = ['Baseball', 'Football', 'Basketball', 'Hockey', 'Soccer', 'Other'];
  const action = mode === 'preview' ? '#sell' : '/api/sell';
  return `
<section class="hero section">
  <div class="wrap">
    <div class="hero-copy">
      <p class="eyebrow">Sports card buyer</p>
      <h1>Sell your sports cards without listing a single one</h1>
      <p class="lede">Send photos of a few cards or a whole collection. You get a straight offer, and you decide whether to take it.</p>
      <div class="hero-actions">
        <a class="button" href="#sell">Get an offer</a>
        <a href="#how">See how it works</a>
      </div>
      <p class="hero-note">Free to ask. No obligation to sell. Reply ${replyText()}.</p>
    </div>
    <div class="stack" aria-hidden="true">
      <div class="tc"><div class="tc-photo"></div><div class="tc-plate">Vintage<small>Any era</small></div></div>
      <div class="tc"><div class="tc-photo"></div><div class="tc-plate">Your cards<small>Raw or graded</small></div></div>
      <div class="tc"><div class="tc-photo"></div><div class="tc-plate">Rookies<small>Singles to lots</small></div></div>
    </div>
  </div>
</section>

<section class="section" id="how">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">How it works</p>
      <h2>Four steps, start to paid</h2>
    </div>
    <div class="cardback">
      <div class="cardback-head"><span>How it works</span><span>No cost to ask</span></div>
      <div class="cardback-scroll">
        <table>
          <thead><tr><th scope="col">Step</th><th scope="col">What happens</th><th scope="col">Who</th></tr></thead>
          <tbody>
            <tr><td>01</td><td><strong>Send photos</strong>Use the form on this page. A few clear photos and a short description are enough to start.</td><td>You</td></tr>
            <tr><td>02</td><td><strong>We look them over</strong>Every submission is reviewed and priced against recent sales of the same cards.</td><td>Us</td></tr>
            <tr><td>03</td><td><strong>You get an offer</strong>Reply ${replyText()}. Take it or pass, with no pressure either way.</td><td>You decide</td></tr>
            <tr><td>04</td><td><strong>Hand off and get paid</strong>${handoffText()} ${payText()}</td><td>Both</td></tr>
          </tbody>
        </table>
      </div>
      <p class="cardback-foot">If the cards in hand do not match the photos, the offer is revisited before anything changes hands.</p>
    </div>
  </div>
</section>

<section class="section" id="buy">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">What we buy</p>
      <h2>From one card to a basement full</h2>
    </div>
    ${buys()}
  </div>
</section>

<section class="section" id="photos">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">Before you send</p>
      <h2>Photos that get a better offer</h2>
      <p class="muted">An offer can only account for what the photos show. Condition drives price, so show it.</p>
    </div>
    <div class="tips">
      ${tips.map(([k, t]) => `<div class="tip"><p class="tip-kind">${esc(k)}</p><p>${esc(t)}</p></div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="section sell" id="sell">
  <div class="wrap">
    <div class="sell-grid">
      <div class="sell-aside">
        <div class="section-head">
          <p class="eyebrow">Get an offer</p>
          <h2>Tell us what you have</h2>
          <p class="lede">The offer is based on your photos and description, so the more you show, the closer it gets.</p>
        </div>
        <p>Helpful to include:</p>
        <ul>
          <li>Sport, years and sets, if you know them</li>
          <li>Any players or cards you know are valuable</li>
          <li>Roughly how many cards there are</li>
          <li>Which ones are graded, and by whom</li>
        </ul>
        <p>Area served: ${fact(SITE.serviceArea, 'service area')}</p>
      </div>

      <form class="seller" id="seller-form" method="post" action="${action}" enctype="multipart/form-data" novalidate>
        <div class="row">
          <div class="field"><label for="f-name">Your name</label><input id="f-name" name="name" type="text" autocomplete="name" required></div>
          <div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
        </div>
        <div class="row">
          <div class="field"><label for="f-phone">Phone <span class="hint">(optional)</span></label><input id="f-phone" name="phone" type="tel" autocomplete="tel"></div>
          <div class="field"><label for="f-zip">ZIP code <span class="hint">(optional)</span></label><input id="f-zip" name="zip" type="text" inputmode="numeric" autocomplete="postal-code" maxlength="10"></div>
        </div>
        <div class="row">
          <div class="field">
            <label for="f-kind">What are you selling?</label>
            <select id="f-kind" name="kind" required>
              <option value="">Choose one</option>
              <option value="a-few-cards">A few cards</option>
              <option value="collection">A collection</option>
              <option value="graded">Graded slabs</option>
              <option value="sealed">Sealed boxes or packs</option>
              <option value="mix">A mix</option>
            </select>
          </div>
          <div class="field">
            <label for="f-count">About how many cards?</label>
            <select id="f-count" name="count">
              <option value="unsure">Not sure</option>
              <option value="under-50">Under 50</option>
              <option value="50-500">50 to 500</option>
              <option value="500-5000">500 to 5,000</option>
              <option value="over-5000">More than 5,000</option>
            </select>
          </div>
        </div>
        <fieldset class="field">
          <legend>Sports <span class="hint">(pick any)</span></legend>
          <div class="checks">
            ${sports.map((s) => `<label class="check"><input type="checkbox" name="sports" value="${s.toLowerCase()}" id="f-sport-${s.toLowerCase()}"> ${s}</label>`).join('\n            ')}
          </div>
        </fieldset>
        <div class="field">
          <label for="f-desc">Describe the cards</label>
          <textarea id="f-desc" name="description" required placeholder="Example: a binder of 1980s Topps baseball, a shoebox of 90s football, two PSA slabs."></textarea>
        </div>
        <div class="field">
          <label for="f-asking">Have a price in mind? <span class="hint">(optional)</span></label>
          <input id="f-asking" name="asking" type="text" placeholder="Leave blank if you want an offer first">
        </div>
        <div class="field">
          <label for="f-photos">Photos <span class="hint">(up to ${MAX_PHOTOS})</span></label>
          <div class="drop" id="drop">
            <input id="f-photos" name="photos" type="file" accept="image/*" multiple>
            <span class="hint">Drag photos here or choose them from your phone or computer.</span>
            <div class="thumbs" id="thumbs"></div>
          </div>
        </div>
        <label class="consent"><input type="checkbox" name="sms_consent" value="yes" id="f-sms"> <span>${esc(SMS_CONSENT_LABEL)}</span></label>
        <div class="hp" aria-hidden="true"><label for="f-website">Website</label><input id="f-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
        <input type="hidden" name="form_loaded_at" id="f-loaded" value="">
        <input type="hidden" name="redirect_to" value="/thank-you/">
        <p class="fineprint">${esc(CONTACT_CONSENT)} See the <a href="${mode === 'preview' ? '#privacy' : '/privacy/'}">privacy policy</a>.</p>
        <button class="button" type="submit" id="f-submit">Send for an offer</button>
        <p class="form-status" id="f-status" role="status" aria-live="polite"></p>
      </form>
    </div>
  </div>
</section>

<section class="section" id="faq">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">Questions</p>
      <h2>Before you send anything</h2>
    </div>
    <div class="faq">
      ${faqs().map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="section" id="who">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">Who is buying</p>
      <h2>Who you are dealing with</h2>
      <p>${SITE.ownerName ? esc(SITE.ownerName) : todo('Clint: your name and one line about you, or say keep the site brand-only')}</p>
    </div>
    <dl class="contact">
      <div><dt>Phone</dt><dd>${SITE.phone ? `<a href="tel:${esc(SITE.phone.replace(/[^\d+]/g, ''))}">${esc(SITE.phone)}</a>` : todo('phone')}</dd></div>
      <div><dt>Email</dt><dd>${SITE.email ? `<a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>` : todo('email')}</dd></div>
      <div><dt>Area</dt><dd>${fact(SITE.serviceArea, 'service area')}</dd></div>
    </dl>
  </div>
</section>`;
}
