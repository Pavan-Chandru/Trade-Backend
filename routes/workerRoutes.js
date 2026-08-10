const express = require("express");

const {
    createWorker,
    getWorkers,
    getWorkerById,
    updateWorker,
    deleteWorker
} = require("../controllers/workerController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Create a new worker - worker only
router.post("/", protect, authorizeRoles("worker"), createWorker);

// Get all workers
router.get("/", getWorkers);

// Get worker by ID
router.get("/:id", getWorkerById);

// Update worker
router.put("/:id", updateWorker);

// Delete worker
router.delete("/:id", deleteWorker);

module.exports = router;