const express = require("express");
const router = express.Router();
const installController = require("../controllers/install.controller");

router.post("/", installController.installDatabase);

module.exports = router;
