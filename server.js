const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const Worker = require("./models/Worker");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Prevent Mongoose from queuing queries if disconnected
mongoose.set("bufferCommands", false);

// -------------------- ROUTES --------------------

// Home route
app.get("/", (req, res) => {
    res.send("Trade Backend API is running");
});

// Get all workers
app.get("/api/workers", async (req, res) => {
    try {
        const workers = await Worker.find();
        res.json(workers);
    } catch (error) {
        res.status(500).json({
            message: "Database query failed",
            error: error.message
        });
    }
});

// Create a new worker
app.post("/api/workers", async (req, res) => {
    try {
        const worker = await Worker.create(req.body);
        res.status(201).json(worker);
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});

// -------------------- DATABASE + SERVER --------------------

const startServer = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing from environment variables (.env)");
        }

        console.log("Connecting to MongoDB...");
        
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // Fail after 5 seconds instead of waiting indefinitely
        });

        console.log("MongoDB connected successfully");
        console.log("MongoDB connected successfully");
        console.log("Mongoose state:", mongoose.connection.readyState);
        console.log("Database:", mongoose.connection.name);
        console.log("Host:", mongoose.connection.host);

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Critical MongoDB connection error:", error.message);
        // Exit process on connection failure so Express doesn't run with a broken DB connection
        process.exit(1); 
    }
};

startServer();