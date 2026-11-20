import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import * as core from '../dist/core.js';
import { en, messages } from '../dist/content.js';

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '');
function setup(lang = 'id') {
  const dom = new JSDOM(html, { url: `https://feelsoft.example/?lang=${lang}`, runScripts: 'outside-only' });
  Object.assign(dom.window, core, { en, messages });
  dom.window.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function() { this.open = false; this.dispatchEvent(new dom.window.Event('close')); };
  const opened = [];
  dom.window.open = (...args) => opened.push(args);
  dom.window.eval(app);
  return { dom, document: dom.window.document, opened };
}

test('business amounts remain in dozens and invalid product selections cannot be quoted', () => {
  assert.equal(core.estimate('kids', 1), 26000);
  assert.equal(core.estimate('kids', 12), 312000);
  assert.throws(() => core.estimate('split', 25));
  assert.throws(() => core.estimate('split', 25, 'plain', 'XL'));
  assert.throws(() => core.estimate('split', 25, 'unknown', 'S'));
  assert.equal(core.money(null, 'en'), 'Request price');
  for (const value of ['', 0, -1, 1.5, 'NaN', Infinity, 100001]) assert.throws(() => core.parseQuantity(value));
  assert.throws(() => core.estimate('missing', 12));
  assert.equal(core.money(26000, 'en').replace(/\s/g, ' '), 'USD 1.42');
});

test('all text, accessible labels and images have complete English translations', () => {
  const dom = new JSDOM(html);
  for (const attribute of ['data-i18n', 'data-alt', 'data-label', 'data-placeholder']) {
    for (const el of dom.window.document.querySelectorAll(`[${attribute}]`)) assert.ok(en[el.getAttribute(attribute)], `Missing ${el.getAttribute(attribute)}`);
  }
  dom.window.close();
});

test('language switch updates currency, units, form and metadata while retaining quantity', () => {
  const { dom, document: d } = setup();
  try {
    const input = d.querySelector('#estimate-qty'); input.value = '24'; input.dispatchEvent(new dom.window.Event('input'));
    d.querySelector('[data-lang="en"]').click();
    assert.equal(d.documentElement.lang, 'en');
    assert.match(d.title, /Socks/);
    assert.match(d.querySelector('[data-price="kids"]').textContent, /USD/);
    assert.equal(d.querySelector('#exchange-note').hidden, false);
    assert.equal(d.querySelector('#estimate-unit').textContent, 'dozen');
    assert.equal(input.value, '24');
    assert.match(d.querySelector('#estimate-total').textContent, /34\.14/);
    d.querySelector('[data-lang="id"]').click();
    assert.match(d.querySelector('#estimate-total').textContent, /624\.000/);
    assert.equal(d.querySelector('#exchange-note').hidden, true);
    assert.equal(d.querySelector('#estimate-unit').textContent, 'lusin');
  } finally { dom.window.close(); }
});

