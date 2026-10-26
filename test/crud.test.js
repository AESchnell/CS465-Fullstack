const { test } = require('node:test');
const assert = require('node:assert/strict');
const Trip = require('../app_api/models/travlr');
const controller = require('../app_api/controllers/trips');
const sample = require('../data/trips.json')[0];
function response() { return { statusCode: 200, status(n) { this.statusCode=n; return this; }, json(body) { this.body=body; return this; } }; }
test('POST validates input before writing', async t => {
  t.mock.method(Trip, 'create', () => { throw new Error('Must not write'); });
  for (const body of [{}, {...sample, perPerson: '-1'}, {...sample, start: 'invalid'}, {...sample, code: '$bad'}, {...sample, image: '../secret.jpg'}]) {
    const res=response(); await controller.tripsAddTrip({body},res); assert.equal(res.statusCode,400);
  }
});
test('POST returns created trip and removes executable HTML', async t => {
  t.mock.method(Trip, 'create', async data => data);
  const res=response(); await controller.tripsAddTrip({body:{...sample,description:'<p>Trip</p><script>alert(1)</script>',extra:'ignored'}},res);
  assert.equal(res.statusCode,201); assert.equal(res.body.description,'<p>Trip</p>'); assert.equal(res.body.extra,undefined);
});
test('duplicate code is a conflict', async t => {
  t.mock.method(Trip,'create',async()=>{throw {code:11000};});
  const res=response(); await controller.tripsAddTrip({body:sample},res); assert.equal(res.statusCode,409);
});
test('PUT validates and updates only an existing matching code', async t => {
  t.mock.method(Trip,'findOneAndUpdate',(filter,update,options)=>({exec:async()=>{assert.deepEqual(filter,{code:sample.code});assert.equal(options.runValidators,true); return {...update.$set,name:'Updated'};}}));
  const res=response(); await controller.tripsUpdateTrip({params:{tripCode:sample.code},body:sample},res); assert.equal(res.statusCode,200); assert.equal(res.body.name,'Updated');
  const bad=response(); await controller.tripsUpdateTrip({params:{tripCode:'OTHER'},body:sample},bad); assert.equal(bad.statusCode,400);
});
test('PUT and DELETE report missing records', async t => {
  for(const method of ['findOneAndUpdate','findOneAndDelete']) t.mock.method(Trip,method,()=>({exec:async()=>null}));
  for(const handler of [controller.tripsUpdateTrip,controller.tripsDeleteTrip]) { const res=response();await handler({params:{tripCode:sample.code},body:sample},res);assert.equal(res.statusCode,404); }
});
test('DELETE returns confirmation and handles database failure',async t=>{
 t.mock.method(Trip,'findOneAndDelete',()=>({exec:async()=>sample}));
 const res=response();await controller.tripsDeleteTrip({params:{tripCode:sample.code}},res);assert.equal(res.body.code,sample.code);
 t.mock.method(Trip,'findOneAndDelete',()=>({exec:async()=>{throw new Error('secret');}}));
 const bad=response();await controller.tripsDeleteTrip({params:{tripCode:sample.code}},bad);assert.equal(bad.statusCode,500);assert.doesNotMatch(bad.body.message,/secret/);
});

// Reproduce the JSON payload emitted by an edited Angular type="number" input.
test('POST and PUT accept numeric prices, including zero, and normalize storage', async t => {
  t.mock.method(Trip, 'create', async data => data);
  t.mock.method(Trip, 'findOneAndUpdate', (filter, update) => ({ exec: async () => update.$set }));
  for (const handler of [controller.tripsAddTrip, controller.tripsUpdateTrip]) {
    for (const price of [1349, 1349.99, 0]) {
      const res = response();
      await handler({ params: { tripCode: sample.code }, body: { ...sample, perPerson: price } }, res);
      assert.equal(res.statusCode, handler === controller.tripsAddTrip ? 201 : 200);
      assert.equal(res.body.perPerson, String(price));
    }
  }
});
test('numeric price normalization still rejects invalid prices', async t => {
  t.mock.method(Trip, 'create', () => { throw new Error('Must not write'); });
  for (const price of [null, '', -1, 12.345, NaN, Infinity, false, {}, []]) {
    const res = response();
    await controller.tripsAddTrip({ body: { ...sample, perPerson: price } }, res);
    assert.equal(res.statusCode, 400);
  }
});
