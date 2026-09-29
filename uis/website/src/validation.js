const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phonePattern = /^\+?[\d(). -]+$/;

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