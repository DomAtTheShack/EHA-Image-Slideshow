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
    const [loginModal, setLoginModal] = useState({ show: true, password: '' });
    const [apiKey, setApiKey] = useState(localStorage.getItem('adminToken') || '');
    const passwordInputRef = useRef(null);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

    // --- Notifications ---
    const addNotification = (message, type = 'success') => {
        const id = Date.now() + Math.random();
        setNotifications(prev => [...prev, { id, message, type }]);
    };
    const removeNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

    // --- Fetch admin data ---
    const fetchData = async () => {
        if (!apiKey) return;
        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`${API_URL}/admin/data`, {
                headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (!res.ok) throw new Error(res.statusText);

            const fetchedData = await res.json();
            setData(fetchedData);

            if (fetchedData.imageLists?.length > 0) {
                if (!selectedListId || !fetchedData.imageLists.some(l => l._id === selectedListId)) {
                    setSelectedListId(fetchedData.imageLists[0]._id);
                }
            } else setSelectedListId('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (apiKey) {
            localStorage.setItem('adminToken', apiKey);
            fetchData();
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

    const handleLogout = () => {
        setApiKey('');
        localStorage.removeItem('adminToken');
        setLoginModal({ show: true, password: '' });
    };

    if (loading) return <div className="text-center p-10 text-gray-400">Loading Admin Panel...</div>;
    if (error) return <div className="text-red-500 text-center p-10">Error: {error}</div>;
    if (!data.globalConfig || !data.imageLists) return <div className="text-yellow-500 text-center p-10">Initializing...</div>;

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans p-4 md:p-8 relative">
            {/* Notifications */}
            {notifications.map(n => (
                <Notification
                    key={n.id}
                    message={n.message}
                    type={n.type}
                    onDismiss={() => removeNotification(n.id)}
                />
            ))}

            {/* Login Modal */}
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

            <nav className="flex border-b border-gray-700 mb-8 overflow-x-auto">
                <TabButton onClick={() => setActiveTab('global')} isActive={activeTab === 'global'}>Global Settings</TabButton>
                <TabButton onClick={() => setActiveTab('lists')} isActive={activeTab === 'lists'}>Slideshows</TabButton>
                <TabButton onClick={() => setActiveTab('library')} isActive={activeTab === 'library'}>Image Library</TabButton>
            </nav>

            <main>
                {apiKey && activeTab === 'global' && (
                    <GlobalSettingsTab
                        config={data.globalConfig}
                        API_URL={API_URL}
                        showNotification={addNotification}
                        imageLists={data.imageLists}
                        apiKey={apiKey}
                        onImportComplete={fetchData}
                    />
                )}

                {apiKey && activeTab === 'lists' && (
                    <SlideshowsTab
                        imageLists={data.imageLists}
                        allImages={data.images}
                        selectedListId={selectedListId}
                        onSelectList={setSelectedListId}
                        showNotification={addNotification}
                        API_URL={API_URL}
                    />
                )}

                {apiKey && activeTab === 'library' && (
                    <ImageLibraryTab
                        images={data.images}
                        onAddImage={() => {}}
                        onUpdateImage={() => {}}
                        onDeleteImage={() => {}}
                        showNotification={addNotification}
                        API_URL={API_URL}
                    />
                )}
            </main>
        </div>
    );
}
