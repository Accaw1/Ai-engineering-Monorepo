const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phonePattern = /^\+?[\d(). -]+$/;
const signupCountries = new Set(['CO', 'US']);
const signupLocations = new Set(['medellin', 'florida', 'other']);

function isAtLeast18(dateValue, today = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) return false;

  const [, year, month, day] = match.map(Number);
  const birthDate = new Date(year, month - 1, day);
  if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) return false;
  if (birthDate > today) return false;

  let age = today.getFullYear() - year;
  if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) age -= 1;
  return age >= 18;
}

export function validateContactForm({ name = '', email = '', phone = '', message = '' }) {
  const errors = {};
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedPhone = phone.trim();
  const trimmedMessage = message.trim();

  if (!trimmedName) {
    errors.name = 'Please enter your name.';
  } else if (trimmedName.length < 2) {
    errors.name = 'Your name must contain at least 2 characters.';
  } else if (trimmedName.length > 100) {
    errors.name = 'Your name must be 100 characters or fewer.';
  }

  if (!trimmedEmail) {
    errors.email = 'Please enter your email address.';
  } else if (trimmedEmail.length > 254 || !emailPattern.test(trimmedEmail)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (trimmedPhone) {
    const digitCount = trimmedPhone.replace(/\D/g, '').length;
    if (!phonePattern.test(trimmedPhone) || digitCount < 7 || digitCount > 15) {
      errors.phone = 'Enter a phone number with 7 to 15 digits; spaces, +, hyphens, parentheses, and periods are allowed.';
    }
  }

  if (!trimmedMessage) {
    errors.message = 'Please enter a message.';
  } else if (trimmedMessage.length < 10) {
    errors.message = 'Your message must contain at least 10 characters.';
  } else if (trimmedMessage.length > 1000) {
    errors.message = 'Your message must be 1,000 characters or fewer.';
  }

  return errors;
}

export function validateLoyaltySignup({ name = '', email = '', country = '', location = '', dob = '', terms = false } = {}, today = new Date()) {
  const errors = {};
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  if (!trimmedName) {
    errors.name = 'Please enter your name.';
  } else if (trimmedName.length < 2) {
    errors.name = 'Your name must contain at least 2 characters.';
  } else if (trimmedName.length > 100) {
    errors.name = 'Your name must be 100 characters or fewer.';
  }

  if (!trimmedEmail) {
    errors.email = 'Please enter your email address.';
  } else if (trimmedEmail.length > 254 || !emailPattern.test(trimmedEmail)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!signupCountries.has(country)) {
    errors.country = 'Please choose a country.';
  } else if (!signupLocations.has(location)) {
    errors.location = 'Please choose a location.';
  } else if (country === 'CO' && location === 'florida') {
    errors.location = 'Choose a location in Colombia.';
  } else if (country === 'US' && location === 'medellin') {
    errors.location = 'Choose a location in the United States.';
  }
  if (!dob) {
    errors.dob = 'Please enter your date of birth.';
  } else if (!isAtLeast18(dob, today)) {
    errors.dob = 'You must be 18 or older to join Brasa Points.';
  }
  if (terms !== true && terms !== 'on') errors.terms = 'Please accept the terms to continue.';

  return errors;
}