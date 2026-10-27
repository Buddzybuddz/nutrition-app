function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* Toggle visibilité mot de passe */
function togglePasswordVisibility(inputId, btn) {
    var input = document.getElementById(inputId);
    var eyeOn = btn.querySelector('.eye-icon');
    var eyeOff = btn.querySelector('.eye-off-icon');
    if (input.type === 'password') {
        input.type = 'text';
        eyeOn.classList.add('hidden');
        eyeOff.classList.remove('hidden');
        btn.setAttribute('aria-label', 'Masquer le mot de passe');
    } else {
        input.type = 'password';
        eyeOn.classList.remove('hidden');
        eyeOff.classList.add('hidden');
        btn.setAttribute('aria-label', 'Afficher le mot de passe');
    }
}

/* Activation bouton inscription selon checkbox RGPD */
document.addEventListener('DOMContentLoaded', function() {
    var rgpdCheckbox = document.getElementById('rgpd-consent');
    var signupBtn = document.getElementById('signup-submit-btn');
    if (rgpdCheckbox && signupBtn) {
        function updateSignupBtn() {
            if (rgpdCheckbox.checked) {
                signupBtn.disabled = false;
                signupBtn.classList.remove('btn-disabled');
            } else {
                signupBtn.disabled = true;
                signupBtn.classList.add('btn-disabled');
            }
        }
        rgpdCheckbox.addEventListener('change', updateSignupBtn);
        updateSignupBtn();
    }
});
