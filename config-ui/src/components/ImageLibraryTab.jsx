import React, { useState } from 'react';
import { Section, InputField, Button } from './UIComponents';

export default function ImageLibraryTab({ images, onAddImage, onUpdateImage, onDeleteImage }) {
    const [newImageData, setNewImageData] = useState({ url: '', credit: '', duration: 7 });
    const [editingImage, setEditingImage] = useState(null);

    const handleFormChange = (e, formSetter) => {
        const { name, value } = e.target;
        const parsedValue = e.target.type === 'number' ? parseFloat(value) : value;
        formSetter(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleAddNew = () => {
        onAddImage(newImageData);
        setNewImageData({ url: '', credit: '', duration: 7 });
    };

    const handleUpdate = () => {
        onUpdateImage(editingImage);
        setEditingImage(null);
    };

    return (
        <Section title="Image Library">
            <div className="bg-gray-700 p-4 rounded-lg mb-8">
                <h3 className="text-xl font-semibold mb-4">Add New Image to Library</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField label="Image URL" name="url" value={newImageData.url} onChange={(e) => handleFormChange(e, setNewImageData)} />
                    <InputField label="Credit Text" name="credit" value={newImageData.credit} onChange={(e) => handleFormChange(e, setNewImageData)} />
                    <InputField label="Duration (seconds)" name="duration" type="number" value={newImageData.duration} onChange={(e) => handleFormChange(e, setNewImageData)} />
                </div>
                <Button onClick={handleAddNew} color="green" className="mt-4">Save New Image</Button>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
                {images.map(image => (
                    <div key={image._id} className="bg-gray-700 p-4 rounded-lg mb-4 hover:bg-gray-600 transition-colors duration-200">
                        {editingImage?._id === image._id ? (
                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InputField label="Image URL" name="url" value={editingImage.url} onChange={(e) => handleFormChange(e, setEditingImage)} />
                                    <InputField label="Credit Text" name="credit" value={editingImage.credit} onChange={(e) => handleFormChange(e, setEditingImage)} />
                                    <InputField label="Duration (seconds)" name="duration" type="number" value={editingImage.duration} onChange={(e) => handleFormChange(e, setEditingImage)} />
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Button onClick={handleUpdate} color="green">Save Changes</Button>
                                    <Button onClick={() => setEditingImage(null)} color="gray">Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <img src={image.url} alt={image.credit} className="w-24 h-16 object-cover rounded" />
                                    <div>
                                        <p className="font-semibold">{image.credit || 'No credit'}</p>
                                        <p className="text-xs text-gray-400">Duration: {image.duration}s</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => setEditingImage({ ...image })} color="blue">Edit</Button>
                                    <Button onClick={() => onDeleteImage(image._id)} color="red">Delete</Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </Section>
    );
}

