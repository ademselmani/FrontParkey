import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { HttpClient } from '@angular/common/http';
import { ZoneService, Zone, Street } from 'src/app/services/zone.service';

// Helper to extract streets from GeoJSON
function getStreetsFromGeoJson(geojson: any) {
  return geojson.features
    .filter((f: any) => f.geometry.type === 'LineString')
    .map((f: any) => ({
      name: f.properties.name,
      coords: f.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
      ),
    }));
}

@Component({
  selector: 'app-register-step2',
  templateUrl: './register-step2.component.html',
  styleUrls: ['./register-step2.component.css'],
})
export class RegisterStep2Component implements OnInit {
  private map: L.Map | undefined;
  lat: number | null = null;
  lng: number | null = null;
  locationName: string = '';
  showConfirm: boolean = false;
  registrationSuccess: boolean = false;
  searchQuery: string = '';
  infoMessage: string = '';

  // CRUD Management
  showCrudPanel: boolean = false;
  crudMode: 'zones' | 'streets' = 'zones';
  zones: Zone[] = [];
  streets: Street[] = [];
  selectedZone: Zone | null = null;
  selectedStreet: Street | null = null;
  isEditing: boolean = false;
  
  // Form models
  zoneForm: Zone = { name: '', description: '', postCode: [], coordinates: [] };
  streetForm: Street = { name: '', zoneId: 0, isParkable: true, coordinates: [] };
  
  // Coordinate input helpers
  zoneCoordinatesText: string = '';
  streetCoordinatesText: string = '';

  // Map layers for CRUD
  private zoneLayerGroup: L.LayerGroup = new L.LayerGroup();
  private streetLayerGroup: L.LayerGroup = new L.LayerGroup();
  private dynamicZoneLayerGroup: L.LayerGroup = new L.LayerGroup();

  // Store dynamic zones for persistence
  private dynamicZones: { [key: string]: [number, number][] } = {};
  private currentPolygonData: any = {};

  private geofenceCenter = { lat: 36.838175, lng: 10.2375679 }; // Center on Lac 1 for initial view

