export function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusM = 6_371_000;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(earthRadiusM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function estimateEtaMinutes(distanceM: number, speedKph: number | null | undefined, fallbackSpeedKph: number): number {
  if (distanceM <= 0) return 0;
  const candidate = speedKph && speedKph >= 5 ? speedKph : fallbackSpeedKph;
  const safeSpeed = Math.max(5, Math.min(100, candidate));
  return Math.max(1, Math.min(180, Math.ceil(((distanceM * 1.18) / 1000 / safeSpeed) * 60)));
}