test('invalid quantity blocks the estimator; valid quantities carry into the WhatsApp draft', () => {
  const { dom, document: d, opened } = setup('en');
  try {
    const input = d.querySelector('#estimate-qty'); input.value = '-2'; input.dispatchEvent(new dom.window.Event('input'));
    assert.equal(d.querySelector('#estimate-order').disabled, true);
    assert.equal(d.querySelector('#estimate-total').textContent, '—');
    input.value = '36'; input.dispatchEvent(new dom.window.Event('input'));
    d.querySelector('#estimate-order').click();
    assert.equal(d.querySelector('#order-dialog').open, true);
    assert.equal(d.querySelector('#order-quantity').value, '36');
    d.querySelector('#order-destination').value = 'Bandung, Indonesia';
    d.querySelector('#order-name').value = 'A&B <Store>';
    d.querySelector('#order-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    assert.equal(opened.length, 1);
    const url = new URL(opened[0][0]);
    assert.equal(url.origin + url.pathname, 'https://wa.me/6282170002960');
    assert.match(url.searchParams.get('text'), /Quantity: 36 dozen/);
    assert.match(url.searchParams.get('text'), /A&B <Store>/);
    assert.match(url.searchParams.get('text'), /indicative USD conversion/);
    assert.match(opened[0][2], /noopener/);
  } finally { dom.window.close(); }
});

test('category filter, split-toe enquiry, menu and dialog close work', () => {
  const { dom, document: d } = setup();
  try {
    d.querySelector('[data-filter="split"]').click();
    assert.equal(d.querySelector('[data-category="kids"]').hidden, true);
    assert.equal(d.querySelector('[data-category="split"]').hidden, false);
    d.querySelector('[data-order="split"]').click();
    assert.match(d.querySelector('#order-total').textContent, /41\.000/);
    assert.equal(d.querySelector('#order-variants').hidden, false);
    d.querySelector('.close-dialog').click();
    assert.equal(d.querySelector('#order-dialog').open, false);
    assert.equal(d.body.classList.contains('dialog-open'), false);
    d.querySelector('.menu-toggle').click();
    assert.equal(d.querySelector('#mobile-nav').hidden, false);
    d.querySelector('#mobile-nav a').click();
    assert.equal(d.querySelector('#mobile-nav').hidden, true);
  } finally { dom.window.close(); }
});

test('price export preserves dozen units and marks converted USD prices', async () => {
  const { dom, document: d } = setup('en');
  try {
    let blob, download;
    dom.window.URL.createObjectURL = value => { blob = value; return 'blob:feelsoft-test'; };
    dom.window.URL.revokeObjectURL = () => {};
    dom.window.HTMLAnchorElement.prototype.click = function() { download = this.download; };
    d.querySelector('#download-prices').click();
    const text = await new Promise((resolve, reject) => { const reader = new dom.window.FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsText(blob); });
    assert.equal(download, 'feelsoft-pricelist-en.csv');
    assert.match(text, /1 dozen/); assert.match(text, /1.42/); assert.match(text, /Plain cream \/ black/); assert.match(text, /Indicative conversion/);
    assert.match(text, /26–28 cm/); assert.match(text, /34–36 cm/); assert.match(text, /40 cm/);
    assert.equal(text.split('\r\n').filter(line => line.includes('"Split-toe socks"')).length, 9);
    assert.doesNotMatch(text, /Request price/);
  } finally { dom.window.close(); }
});

test('all nine SKM prices exactly match the supplied per-dozen matrix and lengths', () => {
  const expected = [
    ['plain','S',41000],['plain','M',42000],['plain','L',44000],
    ['sole','S',42000],['sole','M',43000],['sole','L',44000],
    ['pattern','S',43000],['pattern','M',44000],['pattern','L',46000]
  ];
  const { dom, document: d } = setup();
  try {
    for (const [variant, size, amount] of expected) {
      assert.equal(core.unitPrice('split', variant, size), amount);
      assert.equal(core.estimate('split', 12, variant, size), amount * 12);
      const button = d.querySelector(`[data-order-variant="${variant}"][data-order-size="${size}"]`);
      assert.equal(button.textContent, core.money(amount));
      button.click();
      assert.equal(d.querySelector('#order-variant').value, variant);
      assert.equal(d.querySelector('#order-size').value, size);
      assert.equal(d.querySelector('#order-total').textContent, core.money(amount));
      d.querySelector('.close-dialog').click();
    }
    assert.deepEqual(core.sizes.map(s => s.length), ['26–28 cm','34–36 cm','40 cm']);
    assert.equal(core.minimumPrice('split'), 41000);
  } finally { dom.window.close(); }
});

test('selected variant and length survive language changes, estimation and WhatsApp handoff', () => {
  const { dom, document: d, opened } = setup();
  try {
    for (const [selector, value] of [['#estimate-product','split'],['#estimate-variant','pattern'],['#estimate-size','L']]) {
      d.querySelector(selector).value = value;
      d.querySelector(selector).dispatchEvent(new dom.window.Event('change'));
    }
    d.querySelector('#estimate-qty').value = '5';
    d.querySelector('#estimate-qty').dispatchEvent(new dom.window.Event('input'));
    assert.match(d.querySelector('#estimate-total').textContent, /230\.000/);
    d.querySelector('[data-lang="en"]').click();
    assert.equal(d.querySelector('#estimate-size').value, 'L');
    assert.equal(d.querySelector('#estimate-variant').value, 'pattern');
    assert.match(d.querySelector('#estimate-total').textContent, /USD/);
    d.querySelector('#estimate-order').click();
    assert.equal(d.querySelector('#order-quantity').value, '5');
    assert.equal(d.querySelector('#order-size').value, 'L');
    assert.equal(d.querySelector('#order-variant').value, 'pattern');
    d.querySelector('#order-destination').value = 'Singapore';
    d.querySelector('#order-form').dispatchEvent(new dom.window.Event('submit', {bubbles:true,cancelable:true}));
    const message = new URL(opened[0][0]).searchParams.get('text');
    assert.match(message, /Variant: Patterned/);
    assert.match(message, /Size \/ length: L \/ 40 cm/);
    assert.match(message, /Quantity: 5 dozen/);
    assert.match(message, /USD\s12\.58/);
    d.querySelector('#order-product').value = 'kids';
    d.querySelector('#order-product').dispatchEvent(new dom.window.Event('change'));
    assert.equal(d.querySelector('#order-variants').hidden, true);
    assert.equal(d.querySelector('#order-total').textContent, core.money(130000, 'en'));
  } finally { dom.window.close(); }
});

test('local assets, internal links and semantic identifiers all resolve', () => {
  const dom = new JSDOM(html);
  const d = dom.window.document;
  const ids = [...d.querySelectorAll('[id]')].map(el => el.id);
  assert.equal(new Set(ids).size, ids.length, 'Duplicate ids');
  for (const el of d.querySelectorAll('[src],link[href],a[href]')) {
    const ref = el.getAttribute('src') || el.getAttribute('href');
    if (ref === '#') continue;
    if (ref.startsWith('#')) assert.ok(d.getElementById(ref.slice(1)), ref);
    else if (!/^(https?:|data:)/.test(ref)) assert.ok(existsSync(fileURLToPath(new URL('../dist/' + ref, import.meta.url))), ref);
  }
  assert.ok(existsSync(fileURLToPath(new URL('../dist/assets/manrope.woff2', import.meta.url))));
  dom.window.close();
});
