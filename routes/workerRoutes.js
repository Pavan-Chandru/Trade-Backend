const express = require("express");

const {
    createWorker,
    getWorkers,
    getWorkerById,
    updateWorker,
    deleteWorker,
    updateAvailability
} = require("../controllers/workerController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Create a new worker - worker only
router.post("/", protect, authorizeRoles("worker"), createWorker);

// Get all workers
router.get("/", getWorkers);


router.put(
    "/availability",
    protect,
    authorizeRoles("worker"),
    updateAvailability
);

// Get worker by ID
router.get("/:id", getWorkerById);

router.put("/:id", protect, authorizeRoles("worker"), updateWorker);

router.delete("/:id", protect, authorizeRoles("worker"), deleteWorker);

module.exports = router;