import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const checkout = await mkdtemp(path.join(tmpdir(), "hw6-clean-"));
let server;
try {
    for (const file of ["src", "scripts", "package.json", "package-lock.json", "eleventy.config.js", "netlify.toml", ".nvmrc"]) {
        await cp(path.join(root, file), path.join(checkout, file), { recursive: true });
    }
    const npmCli = process.env.npm_execpath;
    if (!npmCli) throw new Error("Use npm run verify:clean to supply npm's executable path.");
    await exec(process.execPath, [npmCli, "ci"], { cwd: checkout, timeout: 180000 });
    await exec(process.execPath, [npmCli, "run", "build"], { cwd: checkout, timeout: 60000 });
    server = spawn(process.execPath, ["scripts/serve.mjs"], { cwd: checkout, env: { ...process.env, PORT: "0" }, stdio: "pipe" });
    const base = await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.once("exit", code => reject(new Error(`Preview stopped: ${code}`)));
        server.stdout.once("data", chunk => resolve(String(chunk).match(/Portfolio: (\S+)/)[1]));
    });
    for (const route of ["", "about/", "projects/", "experience/", "interests/", "contact/", "projects/personal-portfolio/", "projects/nachos-threads/", "projects/horror-sound-design/", "assets/styles.css", "assets/repo-panel.js", "assets/media/profile.jpeg"]) {
        const response = await fetch(new URL(route, base));
        if (!response.ok) throw new Error(`${route} returned HTTP ${response.status}`);
        await response.arrayBuffer();
    }
    console.log(`Clean source copy: npm ci, build, and HTTP preview passed on ${process.version}.`);
    console.log("All nine pages and representative nested assets returned HTTP 200.");
} finally {
    if (server && server.exitCode === null) {
        const exited = new Promise(resolve => server.once("exit", resolve));
        server.kill();
        await exited;
    }
    await rm(checkout, { recursive: true, force: true });
}
