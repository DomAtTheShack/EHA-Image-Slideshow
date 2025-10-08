const express = require('express');
const router = express.Router();
const Config = require('../models/configModel'); // Use the new Config model

// A helper function to create a default configuration if none exists.
// This is useful for the very first time the app is run.
const seedDefaultConfig = async () => {
    try {
        const existingConfig = await Config.findOne();
        if (!existingConfig) {
            console.log('No config found. Creating a default one...');
            const defaultConfig = new Config({
                name: 'Default Display Config',
                title: 'Welcome!',
                images: [
                    { url: 'https://placehold.co/1280x720/1a1a1a/ffffff?text=Setup+Complete!', credit: 'Please add images in the admin panel.' }
                ]
            });
            await defaultConfig.save();
            console.log('Default config created successfully.');
        }
    } catch (err) {
        console.error('Error seeding default config:', err);
    }
};

// Call the seed function once when the server starts up.
seedDefaultConfig();

// @route   GET /api/display/config
// @desc    Get the active display configuration
// @access  Public
router.get('/config', async (req, res) => {
    try {
        // We find the first configuration document available.
        // In this application, you'll likely only ever have one.
        const config = await Config.findOne({});

        if (!config) {
            return res.status(404).json({ msg: 'Configuration not found.' });
        }

        // We now return the entire config object. The frontend will handle the rest.
        res.json(config);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;


