// Import required packages using CommonJS 'require' syntax
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

// Import the single, unified API route file
const apiRoutes = require('./routes/apiRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---

// Use the CORS middleware.
// For development, app.use(cors()) is the simplest way to allow all cross-origin requests.
// For production, you would configure it with specific origins for security.
app.use(cors());


app.use(express.json());

// --- Startup Tasks Function (Cleanup & Seeding) ---
const runStartupTasks = async () => {
    try {
        // Clean up old weather files
        const weatherDir = 'weather';
        await fs.mkdir(weatherDir, { recursive: true });
        const files = await fs.readdir(weatherDir);
        const deletionPromises = files
            .filter(file => path.extname(file) === '.json')
            .map(file => fs.unlink(path.join(weatherDir, file)));
        await Promise.all(deletionPromises);

        // Seed the database if it's empty
        const configExists = await GlobalConfig.countDocuments() > 0;
        if (configExists) {
            console.log('✅ Config already exists. Skipping database seed.');
            return;
        }

        console.log('🌱 No data found. Seeding the database...');
        const image1 = new Image({ url: 'https://placehold.co/1280x720/1a1a1a/ffffff?text=Image+One', credit: 'First placeholder', duration: 5 });
        const image2 = new Image({ url: 'https://placehold.co/1280x720/333333/ffffff?text=Image+Two', credit: 'Second placeholder', duration: 10 });
        await image1.save();
        await image2.save();

        const defaultImageList = new ImageList({ name: 'Default', images: [image1._id, image2._id] });
        await defaultImageList.save();

        const defaultConfig = new GlobalConfig({ name: 'Default Display Config', title: 'Welcome!', globalSlideDuration: 7, weatherLocation: "Houghton, MI", timeFormat: "12hr", unitSystem: "metric" });
        await defaultConfig.save();
        console.log('✅ Database seeded successfully.');

    } catch (err) {
        console.warn('Error during startup tasks:', err);
    }
};

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB.');
        runStartupTasks();
    })
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });

// --- API Routes ---
// Use the single router for all API endpoints
app.use('/api', apiRoutes);

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});

