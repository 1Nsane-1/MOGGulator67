// Vercel Serverless Function: GET /api/weather?lat=52.37&lon=4.89
// Данные: Open-Meteo (бесплатно, без ключа)
module.exports = async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return res.status(400).json({ error: 'Нужны корректные lat и lon' });
  }
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${lat}&longitude=${lon}` +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code' +
    '&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto';
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('Open-Meteo ответил ' + r.status);
    const d = await r.json();
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    res.status(200).json({
      temp: d.current.temperature_2m,
      feels: d.current.apparent_temperature,
      humidity: d.current.relative_humidity_2m,
      wind: d.current.wind_speed_10m,
      code: d.current.weather_code,
      min: d.daily.temperature_2m_min[0],
      max: d.daily.temperature_2m_max[0],
    });
  } catch (e) {
    res.status(502).json({ error: 'Не удалось получить погоду: ' + e.message });
  }
};
