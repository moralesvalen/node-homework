const fs = require("fs");
const path = require("path");

// sample-files/sample.txt
const sampleDir = path.join(__dirname, "sample-files");
const filePath = path.join(sampleDir, "sample.txt");

// Asegurar que la carpeta existe
if (!fs.existsSync(sampleDir)) {
  fs.mkdirSync(sampleDir, { recursive: true });
}

// Asegurar el contenido del archivo giaul queb la consigna
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, "Hello, async world!");
}

// 1. Callback style
fs.readFile(filePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file (callback):", err);
    return;
  }
  console.log("Callback read:", data);
});

/*
  Callback hell example (test and leave it in comments):
  fs.readFile('file1.txt', 'utf8', (err, data1) => {
    fs.readFile('file2.txt', 'utf8', (err, data2) => {
      fs.readFile('file3.txt', 'utf8', (err, data3) => {
        console.log("This is callback hell");
      });
    });
  });
*/

// 2. Promise style
fs.promises
  .readFile(filePath, "utf8")
  .then((data) => {
    console.log("Promise read:", data);
  })
  .catch((err) => {
    console.error("Error reading file (promise):", err);
  });

// 3. Async/Await style
async function readFileAsync() {
  try {
    const data = await fs.promises.readFile(filePath, "utf8");
    console.log("Async/Await read:", data);
  } catch (err) {
    console.error("Error reading file (async/await):", err);
  }
}

readFileAsync();
