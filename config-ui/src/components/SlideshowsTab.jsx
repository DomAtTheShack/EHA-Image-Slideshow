import React, { useState } from 'react';
import { Section, Button, InputField } from './UIComponents'; // Assuming UIComponents is updated
import ImportExportSlideshow from './ImportExportSlideshow'; // Import the new component

// Simple up/down arrow icons as SVG components
const ArrowUp = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
const ArrowDown = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;

export default function SlideshowsTab({
                                          imageLists,
                                          allImages, // Keep this prop for potential future use (like adding from library)
                                          selectedListId,
                                          onSelectList,
                                          onReorderList,
                                          onCreateList,
                                          onDeleteList,
                                          showNotification // Add this prop
                                      }) {
    const [newListName, setNewListName] = useState('');

    const handleCreateList = () => {
        if (newListName.trim()) {
            onCreateList(newListName.trim());
            setNewListName('');
        } else {
            // Use the passed-in notification function
            showNotification('Please enter a name for the new slideshow.', 'error');
        }
    };

    const moveImage = (index, direction) => {
        const list = imageLists.find(l => l._id === selectedListId);
        if (!list) return;

        const items = Array.from(list.images.map(img => img._id)); // Work with IDs
        const [movedItem] = items.splice(index, 1);
        const newIndex = index + direction;

        // Ensure the new index is within bounds
        if (newIndex >= 0 && newIndex < items.length + 1) {
            items.splice(newIndex, 0, movedItem);
            onReorderList(selectedListId, items); // Send updated array of IDs
        }
    };

    const selectedList = imageLists.find(l => l._id === selectedListId);

    return (
        <Section title="Slideshow Management">
            {/* Top Row: Select, Create, Delete */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
                <div className="w-full md:w-1/3">
                    <label className="block text-gray-300 text-sm font-bold mb-2">Select Slideshow</label>
                    <select onChange={(e) => onSelectList(e.target.value)} value={selectedListId} className="w-full p-2 bg-gray-600 rounded border-gray-500 text-white focus:ring-2 focus:ring-yellow-400">
                        {imageLists.map(list => <option key={list._id} value={list._id}>{list.name}</option>)}
                    </select>
                </div>
                <div className="w-full md:w-1/3">
                    <InputField
                        label="Create New Slideshow"
                        name="newListName"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="Enter name..."
                    />
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleCreateList} color="green">Create</Button>
                    {selectedList && selectedList.name !== 'Default' && (
                        <Button onClick={() => onDeleteList(selectedListId)} color="red">Delete Selected</Button>
                    )}
                </div>
            </div>

            {/* Import/Export for the selected list */}
            {selectedList && (
                <ImportExportSlideshow
                    selectedListId={selectedListId}
                    selectedListName={selectedList.name}
                    showNotification={showNotification}
                />
            )}


            {/* Image List (with reordering buttons) */}
            {selectedList && (
                <div className="bg-gray-700 p-4 rounded-lg mt-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-200">Images in "{selectedList.name}"</h3>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        {selectedList.images.map((image, index) => (
                            <div
                                key={image._id}
                                className="flex items-center justify-between p-2 rounded bg-gray-600 hover:bg-gray-500 transition-colors duration-200"
                            >
                                <div className="flex items-center flex-grow overflow-hidden mr-4">
                                    {/* Reordering Buttons */}
                                    <div className="flex flex-col mr-3">
                                        <button
                                            onClick={() => moveImage(index, -1)}
                                            disabled={index === 0}
                                            className="p-1 rounded text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ArrowUp />
                                        </button>
                                        <button
                                            onClick={() => moveImage(index, 1)}
                                            disabled={index === selectedList.images.length - 1}
                                            className="p-1 rounded text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ArrowDown />
                                        </button>
                                    </div>
                                    <img src={image.url} alt={image.credit || 'Image'} className="w-16 h-10 object-cover rounded mr-4 flex-shrink-0" />
                                    <span className="truncate text-gray-100">{image.credit || 'No credit'}</span>
                                    <span className="text-xs text-gray-400 ml-2">({image.duration}s)</span>
                                </div>
                                {/* Removed the 'Remove' button, assuming removal is handled in Library or Add section */}
                            </div>
                        ))}
                        {selectedList.images.length === 0 && (
                            <p className="text-gray-400 text-center py-4">This slideshow is empty.</p>
                        )}
                    </div>
                </div>
            )}
            {/* TODO: Add section to add images from library if needed */}
        </Section>
    );
}

