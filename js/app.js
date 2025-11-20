import { initAuth, loginWithEmail, loginWithGoogle, logout, registerWithEmail, resetPassword } from "./auth.js";
import { initTasks } from "./tasks.js";
import { initGoals } from "./goals.js";
import { initSchedule } from "./schedule.js";

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI to notify the user they can add to home screen
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.classList.remove('hidden');

        installBtn.addEventListener('click', (e) => {
            // Hide our user interface that shows our A2HS button
            installBtn.classList.add('hidden');
            // Show the prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the A2HS prompt');
                } else {
                    console.log('User dismissed the A2HS prompt');
                }
                deferredPrompt = null;
            });
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const landingView = document.getElementById("landing-view");
    const loginView = document.getElementById("login-view");
    const registerView = document.getElementById("register-view");
    const appView = document.getElementById("app-view");

    // Landing Buttons
    const startBtn = document.getElementById("start-btn");
    const loginLink = document.getElementById("login-link");

    // Login Form Elements
    const loginForm = document.getElementById("login-form");
    const googleLoginBtn = document.getElementById("google-login");
    const showRegisterLink = document.getElementById("show-register-link");
    const forgotPasswordLink = document.getElementById("forgot-password-link");
    const togglePasswordLogin = document.getElementById("toggle-password-login");

    // Register Form Elements
    const registerForm = document.getElementById("register-form");
    const showLoginLink = document.getElementById("show-login-link");
    const togglePasswordRegister = document.getElementById("toggle-password-register");

    // App Header
    const logoutBtn = document.getElementById("logout-btn");

    // Navigation
    function showView(view) {
        [landingView, loginView, registerView, appView].forEach(v => v.classList.add("hidden"));
        view.classList.remove("hidden");
    }

    // Event Listeners
    startBtn.addEventListener("click", () => showView(loginView));
    loginLink.addEventListener("click", (e) => {
        e.preventDefault();
        showView(loginView);
    });

    // Switch between Login and Register
    showRegisterLink.addEventListener("click", (e) => {
        e.preventDefault();
        showView(registerView);
    });

    showLoginLink.addEventListener("click", (e) => {
        e.preventDefault();
        showView(loginView);
    });

    // Password Toggles
    function togglePassword(inputName, btn) {
        const input = btn.parentElement.querySelector(`input[name="${inputName}"]`);
        if (input.type === "password") {
            input.type = "text";
            btn.textContent = "🙈";
        } else {
            input.type = "password";
            btn.textContent = "👁️";
        }
    }

    togglePasswordLogin.addEventListener("click", function () {
        togglePassword("password", this);
    });

    togglePasswordRegister.addEventListener("click", function () {
        togglePassword("password", this);
    });

    // Forgot Password
    forgotPasswordLink.addEventListener("click", async (e) => {
        e.preventDefault();
        const email = prompt("Ingresa tu correo electrónico para restablecer la contraseña:");
        if (email) {
            try {
                await resetPassword(email);
                alert("Se ha enviado un correo para restablecer tu contraseña.");
            } catch (err) {
                alert("Error: " + err.message);
            }
        }
    });

    // Login Submit
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        try {
            await loginWithEmail(email, password);
        } catch (err) {
            alert("Error: " + err.message);
        }
    });

    // Register Submit
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = registerForm.email.value;
        const password = registerForm.password.value;
        try {
            await registerWithEmail(email, password);
            // Auth state listener will handle redirection
        } catch (err) {
            alert("Error: " + err.message);
        }
    });

    googleLoginBtn.addEventListener("click", async () => {
        try {
            await loginWithGoogle();
        } catch (err) {
            alert("Error Google Login: " + err.message);
        }
    });

    logoutBtn.addEventListener("click", async () => {
        await logout();
    });

    // Tab Navigation in App
    // Tab Switching Logic
    const switchTab = (tabId) => {
        // Hide all contents
        document.querySelectorAll('.tab-content').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('animate-fade-in-up'); // Reset animation
        });

        // Deactivate all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('bg-white/20', 'shadow-md', 'text-white', 'border-white/20');
            btn.classList.add('text-gray-300', 'hover:bg-white/10');
        });

        // Show selected content with animation
        const content = document.getElementById(`tab-content-${tabId}`);
        if (content) {
            content.classList.remove('hidden');
            // Trigger reflow to restart animation
            void content.offsetWidth;
            content.classList.add('animate-fade-in-up');
        }

        // Activate button
        const btn = document.getElementById(`tab-${tabId}`);
        if (btn) {
            btn.classList.remove('text-gray-300', 'hover:bg-white/10');
            btn.classList.add('bg-white/20', 'shadow-md', 'text-white', 'border-white/20');
        }
    };

    const tabButtons = document.querySelectorAll(".tab-btn");
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    // Auth State Observer
    initAuth(
        (user) => {
            // User is logged in
            console.log("User logged in:", user.email);
            showView(appView);
            initTasks(user);
            initGoals(user);
            initSchedule(user);
            // Set initial tab to tasks if not already set
            if (!document.querySelector('.tab-btn.bg-white\\/20')) {
                switchTab('tasks');
            }
        },
        () => {
            // User is logged out
            console.log("User logged out");
            showView(landingView);
        }
    );
});
