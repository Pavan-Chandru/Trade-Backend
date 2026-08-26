const Application = require("../models/Application");
const Job = require("../models/Job");
const Worker = require("../models/Worker");


// ==========================================
// WORKER APPLIES FOR OPEN JOB
// ==========================================

exports.applyForJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { message } = req.body;

        // Find worker profile
        const worker = await Worker.findOne({
            userId: req.user.id
        });

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker profile not found"
            });
        }

        // Worker must be available
        if (!worker.availability) {
            return res.status(400).json({
                success: false,
                message: "You are currently unavailable"
            });
        }

        // Find job
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Job must still be pending
        if (job.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "This job is no longer accepting applications"
            });
        }

        // Job must be an open job
        if (job.workerId) {
            return res.status(400).json({
                success: false,
                message: "This job is already assigned to a worker"
            });
        }

        // Prevent duplicate application
        const existingApplication = await Application.findOne({
            jobId: job._id,
            workerId: worker._id
        });

        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: "You have already applied for this job"
            });
        }

        // Create application
        const application = await Application.create({
            jobId: job._id,
            workerId: worker._id,
            message: message || "",
            status: "pending"
        });

        res.status(201).json({
            success: true,
            message: "Application submitted successfully",
            application
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// WORKER VIEWS THEIR APPLICATIONS
// ==========================================

exports.getMyApplications = async (req, res) => {
    try {
        const worker = await Worker.findOne({
            userId: req.user.id
        });

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker profile not found"
            });
        }

        const applications = await Application.find({
            workerId: worker._id
        })
        .populate("jobId")
        .populate("workerId");

        res.status(200).json({
            success: true,
            count: applications.length,
            applications
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// CUSTOMER VIEWS APPLICATIONS FOR A JOB
// ==========================================

exports.getJobApplications = async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Only job owner can view applications
        if (
            job.customerId.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only view applications for your own jobs"
            });
        }

        const applications = await Application.find({
            jobId: job._id
        })
        .populate("workerId")
        .populate("jobId");

        res.status(200).json({
            success: true,
            count: applications.length,
            applications
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// CUSTOMER ACCEPTS APPLICATION
// ==========================================

exports.acceptApplication = async (req, res) => {
    try {
        const application = await Application.findById(
            req.params.id
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        // Find job
        const job = await Job.findById(
            application.jobId
        );

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Only job owner can accept application
        if (
            job.customerId.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only manage applications for your own jobs"
            });
        }

        // Application must be pending
        if (application.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Application is already ${application.status}`
            });
        }

        // Job must still be pending
        if (job.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Job cannot be assigned because it is ${job.status}`
            });
        }

        // Job should still be open
        if (job.workerId) {
            return res.status(400).json({
                success: false,
                message: "Job is already assigned to a worker"
            });
        }

        // Find worker
        const worker = await Worker.findById(
            application.workerId
        );

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }

        // Worker must still be available
        if (!worker.availability) {
            return res.status(400).json({
                success: false,
                message: "Worker is currently unavailable"
            });
        }

        // Assign worker to job
        job.workerId = worker._id;
        job.status = "accepted";

        await job.save();

        // Accept selected application
        application.status = "accepted";

        await application.save();

        // Reject all other pending applications
        await Application.updateMany(
            {
                jobId: job._id,
                _id: { $ne: application._id },
                status: "pending"
            },
            {
                $set: {
                    status: "rejected"
                }
            }
        );

        res.status(200).json({
            success: true,
            message: "Application accepted successfully",
            application,
            job
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// CUSTOMER REJECTS APPLICATION
// ==========================================

exports.rejectApplication = async (req, res) => {
    try {
        const application = await Application.findById(
            req.params.id
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        // Find job
        const job = await Job.findById(
            application.jobId
        );

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Only job owner can reject application
        if (
            job.customerId.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only manage applications for your own jobs"
            });
        }

        // Application must be pending
        if (application.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Application is already ${application.status}`
            });
        }

        application.status = "rejected";

        await application.save();

        res.status(200).json({
            success: true,
            message: "Application rejected successfully",
            application
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};