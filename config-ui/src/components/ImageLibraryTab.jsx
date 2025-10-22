import React, { useState, useRef } from 'react';
import { Section, Button, InputField } from './UIComponents';

export default function ImageLibraryTab({ images, onAddImage, onUpdateImage, onDeleteImage, showNotification, API_URL }) {
    const [newImageData, setNewImageData] = useState({ url: '', credit: '', duration: 7 });
    const [editingImage, setEditingImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null); // Ref to access the file input

    const handleFormChange = (e, formSetter) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' ? parseFloat(value) || 0 : value;
        formSetter(prev => ({ ...prev, [name]: parsedValue }));
    };

    // --- Handle Image Upload ---
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('imageFile', file); // 'imageFile' must match backend multer field name

        try {
            const response = await fetch(`${API_URL}/admin/images/upload`, {
                method: 'POST',
                body: formData,
                // No 'Content-Type' header needed, browser sets it for FormData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            // Set the URL in the 'Add New Image' form to the uploaded file's path
            setNewImageData(prev => ({ ...prev, url: result.url }));
            showNotification('Image uploaded successfully!', 'success');
            // Clear the file input visually (optional but good UX)
            if(fileInputRef.current) fileInputRef.current.value = "";

        } catch (err) {
            console.error("Upload error:", err);
            showNotification(`Upload failed: ${err.message}`, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    // --- Handle Add/Update ---
    const handleSaveNewImage = () => {
        if (!newImageData.url) {
            showNotification('Image URL or uploaded file is required.', 'error');
            return;
        }
        onAddImage(newImageData);
        setNewImageData({ url: '', credit: '', duration: 7 }); // Reset form
    };

    const handleSaveUpdateImage = () => {
        onUpdateImage(editingImage);
        setEditingImage(null); // Exit editing mode
    };

    return (
        <Section title="Image Library">
            {/* --- Add New Image Section --- */}
            <div className="bg-gray-700 p-4 rounded-lg mb-8 shadow-inner">
                <h3 className="text-lg font-semibold mb-4 text-yellow-300">Add New Image</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <InputField
                        label="Image URL (Enter URL or Upload)"
                        name="url"
                        value={newImageData.url}
                        onChange={(e) => handleFormChange(e, setNewImageData)}
                        placeholder="http://example.com/image.jpg"
                    />
                    <InputField
                        label="Credit Text"
                        name="credit"
                        value={newImageData.credit}
                        onChange={(e) => handleFormChange(e, setNewImageData)}
                        placeholder="Photo by ..."
                    />
                    <InputField
                        label="Duration (seconds)"
                        name="duration"
                        type="number"
                        value={newImageData.duration}
                        onChange={(e) => handleFormChange(e, setNewImageData)}
                    />
                </div>
                {/* File Upload Input */}
                <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-bold mb-2">Or Upload Image File</label>
                    <input
                        type="file"
                        ref={fileInputRef} // Assign ref
                        onChange={handleFileUpload}
                        accept="image/png, image/jpeg, image/gif, image/webp" // Specify acceptable file types
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-400 disabled:opacity-50"
                        disabled={isUploading}
                    />
                    {isUploading && <p className="text-sm text-yellow-400 mt-2">Uploading...</p>}
                </div>
                <Button onClick={handleSaveNewImage} color="green" disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Save New Image to Library'}
                </Button>
            </div>

            {/* --- Existing Images List --- */}
            <h3 className="text-lg font-semibold mb-4 text-yellow-300">Existing Images</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {images.map(image => (
                    <div key={image._id} className="bg-gray-700 p-4 rounded-lg shadow-inner hover:bg-gray-600 transition-colors duration-200">
                        {editingImage?._id === image._id ? (
                            // --- Editing Mode ---
                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InputField label="Image URL" name="url" value={editingImage.url} onChange={(e) => handleFormChange(e, setEditingImage)} />
                                    <InputField label="Credit Text" name="credit" value={editingImage.credit} onChange={(e) => handleFormChange(e, setEditingImage)} />
                                    <InputField label="Duration (seconds)" name="duration" type="number" value={editingImage.duration} onChange={(e) => handleFormChange(e, setEditingImage)} />
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Button onClick={handleSaveUpdateImage} color="green">Save Changes</Button>
                                    <Button onClick={() => setEditingImage(null)} color="gray">Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            // --- Display Mode ---
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-grow overflow-hidden">
                                    <img
                                        src={image.url.startsWith('http') ? image.url : `${API_URL.replace('/api', '')}${image.url}`} // Handle both absolute and relative URLs
                                        alt={image.credit || 'Image'}
                                        className="w-24 h-16 object-cover rounded flex-shrink-0"
                                        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/96x64?text=Error"; }} // Basic error handling
                                    />
                                    <div className="truncate">
                                        <p className="font-semibold text-gray-100">{image.credit || 'No credit'}</p>
                                        <p className="text-xs text-gray-400 truncate">{image.url}</p>
                                        <p className="text-xs text-gray-400">Duration: {image.duration}s</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <Button onClick={() => setEditingImage({ ...image })} color="blue">Edit</Button>
                                    <Button onClick={() => onDeleteImage(image._id)} color="red">Delete</Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {images.length === 0 && <p className="text-gray-400 text-center py-4">Your image library is empty.</p>}
            </div>
        </Section>
    );
}

