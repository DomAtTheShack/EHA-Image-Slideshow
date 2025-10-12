let today = null;
const { writeFileSync, readFileSync } = require('fs');

async function fetchWeatherData(globalConfig) {
    try {
        today = new Date();
        const BASE_WEATHER_API = "https://api.weatherapi.com/v1/current.json";
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

        return response.json();

    } catch (error) {
        console.error('Error fetching weather data:', error.message);
        throw error; // let the caller handle the error
    }
}

function writeWeatherData(weatherData, globalConfig) {
    const dateString = today.toDateString();
    const filename = globalConfig.get('weatherLocation') + " " + dateString + " " + today.getHours() + "hr";

    const jsonString = JSON.stringify(weatherData, null, 2);

    writeFileSync(`weather/${filename}.json`, jsonString);
}

module.exports = { fetchWeatherData, writeWeatherData };
