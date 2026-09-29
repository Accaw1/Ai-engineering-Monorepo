import './styles.css';
import { validateContactForm } from './validation.js';

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