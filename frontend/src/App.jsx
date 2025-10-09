import React, { useState, useEffect } from 'react';

// =================================================================================================
// HELPER FUNCTIONS (No changes here)
// =================================================================================================
const formatTime = (date) => {
    return date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
};
const formatDate = (date) => {
    return date.toLocaleString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// =================================================================================================
// MAIN APPLICATION COMPONENT
// =================================================================================================
export default function App() {
    // ---------------------------------------------------------------------------------------------
    // STATE MANAGEMENT
    // ---------------------------------------------------------------------------------------------
    const [globalConfig, setGlobalConfig] = useState(null);
    const [imageList, setImageList] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentTime, setCurrentTime] = useState(formatTime(new Date()));
    const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
    const [weather, setWeather] = useState({ temp: 11, condition: 'Clear' });
    const [error, setError] = useState(null);

    // ---------------------------------------------------------------------------------------------
    // SIDE EFFECTS (useEffect)
    // ---------------------------------------------------------------------------------------------

    // EFFECT 1: Fetch the combined config data from the backend.
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/display/data');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log("✅ Data fetched from backend:", data);

                if (data.globalConfig && data.imageList && data.imageList.images.length > 0) {
                    setGlobalConfig(data.globalConfig);
                    setImageList(data.imageList);
                    setError(null);
                } else {
                    setGlobalConfig(null);
                    setImageList(null);
                    setError("Configuration loaded, but no images found in the default list.");
                }

            } catch (e) {
                console.error("Failed to fetch display configuration:", e);
                setError("Could not connect to the server.");
            }
        };

        fetchData();
        const dataFetchInterval = setInterval(fetchData, 60000);
        return () => clearInterval(dataFetchInterval);
    }, []);

    // EFFECT 2: Manage the DYNAMIC image slideshow timer.
    useEffect(() => {
        if (!imageList || !imageList.images || imageList.images.length === 0) {
            return;
        }

        const currentImage = imageList.images[currentIndex];
        const durationInSeconds = currentImage.duration || globalConfig?.globalSlideDuration || 7;
        const durationInMilliseconds = durationInSeconds * 1000;

        console.log(`➡️ Scheduling next slide. Current index: ${currentIndex}. Duration: ${durationInSeconds}s.`);

        const timer = setTimeout(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % imageList.images.length);
        }, durationInMilliseconds);

        return () => clearTimeout(timer);
    }, [currentIndex, imageList, globalConfig]);

    // EFFECT 3: Manage the live clock.
    useEffect(() => {
        const clockInterval = setInterval(() => {
            const now = new Date();
            setCurrentTime(formatTime(now));
            setCurrentDate(formatDate(now));
        }, 1000);
        return () => clearInterval(clockInterval);
    }, []);

    // EFFECT 4: Handle auto-reloading the page on error.
    useEffect(() => {
        // If there is no error, do nothing.
        if (!error) {
            return;
        }

        // If there is an error, set a timer to reload the page.
        console.log(`🔴 Error detected. Reloading in 5 seconds...`);
        const reloadTimer = setTimeout(() => {
            console.log("Reloading the page now.");
            window.location.reload();
        }, 5000); // 5000 milliseconds = 5 seconds

        // Cleanup function: If the error is cleared before 5s, cancel the reload.
        return () => clearTimeout(reloadTimer);
    }, [error]); // This effect only runs when the 'error' state changes.

    // ---------------------------------------------------------------------------------------------
    // RENDER LOGIC
    // ---------------------------------------------------------------------------------------------

    if (error) {
        return (
            <div className="w-screen h-screen bg-red-900 flex flex-col items-center justify-center text-white text-3xl font-sans p-10 text-center">
                <h1 className="text-6xl font-bold mb-4">Display Error</h1>
                <p>{error}</p>
                <p className="mt-4 text-xl">Attempting to reload in 5 seconds...</p>
            </div>
        );
    }

    if (!globalConfig || !imageList) {
        return (
            <div className="w-screen h-screen bg-black flex items-center justify-center text-white text-3xl font-sans">
                Loading Configuration...
            </div>
        );
    }

    const currentImage = imageList.images[currentIndex];

    return (
        <div className="w-screen h-screen bg-black text-white p-8 flex flex-col font-sans overflow-hidden">
            <header className="flex justify-between items-baseline mb-6">
                <h1 className="text-5xl font-bold">{globalConfig.title}</h1>
                <div className="text-5xl font-semibold">{currentTime}</div>
            </header>

            <main className="flex-grow flex gap-8 h-[calc(100%-100px)]">
                <div className="flex-1 flex flex-col justify-center items-center h-full relative">
                    {imageList.images.map((image, index) => (
                        <img
                            key={image._id}
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

                <aside className="w-[350px] bg-yellow-400 text-black p-8 rounded-2xl flex flex-col justify-start items-start gap-8">
                    <div className="w-full">
                        <h2 className="text-4xl font-bold mb-2">Date:</h2>
                        <p className="text-4xl font-semibold">{currentDate}</p>
                    </div>
                    <div className="w-full">
                        <h2 className="text-4xl font-bold mb-2">Weather:</h2>
                        <p className="text-4xl font-semibold">{weather.temp}°{globalConfig.tempUnit}</p>
                    </div>
                </aside>
            </main>
        </div>
    );
}

