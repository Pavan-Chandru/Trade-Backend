require("dotenv").config();

const mongoose = require("mongoose");

const migrateWorkers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const workersCollection =
            mongoose.connection.collection("workers");

        const workers = await workersCollection
            .find({})
            .toArray();

        console.log(`Found ${workers.length} workers`);

        for (const worker of workers) {

            const oldLocation = worker.location;

            // Worker already has valid GeoJSON coordinates
            if (
                oldLocation &&
                oldLocation.coordinates &&
                oldLocation.coordinates.length === 2
            ) {
                console.log(`Already migrated: ${worker.name}`);
                continue;
            }

            // Old latitude/longitude format
            if (
                oldLocation &&
                oldLocation.latitude !== undefined &&
                oldLocation.longitude !== undefined
            ) {
                const latitude = oldLocation.latitude;
                const longitude = oldLocation.longitude;

                await workersCollection.updateOne(
                    { _id: worker._id },
                    {
                        $set: {
                            "location.type": "Point",
                            "location.coordinates": [
                                longitude,
                                latitude
                            ]
                        },
                        $unset: {
                            "location.latitude": "",
                            "location.longitude": ""
                        }
                    }
                );

                console.log(`Migrated: ${worker.name}`);
            }

            // No coordinates available
            else {
                await workersCollection.updateOne(
                    { _id: worker._id },
                    {
                        $unset: {
                            location: ""
                        }
                    }
                );

                console.log(
                    `Removed invalid location: ${worker.name}`
                );
            }
        }

        // Create 2dsphere index
        await workersCollection.createIndex({
            location: "2dsphere"
        });

        console.log("2dsphere index created");

        console.log("Migration completed successfully");

        await mongoose.connection.close();

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrateWorkers();