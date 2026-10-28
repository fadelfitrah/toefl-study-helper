const express = require("express");
const router = express.Router();
const questionsController = require("../controllers/questions.controller");

router.get("/skills-summary", questionsController.getSkillsSummary);
router.get("/", questionsController.getQuestions);
router.get("/:id", questionsController.getQuestionById);

module.exports = router;
