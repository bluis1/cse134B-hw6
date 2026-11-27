(() => {
    const panel = document.querySelector("#portfolio-repo");
    const control = document.querySelector("#repo-mode-toggle");
    if (!panel || !control || !customElements.get("repo-panel")) return;
    const storageKey = "hw6-repo-panel-mode";

    function applyMode(mode) {
        const compact = mode === "compact";
        panel.toggleAttribute("compact", compact);
        control.textContent = compact ? "Show repository details" : "Hide repository details";
        control.setAttribute("aria-expanded", String(!compact));
    }

    let restoredMode = "expanded";
    try {
        const saved = localStorage.getItem(storageKey);
        if (saved === "compact" || saved === "expanded") restoredMode = saved;
    } catch {
        // Storage can be blocked; the expanded default is still usable.
    }
    applyMode(restoredMode);
    control.hidden = false;

    control.addEventListener("click", () => {
        const mode = panel.hasAttribute("compact") ? "expanded" : "compact";
        applyMode(mode);
        try {
            localStorage.setItem(storageKey, mode);
        } catch {
            // A failed save does not undo the current visible setting.
        }
    });
})();
