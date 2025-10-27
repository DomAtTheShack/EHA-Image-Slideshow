const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');

// Models
const GlobalConfig = require('../models/globalConfigModel');
const ImageList = require('../models/imageListModel');
const Image = require('../models/imageModel');

// Auth middleware
const { authenticate } = require('../auth'); // JWT verification

// ---------------------------
// Multer setup for file uploads
// ---------------------------
const uploadDir = path.join(__dirname, '..', 'userImages');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// ---------------------------
// LOGIN (Unprotected)
// ---------------------------
router.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token });
    }
    res.status(401).json({ msg: 'Invalid password' });
});

// ---------------------------
// PROTECTED ROUTES
// All routes below require JWT
// ---------------------------

// Get all admin data
router.get('/data', authenticate, async (req, res) => {
    try {
        const globalConfig = await GlobalConfig.findOne({});
        const imageLists = await ImageList.find({}).populate('images');
        const images = await Image.find({}).sort({ createdAt: -1 });
        res.json({ globalConfig, imageLists, images });
    } catch (err) {
        console.error('Error fetching admin data:', err.message);
        res.status(500).send('Server Error');
    }
});

// Update global config
router.put('/global-config', authenticate, async (req, res) => {
    try {
        const updatedConfig = await GlobalConfig.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.json(updatedConfig);
    } catch (err) {
        console.error('Error updating global config:', err.message);
        res.status(500).send('Server Error');
    }
});

// Add new image
router.post('/images', authenticate, async (req, res) => {
    try {
        const { url, credit, duration } = req.body;
        const newImage = new Image({ url, credit, duration });
        await newImage.save();
        res.status(201).json(newImage);
    } catch (err) {
        console.error('Error adding image:', err.message);
        res.status(500).send('Server Error');
    }
});

// Upload image file
router.post('/images/upload', authenticate, upload.single('imageFile'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const fileUrl = `/userImages/${req.file.filename}`;
    res.status(201).json({ url: fileUrl });
});

// Update image
router.put('/images/:id', authenticate, async (req, res) => {
    try {
        const { url, credit, duration } = req.body;
        const updatedImage = await Image.findByIdAndUpdate(req.params.id, { url, credit, duration }, { new: true });
        if (!updatedImage) return res.status(404).json({ msg: 'Image not found.' });
        res.json(updatedImage);
    } catch (err) {
        console.error('Error updating image:', err.message);
        res.status(500).send('Server Error');
    }
});

// Delete image
router.delete('/images/:id', authenticate, async (req, res) => {
    try {
        const imageId = req.params.id;
        const deletedImage = await Image.findByIdAndDelete(imageId);
        if (!deletedImage) return res.status(404).json({ msg: 'Image not found.' });

        // Remove from any lists
        await ImageList.updateMany({ images: imageId }, { $pull: { images: imageId } });

        res.json({ msg: 'Image deleted successfully and removed from all lists.' });
    } catch (err) {
        console.error('Error deleting image:', err.message);
        res.status(500).send('Server Error');
    }
});

// ---------------------------
// Image lists (slideshows)
// ---------------------------

// Create a new image list
router.post('/image-lists', authenticate, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === '') return res.status(400).json({ msg: 'Image list name cannot be empty.' });
        const existingList = await ImageList.findOne({ name: name.trim() });
        if (existingList) return res.status(400).json({ msg: 'Image list already exists.' });

        const newList = new ImageList({ name: name.trim(), images: [] });
        await newList.save();
        res.status(201).json(newList);
    } catch (err) {
        console.error('Error creating image list:', err.message);
        res.status(500).send('Server Error');
    }
});

// Update image list
router.put('/image-lists/:id', authenticate, async (req, res) => {
    try {
        const { images } = req.body;
        const updatedList = await ImageList.findByIdAndUpdate(req.params.id, { images }, { new: true }).populate('images');
        if (!updatedList) return res.status(404).json({ msg: 'Image list not found.' });
        res.json(updatedList);
    } catch (err) {
        console.error('Error updating image list:', err.message);
        res.status(500).send('Server Error');
    }
});

// Delete image list
router.delete('/image-lists/:id', authenticate, async (req, res) => {
    try {
        const list = await ImageList.findById(req.params.id);
        if (list?.name === 'Default') return res.status(400).json({ msg: "Cannot delete the 'Default' slideshow." });
        const deletedList = await ImageList.findByIdAndDelete(req.params.id);
        if (!deletedList) return res.status(404).json({ msg: 'Image list not found.' });
        res.json({ msg: 'Image list deleted successfully.' });
    } catch (err) {
        console.error('Error deleting image list:', err.message);
        res.status(500).send('Server Error');
    }
});

// ---------------------------
// EXPORT / IMPORT ALL DATA
// ---------------------------

// Export all data
router.get('/export/all', authenticate, async (req, res) => {
    try {
        const globalConfig = await GlobalConfig.findOne({});
        const imageLists = await ImageList.find({}).populate('images');
        const images = await Image.find({}).sort({ createdAt: -1 });

        const exportData = { globalConfig, imageLists, images };

        res.setHeader('Content-Disposition', `attachment; filename="digital_signage_backup_${Date.now()}.json"`);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(exportData, null, 2));
    } catch (err) {
        console.error('Error exporting data:', err.message);
        res.status(500).json({ msg: 'Failed to export data.' });
    }
});

// Import all data
router.post('/import/all', authenticate, async (req, res) => {
    try {
        const { globalConfig, imageLists, images } = req.body;

        if (!globalConfig || !imageLists || !images) {
            return res.status(400).json({ msg: 'Invalid JSON structure.' });
        }

        // Overwrite global config
        await GlobalConfig.findOneAndUpdate({}, globalConfig, { upsert: true });

        // Clear existing images & lists
        await Image.deleteMany({});
        await ImageList.deleteMany({});

        // Insert new images
        const insertedImages = await Image.insertMany(images);

        // Map old image IDs to new ones for lists
        const imageIdMap = {};
        insertedImages.forEach((img, idx) => {
            imageIdMap[images[idx]._id] = img._id;
        });

        // Insert new lists with remapped image IDs
        const remappedLists = imageLists.map(list => ({
            ...list,
            _id: undefined,
            images: list.images.map(id => imageIdMap[id]).filter(Boolean),
        }));
        await ImageList.insertMany(remappedLists);

        res.json({ msg: 'Data imported successfully.' });
    } catch (err) {
        console.error('Error importing data:', err.message);
        res.status(500).json({ msg: 'Failed to import data.' });
    }
});

module.exports = router;
