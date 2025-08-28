import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';

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
  selector: 'app-display-map',
  templateUrl: './display-map.component.html',
  styleUrls: ['./display-map.component.css']
})
export class DisplayMapComponent implements OnInit {
  private map: L.Map | undefined;
  private geofencePolygonCoords: [number, number][] = [
  [36.8341568, 10.2435004],
  [36.8350051, 10.2464232],
  [36.8345221, 10.2466612],
  [36.8347049, 10.2472766],
  [36.8341899, 10.2474907],
  [36.8350909, 10.2506008],
  [36.8352024, 10.2507901],
  [36.8357196, 10.2505452],
  [36.8366375, 10.2501203],
  [36.8407836, 10.2481752],
  [36.8407392, 10.2481205],
  [36.8410049, 10.2477179],
  [36.8414453, 10.2471746],
  [36.8412488, 10.2465301],
  [36.8410659, 10.2459082],
  [36.840688, 10.2446228],
  [36.8403231, 10.2433941],
  [36.8401391, 10.2427594],
  [36.8398084, 10.2416185],
  [36.839617, 10.2409585],
  [36.8394279, 10.2403536],
  [36.8398504, 10.2401605],
  [36.8396491, 10.2394731],
  [36.8395931, 10.2394987],
  [36.8389562, 10.237389],
  [36.8388094, 10.2369167],
  [36.8386103, 10.2362518],
  [36.838705, 10.2362119],
  [36.8385756, 10.2357525],
  [36.8384274, 10.2352645],
  [36.8383404, 10.2353037],
  [36.8381652, 10.2346959],
  [36.83799, 10.2340884],
  [36.8372797, 10.2316246],
  [36.8371076, 10.2310276],
  [36.8369296, 10.230393],
  [36.8365665, 10.2291338],
  [36.8362092, 10.2278945],
  [36.8362918, 10.2278573],
  [36.8360943, 10.2271992],
  [36.8359469, 10.2266859],
  [36.834866, 10.2229775],
  [36.8347251, 10.2225259],
  [36.8348612, 10.2224628],
  [36.834609, 10.2216145],
  [36.8344866, 10.2216713],
  [36.8339731, 10.219941],
  [36.8336343, 10.2187075],
  [36.8332012, 10.2172382],
  [36.8327414, 10.2160531],
  [36.8322014, 10.2146826],
  [36.8312161, 10.2148468],
  [36.831124, 10.2149115],
  [36.8305671, 10.2154189],
  [36.8289471, 10.2168739],
  [36.828909, 10.2170701],
  [36.829032, 10.2174026],
  [36.828991, 10.2174778],
  [36.8290604, 10.2176369],
  [36.8292369, 10.2177158],
  [36.8297108, 10.2191578],
  [36.8297912, 10.2194025],
  [36.8300571, 10.2205261],
  [36.8302814, 10.2216353],
  [36.8304897, 10.2231579],
  [36.8306094, 10.2244244],
  [36.8306091, 10.2249201],
  [36.830569, 10.2254194],
  [36.8304854, 10.2258294],
  [36.8304426, 10.2259455],
  [36.8303677, 10.2260233],
  [36.8302573, 10.2261187],
  [36.8301977, 10.2262029],
  [36.8301502, 10.2263351],
  [36.8301429, 10.226489],
  [36.8301857, 10.2266317],
  [36.8301762, 10.2268456],
  [36.8301381, 10.2270001],
  [36.8300512, 10.2272576],
  [36.83003, 10.2274027],
  [36.8300249, 10.2275702],
  [36.8306234, 10.2296552],
  [36.8301951, 10.2298486],
  [36.8303775, 10.2304791],
  [36.8298898, 10.2306994],
  [36.8300712, 10.2313264],
  [36.8295656, 10.2315547],
  [36.8299601, 10.2329184],
  [36.8304741, 10.2326863],
  [36.8306566, 10.2333171],
  [36.8311477, 10.2330953],
  [36.8319909, 10.2360098],
  [36.8315026, 10.2362303],
  [36.8316839, 10.236857],
  [36.8311764, 10.2370862],
  [36.8315685, 10.2384415],
  [36.8320786, 10.2382112],
  [36.8322629, 10.238848],
  [36.832763, 10.2386222],
  [36.8333956, 10.2409082],
  [36.8329088, 10.2411353],
  [36.8330911, 10.2417607],
  [36.8325779, 10.2419935],
  [36.8329711, 10.2433391],
  [36.8334815, 10.243103],
  [36.8336715, 10.2437296],
  [36.8341568, 10.2435004]
  ];

  
  private streetLineLayers: L.Polyline[] = [];
  private streetOverlayLayers: L.Polyline[] = [];
  private geofenceCenter = { lat: 36.838175, lng: 10.2375679 };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initMap();
    this.loadAndColorLocations();
  }

  private initMap(): void {
    this.map = L.map('displayMap').setView(
      [this.geofenceCenter.lat, this.geofenceCenter.lng],
      13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(this.map);

    
    L.polygon(this.geofencePolygonCoords, {
      color: 'blue',
      weight: 3,
      dashArray: '8, 8',
      fillOpacity: 0.05,
    }).addTo(this.map);
  }

  private isPointInPolygon(
    lat: number,
    lng: number,
    polygon: [number, number][]
  ): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0],
        yi = polygon[i][1];
      const xj = polygon[j][0],
        yj = polygon[j][1];
      const intersect =
        yi > lng !== yj > lng &&
        lat < ((xj - xi) * (lng - yi)) / (yj - yi + 0.0000001) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
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
    const R = 6371000;
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

  loadAndColorLocations() {
    this.http
      .get<any>('assets/export (1).geojson')
      .subscribe((streetsGeoJson) => {
        const streets = getStreetsFromGeoJson(streetsGeoJson);

        this.http
          .get<any[]>('http://localhost:8080/api/locations')
          .subscribe((locations) => {
            streets.forEach(
              (street: { name: string; coords: [number, number][] }) => {
                let userCount = 0;
                locations.forEach((loc: any) => {
                  if (
                    loc.latitude &&
                    loc.longitude &&
                    this.isPointInPolygon(
                      loc.latitude,
                      loc.longitude,
                      this.geofencePolygonCoords
                    )
                  ) {
                    const dist = this.pointToLineDistance(
                      loc.latitude,
                      loc.longitude,
                      street.coords
                    );
                    if (dist < 20) userCount++;
                  }
                });

                
                let color = '';
                if (userCount >= 1 && userCount <= 2) color = 'green';
                else if (userCount >= 3 && userCount <= 4) color = 'orange';
                else if (userCount > 4) color = 'red';

                
                const line = L.polyline(street.coords, {
                  color,
                  weight: 6,
                  opacity: 0.5,
                }).bindPopup(
                  `<b>${street.name || 'Unnamed Street'}</b><br>Users: ${userCount}`
                );

                
                const overlay = L.polyline(street.coords, {
                  color,
                  weight: 18,
                  opacity: 0.5,
                  interactive: false 
                });

                this.streetLineLayers.push(line);
                this.streetOverlayLayers.push(overlay);

                
                line.addTo(this.map!);
              }
            );

            
            this.updateStreetLayers();

            
            this.map!.on('zoomend', () => this.updateStreetLayers());
          });
      });
  }

  
  private updateStreetLayers() {
    if (!this.map) return;
    const zoom = this.map.getZoom();
    if (zoom < 14) {
      
      this.streetLineLayers.forEach(l => this.map!.removeLayer(l));
      this.streetOverlayLayers.forEach(l => l.addTo(this.map!));
    } else {
      
      this.streetOverlayLayers.forEach(l => this.map!.removeLayer(l));
      this.streetLineLayers.forEach(l => l.addTo(this.map!));
    }
  }
}
