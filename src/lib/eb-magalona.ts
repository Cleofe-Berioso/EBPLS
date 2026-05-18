export const EB_MAGALONA_CENTER = {
  latitude: 10.878586296466974,
  longitude: 122.97887569230781,
} as const;

export const EB_MAGALONA_BOUNDS = {
  southWest: { latitude: 10.82, longitude: 122.97 },
  northEast: { latitude: 10.95, longitude: 123.11 },
} as const;

export function isWithinEbMagalona(latitude: number, longitude: number): boolean {
  return (
    latitude >= EB_MAGALONA_BOUNDS.southWest.latitude &&
    latitude <= EB_MAGALONA_BOUNDS.northEast.latitude &&
    longitude >= EB_MAGALONA_BOUNDS.southWest.longitude &&
    longitude <= EB_MAGALONA_BOUNDS.northEast.longitude
  );
}
