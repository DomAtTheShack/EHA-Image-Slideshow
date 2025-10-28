import React, { useState, useEffect, useCallback } from 'react';
import {
    WiThermometer,
    WiRain,
    WiStrongWind,
    WiDaySunny,
    WiSnow,
    WiCloudy,
    WiFog
} from 'react-icons/wi';

// =================================================================================================
// HELPER FUNCTIONS (No changes)
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

function getWeatherIcon(condition, className = "text-6xl") {
    if (!condition) return <WiDaySunny className={className} />;
    const cond = condition.toLowerCase();

    if (cond.includes('snow')) return <WiSnow className={className} />;
    if (cond.includes('rain') || cond.includes('drizzle')) return <WiRain className={className} />;
    if (cond.includes('cloud')) return <WiCloudy className={className} />;
    if (cond.includes('fog') || cond.includes('mist')) return <WiFog className={className} />;
    if (cond.includes('clear')) return <WiDaySunny className={className} />;

    return <WiDaySunny className={className} />; // Default
}


// =================================================================================================
// MAIN APPLICATION COMPONENT
// =================================================================================================
export default function App() {
    // ---------------------------------------------------------------------------------------------
    // STATE MANAGEMENT (No changes)
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
    // DATA FETCHING LOGIC (No changes)
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
    }, []);


    // ---------------------------------------------------------------------------------------------
    // SIDE EFFECTS (useEffect) (No changes)
    // ---------------------------------------------------------------------------------------------

    // EFFECT 1: Fetch initial data
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // EFFECT 2: Manage the DYNAMIC image slideshow timer and data refresh
    useEffect(() => {
        if (!imageList || !imageList.images || imageList.images.length === 0) {
            return;
        }

        const currentImage = imageList.images[currentIndex];
        const durationInSeconds = currentImage?.duration || globalConfig?.globalSlideDuration || 7;
        const durationInMilliseconds = durationInSeconds * 1000;

        const timer = setTimeout(() => {
            const nextIndex = (currentIndex + 1) % imageList.images.length;
            setCurrentIndex(nextIndex);

            if (nextIndex === 0) {
                console.log("✅ Slideshow cycle finished. Refetching data...");
                fetchData();
            }
        }, durationInMilliseconds);

        return () => clearTimeout(timer);
    }, [currentIndex, imageList, globalConfig, fetchData]);

    // EFFECT 3: Manage the live clock
    useEffect(() => {
        if (!globalConfig) return;

        const clockInterval = setInterval(() => {
            const now = new Date();
            setCurrentTime(formatTime(now, globalConfig.timeFormat));
            setCurrentDate(formatDate(now));
        }, 1000);

        return () => clearInterval(clockInterval);
    }, [globalConfig]);


    // EFFECT 4: Handle auto-reloading the page on error
    useEffect(() => {
        if (!error) return;
        const reloadTimer = setTimeout(() => {
            window.location.reload();
        }, 5000);
        return () => clearTimeout(reloadTimer);
    }, [error]);

    // ---------------------------------------------------------------------------------------------
    // RENDER LOGIC (Loading/Error states) (No changes)
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

    // ---------------------------------------------------------------------------------------------
    // RENDER LOGIC (Main component)
    // ---------------------------------------------------------------------------------------------

    const currentImage = imageList.images[currentIndex];
    const weatherIcon = getWeatherIcon(globalConfig.condition);

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
        // --- OUTER CONTAINER FOR FLOATING EFFECT ---
        // This 'div' now has padding at the bottom (pb-8) to create the "floating" space.
        // The overall height is still 'h-screen' so it takes up the full viewport.
        <div className="w-screen h-screen bg-black text-white font-sans overflow-hidden flex flex-col pb-8">

            {/* --- MAIN CONTENT AREA (TOP) --- */}
            {/* flex-1 allows this to grow and take up available space, pushing the footer down */}
            <main className="flex-1 flex flex-row overflow-hidden p-8 pr-0 gap-8"> {/* Adjusted padding-right */}

                {/* --- LEFT COLUMN (Time & Weather) --- */}
                <div className="w-[375px] h-full flex-shrink-0 flex flex-col gap-8">

                    {/* --- TOP-LEFT BOX (TIME/DATE) --- */}
                    <aside className="bg-yellow-400 text-black p-6 rounded-2xl shadow-2xl flex-shrink-0">
                        <div className="w-full pb-4 border-b border-black border-opacity-20">
                            <h2 className="text-4xl font-semibold">{currentDate}</h2>
                        </div>
                        <div className="w-full pt-4">
                            <h2 className="text-7xl font-mono text-center font-bold">{currentTime}</h2>
                        </div>
                    </aside>

                    {/* --- BOTTOM-LEFT BOX (WEATHER) --- */}
                    <aside className="bg-yellow-400 text-black p-6 rounded-2xl shadow-2xl flex-1 flex flex-col overflow-y-auto">
                        <div className="w-full">
                            <h2 className="text-3xl font-bold mb-4">Weather at {globalConfig.location}</h2>

                            {/* Condition & Temp */}
                            <div className="mb-4 flex items-center gap-4 p-4 bg-black bg-opacity-10 rounded-xl">
                                {weatherIcon}
                                <div>
                                    <h3 className="text-2xl font-semibold">{globalConfig.condition}</h3>
                                    <p className="text-5xl font-bold">{globalConfig.temp}°{tempUnit}</p>
                                </div>
                            </div>

                            {/* Windchill */}
                            <div className="mb-4 flex items-center gap-4 p-4 bg-black bg-opacity-10 rounded-xl">
                                <WiThermometer className="text-5xl" />
                                <div>
                                    <h3 className="text-xl font-semibold">Windchill</h3>
                                    <p className="text-3xl">{globalConfig.windChill}°{tempUnit}</p>
                                </div>
                            </div>

                            {/* Seasonal Snowfall */}
                            <div className="mb-4 flex items-center gap-4 p-4 bg-black bg-opacity-10 rounded-xl">
                                <WiSnow className="text-5xl" />
                                <div>
                                    <h3 className="text-xl font-semibold">Seasonal Snowfall</h3>
                                    <p className="text-3xl">{globalConfig.snowTotal || 0} in</p>
                                </div>
                            </div>

                            {/* Wind Speed & Direction */}
                            <div className="mb-4 flex items-center gap-4 p-4 bg-black bg-opacity-10 rounded-xl">
                                <WiStrongWind
                                    className="text-5xl transform"
                                    style={{ transform: `rotate(${globalConfig.windDegree + 90}deg)` }}
                                />
                                <div>
                                    <h3 className="text-xl font-semibold">Wind</h3>
                                    <p className="text-3xl">
                                        {globalConfig.windSpeed} {windUnit} • {globalConfig.windDir}
                                    </p>
                                </div>
                            </div>

                            {/* Precipitation */}
                            <div className="mb-4 flex items-center gap-4 p-4 bg-black bg-opacity-10 rounded-xl">
                                <WiRain className="text-5xl" />
                                <div>
                                    <h3 className="text-xl font-semibold">Precipitation</h3>
                                    <p className="text-3xl">{globalConfig.precipitation} {percipUnit}</p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* --- RIGHT COLUMN (IMAGE SLIDESHOW) --- */}
                <div className="flex-1 h-full relative pr-8"> {/* Added padding-right here too */}
                    <div className="w-full h-full relative border-4 border-black rounded-2xl overflow-hidden">
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
                        <div className="absolute top-0 left-0 text-3xl font-medium bg-black bg-opacity-60 px-4 py-2 rounded-lg z-10">
                            {currentImage?.credit}
                        </div>
                    </div>
                </div>
            </main>

            {/* --- TICKER FOOTER --- */}
            <footer className="h-24 bg-black flex-shrink-0 flex items-center overflow-visible border-4 border-gray-400 rounded-r-2xl -ml-2 mr-8 relative">

                {/* --- TICKER SCROLL AREA (The Clipping Mask) --- */}
                <div className="flex-1 h-full relative overflow-hidden pr-40">
                    {/* FADE EFFECT ON LEFT SIDE */}
                    <div className="absolute left-0 top-0 h-full w-24 z-10 bg-gradient-to-r from-black to-transparent"></div>

                    {/* --- VERTICALLY CENTRED & SMOOTH-SCROLLING TICKER TEXT --- */}
                    {/*
                      - 'animate-ticker' is now defined in CSS to get its width from its children (inline-flex)
                      - 'flex items-center' will now correctly vertically centre the text
                      - Removed 'absolute inset-0' and 'translate-y-5'
                    */}
                    <div className="animate-ticker h-full flex items-center text-6xl font-bold tracking-wide whitespace-nowrap leading-none">
                        {(globalConfig.events && globalConfig.events.length > 0) ? (
                            globalConfig.events.map((event, index) => (
                                <React.Fragment key={index}>
                                <span className="mx-16">
                                    {event}
                                </span>
                                    {/* Removed 'translate-y-[0.2rem]' for correct alignment */}
                                    {index < globalConfig.events.length - 1 && (
                                        <span className="text-white text-7xl font-bold align-middle mx-2">•</span>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <span className="mx-16">Welcome to Michigan Tech!</span>
                        )}
                    </div>
                </div>

                {/* --- LOGO (Bottom-Right, Overlapping Outside Container) --- */}
                <div className="absolute right-0 bottom-0 top-0 flex items-center justify-center z-20 pointer-events-none">
                    <img
                        src="https://www.mtu.edu/mtu_resources/images/download-central/logos/husky-icon/full-color.png"
                        alt="MTU Logo"
                        className="h-32 translate-x-8 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    />
                </div>

            </footer>
        </div>
    );
}