const express = require('express');
const router = express.Router();

// Import all the models we need
const { fetchWeatherData, writeWeatherData } = require('../weather.js');
const GlobalConfig = require('../models/globalConfigModel');
const ImageList = require('../models/imageListModel');
const BASE_WEATHER_API = "https://api.weatherapi.com/v1/current.json"

// @route   GET /api/display/data
// @desc    Get the combined active display configuration (global settings + an image list)
// @access  Public
router.get('/data', async (req, res) => {
    try {
        // --- Step 1: Fetch the single global configuration document ---
        const globalConfig = await GlobalConfig.findOne({});

        // --- Step 2: Fetch the 'Default' image list and populate its 'images' array ---
        // .populate('images') is the magic that replaces the ObjectIDs with the full image documents.
        const imageList = await ImageList.findOne({ name: 'Default' }).populate('images');

        // --- Error handling ---
        if (!globalConfig) {
            return res.status(404).json({ msg: 'Global configuration not found.' });
        }
        if (!imageList) {
            return res.status(404).json({ msg: 'Default image list not found.' });
        }

        // --- Step 3: Combine both results into a single object and send to the frontend ---
        const weatherData = await fetchWeatherData(globalConfig);

        globalConfig.condition = weatherData["current"]["condition"]["text"];
        globalConfig.windDir = weatherData["current"]["wind_dir"];
        globalConfig.windDegree = weatherData["current"]["wind_degree"];

        if(globalConfig.unitSystem === "metric") {
            globalConfig.precipitation = weatherData["current"]["precip_mm"];
            globalConfig.temp = weatherData["current"]["temp_c"];
            globalConfig.windChill = weatherData["current"]["feelslike_c"];
            globalConfig.windSpeed = weatherData["current"]["wind_kph"];
        }else{
            globalConfig.precipitation = weatherData["current"]["precip_in"];
            globalConfig.temp = weatherData["current"]["temp_f"];
            globalConfig.windChill = weatherData["current"]["feelslike_f"];
            globalConfig.windSpeed = weatherData["current"]["wind_mph"];
        }

        res.json({
            globalConfig,
            imageList
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/updateGlobalConfig', async (req, res) => {
    try {
        const globalConfig = await GlobalConfig.findOne({});
        if (!globalConfig) return res.status(404).json({ msg: 'Global config not found.' });
        if (!process.env.WEATHER_API_KEY) return res.status(500).json({ error: 'Weather API key missing.' });

        const weatherData = await fetchWeatherData(globalConfig);
        res.json(weatherData);
        writeWeatherData(weatherData, globalConfig);

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

