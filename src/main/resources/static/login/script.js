document.addEventListener('DOMContentLoaded', function() {

    const urlParams = new URLSearchParams(window.location.search);
    const hasError = urlParams.has('error');
    const hasLogout = urlParams.has('logout');

    const errorBox = document.getElementById('msgError');
    const successBox = document.getElementById('msgSuccess');

    if (errorBox) errorBox.style.display = 'none';
    if (successBox) successBox.style.display = 'none';

    if (hasError && errorBox) {
        errorBox.style.display = 'flex';
    } else if (hasLogout && successBox) {
        successBox.style.display = 'flex';
    }

    if (hasError || hasLogout) {
        setTimeout(() => {
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 500);
    }

    const toggleBtn = document.querySelector('.toggle-password');
    const senhaInput = document.getElementById('senha');

    if (toggleBtn && senhaInput) {
        toggleBtn.addEventListener('click', function() {
            const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
            senhaInput.setAttribute('type', type);

            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    const loginForm = document.querySelector("form");
    if (loginForm) {
        loginForm.addEventListener("submit", () => {
            const emailInput = document.getElementById("email");
            if (emailInput && emailInput.value) {
                localStorage.setItem("userEmail", emailInput.value);
            }
        });
    }
});