  // Polygon coordinates loaded from JSON
  private lac1PolygonCoords: [number, number][] = [];
  private jardinCarthagePolygonCoords: [number, number][] = [
    [36.8608784, 10.3034741], [36.8608732, 10.3035647], [36.8608736, 10.3036648],
    [36.8608932, 10.3037591], [36.8609115, 10.3038265], [36.8611681, 10.3040158],
    [36.8611895, 10.3040011], [36.8612967, 10.3039705], [36.8614019, 10.30394],
    [36.8614521, 10.3038156], [36.8614993, 10.3037258], [36.8615322, 10.3036336],
    [36.8615001, 10.3034356], [36.8614848, 10.3033187], [36.8615515, 10.303167],
    [36.8617034, 10.3027398], [36.8618677, 10.3021449], [36.8619448, 10.3017557],
    [36.8620103, 10.3014111], [36.8620792, 10.3008206], [36.8620879, 10.3003448],
    [36.8621018, 10.300193], [36.8620975, 10.2996441], [36.8620546, 10.2992928],
    [36.8619885, 10.2988653], [36.8619196, 10.2985349], [36.8618923, 10.298068],
    [36.8619051, 10.2979587], [36.8618838, 10.2978701], [36.8618564, 10.2978086],
    [36.8618519, 10.2977336], [36.8618743, 10.2974937], [36.8618519, 10.2972063],
    [36.8617462, 10.2966888], [36.861526, 10.2958611], [36.8613227, 10.2936727],
    [36.8612735, 10.2934112], [36.8612064, 10.2932164], [36.8608236, 10.2926508],
    [36.8606023, 10.2923143], [36.8605314, 10.2921604], [36.8605063, 10.2920228],
    [36.8604431, 10.2919348], [36.8603185, 10.2919095], [36.8601956, 10.291693],
    [36.8601579, 10.2915553], [36.8584693, 10.293048], [36.8583256, 10.2930325],
    [36.8582, 10.2930647], [36.858001, 10.2931558], [36.8567717, 10.2915292],
    [36.8564705, 10.2912246], [36.8542056, 10.2881141], [36.8533764, 10.289372],
    [36.8514087, 10.2908652], [36.8495798, 10.2921673], [36.8493626, 10.2921754],
    [36.848661, 10.2933874], [36.8482583, 10.2930281], [36.847384, 10.2939638],
    [36.8486941, 10.2967045], [36.8488537, 10.2968141], [36.8509208, 10.3011741],
    [36.8494028, 10.3023391], [36.849051, 10.3026703], [36.8483206, 10.3034347],
    [36.851257, 10.3058869], [36.8518123, 10.306279], [36.8523395, 10.3062435],
    [36.8523826, 10.3064181], [36.8524795, 10.3066199], [36.8525703, 10.3067441],
    [36.8526878, 10.3068381], [36.8532392, 10.3071877], [36.8535337, 10.3073284],
    [36.8538444, 10.3074566], [36.8541602, 10.3075636], [36.8544203, 10.3075928],
    [36.854584, 10.3076327], [36.8546525, 10.3077419], [36.8546736, 10.307841],
    [36.8546787, 10.3078964], [36.8547333, 10.3080884], [36.8548335, 10.308342],
    [36.855008, 10.3086094], [36.855213, 10.3088568], [36.8554309, 10.3090388],
    [36.855626, 10.3091684], [36.8558779, 10.3092566], [36.8561861, 10.3092996],
    [36.8564717, 10.3092689], [36.8567545, 10.3091731], [36.8570099, 10.3090065],
    [36.8573257, 10.3087675], [36.8573609, 10.3087342], [36.8575461, 10.308558],
    [36.8578332, 10.3082247], [36.8581002, 10.3078273], [36.8582384, 10.3075589],
    [36.8584087, 10.3071914], [36.8585603, 10.3067903], [36.858679, 10.3063526],
    [36.8588121, 10.3056277], [36.8588253, 10.3055399], [36.8588316, 10.3054223],
    [36.858844, 10.3052172], [36.8588558, 10.3050369], [36.8588571, 10.3046977],
    [36.8588358, 10.3044295], [36.8588193, 10.3042717], [36.8588267, 10.3042145],
    [36.8589183, 10.3041455], [36.8592731, 10.3038931], [36.8595107, 10.303681],
    [36.8598182, 10.3033437], [36.8600438, 10.3030453], [36.8601444, 10.302877],
    [36.860218, 10.3028605], [36.8608242, 10.3034164], [36.8608784, 10.3034741]
  ];
  private gammarthPolygonCoords: [number, number][] = [];
  private lac2PolygonCoords: [number, number][] = [];
  private LaGoulettePolygonCoords: [number, number][] = [];
  private LaGouletePolygonCoords: [number, number][] = [];

  private selectedMarker: L.Marker | undefined;

  private streetsData: {
    name: string;
    coords: [number, number][];
    userCount: number;
  }[] = [];

  // Add these centers for each area
  private lac1Center: [number, number] = [36.838175, 10.2375679];
  private gammarthCenter: [number, number] = [36.9084385, 10.2928081];
  private jardinCarthageCenter: [number, number] = [36.8608784, 10.3034741];

  constructor(
    private userService: UserService,
    private router: Router,
    private http: HttpClient,
    private zoneService: ZoneService
  ) {}

  ngOnInit(): void {
    this.http.get<any>('assets/parking-polygons.json').subscribe((data) => {
      this.currentPolygonData = data; // Store the current data
      this.lac1PolygonCoords = data.lac1PolygonCoords || [];
      this.gammarthPolygonCoords = data.gammarthPolygonCoords || [];
      this.lac2PolygonCoords = data.lac2PolygonCoords || [];
      this.LaGoulettePolygonCoords = data.LaGoulettePolygonCoords || [];
      this.LaGouletePolygonCoords = data.LaGouletePolygonCoords || [];
      
      this.initMap();
      this.loadAndColorLocations();
      this.loadZonesAndStreets(); // Load CRUD data
    });
  }

