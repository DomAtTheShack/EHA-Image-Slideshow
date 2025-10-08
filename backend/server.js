// Import required packages
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const Config = require('./models/configModel');

// Load environment variables from .env file
dotenv.config();

// Import routes
const displayRoutes = require('./routes/displayRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---
// Enable Cross-Origin Resource Sharing
app.use(cors());
// Enable parsing of JSON in request bodies
app.use(express.json());

// --- Helper function to create a default configuration if none exists ---
// This is useful for the very first time the app is run with a new database.
const seedDefaultConfig = async () => {
    try {
        const existingConfig = await Config.findOne();
        if (!existingConfig) {
            console.log('No config found. Seeding the database with a default one...');
            const defaultConfig = new Config({
                name: 'Default Display Config',
                title: 'Welcome!',
                images: [
                    {
                        url: 'https://placehold.co/1280x720/1a1a1a/ffffff?text=Setup+Complete!',
                        credit: 'Please add your images in the admin panel.'
                    }
                ]
            });
            await defaultConfig.save();
            console.log('Default config created successfully.');
        } else {
            console.log('Existing config found. Skipping seed.');
        }
    } catch (err) {
        console.error('Error seeding default config:', err);
    }
};


// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB.');
        // Once connected, we can check if we need to seed the database.
        seedDefaultConfig();
    })
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });

// --- API Routes ---
// All routes related to the display will be prefixed with /api/display
app.use('/api/display', displayRoutes);


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});

