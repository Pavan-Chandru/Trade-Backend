const Worker = require("../models/Worker");

// Create Worker
exports.createWorker = async (req, res) => {
    try {
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

        Object.assign(worker, req.body);

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