  private initMap(): void {
    this.map = L.map('map').setView(
      [this.geofenceCenter.lat, this.geofenceCenter.lng],
      14
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(this.map);

    // Draw polygons from loaded data
    if (this.lac1PolygonCoords.length)
      L.polygon(this.lac1PolygonCoords, {
        color: 'blue',
        weight: 3,
        dashArray: '8, 8',
        fillOpacity: 0.05,
      }).addTo(this.map);

    if (this.gammarthPolygonCoords.length)
      L.polygon(this.gammarthPolygonCoords, {
        color: 'purple',
        weight: 3,
        dashArray: '8, 8',
        fillOpacity: 0.05,
      }).addTo(this.map);

    if (this.jardinCarthagePolygonCoords.length)
      L.polygon(this.jardinCarthagePolygonCoords, {
        color: 'green',
        weight: 3,
        dashArray: '8, 8',
        fillOpacity: 0.05,
      }).addTo(this.map);

    if (this.lac2PolygonCoords.length)
      L.polygon(this.lac2PolygonCoords, {
        color: 'cyan',
        weight: 3,
        dashArray: '8, 8',
        fillOpacity: 0.05,
      }).addTo(this.map);

    if (this.LaGoulettePolygonCoords.length)
      L.polygon(this.LaGoulettePolygonCoords, {
        color: 'black',
        weight: 3,
        dashArray: '8, 8',
        fillOpacity: 0.05,
      }).addTo(this.map);

    if (this.LaGouletePolygonCoords.length)
      L.polygon(this.LaGouletePolygonCoords, {
        color: 'black',
        weight: 3,
        dashArray: '8, 8',
        fillOpacity: 0.05,
      }).addTo(this.map);

    // Double-click to select location
    this.map.on('dblclick', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.lat = lat;
      this.lng = lng;
      this.reverseGeocode(lat, lng);

      // Remove previous marker if exists
      if (this.selectedMarker) {
        this.map!.removeLayer(this.selectedMarker);
      }

      // Add a red marker at the selected location
      this.selectedMarker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl:
            'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          shadowSize: [41, 41],
        }),
      }).addTo(this.map!);
    });

    // Single-click to get street details
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      // Find the nearest street within 20 meters
      let foundStreet: {
        name: string;
        coords: [number, number][];
        userCount: number;
      } | null = null;
      let minDist = 21;
      for (const street of this.streetsData) {
        const dist = this.pointToLineDistance(lat, lng, street.coords);
        if (dist < minDist) {
          minDist = dist;
          foundStreet = street;
        }
      }
      if (foundStreet) {
        L.popup()
          .setLatLng([lat, lng])
          .setContent(
            `<b>${foundStreet.name || 'Unnamed Street'}</b><br>Users: ${
              foundStreet.userCount
            }`
          )
          .openOn(this.map!);
      }
    });

    // Setup global callbacks for CRUD operations
    this.setupGlobalCallbacks();

    // Add dynamic zone layer to map
    this.dynamicZoneLayerGroup.addTo(this.map);
  }

  private isPointInPolygon(
    lat: number,
    lng: number,
    polygon: [number, number][]
  ): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const lati = polygon[i][0],
        lngi = polygon[i][1];
      const latj = polygon[j][0],
        lngj = polygon[j][1];
      const intersect =
        lngi > lng !== lngj > lng &&
        lat < ((latj - lati) * (lng - lngi)) / (lngj - lngi + 0.0000001) + lati;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private isPointInAnyGeofence(lat: number, lng: number): boolean {
    return (
      this.isPointInPolygon(lat, lng, this.lac1PolygonCoords) ||
      this.isPointInPolygon(lat, lng, this.lac2PolygonCoords) ||
      this.isPointInPolygon(lat, lng, this.gammarthPolygonCoords) ||
      this.isPointInPolygon(lat, lng, this.jardinCarthagePolygonCoords) ||
      (this.LaGoulettePolygonCoords &&
        this.isPointInPolygon(lat, lng, this.LaGoulettePolygonCoords)) ||
      (this.LaGouletePolygonCoords &&
        this.isPointInPolygon(lat, lng, this.LaGouletePolygonCoords))
    );
  }

  private pointToLineDistance(
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

    // Convert to Cartesian coordinates
    const x0 = R * Math.cos(toRad(lat)) * Math.cos(toRad(lng));
    const y0 = R * Math.cos(toRad(lat)) * Math.sin(toRad(lng));
    const z0 = R * Math.sin(toRad(lat));

    const x1 = R * Math.cos(toRad(lat1)) * Math.cos(toRad(lng1));
    const y1 = R * Math.cos(toRad(lat1)) * Math.sin(toRad(lng1));
    const z1 = R * Math.sin(toRad(lat1));

    const x2 = R * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2));
    const y2 = R * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2));
    const z2 = R * Math.sin(toRad(lat2));

    // Vector math
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

  private getDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // meters
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private getClosestArea(
    lat: number,
    lng: number
  ): { name: string; center: [number, number] } {
    const lacDist = this.getDistance(
      lat,
      lng,
      this.lac1Center[0],
      this.lac1Center[1]
    );
    const gammarthDist = this.getDistance(
      lat,
      lng,
      this.gammarthCenter[0],
      this.gammarthCenter[1]
    );
    const jardinDist = this.getDistance(
      lat,
      lng,
      this.jardinCarthageCenter[0],
      this.jardinCarthageCenter[1]
    );
    if (lacDist < gammarthDist && lacDist < jardinDist) {
      return { name: 'Lac 1', center: this.lac1Center };
    } else if (gammarthDist < jardinDist) {
      return { name: 'Gammarth', center: this.gammarthCenter };
    } else {
      return { name: 'Jardin de Carthage', center: this.jardinCarthageCenter };
    }
  }

  reverseGeocode(lat: number, lng: number) {
    let foundStreet: {
      name: string;
      coords: [number, number][];
      userCount: number;
    } | null = null;
    let minDist = 21;
    for (const street of this.streetsData) {
      const dist = this.pointToLineDistance(lat, lng, street.coords);
      if (dist < minDist) {
        minDist = dist;
        foundStreet = street;
      }
    }

    // Show loading message
    this.infoMessage = 'Checking parking zone...';
    this.showConfirm = false;

    // First check if point is in Jardin Carthage polygon (special case)
    const isInJardinCarthage = this.isPointInPolygon(
      lat,
      lng,
      this.jardinCarthagePolygonCoords
    );

    if (isInJardinCarthage) {
      // Special handling for Jardin Carthage
      this.http
        .get<any>(
          `http://localhost:8080/api/zone/check-parking-zone?lat=${lat}&lon=${lng}`
        )
        .subscribe({
          next: (apiRes) => {
            let streetMsg = foundStreet
              ? `You are on: ${foundStreet.name || 'Unnamed Street'}`
              : 'No street found nearby.';

            if (apiRes.message === 'You are good to park your car') {
              this.http
                .get<any>(
                  `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
                )
                .subscribe({
                  next: (res) => {
                    this.locationName = res.display_name || 'Unknown location';
                    this.infoMessage =
                      `You pinned:<br>Lat: ${lat}<br>Lng: ${lng}<br>` +
                      `${streetMsg}<br>` +
                      `You are in Les Jardins de Carthage parking zone.`;
                    this.showConfirm = true;
                  },
                  error: () => {
                    this.locationName = 'Unknown location';
                    this.infoMessage =
                      `You pinned:<br>Lat: ${lat}<br>Lng: ${lng}<br>` +
                      `${streetMsg}<br>` +
                      `You are in Les Jardins de Carthage parking zone.`;
                    this.showConfirm = true;
                  },
                });
            } else if (apiRes.message === 'You are in the zone but not in a parking area') {
              this.infoMessage =
                `You are in Les Jardins de Carthage but not in a parking area.<br>` +
                `Allowed streets:<br>` +
                `- Les Jardins de Carthage, Sidi Amor, Le Kram, Tunis, 1090, Tunisia<br>` +
                `- Les Jardins de Carthage, El Bouhaira, Le Kram, Tunis, 1090, Tunisia`;
              this.showConfirm = false;
            } else {
              this.infoMessage = apiRes.message || 'Error checking parking zone';
              this.showConfirm = false;
            }
          },
          error: () => {
            this.infoMessage =
              'Error: Unable to check parking zone. Please try again.';
            this.showConfirm = false;
          },
        });
    } else {
      // Regular zone checking for other areas
      this.http
        .get<any>(
          `http://localhost:8080/api/zone/check-parking-zone?lat=${lat}&lon=${lng}`
        )
        .subscribe({
          next: (apiRes) => {
            if (apiRes.message === 'You are good to park your car') {
              this.http
                .get<any>(
                  `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
                )
                .subscribe({
                  next: (res) => {
                    this.locationName = res.display_name || 'Unknown location';
                    let streetMsg = foundStreet
                      ? `You are on: ${foundStreet.name || 'Unnamed Street'}`
                      : 'No street found nearby.';
                    this.infoMessage =
                      `You pinned:<br>Lat: ${lat}<br>Lng: ${lng}<br>` +
                      `${streetMsg}<br>` +
                      `You are good to park your car.`;
                    this.showConfirm = true;
                  },
                  error: () => {
                    this.locationName = 'Unknown location';
                    let streetMsg = foundStreet
                      ? `You are on: ${foundStreet.name || 'Unnamed Street'}`
                      : 'No street found nearby.';
                    this.infoMessage =
                      `You pinned:<br>Lat: ${lat}<br>Lng: ${lng}<br>` +
                      `${streetMsg}<br>` +
                      `You are good to park your car.`;
                    this.showConfirm = true;
                  },
                });
            } else {
              let closestAreaMsg = apiRes.message ? ` ${apiRes.message}` : '';
              this.infoMessage =
                `You are not in the zone.<br>` +
                `Lat: ${lat}<br>Lng: ${lng}<br>` +
                `${closestAreaMsg}<br>` +
                `Please rechoose your location.`;
              this.showConfirm = false;
            }
          },
          error: () => {
            this.infoMessage =
              'Error: Unable to check parking zone. Please try again.';
            this.showConfirm = false;
          },
        });
    }
  }

  register() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    user.location = {
      locationName: this.locationName,
      latitude: this.lat,
      longitude: this.lng,
    };
    this.userService.registerUser(user).subscribe((savedUser) => {
      this.registrationSuccess = true;
      localStorage.setItem('user', JSON.stringify(savedUser));
      alert('Registration successful!');
      this.router.navigate(['/profile']);
    });
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  onSearch() {
    if (!this.searchQuery) return;

    const latLngMatch = this.searchQuery.match(
      /^\s*(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)\s*$/
    );
    if (latLngMatch) {
      const lat = parseFloat(latLngMatch[1]);
      const lng = parseFloat(latLngMatch[3]);
      if (this.map) {
        this.map.setView([lat, lng], 14);
        this.lat = lat;
        this.lng = lng;
        this.reverseGeocode(lat, lng);
      }
    } else {
      this.http
        .get<any>(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            this.searchQuery
          )}`
        )
        .subscribe((results) => {
          if (results && results.length > 0) {
            const lat = parseFloat(results[0].lat);
            const lng = parseFloat(results[0].lon);
            if (this.map) {
              this.map.setView([lat, lng], 14);
              this.lat = lat;
              this.lng = lng;
              this.reverseGeocode(lat, lng);
            }
          } else {
            alert('Location not found.');
          }
        });
    }
  }

  private showSelectedMarker(lat: number, lng: number) {
    if (this.selectedMarker) {
      this.map!.removeLayer(this.selectedMarker);
    }
    this.selectedMarker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl:
          'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        shadowSize: [41, 41],
      }),
    }).addTo(this.map!);
  }

  loadAndColorLocations() {
    this.http
      .get<any>('assets/export (3).geojson')
      .subscribe((streetsGeoJson) => {
        const streets = getStreetsFromGeoJson(streetsGeoJson);

        this.http
          .get<any[]>('http://localhost:8080/api/locations')
          .subscribe((locations) => {
            this.streetsData = [];
            streets.forEach(
              (street: { name: string; coords: [number, number][] }) => {
                let userCount = 0;
                locations.forEach((loc: any) => {
                  if (
                    loc.latitude &&
                    loc.longitude &&
                    this.isPointInAnyGeofence(loc.latitude, loc.longitude)
                  ) {
                    const dist = this.pointToLineDistance(
                      loc.latitude,
                      loc.longitude,
                      street.coords
                    );
                    if (dist < 20) userCount++;
                  }
                });

                if (userCount > 0 && street.coords.length > 1) {
                  let color = '';
                  if (userCount >= 1 && userCount <= 2) color = 'green';
                  else if (userCount >= 3 && userCount <= 4) color = 'orange';
                  else if (userCount > 4) color = 'red';

                  L.polyline(street.coords, {
                    color,
                    weight: 6,
                    dashArray: '8, 0',
                    opacity: 0.5,
                  })
                    .addTo(this.map!)
                    .bindPopup(
                      `<b>${
                        street.name || 'Unnamed Street'
                      }</b><br>Users: ${userCount}`
                    );
                }

                this.streetsData.push({
                  name: street.name,
                  coords: street.coords,
                  userCount,
                });
              }
            );
          });
      });
  }

  // ============ CRUD OPERATIONS FOR ZONES AND STREETS ============
  
  toggleCrudPanel() {
    this.showCrudPanel = !this.showCrudPanel;
    if (this.showCrudPanel) {
      this.loadZonesAndStreets();
    }
  }

  switchCrudMode(mode: 'zones' | 'streets') {
    this.crudMode = mode;
    this.resetForms();
    this.isEditing = false;
  }

  loadZonesAndStreets() {
    this.zoneService.getAllZones().subscribe(zones => {
      this.zones = zones;
      this.displayZonesOnMap();
    });
    
    this.zoneService.getAllStreets().subscribe(streets => {
      this.streets = streets;
      this.displayStreetsOnMap();
    });
  }

  displayZonesOnMap() {
    this.zoneLayerGroup.clearLayers();
    
    this.zones.forEach(zone => {
      if (zone.coordinates && zone.coordinates.length > 0) {
        // Convert coordinates format if needed (ensure [lat, lng] format)
        const coords = zone.coordinates.map(coord => 
          coord.length >= 2 ? [coord[1], coord[0]] : coord
        ) as [number, number][];
        
        const polygon = L.polygon(coords, {
          color: '#007bff',
          weight: 2,
          fillOpacity: 0.1,
          className: 'crud-zone'
        }).addTo(this.zoneLayerGroup);
        
        polygon.bindPopup(`
          <div>
            <h6>${zone.name}</h6>
            <p>${zone.description}</p>
            <button onclick="window.editZone(${zone.id})" class="btn btn-sm btn-primary">Edit</button>
            <button onclick="window.deleteZone(${zone.id})" class="btn btn-sm btn-danger">Delete</button>
          </div>
        `);
      }
    });
    
    this.zoneLayerGroup.addTo(this.map!);
  }

  displayStreetsOnMap() {
    this.streetLayerGroup.clearLayers();
    
    this.streets.forEach(street => {
      if (street.coordinates && street.coordinates.length > 0) {
        // Convert coordinates format if needed
        const coords = street.coordinates.map(coord => 
          coord.length >= 2 ? [coord[1], coord[0]] : coord
        ) as [number, number][];
        
        const polyline = L.polyline(coords, {
          color: street.isParkable ? '#28a745' : '#dc3545',
          weight: 4,
          className: 'crud-street'
        }).addTo(this.streetLayerGroup);
        
        polyline.bindPopup(`
          <div>
            <h6>${street.name}</h6>
            <p>Zone: ${street.zoneName}</p>
            <p>Parkable: ${street.isParkable ? 'Yes' : 'No'}</p>
            <button onclick="window.editStreet('${street.id}')" class="btn btn-sm btn-primary">Edit</button>
            <button onclick="window.deleteStreet('${street.id}')" class="btn btn-sm btn-danger">Delete</button>
          </div>
        `);
      }
    });
    
    this.streetLayerGroup.addTo(this.map!);
  }

  // Helper methods for coordinate parsing
  parseZoneCoordinates() {
    try {
      if (!this.zoneCoordinatesText.trim()) {
        this.zoneForm.coordinates = [];
        return;
      }
      
      // Parse coordinates from text input
      // Expected format: "lat1,lng1;lat2,lng2;lat3,lng3" or JSON array
      const coords = this.parseCoordinatesFromText(this.zoneCoordinatesText);
      this.zoneForm.coordinates = coords;
    } catch (error) {
      console.error('Error parsing zone coordinates:', error);
      this.infoMessage = 'Invalid coordinate format. Use: lat1,lng1;lat2,lng2 or JSON array format.';
    }
  }

  parseStreetCoordinates() {
    try {
      if (!this.streetCoordinatesText.trim()) {
        this.streetForm.coordinates = [];
        return;
      }
      
      const coords = this.parseCoordinatesFromText(this.streetCoordinatesText);
      this.streetForm.coordinates = coords;
    } catch (error) {
      console.error('Error parsing street coordinates:', error);
      this.infoMessage = 'Invalid coordinate format. Use: lat1,lng1;lat2,lng2 or JSON array format.';
    }
  }

  parseCoordinatesFromText(text: string): number[][] {
    text = text.trim();
    
    // Try to parse as JSON first
    if (text.startsWith('[')) {
      const parsed = JSON.parse(text);
      // Convert to [lng, lat] format for backend
      return parsed.map((coord: number[]) => [coord[1], coord[0]]);
    }
    
    // Parse semicolon-separated coordinates
    const coordinatePairs = text.split(';');
    return coordinatePairs.map(pair => {
      const [lat, lng] = pair.split(',').map(n => parseFloat(n.trim()));
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinate pair: ' + pair);
      }
      return [lng, lat]; // Store as [lng, lat] for backend
    });
  }

  // Zone CRUD methods
  saveZone() {
    if (this.isEditing && this.selectedZone) {
      this.zoneService.updateZone(this.selectedZone.id!, this.zoneForm).subscribe({
        next: () => {
          this.loadZonesAndStreets();
          this.resetForms();
          this.infoMessage = 'Zone updated successfully!';
        },
        error: (err) => {
          this.infoMessage = 'Error updating zone: ' + err.message;
        }
      });
    } else {
      this.zoneService.createZone(this.zoneForm).subscribe({
        next: () => {
          this.loadZonesAndStreets();
          this.resetForms();
          this.infoMessage = 'Zone created successfully!';
        },
        error: (err) => {
          this.infoMessage = 'Error creating zone: ' + err.message;
        }
      });
    }
  }

  editZone(zoneId: number) {
    const zone = this.zones.find(z => z.id === zoneId);
    if (zone) {
      this.selectedZone = zone;
      this.zoneForm = { ...zone };
      // Convert coordinates back to text format for editing
      if (zone.coordinates && zone.coordinates.length > 0) {
        this.zoneCoordinatesText = zone.coordinates
          .map(coord => `${coord[1]},${coord[0]}`) // Convert [lng,lat] back to lat,lng
          .join(';');
      }
      this.isEditing = true;
      this.crudMode = 'zones';
    }
  }

  deleteZone(zoneId: number) {
    if (confirm('Are you sure you want to delete this zone?')) {
      this.zoneService.deleteZone(zoneId).subscribe({
        next: () => {
          this.loadZonesAndStreets();
          this.infoMessage = 'Zone deleted successfully!';
        },
        error: (err) => {
          this.infoMessage = 'Error deleting zone: ' + err.message;
        }
      });
    }
  }

  // Street CRUD methods
  saveStreet() {
    if (this.isEditing && this.selectedStreet) {
      this.zoneService.updateStreet(this.selectedStreet.id!, this.streetForm).subscribe({
        next: () => {
          this.loadZonesAndStreets();
          this.resetForms();
          this.infoMessage = 'Street updated successfully!';
        },
        error: (err) => {
          this.infoMessage = 'Error updating street: ' + err.message;
        }
      });
    } else {
      this.zoneService.createStreet(this.streetForm).subscribe({
        next: () => {
          this.loadZonesAndStreets();
          this.resetForms();
          this.infoMessage = 'Street created successfully!';
        },
        error: (err) => {
          this.infoMessage = 'Error creating street: ' + err.message;
        }
      });
    }
  }

  editStreet(streetId: string) {
    const street = this.streets.find(s => s.id === streetId);
    if (street) {
      this.selectedStreet = street;
      this.streetForm = { ...street };
      // Convert coordinates back to text format for editing
      if (street.coordinates && street.coordinates.length > 0) {
        this.streetCoordinatesText = street.coordinates
          .map(coord => `${coord[1]},${coord[0]}`) // Convert [lng,lat] back to lat,lng
          .join(';');
      }
      this.isEditing = true;
      this.crudMode = 'streets';
    }
  }

  deleteStreet(streetId: string) {
    if (confirm('Are you sure you want to delete this street?')) {
      this.zoneService.deleteStreet(streetId).subscribe({
        next: () => {
          this.loadZonesAndStreets();
          this.infoMessage = 'Street deleted successfully!';
        },
        error: (err) => {
          this.infoMessage = 'Error deleting street: ' + err.message;
        }
      });
    }
  }

  resetForms() {
    this.zoneForm = { name: '', description: '', postCode: [], coordinates: [] };
    this.streetForm = { name: '', zoneId: 0, isParkable: true, coordinates: [] };
    this.zoneCoordinatesText = '';
    this.streetCoordinatesText = '';
    this.selectedZone = null;
    this.selectedStreet = null;
    this.isEditing = false;
  }

  // Helper methods for popup callbacks
  setupGlobalCallbacks() {
    // Make methods available globally for popup buttons
    (window as any).editZone = this.editZone.bind(this);
    (window as any).deleteZone = this.deleteZone.bind(this);
    (window as any).editStreet = this.editStreet.bind(this);
    (window as any).deleteStreet = this.deleteStreet.bind(this);
  }

  // Template helper methods
  getPostCodeString(): string {
    return this.zoneForm.postCode?.join(', ') || '';
  }

  updatePostCodes(event: any) {
    const value = event.target.value;
    this.zoneForm.postCode = value
      .split(',')
      .map((n: string) => parseInt(n.trim()))
      .filter((n: number) => !isNaN(n));
  }

  getCoordinatesCount(coordinates: number[][] | undefined): number {
    return coordinates?.length || 0;
  }

  hasZoneCoordinates(): boolean {
    return !!(this.zoneForm.coordinates && this.zoneForm.coordinates.length > 0);
  }

  hasStreetCoordinates(): boolean {
    return !!(this.streetForm.coordinates && this.streetForm.coordinates.length > 0);
  }

  getZonePostCodes(postCodes: number[] | undefined): string {
    return postCodes?.join(', ') || '';
  }

  getStreetsCount(streets: Street[] | undefined): number {
    return streets?.length || 0;
  }
}