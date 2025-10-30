// Import required packages
const express = require('express');
const router = express.Router();
const multer = require('multer'); // For handling file uploads
const fs = require('fs').promises; // For file system operations (import/export)
const path = require('path');     // For handling file paths

// Import models
const GlobalConfig = require('../models/globalConfigModel');
const ImageList = require('../models/imageListModel');
const Image = require('../models/imageModel');

// Import weather functions (assuming weather.js is in the root backend folder)
const { fetchWeatherData, writeWeatherData, getSnowfallTotal } = require('../weather');

// --- Multer Configuration for File Uploads ---
// Ensure the upload directory exists
const uploadDir = path.join(__dirname, '..', 'userImages'); // Path relative to routes dir
fs.mkdir(uploadDir, { recursive: true }).catch(console.error); // Create dir if not exists

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Save files to userImages directory
    },
    filename: function (req, file, cb) {
        // Create a unique filename: timestamp-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// =============================================================================
// == DISPLAY API ROUTES (Public Facing)
// =============================================================================

// @route   GET /api/display/data
// @desc    Get the combined active display configuration
router.get('/display/data', async (req, res) => {
    try {
        const globalConfig = await GlobalConfig.findOne({});
        let imageList;

        if (globalConfig?.activeSlideshowId) {
            imageList = await ImageList.findById(globalConfig.activeSlideshowId).populate('images');
        } else {
            imageList = await ImageList.findOne({ name: 'Default' }).populate('images');
        }

        if (!globalConfig) return res.status(404).json({ msg: 'Global configuration not found.' });
        if (!imageList) return res.status(404).json({ msg: 'Slideshow not found.' });

        // Fetch and update weather data before sending
        try {
            const weatherData = await fetchWeatherData(globalConfig);
            if (weatherData && weatherData.current) {
                globalConfig.condition = weatherData.current.condition?.text || 'N/A';
                globalConfig.windDir = weatherData.current.wind_dir || 'N/A';
                globalConfig.windDegree = weatherData.current.wind_degree || 0;
                globalConfig.humid = weatherData.current.humidity || 0;

                if(globalConfig.unitSystem === "metric") {
                    globalConfig.visibility = weatherData.current.vis_km || 0;
                    globalConfig.temp = weatherData.current.temp_c || 0;
                    globalConfig.windChill = weatherData.current.feelslike_c || 0;
                    globalConfig.windSpeed = weatherData.current.wind_kph || 0;
                } else {
                    globalConfig.visibility = weatherData.current.vis_miles || 0;
                    globalConfig.temp = weatherData.current.temp_f || 0;
                    globalConfig.windChill = weatherData.current.feelslike_f || 0;
                    globalConfig.windSpeed = weatherData.current.wind_mph || 0;
                }
            }
            const total = await getSnowfallTotal();
            globalConfig.snowTotal = total || 0;
            writeWeatherData(weatherData, globalConfig);
        } catch (weatherError) {
            console.warn("Could not fetch or update weather data:", weatherError.message);
            // Don't fail the whole request, just send potentially stale weather data
        }

        res.json({ globalConfig, imageList });
    } catch (err) {
        console.error("Error fetching display data:", err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;

