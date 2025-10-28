import React, { useState, useEffect, useRef } from 'react';
import GlobalSettingsTab from './GlobalSettingsTab';
import SlideshowsTab from './SlideshowsTab';
import ImageLibraryTab from './ImageLibraryTab';
import Notification from './Notification';
import Modal from './Modal';
import { TabButton } from './UIComponents';

export default function AdminPanel() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({ globalConfig: null, imageLists: [], images: [] });
    const [activeTab, setActiveTab] = useState('global');
    const [selectedListId, setSelectedListId] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [apiKey, setApiKey] = useState(localStorage.getItem('adminToken') || '');
    const [loginModal, setLoginModal] = useState({ show: !apiKey, password: '' });
    const passwordInputRef = useRef(null);

    const API_URL = process.env.REACT_APP_API_URL;

    // --- Notifications ---
    const addNotification = (message, type = 'success') => {
        const id = Date.now() + Math.random();
        setNotifications(prev => [...prev, { id, message, type }]);
    };
    const removeNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

    // --- Logout ---
    const handleLogout = () => {
        setApiKey('');
        localStorage.removeItem('adminToken');
        setLoginModal({ show: true, password: '' });
        setData({ globalConfig: null, imageLists: [], images: [] });
    };

    // --- Fetch admin data ---
    const fetchData = async () => {
        if (!apiKey) return;
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`${API_URL}/admin/data`, {
                headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
                throw new Error(res.statusText);
            }
            const fetchedData = await res.json();
            setData(fetchedData);
            if (fetchedData.imageLists?.length > 0) {
                if (!selectedListId || !fetchedData.imageLists.some(l => l._id === selectedListId)) {
                    setSelectedListId(fetchedData.imageLists[0]._id);
                }
            } else setSelectedListId('');
        } catch (err) {
            if (err.message === 'Unauthorized') {
                addNotification('Session expired. Please log in again.', 'error');
                handleLogout();
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (apiKey) {
            localStorage.setItem('adminToken', apiKey);
            fetchData();
        } else {
            setLoading(false);
        }
    }, [apiKey]);

    // --- Login ---
    const handleLoginSubmit = async () => {
        if (!loginModal.password.trim()) {
            addNotification('Password is required.', 'error');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: loginModal.password }),
            });
            if (!res.ok) throw new Error('Invalid password');
            const { token } = await res.json();
            setApiKey(token);
            setLoginModal({ show: false, password: '' });
            addNotification('Login successful.', 'success');
        } catch (err) {
            addNotification('Login failed: ' + err.message, 'error');
        }
    };

    // -----------------------------------------------------------------
    // --- API HANDLERS FOR IMAGE LIBRARY (THE FIX) ---
    // -----------------------------------------------------------------

    const handleImageAdd = async (newImageData) => {
        try {
            const res = await fetch(`${API_URL}/admin/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify(newImageData),
            });
            if (!res.ok) throw new Error(await res.json().then(e => e.msg || 'Failed to add image'));
            addNotification('Image added successfully.', 'success');
            fetchData(); // Refresh all data
        } catch (err) {
            addNotification(`Error: ${err.message}`, 'error');
        }
    };

    const handleImageUpdate = async (imageToUpdate) => {
        try {
            const res = await fetch(`${API_URL}/admin/images/${imageToUpdate._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify(imageToUpdate),
            });
            if (!res.ok) throw new Error(await res.json().then(e => e.msg || 'Failed to update image'));
            addNotification('Image updated successfully.', 'success');
            fetchData(); // Refresh all data
        } catch (err) {
            addNotification(`Error: ${err.message}`, 'error');
        }
    };

    const handleImageDelete = async (imageId) => {
        if (!window.confirm('Are you sure you want to delete this image? It will be removed from all slideshows.')) return;
        try {
            const res = await fetch(`${API_URL}/admin/images/${imageId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (!res.ok) throw new Error(await res.json().then(e => e.msg || 'Failed to delete image'));
            addNotification('Image deleted successfully.', 'success');
            fetchData(); // Refresh all data
        } catch (err) {
            addNotification(`Error: ${err.message}`, 'error');
        }
    };

    // -----------------------------------------------------------------
    // --- API HANDLERS FOR SLIDESHOWS (THE FIX) ---
    // -----------------------------------------------------------------

    const handleListCreate = async (newListName) => {
        try {
            const res = await fetch(`${API_URL}/admin/image-lists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({ name: newListName }),
            });
            if (!res.ok) throw new Error(await res.json().then(e => e.msg || 'Failed to create list'));
            addNotification('Slideshow created.', 'success');
            await fetchData(); // Refresh data to get new list
        } catch (err) {
            addNotification(`Error: ${err.message}`, 'error');
        }
    };

    const handleListDelete = async (listId) => {
        if (data.imageLists.find(l => l._id === listId)?.name === 'Default') {
            addNotification("Cannot delete the 'Default' slideshow.", 'error');
            return;
        }
        if (!window.confirm('Are you sure you want to delete this slideshow?')) return;
        try {
            const res = await fetch(`${API_URL}/admin/image-lists/${listId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (!res.ok) throw new Error(await res.json().then(e => e.msg || 'Failed to delete list'));
            addNotification('Slideshow deleted.', 'success');
            setSelectedListId(''); // Clear selection
            fetchData(); // Refresh data
        } catch (err) {
            addNotification(`Error: ${err.message}`, 'error');
        }
    };

    // This updates the LOCAL state immediately for a fast UI
    const handleListReorder = (listId, imageIds) => {
        setData(prev => ({
            ...prev,
            imageLists: prev.imageLists.map(list => {
                if (list._id !== listId) return list;
                // We must repopulate the images array to match the new ID order
                const newImages = imageIds.map(id =>
                    prev.images.find(img => img._id === id)
                ).filter(Boolean); // Filter out any undefined
                return { ...list, images: newImages };
            })
        }));
    };

    // This is the DEBOUNCED API call from SlideshowsTab
    const handleListAutoSave = async (listId, imageIds) => {
        try {
            const res = await fetch(`${API_URL}/admin/image-lists/${listId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({ images: imageIds }),
            });
            if (!res.ok) throw new Error('Autosave failed');
            addNotification('Slideshow order saved.', 'success');
            // No full fetchData() needed, local state is already correct
        } catch (err) {
            addNotification(err.message, 'error');
        }
    };


    // --- RENDER LOGIC ---

    if (loading) return <div className="text-center p-10 text-gray-400">Loading Admin Panel...</div>;
    if (error) return <div className="text-red-500 text-center p-10">Error: {error}</div>;
    if (apiKey && (!data.globalConfig || !data.imageLists)) {
        return <div className="text-yellow-500 text-center p-10">Initializing...</div>;
    }

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans p-4 md:p-8 relative">
            {notifications.map(n => (
                <Notification
                    key={n.id}
                    message={n.message}
                    type={n.type}
                    onDismiss={() => removeNotification(n.id)}
                />
            ))}

            {loginModal.show && (
                <Modal title="Admin Login" hideButtons>
                    <input
                        type="password"
                        value={loginModal.password}
                        onChange={e => setLoginModal({ ...loginModal, password: e.target.value })}
                        placeholder="Enter password"
                        ref={passwordInputRef}
                        className="p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none w-full mb-4"
                        onKeyDown={e => { if (e.key === 'Enter') handleLoginSubmit(); }}
                        autoFocus
                    />
                    <button
                        onClick={handleLoginSubmit}
                        className="w-full bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400"
                    >
                        Login
                    </button>
                </Modal>
            )}

            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-yellow-500">Digital Signage Admin Panel</h1>
                {apiKey && <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded hover:bg-red-500">Logout</button>}
            </header>

            {apiKey && data.globalConfig && (
                <>
                    <nav className="flex border-b border-gray-700 mb-8 overflow-x-auto">
                        <TabButton onClick={() => setActiveTab('global')} isActive={activeTab === 'global'}>Global Settings</TabButton>
                        <TabButton onClick={() => setActiveTab('lists')} isActive={activeTab === 'lists'}>Slideshows</TabButton>
                        <TabButton onClick={() => setActiveTab('library')} isActive={activeTab === 'library'}>Image Library</TabButton>
                    </nav>

                    <main>
                        {activeTab === 'global' && (
                            <GlobalSettingsTab
                                config={data.globalConfig}
                                API_URL={API_URL}
                                showNotification={addNotification}
                                imageLists={data.imageLists}
                                apiKey={apiKey}
                                onImportComplete={fetchData}
                            />
                        )}

                        {activeTab === 'lists' && (
                            <SlideshowsTab
                                imageLists={data.imageLists}
                                allImages={data.images}
                                selectedListId={selectedListId}
                                onSelectList={setSelectedListId}
                                showNotification={addNotification}
                                API_URL={API_URL}
                                // --- FIX: Pass all required handlers ---
                                onCreateList={handleListCreate}
                                onDeleteList={handleListDelete}
                                onReorderList={handleListReorder}
                                autoSaveHandler={handleListAutoSave}
                            />
                        )}

                        {activeTab === 'library' && (
                            <ImageLibraryTab
                                images={data.images}
                                showNotification={addNotification}
                                API_URL={API_URL}
                                apiKey={apiKey}
                                // --- FIX: Pass all required handlers ---
                                onAddImage={handleImageAdd}
                                onUpdateImage={handleImageUpdate}
                                onDeleteImage={handleImageDelete}
                            />
                        )}
                    </main>
                </>
            )}
        </div>
    );
}