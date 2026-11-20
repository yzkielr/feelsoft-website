export const config = Object.freeze({
  whatsapp: '6282170002960',
  idrPerUsd: 18278,
  rateDate: '2026-11-20',
  rateSource: 'https://www.bi.go.id/en/statistik/informasi-kurs/jisdor/Default.aspx'
});

export const products = Object.freeze([
  { id: 'kids', category: 'kids', name: { id: 'Kaus kaki anak', en: 'Kids’ socks' }, priceIdr: 26000, image: 'assets/kids.webp' },
  { id: 'split', category: 'split', name: { id: 'Kaus kaki jempol', en: 'Split-toe socks' }, priceIdr: null, image: 'assets/split.webp' }
]);

export function money(amountIdr, lang = 'id') {
  if (amountIdr === null) return lang === 'en' ? 'Request price' : 'Minta harga';
  if (!Number.isFinite(amountIdr) || amountIdr < 0) throw new RangeError('Invalid amount');
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'id-ID', {
    style: 'currency', currency: lang === 'en' ? 'USD' : 'IDR',
    currencyDisplay: lang === 'en' ? 'code' : 'symbol',
    minimumFractionDigits: lang === 'en' ? 2 : 0, maximumFractionDigits: lang === 'en' ? 2 : 0
  }).format(lang === 'en' ? amountIdr / config.idrPerUsd : amountIdr);
}

export function parseQuantity(value) {
  const qty = Number(value);
  if (!Number.isSafeInteger(qty) || qty < 1 || qty > 100000) throw new RangeError('Quantity must be 1–100000 dozen');
  return qty;
}

export function estimate(productId, quantity) {
  const product = products.find(p => p.id === productId);
  if (!product) throw new RangeError('Unknown product');
  const qty = parseQuantity(quantity);
  return product.priceIdr === null ? null : product.priceIdr * qty;
}

export function orderMessage({ lang = 'id', productId = 'kids', quantity = 1, name = '', destination = '', notes = '' }) {
  const qty = parseQuantity(quantity);
  const p = products.find(p => p.id === productId);
  if (!p) throw new RangeError('Unknown product');
  const total = estimate(productId, qty);
  const en = lang === 'en';
  const lines = en ? [
    'Hello Feelsoft, I would like to request a quote.',
    `Product: ${p.name.en}`, `Quantity: ${qty} dozen`,
    `Estimated product subtotal: ${money(total, lang)}${total !== null ? ' (indicative USD conversion)' : ''}`
  ] : [
    'Halo Feelsoft, saya ingin meminta penawaran.',
    `Produk: ${p.name.id}`, `Jumlah: ${qty} lusin`,
    `Estimasi subtotal produk: ${money(total, lang)}`
  ];
  if (name.trim()) lines.push(`${en ? 'Name / business' : 'Nama / usaha'}: ${name.trim().slice(0, 120)}`);
  if (destination.trim()) lines.push(`${en ? 'Delivery destination' : 'Tujuan pengiriman'}: ${destination.trim().slice(0, 180)}`);
  if (notes.trim()) lines.push(`${en ? 'Notes' : 'Catatan'}: ${notes.trim().slice(0, 1000)}`);
  lines.push(en ? 'Please confirm sizes, colours, availability, minimum order, shipping and final price.' : 'Mohon konfirmasi ukuran, warna, ketersediaan, minimum pesanan, ongkir, dan harga final.');
  return lines.join('\n');
}

export function whatsappUrl(order) {
  return `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(orderMessage(order))}`;
}
