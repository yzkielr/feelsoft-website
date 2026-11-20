import { config, products, money, parseQuantity, estimate, whatsappUrl } from './core.js';
import { en, messages } from './content.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const id = {};
for (const el of $$('[data-i18n]')) id[el.dataset.i18n] = el.innerHTML;
for (const [attribute, property] of [['data-alt', 'alt'], ['data-label', 'aria-label'], ['data-placeholder', 'placeholder']]) {
  for (const el of $$(`[${attribute}]`)) id[el.getAttribute(attribute)] = el.getAttribute(property);
}
const translations = { id, en };
let lang = 'id';
let lastFocus = null;
let toastTimer;

function setLanguage(value) {
  lang = value === 'en' ? 'en' : 'id';
  document.documentElement.lang = lang;
  document.title = messages[lang].title;
  $('meta[name="description"]').content = messages[lang].description;
  for (const el of $$('[data-i18n]')) el.innerHTML = translations[lang][el.dataset.i18n] ?? id[el.dataset.i18n];
  for (const [attribute, property] of [['data-alt', 'alt'], ['data-label', 'aria-label'], ['data-placeholder', 'placeholder']]) {
    for (const el of $$(`[${attribute}]`)) el.setAttribute(property, translations[lang][el.getAttribute(attribute)] ?? id[el.getAttribute(attribute)]);
  }
  for (const el of $$('[data-lang]')) el.setAttribute('aria-pressed', String(el.dataset.lang === lang));
  for (const el of $$('[data-price]')) {
    const p = products.find(product => product.id === el.dataset.price);
    el.textContent = (lang === 'en' && p.priceIdr !== null ? '≈ ' : '') + money(p.priceIdr, lang);
  }
  $('#exchange-note').hidden = lang !== 'en';
  for (const el of $$('.usd-indicator')) el.hidden = lang !== 'en';
  try { localStorage.setItem('feelsoft-language', lang); } catch { /* Language remains usable without storage. */ }
  try { const url = new URL(location.href); url.searchParams.set('lang', lang); history.replaceState(null, '', url); } catch { /* Standalone local preview. */ }
  updateEstimate();
  updateOrderTotal();
}

function updateEstimate() {
  try {
    const qty = parseQuantity($('#estimate-qty').value);
    $('#estimate-total').textContent = money(estimate('kids', qty), lang);
    $('#estimate-error').textContent = '';
    $('#estimate-qty').setAttribute('aria-invalid', 'false');
    $('#estimate-order').disabled = false;
    $('#quantity-minus').disabled = qty <= 1;
    $('#quantity-plus').disabled = qty >= 100000;
  } catch {
    $('#estimate-total').textContent = '—';
    $('#estimate-error').textContent = messages[lang].invalidQuantity;
    $('#estimate-qty').setAttribute('aria-invalid', 'true');
    $('#estimate-order').disabled = true;
    $('#quantity-minus').disabled = false;
    $('#quantity-plus').disabled = false;
  }
}

function updateOrderTotal() {
  try {
    const qty = parseQuantity($('#order-quantity').value);
    $('#order-total').textContent = money(estimate($('#order-product').value, qty), lang);
    $('#order-error').textContent = '';
  } catch {
    $('#order-total').textContent = '—';
    $('#order-error').textContent = messages[lang].invalidQuantity;
  }
}

function closeMenu() { $('#mobile-nav').hidden = true; $('.menu-toggle').setAttribute('aria-expanded', 'false'); }
function openOrder(productId = 'kids', quantity = 1) {
  lastFocus = document.activeElement;
  closeMenu();
  $('#order-product').value = productId;
  $('#order-quantity').value = quantity;
  updateOrderTotal();
  document.body.classList.add('dialog-open');
  $('#order-dialog').showModal();
}
function closeOrder() { $('#order-dialog').close(); }

for (const el of $$('[data-lang]')) el.addEventListener('click', () => setLanguage(el.dataset.lang));
for (const el of $$('[data-order]')) el.addEventListener('click', () => openOrder(el.dataset.order));
for (const el of $$('[data-filter]')) el.addEventListener('click', () => {
  const category = el.dataset.filter;
  for (const button of $$('[data-filter]')) button.setAttribute('aria-pressed', String(button === el));
  for (const card of $$('[data-category]')) card.hidden = category !== 'all' && card.dataset.category !== category;
});
$('.menu-toggle').addEventListener('click', () => {
  const expanded = $('.menu-toggle').getAttribute('aria-expanded') === 'true';
  $('.menu-toggle').setAttribute('aria-expanded', String(!expanded));
  $('#mobile-nav').hidden = expanded;
});
for (const link of $$('#mobile-nav a')) link.addEventListener('click', closeMenu);
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });

$('#estimate-qty').addEventListener('input', updateEstimate);
for (const [selector, delta] of [['#quantity-minus', -1], ['#quantity-plus', 1]]) {
  $(selector).addEventListener('click', () => {
    const current = Number($('#estimate-qty').value);
    $('#estimate-qty').value = Math.min(100000, Math.max(1, (Number.isFinite(current) ? Math.round(current) : 1) + delta));
    updateEstimate();
  });
}
$('#estimate-order').addEventListener('click', () => { try { openOrder('kids', parseQuantity($('#estimate-qty').value)); } catch { updateEstimate(); } });
$('#order-product').addEventListener('change', updateOrderTotal);
$('#order-quantity').addEventListener('input', updateOrderTotal);
$('.close-dialog').addEventListener('click', closeOrder);
$('#order-dialog').addEventListener('click', event => { if (event.target === $('#order-dialog')) { const rect = $('#order-dialog').getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeOrder(); } });
$('#order-dialog').addEventListener('close', () => { document.body.classList.remove('dialog-open'); lastFocus?.focus(); });
$('#order-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!$('#order-form').reportValidity()) return;
  try {
    const url = whatsappUrl({ lang, productId: $('#order-product').value, quantity: $('#order-quantity').value, name: $('#order-name').value, destination: $('#order-destination').value, notes: $('#order-notes').value });
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch { $('#order-error').textContent = messages[lang].invalidQuantity; }
});

$('#download-prices').addEventListener('click', () => {
  const t = translations[lang];
  const rows = [[t.tableProduct, t.tableUnit, t.tablePrice, lang === 'en' ? 'Currency' : 'Mata uang'], ...products.map(p => [p.name[lang], t.oneDozen, p.priceIdr === null ? t.requestPrice : (lang === 'en' ? (p.priceIdr / config.idrPerUsd).toFixed(2) : String(p.priceIdr)), lang === 'en' ? 'USD' : 'IDR']), [], [t.priceNote]];
  if (lang === 'en') rows.push([`Indicative conversion: IDR ${config.idrPerUsd}/USD, ${config.rateDate}. Final USD quote to be confirmed.`, config.rateSource]);
  rows.push(['WhatsApp', 'https://wa.me/6282170002960']);
  const csv = '\ufeff' + rows.map(row => row.map(cell => '"' + String(cell).replaceAll('"', '""') + '"').join(',')).join('\r\n');
  const blobUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = blobUrl; a.download = `feelsoft-pricelist-${lang}.csv`; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  $('#toast').textContent = messages[lang].downloadReady; $('#toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3500);
});

let preferredLanguage;
try { preferredLanguage = localStorage.getItem('feelsoft-language'); } catch { /* Optional preference. */ }
const requestedLanguage = new URL(location.href).searchParams.get('lang');
setLanguage(requestedLanguage === 'en' || requestedLanguage === 'id' ? requestedLanguage : preferredLanguage || 'id');
