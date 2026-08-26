const Worker = require("../models/Worker");

// Create Worker
exports.createWorker = async (req, res) => {
    try {
        // Check if user already has a worker profile
        const existingWorker = await Worker.findOne({
            userId: req.user.id
        });

        if (existingWorker) {
            return res.status(400).json({
                success: false,
                message: "Worker profile already exists"
            });
        }

        const worker = await Worker.create({
            ...req.body,
            userId: req.user.id
        });

        res.status(201).json({
            success: true,
            worker
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get All Workers
exports.getWorkers = async (req, res) => {
    try {
        const workers = await Worker.find();

        res.status(200).json({
            success: true,
            count: workers.length,
            workers
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get Worker by ID
exports.getWorkerById = async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id);

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }

        res.status(200).json({
            success: true,
            worker
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Update Worker
exports.updateWorker = async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id);

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }

        // Check ownership
        if (worker.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own worker profile"
            });
        }

        // Fields that worker is allowed to update
        const {
            name,
            profession,
            skills,
            experience,
            phone,
            about,
            profilePhoto,
            workPhotos,
            location,
            availability
        } = req.body;

        if (name !== undefined) worker.name = name;
        if (profession !== undefined) worker.profession = profession;
        if (skills !== undefined) worker.skills = skills;
        if (experience !== undefined) worker.experience = experience;
        if (phone !== undefined) worker.phone = phone;
        if (about !== undefined) worker.about = about;
        if (profilePhoto !== undefined) worker.profilePhoto = profilePhoto;
        if (workPhotos !== undefined) worker.workPhotos = workPhotos;
        if (location !== undefined) worker.location = location;
        if (availability !== undefined) worker.availability = availability;

        await worker.save();

        res.status(200).json({
            success: true,
            worker
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Delete Worker
exports.deleteWorker = async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id);

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }

        // Check ownership
        if (worker.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own worker profile"
            });
        }

        await worker.deleteOne();

        res.status(200).json({
            success: true,
            message: "Worker deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Worker Availability
exports.updateAvailability = async (req, res) => {
    try {
        const { availability } = req.body;

        // Validate availability
        if (typeof availability !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Availability must be true or false"
            });
        }

        // Find worker belonging to logged-in user
        const worker = await Worker.findOne({
            userId: req.user.id
        });

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker profile not found"
            });
        }

        worker.availability = availability;

        await worker.save();

        res.status(200).json({
            success: true,
            message: availability
                ? "You are now available"
                : "You are now unavailable",
            availability: worker.availability
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};