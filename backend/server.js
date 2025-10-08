// Import required packages
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');

// --- Import all models ---
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

// --- Helper function to seed the database with defaults ---
const seedDefaultData = async () => {
    try {
        // Check if a global config already exists
        const existingGlobalConfig = await GlobalConfig.findOne();
        if (existingGlobalConfig) {
            console.log('✅ Existing data found. Skipping database seed.');
            return;
        }

        console.log('🌱 No data found. Seeding the database with default values...');

        // 1. Create some default individual images
        const image1 = new Image({
            url: 'https://placehold.co/1280x720/1a1a1a/ffffff?text=Image+One',
            credit: 'First slide',
            duration: 5 // 5 seconds
        });
        const image2 = new Image({
            url: 'https://placehold.co/1280x720/4a4a4a/ffffff?text=Image+Two',
            credit: 'Second slide' // This will use the global duration
        });
        await image1.save();
        await image2.save();
        console.log('...Default images created.');

        // 2. Create a default image list that uses the images we just made
        console.log("...Attempting to create ImageList with name: 'Default'"); // Added for debugging
        const defaultImageList = new ImageList({
            name: 'Default', // This line ensures the 'name' path is provided
            images: [image1._id, image2._id] // Link to the images by their IDs
        });
        await defaultImageList.save();
        console.log('...Default image list created successfully.');

        // 3. Create the main global config
        const defaultGlobalConfig = new GlobalConfig({
            name: 'Global Display Config',
            title: 'Welcome to the Display!',
            globalSlideDuration: 8,
            tempUnit: 'F'
        });
        await defaultGlobalConfig.save();
        console.log('...Default global config created.');
        console.log('Database seeding complete!');


    } catch (err) {
        console.error('Error during database seeding:', err);
    }
};

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB.');
        // Once connected, seed the database.
        seedDefaultData();
    })
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });

// --- API Routes ---
app.use('/api/display', displayRoutes);


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});

