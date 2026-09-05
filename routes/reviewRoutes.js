const express = require("express");

const {
    createReview
} = require("../controllers/reviewController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/",
    protect,
    authorizeRoles("customer"),
    createReview
);

module.exports = router;