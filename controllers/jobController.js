const Job = require("../models/Job");
const Worker = require("../models/Worker");


// ==========================================
// CREATE JOB
// ==========================================

// Customer can:
// 1. Create an open job → workerId is null
// 2. Send a direct request → workerId is provided

exports.createJob = async (req, res) => {
    try {
        const {
            workerId,
            service,
            description,
            location,
            scheduledDate
        } = req.body;

        // If a worker was selected
        if (workerId) {
            const worker = await Worker.findById(workerId);

            if (!worker) {
                return res.status(404).json({
                    success: false,
                    message: "Worker not found"
                });
            }

            // Worker must be available
            if (!worker.availability) {
                return res.status(400).json({
                    success: false,
                    message: "Worker is currently unavailable"
                });
            }
        }

        const job = await Job.create({
            customerId: req.user.id,
            workerId: workerId || null,
            service,
            description,
            location,
            scheduledDate,
            status: "pending"
        });

        res.status(201).json({
            success: true,
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
// GET OPEN JOBS
// ==========================================

// Workers see jobs that have not been assigned yet

exports.getOpenJobs = async (req, res) => {
    try {
        const jobs = await Job.find({
            workerId: null,
            status: "pending"
        }).populate("customerId", "-password");

        res.status(200).json({
            success: true,
            count: jobs.length,
            jobs
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET CUSTOMER JOBS
// ==========================================

exports.getCustomerJobs = async (req, res) => {
    try {
        const jobs = await Job.find({
            customerId: req.user.id
        })
        .populate("workerId");

        res.status(200).json({
            success: true,
            count: jobs.length,
            jobs
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET WORKER JOBS
// ==========================================

// Shows jobs directly assigned/requested to this worker

exports.getWorkerJobs = async (req, res) => {
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

        const jobs = await Job.find({
            workerId: worker._id
        })
        .populate("customerId", "-password");

        res.status(200).json({
            success: true,
            count: jobs.length,
            jobs
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET JOB BY ID
// ==========================================

exports.getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate("customerId", "-password")
            .populate("workerId");

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        res.status(200).json({
            success: true,
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
// ACCEPT DIRECT JOB REQUEST
// ==========================================

// Only the worker who received the direct request
// can accept it.

exports.acceptJob = async (req, res) => {
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

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Open jobs are handled through applications
        if (!job.workerId) {
            return res.status(400).json({
                success: false,
                message: "This is an open job. Apply for the job instead."
            });
        }

        // Check ownership
        if (job.workerId.toString() !== worker._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only accept requests sent to you"
            });
        }

        if (job.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Job cannot be accepted because it is already ${job.status}`
            });
        }

        // Worker must be available
        if (!worker.availability) {
            return res.status(400).json({
                success: false,
                message: "You are currently unavailable"
            });
        }

        job.status = "accepted";

        await job.save();

        res.status(200).json({
            success: true,
            message: "Job accepted successfully",
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
// REJECT DIRECT JOB REQUEST
// ==========================================

exports.rejectJob = async (req, res) => {
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

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Open jobs are handled through applications
        if (!job.workerId) {
            return res.status(400).json({
                success: false,
                message: "This is an open job. Apply for the job instead."
            });
        }

        // Check ownership
        if (job.workerId.toString() !== worker._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only reject requests sent to you"
            });
        }

        if (job.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Job cannot be rejected because it is already ${job.status}`
            });
        }

        job.status = "rejected";

        await job.save();

        res.status(200).json({
            success: true,
            message: "Job rejected successfully",
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
// CANCEL JOB
// ==========================================

// Customer can cancel their own pending/accepted job.

exports.cancelJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Check ownership
        if (job.customerId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only cancel your own jobs"
            });
        }

        // Only pending or accepted jobs can be cancelled
        if (
            job.status !== "pending" &&
            job.status !== "accepted"
        ) {
            return res.status(400).json({
                success: false,
                message: `Job cannot be cancelled because it is ${job.status}`
            });
        }

        job.status = "cancelled";

        await job.save();

        res.status(200).json({
            success: true,
            message: "Job cancelled successfully",
            job
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};