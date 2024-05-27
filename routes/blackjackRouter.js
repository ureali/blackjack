const express = require("express");
const router = express.Router();
const blackjackController = require('../controllers/blackjackController');

router.get("/", (req, res) => {
   res.render("play");
});

router.get("/start", blackjackController.startGame);
router.post("/continue", blackjackController.continue);

router.post("/hit", blackjackController.hit);
router.post("/surrender", blackjackController.surrender);
router.post("/stand", blackjackController.stand);
router.post("/double", blackjackController.double);

module.exports = router;