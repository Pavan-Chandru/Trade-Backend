const express = require("express");

const {
    applyForJob,
    getMyApplications,
    getJobApplications,
    acceptApplication,
    rejectApplication
} = require("../controllers/applicationController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ==========================================
// WORKER ROUTES
// ==========================================

// Worker applies for an open job

router.post(
    "/:jobId",
    protect,
    authorizeRoles("worker"),
    applyForJob
);


// Worker views their applications

router.get(
    "/my",
    protect,
    authorizeRoles("worker"),
    getMyApplications
);


// ==========================================
// CUSTOMER ROUTES
// ==========================================

// Customer views applications for their job

router.get(
    "/job/:jobId",
    protect,
    authorizeRoles("customer"),
    getJobApplications
);


// Customer accepts an application

router.put(
    "/:id/accept",
    protect,
    authorizeRoles("customer"),
    acceptApplication
);


// Customer rejects an application

router.put(
    "/:id/reject",
    protect,
    authorizeRoles("customer"),
    rejectApplication
);


module.exports = router;