// Import required packages and models
const express = require('express');
const router = express.Router();
const GlobalConfig = require('../models/globalConfigModel');
const ImageList = require('../models/imageListModel');
const Image = require('../models/imageModel');
const { fetchWeatherData } = require('../weather.js');

// ===================================================================================
// == DISPLAY-FACING ROUTES
// ===================================================================================

// @route   GET /api/display/data
// @desc    Get the combined active display configuration for the public-facing screen.
router.get('/display/data', async (req, res) => {
    try {
        const globalConfig = await GlobalConfig.findOne({});
        const imageList = await ImageList.findOne({ name: 'Default' }).populate('images');

        if (!globalConfig || !imageList) {
            return res.status(404).json({ msg: 'Configuration not found.' });
        }

        // Fetch fresh weather data and inject it into the response
        const weatherData = await fetchWeatherData(globalConfig);
        if (weatherData && weatherData.current) {
            globalConfig.condition = weatherData.current.condition.text;
            globalConfig.windDir = weatherData.current.wind_dir;
            globalConfig.windDegree = weatherData.current.wind_degree;
            if (globalConfig.unitSystem === "metric") {
                globalConfig.precipitation = weatherData.current.precip_mm;
                globalConfig.temp = weatherData.current.temp_c;
                globalConfig.windChill = weatherData.current.feelslike_c;
                globalConfig.windSpeed = weatherData.current.wind_kph;
            } else {
                globalConfig.precipitation = weatherData.current.precip_in;
                globalConfig.temp = weatherData.current.temp_f;
                globalConfig.windChill = weatherData.current.feelslike_f;
                globalConfig.windSpeed = weatherData.current.wind_mph;
            }
        }

        res.json({ globalConfig, imageList });
    } catch (err) {
        console.error('Error fetching display data:', err.message);
        res.status(500).send('Server Error');
    }
});


// ===================================================================================
// == ADMIN PANEL ROUTES
// ===================================================================================

// @route   GET /api/admin/data
// @desc    Get all data needed for the admin panel.
router.get('/admin/data', async (req, res) => {
    try {
        const [globalConfig, imageLists, images] = await Promise.all([
            GlobalConfig.findOne({}),
            ImageList.find({}).populate('images').sort({ name: 1 }),
            Image.find({}).sort({ createdAt: -1 })
        ]);
        res.json({ globalConfig, imageLists, images });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch admin data' });
    }
});

// --- Global Config ---
// @route   PUT /api/admin/global-config
// @desc    Update the global configuration.
router.put('/admin/global-config', async (req, res) => {
    try {
        const updatedConfig = await GlobalConfig.findOneAndUpdate({}, req.body, { new: true });
        res.json(updatedConfig);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update global config' });
    }
});

// --- Images ---
// @route   POST /api/admin/images
// @desc    Add a new image to the library.
router.post('/admin/images', async (req, res) => {
    try {
        const newImage = new Image(req.body);
        await newImage.save();
        res.status(201).json(newImage);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add new image' });
    }
});

// @route   PUT /api/admin/images/:id
// @desc    Update an existing image.
router.put('/admin/images/:id', async (req, res) => {
    try {
        const updatedImage = await Image.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedImage);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update image' });
    }
});

// @route   DELETE /api/admin/images/:id
// @desc    Delete an image from the library.
router.delete('/admin/images/:id', async (req, res) => {
    try {
        // Also remove this image's ID from any lists it's in
        await ImageList.updateMany({}, { $pull: { images: req.params.id } });
        await Image.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Image deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

// --- Image Lists (Slideshows) ---
// @route   POST /api/admin/image-lists
// @desc    Create a new, empty image list.
router.post('/admin/image-lists', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'List name is required.' });
        const newList = new ImageList({ name, images: [] });
        await newList.save();
        res.status(201).json(newList);
    } catch(err) {
        res.status(500).json({ error: 'Failed to create new image list.' });
    }
});

// @route   PUT /api/admin/image-lists/:id
// @desc    Update an image list (e.g., reorder, add, remove images).
router.put('/admin/image-lists/:id', async (req, res) => {
    try {
        const updatedList = await ImageList.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('images');
        res.json(updatedList);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update image list' });
    }
});

// @route   DELETE /api/admin/image-lists/:id
// @desc    Delete an image list.
router.delete('/admin/image-lists/:id', async (req, res) => {
    try {
        const list = await ImageList.findById(req.params.id);
        if (list.name === 'Default') {
            return res.status(400).json({ error: 'Cannot delete the "Default" slideshow.' });
        }
        await ImageList.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Image list deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete image list.' });
    }
});


// --- Import / Export ---
// @route   GET /api/admin/export
// @desc    Export all database content as a single JSON object.
router.get('/admin/export', async (req, res) => {
    try {
        const [globalConfig, imageLists, images] = await Promise.all([
            GlobalConfig.find(),
            ImageList.find(),
            Image.find()
        ]);
        res.json({ globalConfig, imageLists, images });
    } catch (err) {
        res.status(500).json({ error: 'Failed to export data.' });
    }
});

// @route   POST /api/admin/import
// @desc    Import a JSON file to completely overwrite the database.
router.post('/admin/import', async (req, res) => {
    const { globalConfig, imageLists, images } = req.body;
    try {
        // Clear existing collections
        await GlobalConfig.deleteMany({});
        await ImageList.deleteMany({});
        await Image.deleteMany({});

        // Insert new data
        // Note: This simple import assumes IDs are not preserved. A more complex
        // system would map old IDs to new ones, but this is robust for backups.
        await GlobalConfig.insertMany(globalConfig);
        await Image.insertMany(images);
        await ImageList.insertMany(imageLists);

        res.json({ msg: 'Data imported successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to import data.' });
    }
});


module.exports = router;

