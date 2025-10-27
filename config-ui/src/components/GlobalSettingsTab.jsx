import React, { useState, useEffect } from 'react';
import { Section, InputField, SelectField, Button } from './UIComponents';
import ImportExport from './ImportExport';

export default function GlobalSettingsTab({
                                              config: initialConfig,
                                              API_URL,
                                              showNotification,
                                              onImportComplete,
                                              imageLists = [],
                                              apiKey // <--- receive apiKey from AdminPanel
                                          }) {
    const [config, setConfig] = useState(initialConfig);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setConfig(initialConfig);
    }, [initialConfig]);

    const saveConfigToBackend = async (updatedConfig, successMsg = 'Global settings saved.') => {
        if (!apiKey) return showNotification('Not authorized.', 'error');
        setSaving(true);
        try {
            // inside saveConfigToBackend
            const response = await fetch(`${API_URL}/admin/global-config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`  // <--- fix
                },
                body: JSON.stringify(updatedConfig),
            });

            if (!response.ok) throw new Error(response.statusText);
            showNotification(successMsg, 'success');
            if (onImportComplete) onImportComplete();
        } catch (err) {
            showNotification(`Error saving global settings: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    // Generic handler for input changes
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' ? parseFloat(value) || 0 : value;
        const updatedConfig = { ...config, [name]: parsedValue };
        setConfig(updatedConfig);

        // Immediate save for activeSlideshowId
        if (name === 'activeSlideshowId') saveConfigToBackend(updatedConfig, 'Active slideshow updated.');
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
                    placeholder="e.g., Welcome!"
                />
                <InputField
                    label="Weather Location"
                    name="weatherLocation"
                    value={config.weatherLocation || ''}
                    onChange={handleChange}
                    placeholder="e.g., Houghton, MI"
                />
                <InputField
                    label="Display Location Name"
                    name="location"
                    value={config.location || ''}
                    onChange={handleChange}
                    placeholder="e.g., MTU Campus"
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
                    <option value="12hr">12-Hour (e.g., 4:00 PM)</option>
                    <option value="24hr">24-Hour (e.g., 16:00)</option>
                </SelectField>
                <SelectField
                    label="Unit System"
                    name="unitSystem"
                    value={config.unitSystem || 'metric'}
                    onChange={handleChange}
                >
                    <option value="metric">Metric (°C, km/h, mm)</option>
                    <option value="imperial">Imperial (°F, mph, in)</option>
                </SelectField>
                <SelectField
                    label="Currently Playing Slideshow"
                    name="activeSlideshowId"
                    value={config.activeSlideshowId || ''}
                    onChange={handleChange}
                    disabled={saving}
                >
                    <option value="">-- Select a Slideshow --</option>
                    {imageLists.map(list => (
                        <option key={list._id} value={list._id}>{list.name || 'Unnamed List'}</option>
                    ))}
                </SelectField>
            </div>

            <Button
                onClick={() => saveConfigToBackend(config)}
                color="green"
                disabled={saving}
            >
                Save Global Settings
            </Button>

            <div className="mt-8 pt-6 border-t border-gray-600">
                <ImportExport
                    API_URL={API_URL}
                    showNotification={showNotification}
                    onImportComplete={onImportComplete}
                    apiKey={apiKey} // pass token to import/export if needed
                />
            </div>
        </Section>
    );
}
