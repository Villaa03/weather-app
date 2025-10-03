// ========================================
// VARIABLES GLOBALES
// ========================================

// API Key de OpenWeatherMap 
const API_KEY = '0b30cfbb21d8c5b263bb815ab5904382'; 

// URLs base de la API
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const WEATHER_URL = `${API_BASE_URL}/weather`;
const FORECAST_URL = `${API_BASE_URL}/forecast`;

// Elementos del DOM
const locationInput = document.getElementById('location-input');
const searchButton = document.getElementById('search-button');
const unitsSelector = document.getElementById('units');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorMessage = document.getElementById('error-message');
const currentWeatherEl = document.getElementById('current-weather');
const forecastSectionEl = document.getElementById('forecast-section');

// Elementos del clima actual
const cityName = document.getElementById('city-name');
const dateTime = document.getElementById('date-time');
const country = document.getElementById('country');
const weatherIcon = document.getElementById('weather-icon');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const pressure = document.getElementById('pressure');

// Elemento del pronóstico
const forecastGrid = document.getElementById('forecast-grid');

// ========================================
// EVENT LISTENERS
// ========================================

// Evento click en botón de búsqueda
searchButton.addEventListener('click', () => {
    const location = locationInput.value.trim();
    if (location) {
        fetchWeatherData(location);
    } else {
        showError('Por favor, ingresa una ciudad');
    }
});

// Evento Enter en input de búsqueda
locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const location = locationInput.value.trim();
        if (location) {
            fetchWeatherData(location);
        }
    }
});

// Evento cambio de unidades
unitsSelector.addEventListener('change', () => {
    const location = locationInput.value.trim();
    if (location) {
        fetchWeatherData(location);
    }
});

// ========================================
// FUNCIONES PRINCIPALES
// ========================================

/**
 * Función principal para obtener datos del clima
 * @param {string} location - Ciudad a buscar
 */
async function fetchWeatherData(location) {
    try {
        // Mostrar loading y ocultar otros elementos
        showLoading();
        hideError();
        hideWeatherSections();

        // Obtener unidades seleccionadas
        const units = unitsSelector.value;

        // Petición 1: Clima actual
        const weatherResponse = await fetch(
            `${WEATHER_URL}?q=${encodeURIComponent(location)}&appid=${API_KEY}&units=${units}&lang=es`
        );

        // Verificar si la respuesta es exitosa
        if (!weatherResponse.ok) {
            if (weatherResponse.status === 404) {
                throw new Error('Ciudad no encontrada. Verifica el nombre e intenta de nuevo.');
            } else if (weatherResponse.status === 401) {
                throw new Error('API Key inválida. Verifica tu configuración.');
            } else {
                throw new Error('Error al obtener datos del clima. Intenta más tarde.');
            }
        }

        const weatherData = await weatherResponse.json();

        // Petición 2: Pronóstico de 5 días
        const forecastResponse = await fetch(
            `${FORECAST_URL}?q=${encodeURIComponent(location)}&appid=${API_KEY}&units=${units}&lang=es`
        );

        if (!forecastResponse.ok) {
            throw new Error('Error al obtener pronóstico.');
        }

        const forecastData = await forecastResponse.json();

        // Ocultar loading
        hideLoading();

        // Mostrar datos en la interfaz
        displayCurrentWeather(weatherData, units);
        displayForecast(forecastData, units);

    } catch (error) {
        hideLoading();
        showError(error.message);
        console.error('Error:', error);
    }
}

/**
 * Muestra los datos del clima actual en la interfaz
 * @param {object} data - Datos del clima de la API
 * @param {string} units - Unidades (metric o imperial)
 */
function displayCurrentWeather(data, units) {
    // Extraer datos necesarios
    const cityNameText = data.name;
    const countryText = data.sys.country;
    const temp = Math.round(data.main.temp);
    const feels = Math.round(data.main.feels_like);
    const desc = data.weather[0].description;
    const icon = data.weather[0].icon;
    const hum = data.main.humidity;
    const wind = data.wind.speed;
    const press = data.main.pressure;

    // Símbolo de temperatura según unidades
    const tempUnit = units === 'metric' ? '°C' : '°F';
    const windUnit = units === 'metric' ? 'km/h' : 'mph';

    // Actualizar fecha y hora actual
    const now = new Date();
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const formattedDate = now.toLocaleDateString('es-ES', dateOptions);

    // Actualizar DOM
    cityName.textContent = cityNameText;
    country.textContent = countryText;
    dateTime.textContent = formattedDate;
    temperature.textContent = `${temp}${tempUnit}`;
    description.textContent = desc;
    weatherIcon.src = `https://openweathermap.org/img/wn/${icon}@4x.png`;
    weatherIcon.alt = desc;
    feelsLike.textContent = `${feels}${tempUnit}`;
    humidity.textContent = `${hum}%`;
    windSpeed.textContent = `${Math.round(wind)} ${windUnit}`;
    pressure.textContent = `${press} hPa`;

    // Mostrar sección
    currentWeatherEl.classList.remove('hidden');
}

