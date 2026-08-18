const Job = require("../models/Job");
const Worker = require("../models/Worker");

// Create Job Request
exports.createJob = async (req, res) => {
    try {
        const { workerId, service, description, location, scheduledDate } = req.body;

        // Check whether worker exists
        const worker = await Worker.findById(workerId);

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }

        // Check worker availability
        if (!worker.availability) {
            return res.status(400).json({
                success: false,
                message: "Worker is currently unavailable"
            });
        }

        const job = await Job.create({
            customerId: req.user.id,
            workerId,
            service,
            description,
            location,
            scheduledDate
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


// Get Jobs Created By Customer
exports.getCustomerJobs = async (req, res) => {
    try {
        const jobs = await Job.find({
            customerId: req.user.id
        }).populate("workerId");

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


// Get Jobs Assigned To Worker
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

// Accept Job
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

        // Check whether this job belongs to this worker
        if (job.workerId.toString() !== worker._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only manage your own jobs"
            });
        }

        if (job.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Job cannot be accepted because it is already ${job.status}`
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


// Reject Job
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

        // Check whether this job belongs to this worker
        if (job.workerId.toString() !== worker._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only manage your own jobs"
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