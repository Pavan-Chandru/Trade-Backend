const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema(
    {   

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
      },
        name: {
            type: String,
            required: true
        },

        profession: {
            type: String,
            required: true
        },

        skills: {
            type: [String],
            default: []
        },

        experience: {
            type: Number,
            default: 0
        },

        phone: {
            type: String,
            required: true
        },

        about: {
            type: String,
            default: ""
        },

        profilePhoto: {
            type: String,
            default: ""
        },

        workPhotos: {
            type: [String],
            default: []
        },

        location: {
    address: {
        type: String,
        default: ""
    },

    type: {
        type: String,
        enum: ["Point"],
        default: "Point"
    },

    coordinates: {
        type: [Number],
        default: [0, 0]
    }
},

        availability: {
            type: Boolean,
            default: true
        },

        rating: {
            type: Number,
            default: 0
        },

        completedJobs: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

workerSchema.index({ location: "2dsphere" });

const Worker = mongoose.model("Worker", workerSchema);

module.exports = Worker;