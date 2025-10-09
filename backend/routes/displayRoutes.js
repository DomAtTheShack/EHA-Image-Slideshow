const express = require('express');
const router = express.Router();

// Import all the models we need
const GlobalConfig = require('../models/globalConfigModel');
const ImageList = require('../models/imageListModel');

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
    try {
        // --- Step 1: Fetch the single global configuration document ---
        const globalConfig = await GlobalConfig.findOne({});


        // --- Error handling ---
        if (!globalConfig) {
            return res.status(404).json({ msg: 'Global configuration not found.' });
        }

        res.json(globalConfig);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

