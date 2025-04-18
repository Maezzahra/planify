// Fonctions d'affichage
function showLoginSection() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('logoutSection').style.display = 'none';
    hideError();
}

function showLogoutSection(user) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('logoutSection').style.display = 'block';
    document.getElementById('userEmail').textContent = user.email;
    hideError();
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
}

// Vérifier l'état de connexion au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (data.isAuthenticated) {
            showLogoutSection(data.user);
        } else {
            showLoginSection();
        }
    } catch (error) {
        console.error('Erreur:', error);
        showLoginSection();
    }
});

// Gestion du formulaire de connexion
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/connexion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = '/';
        } else {
            showError(data.error || 'Erreur de connexion');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Une erreur est survenue lors de la connexion');
    }
});

// Gestion du bouton de déconnexion
document.getElementById('logoutButton')?.addEventListener('click', () => {
    window.location.href = '/deconnexion';
}); 