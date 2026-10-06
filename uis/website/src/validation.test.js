import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getCitiesForCountry,
  getDialingCode,
  getLocationsForCountryAndCity,
  validateApplicationForm,
  validateContactForm,
} from './validation.js';

const validSubmission = {
  name: 'Jordan Lee',
  email: 'jordan@example.com',
  phone: '',
  message: 'I would like to learn more about Brasaland.',
};

const validApplication = {
  name: 'Jordan Lee',
  email: 'jordan@example.com',
  phone: '305 555 0123',
  phoneCode: '+1',
  country: 'US',
  city: 'miami',
  favoriteLocation: 'miami',
  dob: '1990-06-15',
  howFound: 'friends-family',
  terms: true,
};

test('accepts valid contact details without an optional phone number', () => {
  assert.deepEqual(validateContactForm(validSubmission), {});
});

test('rejects missing and whitespace-only required values', () => {
  const errors = validateContactForm({ name: '  ', email: '', phone: '', message: '   ' });
  assert.equal(errors.name, 'Please enter your name.');
  assert.equal(errors.email, 'Please enter your email address.');
  assert.equal(errors.message, 'Please enter a message.');
});

test('rejects invalid email addresses and names outside the supported length', () => {
  assert.match(validateContactForm({ ...validSubmission, email: 'not-an-email' }).email, /valid email/);
  assert.match(validateContactForm({ ...validSubmission, name: 'A' }).name, /at least 2/);
  assert.match(validateContactForm({ ...validSubmission, name: 'J'.repeat(101) }).name, /100 characters/);
});

test('accepts international phone punctuation and rejects invalid digit counts or characters', () => {
  assert.deepEqual(validateContactForm({ ...validSubmission, phone: '+1 (305) 555-0123' }), {});
  assert.match(validateContactForm({ ...validSubmission, phone: '12345' }).phone, /7 to 15 digits/);
  assert.match(validateContactForm({ ...validSubmission, phone: 'call-me-please' }).phone, /7 to 15 digits/);
  assert.match(validateContactForm({ ...validSubmission, phone: '12+3456789' }).phone, /7 to 15 digits/);
});

test('enforces message length after trimming whitespace', () => {
  assert.match(validateContactForm({ ...validSubmission, message: '  short  ' }).message, /at least 10/);
  assert.match(validateContactForm({ ...validSubmission, message: 'M'.repeat(1001) }).message, /1,000 characters/);
});

test('accepts a complete Brasa Points application from an adult', () => {
  assert.deepEqual(validateApplicationForm(validApplication, new Date(2026, 9, 5)), {});
});

test('requires the application identity, phone, location, referral, age, and consent fields', () => {
  const errors = validateApplicationForm({}, new Date(2026, 9, 5));
  for (const field of ['name', 'email', 'phone', 'country', 'city', 'favoriteLocation', 'dob', 'howFound', 'terms']) {
    assert.ok(errors[field], `expected ${field} to be required`);
  }
});

test('requires application members to be at least 18 and rejects invalid or future birth dates', () => {
  const today = new Date(2026, 9, 5);
  assert.match(validateApplicationForm({ ...validApplication, dob: '2008-10-06' }, today).dob, /18 or older/);
  assert.match(validateApplicationForm({ ...validApplication, dob: '2026-10-06' }, today).dob, /18 or older/);
  assert.match(validateApplicationForm({ ...validApplication, dob: '2000-02-30' }, today).dob, /18 or older/);
  assert.deepEqual(validateApplicationForm({ ...validApplication, dob: '2008-10-05' }, today), {});
});

test('provides country-specific dialing codes, cities, and favorite locations', () => {
  assert.equal(getDialingCode('CO'), '+57');
  assert.equal(getDialingCode('US'), '+1');
  assert.deepEqual(getCitiesForCountry('CO').map(({ value }) => value), ['medellin', 'other-colombia']);
  assert.deepEqual(getCitiesForCountry('US').map(({ value }) => value), ['miami', 'other-florida']);
  assert.deepEqual(getLocationsForCountryAndCity('CO', 'medellin').map(({ value }) => value), ['medellin-downtown', 'other-medellin']);
  assert.deepEqual(getLocationsForCountryAndCity('US', 'miami').map(({ value }) => value), ['miami', 'other-florida']);
});

test('rejects a dial code or favorite location that does not match the selected country and city', () => {
  assert.match(validateApplicationForm({ ...validApplication, phoneCode: '+57' }).phone, /dialing code/);
  assert.match(validateApplicationForm({ ...validApplication, favoriteLocation: 'medellin-downtown' }).favoriteLocation, /favorite/);
});