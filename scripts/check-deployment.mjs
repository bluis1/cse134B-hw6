import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";

const site = new URL(process.argv[2]);
if (site.protocol !== "https:" || site.username || site.password || site.search || site.hash) {
    throw new Error("Pass the public site's HTTPS homepage URL.");
}
if (!site.pathname.endsWith("/")) site.pathname += "/";
const root = path.resolve(import.meta.dirname, "../dist");
const entries = await readdir(root, { recursive: true, withFileTypes: true });
const files = entries.filter(entry => entry.isFile()).map(entry => path.join(entry.parentPath, entry.name));
const hash = buffer => createHash("sha256").update(buffer).digest("hex");
function normalizeText(buffer, relative, deployed) {
    let text = buffer.toString("utf8").replaceAll("\r\n", "\n");
    if (deployed && relative.endsWith(".html")) {
        // Netlify adds its own hosting comment and public toolbar after building.
        text = text.replace(/\n<!-- This site is hosted on Netlify\.[\s\S]*?-->\n/, "\n");
        text = text.replace(/\n<script async src="\/\.netlify\/scripts\/hud\?variant=public"[^>]*><\/script>\s*$/, "");
    }
    return text.trimEnd();
}
const comparisons = await Promise.allSettled(files.map(async filename => {
    const relative = path.relative(root, filename).split(path.sep).join("/");
    const response = await fetch(new URL(relative, site), { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`${relative}: HTTP ${response.status}`);
    const remote = Buffer.from(await response.arrayBuffer());
    const local = await readFile(filename);
    const textFile = /\.(html|css|js|json|txt)$/.test(relative);
    const matches = textFile
        ? normalizeText(remote, relative, true) === normalizeText(local, relative, false)
        : hash(remote) === hash(local);
    if (!matches) throw new Error(`${relative} differs from the local built output.`);
}));
const failures = comparisons.filter(result => result.status === "rejected");
if (failures.length) throw new AggregateError(failures.map(result => result.reason), "Deployed output differs from the local build.");
console.log(`All ${files.length} deployed files match the local build, allowing Windows line endings and Netlify's hosting additions.`);
const browserChecks = spawn(process.execPath, ["--test", "tests/browser.test.mjs"], {
    stdio: "inherit", env: { ...process.env, HW6_SITE_URL: site.href }
});
browserChecks.once("error", error => { console.error(error); process.exitCode = 1; });
browserChecks.once("exit", code => { process.exitCode = code ?? 1; });
