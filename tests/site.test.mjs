import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import * as core from '../dist/core.js';
import * as catalog from '../dist/catalog.js';
import { en, messages } from '../dist/content.js';

const read = name => readFileSync(new URL('../dist/' + name, import.meta.url), 'utf8');
const compile = name => read(name).replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');
const pages = ['index.html','pricelist.html',...catalog.families.map(f=>f.file)];
const mkPrices = [
  ['casual-mix-brown','MK Casual Mix Cokelat',25500],['casual-mix','MK Casual Mix',25500],
  ['casual-black','MK Casual Hitam',25500],['casual-navy','MK Casual Navy',25500],
  ['casual-dark-grey','MK Casual Abu Tua',25500],['casual-light-grey','MK Casual Abu Muda',25500],
  ['mesh-navy','MK Mesh Navy',26000],['mesh-black','MK Mesh Hitam',26000],
  ['mesh-light-grey','MK Mesh Abu Muda',26000],['mesh-white','MK Mesh Putih',26500],
  ['mini-white','MK Mini Putih',26500],['mini-black','MK Mini Hitam',26000],
  ['mini-navy','MK Mini Navy',26000],['mini-light-grey','MK Mini Abu Muda',26000]
];
const skmPrices = [['plain','S',41000],['plain','M',42000],['plain','L',44000],['plain-black','S',41000],['plain-black','M',42000],['plain-black','L',44000],['sole','S',42000],['sole','M',43000],['sole','L',44000],['sole-white','S',42000],['sole-white','M',43000],['sole-white','L',44000],['pattern','S',43000],['pattern','M',44000],['pattern','L',46000]];

function setup(page='index.html', lang='id', query='') {
  const dom=new JSDOM(read(page),{url:`https://feelsoft.example/${page}?lang=${lang}${query}`,runScripts:'outside-only'});
  Object.assign(dom.window,core,catalog,{en,messages});
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
  const opened=[];dom.window.open=(...args)=>opened.push(args);
  dom.window.eval(compile('app.js'));
  if(dom.window.document.body.dataset.page==='detail') dom.window.eval(compile('product.js'));
  const d=dom.window.document;
  return {dom,d,opened,event:(selector,value,type='input')=>{d.querySelector(selector).value=value;d.querySelector(selector).dispatchEvent(new dom.window.Event(type));}};
}

test('all supplied prices and lengths stay exact, with every transaction in dozens',()=>{
  assert.equal(core.algoProducts.length,14);assert.equal(core.priceRows().length,30);
  for(const [id,name,amount] of mkPrices){assert.equal(core.products.find(p=>p.id===id).name.id,name);assert.equal(core.unitPrice(id),amount);assert.equal(core.estimate(id,12),amount*12);}
  for(const [variant,size,amount] of skmPrices){assert.equal(core.unitPrice('split',variant,size),amount);assert.equal(core.estimate('split',12,variant,size),amount*12);}
  assert.equal(core.estimate('kids',12),312000);assert.deepEqual(core.sizes.map(s=>s.length),['26–28 cm','34–36 cm','40 cm']);
  for(const qty of ['',0,-1,1.5,'NaN',Infinity,100001]) assert.throws(()=>core.parseQuantity(qty));
  assert.throws(()=>core.estimate('split',1));assert.throws(()=>core.estimate('split',1,'plain','XL'));assert.throws(()=>core.unitPrice('missing'));
});

test('homepage has one card per family and no detailed SKU lists, tables or calculator',()=>{
  const {dom,d}=setup();try{
    assert.equal(d.querySelectorAll('.family-grid [data-family-card]').length,3);
    for(const family of catalog.families){const links=d.querySelectorAll(`main [data-family-card="${family.id}"]`);assert.equal(links.length,1);const a=links[0].matches('a')?links[0]:links[0].querySelector('a');assert.equal(new URL(a.href).pathname,'/'+family.file);}
    assert.equal(d.querySelectorAll('main table, main .algo-options, main [data-detail-product], main #estimate-qty').length,0);
    assert.equal(d.querySelectorAll('main [data-product-name]').length,0);
    assert.ok(d.querySelector('main a[href*="pricelist.html"]'));
    d.querySelector('[data-lang="en"]').click();
    assert.match(d.querySelector('[data-family-card="casual"] a').href,/lang=en/);
    assert.match(d.querySelector('[data-price="casual-mix-brown"]').textContent,/USD/);
  }finally{dom.window.close();}
});

