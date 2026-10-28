const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");

router.get("/overview", dashboardController.getOverview);
router.put("/goals", dashboardController.updateGoals);

module.exports = router;
