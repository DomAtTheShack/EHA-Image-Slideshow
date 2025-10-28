// src/components/GlobalSettingsTab.js

import React, { useState, useEffect } from 'react';
import { Section, InputField, SelectField, Button } from './UIComponents';
import ImportExport from './ImportExport';

// --- NEW TEXTAREA COMPONENT (Helper) ---
// A standard <input> isn't good for multi-line text, so let's use a <textarea>
const TextAreaField = ({ label, name, value, onChange, placeholder, rows = 4 }) => (
    <div className="w-full">
        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor={name}>
            {label}
        </label>
        <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className="p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 w-full"
        />
    </div>
);


export default function GlobalSettingsTab({
                                              config: initialConfig,
                                              API_URL,
                                              showNotification,
                                              onImportComplete,
                                              imageLists = [],
                                              apiKey
                                          }) {
    const [config, setConfig] = useState(initialConfig);
    const [saving, setSaving] = useState(false);

    // --- NEW STATE FOR THE TICKER TEXT ---
    const [eventsText, setEventsText] = useState('');

    useEffect(() => {
        setConfig(initialConfig);
        // When config loads, join the 'events' array into a string for the textarea
        if (initialConfig?.events) {
            setEventsText(initialConfig.events.join('\n'));
        }
    }, [initialConfig]);

    const saveConfigToBackend = async (updatedConfig, successMsg = 'Global settings saved.') => {
        if (!apiKey) return showNotification('Not authorized.', 'error');
        setSaving(true);
        try {
            const response = await fetch(`${API_URL}/admin/global-config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                // Send the config object
                body: JSON.stringify(updatedConfig),
            });

            if (!response.ok) throw new Error(response.statusText);
            showNotification(successMsg, 'success');
            // We refresh all data on successful save
            if (onImportComplete) onImportComplete();
        } catch (err) {
            showNotification(`Error saving global settings: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    // Generic handler for simple inputs (title, location, etc.)
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' ? parseFloat(value) || 0 : value;
        setConfig(prev => ({ ...prev, [name]: parsedValue }));
    };

    // --- NEW HANDLER for the events textarea ---
    const handleEventsChange = (e) => {
        setEventsText(e.target.value);
    };

    // --- MODIFIED Save Button onClick ---
    const handleSave = () => {
        // Convert the events text back into an array, removing any blank lines
        const eventsArray = eventsText.split('\n').filter(line => line.trim() !== '');

        // Combine the main config state with the new events array
        const configToSave = {
            ...config,
            events: eventsArray
        };

        saveConfigToBackend(configToSave);
    };

    if (!config) {
        return <Section title="Global Settings"><p className="text-gray-400">Loading global settings...</p></Section>;
    }

    return (
        <Section title="Global Settings">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <InputField
                    label="Display Title"
                    name="title"
                    value={config.title || ''}
                    onChange={handleChange}
                />
                <InputField
                    label="Weather Location"
                    name="weatherLocation"
                    value={config.weatherLocation || ''}
                    onChange={handleChange}
                />
                <InputField
                    label="Display Location Name"
                    name="location"
                    value={config.location || ''}
                    onChange={handleChange}
                />
                <InputField
                    label="Default Slide Duration (s)"
                    name="globalSlideDuration"
                    type="number"
                    value={config.globalSlideDuration || 7}
                    onChange={handleChange}
                />
                <SelectField
                    label="Time Format"
                    name="timeFormat"
                    value={config.timeFormat || '12hr'}
                    onChange={handleChange}
                >
                    <option value="12hr">12-Hour</option>
                    <option value="24hr">24-Hour</option>
                </SelectField>
                <SelectField
                    label="Unit System"
                    name="unitSystem"
                    value={config.unitSystem || 'metric'}
                    onChange={handleChange}
                >
                    <option value="metric">Metric (°C)</option>
                    <option value="imperial">Imperial (°F)</option>
                </SelectField>
                <SelectField
                    label="Currently Playing Slideshow"
                    name="activeSlideshowId"
                    value={config.activeSlideshowId || ''}
                    onChange={handleChange}
                >
                    <option value="">-- Select a Slideshow --</option>
                    {imageLists.map(list => (
                        <option key={list._id} value={list._id}>{list.name}</option>
                    ))}
                </SelectField>
            </div>

            {/* --- NEW TEXTAREA FOR TICKER --- */}
            <div className="mb-6">
                <TextAreaField
                    label="Ticker Events (One per line)"
                    name="events"
                    value={eventsText}
                    onChange={handleEventsChange}
                    placeholder="Hockey game tonight at 7 PM...&#10;Good luck on midterms!..."
                    rows={5}
                />
            </div>

            <Button
                onClick={handleSave} // Updated to use the new handleSave function
                color="green"
                disabled={saving}
            >
                {saving ? 'Saving...' : 'Save Global Settings'}
            </Button>

            <div className="mt-8 pt-6 border-t border-gray-600">
                <ImportExport
                    API_URL={API_URL}
                    showNotification={showNotification}
                    onImportComplete={onImportComplete}
                    apiKey={apiKey}
                />
            </div>
        </Section>
    );
}