/**
 * Muestra el pronóstico de 5 días en la interfaz
 * @param {object} data - Datos del pronóstico de la API
 * @param {string} units - Unidades (metric o imperial)
 */
function displayForecast(data, units) {
    // Limpiar pronóstico anterior
    forecastGrid.innerHTML = '';

    // Símbolo de temperatura según unidades
    const tempUnit = units === 'metric' ? '°C' : '°F';

    // Filtrar pronósticos para obtener uno por día (al mediodía)
    const dailyForecasts = {};

    // Iterar sobre todos los pronósticos
    data.list.forEach(item => {
        // Obtener fecha del pronóstico
        const date = new Date(item.dt * 1000);
        const dateKey = date.toLocaleDateString('es-ES');

        // Si no tenemos pronóstico para este día, guardarlo
        if (!dailyForecasts[dateKey]) {
            dailyForecasts[dateKey] = item;
        }
    });

    // Convertir objeto a array y tomar solo 5 días
    const forecasts = Object.values(dailyForecasts).slice(0, 5);

    // Crear tarjeta para cada día
    forecasts.forEach(forecast => {
        const card = createForecastCard(forecast, units, tempUnit);
        forecastGrid.appendChild(card);
    });

    // Mostrar sección
    forecastSectionEl.classList.remove('hidden');
}

/**
 * Crea una tarjeta de pronóstico
 * @param {object} forecast - Datos del pronóstico para un día
 * @param {string} units - Unidades (metric o imperial)
 * @param {string} tempUnit - Símbolo de temperatura (°C o °F)
 * @returns {HTMLElement} - Elemento div con la tarjeta
 */
function createForecastCard(forecast, units, tempUnit) {
    // Crear elemento div
    const card = document.createElement('div');
    card.className = 'forecast-card';

    // Obtener fecha
    const date = new Date(forecast.dt * 1000);
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
    const dateFormatted = date.toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric' 
    });

    // Obtener datos del clima
    const tempMax = Math.round(forecast.main.temp_max);
    const tempMin = Math.round(forecast.main.temp_min);
    const desc = forecast.weather[0].description;
    const icon = forecast.weather[0].icon;

    // Construir HTML de la tarjeta
    card.innerHTML = `
        <div class="day">${dayName}</div>
        <div class="date">${dateFormatted}</div>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
        <div class="temps">
            <span class="temp-max">${tempMax}${tempUnit}</span>
            <span class="temp-min">${tempMin}${tempUnit}</span>
        </div>
        <div class="description">${desc}</div>
    `;

    return card;
}

// ========================================
// FUNCIONES DE UTILIDAD (MOSTRAR/OCULTAR)
// ========================================

/**
 * Muestra el indicador de carga
 */
function showLoading() {
    loadingEl.classList.remove('hidden');
}

/**
 * Oculta el indicador de carga
 */
function hideLoading() {
    loadingEl.classList.add('hidden');
}

/**
 * Muestra un mensaje de error
 * @param {string} message - Mensaje a mostrar
 */
function showError(message) {
    errorMessage.textContent = message;
    errorEl.classList.remove('hidden');
}

/**
 * Oculta el mensaje de error
 */
function hideError() {
    errorEl.classList.add('hidden');
}

/**
 * Oculta las secciones del clima
 */
function hideWeatherSections() {
    currentWeatherEl.classList.add('hidden');
    forecastSectionEl.classList.add('hidden');
}

// ========================================
// INICIALIZACIÓN
// ========================================

/**
 * Función de inicialización al cargar la página
 */
function init() {
    // Cargar ciudad por defecto (opcional)
    const defaultCity = 'Bogotá';
    locationInput.value = defaultCity;
    
    // Puedes descomentar la siguiente línea para cargar datos al inicio
    // fetchWeatherData(defaultCity);
    
    console.log('Weather App inicializada correctamente');
}

// Ejecutar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', init);