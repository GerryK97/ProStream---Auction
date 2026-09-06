#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  MEDIA_FIELDS,
  cloudinaryOriginalUrl,
  extensionForContentType,
  extractCloudinaryPublicId,
  isLegacyCloudinaryValue,
  isR2Value,
  readFieldValues,
  rewriteArrayField,
} from './cloudinary-r2-backfill-lib.mjs';

const R2 = 'https://media.prostream.lk';

// isR2Value / isLegacyCloudinaryValue
assert.equal(isR2Value(`${R2}/prostream-auction/players/a.jpg`, R2), true);
assert.equal(isR2Value('https://res.cloudinary.com/x/image/upload/a', R2), false);
assert.equal(isLegacyCloudinaryValue(`${R2}/prostream-auction/players/a.jpg`, R2), false, 'already-migrated R2 values must never be re-copied');
assert.equal(isLegacyCloudinaryValue('https://res.cloudinary.com/diitsd6nz/image/upload/v1/prostream-auction/players/a.jpg', R2), true);
assert.equal(isLegacyCloudinaryValue('prostream-auction/players/bareid', R2), true, 'bare Cloudinary public IDs must be treated as legacy');
assert.equal(isLegacyCloudinaryValue('data:image/png;base64,AAAA', R2), false, 'data URLs are never Cloudinary-owned');
assert.equal(isLegacyCloudinaryValue('https://example.com/external.jpg', R2), false, 'unrelated external URLs must be left untouched');
assert.equal(isLegacyCloudinaryValue('', R2), false);
assert.equal(isLegacyCloudinaryValue(undefined, R2), false);

// extensionForContentType
assert.equal(extensionForContentType('image/jpeg'), 'jpg');
assert.equal(extensionForContentType('image/png; charset=binary'), 'png');
assert.equal(extensionForContentType('application/octet-stream'), 'jpg', 'unknown types fall back to a safe default extension');

// extractCloudinaryPublicId
assert.equal(extractCloudinaryPublicId('prostream-auction/players/bareid'), 'prostream-auction/players/bareid');
assert.equal(
  extractCloudinaryPublicId('https://res.cloudinary.com/diitsd6nz/image/upload/c_fill,w_600,h_600,f_webp/v1700000000/prostream-auction/players/abc.jpg'),
  'prostream-auction/players/abc',
);
assert.equal(extractCloudinaryPublicId('https://res.cloudinary.com/diitsd6nz/image/upload/'), null, 'a value with no path after /upload/ must not silently produce a truthy id');
assert.equal(cloudinaryOriginalUrl('diitsd6nz', 'prostream-auction/players/abc'), 'https://res.cloudinary.com/diitsd6nz/image/upload/prostream-auction/players/abc');

// readFieldValues
const scalarField = MEDIA_FIELDS.find((f) => f.collection === 'players' && f.path === 'photoURL');
assert.deepEqual(readFieldValues({ photoURL: 'prostream-auction/players/x' }, scalarField), ['prostream-auction/players/x']);
assert.deepEqual(readFieldValues({ photoURL: null }, scalarField), []);
assert.deepEqual(readFieldValues({}, scalarField), []);

const officialsField = MEDIA_FIELDS.find((f) => f.collection === 'teams' && f.path === 'officials');
assert.deepEqual(
  readFieldValues({ officials: [{ role: 'Owner', photoURL: 'a' }, { role: 'Manager' }, { role: 'Captain', photoURL: 'b' }] }, officialsField),
  ['a', 'b'],
);
assert.deepEqual(readFieldValues({ officials: [] }, officialsField), []);
assert.deepEqual(readFieldValues({}, officialsField), []);

// rewriteArrayField
const map = new Map([['a', 'A'], ['b', 'B']]);
const rewritten = rewriteArrayField(
  [{ role: 'Owner', photoURL: 'a' }, { role: 'Manager' }, { role: 'Captain', photoURL: 'b' }],
  officialsField,
  map,
);
assert.deepEqual(rewritten, [{ role: 'Owner', photoURL: 'A' }, { role: 'Manager' }, { role: 'Captain', photoURL: 'B' }]);
// Immutability: the source array must be untouched.
assert.notEqual(rewritten[0], undefined);
assert.equal(rewriteArrayField([{ role: 'Manager' }], officialsField, map), null, 'no matching value must return null, not a same-shape copy');
assert.equal(rewriteArrayField(undefined, officialsField, map), null);

// Each scalar field descriptor must be independently addressable.
for (const descriptor of MEDIA_FIELDS) {
  assert.ok(descriptor.collection && descriptor.path && descriptor.kind, `descriptor missing required keys: ${JSON.stringify(descriptor)}`);
  if (descriptor.kind === 'array') assert.ok(descriptor.field, `array descriptor missing field: ${JSON.stringify(descriptor)}`);
}

console.log('Cloudinary -> R2 backfill mapping tests passed.');
