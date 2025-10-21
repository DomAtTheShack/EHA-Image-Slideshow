import React, { useState, useEffect } from 'react';
import GlobalSettingsTab from './GlobalSettingsTab';
import SlideshowsTab from './SlideshowsTab';
import ImageLibraryTab from './ImageLibraryTab';
import Notification from './Notifications';
import Modal from './Modal';
import { TabButton } from './UIComponents';

export default function AdminPanel() {
    // --- State Management ---
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({ globalConfig: null, imageLists: [], images: [] });
    const [activeTab, setActiveTab] = useState('global');
    const [selectedListId, setSelectedListId] = useState('');
    const [notification, setNotification] = useState({ message: '', type: '', show: false });
    const [modal, setModal] = useState({ show: false, title: '', message: '', onConfirm: () => {} });

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

    // --- Data Fetching ---
    const fetchData = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/data`);
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            const fetchedData = await response.json();
            setData(fetchedData);
            if (fetchedData.imageLists.length > 0 && !selectedListId) {
                setSelectedListId(fetchedData.imageLists[0]._id);
            }
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Helper Functions for Notifications & Modals ---
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type, show: true });
    };

    const showConfirmModal = (title, message, onConfirm) => {
        setModal({ show: true, title, message, onConfirm });
    };

    // --- API Call Handlers ---
    const handleSaveGlobalConfig = async (configToSave) => {
        try {
            await fetch(`${API_URL}/admin/global-config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configToSave),
            });
            showNotification('Global settings saved successfully!');
            fetchData(); // Refetch to confirm changes
        } catch (err) {
            showNotification(`Error saving settings: ${err.message}`, 'error');
        }
    };

    const handleAddNewImage = async (newImageData) => {
        try {
            const response = await fetch(`${API_URL}/admin/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newImageData),
            });
            if (!response.ok) throw new Error('Failed to add image');
            await fetchData();
            showNotification('Image added to library.');
        } catch (err) {
            showNotification(`Error adding image: ${err.message}`, 'error');
        }
    };

    const handleUpdateImage = async (editingImage) => {
        try {
            const response = await fetch(`${API_URL}/admin/images/${editingImage._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingImage),
            });
            if (!response.ok) throw new Error('Failed to update image');
            await fetchData();
            showNotification('Image updated successfully.');
        } catch (err) {
            showNotification(`Error updating image: ${err.message}`, 'error');
        }
    };

    const handleDeleteImage = (imageId) => {
        showConfirmModal(
            'Delete Image?',
            'This will remove the image from all lists and delete it permanently. This action cannot be undone.',
            async () => {
                try {
                    await fetch(`${API_URL}/admin/images/${imageId}`, { method: 'DELETE' });
                    await fetchData();
                    showNotification('Image deleted permanently.');
                } catch (err) {
                    showNotification(`Error deleting image: ${err.message}`, 'error');
                }
                setModal({ ...modal, show: false });
            }
        );
    };

    const handleUpdateImageList = async (listId, images, successMessage) => {
        try {
            await fetch(`${API_URL}/admin/image-lists/${listId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images }),
            });
            await fetchData();
            if (successMessage) showNotification(successMessage);
        } catch(err) {
            showNotification(`Error updating list: ${err.message}`, 'error');
        }
    };

    const handleAddImageToList = (imageId) => {
        const list = data.imageLists.find(l => l._id === selectedListId);
        if (list.images.some(img => img._id === imageId)) return showNotification('Image is already in this list.', 'error');
        const updatedImageIds = [...list.images.map(img => img._id), imageId];
        handleUpdateImageList(selectedListId, updatedImageIds, 'Image added to slideshow.');
    };

    const handleRemoveImageFromList = (imageId) => {
        const list = data.imageLists.find(l => l._id === selectedListId);
        const updatedImageIds = list.images.map(img => img._id).filter(id => id !== imageId);
        handleUpdateImageList(selectedListId, updatedImageIds, 'Image removed from slideshow.');
    };

    const handleReorderList = (listId, reorderedImageIds) => {
        // Optimistically update the UI for a smooth drag-and-drop experience
        setData(prevData => ({
            ...prevData,
            imageLists: prevData.imageLists.map(list => {
                if (list._id === listId) {
                    const reorderedImages = reorderedImageIds.map(id =>
                        list.images.find(img => img._id === id)
                    );
                    return { ...list, images: reorderedImages };
                }
                return list;
            })
        }));
        handleUpdateImageList(listId, reorderedImageIds, null);
    };

    // --- Render Logic ---
    if (loading) return <div className="text-center p-10">Loading Admin Panel...</div>;
    if (error) return <div className="text-red-500 text-center p-10">Error: {error}</div>;
    if (!data.globalConfig) return <div className="text-yellow-500 text-center p-10">No configuration data found. Please check the backend.</div>;

    return (
        <div className="p-4 md:p-8">
            {notification.show && <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ ...notification, show: false })} />}
            {modal.show && <Modal title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={() => setModal({ ...modal, show: false })} />}

            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-yellow-500">Digital Signage Admin Panel</h1>
            </header>

            <nav className="flex border-b border-gray-700">
                <TabButton onClick={() => setActiveTab('global')} isActive={activeTab === 'global'}>Global Settings</TabButton>
                <TabButton onClick={() => setActiveTab('lists')} isActive={activeTab === 'lists'}>Slideshows</TabButton>
                <TabButton onClick={() => setActiveTab('library')} isActive={activeTab === 'library'}>Image Library</TabButton>
            </nav>

            <main className="mt-8">
                {activeTab === 'global' && (
                    <GlobalSettingsTab
                        config={data.globalConfig}
                        onSave={handleSaveGlobalConfig}
                    />
                )}
                {activeTab === 'lists' && (
                    <SlideshowsTab
                        imageLists={data.imageLists}
                        allImages={data.images}
                        selectedListId={selectedListId}
                        onSelectList={setSelectedListId}
                        onAddImageToList={handleAddImageToList}
                        onRemoveImageFromList={handleRemoveImageFromList}
                        onReorderList={handleReorderList}
                    />
                )}
                {activeTab === 'library' && (
                    <ImageLibraryTab
                        images={data.images}
                        onAddImage={handleAddNewImage}
                        onUpdateImage={handleUpdateImage}
                        onDeleteImage={handleDeleteImage}
                    />
                )}
            </main>
        </div>
    );
}

