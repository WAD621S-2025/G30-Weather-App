 // --- CONFIG ---
const DEFAULT_COORDS = { latitude: -22.5609, longitude: 17.0658 }; // Windhoek
const WEATHER_ENDPOINT = (lat, lon) =>
`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,temperature_2m,wind_speed_10m&timezone=Europe%2FBerlin&forecast_days=1`;

const CITY_ENDPOINT = (lat, lon) =>
`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;

/*const PLACE_ENDPOINT = (place_name) =>
  `https://geocoding-api.open-meteo.com/v1/search?name=${place_name}&count=10&language=en&format=json`;
*/
function $(id) {
  return document.getElementById(id);
}

/*
const cityForm = document.querySelector(".cityForm");
const cityInput = document.querySelector(".cityInput");

cityForm.addEventListener("submit", async event => {

    event.preventDefault();

    const city = cityInput.value;

    if(city){
        try{
            const cityLonLat = await getLonLat(city);
            displayCityInfo(cityLonLat);
            console.log(cityLonLat);
        }
        catch(error){
            console.error(error);
            displayError(error);
        }
    }
    else{
        displayError("Please enter a city");
    }
});

async function getLonLat(city){

    const apiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=en&format=json`;

    const response = await fetch(apiUrl);

    if(!response.ok){
        throw new Error("Could not fetch city info");
    }

    return await response.json();
}
*/
// Update local time & date
function updateLocalTime() {
  const now = new Date();
  $('local-time').textContent = now.toLocaleTimeString();
  $('local-date').textContent = now.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  
}

// Countdown to Saturday 00:00
function updateCountdown() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSat = (6 - day + 7) % 7;
  const nextSat = new Date(now);
  nextSat.setDate(
    now.getDate() + (daysUntilSat === 0 && now.getHours() > 0 ? 7 : daysUntilSat)
  );
  nextSat.setHours(0, 0, 0, 0);

  let diff = nextSat - now;
  if (diff <= 0) {
    $('cd-message').textContent = "It's the weekend — enjoy!";
    ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => $(id).textContent='0');
    return;
  }
  const s = Math.floor(diff / 1000);
  $('cd-days').textContent = Math.floor(s / (24 * 3600));
  $('cd-hours').textContent = Math.floor((s % (24 * 3600)) / 3600);
  $('cd-mins').textContent = Math.floor((s % 3600) / 60);
  $('cd-secs').textContent = s % 60;
}


// Weather API fetch
async function fetchWeather(lat, lon) {
  try {
    $('status').textContent = 'Fetching weather...';
    const resp = await fetch(WEATHER_ENDPOINT(lat, lon));
    if (!resp.ok) throw new Error('Weather API error');
    const data = await resp.json();
    console.log(data);
    const cw = data.current;
    $('temperature').textContent = `${cw.temperature_2m.toFixed(1)} °C`;
    $('weather-desc').textContent =
      `Wind ${cw.wind_speed_10m} km/h • ${toWeatherText(cw.weather_code)} • Updated ${new Date(cw.time).toLocaleTimeString()}`;
    $('weather-icon').textContent = weatherEmoji(cw.weather_code);
    $('loc-name').textContent = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    $('status').textContent = 'Weather updated';
  } catch (err) {
    $('status').textContent = 'Weather unavailable';
    $('weather-desc').textContent = err.message;
    console.error(err);
  }
}


async function fetchCity(lat, lon) {
  try {
    $('status').textContent = 'Fetching city...';
    const resp = await fetch(CITY_ENDPOINT(lat, lon));
    if (!resp.ok) throw new Error('CITY API error');
    const data = await resp.json();
    console.log(data);
    console.log(data.localityInfo.administrative[1].name);
    const cityName = data.localityInfo.administrative[1].name || "Unkown";
    document.getElementById('city-name').textContent = cityName;
    
    //$('city-name').textContent = `${data.localityInfo.administrative[1]?.name}`;
    //$('city-name').textContent = cityName;
    } catch (err) {
    $('status').textContent = 'City unavailable';
    console.error(err);
  }
}



fetch("https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=-22.5609&longitude=17.0658&localityLanguage=en")
.then(response => response.json())
.then(data => console.log(data.localityInfo.administrative[1].name))
.catch(error => console.error(error));

// Weather helpers
function weatherEmoji(code) {
  if (code == 0) return '☀️';
  if ([1, 2].includes(code)) return '🌤️';
  if ([3].includes(code)) return '☁️';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95) return '⛈️';
  return '🌈';
}

function toWeatherText(code) {
  const map = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    80: 'Rain showers', 81: 'Moderate showers', 82: 'Violent showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
  };
  return map[code] || 'Unknown';
}

//reading the .json file and calculating the remaing day to the next public holiday
fetch('Publlic_Holidays_Namibia.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to load JSON file');
    }
    return response.json();
  })
  .then(data => {
    const tableBody = document.querySelector('#holidayTable tbody');
    const today = new Date();
    data.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      const diffTime = holidayDate - today;

      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); //all time must be converted from miliseconds to days

      const remaining = diffDays > 0 ? diffDays : 0;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${holiday.date}</td>
        <td>${holiday.name}</td>
        <td>${remaining}</td>        
      `;
      tableBody.appendChild(row);
    });
  })
  .catch(error => console.error('Error:', error));


// Initialize everything
async function init() {
  $('tz').textContent = `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
  updateLocalTime(); setInterval(updateLocalTime, 1000);
  updateCountdown(); setInterval(updateCountdown, 1000);
  

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      pos => {
      const { latitude, longitude } = pos.coords;
      fetchWeather(latitude, longitude);
      fetchCity(latitude, longitude);
    },
    () => {
      // fallback to default coordinates
      fetchWeather(DEFAULT_COORDS.latitude, DEFAULT_COORDS.longitude);
      fetchCity(DEFAULT_COORDS.latitude, DEFAULT_COORDS.longitude);
    },
      
      { timeout: 10000 }
    );
  } else {
    fetchWeather(DEFAULT_COORDS.latitude, DEFAULT_COORDS.longitude);
    fetchCity(DEFAULT_COORDS.latitude, DEFAULT_COORDS.longitude);
  }
}

init();
