const express = require("express");
const router = express.Router();
const materialsController = require("../controllers/materials.controller");

router.get("/", materialsController.getMaterials);
router.get("/:id/image", materialsController.getMaterialImage);
router.get("/:id/audio", materialsController.getMaterialAudio);
router.get("/:id", materialsController.getMaterialById);

module.exports = router;
