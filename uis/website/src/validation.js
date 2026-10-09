const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phonePattern = /^\+?[\d(). -]+$/;
const localPhonePattern = /^[\d(). -]+$/;
const dialingCodes = { CO: '+57', US: '+1' };
const citiesByCountry = {
  CO: [
    { value: 'medellin', label: 'Medellín' },
    { value: 'bogota', label: 'Bogotá' },
    { value: 'cali', label: 'Cali' },
  ],
  US: [
    { value: 'miami', label: 'Miami' },
    { value: 'orlando', label: 'Orlando' },
  ],
};
const locationsByCity = {
  'CO:medellin': [
    { value: 'el-poblado', label: 'Brasaland El Poblado' },
    { value: 'laureles', label: 'Brasaland Laureles' },
    { value: 'envigado', label: 'Brasaland Envigado' },
    { value: 'sabaneta', label: 'Brasaland Sabaneta' },
  ],
  'CO:bogota': [
    { value: 'usaquen', label: 'Brasaland Usaquén' },
    { value: 'chapinero', label: 'Brasaland Chapinero' },
    { value: 'zona-rosa', label: 'Brasaland Zona Rosa' },
  ],
  'CO:cali': [
    { value: 'granada', label: 'Brasaland Granada' },
    { value: 'ciudad-jardin', label: 'Brasaland Ciudad Jardín' },
    { value: 'unicentro', label: 'Brasaland Unicentro' },
  ],
  'US:miami': [
    { value: 'brickell', label: 'Brasaland Brickell' },
    { value: 'coral-gables', label: 'Brasaland Coral Gables' },
  ],
  'US:orlando': [
    { value: 'downtown-orlando', label: 'Brasaland Downtown' },
    { value: 'international-drive', label: 'Brasaland International Drive' },
  ],
};
const referralSources = new Set(['social-media', 'recommendation', 'walked-by', 'internet-search', 'other']);

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

  if (trimmedName.split(/\s+/).filter(Boolean).length < 2 || trimmedName.length > 100) {
    errors.name = 'Enter your full name (first and last name)';
  }

  if (!trimmedEmail) {
    errors.email = 'Enter a valid email (example: name@email.com)';
  } else if (trimmedEmail.length > 254 || !emailPattern.test(trimmedEmail)) {
    errors.email = 'Enter a valid email (example: name@email.com)';
  }

  const localPhoneDigits = trimmedPhone.replace(/\D/g, '');
  const fullPhone = `${phoneCode} ${trimmedPhone}`.replace(/[(). -]/g, '');
  if (!getDialingCode(country) || phoneCode !== getDialingCode(country) || !localPhonePattern.test(trimmedPhone) || !fullPhone.startsWith(phoneCode) || localPhoneDigits.length < 7 || localPhoneDigits.length > 15) {
    errors.phone = 'Phone must include country code (example: +57 300 123 4567 or +1 305 123 4567)';
  }

  if (!getDialingCode(country)) errors.country = 'Select your country';

  const cities = getCitiesForCountry(country);
  if (!cities.some((option) => option.value === city)) errors.city = 'Select your city';

  const locations = getLocationsForCountryAndCity(country, city);
  if (favoriteLocation && !locations.some((option) => option.value === favoriteLocation)) {
    errors.favoriteLocation = 'Select a Brasaland location for your chosen city';
  }

  if (!dob) {
    errors.dob = 'You must be 18 or older to register for Brasa Points';
  } else if (!isAtLeast18(dob, today)) {
    errors.dob = 'You must be 18 or older to register for Brasa Points';
  }
  if (!referralSources.has(howFound)) errors.howFound = 'Tell us how you found Brasaland';
  if (terms !== true && terms !== 'on') errors.terms = 'You must accept the Brasa Points program terms to continue';

  return errors;
}