const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("time", () => {
  const currentTime = new Date().toLocaleTimeString();
  console.log("Time Received:", currentTime);
});

setInterval(() => {
  emitter.emit("time");
}, 5000);

module.exports = emitter;
