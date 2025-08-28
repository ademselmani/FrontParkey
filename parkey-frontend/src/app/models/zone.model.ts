export interface Zone {
  id?: number;
  name: string;
  description: string;
  postCode: number[];
  // Stored as [lng, lat] pairs for backend compatibility
  coordinates: number[][];
  // Optional GeoJSON geometry if backend returns GeoJSON
  geometry?: {
    type: 'Polygon';
    // [[[lng, lat], ...]] first ring used
    coordinates: number[][][];
  };
  lastUpdated?: Date;
  streets?: Street[];
}

export interface Street {
  id?: string;
  name: string;
  zoneId: number;
  zoneName?: string;
  isParkable: boolean;
  capacity?: number;
  lastUpdated?: Date;
  // Stored as [lng, lat] pairs for backend compatibility
  coordinates: number[][];
}
