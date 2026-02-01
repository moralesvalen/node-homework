const express = require("express");

const router = express.Router();
const { register, logon, logoff } = require("../controllers/userController");
const jwtMiddleware = require("../middleware/jwtMiddleware");

router.route("/").post(register);
router.route("/logon").post(logon);
router.post("/logoff", jwtMiddleware, logoff);
module.exports = router;
