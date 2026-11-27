import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

let base;
const componentPage = "/projects/personal-portfolio/";
const api = "https://api.github.com/repos/bluis1/cse134B-hw5";
const data = { full_name: "bluis1/cse134B-hw5", pushed_at: "2026-11-20T04:17:57Z", default_branch: "main", language: "HTML" };
let server, browser;
const screenshotDirectory = process.env.HW6_SITE_URL ? "docs/screenshots/deployed" : "docs/screenshots";

before(async () => {
    if (process.env.HW6_SITE_URL) {
        base = process.env.HW6_SITE_URL.replace(/\/$/, "");
    } else {
        server = spawn(process.execPath, ["scripts/serve.mjs"], { env: { ...process.env, PORT: "0" }, stdio: "pipe" });
        await new Promise((resolve, reject) => {
            let errors = "";
            server.stderr.on("data", chunk => { errors += chunk; });
            server.once("error", reject);
            server.stdout.once("data", chunk => {
                base = String(chunk).match(/Portfolio: (\S+)/)[1].replace(/\/$/, "");
                resolve();
            });
            server.once("exit", code => reject(new Error(`Preview server exited: ${code}\n${errors}`)));
        });
    }
    browser = await chromium.launch({ channel: "chrome", headless: true });
    await mkdir(screenshotDirectory, { recursive: true });
});

after(async () => {
    await browser?.close();
    server?.kill();
});

test("every generated page opens directly, with assets, one heading, and working internal links", async () => {
    const page = await browser.newPage();
    const pages = ["/", "/about/", "/projects/", "/experience/", "/interests/", "/contact/", componentPage, "/projects/nachos-threads/", "/projects/horror-sound-design/"];
    const failures = [];
    page.on("pageerror", error => failures.push(error.message));
    page.on("response", response => { if (response.url().startsWith(base) && response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
    for (const url of pages) {
        assert.equal((await page.goto(base + url)).status(), 200);
        assert.equal(await page.locator("h1").count(), 1);
        assert.equal(await page.locator('nav [aria-current="page"]').count(), 1);
        assert.ok(await page.locator("body").evaluate(el => getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)"));
        for (const image of await page.locator("main img").all()) {
            await image.scrollIntoViewIfNeeded();
            await image.evaluate(element => element.decode());
            assert.ok(await image.evaluate(element => element.complete && element.naturalWidth > 0));
        }
        const links = await page.locator("a[href]").evaluateAll(anchors => anchors.map(a => a.href).filter(href => href.startsWith(location.origin)));
        for (const link of new Set(links)) assert.equal((await page.request.get(link)).status(), 200, link);
    }
    assert.deepEqual(failures, []);
    await page.close();
});

test("keyboard controls, saved mode, both themes, and blocked storage", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.route(api, route => route.fulfill({ json: data }));
    await page.goto(base);
    await page.keyboard.press("Tab");
    assert.equal(await page.locator(":focus").textContent(), "Skip to content");
    assert.equal(await page.locator(":focus").evaluate(el => getComputedStyle(el).outlineStyle), "solid");
    await page.getByRole("link", { name: "See my projects", exact: true }).click();
    await page.getByRole("link", { name: "Personal Portfolio Website", exact: true }).click();
    assert.ok(page.url().endsWith(componentPage));
    const mode = page.locator("#repo-mode-toggle");
    await mode.waitFor({ state: "visible" });
    await mode.focus();
    await page.keyboard.press("Enter");
    await page.locator("repo-panel[compact]").waitFor({ state: "attached" });
    assert.ok(await page.locator("repo-panel").evaluate(el => el.hasAttribute("compact")));
    await page.reload();
    await mode.waitFor({ state: "visible" });
    assert.equal(await mode.getAttribute("aria-expanded"), "false");
    assert.ok(await page.locator(".repo-panel__details").isHidden());
    await mode.focus();
    await page.keyboard.press("Space");
    await page.locator("repo-panel:not([compact])").waitFor({ state: "attached" });
    assert.ok(await page.locator(".repo-panel__details").isVisible());
    await page.locator("repo-panel button").focus();
    await page.keyboard.press("Enter");
    await page.waitForSelector('[data-state="success"]');
    assert.match(await page.locator("repo-panel").textContent(), /Latest push:.*Nov 20, 2026/);
    await page.screenshot({ path: `${screenshotDirectory}/component-dark.png`, fullPage: true });
    await page.locator("#theme-toggle").click();
    assert.ok(await page.locator("body").evaluate(el => el.classList.contains("light-theme")));
    await page.screenshot({ path: `${screenshotDirectory}/component-light.png`, fullPage: true });
    await page.reload();
    assert.ok(await page.locator("body").evaluate(el => el.classList.contains("light-theme")));
    assert.equal(await mode.getAttribute("aria-expanded"), "true");
    await context.close();

    const blocked = await browser.newContext();
    await blocked.addInitScript(() => {
        Storage.prototype.getItem = () => { throw new Error("blocked"); };
        Storage.prototype.setItem = () => { throw new Error("blocked"); };
    });
    const blockedPage = await blocked.newPage();
    await blockedPage.goto(base + componentPage);
    await blockedPage.locator("#repo-mode-toggle").click();
    assert.equal(await blockedPage.locator("#repo-mode-toggle").getAttribute("aria-expanded"), "false");
    await blockedPage.locator("#theme-toggle").click();
    assert.ok(await blockedPage.locator("body").evaluate(el => el.classList.contains("light-theme")));
    await blocked.close();
});

test("loading, network failure after success, same-page retry, HTTP and malformed responses", async () => {
    const page = await browser.newPage();
    let responseMode = "success";
    let release;
    await page.route(api, async route => {
        if (responseMode === "hold") {
            await new Promise(resolve => { release = resolve; });
            return route.fulfill({ json: data });
        }
        if (responseMode === "offline") return route.abort("internetdisconnected");
        if (responseMode === "http") return route.fulfill({ status: 404, json: { message: "Not Found" } });
        if (responseMode === "rate") return route.fulfill({ status: 403, json: { message: "Rate limit" } });
        if (responseMode === "invalid") return route.fulfill({ body: "broken JSON", contentType: "application/json" });
        if (responseMode === "shape") return route.fulfill({ json: { pushed_at: "yesterday" } });
        if (responseMode === "markup") return route.fulfill({ json: { ...data, default_branch: '<img src=x onerror="alert(1)">' } });
        return route.fulfill({ json: data });
    });
    await page.goto(base + componentPage);
    const request = page.locator("repo-panel button");
    responseMode = "hold";
    await request.click();
    await page.waitForSelector('[data-state="loading"]');
    assert.ok(await request.isDisabled());
    await page.locator("#repo-mode-toggle").click();
    assert.equal(await page.locator("#repo-mode-toggle").getAttribute("aria-expanded"), "false");
    while (!release) await new Promise(resolve => setTimeout(resolve, 10));
    release();
    await page.waitForSelector('[data-state="success"]');
    const result = await page.locator("repo-panel .repo-panel__surface > p").first().textContent();
    for (responseMode of ["offline", "http", "rate", "invalid", "shape"]) {
        await request.click();
        await page.waitForSelector('[data-state="error"]');
        assert.ok(await request.isEnabled());
        assert.equal(await page.locator("repo-panel .repo-panel__surface > p").first().textContent(), result);
        assert.match(await page.locator('[role="status"]').textContent(), /has not been refreshed/);
        if (responseMode === "offline") await page.screenshot({ path: `${screenshotDirectory}/component-error.png`, fullPage: true });
        if (responseMode === "http") assert.match(await page.locator('[role="status"]').textContent(), /HTTP 404/);
    }
    responseMode = "markup";
    await request.click();
    await page.waitForSelector('[data-state="success"]');
    assert.equal(await page.locator("repo-panel img").count(), 0);
    assert.match(await page.locator(".repo-panel__details").textContent(), /<img/);
    responseMode = "success";
    await request.click();
    await page.waitForSelector('[data-state="success"]');
    assert.equal(page.url(), base + componentPage);
    await page.close();
});

test("navigation and collection work without JavaScript; 360px pages do not overflow", async () => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce", viewport: { width: 360, height: 800 } });
    const page = await context.newPage();
    await page.goto(base);
    await page.getByRole("link", { name: "See my projects", exact: true }).click();
    assert.equal(await page.locator("main article").count(), 3);
    await page.getByRole("link", { name: "Horror Sound Design Project", exact: true }).click();
    assert.ok(await page.getByRole("heading", { name: "Horror Sound Design Project", exact: true }).isVisible());
    await page.reload();
    await page.getByRole("link", { name: "Back to all projects" }).click();
    await page.getByRole("link", { name: "Personal Portfolio Website", exact: true }).click();
    assert.ok(await page.locator("repo-panel a").isVisible());
    assert.ok(await page.locator("noscript").isVisible());
    assert.ok(await page.locator("#repo-mode-toggle").isHidden());
    assert.ok(await page.locator("#theme-toggle").isHidden());
    await page.screenshot({ path: `${screenshotDirectory}/no-javascript.png`, fullPage: true });
    await context.close();

    const mobile = await browser.newPage({ viewport: { width: 360, height: 800 } });
    for (const url of ["/", "/about/", "/projects/", "/experience/", "/interests/", "/contact/", componentPage, "/projects/nachos-threads/", "/projects/horror-sound-design/"]) {
        await mobile.goto(base + url);
        assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), url);
    }
    await mobile.goto(base);
    await mobile.screenshot({ path: `${screenshotDirectory}/home-mobile.png`, fullPage: true });
    await mobile.setViewportSize({ width: 1440, height: 1000 });
    await mobile.screenshot({ path: `${screenshotDirectory}/home-desktop.png`, fullPage: true });
    await mobile.close();
});

