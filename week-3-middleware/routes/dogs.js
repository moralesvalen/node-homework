const express = require("express");
const router = express.Router();
const dogs = require("../dogData.js");
const { ValidationError, NotFoundError } = require("../errors");

router.get("/dogs", (req, res) => {
  res.json({
    dogs: dogs,
    requestId: req.requestId,
  });
});

router.post("/adopt", (req, res, next) => {
  const { name, email, dogName } = req.body;
  if (!name || !email || !dogName) {
    return next(new ValidationError("Missing required fields"));
  }

  return res.status(201).json({
    message: `Adoption request received. We will contact you at ${email} for further details.`,
    requestId: req.requestId,
  });
});

router.get("/error", (req, res) => {
  throw new Error("Test error");
});
router.use((req, res, next) => {
  next(new NotFoundError("Dog route not found"));
});
module.exports = router;
