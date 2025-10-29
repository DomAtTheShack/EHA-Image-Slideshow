import React, { useState, useRef } from 'react';
import { Section, Button, InputField } from './UIComponents';

// Up/down arrow SVGs
const ArrowUp = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
const ArrowDown = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;

export default function SlideshowsTab({
                                          imageLists = [],
                                          allImages = [],
                                          selectedListId,
                                          onSelectList,
                                          onReorderList,
                                          onCreateList,
                                          onDeleteList,
                                          showNotification,
                                          onAddImageToList,
                                          API_URL,
                                          autoSaveHandler
                                      }) {
    const [newListName, setNewListName] = useState('');
    const saveTimeoutRef = useRef(null);

    const selectedList = imageLists.find(l => l._id === selectedListId);
    const imagesInSelectedList = selectedList?.images || [];
    const imagesNotInSelectedList = allImages.filter(img => img && img._id && !imagesInSelectedList.some(i => i._id === img._id));

    // Debounced auto-save
    const scheduleSave = (listId, updatedIds) => {
        if (!autoSaveHandler) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => autoSaveHandler(listId, updatedIds), 400);
    };

    const moveImage = (index, direction) => {
        const ids = imagesInSelectedList.map(i => i._id);
        const [moved] = ids.splice(index, 1);
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex <= ids.length) {
            ids.splice(newIndex, 0, moved);
            onReorderList(selectedListId, ids);
            scheduleSave(selectedListId, ids);
        }
    };

    const removeImage = (id) => {
        const updated = imagesInSelectedList.map(i => i._id).filter(i => i !== id);
        onReorderList(selectedListId, updated);
        scheduleSave(selectedListId, updated);
    };

    const addImage = (id) => {
        if (!selectedList) return;
        const updated = [...imagesInSelectedList.map(i => i._id), id];
        onReorderList(selectedListId, updated);
        scheduleSave(selectedListId, updated);
    };

    const handleCreateList = () => {
        if (newListName.trim()) {
            onCreateList(newListName.trim());
            setNewListName('');
        } else {
            showNotification('Please enter a name for the new slideshow.', 'error');
        }
    };

    return (
        <Section title="Slideshow Management">
            {/* Top row: select, input, buttons */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
                {/* Select */}
                <div className="flex-1">
                    <label className="block text-gray-300 text-sm font-bold mb-2">Select Slideshow</label>
                    <select
                        value={selectedListId}
                        onChange={e => onSelectList(e.target.value)}
                        className="w-full p-2 bg-gray-600 rounded border-gray-500 text-white focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
                        disabled={imageLists.length === 0}
                    >
                        {imageLists.map(list => <option key={list._id} value={list._id}>{list.name || 'Unnamed List'}</option>)}
                    </select>
                </div>

                {/* New list */}
                <div className="flex-1">
                    <InputField
                        label="Create New Slideshow"
                        value={newListName}
                        onChange={e => setNewListName(e.target.value)}
                        placeholder="Enter name..."
                    />
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                    <Button onClick={handleCreateList} color="green">Create</Button>
                    <Button onClick={() => onDeleteList(selectedListId)} color="red" disabled={!selectedList || selectedList.name === 'Default'}>Delete</Button>
                </div>
            </div>

            {/* Main content */}
            {selectedList && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                    {/* Images in list */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-gray-200">Images in "{selectedList.name}"</h3>
                        <div className="bg-gray-700 p-4 rounded-lg min-h-[400px] max-h-[60vh] overflow-y-auto pr-2 space-y-2">
                            {imagesInSelectedList.length === 0 && <p className="text-gray-400 text-center py-4">This slideshow is empty. Add images from the library →</p>}
                            {imagesInSelectedList.map((img, i) => (
                                <div key={img._id} className="flex items-center justify-between p-2 rounded bg-gray-600 hover:bg-gray-500 transition-colors">
                                    <div className="flex items-center flex-grow overflow-hidden mr-4">
                                        <div className="flex flex-col mr-3">
                                            <button onClick={() => moveImage(i, -1)} disabled={i===0} className="p-1 rounded text-gray-300 hover:bg-gray-700 disabled:opacity-30"><ArrowUp /></button>
                                            <button onClick={() => moveImage(i, 1)} disabled={i===imagesInSelectedList.length-1} className="p-1 rounded text-gray-300 hover:bg-gray-700 disabled:opacity-30"><ArrowDown /></button>
                                        </div>
                                        <img src={img.url?.startsWith('http') ? img.url : `${API_URL}${img.url||''}`} alt={img.credit||'Image'} className="w-16 h-10 object-cover rounded mr-4 flex-shrink-0" onError={e=>{e.target.onerror=null;e.target.src="https://placehold.co/64x40?text=Error"}}/>
                                        <span className="truncate text-gray-100">{img.credit||'No credit'}</span>
                                        <span className="text-xs text-gray-400 ml-2">({img.duration}s)</span>
                                    </div>
                                    <Button onClick={() => removeImage(img._id)} color="red" className="text-xs px-2 py-1">Remove</Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add images */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-gray-200">Add Images from Library</h3>
                        <div className="bg-gray-700 p-4 rounded-lg min-h-[400px] max-h-[60vh] overflow-y-auto pr-2 space-y-2">
                            {imagesNotInSelectedList.length === 0 && allImages.length>0 && <p className="text-gray-400 text-center py-4">All library images are already in this slideshow.</p>}
                            {allImages.length === 0 && <p className="text-gray-400 text-center py-4">Image library is empty.</p>}
                            {imagesNotInSelectedList.map(img => (
                                <div key={img._id} className="flex items-center justify-between p-2 rounded bg-gray-600 hover:bg-gray-500 transition-colors">
                                    <div className="flex items-center flex-grow overflow-hidden mr-4">
                                        <img src={img.url?.startsWith('http') ? img.url : `${API_URL}${img.url||''}`} alt={img.credit||'Image'} className="w-16 h-10 object-cover rounded mr-4 flex-shrink-0" onError={e=>{e.target.onerror=null;e.target.src="https://placehold.co/64x40?text=Error"}}/>
                                        <span className="truncate text-gray-100">{img.credit||'No credit'}</span>
                                    </div>
                                    <Button onClick={() => addImage(img._id)} color="blue" className="flex-shrink-0 text-xs px-2 py-1">Add</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Section>
    );
}
