import React, { useRef } from 'react';
import { Section, Button } from './UIComponents';

export default function ImportExport({ apiUrl, onActionSuccess, showNotification }) {
    const fileInputRef = useRef(null);

    const handleExport = async () => {
        try {
            const response = await fetch(`${apiUrl}/admin/export`);
            if (!response.ok) throw new Error('Export failed');
            const data = await response.json();
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;

            const link = document.createElement('a');
            link.href = jsonString;
            link.download = `signage-backup-${new Date().toISOString().split('T')[0]}.json`;

            // Append to body, click, and then remove for maximum browser compatibility
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showNotification('Configuration exported successfully!');
        } catch (err) {
            showNotification(`Export error: ${err.message}`, 'error');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = JSON.parse(e.target.result);
                const response = await fetch(`${apiUrl}/admin/import`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(content),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Import failed');
                }
                showNotification('Configuration imported successfully! Data is refreshing...');
                onActionSuccess();
            } catch (err) {
                showNotification(`Import error: ${err.message}`, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = null;
    };

    return (
        <Section title="Import / Export Configuration">
            <p className="text-gray-400 mb-4">You can export the entire database configuration to a JSON file as a backup, or import a backup file to restore the system.</p>
            <div className="flex gap-4">
                <Button onClick={handleExport} color="blue">Export to JSON</Button>
                <Button onClick={handleImportClick} color="gray">Import from JSON</Button>
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

