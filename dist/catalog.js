import { products } from './core.js';

export const families = [
  { id: 'casual', file: 'casual.html', title: { id: 'MK Casual', en: 'MK Casual' }, image: 'assets/casual-collection.webp', defaultProduct: 'casual-black', summary: { id: 'Enam pilihan warna dan mix, satu harga per lusin.', en: 'Six colour and mix options, one price per dozen.' } },
  { id: 'mesh', file: 'mesh.html', title: { id: 'MK Mesh', en: 'MK Mesh' }, image: 'assets/mesh-collection.webp', defaultProduct: 'mesh-navy', summary: { id: 'Pilih Navy, Hitam, Abu Muda, atau Putih.', en: 'Choose Navy, Black, Light Grey or White.' } },
  { id: 'mini', file: 'mini.html', title: { id: 'MK Mini', en: 'MK Mini' }, image: 'assets/mini-collection.webp', defaultProduct: 'mini-black', summary: { id: 'Empat pilihan warna untuk kebutuhan Anda.', en: 'Four colour options for your needs.' } },
  { id: 'kids', file: 'anak.html', title: { id: 'Kaus kaki anak', en: 'Kids’ socks' }, image: 'assets/kids.webp', defaultProduct: 'kids', summary: { id: 'Kaus kaki anak dengan harga Rp26.000 per lusin.', en: 'Kids’ socks, priced by the dozen.' } },
  { id: 'split', file: 'jempol.html', title: { id: 'Kaus kaki jempol', en: 'Split-toe socks' }, image: 'assets/split.webp', defaultProduct: 'split', summary: { id: 'Lima pilihan warna dan model, termasuk beberapa motif. Tersedia panjang S, M, dan L.', en: 'Five colour and style options, including several patterns. Lengths in S, M and L.' } }
];

export function familyProducts(familyId) { return products.filter(p => p.category === familyId); }
export function colourName(product, lang) { return product.name[lang].replace(/^MK (Casual|Mesh|Mini) /, ''); }
export function swatchFor(productId) {
  if (productId.endsWith('mix-brown')) return 'linear-gradient(135deg,#614633 0 33%,#a37f60 33% 66%,#d1b9a1 66%)';
  if (productId.endsWith('-mix')) return 'linear-gradient(135deg,#243449 0 33%,#797d82 33% 66%,#b49a82 66%)';
  if (productId.endsWith('dark-grey')) return '#62666c';
  if (productId.endsWith('light-grey')) return '#c3c7ca';
  if (productId.endsWith('navy')) return '#223a59';
  if (productId.endsWith('white')) return '#ffffff';
  return '#25262b';
}
