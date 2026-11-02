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


// Get all workers with filtering, sorting and pagination
exports.getWorkers = async (req, res) => {
    try {
        const {
            profession, availability, skills, minExperience, location,
            minRating, latitude, longitude, radius,
            sort = "newest", page = "1", limit = "10"
        } = req.query;

        const filter = {};
        const hasLatitude = latitude !== undefined;
        const hasLongitude = longitude !== undefined;

        const pageNumber = Number(page);
        const pageSize = Number(limit);

        if (!Number.isInteger(pageNumber) || pageNumber < 1 ||
            !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
            return res.status(400).json({
                success: false,
                message: "page must be positive and limit must be between 1 and 50"
            });
        }

        // Escape user input so search terms are treated as plain text.
        const escapeRegex = (value) =>
            value.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");

        if (profession?.trim()) {
            filter.profession = {
                $regex: `^${escapeRegex(profession.trim())}$`,
                $options: "i"
            };
        }

        if (availability !== undefined) {
            if (!["true", "false"].includes(availability)) {
                return res.status(400).json({
                    success: false,
                    message: "availability must be true or false"
                });
            }
            filter.availability = availability === "true";
        }

        if (skills !== undefined) {
            const skillList = skills.split(",").map(s => s.trim()).filter(Boolean);
            if (!skillList.length) {
                return res.status(400).json({
                    success: false,
                    message: "Provide at least one valid skill"
                });
            }
            filter.skills = {
                $in: skillList.map(s => new RegExp(escapeRegex(s), "i"))
            };
        }

        if (minExperience !== undefined) {
            const value = Number(minExperience);
            if (!Number.isFinite(value) || value < 0) {
                return res.status(400).json({
                    success: false,
                    message: "minExperience must be a non-negative number"
                });
            }
            filter.experience = { $gte: value };
        }

        if (minRating !== undefined) {
            const value = Number(minRating);
            if (!Number.isFinite(value) || value < 0 || value > 5) {
                return res.status(400).json({
                    success: false,
                    message: "minRating must be between 0 and 5"
                });
            }
            filter.rating = { $gte: value };
        }

        if (location?.trim()) {
            filter["location.address"] = {
                $regex: escapeRegex(location.trim()),
                $options: "i"
            };
        }

        if (hasLatitude !== hasLongitude) {
            return res.status(400).json({
                success: false,
                message: "Both latitude and longitude are required"
            });
        }

        const findFilter = { ...filter };
        const countFilter = { ...filter };
        let radiusInKm = null;

        if (hasLatitude && hasLongitude) {
            const lat = Number(latitude);
            const lng = Number(longitude);
            radiusInKm = Number(radius === undefined ? 10 : radius);

            if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
                !Number.isFinite(lng) || lng < -180 || lng > 180) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid latitude or longitude"
                });
            }

            if (!Number.isFinite(radiusInKm) || radiusInKm <= 0 || radiusInKm > 100) {
                return res.status(400).json({
                    success: false,
                    message: "radius must be greater than 0 and at most 100 km"
                });
            }

            const coordinates = [lng, lat];

            // $near returns workers ordered by distance.
            findFilter.location = {
                $near: {
                    $geometry: { type: "Point", coordinates },
                    $maxDistance: radiusInKm * 1000
                }
            };

            // Use $geoWithin for the total count; countDocuments
            // does not support the $near operator.
            countFilter.location = {
                $geoWithin: {
                    $centerSphere: [coordinates, radiusInKm / 6378.1]
                }
            };
        }

        const sortOptions = {
            newest: { createdAt: -1 },
            rating: { rating: -1, completedJobs: -1 },
            experience: { experience: -1 },
            "experience-asc": { experience: 1 },
            jobs: { completedJobs: -1, rating: -1 }
        };

        if (sort === "nearest" && !hasLatitude) {
            return res.status(400).json({
                success: false,
                message: "Coordinates are required to sort by nearest"
            });
        }

        if (!["nearest", ...Object.keys(sortOptions)].includes(sort)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sort option"
            });
        }

        let query = Worker.find(findFilter)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize);

        // MongoDB $near already sorts by distance.
        if (sort !== "nearest") query = query.sort(sortOptions[sort]);

        const [workers, totalWorkers] = await Promise.all([
            query,
            Worker.countDocuments(countFilter)
        ]);

        res.status(200).json({
            success: true,
            count: workers.length,
            totalWorkers,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalWorkers / pageSize),
                pageSize,
                hasNextPage: pageNumber * pageSize < totalWorkers,
                hasPreviousPage: pageNumber > 1
            },
            filters: {
                profession: profession || null,
                availability: availability ?? null,
                skills: skills || null,
                minExperience: minExperience ?? null,
                minRating: minRating ?? null,
                location: location || null,
                radius: radiusInKm,
                sort
            },
            workers
        });
    } catch (error) {
        console.error("getWorkers error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to retrieve workers"
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