/*
Program name: homework2.js
Author: Christopher Tobar
Date created: July 1, 2026
Date last edited: July 1, 2026
Version: 2.0
Description: External JavaScript for Homework 2 validation, review output, dynamic date, and dynamic slider.
*/

window.addEventListener('DOMContentLoaded', function () {
    displayCurrentDate();
    setDateLimits();
    populateStates();
    updatePainValue();
});

function displayCurrentDate() {
    const today = new Date();
    document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

function setDateLimits() {
    const dob = document.getElementById('dob');
    const today = new Date();
    const maxDate = today.toISOString().split('T')[0];
    const minDateObj = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
    dob.max = maxDate;
    dob.min = minDateObj.toISOString().split('T')[0];
}

function populateStates() {
    const states = [
        ['','-- Select State --'], ['AL','Alabama'], ['AK','Alaska'], ['AZ','Arizona'], ['AR','Arkansas'], ['CA','California'],
        ['CO','Colorado'], ['CT','Connecticut'], ['DE','Delaware'], ['DC','District of Columbia'], ['FL','Florida'], ['GA','Georgia'],
        ['HI','Hawaii'], ['ID','Idaho'], ['IL','Illinois'], ['IN','Indiana'], ['IA','Iowa'], ['KS','Kansas'], ['KY','Kentucky'],
        ['LA','Louisiana'], ['ME','Maine'], ['MD','Maryland'], ['MA','Massachusetts'], ['MI','Michigan'], ['MN','Minnesota'],
        ['MS','Mississippi'], ['MO','Missouri'], ['MT','Montana'], ['NE','Nebraska'], ['NV','Nevada'], ['NH','New Hampshire'],
        ['NJ','New Jersey'], ['NM','New Mexico'], ['NY','New York'], ['NC','North Carolina'], ['ND','North Dakota'], ['OH','Ohio'],
        ['OK','Oklahoma'], ['OR','Oregon'], ['PA','Pennsylvania'], ['PR','Puerto Rico'], ['RI','Rhode Island'], ['SC','South Carolina'],
        ['SD','South Dakota'], ['TN','Tennessee'], ['TX','Texas'], ['UT','Utah'], ['VT','Vermont'], ['VA','Virginia'],
        ['WA','Washington'], ['WV','West Virginia'], ['WI','Wisconsin'], ['WY','Wyoming']
    ];
    const stateSelect = document.getElementById('state');
    states.forEach(function (state) {
        const option = document.createElement('option');
        option.value = state[0];
        option.textContent = state[1];
        stateSelect.appendChild(option);
    });
}

function updatePainValue() {
    document.getElementById('painValue').textContent = document.getElementById('painScale').value;
}

function lowercaseUserId() {
    const userId = document.getElementById('userId');
    userId.value = userId.value.toLowerCase();
}

function displayZipTruncated() {
    const zip = document.getElementById('zip');
    const zipError = document.getElementById('zipError');
    if (/^\d{5}-\d{4}$/.test(zip.value)) {
        zipError.textContent = 'ZIP+4 entered. Review will display 5-digit ZIP: ' + zip.value.substring(0, 5);
    } else {
        zipError.textContent = '';
    }
}

function cleanTextarea() {
    const reasonVisit = document.getElementById('reasonVisit');
    reasonVisit.value = reasonVisit.value.replace(/</g, '').replace(/>/g, '').replace(/"/g, '');
}

function getRadioValue(name) {
    const checked = document.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : '';
}

function getCheckedValues(name) {
    return Array.from(document.querySelectorAll('input[name="' + name + '"]:checked')).map(function (item) {
        return item.value;
    });
}

function checkPasswordLive() {
    const message = validatePasswordRules();
    document.getElementById('passwordError').textContent = message;
    return message === '';
}

function validatePasswordRules() {
    const userId = document.getElementById('userId').value.toLowerCase();
    const firstName = document.getElementById('firstName').value.toLowerCase();
    const lastName = document.getElementById('lastName').value.toLowerCase();
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    const passwordLower = password.toLowerCase();

    document.getElementById('passwordConfirmError').textContent = '';

    if (password.length < 8 || password.length > 30) return 'Password must be 8 to 30 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must include a number.';
    if (!/[!@#$%^&*()_+\-=\[\]{};:\\|,.<>\/?`~]/.test(password)) return 'Password must include a special character.';
    if (/["']/.test(password)) return 'Password cannot include quotes.';
    if (userId && passwordLower.includes(userId)) return 'Password cannot contain the User ID.';
    if (firstName && passwordLower.includes(firstName)) return 'Password cannot contain the first name.';
    if (lastName && passwordLower.includes(lastName)) return 'Password cannot contain the last name.';
    if (passwordConfirm && password !== passwordConfirm) {
        document.getElementById('passwordConfirmError').textContent = 'Passwords do not match.';
        return '';
    }
    return '';
}

function validateDOB() {
    const dob = document.getElementById('dob');
    const dobError = document.getElementById('dobError');
    if (!dob.value) {
        dobError.textContent = 'Date of birth is required.';
        return false;
    }
    const entered = new Date(dob.value + 'T00:00:00');
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());

    if (entered > today) {
        dobError.textContent = 'Date of birth cannot be in the future.';
        return false;
    }
    if (entered < minDate) {
        dobError.textContent = 'Date of birth cannot be more than 120 years ago.';
        return false;
    }
    dobError.textContent = '';
    return true;
}

function validateForm() {
    lowercaseUserId();
    cleanTextarea();
    let isValid = true;
    const form = document.getElementById('patientForm');

    document.querySelectorAll('.error').forEach(function (errorSpan) {
        errorSpan.textContent = '';
    });

    if (!form.checkValidity()) {
        form.reportValidity();
        isValid = false;
    }

    if (!validateDOB()) isValid = false;

    const passwordMessage = validatePasswordRules();
    if (passwordMessage !== '') {
        document.getElementById('passwordError').textContent = passwordMessage;
        isValid = false;
    }

    if (document.getElementById('password').value !== document.getElementById('passwordConfirm').value) {
        document.getElementById('passwordConfirmError').textContent = 'Passwords do not match.';
        isValid = false;
    }

    if (!isValid) {
        reviewForm();
        alert('Please correct the highlighted errors before submitting.');
    }
    return isValid;
}

function reviewForm() {
    lowercaseUserId();
    cleanTextarea();
    const formIsValid = document.getElementById('patientForm').checkValidity() && validateDOB() && checkPasswordLive() && document.getElementById('password').value === document.getElementById('passwordConfirm').value;
    const symptoms = getCheckedValues('symptoms');
    const history = getCheckedValues('history');
    const zip = document.getElementById('zip').value;
    const zipReview = zip.includes('-') ? zip.substring(0, 5) + ' (truncated from ZIP+4)' : zip;

    const values = [
        ['Validation Status', formIsValid ? '<span class="pass">pass</span>' : '<span class="error">Review errors before submitting</span>'],
        ['User ID', escapeHTML(document.getElementById('userId').value)],
        ['Patient ID / SSN', '*********'],
        ['Password', 'Not displayed for privacy'],
        ['First, MI, Last Name', escapeHTML(document.getElementById('firstName').value + ' ' + document.getElementById('middleInitial').value + ' ' + document.getElementById('lastName').value)],
        ['Date of Birth', escapeHTML(document.getElementById('dob').value)],
        ['Gender at Birth', escapeHTML(getRadioValue('gender'))],
        ['Insurance', escapeHTML(getRadioValue('insurance'))],
        ['Vaccinated?', escapeHTML(getRadioValue('vaccinated'))],
        ['Race / Ethnicity', escapeHTML(document.getElementById('ethnicity').value)],
        ['Email address', escapeHTML(document.getElementById('email').value)],
        ['Phone number', escapeHTML(document.getElementById('phone').value)],
        ['Address', escapeHTML(document.getElementById('address1').value + ' ' + document.getElementById('address2').value + ', ' + document.getElementById('city').value + ', ' + document.getElementById('state').value + ' ' + zipReview)],
        ['Current Symptoms', symptoms.length ? escapeHTML(symptoms.join(', ')) : 'None selected'],
        ['Medical History', history.length ? escapeHTML(history.join(', ')) : 'None selected'],
        ['Pain Scale', escapeHTML(document.getElementById('painScale').value) + ' / 10'],
        ['Reason for Visit', escapeHTML(document.getElementById('reasonVisit').value || 'No comments entered')]
    ];

    let html = '<table class="review-table">';
    values.forEach(function (row) {
        html += '<tr><td class="review-label">' + row[0] + '</td><td>' + row[1] + '</td></tr>';
    });
    html += '</table>';

    document.getElementById('reviewOutput').innerHTML = html;
}

function escapeHTML(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function resetReview() {
    setTimeout(function () {
        document.getElementById('reviewOutput').textContent = 'Click the Review button after entering patient information.';
        document.querySelectorAll('.error').forEach(function (errorSpan) {
            errorSpan.textContent = '';
        });
        updatePainValue();
    }, 0);
}

/* End of homework2.js */