test("real public GitHub API succeeds, explains a blocked request, and recovers after unblocking", async () => {
    const page = await browser.newPage();
    await page.goto(base + componentPage);
    await page.locator("repo-panel button").click();
    await page.waitForSelector('[data-state="success"]', { timeout: 15000 });
    assert.match(await page.locator("repo-panel").textContent(), /Latest push:/);
    await page.screenshot({ path: `${screenshotDirectory}/component-live.png`, fullPage: true });
    const success = await page.locator("repo-panel").innerText();
    const beforeRetryURL = page.url();
    await page.route(api, route => route.abort("internetdisconnected"));
    await page.locator("repo-panel button").click();
    await page.waitForSelector('[data-state="error"]');
    const failure = await page.locator('[role="status"]').textContent();
    assert.match(failure, /has not been refreshed/);
    await page.screenshot({ path: `${screenshotDirectory}/component-live-blocked.png`, fullPage: true });
    await page.unroute(api);
    await page.locator("repo-panel button").focus();
    await page.keyboard.press("Enter");
    await page.waitForSelector('[data-state="success"]', { timeout: 15000 });
    assert.equal(page.url(), beforeRetryURL);
    const retry = await page.locator('[role="status"]').textContent();
    await page.screenshot({ path: `${screenshotDirectory}/component-live-retry.png`, fullPage: true });
    await writeFile(`${screenshotDirectory}/observations.json`, JSON.stringify({
        base, checkedAt: new Date().toISOString(), success, failure, retry, samePageRetry: true
    }, null, 2) + "\n");
    await page.close();
});
