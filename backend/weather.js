const { writeFileSync, readFileSync } = require('fs');
const cheerio = require('cheerio');

// ---------------- WEATHER FETCH ----------------
async function fetchWeatherData(globalConfig) {
    const BASE_WEATHER_API = "https://api.weatherapi.com/v1/current.json";

    try {
        const url = new URL(BASE_WEATHER_API);
        const params = {
            key: process.env.WEATHER_API_KEY,
            q: globalConfig.get('weatherLocation').replace(' ', ''),
            aqi: 'yes',
        };
        url.search = new URLSearchParams(params).toString();

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Weather API error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching weather data:', error.message);
        throw error;
    }
}

// ---------------- FILE WRITER ----------------
function writeWeatherData(weatherData, globalConfig) {
    const today = new Date();
    const dateString = today.toDateString();
    const filename = `${globalConfig.get('weatherLocation')} ${dateString} ${today.getHours()}hr`;

    const jsonString = JSON.stringify(weatherData, null, 2);
    writeFileSync(`weather/${filename}.json`, jsonString);
}

// ---------------- SNOWFALL SCRAPER ----------------
async function getSnowfallTotal() {
    const url = "https://www.keweenawcountyonline.org/snowfall2.php";

    try {
        const response = await fetch(url);
        const html = await response.text();

        const $ = cheerio.load(html);
        const text = $("p.sub-snow").text();

        const match = text.match(/Season Total:\s*([0-9.]+)\s*inches/i);
        if (match) {
            return parseFloat(match[1]);
        } else {
            throw new Error("Could not find snowfall total");
        }
    } catch (err) {
        console.error("Error fetching snowfall data:", err);
        return null;
    }
}

// Export all helpers
module.exports = { fetchWeatherData, writeWeatherData, getSnowfallTotal };
