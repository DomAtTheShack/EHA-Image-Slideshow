import React, { useState, useEffect, useCallback } from 'react';
import { WiThermometer, WiRain, WiStrongWind, WiDaySunny, WiSnow } from 'react-icons/wi';

// =================================================================================================
// HELPER FUNCTIONS (No changes here)
// =================================================================================================
function formatTime(date, format = "12hr") {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");

    if (format === "24hr") {
        return `${hours.toString().padStart(2, "0")}:${minutes}`;
    } else {
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12; // Convert 0 → 12
        return `${hours}:${minutes} ${ampm}`;
    }
}

function formatDate(date) {
    return date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
    });
}


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
    const [error, setError] = useState(null);
    let percipUnit = "mm";
    let windUnit = "km/h";
    let tempUnit = "C";

    // ---------------------------------------------------------------------------------------------
    // DATA FETCHING LOGIC (now in a useCallback hook)
    // ---------------------------------------------------------------------------------------------
    const fetchData = useCallback(async () => {
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
    }, []); // Empty dependency array means this function is created only once.


    // ---------------------------------------------------------------------------------------------
    // SIDE EFFECTS (useEffect)
    // ---------------------------------------------------------------------------------------------

    // EFFECT 1: Fetch initial data when the component first loads.
    useEffect(() => {
        fetchData();
    }, [fetchData]); // The dependency array ensures this runs only once on mount.

    // EFFECT 2: Manage the DYNAMIC image slideshow timer and data refresh.
    useEffect(() => {
        if (!imageList || !imageList.images || imageList.images.length === 0) {
            return;
        }

        const currentImage = imageList.images[currentIndex];
        const durationInSeconds = currentImage.duration || globalConfig?.globalSlideDuration || 7;
        const durationInMilliseconds = durationInSeconds * 1000;

        console.log(`➡️ Scheduling next slide. Current index: ${currentIndex}. Duration: ${durationInSeconds}s.`);

        const timer = setTimeout(() => {
            const nextIndex = (currentIndex + 1) % imageList.images.length;
            setCurrentIndex(nextIndex);

            // *** NEW LOGIC: If we've looped back to the first image, it's the end of a cycle.
            if (nextIndex === 0) {
                console.log("✅ Slideshow cycle finished. Refetching data...");
                fetchData();
            }
        }, durationInMilliseconds);

        return () => clearTimeout(timer);
    }, [currentIndex, imageList, globalConfig, fetchData]); // Added fetchData to dependency array

    // EFFECT 3: Manage the live clock (no changes here).
    useEffect(() => {
        if (!globalConfig) return;

        const clockInterval = setInterval(() => {
            const now = new Date();
            setCurrentTime(formatTime(now, globalConfig.timeFormat));
            setCurrentDate(formatDate(now));
        }, 1000);

        return () => clearInterval(clockInterval);
    }, [globalConfig]);


    // EFFECT 4: Handle auto-reloading the page on error (no changes here).
    useEffect(() => {
        if (!error) return;

        console.log(`🔴 Error detected. Reloading in 5 seconds...`);
        const reloadTimer = setTimeout(() => {
            console.log("Reloading the page now.");
            window.location.reload();
        }, 5000);

        return () => clearTimeout(reloadTimer);
    }, [error]);

    // ---------------------------------------------------------------------------------------------
    // RENDER LOGIC (No changes below this line)
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

    if(globalConfig.unitSystem === "metric"){
        percipUnit = "mm";
        windUnit = "km/h";
        tempUnit = "C";
    }else{
        percipUnit = "in";
        windUnit = "mph";
        tempUnit = "F";
    }

    return (
        <div className="w-screen h-screen bg-black text-white p-8 flex flex-col font-sans overflow-hidden">
            <header className="flex justify-between items-baseline mb-6">
                <h1 className="text-5xl font-bold tracking-wide">{globalConfig.title}</h1>
                <div className="text-5xl font-mono">{currentTime}</div>
            </header>

            <main className="flex-grow flex gap-8 h-[calc(100%-100px)]">
                {/* Image Panel */}
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
                    <div className="absolute bottom-4 left-4 text-3xl font-medium bg-black bg-opacity-60 px-4 py-2 rounded-lg">
                        {currentImage?.credit}
                    </div>
                </div>

                {/* Weather Panel */}
                <aside className="w-[375px] bg-yellow-400 text-black p-8 rounded-2xl flex flex-col gap-6 shadow-2xl">
                    {/* Date */}
                    <div className="w-full">
                        <h2 className="text-5xl font-semibold">{currentDate}</h2>
                    </div>

                    <div className="w-full">
                        <h2 className="text-3xl font-bold mb-4">Weather in {globalConfig.location}</h2>

                        {/* Temperature */}
                        <div className="mb-4 flex items-center gap-4 p-4 bg-black bg-opacity-10 rounded-xl">
                            <WiThermometer className="text-4xl" />
                            <div>
                                <h3 className="text-xl font-semibold">Temperature</h3>
                                <p className="text-3xl">{globalConfig.temp}°{tempUnit}</p>
                            </div>
                        </div>

                        {/* Condition */}
                        <div className="mb-4 flex items-center gap-4 p-4 bg-black bg-opacity-10 rounded-xl">
                            <WiDaySunny className="text-4xl" />
                            <div>
                                <h3 className="text-xl font-semibold">Condition</h3>
                                <p className="text-3xl">{globalConfig.condition}</p>
                            </div>
                        </div>

                        {/* Precipitation */}
                        <div className="mb-4 flex items-center gap-4 p-4 bg-black bg-opacity-10 rounded-xl">
                            <WiRain className="text-4xl" />
                            <div>
                                <h3 className="text-xl font-semibold">Precipitation</h3>
                                <p className="text-3xl">{globalConfig.precipitation} {percipUnit}</p>
                            </div>
                        </div>

                        {/* Windchill */}
                        <div className="mb-4 flex items-center gap-4 p-4 bg-black bg-opacity-10 rounded-xl">
                            <WiSnow className="text-4xl" />
                            <div>
                                <h3 className="text-xl font-semibold">Windchill</h3>
                                <p className="text-3xl">{globalConfig.windChill}°{tempUnit}</p>
                            </div>
                        </div>

                        {/* Wind Speed & Direction */}
                        <div className="mb-4 flex items-center gap-4 p-4 bg-black bg-opacity-10 rounded-xl">
                            <WiStrongWind
                                className="text-4xl transform"
                                style={{ transform: `rotate(${globalConfig.windDegree + 90}deg)` }}
                            />
                            <div>
                                <h3 className="text-xl font-semibold">Wind</h3>
                                <p className="text-3xl">
                                    {globalConfig.windSpeed} {windUnit} • {globalConfig.windDir}
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
}

