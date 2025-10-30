/**
 * Mongoose Schema for the Global Configuration
 * This stores all the main settings for the display that are not related to a specific
 * list of images, such as the title, weather settings, and default timings.
 * There should only ever be one document of this type in the database.
 */
const mongoose = require('mongoose');

const GlobalConfigSchema = new mongoose.Schema({
    name: { type: String, required: true, default: 'Global Display Config' },
    title: { type: String, default: 'Welcome!' },
    globalSlideDuration: { type: Number, default: 7 },
    weatherLocation: { type: String, default: 'Houghton, MI' },
    location: { type: String, default: 'MTU' },
    timeFormat: { type: String, enum: ['12hr', '24hr'], default: '12hr' },
    temp: { type: Number, default: 20 },
    condition: { type: String, default: 'Clear' },
    windSpeed: { type: Number, default: 0 },
    humid: { type: Number, default: 0 },
    visibility: { type: Number, default: 0 },
    snowTotal: { type: Number, default: 0 },
    windChill: { type: Number, default: 0 },
    windDir: { type: String, default: 'N' },
    windDegree: { type: Number, default: 0 },
    unitSystem: { type: String, enum: ['metric', 'imperial'], default: 'metric' },

    // NEW: Currently active slideshow
    activeSlideshowId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImageList', default: null },
    events: [{ type: String }]
}, { versionKey: false });


module.exports = mongoose.model('GlobalConfig', GlobalConfigSchema);
