// Import required packages
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// Import the Mongoose models
const GlobalConfig = require('./models/globalConfigModel');
const ImageList = require('./models/imageListModel');
const Image = require('./models/imageModel');

// Load environment variables from .env file
dotenv.config();

// Import the unified API routes
const apiRoutes = require('./routes/apiRoutes'); // <-- Use the unified routes

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---
// Enable CORS for all origins (simplest setup for development)
app.use(cors());
// Enable parsing of JSON in request bodies
app.use(express.json());
// Serve static files from the 'userImages' directory
app.use('/userImages', express.static(path.join(__dirname, 'userImages')));


// --- Startup Tasks Function (Cleanup & Seeding) ---
const runStartupTasks = async () => {
    try {
        // --- Part 1: Clean up old weather files ---
        const weatherDir = 'weather';
        console.log(`🧹 Cleaning up old files in '${weatherDir}' directory...`);
        try {
            await fs.mkdir(weatherDir, { recursive: true });
            const files = await fs.readdir(weatherDir);
            const deletionPromises = files
                .filter(file => path.extname(file) === '.json')
                .map(file => fs.unlink(path.join(weatherDir, file)));
            await Promise.all(deletionPromises);
            console.log(deletionPromises.length > 0 ? `   - Deleted ${deletionPromises.length} JSON file(s).` : `   - No JSON files found to delete.`);
        } catch (cleanupErr) {
            console.warn(`   - Could not clean up weather directory: ${cleanupErr.message}`);
        }

        // --- Part 2: Seed the database if it's empty ---
        const configExists = await GlobalConfig.countDocuments() > 0;
        if (configExists) {
            console.log('✅ Config already exists. Skipping database seed.');
            return;
        }

        console.log('🌱 No data found. Seeding the database with default values...');

        // 1. Create default images
        const image1 = new Image({ url: 'https://placehold.co/1280x720/1a1a1a/ffffff?text=Image+One', credit: 'First placeholder image', duration: 5 });
        const image2 = new Image({ url: 'https://placehold.co/1280x720/333333/ffffff?text=Image+Two', credit: 'Second placeholder image', duration: 10 });
        await image1.save();
        await image2.save();
        console.log('   - Default images created.');

        // 2. Create a default image list and link the images
        console.log('   - Creating default image list...');
        const defaultImageList = new ImageList({ name: 'Default', images: [image1._id, image2._id] });
        await defaultImageList.save();
        console.log('   - Default image list created.');

        // 3. Create the global config
        const defaultConfig = new GlobalConfig({ /* Default values are set in the schema */ });
        await defaultConfig.save();
        console.log('   - Global config created.');

        console.log('✅ Database seeded successfully.');

    } catch (err) {
        console.warn('Error during startup tasks:', err);
    }
};

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB.');
        runStartupTasks(); // Run seeding etc. after connection
    })
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });

// --- API Routes ---
// Mount the unified API routes under the /api prefix
app.use('/api', apiRoutes); // <-- Mount the unified routes


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});

