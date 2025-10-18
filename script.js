 // --- CONFIG ---
const DEFAULT_COORDS = { latitude: -22.5609, longitude: 17.0658 }; // Windhoek
const WEATHER_ENDPOINT = (lat, lon) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;

function $(id) {
  return document.getElementById(id);
}

// Update local time & date
function updateLocalTime() {
  const now = new Date();
  $('local-time').textContent = now.toLocaleTimeString();
  $('local-date').textContent = now.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  $('locale').textContent = navigator.language || 'unknown';
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
    const cw = data.current_weather;
    $('temperature').textContent = `${cw.temperature.toFixed(1)} °C`;
    $('weather-desc').textContent =
      `Wind ${cw.windspeed} m/s • ${toWeatherText(cw.weathercode)} • Updated ${new Date(cw.time).toLocaleTimeString()}`;
    $('weather-icon').textContent = weatherEmoji(cw.weathercode);
    $('loc-name').textContent = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    $('status').textContent = 'Weather updated';
  } catch (err) {
    $('status').textContent = 'Weather unavailable';
    $('weather-desc').textContent = err.message;
    console.error(err);
  }
}

// Weather helpers
function weatherEmoji(code) {
  if (code === 0) return '☀️';
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

// Load and render holidays
function loadHolidaysFromEmbedded() {
  const json = JSON.parse(document.getElementById('nam-holidays').textContent);
  return json.map(h => ({ ...h, dateObj: new Date(h.date + 'T00:00:00') }))
             .sort((a, b) => a.dateObj - b.dateObj);
}

function renderHolidays(list) {
  const container = $('holidays-list');
  container.innerHTML = '';
  const today = new Date();

  list.forEach(h => {
    const row = document.createElement('div');
    row.className = 'holiday';

    const left = document.createElement('div');
    left.innerHTML = `<div style="font-weight:600">${h.name}</div>
                      <div class="when">${h.dateObj.toLocaleDateString(undefined, {
                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                      })}</div>`;

    const right = document.createElement('div');
    const diff = Math.ceil((h.dateObj - today) / (1000 * 60 * 60 * 24));
    right.innerHTML = `<div class="badge">${
      diff === 0 ? 'Today' : diff > 0 ? `In ${diff}d` : 'Passed'
    }</div>`;

    row.append(left, right);
    container.appendChild(row);
  });
}

//readin the .json file
fetch('Publlic_Holidays_Namibia.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to load JSON file');
    }
    return response.json();
  })
  .then(data => {
    const tableBody = document.querySelector('#holidayTable tbody');

    data.forEach(holiday => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${holiday.date}</td>
        <td>${holiday.name}</td>        
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
  renderHolidays(loadHolidaysFromEmbedded());

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(DEFAULT_COORDS.latitude, DEFAULT_COORDS.longitude),
      { timeout: 10000 }
    );
  } else {
    fetchWeather(DEFAULT_COORDS.latitude, DEFAULT_COORDS.longitude);
  }
}

init();
