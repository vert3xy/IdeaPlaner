document.addEventListener('DOMContentLoaded', () => {
    const signUpButton = document.getElementById('signUpBtn');
    const signInButton = document.getElementById('signInBtn');
    const container = document.getElementById('authContainer');
    const regPasswordInput = document.getElementById('reg_password');
    const reqBox = document.getElementById('passwordRequirements');
    const reqItems = {
        length: document.getElementById('req_length'),
        upper: document.getElementById('req_upper'),
        digit: document.getElementById('req_digit'),
        special: document.getElementById('req_special')
    };

    const errorTranslations = {
        "Incorrect username or password": "Неверный логин или пароль",
        "User already exists": "Пользователь с таким именем уже есть",
        "Username already registered": "Пользователь с таким логином уже есть в системе",
        "Could not validate credentials": "Ошибка авторизации",
        "Inactive user": "Аккаунт деактивирован",
        "Internal Server Error": "Ошибка на стороне сервера"
    };
    
    // Функция для показа ошибки
    const showError = (elementId, rawMessage) => {
        const errorDiv = document.getElementById(elementId);
        if (errorDiv) {
            // Переводим, если фраза есть в словаре, иначе выводим как есть (или дефолт)
            errorDiv.textContent = errorTranslations[rawMessage] || rawMessage || "Произошла ошибка";
            errorDiv.classList.remove('hidden');
            
            // Сбрасываем стили на "красный" (после возможного успеха регистрации)
            errorDiv.style.backgroundColor = '#fff1f2';
            errorDiv.style.color = '#e11d48';
        }
    };

    // Очистка всех ошибок
    const clearErrors = () => {
        document.querySelectorAll('.auth-error-message').forEach(el => {
            el.classList.add('hidden');
            el.textContent = '';
        });
    };

    const validatePassword = (password) => {
        const checks = {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            digit: /[0-9]/.test(password),
            special: /[!@#$%^&*?_()|/]/.test(password)
        };

        // Визуально подсвечиваем выполненные пункты
        reqItems.length.classList.toggle('met', checks.length);
        reqItems.upper.classList.toggle('met', checks.upper);
        reqItems.digit.classList.toggle('met', checks.digit);
        reqItems.special.classList.toggle('met', checks.special);

        // Возвращаем true, если все условия выполнены
        return Object.values(checks).every(val => val === true);
    };

    // --- 3. СЛУШАТЕЛИ ДЛЯ ПОЛЯ ПАРОЛЯ ---
    regPasswordInput?.addEventListener('focus', () => {
        reqBox?.classList.remove('hidden');
    });

    regPasswordInput?.addEventListener('blur', () => {
        if (validatePassword(regPasswordInput.value)) {
            reqBox.classList.add('hidden');
        }
    });


    regPasswordInput?.addEventListener('input', (e) => {
        const isStrong = validatePassword(e.target.value);
        if (isStrong) {
            setTimeout(() => reqBox.classList.add('hidden'), 1000);
        } else {
            reqBox.classList.remove('hidden');
        }
    });



    if (signUpButton && signInButton && container) {
        signUpButton.addEventListener('click', () => {
            clearErrors();
            container.classList.add("active");
        });
        signInButton.addEventListener('click', () => {
            clearErrors();
            container.classList.remove("active");
        });
    }

    // ЛОГИН
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearErrors();
            
            const formData = new FormData();
            formData.append('username', document.getElementById('username').value);
            formData.append('password', document.getElementById('password').value);

            try {
                const response = await fetch('/login', { method: 'POST', body: formData });
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('token', data.access_token);
                    window.location.href = '/dashboard';
                } else {
                    const err = await response.json();
                    showError('loginError', err.detail || 'Неверный логин или пароль');
                }
            } catch (error) {
                showError('loginError', 'Проблема с подключением к серверу');
            }
        });
    }

    // РЕГИСТРАЦИЯ
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearErrors();

            const passwordValue = regPasswordInput.value;

            if (!validatePassword(passwordValue)) {
                showError('regError', 'Пароль не соответствует требованиям безопасности');
                return; 
            }

            const payload = {
                username: document.getElementById('reg_username').value,
                email: document.getElementById('reg_email').value,
                password: passwordValue
            };

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    container.classList.remove("active");
                    const loginErrDiv = document.getElementById('loginError');
                    showError('loginError', 'Аккаунт создан! Теперь войдите.');
                    loginErrDiv.style.backgroundColor = '#f0fdf4';
                    loginErrDiv.style.color = '#16a34a';
                    reqBox?.classList.add('hidden'); // Прячем список требований
                    registerForm.reset(); // Очищаем форму
                } else {
                    const err = await response.json();
                    showError('regError', err.detail);
                }
            } catch (error) {
                showError('regError', 'Сервер не отвечает');
            }
        });
    }
});