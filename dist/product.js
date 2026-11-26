import { products, sizes, splitVariants, money, unitPrice, estimate, parseQuantity } from './core.js';
import { families, familyProducts, colourName } from './catalog.js';
import { getLanguage, openOrder } from './app.js';

const dq = selector => document.querySelector(selector);
const dqa = selector => [...document.querySelectorAll(selector)];
const family = families.find(f => f.id === document.body.dataset.family);
const allowed = familyProducts(family.id);
const params = new URL(location.href).searchParams;
let selectedId = allowed.some(p => p.id === params.get('product')) ? params.get('product') : family.defaultProduct;
let selectedVariant = splitVariants.some(v => v.id === params.get('variant')) ? params.get('variant') : 'plain';
let selectedSize = sizes.some(s => s.id === params.get('size')) ? params.get('size') : 'S';

function updateDetail() {
  const language = getLanguage();
  const product = products.find(p => p.id === selectedId);
  const variant = splitVariants.find(v => v.id === selectedVariant);
  const size = sizes.find(s => s.id === selectedSize);
  const selectedName = family.id === 'split' ? `${variant.name[language]} · ${size.id} (${size.length})` : product.name[language];
  dq('#detail-title').textContent=family.title[language];
  document.title=family.title[language]+' | Feelsoft';
  dq('meta[name="description"]').content=family.summary[language];
  dq('#detail-description').textContent=family.summary[language];
  dq('#detail-price').textContent=(language==='en'?'≈ ':'')+money(unitPrice(selectedId,selectedVariant,selectedSize),language);
  dq('#detail-selected').textContent=selectedName;
  dq('#spec-collection').textContent=family.title[language];
  if(dq('#spec-choice')) dq('#spec-choice').textContent=family.id==='split'?variant.name[language]:colourName(product,language);
  if(dq('#spec-size')) dq('#spec-size').textContent=`${size.id} · ${size.length}`;
  dq('#detail-exchange').hidden=language!=='en';
  if(dq('#detail-pattern-note')) dq('#detail-pattern-note').hidden=selectedVariant!=='pattern';
  for(const button of dqa('[data-detail-product]')) {
    button.setAttribute('aria-pressed',String(button.dataset.detailProduct===selectedId));
    button.querySelector('[data-colour-name]').textContent=colourName(products.find(p=>p.id===button.dataset.detailProduct),language);
  }
  for(const button of dqa('[data-detail-variant]')) button.setAttribute('aria-pressed',String(button.dataset.detailVariant===selectedVariant));
  for(const button of dqa('[data-detail-size]')) button.setAttribute('aria-pressed',String(button.dataset.detailSize===selectedSize));
  try {
    const qty=parseQuantity(dq('#detail-quantity').value);
    dq('#detail-total').textContent=money(estimate(selectedId,qty,selectedVariant,selectedSize),language);
    dq('#detail-error').textContent='';dq('#detail-quantity').setAttribute('aria-invalid','false');
    dq('#detail-order').disabled=false;dq('#detail-minus').disabled=qty===1;dq('#detail-plus').disabled=qty===100000;
  } catch {
    dq('#detail-total').textContent='—';dq('#detail-order').disabled=true;
    dq('#detail-quantity').setAttribute('aria-invalid','true');
    dq('#detail-error').textContent=language==='en'?'Enter a whole number between 1 and 100,000 dozen.':'Masukkan jumlah bulat antara 1–100.000 lusin.';
    dq('#detail-minus').disabled=false;dq('#detail-plus').disabled=false;
  }
  const url=new URL(location.href);
  if(family.id==='split'){url.searchParams.set('variant',selectedVariant);url.searchParams.set('size',selectedSize);url.searchParams.delete('product');}
  else{url.searchParams.set('product',selectedId);url.searchParams.delete('variant');url.searchParams.delete('size');}
  history.replaceState(null,'',url);
}
for(const button of dqa('[data-detail-product]')) button.addEventListener('click',()=>{selectedId=button.dataset.detailProduct;updateDetail();});
for(const button of dqa('[data-detail-variant]')) button.addEventListener('click',()=>{selectedVariant=button.dataset.detailVariant;updateDetail();});
for(const button of dqa('[data-detail-size]')) button.addEventListener('click',()=>{selectedSize=button.dataset.detailSize;updateDetail();});
dq('#detail-quantity').addEventListener('input',updateDetail);
for(const [selector,delta] of [['#detail-minus',-1],['#detail-plus',1]]) dq(selector).addEventListener('click',()=>{
  const current=Number(dq('#detail-quantity').value);
  dq('#detail-quantity').value=Math.max(1,Math.min(100000,(Number.isFinite(current)?Math.round(current):1)+delta));updateDetail();
});
dq('#detail-order').addEventListener('click',()=>{
  try{openOrder(selectedId,parseQuantity(dq('#detail-quantity').value),selectedVariant,selectedSize);}catch{updateDetail();}
});
document.addEventListener('feelsoft:language',updateDetail);
window.addEventListener('pageshow',updateDetail);
updateDetail();
