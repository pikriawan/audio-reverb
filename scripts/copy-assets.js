const fs = require("node:fs");
const path = require("node:path");

const sources = [
    path.resolve("node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js"),
    path.resolve("node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm")
];

fs.mkdirSync(path.resolve("public/assets"), { recursive: true });

for (const source of sources) {
    fs.copyFileSync(source, path.resolve("public/assets", path.basename(source)));
}
