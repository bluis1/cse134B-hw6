import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const [repository, deployment] = process.argv.slice(2);
try {
    const repo = new URL(repository);
    const site = new URL(deployment);
    if (repo.protocol !== "https:" || site.protocol !== "https:" || repo.hostname !== "github.com" ||
        repo.pathname.split("/").filter(Boolean).length !== 2 || repo.username || repo.password ||
        site.username || site.password || repo.search || repo.hash || site.search || site.hash) {
        throw new Error("Use a GitHub repository root and the public site's HTTPS home URL.");
    }
    if (!site.pathname.endsWith("/")) site.pathname += "/";
    const collection = new URL("projects/", site);
    const component = new URL("projects/personal-portfolio/", site);
    const readmePath = fileURLToPath(new URL("../README.md", import.meta.url));
    const readme = await readFile(readmePath, "utf8");
    const published = [
        "<!-- deployment:start -->",
        `- [HW6 repository](${repo.href})`,
        `- [Homepage](${site.href})`,
        `- [About](${new URL("about/", site).href})`,
        `- [Skills](${new URL("experience/", site).href})`,
        `- [Interests](${new URL("interests/", site).href})`,
        `- [Contact](${new URL("contact/", site).href})`,
        `- [Collection index](${collection.href})`,
        `- [Third collection entry](${new URL("projects/horror-sound-design/", site).href})`,
        `- [Web Component page](${component.href})`,
        "<!-- deployment:end -->"
    ].join("\n");
    if (!readme.includes("<!-- deployment:start -->") || !readme.includes("<!-- deployment:end -->")) {
        throw new Error("The README deployment markers are missing. Restore them before generating links.");
    }
    await writeFile(fileURLToPath(new URL("../links.txt", import.meta.url)), `${repo.href}\n${site.href}\n${collection.href}\n${component.href}\n`);
    await writeFile(readmePath, readme.replace(/<!-- deployment:start -->[\s\S]*?<!-- deployment:end -->/, published));
    console.log("Created links.txt with four plain HTTPS URLs. Open each while signed out before submitting.");
    console.log("Updated the README's deployment links. This does not verify deployment or publish files.");
} catch (error) {
    console.error("Usage: npm run links -- https://github.com/USER/HW6-REPO https://YOUR-HW6-SITE/");
    console.error(error.message);
    process.exitCode = 1;
}
