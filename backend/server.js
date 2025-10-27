require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// Routes
const apiRoutes = require('./routes/apiRoutes');       // Optional public-facing API
const adminRoutes = require('./routes/adminRoutes');   // Admin CRUD routes
const authRoutes = require('./routes/authRoutes');     // Optional login route if separated

const { authenticate } = require('./auth'); // JWT middleware

// Static models
const GlobalConfig = require('./models/globalConfigModel');
const ImageList = require('./models/imageListModel');
const Image = require('./models/imageModel');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/userImages', express.static(path.join(__dirname, 'userImages')));

// --- Startup tasks ---
const runStartupTasks = async () => {
    try {
        // Clean up weather directory
        const weatherDir = 'weather';
        await fs.mkdir(weatherDir, { recursive: true });
        const files = await fs.readdir(weatherDir);
        const deletions = files.filter(f => path.extname(f) === '.json').map(f => fs.unlink(path.join(weatherDir, f)));
        await Promise.all(deletions);

        // Seed DB if empty
        const configExists = await GlobalConfig.countDocuments();
        if (!configExists) {
            const img1 = await Image.create({ url: 'https://placehold.co/1280x720/1a1a1a/ffffff?text=Image+One', credit: 'First placeholder', duration: 5 });
            const img2 = await Image.create({ url: 'https://placehold.co/1280x720/333333/ffffff?text=Image+Two', credit: 'Second placeholder', duration: 10 });

            await ImageList.create({ name: 'Default', images: [img1._id, img2._id] });
            await GlobalConfig.create({}); // Default values in schema
        }
    } catch (err) {
        console.warn('Startup tasks error:', err);
    }
};

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB.');
        await runStartupTasks();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Routes
app.use('/api', authRoutes);           // Optional
app.use('/api', apiRoutes);            // Optional public API
app.use('/api/admin', adminRoutes);    // Admin routes now internally handle JWT

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
