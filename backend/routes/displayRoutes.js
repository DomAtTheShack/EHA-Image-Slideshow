const express = require('express');
const router = express.Router();
const { writeFileSync, readFileSync } = require('fs');
3
// Import all the models we need
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

    // --- Step 1: Fetch the single global configuration document ---
        const globalConfig = await GlobalConfig.findOne({});

        // --- Error handling ---
        if (!globalConfig) {
            return res.status(404).json({msg: 'Global configuration not found.'});
        }
        if (!process.env.WEATHER_API_KEY) {
            return res.status(500).json({error: 'Weather API key is not configured on the server.'});
        }

    const today = new Date();

        try {
            const url = new URL(BASE_WEATHER_API);
            const params = {
                key: process.env.WEATHER_API_KEY,
                q: globalConfig.get('weatherLocation').replace(' ', ''),
                aqi: 'yes',
            };

            url.search = new URLSearchParams(params).toString();

            const response = await fetch(url);
            if (!response.ok) {
                // If the API returns an error, pass it along
                throw new Error(`Weather API error! status: ${response.status}`);
            }

            const dateString = today.toDateString();
            const filename = globalConfig.get('weatherLocation') + " " + dateString + " " + today.getHours() + "hr";

            // Parse the JSON data from the successful response
            const weatherData = await response.json();
            const jsonString = JSON.stringify(weatherData, null, 2);

            writeFileSync(`weather/${filename}.json`, jsonString);

            // Send the weather data back to the client
            res.json(weatherData);

        } catch (error) {
            // If anything goes wrong, log it and send an error response
            console.error('Error fetching weather data:', error.message);
            res.status(500).json({error: 'Failed to fetch weather data.'});
        }
});

module.exports = router;

