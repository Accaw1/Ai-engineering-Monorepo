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
  favoriteLocation: 'brickell',
  dob: '1990-06-15',
  howFound: 'recommendation',
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
  assert.deepEqual(validateApplicationForm({
    ...validApplication,
    phone: '300 123 4567',
    phoneCode: '+57',
    country: 'CO',
    city: 'medellin',
    favoriteLocation: 'el-poblado',
  }, new Date(2026, 9, 5)), {});
});

test('allows optional favorite location and dietary preferences to be left blank', () => {
  assert.deepEqual(validateApplicationForm({
    ...validApplication,
    favoriteLocation: '',
    dietaryPreferences: [],
  }, new Date(2026, 9, 5)), {});
});

test('requires the application identity, phone, country, city, referral, age, and consent fields', () => {
  const errors = validateApplicationForm({}, new Date(2026, 9, 5));
  for (const field of ['name', 'email', 'phone', 'country', 'city', 'dob', 'howFound', 'terms']) {
    assert.ok(errors[field], `expected ${field} to be required`);
  }
  assert.equal(errors.favoriteLocation, undefined);
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
  assert.deepEqual(getCitiesForCountry('CO').map(({ value }) => value), ['medellin', 'bogota', 'cali']);
  assert.deepEqual(getCitiesForCountry('US').map(({ value }) => value), ['miami', 'orlando']);
  assert.deepEqual(getLocationsForCountryAndCity('CO', 'medellin').map(({ label }) => label), [
    'Brasaland El Poblado', 'Brasaland Laureles', 'Brasaland Envigado', 'Brasaland Sabaneta',
  ]);
  assert.deepEqual(getLocationsForCountryAndCity('CO', 'bogota').map(({ label }) => label), [
    'Brasaland Usaquén', 'Brasaland Chapinero', 'Brasaland Zona Rosa',
  ]);
  assert.deepEqual(getLocationsForCountryAndCity('CO', 'cali').map(({ label }) => label), [
    'Brasaland Granada', 'Brasaland Ciudad Jardín', 'Brasaland Unicentro',
  ]);
  assert.deepEqual(getLocationsForCountryAndCity('US', 'miami').map(({ label }) => label), [
    'Brasaland Brickell', 'Brasaland Coral Gables',
  ]);
  assert.deepEqual(getLocationsForCountryAndCity('US', 'orlando').map(({ label }) => label), [
    'Brasaland Downtown', 'Brasaland International Drive',
  ]);
  assert.equal([
    ...getLocationsForCountryAndCity('CO', 'medellin'),
    ...getLocationsForCountryAndCity('CO', 'bogota'),
    ...getLocationsForCountryAndCity('CO', 'cali'),
    ...getLocationsForCountryAndCity('US', 'miami'),
    ...getLocationsForCountryAndCity('US', 'orlando'),
  ].length, 14);
});

test('rejects a dial code or favorite location that does not match the selected country and city', () => {
  assert.equal(
    validateApplicationForm({ ...validApplication, phoneCode: '+57' }).phone,
    'Phone must include country code (example: +57 300 123 4567 or +1 305 123 4567)',
  );
  assert.match(validateApplicationForm({ ...validApplication, favoriteLocation: 'el-poblado' }).favoriteLocation, /chosen city/);
});

test('uses the required validation messages', () => {
  const errors = validateApplicationForm({ ...validApplication, name: 'Jordan', email: 'invalid', dob: '2008-10-06', terms: false }, new Date(2026, 9, 5));
  assert.equal(errors.name, 'Enter your full name (first and last name)');
  assert.equal(errors.email, 'Enter a valid email (example: name@email.com)');
  assert.equal(errors.dob, 'You must be 18 or older to register for Brasa Points');
  assert.equal(errors.terms, 'You must accept the Brasa Points program terms to continue');
  assert.equal(validateApplicationForm({ ...validApplication, country: '' }).country, 'Select your country');
  assert.equal(validateApplicationForm({ ...validApplication, city: '' }).city, 'Select your city');
  assert.equal(validateApplicationForm({ ...validApplication, howFound: '' }).howFound, 'Tell us how you found Brasaland');
});