// Import required packages
const express = require('express');
const router = express.Router();

// Import all the models we need
const GlobalConfig = require('../models/globalConfigModel');
const ImageList = require('../models/imageListModel');
const Image = require('../models/imageModel');
const { fetchWeatherData } = require('../weather'); // Assuming weather logic is in weather.js

// ===================================================================================
// == DISPLAY-FACING ROUTES (for the public slideshow)
// ===================================================================================

// @route   GET /api/display/data
// @desc    Get the combined active display configuration for the frontend
router.get('/display/data', async (req, res) => {
    try {
        const globalConfig = await GlobalConfig.findOne({});
        const imageList = await ImageList.findOne({ name: 'Default' }).populate('images');

        if (!globalConfig || !imageList) {
            return res.status(404).json({ msg: 'Configuration or default image list not found.' });
        }

        // Fetch latest weather data and update the config object before sending
        const weatherData = await fetchWeatherData(globalConfig);
        if (weatherData && weatherData.current) {
            globalConfig.condition = weatherData.current.condition.text;
            globalConfig.windDir = weatherData.current.wind_dir;
            globalConfig.windDegree = weatherData.current.wind_degree;
            globalConfig.precipitation = (globalConfig.unitSystem === "metric") ? weatherData.current.precip_mm : weatherData.current.precip_in;
            globalConfig.temp = (globalConfig.unitSystem === "metric") ? weatherData.current.temp_c : weatherData.current.temp_f;
            globalConfig.windChill = (globalConfig.unitSystem === "metric") ? weatherData.current.feelslike_c : weatherData.current.feelslike_f;
            globalConfig.windSpeed = (globalConfig.unitSystem === "metric") ? weatherData.current.wind_kph : weatherData.current.wind_mph;
        }

        res.json({ globalConfig, imageList });

    } catch (err) {
        console.error('Error in /api/display/data:', err.message);
        res.status(500).send('Server Error');
    }
});


// ===================================================================================
// == ADMIN PANEL ROUTES (for the configuration UI)
// ===================================================================================

// @route   GET /api/admin/data
// @desc    Get all data needed for the admin panel
router.get('/admin/data', async (req, res) => {
    try {
        const [globalConfig, imageLists, images] = await Promise.all([
            GlobalConfig.findOne({}),
            ImageList.find({}).populate('images').sort({ name: 1 }),
            Image.find({}).sort({ createdAt: -1 })
        ]);
        res.json({ globalConfig, imageLists, images });
    } catch (err) {
        console.error('Error in /api/admin/data:', err.message);
        res.status(500).send('Server Error');
    }
});

// --- Global Config Management ---
// @route   PUT /api/admin/global-config
// @desc    Update the global configuration
router.put('/admin/global-config', async (req, res) => {
    try {
        const updatedConfig = await GlobalConfig.findOneAndUpdate({}, req.body, { new: true });
        res.json(updatedConfig);
    } catch (err) {
        console.error('Error updating global config:', err.message);
        res.status(500).send('Server Error');
    }
});

// --- Image Library Management ---
// @route   POST /api/admin/images
// @desc    Add a new image to the library
router.post('/admin/images', async (req, res) => {
    try {
        const newImage = new Image(req.body);
        await newImage.save();
        res.status(201).json(newImage);
    } catch (err) {
        console.error('Error creating image:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/images/:id
// @desc    Update an existing image's details
router.put('/admin/images/:id', async (req, res) => {
    try {
        const updatedImage = await Image.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedImage) return res.status(404).json({ msg: 'Image not found' });
        res.json(updatedImage);
    } catch (err) {
        console.error('Error updating image:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/admin/images/:id
// @desc    Delete an image from the library
router.delete('/admin/images/:id', async (req, res) => {
    try {
        // First, remove the image reference from all image lists
        await ImageList.updateMany({}, { $pull: { images: req.params.id } });
        // Then, delete the image document itself
        const deletedImage = await Image.findByIdAndDelete(req.params.id);
        if (!deletedImage) return res.status(404).json({ msg: 'Image not found' });
        res.json({ msg: 'Image deleted successfully' });
    } catch (err) {
        console.error('Error deleting image:', err.message);
        res.status(500).send('Server Error');
    }
});

// --- Image List Management ---
// @route   PUT /api/admin/image-lists/:id
// @desc    Update an image list (e.g., add/remove images)
router.put('/admin/image-lists/:id', async (req, res) => {
    try {
        const updatedList = await ImageList.findByIdAndUpdate(
            req.params.id,
            { images: req.body.images }, // Only update the images array
            { new: true }
        ).populate('images');
        if (!updatedList) return res.status(404).json({ msg: 'Image list not found' });
        res.json(updatedList);
    } catch (err) {
        console.error('Error updating image list:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

