// GET /api/radio?q=шансон — поиск станций в каталоге Radio Browser (бесплатно)
const UA = 'MOGGulator67/1.0';
const HOSTS = ['de1', 'nl1', 'at1'].map((h) => `https://${h}.api.radio-browser.info`);

module.exports = async (req, res) => {
  const q = String(req.query.q || 'шансон').trim().slice(0, 60);
  for (const h of HOSTS) {
    try {
      const r = await fetch(`${h}/json/stations/search?name=${encodeURIComponent(q)}&limit=25&hidebroken=true&is_https=true&order=clickcount&reverse=true`, { headers: { 'User-Agent': UA } });
      if (!r.ok) continue;
      const d = await r.json();
      res.setHeader('Cache-Control', 's-maxage=3600');
      return res.status(200).json({
        stations: d.filter((s) => (s.url_resolved || '').startsWith('https://'))
          .map((s) => ({ name: String(s.name || '').trim(), url: s.url_resolved, country: s.countrycode || '' })),
      });
    } catch (e) { /* пробуем следующий сервер */ }
  }
  res.status(502).json({ error: 'Каталог радио недоступен' });
};
