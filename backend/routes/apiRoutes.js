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
const { fetchWeatherData } = require('../weather.js');

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
        const imageList = await ImageList.findOne({ name: 'Default' }).populate('images');

        if (!globalConfig) return res.status(404).json({ msg: 'Global configuration not found.' });
        if (!imageList) return res.status(404).json({ msg: 'Default image list not found.' });

        // Fetch and update weather data before sending
        try {
            const weatherData = await fetchWeatherData(globalConfig);
            if (weatherData && weatherData.current) {
                globalConfig.condition = weatherData.current.condition?.text || 'N/A';
                globalConfig.windDir = weatherData.current.wind_dir || 'N/A';
                globalConfig.windDegree = weatherData.current.wind_degree || 0;

                if(globalConfig.unitSystem === "metric") {
                    globalConfig.precipitation = weatherData.current.precip_mm || 0;
                    globalConfig.temp = weatherData.current.temp_c || 0;
                    globalConfig.windChill = weatherData.current.feelslike_c || 0;
                    globalConfig.windSpeed = weatherData.current.wind_kph || 0;
                } else {
                    globalConfig.precipitation = weatherData.current.precip_in || 0;
                    globalConfig.temp = weatherData.current.temp_f || 0;
                    globalConfig.windChill = weatherData.current.feelslike_f || 0;
                    globalConfig.windSpeed = weatherData.current.wind_mph || 0;
                }
            }
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


// =============================================================================
// == ADMIN API ROUTES (For Configuration UI)
// =============================================================================

// @route   GET /api/admin/data
// @desc    Get all data needed for the admin panel
router.get('/admin/data', async (req, res) => {
    try {
        const globalConfig = await GlobalConfig.findOne({});
        const imageLists = await ImageList.find({}).populate('images'); // Populate images for all lists
        const images = await Image.find({}).sort({ createdAt: -1 }); // Sort by newest first

        res.json({ globalConfig, imageLists, images });
    } catch (err) {
        console.error("Error fetching admin data:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- Global Config ---

// @route   PUT /api/admin/global-config
// @desc    Update the global configuration
router.put('/admin/global-config', async (req, res) => {
    try {
        const updatedConfig = await GlobalConfig.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.json(updatedConfig);
    } catch (err) {
        console.error("Error updating global config:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- Images ---

// @route   POST /api/admin/images
// @desc    Add a new image to the library
router.post('/admin/images', async (req, res) => {
    try {
        const { url, credit, duration } = req.body;
        const newImage = new Image({ url, credit, duration });
        await newImage.save();
        res.status(201).json(newImage);
    } catch (err) {
        console.error("Error adding image:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/admin/images/upload
// @desc    Upload an image file
// 'imageFile' should match the name attribute of your file input in the frontend
router.post('/admin/images/upload', upload.single('imageFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    // Construct the URL path relative to the server root
    const fileUrl = `/userImages/${req.file.filename}`;
    res.status(201).json({ url: fileUrl });
});


// @route   PUT /api/admin/images/:id
// @desc    Update an existing image
router.put('/admin/images/:id', async (req, res) => {
    try {
        const { url, credit, duration } = req.body;
        const updatedImage = await Image.findByIdAndUpdate(
            req.params.id,
            { url, credit, duration },
            { new: true } // Return the updated document
        );
        if (!updatedImage) return res.status(404).json({ msg: 'Image not found.' });
        res.json(updatedImage);
    } catch (err) {
        console.error("Error updating image:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/admin/images/:id
// @desc    Delete an image from the library AND remove references from all lists
router.delete('/admin/images/:id', async (req, res) => {
    try {
        const imageId = req.params.id;
        const deletedImage = await Image.findByIdAndDelete(imageId);
        if (!deletedImage) return res.status(404).json({ msg: 'Image not found.' });

        // Remove the image ID from any ImageList that contains it
        await ImageList.updateMany(
            { images: imageId },
            { $pull: { images: imageId } }
        );

        // Optionally: Delete the actual file if it was uploaded locally
        // This requires parsing the URL, checking if it's local, and then deleting
        // For simplicity, this is omitted here, but consider it for production.

        res.json({ msg: 'Image deleted successfully and removed from all lists.' });
    } catch (err) {
        console.error("Error deleting image:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- Image Lists (Slideshows) ---

// @route   POST /api/admin/image-lists
// @desc    Create a new image list
router.post('/admin/image-lists', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ msg: 'Image list name cannot be empty.' });
        }
        const existingList = await ImageList.findOne({ name: name.trim() });
        if (existingList) {
            return res.status(400).json({ msg: 'An image list with this name already exists.' });
        }
        const newList = new ImageList({ name: name.trim(), images: [] });
        await newList.save();
        res.status(201).json(newList);
    } catch (err) {
        console.error("Error creating image list:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/image-lists/:id
// @desc    Update an image list (e.g., reorder images, add/remove images)
router.put('/admin/image-lists/:id', async (req, res) => {
    try {
        const { images } = req.body; // Expecting an array of image IDs
        const updatedList = await ImageList.findByIdAndUpdate(
            req.params.id,
            { images }, // Replace the entire images array
            { new: true }
        ).populate('images'); // Repopulate after update

        if (!updatedList) return res.status(404).json({ msg: 'Image list not found.' });
        res.json(updatedList);
    } catch (err) {
        console.error("Error updating image list:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/admin/image-lists/:id
// @desc    Delete an image list
router.delete('/admin/image-lists/:id', async (req, res) => {
    try {
        // Prevent deleting the 'Default' list
        const list = await ImageList.findById(req.params.id);
        if (list && list.name === 'Default') {
            return res.status(400).json({ msg: "Cannot delete the 'Default' slideshow." });
        }

        const deletedList = await ImageList.findByIdAndDelete(req.params.id);
        if (!deletedList) return res.status(404).json({ msg: 'Image list not found.' });
        res.json({ msg: 'Image list deleted successfully.' });
    } catch (err) {
        console.error("Error deleting image list:", err.message);
        res.status(500).send('Server Error');
    }
});


// --- Import/Export ---

// @route   GET /api/admin/export/all
// @desc    Export all data (Global Config, Image Lists, Images) as JSON
router.get('/admin/export/all', async (req, res) => {
    try {
        const globalConfig = await GlobalConfig.findOne({});
        const imageLists = await ImageList.find({}); // Don't populate for export
        const images = await Image.find({});

        const exportData = {
            globalConfig: globalConfig ? globalConfig.toObject() : null,
            imageLists: imageLists.map(list => list.toObject()),
            images: images.map(img => img.toObject()),
        };

        res.setHeader('Content-Disposition', 'attachment; filename=digital_signage_backup.json');
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(exportData, null, 2)); // Pretty print JSON

    } catch (err) {
        console.error("Error exporting all data:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/admin/import/all
// @desc    Import all data from JSON (OVERWRITES EXISTING DATA)
router.post('/admin/import/all', async (req, res) => {
    try {
        const importData = req.body;

        // Validate basic structure
        if (!importData || !importData.globalConfig || !importData.imageLists || !importData.images) {
            return res.status(400).json({ msg: 'Invalid import file structure.' });
        }

        // --- Clear existing data ---
        await GlobalConfig.deleteMany({});
        await ImageList.deleteMany({});
        await Image.deleteMany({});

        // --- Import new data ---
        // Need to handle potential _id conflicts if present in importData
        // Easiest is to remove _id before inserting

        // Import Global Config
        if (importData.globalConfig) {
            delete importData.globalConfig._id; // Remove old ID if exists
            await GlobalConfig.create(importData.globalConfig);
        }

        // Import Images (need to map old IDs to new IDs)
        const imageIdMap = {};
        for (const imgData of importData.images) {
            const oldId = imgData._id;
            delete imgData._id; // Remove old ID
            const newImage = await Image.create(imgData);
            if (oldId) imageIdMap[oldId] = newImage._id; // Store mapping
        }

        // Import Image Lists (using the new image IDs)
        for (const listData of importData.imageLists) {
            delete listData._id; // Remove old ID
            // Remap image IDs using the map created above
            listData.images = listData.images
                .map(oldImgId => imageIdMap[oldImgId])
                .filter(newImgId => newImgId); // Filter out any broken links

            await ImageList.create(listData);
        }

        res.json({ msg: 'Data imported successfully. All previous data has been replaced.' });

    } catch (err) {
        console.error("Error importing all data:", err.message);
        res.status(500).json({ msg: `Import failed: ${err.message}` });
    }
});

// @route   GET /api/admin/export/list/:id
// @desc    Export a single image list as JSON
router.get('/admin/export/list/:id', async (req, res) => {
    try {
        const list = await ImageList.findById(req.params.id).populate('images'); // Populate for export context
        if (!list) return res.status(404).json({ msg: 'Image list not found.' });

        const listName = list.name.replace(/[^a-z0-9]/gi, '_').toLowerCase(); // Sanitize name for filename
        res.setHeader('Content-Disposition', `attachment; filename=slideshow_${listName}.json`);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(list.toObject(), null, 2)); // Send populated list

    } catch (err) {
        console.error("Error exporting list:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/admin/import/list/:id
// @desc    Import/Overwrite a single image list from JSON
router.post('/admin/import/list/:id', async (req, res) => {
    try {
        const listId = req.params.id;
        const importData = req.body; // Expecting { name: "...", images: [{ url: "...", credit: "...", duration: ...}, ...] }

        if (!importData || !Array.isArray(importData.images)) {
            return res.status(400).json({ msg: 'Invalid import format. Expected an object with an "images" array.' });
        }

        // Find the list to update
        const listToUpdate = await ImageList.findById(listId);
        if (!listToUpdate) return res.status(404).json({ msg: 'Image list not found.' });

        // Process imported images: Find existing or create new
        const newImageIds = [];
        for (const imgData of importData.images) {
            // Basic validation for imported image data
            if (!imgData.url) continue;

            // Try to find an existing image by URL (simple check)
            let existingImage = await Image.findOne({ url: imgData.url });
            if (existingImage) {
                // Optionally update existing image details if provided
                if (imgData.credit) existingImage.credit = imgData.credit;
                if (imgData.duration) existingImage.duration = imgData.duration;
                await existingImage.save();
                newImageIds.push(existingImage._id);
            } else {
                // Create a new image if it doesn't exist
                const newImage = new Image({
                    url: imgData.url,
                    credit: imgData.credit || '',
                    duration: imgData.duration || 7, // Use default if not provided
                });
                await newImage.save();
                newImageIds.push(newImage._id);
            }
        }

        // Update the list with the new image IDs
        listToUpdate.images = newImageIds;
        // Optionally update the name if provided in the import file, but avoid duplicates
        if (importData.name && importData.name !== listToUpdate.name) {
            const nameExists = await ImageList.findOne({ name: importData.name, _id: { $ne: listId } });
            if (!nameExists) {
                listToUpdate.name = importData.name;
            } else {
                console.warn(`Could not update list name to "${importData.name}" as it already exists.`);
            }
        }

        await listToUpdate.save();
        const updatedList = await ImageList.findById(listId).populate('images'); // Repopulate

        res.json({ msg: `Slideshow "${listToUpdate.name}" imported successfully.`, list: updatedList });

    } catch (err) {
        console.error("Error importing list:", err.message);
        res.status(500).json({ msg: `List import failed: ${err.message}` });
    }
});

module.exports = router;

