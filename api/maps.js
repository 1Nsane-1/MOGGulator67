// GET /api/maps?action=geocode&q=...   GET /api/maps?action=route&from=lat,lon&to=lat,lon&profile=car|foot|bike
// Данные: Nominatim и OSRM (OpenStreetMap, бесплатно, лимиты fair-use)
const { send } = require('./_db');
const UA = 'MOGGulator67/1.0 (student project)';
const OSRM = {
  car: 'https://router.project-osrm.org/route/v1/driving/',
  foot: 'https://routing.openstreetmap.de/routed-foot/route/v1/driving/',
  bike: 'https://routing.openstreetmap.de/routed-bike/route/v1/driving/',
};
const pt = (s) => { const [a, b] = String(s || '').split(',').map(parseFloat); return isFinite(a) && isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180 ? [a, b] : null; };

module.exports = async (req, res) => {
  try {
    const a = req.query.action;
    if (a === 'geocode') {
      const q = String(req.query.q || '').trim().slice(0, 200);
      if (!q) return send(res, 400, { error: 'Пустой запрос' });
      const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=ru&q=' + encodeURIComponent(q), { headers: { 'User-Agent': UA } });
      if (!r.ok) throw new Error('Nominatim ответил ' + r.status);
      const d = await r.json();
      res.setHeader('Cache-Control', 's-maxage=86400');
      return res.status(200).json({ places: d.map((p) => ({ name: p.display_name, lat: +p.lat, lon: +p.lon })) });
    }
    if (a === 'route') {
      const f = pt(req.query.from), t = pt(req.query.to);
      if (!f || !t) return send(res, 400, { error: 'Нужны from и to в формате lat,lon' });
      const base = OSRM[req.query.profile] || OSRM.car;
      const r = await fetch(`${base}${f[1]},${f[0]};${t[1]},${t[0]}?overview=full&geometries=geojson`, { headers: { 'User-Agent': UA } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.routes || !d.routes[0]) return send(res, 404, { error: 'Маршрут не найден' });
      const rt = d.routes[0];
      return send(res, 200, { distance: rt.distance, duration: rt.duration, coords: rt.geometry.coordinates.map(([lo, la]) => [la, lo]) });
    }
    send(res, 400, { error: 'Неизвестное действие' });
  } catch (e) {
    console.error(e);
    send(res, 502, { error: 'Карты недоступны: ' + e.message });
  }
};
