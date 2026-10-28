const express = require("express");
const router = express.Router();
const practiceController = require("../controllers/practice.controller");

router.post("/start", practiceController.startSession);
router.post("/submit", practiceController.submitSession);
router.get("/history", practiceController.getHistory);
router.get("/session/:id", practiceController.getSessionDetails);

module.exports = router;