test('all pages have complete translations, unique IDs and valid local assets and navigation',()=>{
  for(const page of pages){const dom=new JSDOM(read(page));const d=dom.window.document;
    const ids=[...d.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(ids).size,ids.length,page);
    assert.equal(d.querySelectorAll('h1').length,1,page+' h1');
    for(const attr of ['data-i18n','data-alt','data-label','data-placeholder'])for(const el of d.querySelectorAll(`[${attr}]`))assert.ok(en[el.getAttribute(attr)],page+' missing '+el.getAttribute(attr));
    for(const el of d.querySelectorAll('[src],link[href],a[href]')){
      const ref=el.getAttribute('src')||el.getAttribute('href');if(/^(https?:|data:)/.test(ref)||ref==='#')continue;
      const url=new URL(ref,'https://feelsoft.example/'+page);const file=url.pathname.slice(1);
      assert.ok(existsSync(new URL('../dist/'+file,import.meta.url)),page+' '+ref);
      if(url.hash&&file.endsWith('.html')){const target=file===page?d:new JSDOM(read(file)).window.document;assert.ok(target.getElementById(url.hash.slice(1)),page+' '+ref);}
    }
    dom.window.close();
  }
});

test('each MK page exposes only its own colours and updates the exact price for every choice',()=>{
  for(const family of catalog.families.slice(0,3)){
    const {dom,d}=setup(family.file);try{
      const expected=mkPrices.filter(([id])=>id.startsWith(family.id+'-'));
      assert.equal(d.querySelectorAll('[data-detail-product]').length,expected.length);
      for(const [id,name,amount] of expected){d.querySelector(`[data-detail-product="${id}"]`).click();assert.equal(d.querySelector('#detail-selected').textContent,name);assert.equal(d.querySelector('#detail-price').textContent,core.money(amount));assert.equal(d.querySelector('#detail-total').textContent,core.money(amount));assert.equal(d.querySelectorAll('[data-detail-product][aria-pressed="true"]').length,1);}
      assert.equal(d.querySelectorAll('[data-detail-size]').length,0);
    }finally{dom.window.close();}
  }
});

