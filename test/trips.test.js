const { test } = require('node:test');
const assert = require('node:assert/strict');
const Trip = require('../app_api/models/travlr');
const trips = require('../data/trips.json');

test('sample trips validate and serialize dates as ISO strings', async () => {
  assert.equal(trips.length, 4);
  assert.equal(new Set(trips.map(trip => trip.code)).size, trips.length);
  for (const trip of trips) {
    const document = new Trip(trip);
    await document.validate();
    assert.ok(document.start instanceof Date);
    const json = JSON.parse(JSON.stringify(document));
    assert.equal(json.start, new Date(trip.start).toISOString());
    assert.equal(json.code, trip.code);
  }
});

test('incomplete trip records and invalid dates are rejected', async () => {
  for (const field of ['code', 'name', 'length', 'start', 'resort', 'perPerson', 'image', 'description']) {
    const invalid = { ...trips[0] };
    delete invalid[field];
    await assert.rejects(new Trip(invalid).validate(), error => Boolean(error.errors[field]));
  }
  await assert.rejects(new Trip({ ...trips[0], start: 'not-a-date' }).validate(),
    error => error.errors.start.name === 'CastError');
});
