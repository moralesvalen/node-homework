# Node.js Fundamentals

## What is Node.js?

Node.js is a JavaScript runtime environment that allows you to run JavaScript outside the browser. It is built on Google’s V8 JavaScript engine.

## How does Node.js differ from running JavaScript in the browser?

• Browser JavaScript uses the window object, while Node.js uses the global object.
• The browser can manipulate the DOM, but Node.js can interact with the file system and the operating system.
• The browser cannot use core modules like fs, path, or os, but Node.js provides those modules by default.

## What is the V8 engine, and how does Node use it?

The V8 engine is a high-performance JavaScript engine developed by Google. It compiles JavaScript into machine code. Node.js uses the V8 engine to run JavaScript on the server side.

## What are some key use cases for Node.js?

• Building APIs and backend services
• Creating CLI tools (Command Line Interface tools)
• Developing real-time applications such as chat apps
• Running web servers and handling HTTP requests

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

CommonJS is the older module system used by default in Node.js.
It uses require to import modules and module.exports to export them.
**CommonJS (default in Node.js):**

```js
const fs = require("fs");
module.exports = myFunction;
```

**ES Modules (supported in modern Node.js):**
ES Modules (ESM) is the modern JavaScript module system, based on the import and export syntax.
It is now fully supported in modern versions of Node.js.

```js
import fs from "fs";
export default myFunction;
```
