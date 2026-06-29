// Haversine formula to calculate distance in meters between two lat/lng coordinates
export function calculateDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isDuplicate(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  type1: string,
  type2: string
): boolean {
  if (type1 !== type2) return false;
  const distance = calculateDistanceInMeters(lat1, lon1, lat2, lon2);
  return distance < 200; // 200 meters threshold
}
