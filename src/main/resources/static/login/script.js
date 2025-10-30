document.addEventListener('DOMContentLoaded', function() {

    // Exibe mensagem de erro se login falhar
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'true') {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = 'Email ou senha incorretos!';
    }

    // Toggle de senha (caso exista botão .toggle-password)
    const toggleBtn = document.querySelector('.toggle-password');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const senhaInput = document.getElementById('senha');
            const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
            senhaInput.setAttribute('type', type);
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
