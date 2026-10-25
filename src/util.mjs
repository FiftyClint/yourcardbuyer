/** Small helpers shared by the page templates. */

export const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * A fact only Clint can supply. Renders as a highlighted bracket so it is
 * impossible to miss on the preview, and so check:launch can find it.
 */
export const todo = (label) => `<mark class="todo">[${esc(label)}]</mark>`;

/** The value if Clint has given it, otherwise a bracket naming what is missing. */
export const fact = (value, label) => (value == null || value === '' ? todo(label) : esc(value));

/** "a, b and c" */
export const listJoin = (items) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
