import React, { useState, useEffect, useCallback } from 'react';
import GlobalSettingsTab from './GlobalSettingsTab';
import SlideshowsTab from './SlideshowsTab';
import ImageLibraryTab from './ImageLibraryTab';
import Notification from './Notification';
import Modal from './Modal';
import { TabButton } from './UIComponents';

export default function AdminPanel() {
    // --- State Management ---
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({ globalConfig: null, imageLists: [], images: [] });
    const [activeTab, setActiveTab] = useState('global');
    const [selectedListId, setSelectedListId] = useState('');
    const [notification, setNotification] = useState({ message: '', type: 'success', show: false });
    const [modal, setModal] = useState({ show: false, title: '', message: '', onConfirm: () => {} });

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

    // --- Data Fetching ---
    const fetchData = useCallback(async (showSuccess = false) => {
        try {
            const response = await fetch(`${API_URL}/admin/data`);
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            const fetchedData = await response.json();
            setData(fetchedData);
            if (fetchedData.imageLists.length > 0 && !selectedListId) {
                setSelectedListId(fetchedData.imageLists[0]._id);
            }
            if (showSuccess) {
                showNotification('Data refreshed successfully!');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedListId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Helper Functions ---
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
            fetchData();
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
        showConfirmModal('Delete Image?', 'This will remove the image from all lists and delete it permanently.', async () => {
            try {
                await fetch(`${API_URL}/admin/images/${imageId}`, { method: 'DELETE' });
                await fetchData();
                showNotification('Image deleted permanently.');
            } catch (err) {
                showNotification(`Error deleting image: ${err.message}`, 'error');
            }
            setModal({ ...modal, show: false });
        });
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

    const handleCreateList = async (listName) => {
        try {
            const response = await fetch(`${API_URL}/admin/image-lists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: listName }),
            });
            if (!response.ok) throw new Error('Failed to create slideshow');
            const newList = await response.json();
            await fetchData();
            setSelectedListId(newList._id);
            showNotification(`Slideshow "${listName}" created.`);
        } catch (err) {
            showNotification(err.message, 'error');
        }
    };

    const handleDeleteList = (listId) => {
        const list = data.imageLists.find(l => l._id === listId);
        showConfirmModal(`Delete "${list.name}"?`, 'Are you sure you want to delete this slideshow? This cannot be undone.', async () => {
            try {
                await fetch(`${API_URL}/admin/image-lists/${listId}`, { method: 'DELETE' });
                await fetchData();
                showNotification(`Slideshow "${list.name}" deleted.`);
            } catch (err) {
                showNotification(err.message, 'error');
            }
            setModal({ ...modal, show: false });
        });
    };

    const handleReorderList = (listId, reorderedImages) => {
        setData(prevData => ({
            ...prevData,
            imageLists: prevData.imageLists.map(list =>
                list._id === listId ? { ...list, images: reorderedImages } : list
            )
        }));
        handleUpdateImageList(listId, reorderedImages.map(img => img._id));
    };

    // --- Render Logic ---
    if (loading) return <div className="text-center p-10">Loading Admin Panel...</div>;
    if (error) return <div className="text-red-500 text-center p-10">Error: {error}</div>;
    if (!data.globalConfig) return <div className="text-yellow-500 text-center p-10">No config data found.</div>;

    return (
        <div className="p-4 md:p-8">
            <Notification message={notification.message} type={notification.type} show={notification.show} onDismiss={() => setNotification(prev => ({ ...prev, show: false }))} />
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
                        apiUrl={API_URL}
                        onActionSuccess={() => fetchData(true)}
                        showNotification={showNotification}
                    />
                )}
                {activeTab === 'lists' && (
                    <SlideshowsTab
                        imageLists={data.imageLists}
                        allImages={data.images}
                        selectedListId={selectedListId}
                        onSelectList={setSelectedListId}
                        onReorderList={handleReorderList}
                        onCreateList={handleCreateList}
                        onDeleteList={handleDeleteList}
                        onUpdateImageList={handleUpdateImageList}
                        showNotification={showNotification}
                    />
                )}
                {activeTab === 'library' && (
                    <ImageLibraryTab
                        images={data.images}
                        imageLists={data.imageLists}
                        selectedListId={selectedListId}
                        onAddImage={handleAddNewImage}
                        onUpdateImage={handleUpdateImage}
                        onDeleteImage={handleDeleteImage}
                        onAddImageToList={(imageId) => {
                            const list = data.imageLists.find(l => l._id === selectedListId);
                            if (list.images.some(img => img._id === imageId)) return showNotification('Image is already in this list.', 'error');
                            const updatedImageIds = [...list.images.map(img => img._id), imageId];
                            handleUpdateImageList(selectedListId, updatedImageIds, 'Image added to slideshow.');
                        }}
                    />
                )}
            </main>
        </div>
    );
}

