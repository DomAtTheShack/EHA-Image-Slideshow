import React, { useState, useEffect } from 'react';

// =================================================================================================
// HELPER FUNCTIONS (No changes here)
// =================================================================================================

/**
 * Formats a Date object into a 12-hour time string (e.g., "04:03 PM").
 * @param {Date} date The date object to format.
 * @returns {string} The formatted time string.
 */
const formatTime = (date) => {
    return date.toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).toUpperCase();
};

/**
 * Formats a Date object into a DD/MM/YYYY string.
 * @param {Date} date The date object to format.
 * @returns {string} The formatted date string.
 */
const formatDate = (date) => {
    return date.toLocaleString('en-AU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};


// =================================================================================================
// MAIN APPLICATION COMPONENT
// =================================================================================================
export default function App() {
    // ---------------------------------------------------------------------------------------------
    // STATE MANAGEMENT - Now centered around a single 'config' object
    // ---------------------------------------------------------------------------------------------
    const [config, setConfig] = useState(null); // Holds the entire config object from the backend.
    const [currentIndex, setCurrentIndex] = useState(0); // Tracks the index of the currently displayed image.
    const [currentTime, setCurrentTime] = useState(formatTime(new Date()));
    const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
    const [weather, setWeather] = useState({ temp: 11, condition: 'Clear' }); // TODO: Fetch real weather based on config.weatherLocation
    const [error, setError] = useState(null);

    // ---------------------------------------------------------------------------------------------
    // SIDE EFFECTS (useEffect)
    // ---------------------------------------------------------------------------------------------

    // EFFECT 1: Fetch the main config object from the backend API.
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/display/config');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                if (data && data.images && data.images.length > 0) {
                    setConfig(data);
                    setError(null);
                } else {
                    setConfig(null); // Clear previous config if it exists
                    setError("Configuration loaded, but no images found. Please add images via the admin panel.");
                }

            } catch (e) {
                console.error("Failed to fetch display configuration:", e);
                setError("Could not connect to the server. Please check the connection.");
                setConfig(null);
            }
        };

        fetchData();
        const dataFetchInterval = setInterval(fetchData, 60000); // Refetch every minute for updates
        return () => clearInterval(dataFetchInterval);
    }, []);

    // EFFECT 2: Manage the DYNAMIC image slideshow timer.
    // This now uses setTimeout recursively to handle variable slide durations.
    useEffect(() => {
        if (!config || !config.images || config.images.length === 0) {
            return; // Don't start the timer if there's no data.
        }

        const currentImage = config.images[currentIndex];
        // Use the image's duration, or the global default, or fall back to 7 seconds.
        const durationInSeconds = currentImage.duration || config.defaultDuration || 7;
        const durationInMilliseconds = durationInSeconds * 1000;

        const timer = setTimeout(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % config.images.length);
        }, durationInMilliseconds);

        // Cleanup the timer when the slide changes or config is updated.
        return () => clearTimeout(timer);
    }, [currentIndex, config]);

    // EFFECT 3: Manage the live clock (no changes needed here).
    useEffect(() => {
        const clockInterval = setInterval(() => {
            const now = new Date();
            setCurrentTime(formatTime(now));
            setCurrentDate(formatDate(now));
        }, 1000);
        return () => clearInterval(clockInterval);
    }, []);

    // ---------------------------------------------------------------------------------------------
    // RENDER LOGIC
    // ---------------------------------------------------------------------------------------------

    // RENDER CASE 1: Display an error message.
    if (error) {
        return (
            <div className="w-screen h-screen bg-red-900 flex flex-col items-center justify-center text-white text-3xl font-sans p-10 text-center">
                <h1 className="text-6xl font-bold mb-4">Display Error</h1>
                <p>{error}</p>
            </div>
        );
    }

    // RENDER CASE 2: Display a loading message while waiting for the config.
    if (!config) {
        return (
            <div className="w-screen h-screen bg-black flex items-center justify-center text-white text-3xl font-sans">
                Loading Configuration...
            </div>
        );
    }

    // Get the current image from the config's images array.
    const currentImage = config.images[currentIndex];

    // RENDER CASE 3: The main display.
    return (
        <div className="w-screen h-screen bg-black text-white p-8 flex flex-col font-sans overflow-hidden">
            {/* --- Header Section (uses config.title) --- */}
            <header className="flex justify-between items-baseline mb-6">
                <h1 className="text-5xl font-bold">{config.title}</h1>
                <div className="text-5xl font-semibold">{currentTime}</div>
            </header>

            {/* --- Main Content Area --- */}
            <main className="flex-grow flex gap-8 h-[calc(100%-100px)]">
                {/* --- Image Display Section --- */}
                <div className="flex-1 flex flex-col justify-center items-center h-full relative">
                    {config.images.map((image, index) => (
                        <img
                            key={image._id || image.url} // Use MongoDB's _id for a stable key
                            src={image.url}
                            alt={image.credit}
                            className={`absolute top-0 left-0 w-full h-full object-contain transition-opacity duration-1000 ease-in-out ${
                                index === currentIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                        />
                    ))}
                    <div className="absolute bottom-4 left-4 text-3xl font-medium bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                        {currentImage?.credit}
                    </div>
                </div>

                {/* --- Side Information Panel (uses config.temperatureUnit) --- */}
                <aside className="w-[350px] bg-yellow-400 text-black p-8 rounded-2xl flex flex-col justify-start items-start gap-8">
                    <div className="w-full">
                        <h2 className="text-4xl font-bold mb-2">Date:</h2>
                        <p className="text-4xl font-semibold">{currentDate}</p>
                    </div>
                    <div className="w-full">
                        <h2 className="text-4xl font-bold mb-2">Weather:</h2>
                        <p className="text-4xl font-semibold">{weather.temp}°{config.temperatureUnit}</p>
                    </div>
                </aside>
            </main>
        </div>
    );
}

