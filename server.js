const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const workerRoutes = require("./routes/workerRoutes");
const jobRoutes = require("./routes/jobRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Server body:", req.body);
    next();
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/jobs", jobRoutes);

app.get("/", (req, res) => {
    res.send("Trade Backend API is running");
});

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
};

startServer();