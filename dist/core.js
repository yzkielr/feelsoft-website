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

export const sizes = Object.freeze([
  { id: 'S', length: '26–28 cm' },
  { id: 'M', length: '34–36 cm' },
  { id: 'L', length: '40 cm' }
]);

export const splitVariants = Object.freeze([
  { id: 'plain', name: { id: 'Cream / hitam polos', en: 'Plain cream / black' }, prices: { S: 41000, M: 42000, L: 44000 } },
  { id: 'sole', name: { id: 'Telapak', en: 'Sole style (Telapak)' }, prices: { S: 42000, M: 43000, L: 44000 } },
  { id: 'pattern', name: { id: 'Motif', en: 'Patterned' }, prices: { S: 43000, M: 44000, L: 46000 } }
]);

export function unitPrice(productId, variantId, size) {
  const product = products.find(p => p.id === productId);
  if (!product) throw new RangeError('Unknown product');
  if (productId === 'kids') return product.priceIdr;
  const variant = splitVariants.find(v => v.id === variantId);
  if (!variant || !sizes.some(s => s.id === size)) throw new RangeError('Select a valid variant and size');
  return variant.prices[size];
}

export function minimumPrice(productId) {
  if (productId === 'split') return Math.min(...splitVariants.flatMap(v => Object.values(v.prices)));
  return unitPrice(productId);
}

export function priceRows(lang = 'id') {
  return [{ product: products[0].name[lang], variant: '—', size: '—', length: '—', priceIdr: unitPrice('kids') },
    ...splitVariants.flatMap(v => sizes.map(s => ({ product: products[1].name[lang], variant: v.name[lang], size: s.id, length: s.length, priceIdr: v.prices[s.id] })))];
}

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

export function estimate(productId, quantity, variantId, size) {
  const qty = parseQuantity(quantity);
  return unitPrice(productId, variantId, size) * qty;
}

export function orderMessage({ lang = 'id', productId = 'kids', quantity = 1, variantId, size, name = '', destination = '', notes = '' }) {
  const qty = parseQuantity(quantity);
  const p = products.find(p => p.id === productId);
  if (!p) throw new RangeError('Unknown product');
  const total = estimate(productId, qty, variantId, size);
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
  if (productId === 'split') {
    const variant = splitVariants.find(v => v.id === variantId);
    const selectedSize = sizes.find(s => s.id === size);
    lines.splice(2, 0, `${en ? 'Variant' : 'Varian'}: ${variant.name[lang]}`, `${en ? 'Size / length' : 'Ukuran / panjang'}: ${size} / ${selectedSize.length}`, `${en ? 'Price per dozen' : 'Harga per lusin'}: ${money(unitPrice(productId, variantId, size), lang)}`);
  }
  if (name.trim()) lines.push(`${en ? 'Name / business' : 'Nama / usaha'}: ${name.trim().slice(0, 120)}`);
  if (destination.trim()) lines.push(`${en ? 'Delivery destination' : 'Tujuan pengiriman'}: ${destination.trim().slice(0, 180)}`);
  if (notes.trim()) lines.push(`${en ? 'Notes' : 'Catatan'}: ${notes.trim().slice(0, 1000)}`);
  lines.push(en ? 'Please confirm sizes, colours, availability, minimum order, shipping and final price.' : 'Mohon konfirmasi ukuran, warna, ketersediaan, minimum pesanan, ongkir, dan harga final.');
  return lines.join('\n');
}

export function whatsappUrl(order) {
  return `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(orderMessage(order))}`;
}
