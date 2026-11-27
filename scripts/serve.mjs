import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const port = Number(process.env.PORT || 8081);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".mp3": "audio/mpeg", ".mp4": "video/mp4" };
const server = http.createServer(async (request, response) => {
    try {
        const url = new URL(request.url, "http://localhost");
        const relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
        if (relative.split("/").some(part => part.startsWith(".") || part === "node_modules")) {
            response.writeHead(404).end("Not found");
            return;
        }
        let filename = path.resolve(root, relative || "index.html");
        if (!filename.startsWith(root + path.sep)) throw new Error("Invalid path");
        if ((await stat(filename)).isDirectory()) filename = path.join(filename, "index.html");
        const body = await readFile(filename);
        response.writeHead(200, { "Content-Type": types[path.extname(filename)] || "application/octet-stream", "Cache-Control": "no-store" });
        response.end(body);
    } catch {
        response.writeHead(404).end("Not found");
    }
});
server.listen(port, "127.0.0.1", () => console.log(`Portfolio: http://127.0.0.1:${server.address().port}/`));
