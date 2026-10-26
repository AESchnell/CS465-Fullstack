const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const Trip = require('../app_api/models/travlr');
const router = require('../app_api/routes');
const { travel } = require('../app_server/controllers/travel');
const trips = require('../data/trips.json');

// Exercise real HTTP routing while controlling the database outcome.
async function withAPI(t, query, run) {
  t.mock.method(Trip, 'find', filter => ({ exec: () => query(filter) }));
  const app = express();
  app.use('/api', router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('list and trip-code routes return JSON and use the correct FIND filters', async t => {
  const filters = [];
  await withAPI(t, async filter => {
    filters.push(filter);
    return filter.code ? trips.filter(trip => trip.code === filter.code) : trips;
  }, async base => {
    let response = await fetch(`${base}/api/trips`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application\/json/);
    assert.deepEqual(await response.json(), trips);
    response = await fetch(`${base}/api/trips/${trips[0].code}`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [trips[0]]);
    assert.deepEqual(filters, [{}, { code: trips[0].code }]);
  });
});

test('empty list is 200; missing trip and route are JSON 404; POST is 405', async t => {
  await withAPI(t, async () => [], async base => {
    const list = await fetch(`${base}/api/trips`);
    assert.equal(list.status, 200);
    assert.deepEqual(await list.json(), []);
    for (const path of ['/api/trips/MISSING', '/api/unknown']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 404);
      assert.equal(typeof (await response.json()).message, 'string');
    }
    const post = await fetch(`${base}/api/trips`, { method: 'POST' });
    assert.equal(post.status, 405);
    assert.equal(post.headers.get('allow'), 'GET, HEAD');
  });
});

test('database failures return JSON 500 without leaking internal errors', async t => {
  await withAPI(t, async () => { throw new Error('internal database details'); }, async base => {
    for (const path of ['/api/trips', '/api/trips/GALR210214']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 500);
      const body = await response.json();
      assert.equal(typeof body.message, 'string');
      assert.doesNotMatch(JSON.stringify(body), /internal database details/);
    }
  });
});

async function renderTravel(t, response) {
  let captured;
  t.mock.method(global, 'fetch', async (url, options) => {
    assert.equal(url, 'http://127.0.0.1:4321/api/trips');
    assert.equal(options.method, 'GET');
    if (response instanceof Error) throw response;
    return response;
  });
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    render(view, data) { captured = { status: this.statusCode, view, data }; }
  };
  await travel({ app: { get: () => 4321 } }, res);
  return captured;
}

test('Travel renders records returned by the API', async t => {
  const result = await renderTravel(t, { ok: true, json: async () => trips });
  assert.equal(result.status, 200);
  assert.equal(result.view, 'travel');
  assert.deepEqual(result.data.trips, trips);
});

test('Travel displays an empty-list message', async t => {
  const result = await renderTravel(t, { ok: true, json: async () => [] });
  assert.equal(result.status, 200);
  assert.match(result.data.message, /No trips/);
});

for (const [name, response] of [
  ['HTTP failure', { ok: false, status: 500 }],
  ['non-array JSON', { ok: true, json: async () => ({ message: 'unexpected' }) }],
  ['invalid JSON', { ok: true, json: async () => { throw new SyntaxError('invalid JSON'); } }],
  ['network failure', new Error('connection refused')]
]) {
  test(`Travel handles ${name} with a friendly 502 page`, async t => {
    const result = await renderTravel(t, response);
    assert.equal(result.status, 502);
    assert.deepEqual(result.data.trips, []);
    assert.match(result.data.message, /temporarily unavailable/);
  });
}
