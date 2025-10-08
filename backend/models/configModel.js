const mongoose = require('mongoose');

// This is a "sub-document" schema. It defines the structure for each image
// within the main configuration, but it's not a standalone model.
const ImageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
    },
    credit: {
        type: String,
        required: false,
        default: ''
    },
    // Optional: duration in seconds for this specific image.
    // If not set, the global defaultDuration will be used.
    duration: {
        type: Number,
    },
    order: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

// This is the main schema for our entire display configuration.
// We will likely only ever have ONE document of this type in our database.
const ConfigSchema = new mongoose.Schema({
    // A friendly name for this configuration, e.g., "Main Lobby Display"
    name: {
        type: String,
        required: true,
        default: 'Default Display Config'
    },
    // The main title to show at the top of the display.
    title: {
        type: String,
        default: 'Creators of the day:'
    },
    // Global settings that apply to the whole display
    weatherLocation: {
        type: String,
        default: 'Houghton, MI' // A default location
    },
    timeFormat: {
        type: String,
        enum: ['12hr', '24hr'], // Only allow these two values
        default: '12hr'
    },
    temperatureUnit: {
        type: String,
        enum: ['C', 'F'], // Only allow Celsius or Fahrenheit
        default: 'C'
    },
    // The default time in seconds each slide is shown if not specified on the image itself.
    defaultDuration: {
        type: Number,
        default: 7 // 7 seconds
    },
    // This is an array that will hold all our image objects.
    // Mongoose knows to use the ImageSchema for each object in this array.
    images: [ImageSchema]
});

// The 'Config' model will interact with the 'configs' collection in the database.
module.exports = mongoose.model('Config', ConfigSchema);
