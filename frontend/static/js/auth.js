// Modern alert system
const showAlert = (message, type = 'error') => {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type}`;
    alertContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        background: ${type === 'error' ? 'var(--error-bg)' : 'var(--success-bg)'};
        color: ${type === 'error' ? 'var(--error-color)' : 'var(--success-color)'};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    alertContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(alertContainer);

    setTimeout(() => {
        alertContainer.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => alertContainer.remove(), 300);
    }, 3000);
};

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    showAlert('Login successful!', 'success');
                    setTimeout(() => window.location.href = '/', 1000);
                } else {
                    showAlert(data.error || 'Login failed');
                }
            } catch (error) {
                showAlert('An error occurred. Please try again.');
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                showAlert('Passwords do not match');
                return;
            }

            try {
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    showAlert('Account created successfully!', 'success');
                    setTimeout(() => window.location.href = '/', 1000);
                } else {
                    showAlert(data.error || 'Signup failed');
                }
            } catch (error) {
                showAlert('An error occurred. Please try again.');
            }
        });
    }
});