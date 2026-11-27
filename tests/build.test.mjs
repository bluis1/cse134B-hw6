import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, writeFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const cli = path.join(root, "node_modules/@11ty/eleventy/cmd.cjs");

test("one shared edit reaches every page; adding the third entry needs only the content source", async () => {
    const checkout = await mkdtemp(path.join(tmpdir(), "hw6-rebuild-"));
    try {
        await cp(path.join(root, "src"), path.join(checkout, "src"), { recursive: true });
        await cp(path.join(root, "eleventy.config.js"), path.join(checkout, "eleventy.config.js"));
        await writeFile(path.join(checkout, "package.json"), '{"type":"module"}');
        const dataFile = path.join(checkout, "src/_data/projects.json");
        const projects = JSON.parse(await readFile(dataFile, "utf8"));
        await writeFile(dataFile, JSON.stringify(projects.slice(0, 2)));
        await exec(process.execPath, [cli], { cwd: checkout });
        for (const entry of projects.slice(0, 2)) {
            await access(path.join(checkout, "dist/projects", entry.slug, "index.html"));
        }
        const before = await readFile(path.join(checkout, "dist/projects/index.html"), "utf8");
        assert.ok(!before.includes(projects[2].title));
        await assert.rejects(access(path.join(checkout, "dist/projects", projects[2].slug, "index.html")));

        // Only the JSON changes between these two builds.
        await writeFile(dataFile, JSON.stringify(projects));
        await exec(process.execPath, [cli], { cwd: checkout });
        const index = await readFile(path.join(checkout, "dist/projects/index.html"), "utf8");
        const detail = await readFile(path.join(checkout, "dist/projects", projects[2].slug, "index.html"), "utf8");
        assert.ok(index.includes(projects[2].title));
        assert.ok(detail.includes(projects[2].title));
        assert.ok(index.includes(`/projects/${projects[2].slug}/`));

        const footerFile = path.join(checkout, "src/_includes/footer.njk");
        const footer = await readFile(footerFile, "utf8");
        await writeFile(footerFile, footer.replace("Computer science coursework", "Shared section rebuild check"));
        await exec(process.execPath, [cli], { cwd: checkout });
        const pages = ["", "about", "experience", "interests", "contact", "projects", ...projects.map(p => `projects/${p.slug}`)];
        for (const page of pages) {
            assert.ok((await readFile(path.join(checkout, "dist", page, "index.html"), "utf8")).includes("Shared section rebuild check"), page);
        }

        projects[2].title = "Updated collection title";
        await writeFile(dataFile, JSON.stringify(projects));
        await exec(process.execPath, [cli, "--pathprefix=/portfolio/"], { cwd: checkout });
        const prefixed = await readFile(path.join(checkout, "dist/projects/index.html"), "utf8");
        const updated = await readFile(path.join(checkout, "dist/projects", projects[2].slug, "index.html"), "utf8");
        assert.ok(prefixed.includes("Updated collection title"));
        assert.ok(updated.includes("Updated collection title"));
        assert.ok(updated.includes('href="/portfolio/assets/styles.css"'));
        assert.ok(prefixed.includes('href="/portfolio/projects/horror-sound-design/"'));
    } finally {
        await rm(checkout, { recursive: true, force: true });
    }
});
