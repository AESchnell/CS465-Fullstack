// The website consumes the REST API; only app_api accesses the database.
const travel = async (req, res) => {
  const baseURL = process.env.API_BASE_URL || `http://127.0.0.1:${req.app.get('port') || 3000}`;
  const view = { title: 'Travel - Travlr Getaways', isTravel: true, trips: [] };

  try {
    const response = await fetch(`${baseURL.replace(/\/$/, '')}/api/trips`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error(`Trips API returned HTTP ${response.status}`);
    const trips = await response.json();
    if (!Array.isArray(trips)) throw new Error('Trips API did not return an array');

    return res.render('travel', {
      ...view,
      trips,
      message: trips.length ? undefined : 'No trips are currently available.'
    });
  } catch (err) {
    console.error('Travel page API request failed:', err.message);
    return res.status(502).render('travel', {
      ...view,
      message: 'Trips are temporarily unavailable. Please try again later.'
    });
  }
};

module.exports = { travel };
