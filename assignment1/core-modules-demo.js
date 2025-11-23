const os = require("os");
const path = require("path");
const fs = require("fs");

const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
console.log("Platform:", os.platform());
console.log("CPU:", os.cpus()[0].model);
console.log("Total Memory:", os.totalmem());

// Path module
const joinedPath = path.join(__dirname, "sample-files", "file.txt");
console.log("Joined path:", joinedPath);

// fs.promises API
async function createAndReadFile() {
  const demoPath = path.join(__dirname, "sample-files", "demo.txt");

  // Write file
  await fs.promises.writeFile(demoPath, "Hello from fs.promises!");

  // Read file
  const data = await fs.promises.readFile(demoPath, "utf8");
  console.log("fs.promises read:", data);
}

createAndReadFile().catch((err) =>
  console.error("Error in createAndReadFile:", err)
);
// Streams for large files- log first 40 chars of each chunk
const largeFilePath = path.join(__dirname, "sample-files", "largefile.txt");

let content = "";
for (let i = 1; i <= 100; i++) {
  content += `Line ${i}: This is a large file demo.\n`;
}
fs.writeFileSync(largeFilePath, content);

const stream = fs.createReadStream(largeFilePath, { highWaterMark: 1024 });
stream.on("data", (chunk) => {
  const text = chunk.toString();
  console.log("Read chunk:", text.slice(0, 40));
});
stream.on("end", () => {
  console.log("Finished reading large file with streams.");
});
stream.on("error", (err) => {
  console.error("Stream error:", err);
});
