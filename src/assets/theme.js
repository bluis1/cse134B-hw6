const themeToggle = document.querySelector("#theme-toggle");

function applyTheme(theme) {
    document.body.classList.toggle("light-theme", theme === "light");
    themeToggle.textContent = theme === "light" ? "Use dark theme" : "Use light theme";
    themeToggle.setAttribute("aria-label", themeToggle.textContent);
}

function readTheme() {
    try {
        return localStorage.getItem("portfolio-theme") === "light" ? "light" : "dark";
    } catch {
        return "dark";
    }
}

function saveTheme(theme) {
    try {
        localStorage.setItem("portfolio-theme", theme);
    } catch {
        // The theme control still works when browser storage is unavailable.
    }
}

themeToggle.hidden = false;
applyTheme(readTheme());
themeToggle.addEventListener("click", () => {
    const theme = document.body.classList.contains("light-theme") ? "dark" : "light";
    applyTheme(theme);
    saveTheme(theme);
});
