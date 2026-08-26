const express = require("express");

const {
    createJob,
    getOpenJobs,
    getCustomerJobs,
    getWorkerJobs,
    getJobById,
    acceptJob,
    rejectJob,
    cancelJob
} = require("../controllers/jobController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ==========================================
// CUSTOMER ROUTES
// ==========================================

// Create a job
// Can be an open job or a direct worker request

router.post(
    "/",
    protect,
    authorizeRoles("customer"),
    createJob
);


// Customer views their own jobs

router.get(
    "/customer",
    protect,
    authorizeRoles("customer"),
    getCustomerJobs
);


// Customer cancels their own job

router.put(
    "/:id/cancel",
    protect,
    authorizeRoles("customer"),
    cancelJob
);


// ==========================================
// WORKER ROUTES
// ==========================================

// Worker views open jobs

router.get(
    "/open",
    protect,
    authorizeRoles("worker"),
    getOpenJobs
);


// Worker views jobs directly assigned to them

router.get(
    "/worker",
    protect,
    authorizeRoles("worker"),
    getWorkerJobs
);


// Worker accepts a direct request

router.put(
    "/:id/accept",
    protect,
    authorizeRoles("worker"),
    acceptJob
);


// Worker rejects a direct request

router.put(
    "/:id/reject",
    protect,
    authorizeRoles("worker"),
    rejectJob
);


// ==========================================
// GENERAL ROUTE
// ==========================================

// Get a specific job

router.get(
    "/:id",
    protect,
    getJobById
);


module.exports = router;