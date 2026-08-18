const express = require("express");

const {
    createJob,
    getCustomerJobs,
    getWorkerJobs,
    acceptJob,
    rejectJob
} = require("../controllers/jobController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Customer creates a job request
router.post(
    "/",
    protect,
    authorizeRoles("customer"),
    createJob
);

// Customer views their jobs
router.get(
    "/customer",
    protect,
    authorizeRoles("customer"),
    getCustomerJobs
);

// Worker views assigned jobs
router.get(
    "/worker",
    protect,
    authorizeRoles("worker"),
    getWorkerJobs
);

// Worker accepts job
router.put(
    "/:id/accept",
    protect,
    authorizeRoles("worker"),
    acceptJob
);

// Worker rejects job
router.put(
    "/:id/reject",
    protect,
    authorizeRoles("worker"),
    rejectJob
);

module.exports = router;