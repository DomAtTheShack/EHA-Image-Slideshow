/**
 * Mongoose Schema for the Global Configuration
 * This stores all the main settings for the display that are not related to a specific
 * list of images, such as the title, weather settings, and default timings.
 * There should only ever be one document of this type in the database.
 */
const mongoose = require('mongoose');

const GlobalConfigSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: 'Global Display Config'
    },
    title: {
        type: String,
        default: 'Welcome!'
    },
    globalSlideDuration: {
        type: Number,
        default: 7 // Default duration in seconds for images that don't have their own
    },
    weatherLocation: {
        type: String,
        default: 'Houghton, MI'
    },
    timeFormat: {
        type: String,
        enum: ['12hr', '24hr'],
        default: '12hr'
    },
    tempUnit: {
        type: String,
        enum: ['C', 'F'],
        default: 'C'
    }
}, { versionKey: false });

module.exports = mongoose.model('GlobalConfig', GlobalConfigSchema);
