document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.input-group input');
    inputs.forEach(input => {
        input.setAttribute('placeholder', ' ');
    });
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('username');
        const username = usernameInput.value;
        if (username) {
            let logins = [];
            try {
                const stored = localStorage.getItem('login');
                if (stored) {
                    logins = JSON.parse(stored);
                }
            } catch (err) {
                console.error("Error parsing login data", err);
                logins = [];
            }
            if (!Array.isArray(logins)) {
                logins = [];
            }

            // Check if user exists
            // Check if user exists
            const exists = logins.some(u => u.usuario === username);

            if (!exists) {
                const create = confirm("El usuario no existe. ¿Desea crearlo?");
                if (create) {
                    logins.push({ "usuario": username });
                    localStorage.setItem('login', JSON.stringify(logins));
                    alert("Usuario creado correctamente. Por favor, inicie sesión nuevamente.");
                    usernameInput.value = '';
                    return;
                } else {
                    return;
                }
            }

            // Save current session user logic moved to after TFA

            // --- TFA Logic ---
            const tfaModal = document.getElementById('tfaModal');
            const cancelTfaBtn = document.getElementById('cancelTfaBtn');
            let tfaInterval;

            // 1. Initialize TFA
            localStorage.setItem('tfa', 'false');

            // 2. Show Modal
            tfaModal.classList.add('open');

            // 3. Start Polling
            tfaInterval = setInterval(() => {
                const tfaStatus = localStorage.getItem('tfa');
                if (tfaStatus === 'true') {
                    // Approved!
                    clearInterval(tfaInterval);

                    // Finalize Login
                    localStorage.setItem('currentUser', username);
                    localStorage.removeItem('tfa'); // Clean up

                    window.location.href = 'pasos/pasos.html';
                }
            }, 1000);

            // 4. Cancel Handler
            cancelTfaBtn.onclick = () => {
                clearInterval(tfaInterval);
                tfaModal.classList.remove('open');
                localStorage.removeItem('tfa');
            };
        }
    });
    const themeToggleBtn = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');

            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }
});