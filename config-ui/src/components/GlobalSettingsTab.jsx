import React, { useState } from 'react';
import { Section, InputField, SelectField, Button } from './UIComponents';

export default function GlobalSettingsTab({ config, onSave }) {
    const [localConfig, setLocalConfig] = useState(config);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const parsedValue = e.target.type === 'number' ? parseFloat(value) : value;
        setLocalConfig(prev => ({ ...prev, [name]: parsedValue }));
    };

    return (
        <Section title="Global Settings">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField label="Display Title" name="title" value={localConfig.title} onChange={handleChange} />
                <InputField label="Weather Location (e.g., Houghton, MI)" name="weatherLocation" value={localConfig.weatherLocation} onChange={handleChange} />
                <InputField label="Default Slide Duration (seconds)" name="globalSlideDuration" type="number" value={localConfig.globalSlideDuration} onChange={handleChange} />
                <SelectField label="Time Format" name="timeFormat" value={localConfig.timeFormat} onChange={handleChange}>
                    <option value="12hr">12-Hour</option>
                    <option value="24hr">24-Hour</option>
                </SelectField>
                <SelectField label="Unit System" name="unitSystem" value={localConfig.unitSystem} onChange={handleChange}>
                    <option value="metric">Metric (°C, km/h)</option>
                    <option value="imperial">Imperial (°F, mph)</option>
                </SelectField>
            </div>
            <Button onClick={() => onSave(localConfig)} color="green" className="mt-6">Save Global Settings</Button>
        </Section>
    );
}

