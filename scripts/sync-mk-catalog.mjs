import { readFileSync, writeFileSync } from 'node:fs';
import { algoProducts, money } from '../dist/core.js';

const file = new URL('../dist/index.html', import.meta.url);
let html = readFileSync(file, 'utf8');
const groups = [
  { id: 'casual', name: 'MK Casual', summary: 'casualSummary', text: 'Enam pilihan, satu harga per lusin.' },
  { id: 'mesh', name: 'MK Mesh', summary: 'meshSummary', text: 'Empat pilihan warna untuk Anda.' },
  { id: 'mini', name: 'MK Mini', summary: 'miniSummary', text: 'Empat pilihan warna untuk Anda.' }
];

function replaceBlock(name, content, anchor, position = 'before') {
  const start = `<!-- ${name}:start -->`, end = `<!-- ${name}:end -->`;
  const block = `${start}\n${content}\n${end}`;
  if (html.includes(start)) {
    const from = html.indexOf(start), to = html.indexOf(end, from);
    if (to < 0) throw new Error(`Missing end marker: ${name}`);
    html = html.slice(0, from) + block + html.slice(to + end.length);
  } else {
    if (!html.includes(anchor)) throw new Error(`Missing insertion anchor: ${name}`);
    html = html.replace(anchor, position === 'after' ? anchor + block : block + anchor);
  }
}

const filters = groups.map(g => `<button type="button" data-filter="${g.id}" aria-pressed="false">${g.name}</button>`).join('');
replaceBlock('mk-filters', filters, '<button type="button" data-filter="kids"');

const cards = groups.map(g => {
  const items = algoProducts.filter(p => p.category === g.id);
  const cheapest = items.reduce((a, b) => a.priceIdr <= b.priceIdr ? a : b);
  return `<article class="algo-card" data-category="${g.id}"><div class="algo-card-heading"><h3>${g.name}</h3><p data-i18n="${g.summary}">${g.text}</p><div class="algo-starting-price"><span data-i18n="fromPrice">Mulai</span> <strong data-price="${cheapest.id}">${money(cheapest.priceIdr)}</strong> <span data-i18n="perDozen">/ lusin</span></div></div><ul class="algo-options">${items.map(p => `<li><button type="button" data-order="${p.id}"><span data-product-name="${p.id}">${p.name.id}</span><strong data-price="${p.id}">${money(p.priceIdr)}</strong></button></li>`).join('')}</ul><p class="algo-card-note" data-i18n="algoPhotoNote">Tanyakan foto produk aktual, bahan, ukuran, dan ketersediaan kepada kami.</p></article>`;
}).join('\n');
replaceBlock('mk-catalog', `<div class="algo-product-grid">${cards}</div>`, '<p class="catalog-note"');

const rows = algoProducts.map(p => `<tr><th scope="row" data-product-name="${p.id}">${p.name.id}</th><td data-i18n="oneDozen">1 lusin</td><td><strong data-price="${p.id}">${money(p.priceIdr)}</strong></td><td><button type="button" class="button button-small" data-order="${p.id}" data-i18n="order">Pesan</button></td></tr>`).join('\n');
replaceBlock('mk-prices', `<section class="algo-prices" aria-labelledby="algo-price-title"><div class="split-price-heading"><div><h3 id="algo-price-title" data-i18n="algoPriceTitle">Daftar harga koleksi MK</h3><p data-i18n="algoPriceDescription">Seluruh 14 pilihan, dengan harga per lusin.</p></div><span class="unit-label" data-i18n="unitLabel">HARGA PER LUSIN</span></div><div class="price-table-wrapper"><table class="algo-price-table"><caption class="sr-only" data-i18n="algoPriceTitle">Daftar harga koleksi MK</caption><thead><tr><th scope="col" data-i18n="tableProduct">Koleksi</th><th scope="col" data-i18n="tableUnit">Satuan</th><th scope="col" data-i18n="tablePrice">Harga</th><th scope="col"><span class="sr-only" data-i18n="tableAction">Pemesanan</span></th></tr></thead><tbody>${rows}</tbody></table></div></section>`, '<section class="split-prices"');

const options = groups.map(g => `<optgroup label="${g.name}">${algoProducts.filter(p => p.category === g.id).map(p => `<option value="${p.id}" data-product-name="${p.id}">${p.name.id}</option>`).join('')}</optgroup>`).join('');
for (const name of ['estimate', 'order']) {
  const select = new RegExp(`(<select id="${name}-product"[^>]*>)([\\s\\S]*?)(</select>)`);
  const match = html.match(select);
  if (!match) throw new Error(`Missing ${name} product select`);
  const start = `<!-- ${name}-mk-options:start -->`, end = `<!-- ${name}-mk-options:end -->`;
  let inner = match[2];
  const block = start + options + end;
  if (inner.includes(start)) inner = inner.slice(0, inner.indexOf(start)) + block + inner.slice(inner.indexOf(end) + end.length);
  else inner += block;
  html = html.replace(select, (_, opening, old, closing) => opening + inner + closing);
}

html = html.replace('Mulai dari koleksi anak hingga model jempol. Temukan pilihan untuk kebutuhan pelanggan Anda.', 'Jelajahi MK Casual, Mesh, Mini, kaus kaki anak, dan jempol. Temukan pilihan untuk pelanggan Anda.');
writeFileSync(file, html);
console.log(`Synced ${algoProducts.length} MK products to collection, prices and order selectors.`);
