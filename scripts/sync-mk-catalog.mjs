import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { products, sizes, splitVariants, money, minimumPrice, unitPrice } from '../dist/core.js';
import { families, familyProducts, colourName, swatchFor } from '../dist/catalog.js';

const root = new URL('../', import.meta.url);
const homePath = new URL('dist/index.html', root);
const home = new JSDOM(readFileSync(homePath, 'utf8'));
const document = home.window.document;
mkdirSync(new URL('templates/', root), { recursive: true });
const priceTemplatePath = new URL('templates/pricelist-section.html', root);
if (!existsSync(priceTemplatePath)) writeFileSync(priceTemplatePath, document.querySelector('#prices').outerHTML);
const heading = '<div class="section-heading"><div><p class="eyebrow" data-i18n="collectionEyebrow">TEMUKAN PILIHAN ANDA</p><h2 data-i18n="collectionTitle">Hal kecil. Potensi besar.</h2></div><p class="section-intro" data-i18n="collectionIntro">Pilih koleksinya. Jelajahi warna, harga, dan informasi produk di halaman detail.</p></div>';
const priceText = id => `<strong data-price="${id}">${money(minimumPrice(id))}</strong><span data-i18n="perDozen">/ lusin</span>`;
const familyCard = family => {
  const items = familyProducts(family.id);
  const first = items.reduce((a,b) => a.priceIdr <= b.priceIdr ? a : b);
  const palettes = items.map(p => `<i style="background:${swatchFor(p.id)}"></i>`).join('');
  return `<article class="family-card" data-family-card="${family.id}"><a href="${family.file}" data-local-link><div class="family-art family-art-${family.id}" aria-hidden="true"><span class="family-art-label">FEELSOFT / MK</span><strong>${family.id.toUpperCase()}</strong><div class="family-palette">${palettes}</div></div><div class="family-card-body"><div class="family-card-heading"><h3>${family.title.id}</h3><span data-i18n="${items.length===6?'sixChoices':'fourChoices'}">${items.length===6?'6 pilihan warna & mix':'4 pilihan warna'}</span></div><div class="family-card-bottom"><div class="family-start-price"><span data-i18n="fromPrice">Mulai</span>${priceText(first.id)}</div><span class="button button-outline" data-i18n="viewDetails">Lihat detail</span></div></div></a></article>`;
};
const compactCard = family => `<a class="secondary-family-card" href="${family.file}" data-local-link data-family-card="${family.id}"><img src="${family.image}" alt="" width="80" height="80" loading="lazy"><div><h3 data-i18n="${family.id==='kids'?'kidsName':'splitName'}">${family.title.id}</h3><div class="secondary-price"><span data-i18n="fromPrice">Mulai</span>${priceText(family.defaultProduct)}</div></div><span class="text-link" data-i18n="viewDetails">Lihat detail</span></a>`;
document.querySelector('#collection').innerHTML = heading + `<div class="family-grid">${families.slice(0,3).map(familyCard).join('')}</div><div class="secondary-collection"><p class="eyebrow" data-i18n="otherCollections">Koleksi lainnya</p><div class="secondary-family-grid">${families.slice(3).map(compactCard).join('')}</div></div>`;
document.querySelector('#prices').outerHTML = '<section id="prices" class="price-overview section-shell"><div><p class="eyebrow" data-i18n="pricesEyebrow">MUDAH DILIHAT, MUDAH DIRENCANAKAN</p><h2 data-i18n="priceOverviewTitle">Setiap pilihan, harganya jelas.</h2><p data-i18n="priceOverviewBody">Bandingkan seluruh koleksi dan unduh daftar harga lengkap di satu halaman khusus.</p></div><a class="button button-dark" href="pricelist.html" data-local-link data-i18n="fullPriceList">Lihat daftar harga lengkap</a></section>';
document.body.dataset.page = 'home';

