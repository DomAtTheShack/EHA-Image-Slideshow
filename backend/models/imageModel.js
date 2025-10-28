// models/imageModel.js

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
    }
    // 'createdAt' field is removed from here
}, {
    timestamps: true // This automatically adds 'createdAt' and 'updatedAt'
});

// The 'Image' model will interact with the 'images' collection in the database.
module.exports = mongoose.model('Image', ImageSchema);