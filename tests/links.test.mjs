import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import path from "node:path";

const exec = promisify(execFile);
test("submission helper writes exactly four URLs and fills the README without guessing a host", async () => {
    const checkout = await mkdtemp(path.join(tmpdir(), "hw6-links-"));
    try {
        await mkdir(path.join(checkout, "scripts"));
        const script = path.join(checkout, "scripts/create-links.mjs");
        await cp(new URL("../scripts/create-links.mjs", import.meta.url), script);
        const readmePath = path.join(checkout, "README.md");
        await writeFile(readmePath, "# Test\n<!-- deployment:start -->\nPending\n<!-- deployment:end -->\n");
        await exec(process.execPath, [script, "https://github.com/example/hw6", "https://example.com/portfolio/"]);
        const expected = [
            "https://github.com/example/hw6",
            "https://example.com/portfolio/",
            "https://example.com/portfolio/projects/",
            "https://example.com/portfolio/projects/personal-portfolio/"
        ];
        assert.deepEqual((await readFile(path.join(checkout, "links.txt"), "utf8")).trim().split("\n"), expected);
        const readme = await readFile(readmePath, "utf8");
        assert.ok(readme.includes("https://example.com/portfolio/projects/horror-sound-design/"));
        for (const url of expected) assert.ok(readme.includes(url));
        await assert.rejects(exec(process.execPath, [script, "https://github.com/example/hw6", "http://example.com/"]));
        assert.equal(await readFile(readmePath, "utf8"), readme);
    } finally {
        await rm(checkout, { recursive: true, force: true });
    }
});
