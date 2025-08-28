export type LatLng = [number, number];

export interface GeoJsonFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: any;
}

export interface StreetsGeoJson {
  features: GeoJsonFeature[];
}

export function getStreetsFromGeoJson(geojson: StreetsGeoJson) {
  return geojson.features
    .filter((f) => f.geometry?.type === 'LineString')
    .map((f) => ({
      name: f.properties?.name,
      coords: (f.geometry.coordinates as [number, number][])?.map(
        ([lng, lat]) => [lat, lng] as LatLng
      ),
    }));
}
