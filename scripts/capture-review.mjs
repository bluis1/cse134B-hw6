import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import path from "node:path";

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 1100 }, deviceScaleFactor: 1.5 });
    await page.goto(pathToFileURL(path.resolve("docs/ai-review.html")).href);
    await page.screenshot({ path: "docs/ai-review.png", fullPage: true });
    console.log("Saved readable browser screenshot: docs/ai-review.png");
} finally {
    await browser.close();
}
