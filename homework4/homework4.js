/*
Program name: homework4.js
Author: Christopher Tobar
Date created: July 11, 2026
Date last edited: July 11, 2026
Version: 4.0
Description: External JavaScript for combined Homework 3 and 4. Performs dynamic validation, full-form validation, review output, Fetch API loading, cookies, and localStorage persistence.
*/

'use strict';

const STORAGE_KEY = 'metropolitanMedicalPatientForm';
const COOKIE_NAME = 'metropolitanMedicalFirstName';
const COOKIE_HOURS = 48;
const SENSITIVE_FIELDS = new Set(['patientId', 'password', 'passwordConfirm']);

const validators = {
    userId: validateUserId,
    patientId: validatePatientId,
    password: validatePassword,
    passwordConfirm: validatePasswordConfirm,
    firstName: validateFirstName,
    middleInitial: validateMiddleInitial,
    lastName: validateLastName,
    dob: validateDOB,
    ethnicity: validateEthnicity,
    address1: validateAddress1,
    address2: validateAddress2,
    city: validateCity,
    state: validateState,
    zip: validateZip,
    phone: validatePhone,
    email: validateEmail,
    reasonVisit: validateReasonVisit
};

window.addEventListener('DOMContentLoaded', initializePage);

async function initializePage() {
    displayCurrentDate();
    setDOBLimits();
    wireEvents();
    await loadStateOptions();
    restoreReturningUser();
    updatePainValue();
    setStorageStatus('Local storage ready.');
}

