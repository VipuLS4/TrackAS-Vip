
import fetch from 'node-fetch';

export async function optimizeRoute(stops){
  // stops = [{lat, lng}, ...]
  const coords = stops.map(s => `${s.lng},${s.lat}`).join(';');
  const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coords}?geometries=geojson&access_token=${process.env.MAPBOX_KEY}`;
  const r = await fetch(url);
  const j = await r.json();
  if (!j.trips || !j.trips.length) throw new Error("No trip returned");
  return j.trips[0]; // includes geometry + waypoints
}
