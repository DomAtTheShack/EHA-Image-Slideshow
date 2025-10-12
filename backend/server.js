// Import required packages using CommonJS 'require' syntax
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs').promises; // For filesystem operations
const path = require('path');



// Import the Mongoose models
const GlobalConfig = require('./models/globalConfigModel');
const ImageList = require('./models/imageListModel');
const Image = require('./models/imageModel');

// Load environment variables from .env file
dotenv.config();

// Import routes
const displayRoutes = require('./routes/displayRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Startup Tasks Function (Cleanup & Seeding) ---
const runStartupTasks = async () => {
    try {
        // --- Part 1: Clean up old weather files ---
        const weatherDir = 'weather';
        console.log(`🧹 Cleaning up old files in '${weatherDir}' directory...`);

        // Ensure the directory exists to avoid errors on the very first run
        await fs.mkdir(weatherDir, { recursive: true });
        const files = await fs.readdir(weatherDir);

        // Create a list of promises to delete all JSON files in parallel
        const deletionPromises = files
            .filter(file => path.extname(file) === '.json')
            .map(file => fs.unlink(path.join(weatherDir, file)));

        await Promise.all(deletionPromises);

        if (deletionPromises.length > 0) {
            console.log(`   - Deleted ${deletionPromises.length} JSON file(s).`);
        } else {
            console.log(`   - No JSON files found to delete.`);
        }


        // --- Part 2: Seed the database if it's empty ---
        const configExists = await GlobalConfig.countDocuments() > 0;
        if (configExists) {
            console.log('✅ Config already exists. Skipping database seed.');
            return;
        }

        console.log('🌱 No data found. Seeding the database with default values...');

        // 1. Create default images
        const image1 = new Image({
            url: 'https://placehold.co/1280x720/1a1a1a/ffffff?text=Image+One',
            credit: 'First placeholder image',
            duration: 5
        });
        const image2 = new Image({
            url: 'https://placehold.co/1280x720/333333/ffffff?text=Image+Two',
            credit: 'Second placeholder image',
            duration: 10
        });
        await image1.save();
        await image2.save();
        console.log('   - Default images created.');

        // 2. Create a default image list and link the images
        console.log('   - Creating default image list...');
        const defaultImageList = new ImageList({
            name: 'Default',
            images: [image1._id, image2._id]
        });
        await defaultImageList.save();
        console.log('   - Default image list created.');

        // 3. Create the global config
        const defaultConfig = new GlobalConfig({
            name: 'Default Display Config',
            title: 'Welcome!',
            globalSlideDuration: 7,
            weatherLocation: "Houghton, MI",
            location: "MTU",
            timeFormat: "12hr",
            unitSystem: "metric",
            temp: 20,
            condition: "Clear",
            precipitation: 0,
            windSpeed: 0,
            windChill: 0,
            windDir: "N",
            windDegree: 0
        });
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
        // Once connected, run the startup tasks.
        runStartupTasks();
    })
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });

// --- API Routes ---
app.use('/api/display', displayRoutes);

// Serve static React build files
app.use('/config', express.static(path.join(__dirname, 'config-ui', 'build')));

// Fallback route so React Router works:
app.get('/config/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'config-ui', 'build', 'index.html'));
});


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});

