const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
    {
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true
        },

        workerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Worker",
            required: true
        },

        message: {
            type: String,
            default: "",
            trim: true
        },

        status: {
            type: String,
            enum: [
                "pending",
                "accepted",
                "rejected"
            ],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

// Prevent the same worker from applying
// to the same job more than once.
applicationSchema.index(
    { jobId: 1, workerId: 1 },
    { unique: true }
);

const Application = mongoose.model(
    "Application",
    applicationSchema
);

module.exports = Application;