function updateOptions(doc) {
  const optionGroups = families.slice(0,3).map(f => `<optgroup label="${f.title.id}">${familyProducts(f.id).map(p=>`<option value="${p.id}" data-product-name="${p.id}">${p.name.id}</option>`).join('')}</optgroup>`).join('');
  for(const select of doc.querySelectorAll('#order-product,#estimate-product')) select.innerHTML = '<option value="kids" data-i18n="kidsName">Kaus kaki anak</option><option value="split" data-i18n="splitName">Kaus kaki jempol</option>'+optionGroups;
}
function preparePage(doc, page) {
  doc.body.dataset.page = page;
  for (const a of doc.querySelectorAll('a[href]')) {
    const href=a.getAttribute('href');
    if (href === '#prices') a.setAttribute('href','pricelist.html');
    else if (href === '#' && a.classList.contains('brand-logo')) a.setAttribute('href','index.html');
    else if (page !== 'home' && ['#collection','#about','#how'].includes(href)) a.setAttribute('href','index.html'+href);
    if (/^(?:index|pricelist|casual|mesh|mini|anak|jempol|references)\.html/.test(a.getAttribute('href'))) a.setAttribute('data-local-link','');
  }
  if(!doc.querySelector('link[href="catalog.css"]')) { const link=doc.createElement('link');link.rel='stylesheet';link.href='catalog.css';doc.head.append(link); }
  updateOptions(doc);
  for(const el of doc.querySelectorAll('[data-price]')) {
    const amount = el.dataset.variant ? unitPrice(el.dataset.price,el.dataset.variant,el.dataset.size) : minimumPrice(el.dataset.price);
    el.textContent=money(amount);
  }
}
preparePage(document,'home');
writeFileSync(homePath,home.serialize());

function newPage(main,page,title) {
  const dom=new JSDOM(home.serialize());const doc=dom.window.document;
  doc.querySelector('main').innerHTML=main;doc.title=title+' | Feelsoft';preparePage(doc,page);return dom;
}
const breadcrumb=(title,key)=>`<nav class="breadcrumb section-shell" aria-label="Breadcrumb"><a href="index.html" data-local-link data-i18n="home">Beranda</a><span aria-hidden="true">/</span><a href="index.html#collection" data-local-link data-i18n="navCollection">Koleksi</a><span aria-hidden="true">/</span><span ${key?`data-i18n="${key}"`:''}>${title}</span></nav>`;
const prices = newPage(breadcrumb('Daftar harga','navPrices') + readFileSync(priceTemplatePath,'utf8'), 'pricelist', 'Daftar harga');
const priceHeading = prices.window.document.querySelector('[data-i18n="pricesTitle"]');
const h1=prices.window.document.createElement('h1');h1.setAttribute('data-i18n','pricesTitle');h1.innerHTML=priceHeading.innerHTML;priceHeading.replaceWith(h1);
writeFileSync(new URL('dist/pricelist.html',root),prices.serialize());

