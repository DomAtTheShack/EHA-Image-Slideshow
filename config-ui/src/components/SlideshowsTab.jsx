import React, { useState } from 'react';
import { Section, Button, InputField } from './UIComponents';

export default function SlideshowsTab({ imageLists, allImages, selectedListId, onSelectList, onReorderList, onCreateList, onDeleteList, onUpdateImageList, showNotification }) {
    const [newListName, setNewListName] = useState('');

    const handleCreateList = () => {
        if (newListName.trim()) {
            onCreateList(newListName.trim());
            setNewListName('');
        } else {
            showNotification('Please enter a name for the new slideshow.', 'error');
        }
    };

    const handleAddImageToList = (imageId) => {
        const list = imageLists.find(l => l._id === selectedListId);
        if (list.images.some(img => img._id === imageId)) {
            showNotification('Image is already in this slideshow.', 'error');
            return;
        }
        const updatedImageIds = [...list.images.map(img => img._id), imageId];
        onUpdateImageList(selectedListId, updatedImageIds, 'Image added to slideshow.');
    };

    const handleRemoveImageFromList = (imageId) => {
        const list = imageLists.find(l => l._id === selectedListId);
        const updatedImageIds = list.images.map(img => img._id).filter(id => id !== imageId);
        onUpdateImageList(selectedListId, updatedImageIds, 'Image removed from slideshow.');
    };

    const handleMove = (index, direction) => {
        const list = imageLists.find(l => l._id === selectedListId);
        const reorderedImages = Array.from(list.images);
        const [movedImage] = reorderedImages.splice(index, 1);

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        reorderedImages.splice(newIndex, 0, movedImage);

        onReorderList(selectedListId, reorderedImages);
    };

    const selectedList = imageLists.find(l => l._id === selectedListId);

    return (
        <Section title="Slideshow Management">
            <div className="bg-gray-700 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-semibold mb-2">Manage Slideshows</h3>
                <div className="flex flex-col md:flex-row gap-4">
                    <select onChange={(e) => onSelectList(e.target.value)} value={selectedListId} className="w-full md:w-1/3 p-2 bg-gray-600 rounded border-gray-500">
                        {imageLists.map(list => <option key={list._id} value={list._id}>{list.name}</option>)}
                    </select>
                    <Button onClick={() => onDeleteList(selectedListId)} color="red" disabled={imageLists.length <= 1}>Delete Selected</Button>
                </div>
                <div className="flex flex-col md:flex-row gap-4 mt-4">
                    <InputField placeholder="New slideshow name..." value={newListName} onChange={(e) => setNewListName(e.target.value)} />
                    <Button onClick={handleCreateList} color="green">Create New</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Images in the current list */}
                <div>
                    <h3 className="text-xl font-semibold mb-2">Images in "{selectedList?.name}"</h3>
                    <div className="bg-gray-700 p-4 rounded-lg min-h-[400px]">
                        {selectedList && selectedList.images.length > 0 ? selectedList.images.map((image, index) => (
                            <div key={image._id} className="flex items-center justify-between p-2 mb-2 rounded bg-gray-800">
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-400 w-6 text-center font-mono">{index + 1}</span>
                                    <img src={image.url} alt={image.credit} className="w-16 h-10 object-cover rounded" />
                                    <span className="flex-grow">{image.credit || 'No credit'}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-white disabled:opacity-25">▲</button>
                                        <button onClick={() => handleMove(index, 'down')} disabled={index === selectedList.images.length - 1} className="text-gray-400 hover:text-white disabled:opacity-25">▼</button>
                                    </div>
                                    <Button onClick={() => handleRemoveImageFromList(image._id)} color="red">Remove</Button>
                                </div>
                            </div>
                        )) : <p className="text-gray-400">This list is empty. Add images from the library on the right.</p>}
                    </div>
                </div>

                {/* Right Column: The full image library */}
                <div>
                    <h3 className="text-xl font-semibold mb-2">Add Images from Library</h3>
                    <div className="bg-gray-700 p-4 rounded-lg min-h-[400px] max-h-[600px] overflow-y-auto">
                        {allImages.map(image => (
                            <div key={image._id} className="flex items-center justify-between p-2 border-b border-gray-600 hover:bg-gray-600">
                                <div className="flex items-center gap-4">
                                    <img src={image.url} alt={image.credit} className="w-16 h-10 object-cover rounded" />
                                    <span className="flex-grow">{image.credit || 'No credit'}</span>
                                </div>
                                <Button onClick={() => handleAddImageToList(image._id)} color="blue">Add</Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Section>
    );
}

