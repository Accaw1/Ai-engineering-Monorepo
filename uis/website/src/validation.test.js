import assert from 'node:assert/strict';
import test from 'node:test';
import { validateContactForm } from './validation.js';

const validSubmission = {
  name: 'Jordan Lee',
  email: 'jordan@example.com',
  phone: '',
  message: 'I would like to learn more about Brasaland.',
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