function displayCurrentDate() {
    const now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

function setDOBLimits() {
    const dob = document.getElementById('dob');
    const today = new Date();
    const oldest = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
    dob.max = toISODate(today);
    dob.min = toISODate(oldest);
}

function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function loadStateOptions() {
    const stateSelect = document.getElementById('state');
    const status = document.getElementById('fetchStatus');
    try {
        const response = await fetch('state-options.html', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        stateSelect.innerHTML = await response.text();
        status.textContent = 'State list loaded successfully from an external file using Fetch API.';
        status.className = 'status-message success-message';
    } catch (error) {
        stateSelect.innerHTML = '<option value="">-- State list unavailable --</option>';
        status.textContent = `Unable to load state options with Fetch API: ${error.message}`;
        status.className = 'status-message error-message';
    }
}

function wireEvents() {
    Object.keys(validators).forEach((id) => {
        const field = document.getElementById(id);
        if (!field) return;
        const liveEvent = ['password', 'passwordConfirm', 'userId', 'patientId', 'firstName', 'middleInitial', 'lastName', 'zip', 'phone', 'email'].includes(id) ? 'input' : 'blur';
        field.addEventListener(liveEvent, () => {
            normalizeField(id);
            validators[id]();
            invalidateSubmit();
        });
        field.addEventListener('blur', () => {
            normalizeField(id);
            validators[id]();
            saveNonSensitiveFormData();
        });
    });

    ['gender', 'insurance', 'vaccinated'].forEach((name) => {
        document.querySelectorAll(`input[name="${name}"]`).forEach((field) => {
            field.addEventListener('change', () => {
                validateRadioGroup(name);
                saveNonSensitiveFormData();
                invalidateSubmit();
            });
        });
    });

    document.querySelectorAll('input[name="symptoms"], input[name="history"]').forEach((field) => {
        field.addEventListener('change', () => {
            saveNonSensitiveFormData();
            invalidateSubmit();
        });
    });

    document.getElementById('painScale').addEventListener('input', () => {
        updatePainValue();
        saveNonSensitiveFormData();
        invalidateSubmit();
    });

    document.getElementById('rememberMe').addEventListener('change', handleRememberMeChange);
    document.getElementById('startNewUser').addEventListener('change', startAsNewUser);
    document.getElementById('reviewButton').addEventListener('click', reviewForm);
    document.getElementById('validateButton').addEventListener('click', validateEntireForm);
    document.getElementById('resetButton').addEventListener('click', handleReset);
    document.getElementById('patientForm').addEventListener('submit', handleSubmit);
}

function normalizeField(id) {
    const field = document.getElementById(id);
    if (!field) return;
    if (id === 'userId') field.value = field.value.toLowerCase();
    if (id === 'email') field.value = field.value.trim().toLowerCase();
    if (id === 'middleInitial') field.value = field.value.toUpperCase();
    if (id === 'patientId') field.value = field.value.replace(/\D/g, '').slice(0, 9);
    if (id === 'zip') field.value = field.value.replace(/\D/g, '').slice(0, 5);
    if (id === 'phone') field.value = formatPhone(field.value);
    if (id === 'reasonVisit') field.value = field.value.replace(/[<>"]/g, '');
}

function formatPhone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function setMessage(id, message, valid = false) {
    const span = document.getElementById(`${id}Error`);
    if (!span) return;
    span.textContent = message;
    span.className = valid && message ? 'field-message valid-message' : 'field-message error-message';
}

function requiredText(id, label, min, max, regex, regexMessage) {
    const value = document.getElementById(id).value.trim();
    if (!value) return fail(id, `${label} is required.`);
    if (value.length < min || value.length > max) return fail(id, `${label} must be ${min} to ${max} characters.`);
    if (regex && !regex.test(value)) return fail(id, regexMessage);
    return pass(id);
}

function optionalText(id, label, min, max, regex, regexMessage) {
    const value = document.getElementById(id).value.trim();
    if (!value) return pass(id);
    if (value.length < min || value.length > max) return fail(id, `${label} must be ${min} to ${max} characters when entered.`);
    if (regex && !regex.test(value)) return fail(id, regexMessage);
    return pass(id);
}

function fail(id, message) {
    setMessage(id, message, false);
    return false;
}

function pass(id, message = '') {
    setMessage(id, message, true);
    return true;
}

function validateUserId() {
    const value = document.getElementById('userId').value;
    if (!value) return fail('userId', 'User ID is required.');
    if (value.length < 5 || value.length > 20) return fail('userId', 'User ID must be 5 to 20 characters.');
    if (/^\d/.test(value)) return fail('userId', 'User ID cannot start with a number.');
    if (!/^[A-Za-z][A-Za-z0-9_-]{4,19}$/.test(value)) return fail('userId', 'Use only letters, numbers, dash, or underscore. No spaces.');
    validatePassword();
    return pass('userId');
}

function validatePatientId() {
    const value = document.getElementById('patientId').value;
    if (!/^\d{9}$/.test(value)) return fail('patientId', 'Patient ID must contain exactly 9 digits.');
    return pass('patientId');
}

function validatePassword() {
    const password = document.getElementById('password').value;
    const userId = document.getElementById('userId').value.toLowerCase();
    const first = document.getElementById('firstName').value.toLowerCase();
    const last = document.getElementById('lastName').value.toLowerCase();
    const lower = password.toLowerCase();
    if (!password) return fail('password', 'Password is required.');
    if (password.length < 8 || password.length > 30) return fail('password', 'Password must be 8 to 30 characters.');
    if (!/[A-Z]/.test(password)) return fail('password', 'Add at least one uppercase letter.');
    if (!/[a-z]/.test(password)) return fail('password', 'Add at least one lowercase letter.');
    if (!/\d/.test(password)) return fail('password', 'Add at least one number.');
    if (!/[!@#$%^&*()_+\-=\[\]{};:\\|,.<>/?`~]/.test(password)) return fail('password', 'Add at least one special character.');
    if (/["']/.test(password)) return fail('password', 'Quotes are not allowed in the password.');
    if (userId && lower.includes(userId)) return fail('password', 'Password cannot contain your User ID.');
    if (first && lower.includes(first)) return fail('password', 'Password cannot contain your first name.');
    if (last && lower.includes(last)) return fail('password', 'Password cannot contain your last name.');
    validatePasswordConfirm();
    return pass('password');
}

function validatePasswordConfirm() {
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('passwordConfirm').value;
    if (!confirm) return fail('passwordConfirm', 'Please re-enter your password.');
    if (password !== confirm) return fail('passwordConfirm', 'Passwords do not match.');
    return pass('passwordConfirm');
}

function validateFirstName() {
    const result = requiredText('firstName', 'First name', 1, 30, /^[A-Za-z'-]+$/, 'Use letters, apostrophes, and dashes only.');
    if (result) validatePassword();
    return result;
}

function validateMiddleInitial() {
    return optionalText('middleInitial', 'Middle initial', 1, 1, /^[A-Za-z]$/, 'Middle initial must be one letter.');
}

function validateLastName() {
    const result = requiredText('lastName', 'Last name', 1, 30, /^[A-Za-z'-]+$/, 'Use letters, apostrophes, and dashes only.');
    if (result) validatePassword();
    return result;
}

function validateDOB() {
    const value = document.getElementById('dob').value;
    if (!value) return fail('dob', 'Date of birth is required.');
    const entered = new Date(`${value}T00:00:00`);
    const today = new Date();
    const oldest = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
    if (Number.isNaN(entered.getTime())) return fail('dob', 'Enter a valid date.');
    if (entered > today) return fail('dob', 'Date of birth cannot be in the future.');
    if (entered < oldest) return fail('dob', 'Date of birth cannot be more than 120 years ago.');
    return pass('dob');
}

function validateEthnicity() {
    return document.getElementById('ethnicity').value ? pass('ethnicity') : fail('ethnicity', 'Please choose an option.');
}

function validateAddress1() {
    return requiredText('address1', 'Address Line 1', 2, 30, null, '');
}

function validateAddress2() {
    return optionalText('address2', 'Address Line 2', 2, 30, null, '');
}

function validateCity() {
    return requiredText('city', 'City', 2, 30, /^[A-Za-z .'-]+$/, 'City may contain letters, spaces, periods, apostrophes, and dashes only.');
}

function validateState() {
    return document.getElementById('state').value ? pass('state') : fail('state', 'Please select a state, DC, or PR.');
}

function validateZip() {
    return /^\d{5}$/.test(document.getElementById('zip').value) ? pass('zip') : fail('zip', 'ZIP Code must contain exactly 5 digits.');
}

function validatePhone() {
    return /^\d{3}-\d{3}-\d{4}$/.test(document.getElementById('phone').value) ? pass('phone') : fail('phone', 'Use 000-000-0000 format.');
}

function validateEmail() {
    const value = document.getElementById('email').value;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? pass('email') : fail('email', 'Enter a valid email in name@domain.tld format.');
}

function validateReasonVisit() {
    const field = document.getElementById('reasonVisit');
    const original = field.value;
    const cleaned = original.replace(/[<>"]/g, '');
    if (cleaned !== original) {
        field.value = cleaned;
        return fail('reasonVisit', 'HTML angle brackets and double quotes were removed. Review the corrected text.');
    }
    return pass('reasonVisit');
}

function validateRadioGroup(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    if (!selected) return fail(name, 'Please select one option.');
    return pass(name);
}

function validateEntireForm() {
    let valid = true;
    Object.keys(validators).forEach((id) => {
        normalizeField(id);
        if (!validators[id]()) valid = false;
    });
    ['gender', 'insurance', 'vaccinated'].forEach((name) => {
        if (!validateRadioGroup(name)) valid = false;
    });

    const submitButton = document.getElementById('submitButton');
    if (valid) {
        submitButton.hidden = false;
        document.getElementById('validateButton').textContent = 'Validated - Ready to Submit';
        document.getElementById('validateButton').classList.add('validated-button');
        reviewForm();
        saveRememberedUser();
        alert('All fields passed JavaScript validation. The Submit button is now available.');
    } else {
        invalidateSubmit();
        reviewForm();
        const firstError = document.querySelector('.field-message.error-message:not(:empty)');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        alert('Please correct the visible errors. The Submit button will remain hidden until validation passes.');
    }
    return valid;
}

function invalidateSubmit() {
    const submitButton = document.getElementById('submitButton');
    submitButton.hidden = true;
    const validateButton = document.getElementById('validateButton');
    validateButton.textContent = 'Validate Form';
    validateButton.classList.remove('validated-button');
}

function handleSubmit(event) {
    if (!validateEntireForm()) {
        event.preventDefault();
        return;
    }
    saveRememberedUser();
}

function reviewForm() {
    const symptoms = getCheckedValues('symptoms');
    const history = getCheckedValues('history');
    const rows = [
        ['User ID', getValue('userId') || '(blank)'],
        ['Patient ID', getValue('patientId') ? '********* (hidden)' : '(blank)'],
        ['Password', 'Not displayed for privacy'],
        ['Name', [getValue('firstName'), getValue('middleInitial'), getValue('lastName')].filter(Boolean).join(' ') || '(blank)'],
        ['Date of Birth', getValue('dob') || '(blank)'],
        ['Gender at Birth', getRadioValue('gender') || '(not selected)'],
        ['Insurance', getRadioValue('insurance') || '(not selected)'],
        ['Vaccinated', getRadioValue('vaccinated') || '(not selected)'],
        ['Race / Ethnicity', getValue('ethnicity') || '(not selected)'],
        ['Email', getValue('email') || '(blank)'],
        ['Phone', getValue('phone') || '(blank)'],
        ['Address', `${getValue('address1')} ${getValue('address2')}, ${getValue('city')}, ${getValue('state')} ${getValue('zip')}`.trim()],
        ['Current Symptoms', symptoms.length ? symptoms.join(', ') : 'None selected'],
        ['Medical History', history.length ? history.join(', ') : 'None selected'],
        ['Pain Level', `${getValue('painScale')} / 10`],
        ['Reason for Visit', getValue('reasonVisit') || 'No comments entered'],
        ['Remember Me', document.getElementById('rememberMe').checked ? 'Yes' : 'No']
    ];

    const table = document.createElement('table');
    table.className = 'review-table';
    rows.forEach(([label, value]) => {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        const td = document.createElement('td');
        th.textContent = label;
        td.textContent = value;
        tr.append(th, td);
        table.appendChild(tr);
    });
    const output = document.getElementById('reviewOutput');
    output.replaceChildren(table);
}

function getValue(id) {
    return document.getElementById(id).value.trim();
}

function getRadioValue(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
}

function getCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((item) => item.value);
}

function updatePainValue() {
    document.getElementById('painValue').textContent = document.getElementById('painScale').value;
}

function getCookie(name) {
    const prefix = `${encodeURIComponent(name)}=`;
    const item = document.cookie.split('; ').find((row) => row.startsWith(prefix));
    return item ? decodeURIComponent(item.substring(prefix.length)) : '';
}

function setCookie(name, value, hours) {
    const expires = new Date(Date.now() + hours * 60 * 60 * 1000).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name) {
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function saveRememberedUser() {
    if (!document.getElementById('rememberMe').checked) {
        clearRememberedData();
        return;
    }
    const firstName = getValue('firstName');
    if (firstName) setCookie(COOKIE_NAME, firstName, COOKIE_HOURS);
    saveNonSensitiveFormData();
    updateWelcome(firstName);
}

function saveNonSensitiveFormData() {
    if (!document.getElementById('rememberMe').checked) return;
    const form = document.getElementById('patientForm');
    const data = {};
    Array.from(form.elements).forEach((element) => {
        if (!element.name || SENSITIVE_FIELDS.has(element.name) || element.name === 'rememberMe') return;
        if (element.type === 'radio') {
            if (element.checked) data[element.name] = element.value;
        } else if (element.type === 'checkbox') {
            if (!Array.isArray(data[element.name])) data[element.name] = [];
            if (element.checked) data[element.name].push(element.value);
        } else if (!['submit', 'reset', 'button', 'password'].includes(element.type)) {
            data[element.name] = element.value;
        }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setStorageStatus('Non-sensitive form data saved locally.');
}

function restoreReturningUser() {
    const firstName = getCookie(COOKIE_NAME);
    if (!firstName) {
        updateWelcome('');
        return;
    }
    updateWelcome(firstName);
    document.getElementById('firstName').value = firstName;
    document.getElementById('newUserControl').hidden = false;
    document.getElementById('newUserText').textContent = `Not ${firstName}? Click here to start as a NEW USER.`;
    restoreLocalStorage();
}

function restoreLocalStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        Object.entries(data).forEach(([name, value]) => {
            const elements = document.querySelectorAll(`[name="${CSS.escape(name)}"]`);
            if (!elements.length) return;
            if (elements[0].type === 'radio') {
                elements.forEach((el) => { el.checked = el.value === value; });
            } else if (elements[0].type === 'checkbox') {
                const selected = Array.isArray(value) ? value : [];
                elements.forEach((el) => { el.checked = selected.includes(el.value); });
            } else if (!SENSITIVE_FIELDS.has(name)) {
                elements[0].value = value;
            }
        });
        updatePainValue();
        setStorageStatus('Returning user data restored from localStorage.');
    } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        setStorageStatus('Stored data was invalid and has been cleared.');
    }
}

function updateWelcome(firstName) {
    document.getElementById('welcomeMessage').textContent = firstName ? `Welcome back, ${firstName}!` : 'Welcome, new user.';
}

function handleRememberMeChange() {
    if (document.getElementById('rememberMe').checked) {
        document.getElementById('rememberMeMessage').textContent = 'Your first name and non-sensitive form data will be remembered on this browser.';
        document.getElementById('rememberMeMessage').className = 'field-message valid-message';
        saveRememberedUser();
    } else {
        clearRememberedData();
        document.getElementById('rememberMeMessage').textContent = 'Remember Me is off. Cookie and localStorage data were deleted.';
        document.getElementById('rememberMeMessage').className = 'field-message';
    }
}

function startAsNewUser() {
    if (!document.getElementById('startNewUser').checked) return;
    clearRememberedData();
    document.getElementById('patientForm').reset();
    document.getElementById('rememberMe').checked = true;
    document.getElementById('newUserControl').hidden = true;
    document.getElementById('startNewUser').checked = false;
    clearMessages();
    updateWelcome('');
    updatePainValue();
    invalidateSubmit();
    document.getElementById('reviewOutput').textContent = 'New user session started. Enter new patient information.';
    setStorageStatus('Previous user cookie and localStorage data cleared.');
}

function clearRememberedData() {
    deleteCookie(COOKIE_NAME);
    localStorage.removeItem(STORAGE_KEY);
    updateWelcome('');
    document.getElementById('newUserControl').hidden = true;
    setStorageStatus('Remembered browser data cleared.');
}

function handleReset() {
    window.setTimeout(() => {
        clearMessages();
        updatePainValue();
        invalidateSubmit();
        document.getElementById('reviewOutput').textContent = 'The form was cleared. Click Review / Get Data after entering information.';
        if (document.getElementById('rememberMe').checked) saveNonSensitiveFormData();
    }, 0);
}

function clearMessages() {
    document.querySelectorAll('.field-message').forEach((span) => {
        if (span.id !== 'rememberMeMessage') {
            span.textContent = '';
            span.className = 'field-message';
        }
    });
}

function setStorageStatus(message) {
    document.getElementById('storageStatus').textContent = message;
}

/* End of homework4.js */
