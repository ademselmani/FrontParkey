import * as L from 'leaflet';

export class StreetUsageService {
  // Distance threshold (meters) to consider a user 'on' a street
  readonly usageDistanceMeters = 35;

  countUsersNearCoords(
    coords: [number, number][],
    locations: Array<{ latitude: number; longitude: number }>
  ): number {
    if (!locations || locations.length === 0 || !coords || coords.length < 2) {
      return 0;
    }
    let count = 0;
    for (const loc of locations) {
      const lat = loc.latitude;
      const lng = loc.longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number') continue;
      const d = this.pointToLineDistance(lat, lng, coords);
      if (d < this.usageDistanceMeters) count++;
    }
    return count;
  }

  getOccupancyColor(
    userCount: number | undefined,
    capacity: number | undefined | null
  ): string {
    if (userCount === undefined) return '#28a745';
    const capNum =
      typeof capacity === 'number'
        ? capacity
        : capacity != null
        ? Number(capacity)
        : undefined;
    if (!capNum || capNum <= 0 || isNaN(capNum)) {
      if (userCount <= 3) return '#28a745';
      if (userCount <= 6) return '#fd7e14';
      return '#dc3545';
    }
    const ratio = userCount / capNum;
    if (ratio < 0.5) return '#28a745';
    if (ratio < 0.8) return '#fd7e14';
    return '#dc3545';
  }

  ensureUsagePane(map: L.Map) {
    const panes = (map as any)._panes as Record<string, HTMLElement>;
    if (!panes || !panes['usagePane']) {
      const pane = map.createPane('usagePane');
      pane.style.zIndex = '650';
    }
  }

  pointToLineDistance(
    lat: number,
    lng: number,
    line: [number, number][]
  ): number {
    let minDist = Infinity;
    for (let i = 0; i < line.length - 1; i++) {
      const dist = this.pointToSegmentDistance(
        lat,
        lng,
        line[i][0],
        line[i][1],
        line[i + 1][0],
        line[i + 1][1]
      );
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  }

  private pointToSegmentDistance(
    lat: number,
    lng: number,
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    function toRad(x: number) {
      return (x * Math.PI) / 180;
    }
    const R = 6371000; // meters

    const x0 = R * Math.cos(toRad(lat)) * Math.cos(toRad(lng));
    const y0 = R * Math.cos(toRad(lat)) * Math.sin(toRad(lng));
    const z0 = R * Math.sin(toRad(lat));

    const x1 = R * Math.cos(toRad(lat1)) * Math.cos(toRad(lng1));
    const y1 = R * Math.cos(toRad(lat1)) * Math.sin(toRad(lng1));
    const z1 = R * Math.sin(toRad(lat1));

    const x2 = R * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2));
    const y2 = R * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2));
    const z2 = R * Math.sin(toRad(lat2));

    const dx = x2 - x1,
      dy = y2 - y1,
      dz = z2 - z1;
    const d2 = dx * dx + dy * dy + dz * dz;
    let t = ((x0 - x1) * dx + (y0 - y1) * dy + (z0 - z1) * dz) / d2;
    t = Math.max(0, Math.min(1, t));
    const x = x1 + t * dx,
      y = y1 + t * dy,
      z = z1 + t * dz;
    return Math.sqrt((x - x0) ** 2 + (y - y0) ** 2 + (z - z0) ** 2);
  }
}
