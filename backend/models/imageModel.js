// This new file defines the schema for a single image document.
// Each image in the database will follow this structure.

const mongoose = require('mongoose');

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
    // You can use this field later to control the slideshow order
    order: {
        type: Number,
        default: 0
    },
    // You can use this field for custom durations per image
    duration: {
        type: Number,
        default: 7 // Default duration in seconds
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// The 'Image' model will interact with the 'images' collection in the database.
module.exports = mongoose.model('Image', ImageSchema);