for(const family of families) {
  const isMK=['casual','mesh','mini'].includes(family.id), isSplit=family.id==='split';
  const selected = products.find(p=>p.id===family.defaultProduct);
  const defaultAmount=isSplit?unitPrice('split','plain','S'):selected.priceIdr;
  const colorButtons=isMK?`<fieldset class="detail-fieldset"><legend data-i18n="colourLabel">Warna / mix</legend><div class="colour-options">${familyProducts(family.id).map(p=>`<button type="button" class="colour-option" data-detail-product="${p.id}" aria-pressed="${p.id===selected.id}"><span class="colour-dot" style="background:${swatchFor(p.id)}" aria-hidden="true"></span><span data-colour-name="${p.id}">${colourName(p,'id')}</span></button>`).join('')}</div><p class="field-note" data-i18n="colourReference">Contoh warna bersifat indikatif; warna aktual dapat dikonfirmasi kepada tim kami.</p></fieldset>`:'';
  const variants=isSplit?`<fieldset class="detail-fieldset"><legend data-i18n="variantLabel">Varian</legend><div class="variant-options">${splitVariants.map(v=>`<button type="button" data-detail-variant="${v.id}" aria-pressed="${v.id==='plain'}" data-i18n="${{plain:'detailPlain',sole:'detailSole',pattern:'detailPattern'}[v.id]}">${v.name.id}</button>`).join('')}</div></fieldset><fieldset class="detail-fieldset"><legend data-i18n="detailSize">Ukuran / panjang</legend><div class="size-options">${sizes.map(s=>`<button type="button" data-detail-size="${s.id}" aria-pressed="${s.id==='S'}"><strong>${s.id}</strong><span>${s.length}</span></button>`).join('')}</div></fieldset>`:'';
  const main = breadcrumb(family.title.id, family.id==='kids'?'kidsName':family.id==='split'?'splitName':undefined) + `<section class="product-detail section-shell" data-detail-family="${family.id}"><div class="detail-gallery"><div class="detail-image"><img src="${family.image}" width="1024" height="1024" alt="Ilustrasi konsep koleksi kaus kaki Feelsoft" data-alt="detailImageAlt" fetchpriority="high"><span class="gallery-brand">feelsoft.</span></div><p class="detail-image-note" data-i18n="detailImageNote">Ilustrasi konsep. Gambar ini tidak berubah mengikuti pilihan warna.</p><a class="text-link" href="index.html#collection" data-local-link data-i18n="backToCollection">Kembali ke koleksi</a></div><div class="detail-copy"><p class="eyebrow" data-i18n="heroEyebrow">KAUS KAKI GROSIR, DARI FEELSOFT</p><h1 id="detail-title">${family.title.id}</h1><p id="detail-description" class="detail-description">${family.summary.id}</p><div class="detail-price-block"><span data-i18n="detailPrice">Harga per lusin</span><div><strong id="detail-price">${money(defaultAmount)}</strong><span data-i18n="perDozen">/ lusin</span></div></div>${colorButtons}${variants}${family.id==='kids'?'<p class="detail-availability" data-i18n="detailKidsNote">Tanyakan foto aktual, ukuran, dan warna sebelum mengonfirmasi pesanan.</p>':''}<div class="selected-line"><span data-i18n="selectedProduct">Pilihan Anda</span><strong id="detail-selected">${selected.name.id}</strong></div><div class="detail-quantity-row"><div><label for="detail-quantity" data-i18n="detailQuantity">Jumlah dalam lusin</label><div class="quantity-stepper"><button type="button" id="detail-minus" aria-label="Kurangi satu lusin" data-label="quantityMinus">−</button><input id="detail-quantity" type="number" min="1" max="100000" step="1" value="1" inputmode="numeric" aria-describedby="detail-error"><span data-i18n="dozen">lusin</span><button type="button" id="detail-plus" aria-label="Tambah satu lusin" data-label="quantityPlus">+</button></div></div><div class="detail-total"><span data-i18n="estimatedSubtotal">Estimasi subtotal produk</span><output id="detail-total" for="detail-quantity" aria-live="polite">${money(defaultAmount)}</output></div></div><p id="detail-error" class="input-error" role="status"></p><button type="button" class="button button-dark detail-order" id="detail-order"><svg aria-hidden="true"><use href="#icon-chat"/></svg><span data-i18n="chooseOrder">Diskusikan pilihan ini</span></button><p class="detail-availability" data-i18n="detailAvailability">Konfirmasi stok, minimum pesanan, dan waktu pengiriman bersama kami sebelum memesan.</p><p id="detail-exchange" class="detail-exchange" hidden>USD prices are indicative, converted at IDR 18,278/USD (20 Nov 2026). <a href="https://www.bi.go.id/en/statistik/informasi-kurs/jisdor/Default.aspx" target="_blank" rel="noopener noreferrer">Bank Indonesia reference</a>. Final USD price is confirmed in your quote.</p><div class="detail-info"><details open><summary data-i18n="productInfo">Informasi produk</summary><dl class="spec-list"><div><dt data-i18n="specCollection">Koleksi</dt><dd id="spec-collection">${family.title.id}</dd></div>${family.id!=='kids'?'<div><dt data-i18n="specChoice">Warna / model</dt><dd id="spec-choice"></dd></div>':''}<div><dt data-i18n="specSize">Ukuran</dt><dd ${isSplit?'id="spec-size"':'data-i18n="confirmSizes"'}>${isSplit?'S · 26–28 cm':'Konfirmasi ukuran yang tersedia kepada tim kami'}</dd></div><div><dt data-i18n="specUnit">Satuan</dt><dd data-i18n="unitDescription">1 lusin (12 pasang)</dd></div><div><dt data-i18n="specMaterial">Bahan</dt><dd data-i18n="confirmMaterial">Tanyakan komposisi bahan kepada tim kami</dd></div></dl></details><details><summary data-i18n="detailShipping">Pengiriman & pemesanan</summary><p data-i18n="detailShippingBody">Pengiriman tersedia ke seluruh Indonesia dan seluruh dunia. Beri tahu tujuan Anda untuk konfirmasi ongkir, ketersediaan, dan ketentuan akhir pesanan.</p></details></div></div></section><section class="related-collections section-shell"><h2 data-i18n="detailMore">Jelajahi koleksi lainnya</h2><div>${families.filter(f=>f.id!==family.id).map(f=>`<a href="${f.file}" data-local-link ${f.id==='kids'?'data-i18n="kidsName"':f.id==='split'?'data-i18n="splitName"':''}>${f.title.id}</a>`).join('')}</div></section>`;
  const dom = newPage(main,'detail',family.title.id);const doc=dom.window.document;
  doc.body.dataset.family=family.id;doc.body.dataset.familyTitle=family.title.id;
  doc.querySelector('meta[name="description"]').content=family.summary.id;
  const script=doc.createElement('script');script.type='module';script.src='product.js';doc.body.append(script);
  writeFileSync(new URL('dist/'+family.file,root),dom.serialize());
}
console.log('Generated a compact homepage, five product-detail pages and a separate complete price list.');
