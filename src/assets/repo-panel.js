class RepoPanel extends HTMLElement {
    static observedAttributes = ["compact"];

    connectedCallback() {
        if (this.initialized) return;
        this.initialized = true;
        this.loading = false;
        this.hasResult = false;
        const repository = this.getAttribute("repository") || "";
        if (!/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/.test(repository)) return;
        this.repository = repository;

        this.surface = document.createElement("div");
        this.surface.className = "repo-panel__surface";
        const heading = document.createElement("h3");
        heading.textContent = "Public repository activity";
        this.item = document.createElement("p");
        this.item.textContent = "Check GitHub for the latest push date of the earlier portfolio.";
        this.details = document.createElement("p");
        this.details.className = "repo-panel__details";
        this.details.textContent = "The request goes to GitHub's public API. No sign-in is needed.";
        const source = document.createElement("p");
        const link = document.createElement("a");
        link.href = `https://github.com/${repository}`;
        link.textContent = `Open ${repository} on GitHub`;
        source.append(link);
        this.requestButton = document.createElement("button");
        this.requestButton.type = "button";
        this.requestButton.textContent = "Check GitHub activity";
        this.requestButton.addEventListener("click", () => this.loadActivity());
        this.status = document.createElement("p");
        this.status.className = "repo-panel__status";
        this.status.setAttribute("role", "status");
        this.status.setAttribute("aria-live", "polite");
        this.status.setAttribute("aria-atomic", "true");
        this.surface.append(heading, this.item, this.details, source, this.requestButton, this.status);
        this.replaceChildren(this.surface);
        this.setStatus("Ready to check. The source link works without an API request.", "ready");
        this.updateMode();
    }

    disconnectedCallback() {
        this.controller?.abort();
    }

    attributeChangedCallback() {
        if (this.surface) this.updateMode();
    }

    updateMode() {
        const compact = this.hasAttribute("compact");
        this.details.hidden = compact;
        this.surface.classList.toggle("is-compact", compact);
    }

    setStatus(message, state) {
        this.status.textContent = message;
        this.surface.dataset.state = state;
    }

    async loadActivity() {
        if (this.loading) return;
        this.loading = true;
        // Keep the status outside an aria-busy region so loading is announced promptly.
        this.item.setAttribute("aria-busy", "true");
        this.requestButton.disabled = true;
        this.requestButton.textContent = "Checking GitHub…";
        this.setStatus("Loading public repository activity. The project and source link are still available.", "loading");
        this.controller = new AbortController();
        const timeout = setTimeout(() => this.controller.abort(), 10000);

        try {
            const response = await fetch(`https://api.github.com/repos/${this.repository}`, {
                method: "GET",
                headers: { Accept: "application/vnd.github+json" },
                cache: "no-store",
                signal: this.controller.signal
            });
            if (!response.ok) {
                throw new Error(response.status === 403 || response.status === 429
                    ? "GitHub is limiting requests. Wait a little before trying again."
                    : `GitHub returned HTTP ${response.status}. Try again or open the source link.`);
            }
            const data = await response.json();
            if (typeof data?.full_name !== "string" ||
                data.full_name.toLowerCase() !== this.repository.toLowerCase() ||
                typeof data.pushed_at !== "string" || !Number.isFinite(Date.parse(data.pushed_at)) ||
                typeof data.default_branch !== "string" || !data.default_branch.trim() || data.default_branch.length > 200 ||
                !(data.language === null || (typeof data.language === "string" && data.language.length <= 100))) {
                throw new Error("GitHub sent an unexpected response. Try again or use the source link.");
            }
            if (!this.isConnected) return;

            const formatter = new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium", timeStyle: "short", timeZone: "UTC"
            });
            // API values are displayed as text, never interpreted as HTML.
            this.item.textContent = `Latest push: ${formatter.format(new Date(data.pushed_at))} UTC.`;
            this.details.textContent = `Default branch: ${data.default_branch}. Main language: ${data.language || "not listed"}. Source: GitHub API.`;
            this.hasResult = true;
            this.setStatus(`Activity loaded. Checked ${formatter.format(new Date())} UTC.`, "success");
            this.requestButton.textContent = "Refresh GitHub activity";
        } catch (error) {
            if (!this.isConnected) return;
            let message = "Could not reach GitHub. Check your connection and try again.";
            if (error.name === "AbortError") message = "The request timed out. Try again.";
            else if (error.message.startsWith("GitHub ")) message = error.message;
            const retained = this.hasResult ? " The last result is still shown; it has not been refreshed." : " You can still open the source link.";
            this.setStatus(message + retained, "error");
            this.requestButton.textContent = "Try GitHub again";
        } finally {
            clearTimeout(timeout);
            this.loading = false;
            this.item.setAttribute("aria-busy", "false");
            this.requestButton.disabled = false;
        }
    }
}

customElements.define("repo-panel", RepoPanel);
