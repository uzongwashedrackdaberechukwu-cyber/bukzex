import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { activeNgnPrice, isNgnPrice, ngnCatalogue } from '../bukzex-shadex-catalog-worker/src/ngn-pricing.js';
import { catalogueResponse, publicCatalogueData } from '../bukzex-shadex-catalog-worker/src/public-catalogue.js';
const ngn = {currency:'NGN', minor_unit:2, amount_minor:205000};
const xof = {currency:'XOF', minor_unit:0, amount_minor:2050};
test('retail prices require explicit NGN with two decimal places', () => {
  assert.ok(activeNgnPrice(ngn));
  for (const price of [xof, {...ngn, minor_unit:0}, {...ngn, currency:undefined}, {...ngn, minor_unit:null}, {...ngn, amount_minor:NaN}, {...ngn, amount_minor:-1}, {...ngn, is_active:false}]) {
    assert.equal(activeNgnPrice(price), false);
  }
  assert.ok(isNgnPrice({...ngn, amount_minor:0}));
});
test('catalogue keeps NGN package IDs and discards XOF rather than converting', () => {
  const input = {market:{currency:'NGN',minorUnit:2},services:[{package_id:'naira',price:ngn},{package_id:'cfa',price:xof},{id:'bad-unit',price:{...ngn,minor_unit:0}}]};
  const output = publicCatalogueData(input);
  assert.deepEqual(output.services,[{package_id:'naira',price:ngn}]);
  assert.equal(input.services.length,3);
});
test('nested prices filter without losing providers or destination countries', () => {
  const data = {services:[{id:'us-number',country_code:'US',price:ngn}],electricity:{providers:[{id:'p',plans:[{id:'a',price:ngn},{id:'b',price:xof}]}]}};
  const output = ngnCatalogue(data);
  assert.equal(output.services[0].country_code,'US');
  assert.deepEqual(output.electricity.providers[0].plans,[{id:'a',price:ngn}]);
});
test('non-NGN upstream markets fail closed for admins and customers', async () => {
  const data = {market:{currency:'XOF',minorUnit:0},services:[{price:xof}]};
  assert.throws(()=>ngnCatalogue(data));
  const response = await catalogueResponse(Response.json({success:true,data}));
  assert.equal(response.status,502);
  assert.equal((await response.json()).success,false);
});
test('variable bill plans and domain lists remain usable', () => {
  const data = {market:{currency:'NGN',minorUnit:2},electricity:{providers:[{id:'p',service_fee_minor:0,plans:[{id:'v',variable_amount:true}]}]},domains:[{domain_name:'mail.example'}]};
  assert.deepEqual(ngnCatalogue(data),data);
});
test('checkout rejects XOF or malformed prices before any wallet write', async () => {
  const source = readFileSync(new URL('../bukzex-shadex-catalog-worker/src/index.js',import.meta.url),'utf8');
  const start = source.indexOf('async function purchase(');
  const end = source.indexOf('\nasync function ',start+1);
  assert.ok(start>=0 && end>start);
  const fn = source.slice(start,end);
  for (const savedPrice of [xof,{...ngn,minor_unit:0}]) {
    let writes=0;
    const context=vm.createContext({
      isNgnPrice,activeNgnPrice,ORDER_ROUTES:{social:"/social-boost/orders"},UUID:/.*/,HttpError:class extends Error {constructor(status,message){super(message);this.status=status;}},
      verifyFirebaseToken:async()=>({uid:'customer',emailVerified:true}),
      docResource:(_e,p)=>p,
      firestoreGet:async(_e,p)=>{
        if(p==='services/social')return {data:{status:'active'}};
        if(p==='wallets/customer')return {data:{currency:'NGN',balance:2098}};
        if(p==='services/social/prices/selected')return {data:savedPrice};
        return null;
      },
      firestoreCommit:async()=>{writes++;},
    });
    vm.runInContext(fn+'\nglobalThis.buy = purchase;',context);
    await assert.rejects(()=>context.buy({json:async()=>({service_key:'social',item_id:'selected',idempotency_key:'abcdefgh-1234',inputs:{target_link:'https://facebook.com/example'}})},{SHADEX_API_KEY:"test-placeholder"}), /NGN price/);
    assert.equal(writes,0);
  }
});
test('NGN checkout reserves exactly ₦2,050 from a ₦2,098 balance', async () => {
  const source = readFileSync(new URL('../bukzex-shadex-catalog-worker/src/index.js',import.meta.url),'utf8');
  const start=source.indexOf('async function purchase('), end=source.indexOf('\nasync function ',start+1);
  const docs=new Map([
    ['services/social',{data:{status:'active'}}],
    ['wallets/customer',{data:{currency:'NGN',balance:2098},updateTime:'v1'}],
    ['services/social/prices/selected',{data:ngn}],
  ]);
  let commits=0, submitted;
  const context=vm.createContext({
    isNgnPrice,activeNgnPrice,ORDER_ROUTES:{social:'/social-boost/orders'},UUID:/.*/,SUPPORT_URL:'support',
    HttpError:class extends Error {},
    verifyFirebaseToken:async()=>({uid:'customer',emailVerified:true}),docResource:(_e,p)=>p,
    firestoreGet:async(_e,p)=>docs.get(p)||null,
    updateWrite:(_e,path,data)=>({path,data}),createWrite:(_e,path,data)=>({path,data}),
    firestoreCommit:async(_e,writes)=>{commits++;for(const w of writes)docs.set(w.path,{data:w.data});},
    submitSavedPurchaseToShadex:async(_e,_uid,_order,row)=>{submitted=row.data;return {status:'processing'};},
  });
  vm.runInContext(source.slice(start,end)+'\nglobalThis.buy=purchase;',context);
  const req={json:async()=>({service_key:'social',item_id:'selected',idempotency_key:'abcdefgh-1234',inputs:{target_link:'https://facebook.com/example'}})};
  await context.buy(req,{SHADEX_API_KEY:'test-placeholder'});
  assert.equal(docs.get('wallets/customer').data.balance,48);
  assert.equal(submitted.amount_minor,205000);
  assert.equal(submitted.currency,'NGN');
  // Replaying the same request keeps the original reservation.
  await context.buy(req,{SHADEX_API_KEY:'test-placeholder'});
  assert.equal(commits,1);
  assert.equal(docs.get('wallets/customer').data.balance,48);
});
