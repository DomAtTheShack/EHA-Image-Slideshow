import React, { useRef } from 'react';
import { Button } from './UIComponents'; // Assuming Button is in UIComponents

export default function ImportExportSlideshow({ selectedListId, selectedListName, showNotification, API_URL }) {
    const fileInputRef = useRef(null);

    // --- Export Specific Slideshow ---
    const handleExportList = async () => {
        if (!selectedListId) {
            showNotification('Please select a slideshow to export.', 'error');
            return;
        }
        try {
            // Use the specific export route for a single list
            const response = await fetch(`${API_URL}/admin/export/list/${selectedListId}`);
            if (!response.ok) throw new Error(`Export failed: ${response.statusText}`);

            const data = await response.json(); // The backend sends the populated list data directly

            // Create filename based on list name
            const listNameSlug = selectedListName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileName = `slideshow_${listNameSlug}_${new Date().toISOString().split('T')[0]}.json`;

            // Create download link
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
            const link = document.createElement('a');
            link.href = jsonString;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showNotification(`Slideshow "${selectedListName}" exported successfully!`);
        } catch (err) {
            showNotification(`Export error: ${err.message}`, 'error');
        }
    };

    // --- Import Specific Slideshow ---
    const handleImportListClick = () => {
        if (!selectedListId) {
            showNotification('Please select a slideshow to import into.', 'error');
            return;
        }
        fileInputRef.current.click(); // Trigger file input
    };

    const handleListFileChange = (event) => {
        const file = event.target.files[0];
        if (!file || !selectedListId) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = JSON.parse(e.target.result);

                // Use the specific import route for a single list
                const response = await fetch(`${API_URL}/admin/import/list/${selectedListId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(content), // Send the parsed JSON content
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.msg || 'Import failed');
                }
                const result = await response.json();
                showNotification(result.msg || 'Slideshow imported successfully! Refreshing data...');
                // You might need to trigger a data refresh in the parent component here
                // For now, relying on user potentially refreshing or parent refetching later.

            } catch (err) {
                showNotification(`Import error: ${err.message}`, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = null; // Reset file input
    };

    return (
        <div className="bg-gray-700 p-4 rounded-lg mb-6 border border-gray-600">
            <h4 className="text-md font-semibold text-gray-200 mb-3">Import / Export Selected Slideshow</h4>
            <p className="text-xs text-gray-400 mb-3">Export the currently selected slideshow ("{selectedListName}") including its image details, or import a JSON file to overwrite it.</p>
            <div className="flex gap-4">
                <Button onClick={handleExportList} color="blue" disabled={!selectedListId}>
                    Export "{selectedListName}"
                </Button>
                <Button onClick={handleImportListClick} color="gray" disabled={!selectedListId}>
                    Import into "{selectedListName}"
                </Button>
                {/* Hidden file input for list import */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleListFileChange}
                    className="hidden"
                    accept=".json"
                />
            </div>
        </div>
    );
}
