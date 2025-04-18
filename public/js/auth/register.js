function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideMessages() {
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideMessages();
            
            const nom = document.getElementById('nom').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/inscription', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nom, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    showSuccess("Inscription réussie ! ");
                    // Désactiver le formulaire
                    registerForm.querySelectorAll('input, button').forEach(element => {
                        element.disabled = true;
                    });
                    // Rediriger après 2 secondes
                    setTimeout(() => {
                        window.location.href = '/connexion';
                    }, 2000);
                } else {
                    showError(data.error || 'Erreur lors de l\'inscription');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showError('Une erreur est survenue lors de l\'inscription');
            }
        });
    }
}); 