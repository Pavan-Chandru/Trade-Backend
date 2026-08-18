const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        workerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Worker",
            required: true
        },

        service: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        location: {
            address: {
                type: String,
                required: true
            },
            latitude: {
                type: Number
            },
            longitude: {
                type: Number
            }
        },

        scheduledDate: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: [
                "pending",
                "accepted",
                "rejected",
                "in_progress",
                "completed",
                "cancelled"
            ],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;