import React, { useRef } from 'react';
import { Section, Button } from './UIComponents';

export default function ImportExport({ API_URL, showNotification, onImportComplete, apiKey }) {
    const fileInputRef = useRef(null);

    // --- Export All Data ---
    const handleExportAll = async () => {
        if (!apiKey) return showNotification('Not authorized.', 'error');

        try {
            const response = await fetch(`${API_URL}/admin/export/all`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });

            if (!response.ok) throw new Error(`Export failed: ${response.statusText}`);

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const fileName = `digital_signage_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            showNotification('All data exported successfully!', 'success');
        } catch (err) {
            showNotification(`Export error: ${err.message}`, 'error');
        }
    };

    // --- Import All Data ---
    const handleImportClick = () => {
        fileInputRef.current.click(); // Trigger hidden file input
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = JSON.parse(e.target.result);

                if (!content.globalConfig || !content.imageLists || !content.images) {
                    throw new Error('Invalid JSON structure for import.');
                }

                if (!window.confirm('Importing this file will OVERWRITE all current settings, slideshows, and images. Are you sure?')) {
                    event.target.value = null;
                    return;
                }

                const response = await fetch(`${API_URL}/admin/import/all`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify(content),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.msg || 'Import failed');
                }

                const result = await response.json();
                showNotification(result.msg || 'Data imported successfully!', 'success');
                onImportComplete();

            } catch (err) {
                showNotification(`Import error: ${err.message}`, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = null; // reset file input
    };

    return (
        <Section title="Backup & Restore (Import/Export All Data)">
            <p className="text-sm text-gray-400 mb-4">
                Export all settings, slideshows, and images to a JSON file for backup. Import a previously exported file to restore the configuration (this will overwrite everything!).
            </p>
            <div className="flex gap-4">
                <Button onClick={handleExportAll} color="blue">Export All Data</Button>
                <Button onClick={handleImportClick} color="gray">Import All Data</Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".json"
                />
            </div>
        </Section>
    );
}
