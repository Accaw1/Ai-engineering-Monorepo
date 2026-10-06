import './styles.css';
import {
  getCitiesForCountry,
  getDialingCode,
  getLocationsForCountryAndCity,
  validateApplicationForm,
  validateContactForm,
} from './validation.js';

const form = document.querySelector('#contact-form');

if (form) {
  const fieldNames = ['name', 'email', 'phone', 'message'];
  const status = document.querySelector('#form-status');
  const fields = Object.fromEntries(fieldNames.map((name) => [name, form.elements.namedItem(name)]));
  let hasAttemptedSubmit = false;

  function setFieldState(name, error = '', showValid = false) {
    const field = fields[name];
    const errorElement = document.querySelector(`#${name}-error`);
    errorElement.textContent = error;
    field.setAttribute('aria-invalid', String(Boolean(error)));
    field.classList.toggle('border-red-700', Boolean(error));
    field.classList.toggle('ring-1', Boolean(error));
    field.classList.toggle('ring-red-700/30', Boolean(error));
    const isValid = showValid && !error && field.value.trim().length > 0;
    field.classList.toggle('border-olive', isValid);
    field.classList.toggle('bg-[#f4f7f1]', isValid);
  }

  function clearStatus() {
    status.textContent = '';
  }

  form.addEventListener('input', (event) => {
    const field = event.target;
    if (!field.name || !fieldNames.includes(field.name)) return;
    const errors = hasAttemptedSubmit
      ? validateContactForm(Object.fromEntries(fieldNames.map((name) => [name, fields[name].value])))
      : {};
    setFieldState(field.name, errors[field.name] || '', hasAttemptedSubmit);
    clearStatus();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    hasAttemptedSubmit = true;
    clearStatus();

    const values = Object.fromEntries(fieldNames.map((name) => [name, fields[name].value]));
    const errors = validateContactForm(values);
    fieldNames.forEach((name) => setFieldState(name, errors[name] || '', true));

    if (Object.keys(errors).length > 0) {
      const firstInvalidField = fieldNames.find((name) => errors[name]);
      fields[firstInvalidField].focus();
      status.textContent = 'Please correct the highlighted fields and try again.';
      status.classList.remove('text-olive');
      status.classList.add('text-red-800');
      return;
    }

    status.textContent = 'Thanks for reaching out. This preview does not send or store your message.';
    status.classList.remove('text-red-800');
    status.classList.add('text-olive');
    status.focus();
  });

  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      fieldNames.forEach((name) => {
        fields[name].classList.remove('border-red-700', 'ring-1', 'ring-red-700/30', 'border-olive', 'bg-[#f4f7f1]');
        fields[name].setAttribute('aria-invalid', 'false');
        document.querySelector(`#${name}-error`).textContent = '';
      });
      hasAttemptedSubmit = false;
      clearStatus();
      status.classList.remove('text-red-800');
      status.classList.add('text-olive');
    });
  });
}

const applicationForm = document.querySelector('#application-form');

if (applicationForm) {
  const fieldNames = ['name', 'email', 'country', 'city', 'favoriteLocation', 'phone', 'dob', 'howFound', 'terms'];
  const status = document.querySelector('#application-status');
  const phonePrefix = document.querySelector('#application-phone-prefix');
  const fields = Object.fromEntries(fieldNames.map((name) => [name, applicationForm.elements.namedItem(name)]));
  let hasAttemptedSubmit = false;

  function setFieldState(name, error = '', showValid = false) {
    const field = fields[name];
    const errorElement = document.querySelector(`#application-${name}-error`);
    errorElement.textContent = error;
    field.setAttribute('aria-invalid', String(Boolean(error)));
    field.classList.toggle('border-red-700', Boolean(error));
    field.classList.toggle('ring-1', Boolean(error));
    field.classList.toggle('ring-red-700/30', Boolean(error));
    const hasValue = name === 'terms' ? field.checked : field.value.trim().length > 0;
    const isValid = showValid && !error && hasValue;
    field.classList.toggle('border-olive', isValid);
    field.classList.toggle('bg-[#f4f7f1]', isValid);
  }

  function clearStatus() {
    status.textContent = '';
    status.classList.remove('text-red-800');
    status.classList.add('text-olive');
  }

  function getValues() {
    return {
      ...Object.fromEntries(fieldNames.map((name) => [name, name === 'terms' ? fields[name].checked : fields[name].value])),
      phoneCode: phonePrefix.textContent,
    };
  }

  function renderErrors(errors, showValid) {
    fieldNames.forEach((name) => setFieldState(name, errors[name] || '', showValid));
  }

  function updateField(event) {
    const field = event.target;
    if (!field.name || !fieldNames.includes(field.name)) return;

    if (field.name === 'country') {
      const country = fields.country.value;
      phonePrefix.textContent = getDialingCode(country) || '\u2014';
      setOptions(fields.city, 'Choose a city', getCitiesForCountry(country));
      setOptions(fields.favoriteLocation, 'Choose a city first', []);
    } else if (field.name === 'city') {
      setOptions(fields.favoriteLocation, 'Choose a favorite location', getLocationsForCountryAndCity(fields.country.value, fields.city.value));
    }

    const errors = hasAttemptedSubmit ? validateApplicationForm(getValues()) : {};
    renderErrors(errors, hasAttemptedSubmit);
    clearStatus();
  }

  function setOptions(select, placeholder, options) {
    select.replaceChildren(new Option(placeholder, ''));
    options.forEach(({ value, label }) => select.add(new Option(label, value)));
    select.disabled = options.length === 0;
  }

  applicationForm.addEventListener('input', updateField);
  applicationForm.addEventListener('change', updateField);

  applicationForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hasAttemptedSubmit = true;
    clearStatus();

    const values = getValues();
    const errors = validateApplicationForm(values);
    renderErrors(errors, true);

    if (Object.keys(errors).length > 0) {
      const firstInvalidField = fieldNames.find((name) => errors[name]);
      fields[firstInvalidField].focus();
      status.textContent = 'Please correct the highlighted fields and try again.';
      status.classList.remove('text-olive');
      status.classList.add('text-red-800');
      return;
    }

    const selectedLocation = fields.favoriteLocation.selectedOptions[0].textContent;
    status.textContent = `Welcome to Brasa Points, ${values.name.trim()}! Your application is complete. ${selectedLocation} is now your favorite Brasaland location, and updates would be sent to ${values.email}. This is a local preview; your information was not sent or saved.`;
    status.focus();
  });

  applicationForm.addEventListener('reset', () => {
    window.setTimeout(() => {
      fieldNames.forEach((name) => {
        fields[name].classList.remove('border-red-700', 'ring-1', 'ring-red-700/30', 'border-olive', 'bg-[#f4f7f1]');
        fields[name].setAttribute('aria-invalid', 'false');
        document.querySelector(`#application-${name}-error`).textContent = '';
      });
      phonePrefix.textContent = '\u2014';
      setOptions(fields.city, 'Choose a country first', []);
      setOptions(fields.favoriteLocation, 'Choose a city first', []);
      hasAttemptedSubmit = false;
      clearStatus();
    });
  });
}