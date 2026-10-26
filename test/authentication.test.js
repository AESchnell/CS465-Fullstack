const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
const User = require('../app_api/models/user');
const Trip = require('../app_api/models/travlr');
const router = require('../app_api/routes');
const passport = require('../app_api/config/passport');
const security = require('../app_api/config/security');
const sample = require('../data/trips.json')[0];
const user = new User({ name: 'Mock Admin', email: 'mock@example.test' });
async function withAPI(run) {
  const app = express(); app.use(express.json()); app.use(passport.initialize()); app.use('/api', router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = (method, path, body, token) => fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  try { await run(request); } finally { await new Promise(resolve => server.close(resolve)); }
}
test('passwords use distinct salts and timing-safe verification; hashes never serialize', async () => {
  const a = new User({ name: 'A', email: 'a@example.test' }); const b = new User({ name: 'B', email: 'b@example.test' });
  await Promise.all([a.setPassword('long mock password'), b.setPassword('long mock password')]);
  assert.notEqual(a.salt, b.salt); assert.notEqual(a.hash, b.hash);
  assert.equal(await a.validPassword('long mock password'), true);
  assert.equal(await a.validPassword('wrong'), false);
  assert.equal(a.toJSON().hash, undefined); assert.equal(a.toJSON().salt, undefined);
});
test('JWT has a verified identity, audience, issuer, and one-hour expiry', () => {
  const payload = jwt.verify(user.generateJWT(), security.secret(), { algorithms: ['HS256'], issuer: security.issuer, audience: security.audience });
  assert.equal(payload.sub, user.id); assert.equal(payload.exp - payload.iat, 3600); assert.equal(payload.hash, undefined);
});
test('all writes and account registration reject anonymous clients; GET remains public', async t => {
  t.mock.method(Trip, 'find', () => ({ exec: async () => [sample] }));
  t.mock.method(Trip, 'create', () => { throw new Error('Must not reach write controller'); });
  await withAPI(async request => {
    for (const [method, path] of [['POST','/trips'],['PUT','/trips/'+sample.code],['DELETE','/trips/'+sample.code],['POST','/register'],['GET','/me']]) {
      const res = await request(method, path, method === 'GET' ? null : sample); assert.equal(res.status, 401);
    }
    assert.equal((await request('GET','/trips')).status,200);
  });
});
test('malformed, forged, expired, wrong-audience, and missing-expiry JWTs are rejected', async () => {
  const opts = { algorithm:'HS256',subject:user.id,issuer:security.issuer,audience:security.audience };
  const tokens = ['broken', jwt.sign({},'different-secret',{...opts,expiresIn:'1h'}),jwt.sign({},security.secret(),{...opts,expiresIn:-1}),jwt.sign({},security.secret(),{...opts,audience:'other',expiresIn:'1h'}),jwt.sign({},security.secret(),opts)];
  await withAPI(async request => { for(const token of tokens) assert.equal((await request('POST','/trips',sample,token)).status,401); });
});
test('a valid token from a deleted account is rejected', async t => {
  t.mock.method(User,'findById',()=>({exec:async()=>null}));
  await withAPI(async request=>assert.equal((await request('GET','/me',null,user.generateJWT())).status,401));
});
test('authenticated users can POST, PUT and DELETE; account response omits secrets', async t => {
  t.mock.method(User,'findById',()=>({exec:async()=>user}));
  t.mock.method(Trip,'create',async data=>data);
  t.mock.method(Trip,'findOneAndUpdate',(_filter,update)=>({exec:async()=>update.$set}));
  t.mock.method(Trip,'findOneAndDelete',()=>({exec:async()=>sample}));
  await withAPI(async request=>{
    const token=user.generateJWT();
    assert.equal((await request('POST','/trips',sample,token)).status,201);
    assert.equal((await request('PUT','/trips/'+sample.code,sample,token)).status,200);
    assert.equal((await request('DELETE','/trips/'+sample.code,null,token)).status,200);
    const me=await request('GET','/me',null,token); assert.equal(me.status,200);assert.deepEqual(await me.json(),{name:user.name,email:user.email});
  });
});
test('login verifies password, normalizes email and returns generic failures', async t => {
  await user.setPassword('mock login password');
  t.mock.method(User,'findOne',filter=>({select:()=>({exec:async()=>filter.email===user.email?user:null})}));
  await withAPI(async request=>{
    assert.equal((await request('POST','/login',{})).status,400);
    const bad=await request('POST','/login',{email:user.email,password:'incorrect'});assert.equal(bad.status,401);
    const unknown=await request('POST','/login',{email:'unknown@example.test',password:'incorrect'});assert.equal(unknown.status,401);assert.deepEqual(await unknown.json(),await bad.json());
    const good=await request('POST','/login',{email:' MOCK@example.test ',password:'mock login password'});assert.equal(good.status,200);assert.equal(good.headers.get('cache-control'),'no-store');
    assert.equal(jwt.verify((await good.json()).token,security.secret()).sub,user.id);
  });
});
test('authenticated registration validates input, hashes passwords, and handles duplicates', async t=>{
  t.mock.method(User,'findById',()=>({exec:async()=>user}));
  t.mock.method(User.prototype,'save',async function(){ assert.ok(this.hash);assert.ok(this.salt);return this; });
  await withAPI(async request=>{
    const token=user.generateJWT();
    assert.equal((await request('POST','/register',{name:'New',email:'new@example.test',password:'short'},token)).status,400);
    const good=await request('POST','/register',{name:'New',email:'new@example.test',password:'long new password'},token);assert.equal(good.status,201);assert.equal(typeof (await good.json()).token,'string');
    t.mock.method(User.prototype,'save',async()=>{throw {code:11000};});
    assert.equal((await request('POST','/register',{name:'New',email:'new@example.test',password:'long new password'},token)).status,409);
  });
});
test('database authentication failures deny access without exposing errors', async t=>{
  t.mock.method(User,'findById',()=>({exec:async()=>{throw new Error('private database details');}}));
  await withAPI(async request=>{const res=await request('POST','/trips',sample,user.generateJWT());assert.equal(res.status,503);assert.doesNotMatch(JSON.stringify(await res.json()),/private/);});
});
