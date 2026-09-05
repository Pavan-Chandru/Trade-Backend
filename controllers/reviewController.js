const Review = require("../models/Review");
const Worker = require("../models/Worker");
const Job = require("../models/Job");


// ==========================================
// CREATE REVIEW
// ==========================================

// Only the customer who owns the completed job
// can review the assigned worker.

exports.createReview = async (req, res) => {
    try {
        const {
            workerId,
            jobId,
            rating,
            comment
        } = req.body;


        // Check required fields
        if (!workerId || !jobId || rating === undefined) {
            return res.status(400).json({
                success: false,
                message: "workerId, jobId and rating are required"
            });
        }


        // Validate rating
        if (
            typeof rating !== "number" ||
            rating < 1 ||
            rating > 5
        ) {
            return res.status(400).json({
                success: false,
                message: "Rating must be a number between 1 and 5"
            });
        }


        // Check worker exists
        const worker = await Worker.findById(workerId);

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }


        // Check job exists
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }


        // Customer must own the job
        if (
            job.customerId.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only review your own jobs"
            });
        }


        // Worker must be assigned to the job
        if (
            !job.workerId ||
            job.workerId.toString() !== workerId
        ) {
            return res.status(400).json({
                success: false,
                message: "This worker is not assigned to this job"
            });
        }


        // Job must be completed
        if (job.status !== "completed") {
            return res.status(400).json({
                success: false,
                message: "You can review only completed jobs"
            });
        }


        // Prevent duplicate review
        const existingReview = await Review.findOne({
            jobId
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "This job has already been reviewed"
            });
        }


        // Create review
        const review = await Review.create({
            customerId: req.user.id,
            workerId,
            jobId,
            rating,
            comment
        });


        res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            review
        });

    } catch (error) {

        // Duplicate job review
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "This job has already been reviewed"
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};