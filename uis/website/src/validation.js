const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phonePattern = /^\+?[\d(). -]+$/;
const dialingCodes = { CO: '+57', US: '+1' };
const citiesByCountry = {
  CO: [
    { value: 'medellin', label: 'Medellín' },
    { value: 'other-colombia', label: 'Another city in Colombia' },
  ],
  US: [
    { value: 'miami', label: 'Miami' },
    { value: 'other-florida', label: 'Another city in Florida' },
  ],
};
const locationsByCity = {
  'CO:medellin': [
    { value: 'medellin-downtown', label: 'Medellín Downtown' },
    { value: 'other-medellin', label: 'Another Medellín location' },
  ],
  'CO:other-colombia': [{ value: 'other-colombia', label: 'Another Colombia location' }],
  'US:miami': [
    { value: 'miami', label: 'Miami location' },
    { value: 'other-florida', label: 'Another Florida location' },
  ],
  'US:other-florida': [{ value: 'other-florida', label: 'Another Florida location' }],
};
const referralSources = new Set(['friends-family', 'social-media', 'passing-by', 'online-search', 'other']);

export function getDialingCode(country) {
  return dialingCodes[country] || '';
}

export function getCitiesForCountry(country) {
  return citiesByCountry[country] || [];
}

export function getLocationsForCountryAndCity(country, city) {
  return locationsByCity[`${country}:${city}`] || [];
}

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

export function validateApplicationForm({
  name = '',
  email = '',
  phone = '',
  phoneCode = '',
  country = '',
  city = '',
  favoriteLocation = '',
  dob = '',
  howFound = '',
  terms = false,
} = {}, today = new Date()) {
  const errors = {};
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedPhone = phone.trim();

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

  if (!trimmedPhone) {
    errors.phone = 'Please enter your phone number.';
  } else {
    const digitCount = trimmedPhone.replace(/\D/g, '').length;
    if (!phonePattern.test(trimmedPhone) || digitCount < 7 || digitCount > 15) {
      errors.phone = 'Enter a phone number with 7 to 15 digits.';
    }
  }

  if (!getDialingCode(country)) {
    errors.country = 'Please choose a country.';
  }
  if (getDialingCode(country) && phoneCode !== getDialingCode(country)) {
    errors.phone = 'Choose a country to set the correct dialing code.';
  }

  const cities = getCitiesForCountry(country);
  if (!cities.some((option) => option.value === city)) errors.city = 'Please choose a city.';

  const locations = getLocationsForCountryAndCity(country, city);
  if (!locations.some((option) => option.value === favoriteLocation)) {
    errors.favoriteLocation = 'Please choose your favorite Brasaland location.';
  }

  if (!dob) {
    errors.dob = 'Please enter your date of birth.';
  } else if (!isAtLeast18(dob, today)) {
    errors.dob = 'You must be 18 or older to join Brasa Points.';
  }
  if (!referralSources.has(howFound)) errors.howFound = 'Please tell us how you heard about Brasaland.';
  if (terms !== true && terms !== 'on') errors.terms = 'Please accept the terms to continue.';

  return errors;
}