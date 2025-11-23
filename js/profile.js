import { logout } from "./auth.js";
import { showToast } from "./notifications.js";

export function initProfile(user) {
    const profileName = document.getElementById("profile-name");
    const profileEmail = document.getElementById("profile-email");
    const profileAvatar = document.getElementById("profile-avatar");
    const logoutBtnProfile = document.getElementById("logout-btn-profile");
    const themeBtns = document.querySelectorAll(".theme-btn");

    // Render User Info
    if (user) {
        profileName.textContent = user.displayName || "Usuario";
        profileEmail.textContent = user.email || "";

        if (user.photoURL) {
            profileAvatar.src = user.photoURL;
            profileAvatar.classList.remove("hidden");
            document.getElementById("profile-avatar-placeholder").classList.add("hidden");
        } else {
            profileAvatar.classList.add("hidden");
            document.getElementById("profile-avatar-placeholder").classList.remove("hidden");
        }
    }

    // Logout Logic
    if (logoutBtnProfile) {
        logoutBtnProfile.onclick = async () => {
            try {
                await logout();
            } catch (error) {
                console.error("Error al cerrar sesión:", error);
                showToast("Error al cerrar sesión", "error");
            }
        };
    }

    // Theme Logic
    const savedTheme = localStorage.getItem("theme") || "default";
    applyTheme(savedTheme);

    themeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const theme = btn.dataset.theme;
            applyTheme(theme);
            localStorage.setItem("theme", theme);
        });
    });
}

function applyTheme(theme) {
    const body = document.body;

    // Remove all theme classes
    body.classList.remove(
        "theme-default",
        "theme-pink",
        "theme-green",
        "theme-blue",
        "theme-sunset",
        "theme-lavender",
        "theme-mint",
        "theme-sky",
        "theme-midnight",
        "theme-cherry",
        "theme-amber",
        "theme-emerald",
        "theme-slate"
    );

    // Add selected theme class
    if (theme !== "default") {
        body.classList.add(`theme-${theme}`);
    }

    // Update active state on buttons (optional visual feedback)
    document.querySelectorAll(".theme-btn").forEach(btn => {
        if (btn.dataset.theme === theme) {
            btn.classList.add("ring-2", "ring-white", "scale-110");
        } else {
            btn.classList.remove("ring-2", "ring-white", "scale-110");
        }
    });
}
