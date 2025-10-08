/**
 * Mongoose Schema for Image Lists
 * An Image List is a named collection of references to individual images.
 * This allows for creating multiple slideshows (e.g., "Weekday Images", "Holiday Special").
 */
const mongoose = require('mongoose');

const ImageListSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // Each list should have a unique name
        trim: true
    },
    images: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image' // This creates a link to documents in the 'Image' collection
    }]
}, { versionKey: false, timestamps: true });

module.exports = mongoose.model('ImageList', ImageListSchema);
