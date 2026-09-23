// Lightweight geo helpers. Coordinates for major metro areas power the
// "distance radius" filter without a paid geocoding API. In production this can
// be swapped for a geocoder that fills Vehicle.latitude / longitude on create.

export interface City {
  city: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
}

export const CITIES: City[] = [
  { city: "Miami", state: "FL", country: "United States", lat: 25.7617, lng: -80.1918 },
  { city: "Orlando", state: "FL", country: "United States", lat: 28.5383, lng: -81.3792 },
  { city: "Tampa", state: "FL", country: "United States", lat: 27.9506, lng: -82.4572 },
  { city: "Los Angeles", state: "CA", country: "United States", lat: 34.0522, lng: -118.2437 },
  { city: "San Francisco", state: "CA", country: "United States", lat: 37.7749, lng: -122.4194 },
  { city: "San Diego", state: "CA", country: "United States", lat: 32.7157, lng: -117.1611 },
  { city: "New York", state: "NY", country: "United States", lat: 40.7128, lng: -74.006 },
  { city: "Austin", state: "TX", country: "United States", lat: 30.2672, lng: -97.7431 },
  { city: "Dallas", state: "TX", country: "United States", lat: 32.7767, lng: -96.797 },
  { city: "Houston", state: "TX", country: "United States", lat: 29.7604, lng: -95.3698 },
  { city: "Chicago", state: "IL", country: "United States", lat: 41.8781, lng: -87.6298 },
  { city: "Seattle", state: "WA", country: "United States", lat: 47.6062, lng: -122.3321 },
  { city: "Phoenix", state: "AZ", country: "United States", lat: 33.4484, lng: -112.074 },
  { city: "Las Vegas", state: "NV", country: "United States", lat: 36.1699, lng: -115.1398 },
  { city: "Denver", state: "CO", country: "United States", lat: 39.7392, lng: -104.9903 },
  { city: "Atlanta", state: "GA", country: "United States", lat: 33.749, lng: -84.388 },
  { city: "Charlotte", state: "NC", country: "United States", lat: 35.2271, lng: -80.8431 },
  { city: "Nashville", state: "TN", country: "United States", lat: 36.1627, lng: -86.7816 },
  { city: "Boston", state: "MA", country: "United States", lat: 42.3601, lng: -71.0589 },
  { city: "Detroit", state: "MI", country: "United States", lat: 42.3314, lng: -83.0458 },
  { city: "Toronto", state: "ON", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { city: "Vancouver", state: "BC", country: "Canada", lat: 49.2827, lng: -123.1207 },
];

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
  "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA",
  "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export const COUNTRIES = ["United States", "Canada", "Mexico", "United Kingdom", "Germany", "Australia"];

export function findCity(name?: string | null) {
  if (!name) return undefined;
  const q = name.trim().toLowerCase();
  return CITIES.find((c) => c.city.toLowerCase() === q);
}

/** Axis-aligned bounding box around a point; good enough to pre-filter by radius. */
export function boundingBox(lat: number, lng: number, radiusMiles: number) {
  const latDelta = radiusMiles / 69;
  const lngDelta = radiusMiles / (69 * Math.cos((lat * Math.PI) / 180));
  return { minLat: lat - latDelta, maxLat: lat + latDelta, minLng: lng - lngDelta, maxLng: lng + lngDelta };
}
