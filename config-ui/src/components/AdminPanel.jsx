import React, { useState, useEffect } from 'react';
import GlobalSettingsTab from './GlobalSettingsTab';
import SlideshowsTab from './SlideshowsTab';
import ImageLibraryTab from './ImageLibraryTab';
import Notification from './Notification';
import Modal from './Modal';
import { TabButton } from './UIComponents';
import ImportExport from './ImportExport'; // Import the main Import/Export component

export default function AdminPanel() {
    // --- State Management ---
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({ globalConfig: null, imageLists: [], images: [] });
    const [activeTab, setActiveTab] = useState('global');
    const [selectedListId, setSelectedListId] = useState('');
    const [notification, setNotification] = useState({ message: '', type: '', show: false, visible: false });
    const [modal, setModal] = useState({ show: false, title: '', message: '', onConfirm: () => {} });

    // Use environment variable for API URL or default
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

    // --- Data Fetching ---
    const fetchData = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/data`);
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            const fetchedData = await response.json();
            setData(fetchedData);
            // Ensure selectedListId is valid after data fetch
            if (fetchedData.imageLists.length > 0) {
                if (!selectedListId || !fetchedData.imageLists.some(list => list._id === selectedListId)) {
                    // If no list is selected, or the selected one no longer exists, select the first one.
                    setSelectedListId(fetchedData.imageLists[0]._id);
                }
            } else {
                setSelectedListId(''); // No lists available
            }
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []); // Fetch only on initial mount

    // --- Helper Functions for Notifications & Modals ---
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type, show: true, visible: true });
    };

    const showConfirmModal = (title, message, onConfirm) => {
        setModal({ show: true, title, message, onConfirm });
    };

    // --- API Call Handlers ---
    const handleSaveGlobalConfig = async (configToSave) => {
        try {
            await fetch(`${API_URL}/admin/global-config`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(configToSave),
            });
            showNotification('Global settings saved successfully!');
            fetchData(); // Refetch to confirm changes
        } catch (err) { showNotification(`Error saving settings: ${err.message}`, 'error'); }
    };

    const handleAddNewImage = async (newImageData) => {
        try {
            const response = await fetch(`${API_URL}/admin/images`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newImageData),
            });
            if (!response.ok) throw new Error('Failed to add image');
            await fetchData();
            showNotification('Image added to library.');
        } catch (err) { showNotification(`Error adding image: ${err.message}`, 'error'); }
    };

    const handleUpdateImage = async (editingImage) => {
        try {
            const response = await fetch(`${API_URL}/admin/images/${editingImage._id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingImage),
            });
            if (!response.ok) throw new Error('Failed to update image');
            await fetchData();
            showNotification('Image updated successfully.');
        } catch (err) { showNotification(`Error updating image: ${err.message}`, 'error'); }
    };

    const handleDeleteImage = (imageId) => {
        showConfirmModal( 'Delete Image?', 'This will remove the image from all lists and delete it permanently. This action cannot be undone.',
            async () => {
                try {
                    await fetch(`${API_URL}/admin/images/${imageId}`, { method: 'DELETE' });
                    await fetchData();
                    showNotification('Image deleted permanently.');
                } catch (err) { showNotification(`Error deleting image: ${err.message}`, 'error'); }
                setModal({ ...modal, show: false });
            }
        );
    };

    // Generic function to update an image list (add/remove/reorder)
    const handleUpdateImageList = async (listId, images, successMessage) => {
        try {
            const response = await fetch(`${API_URL}/admin/image-lists/${listId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images }), // Send array of IDs
            });
            if (!response.ok) throw new Error('Failed to update list');
            await fetchData(); // Refetch all data to update UI consistency
            if (successMessage) showNotification(successMessage);
        } catch(err) { showNotification(`Error updating list: ${err.message}`, 'error'); }
    };

    const handleCreateList = async (listName) => {
        try {
            const response = await fetch(`${API_URL}/admin/image-lists`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: listName }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Failed to create list');
            }
            const newList = await response.json();
            await fetchData(); // Refetch data
            setSelectedListId(newList._id); // Select the newly created list
            showNotification('New slideshow created successfully.');
        } catch (err) { showNotification(`Error creating list: ${err.message}`, 'error'); }
    };

    const handleDeleteList = (listId) => {
        const list = data.imageLists.find(l => l._id === listId);
        if (list && list.name === 'Default') {
            showNotification("Cannot delete the 'Default' slideshow.", 'error');
            return;
        }
        showConfirmModal( 'Delete Slideshow?', `Are you sure you want to delete the slideshow "${list?.name}"? This cannot be undone.`,
            async () => {
                try {
                    await fetch(`${API_URL}/admin/image-lists/${listId}`, { method: 'DELETE' });
                    await fetchData(); // Refetch data
                    // If the deleted list was selected, select the first available list
                    setSelectedListId(data.imageLists.length > 1 ? data.imageLists[0]._id : '');
                    showNotification('Slideshow deleted successfully.');
                } catch (err) { showNotification(`Error deleting slideshow: ${err.message}`, 'error'); }
                setModal({ ...modal, show: false });
            }
        );
    };

    // Handler specifically for reordering (passes array of IDs)
    const handleReorderList = (listId, reorderedImageIds) => {
        // Optimistically update UI could be complex with nested state, refetching is simpler
        handleUpdateImageList(listId, reorderedImageIds, null); // No success message needed for reorder usually
    };

    // --- Render Logic ---
    if (loading) return <div className="text-center p-10 text-gray-400">Loading Admin Panel...</div>;
    if (error) return <div className="text-red-500 text-center p-10">Error: {error}</div>;
    if (!data.globalConfig) return <div className="text-yellow-500 text-center p-10">No configuration data found. Please check the backend.</div>;

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans p-4 md:p-8">
            {/* Notifications and Modals */}
            <Notification
                message={notification.message}
                type={notification.type}
                show={notification.visible} // Use 'visible' for triggering animation
                onDismiss={() => setNotification({ ...notification, show: false })} // 'show' controls presence, 'visible' controls animation state
                onExited={() => setNotification({ ...notification, message: '', type: '', show: false, visible: false })} // Fully reset after exit animation
            />
            {modal.show && <Modal title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={() => setModal({ ...modal, show: false })} />}

            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-yellow-500">Digital Signage Admin Panel</h1>
            </header>

            {/* Tab Navigation */}
            <nav className="flex border-b border-gray-700 mb-8">
                <TabButton onClick={() => setActiveTab('global')} isActive={activeTab === 'global'}>Global Settings</TabButton>
                <TabButton onClick={() => setActiveTab('lists')} isActive={activeTab === 'lists'}>Slideshows</TabButton>
                <TabButton onClick={() => setActiveTab('library')} isActive={activeTab === 'library'}>Image Library</TabButton>
                {/* Keep Import/Export as its own section below tabs for now */}
            </nav>

            {/* Tab Content */}
            <main>
                {activeTab === 'global' && (
                    <GlobalSettingsTab
                        config={data.globalConfig}
                        onSave={handleSaveGlobalConfig}
                    />
                )}
                {activeTab === 'lists' && (
                    <SlideshowsTab
                        imageLists={data.imageLists}
                        selectedListId={selectedListId}
                        onSelectList={setSelectedListId}
                        onReorderList={handleReorderList}
                        onCreateList={handleCreateList}
                        onDeleteList={handleDeleteList}
                        showNotification={showNotification} // Pass down notification function
                    />
                )}
                {activeTab === 'library' && (
                    <ImageLibraryTab
                        images={data.images}
                        onAddImage={handleAddNewImage}
                        onUpdateImage={handleUpdateImage}
                        onDeleteImage={handleDeleteImage}
                        showNotification={showNotification} // Pass down notification function
                        API_URL={API_URL} // Pass API_URL for upload
                    />
                )}

                {/* Import/Export Section - Separate from Tabs */}
                <ImportExport
                    API_URL={API_URL}
                    showNotification={showNotification}
                    onImportComplete={fetchData} // Refetch data after a full import
                />
            </main>
        </div>
    );
}