test('selected colour, quantity, USD price and original SKU survive the WhatsApp flow',()=>{
  const {dom,d,opened,event}=setup('mesh.html');try{
    d.querySelector('[data-detail-product="mesh-white"]').click();event('#detail-quantity','12');
    assert.match(d.querySelector('#detail-total').textContent,/318\.000/);
    d.querySelector('[data-lang="en"]').click();assert.equal(d.querySelector('#detail-quantity').value,'12');assert.match(d.querySelector('#detail-selected').textContent,/MK Mesh White/);assert.match(d.querySelector('#detail-total').textContent,/17\.40/);assert.equal(d.querySelector('#detail-exchange').hidden,false);
    d.querySelector('#detail-order').click();assert.equal(d.querySelector('#order-product').value,'mesh-white');assert.equal(d.querySelector('#order-quantity').value,'12');assert.equal(d.querySelector('#order-variants').hidden,true);
    event('#order-destination','Singapore');d.querySelector('#order-form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
    const url=new URL(opened[0][0]);assert.equal(url.pathname,'/6282170002960');const message=url.searchParams.get('text');assert.match(message,/Catalogue name \(ID\): MK Mesh Putih/);assert.match(message,/Quantity: 12 dozen/);assert.match(message,/USD\s17\.40/);assert.doesNotMatch(message,/Size \/ length:/);
  }finally{dom.window.close();}
});

test('split-toe detail page offers all styles and lengths with correct totals and WhatsApp selection',()=>{
  const {dom,d,opened,event}=setup('jempol.html');try{
    assert.equal(d.querySelectorAll('[data-detail-variant]').length,5);assert.equal(d.querySelectorAll('[data-detail-size]').length,3);
    for(const [variant,size,amount] of skmPrices){d.querySelector(`[data-detail-variant="${variant}"]`).click();d.querySelector(`[data-detail-size="${size}"]`).click();assert.equal(d.querySelector('#detail-price').textContent,core.money(amount));assert.match(d.querySelector('#spec-size').textContent,new RegExp(size));}
    event('#detail-quantity','5');assert.match(d.querySelector('#detail-total').textContent,/230\.000/);
    d.querySelector('[data-lang="en"]').click();assert.match(d.querySelector('#detail-selected').textContent,/Patterned.*L.*40 cm/);
    d.querySelector('#detail-order').click();assert.equal(d.querySelector('#order-variant').value,'pattern');assert.equal(d.querySelector('#order-size').value,'L');assert.equal(d.querySelector('#order-quantity').value,'5');
    event('#order-destination','Singapore');d.querySelector('#order-form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));const message=new URL(opened[0][0]).searchParams.get('text');assert.match(message,/Variant: Patterned/);assert.match(message,/Size \/ length: L \/ 40 cm/);assert.match(message,/USD\s12\.58/);
  }finally{dom.window.close();}
});

test('confirmed split-toe colours remain distinct through language, links, forms and WhatsApp',()=>{
  const {dom,d,opened,event}=setup('jempol.html','id','&variant=sole-white&size=M');try{
    assert.match(d.querySelector('#detail-selected').textContent,/Putih telapak hitam/);
    assert.equal(d.querySelector('#detail-price').textContent,core.money(43000));
    assert.equal(d.querySelector('#detail-pattern-note').hidden,true);
    event('#detail-quantity','4');d.querySelector('[data-lang="en"]').click();
    assert.match(d.querySelector('#detail-selected').textContent,/White with black soles/);
    assert.equal(new URL(dom.window.location.href).searchParams.get('variant'),'sole-white');
    d.querySelector('#detail-order').click();
    assert.equal(d.querySelector('#order-variant').value,'sole-white');
    assert.equal(d.querySelector('#order-variant option:checked').textContent,'White with black soles');
    event('#order-destination','Singapore');d.querySelector('#order-form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
    const message=new URL(opened[0][0]).searchParams.get('text');
    assert.match(message,/Variant: White with black soles/);assert.match(message,/Quantity: 4 dozen/);assert.match(message,/Size \/ length: M \/ 34–36 cm/);
    d.querySelector('.close-dialog').click();
    d.querySelector('[data-lang="id"]').click();d.querySelector('[data-detail-variant="plain-black"]').click();
    assert.match(d.querySelector('#detail-selected').textContent,/Hitam polos/);
    assert.equal(d.querySelector('#detail-price').textContent,core.money(42000));
    d.querySelector('[data-detail-variant="pattern"]').click();assert.equal(d.querySelector('#detail-pattern-note').hidden,false);
    d.querySelector('#detail-order').click();assert.equal(d.querySelector('#order-pattern-note').hidden,false);
    event('#order-variant','sole','change');assert.equal(d.querySelector('#order-pattern-note').hidden,true);
    assert.equal(d.querySelector('#order-variant option:checked').textContent,'Cream telapak hitam');
  }finally{dom.window.close();}
});

test('detail links restore valid selections and reject products from another collection',()=>{
  for(const [page,query,pattern] of [['mini.html','&product=mini-white',/26\.500/],['mini.html','&product=casual-black',/26\.000/],['jempol.html','&variant=pattern&size=L',/46\.000/],['jempol.html','&variant=unknown&size=XL',/41\.000/]]){
    const {dom,d}=setup(page,'id',query);try{assert.match(d.querySelector('#detail-price').textContent,pattern);}finally{dom.window.close();}
  }
});

test('invalid detail quantities cannot be ordered and controls restore a valid quantity',()=>{
  const {dom,d,event}=setup('casual.html');try{
    for(const value of ['0','-1','1.5','100001','']){event('#detail-quantity',value);assert.equal(d.querySelector('#detail-order').disabled,true);assert.equal(d.querySelector('#detail-total').textContent,'—');}
    d.querySelector('#detail-plus').click();assert.equal(d.querySelector('#detail-order').disabled,false);assert.match(d.querySelector('#detail-total').textContent,/25\.500/);
    d.querySelector('#detail-order').click();assert.equal(d.querySelector('#order-dialog').open,true);d.querySelector('.close-dialog').click();assert.equal(d.querySelector('#order-dialog').open,false);
    d.querySelector('.menu-toggle').click();assert.equal(d.querySelector('#mobile-nav').hidden,false);d.querySelector('#mobile-nav a').click();assert.equal(d.querySelector('#mobile-nav').hidden,true);
  }finally{dom.window.close();}
});

test('kids detail retains its price without invented colour or size options',()=>{
  const {dom,d,event}=setup('anak.html');try{assert.equal(d.querySelectorAll('[data-detail-product],[data-detail-size]').length,0);event('#detail-quantity','12');assert.match(d.querySelector('#detail-total').textContent,/312\.000/);}finally{dom.window.close();}
});

test('dedicated price list retains all 30 prices, estimator and full bilingual exports',async()=>{
  for(const language of ['id','en']){const {dom,d,event}=setup('pricelist.html',language);try{
    assert.equal(d.querySelectorAll('.algo-price-table tbody tr').length,14);assert.equal(d.querySelectorAll('[data-order-variant]').length,15);
    event('#estimate-product','split','change');event('#estimate-variant','pattern','change');event('#estimate-size','L','change');event('#estimate-qty','5');assert.equal(d.querySelector('#estimate-total').textContent,core.money(230000,language));
    let blob;dom.window.URL.createObjectURL=value=>{blob=value;return 'blob:test';};dom.window.URL.revokeObjectURL=()=>{};dom.window.HTMLAnchorElement.prototype.click=function(){};
    d.querySelector('#download-prices').click();const text=await new Promise((resolve,reject)=>{const reader=new dom.window.FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsText(blob);});
    assert.equal(text.split('\r\n').filter(line=>line.includes(language==='en'?'"1 dozen"':'"1 lusin"')).length,30);
    assert.equal(text.split('\r\n').filter(line=>/^"MK /.test(line)).length,14);
    if(language==='en')assert.match(text,/Indicative conversion/);else{assert.match(text,/"MK Mesh Putih".*"26500"/);assert.match(text,/"MK Casual Mix Cokelat".*"25500"/);}
  }finally{dom.window.close();}}
});
