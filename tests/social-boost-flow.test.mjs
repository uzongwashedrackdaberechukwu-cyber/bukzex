import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { socialTargetError, socialDisplayStatus, socialOrderDetails } from '../bukzex-shadex-catalog-worker/src/social-boost.js';

const worker = readFileSync(new URL('../bukzex-shadex-catalog-worker/src/index.js', import.meta.url), 'utf8');
const fn = name => {
 const start = worker.indexOf('function ' + name + '(');
 const end = worker.indexOf('\n}', start) + 2;
 return worker.slice(start, end);
};
const state = vm.runInNewContext('(' + fn('supplierOrderState') + ')', {socialDisplayStatus});
test('target validation rejects empty, handle-only, wrong platform and deceptive hosts', () => {
 for (const link of ['', '@myprofile', 'http://facebook.com/profile.php?id=1', 'https://instagram.com/person', 'https://facebook.com.evil.example/person', 'https://facebook.com/']) {
  assert.ok(socialTargetError(link, 'facebook'), link);
 }
 assert.equal(socialTargetError('https://www.facebook.com/profile.php?id=123', 'facebook'), '');
 assert.equal(socialTargetError('https://m.facebook.com/person/posts/123', 'facebook'), '');
});
test('payment acceptance and active statuses never count as delivered social boosts', () => {
 for (const status of ['active', 'processing', 'pending', 'completed', 'success']) {
  assert.equal(state('social', {status}).fulfilled, false);
 }
 assert.equal(state('social', {status: 'completed', delivery_confirmed: true}).status, 'completed');
 assert.equal(state('social', {status: 'partial'}).status, 'partial');
 assert.equal(state('social', {status: 'refunded'}).failed, true);
 assert.equal(state('rental', {status: 'active'}).fulfilled, true);
 assert.equal(state('sms', {status: 'active'}).fulfilled, false);
});
test('zero remaining is preserved and cached completion evidence is never inherited', () => {
 const details = socialOrderDetails({remains: 0}, {target_link:'https://x.com/user', quantity:100, delivery_confirmed:true});
 assert.equal(details.remains, 0);
 assert.equal(details.quantity, 100);
 assert.equal(details.delivery_confirmed, false);
});
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const purchase = (mocks = {}) => vm.runInNewContext('(' + 'async ' + fn('purchase') + ')', {
 HttpError, UUID: /^[a-z0-9-]+$/, ORDER_ROUTES:{social:'/social-boost/orders'},
 verifyFirebaseToken: async () => ({uid:'test-user'}), socialTargetError,
 docResource: (_, path) => path, Number, String, JSON,
 ...mocks,
});
const request = (target_link, expected_amount_minor = 205000) => ({
 headers: new Headers(), json:async()=>({service_key:'social', item_id:'pack-1', idempotency_key:'request-1', expected_amount_minor, inputs:{target_link}})
});
test('empty target is rejected before reading or charging a wallet', async () => {
 let reads = 0;
 const run = purchase({firestoreGet:async()=>{reads++; throw Error('unexpected read');}});
 await assert.rejects(run(request(''), {SHADEX_API_KEY:'test'}), /Paste the public/);
 assert.equal(reads, 0);
});
test('authoritative platform mismatch is rejected before any payment write', async () => {
 let writes = 0;
 const run = purchase({
  firestoreGet:async (_, path)=>path.startsWith('shadex_purchase_requests/') ? null : path.startsWith('wallets/') ? {data:{currency:'NGN',balance:10000}} : {data:{status:'active'}},
  callShadex:async()=>({response:{ok:true},payload:{success:true,data:{services:[{package_id:'pack-1',platform:'facebook',quantity:100,price:{currency:'NGN',minor_unit:2,amount_minor:100000}}]}}}),
  isNgnPrice:()=>true, firestoreCommit:async()=>{writes++;}
 });
 await assert.rejects(run(request('https://instagram.com/person'), {SHADEX_API_KEY:'test'}), /facebook/);
 assert.equal(writes, 0);
});
test('changed retail price is rejected before wallet debit', async () => {
 let writes = 0;
 const run = purchase({
  firestoreGet:async (_, path)=>path.startsWith('shadex_purchase_requests/') ? null : path.startsWith('wallets/') ? {data:{currency:'NGN',balance:10000}} : path.includes('/prices/') ? {data:{amount_minor:210000,minor_unit:2,currency:'NGN'}} : {data:{status:'active'}},
  callShadex:async()=>({response:{ok:true},payload:{success:true,data:{services:[{package_id:'pack-1',platform:'facebook',quantity:100,price:{currency:'NGN',minor_unit:2,amount_minor:100000}}]}}}),
  isNgnPrice:()=>true, activeNgnPrice:()=>true, firestoreCommit:async()=>{writes++;}
 });
 await assert.rejects(run(request('https://facebook.com/person'), {SHADEX_API_KEY:'test'}), /price changed/);
 assert.equal(writes, 0);
});
test('valid checkout saves target and authoritative quantity with one wallet debit; retry does not debit again', async () => {
 const rows = new Map([
  ['services/social',{data:{status:'active'}}],
  ['wallets/test-user',{data:{currency:'NGN',balance:10000},updateTime:'wallet-v1'}],
  ['services/social/prices/pack-1',{data:{currency:'NGN',minor_unit:2,amount_minor:205000,item_name:'Facebook likes'}}],
 ]);
 let commits = 0, submissions = 0;
 const write = (_, path, data) => ({path,data});
 const run = purchase({
  firestoreGet:async (_, path)=>rows.get(path) || null,
  callShadex:async()=>({response:{ok:true},payload:{success:true,data:{services:[{package_id:'pack-1',platform:'facebook',quantity:1000,price:{currency:'NGN',minor_unit:2,amount_minor:100000}}]}}}),
  isNgnPrice:()=>true, activeNgnPrice:()=>true, SUPPORT_URL:'https://example.com/help', Date,
  updateWrite:write,createWrite:write,
  firestoreCommit:async(_,writes)=>{commits++;for(const w of writes) rows.set(w.path,{data:w.data});},
  submitSavedPurchaseToShadex:async(_,uid,orderId,row)=>{submissions++;assert.equal(row.data.request_data.target_link,'https://facebook.com/person');return {order_id:orderId,status:'processing'};}
 });
 const env={SHADEX_API_KEY:'test'};
 await run(request('https://facebook.com/person'),env);
 const order=rows.get('orders/shadex_test-user_request-1').data;
 assert.equal(order.quantity,1000);assert.equal(order.target_link,'https://facebook.com/person');
 assert.equal(order.delivery_confirmed,false);assert.equal(order.status,'processing');
 assert.equal(rows.get('wallets/test-user').data.balance,7950);
 await run(request('https://facebook.com/person'),env);
 assert.equal(commits,1);assert.equal(submissions,2); // recovery reuses the same saved request, without another wallet write
});
