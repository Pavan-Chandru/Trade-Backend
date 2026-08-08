const express = require("express");

const {
    createWorker,
    getWorkers,
    getWorkerById,
    updateWorker,
    deleteWorker
} = require("../controllers/workerController");

const router = express.Router();

// Create a new worker
router.post("/", createWorker);

// Get all workers
router.get("/", getWorkers);

// Get worker by ID
router.get("/:id", getWorkerById);

// Update worker
router.put("/:id", updateWorker);

// Delete worker
router.delete("/:id", deleteWorker);

module.exports = router;