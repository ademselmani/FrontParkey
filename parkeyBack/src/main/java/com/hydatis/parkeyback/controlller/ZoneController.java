package com.hydatis.parkeyback.controlller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.util.StreamUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.client.RestTemplate;

import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import com.hydatis.parkeyback.repository.ZonesRepository;
import com.hydatis.parkeyback.Document.Zones;
import java.util.List;
import com.hydatis.parkeyback.repository.StreetsRepository;
import com.hydatis.parkeyback.Document.Streets;

@RestController
@RequestMapping("/api/zone")
@CrossOrigin(origins = "http://localhost:4200")
public class ZoneController {

  private static final double EARTH_RADIUS_KM = 6371.0; // Earth's radius in kilometers

  @Autowired
  private ZonesRepository zonesRepository;

  @Autowired
  private StreetsRepository streetsRepository;

  // Helper: load only parkable streets for a Mongo zone; prefer embedded streets if present, fallback by id/name
  private List<Streets> loadStreetsForZone(Zones zone) {
    if (zone == null) return List.of();
    try {
      // Prefer embedded streets if available
      if (zone.getStreets() != null && !zone.getStreets().isEmpty()) {
        List<Streets> embedded = zone.getStreets().stream()
          .filter(s -> s != null && s.isParkable())
          .toList();
        if (!embedded.isEmpty()) return embedded;
      }
      // Fallback: repository by zoneId (parkable only)
      List<Streets> byId = streetsRepository.findByZoneIdAndParkableTrue(zone.getId());
      if (byId != null && !byId.isEmpty()) return byId;
      // Fallback: by zoneName (parkable only)
      if (zone.getName() != null && !zone.getName().isBlank()) {
        List<Streets> byName = streetsRepository.findByZoneNameIgnoreCaseAndParkableTrue(zone.getName());
        return byName != null ? byName : List.of();
      }
      return List.of();
    } catch (Exception e) {
      return List.of();
    }
  }

  // GeoJSON file endpoints kept for frontend needs
  @GetMapping(value = "/lac1", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<String> getLac1GeoJson() throws Exception {
    ClassPathResource resource = new ClassPathResource("geojson/1053 1055 Les Berges du Lac.geojson");
    String geoJson = StreamUtils.copyToString(resource.getInputStream(), java.nio.charset.StandardCharsets.UTF_8);
    return ResponseEntity.ok(geoJson);
  }

  @GetMapping(value = "/gammarth", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<String> getGammarthGeoJson() throws Exception {
    ClassPathResource resource = new ClassPathResource("geojson/1057 gammarth.geojson");
    String geoJson = StreamUtils.copyToString(resource.getInputStream(), java.nio.charset.StandardCharsets.UTF_8);
    return ResponseEntity.ok(geoJson);
  }

  @GetMapping(value = "/jdc", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<String> getJdcStreetsGeoJson() throws Exception {
    ClassPathResource resource = new ClassPathResource("geojson/1090 Les Jardins de Carthage .geojson");
    String geoJson = StreamUtils.copyToString(resource.getInputStream(), java.nio.charset.StandardCharsets.UTF_8);
    return ResponseEntity.ok(geoJson);
  }

  @GetMapping("/check-parking-zone")
  public ResponseEntity<?> checkParkingZone(@RequestParam double lat, @RequestParam double lon) {
    try {
      // Reverse geocoding to get postcode
      String url = String.format(Locale.US, "https://nominatim.openstreetmap.org/reverse?format=json&lat=%f&lon=%f", lat, lon);
      RestTemplate rt = new RestTemplate();
      HttpHeaders headers = new HttpHeaders();
      headers.set("User-Agent", "ParkeyApp");
      HttpEntity<String> entity = new HttpEntity<>(headers);
      ResponseEntity<String> resp = rt.exchange(url, HttpMethod.GET, entity, String.class);
      ObjectMapper mapper = new ObjectMapper();
      JsonNode nominatim = mapper.readTree(resp.getBody());
      String postcode = nominatim.path("address").path("postcode").asText();

      // Try by postcode first
      try {
        Integer pc = null;
        try { pc = Integer.parseInt(postcode.trim()); } catch (Exception ignored) {}
        if (pc != null) {
          List<Zones> zones = zonesRepository.findByPostCode(pc);

          if (zones != null) {
            for (Zones z : zones) {
              if (isInsideZonePolygon(z, lat, lon)) {

                return buildParkingResponse(z, lat, lon);
              }
            }
          }
        }
      } catch (Exception ignored) {}

      // Fallback: scan all zones spatially
      try {
        List<Zones> all = zonesRepository.findAll();
        for (Zones z : all) {
          if (isInsideZonePolygon(z, lat, lon)) {
            return buildParkingResponse(z, lat, lon);
          }
        }
      } catch (Exception ignored) {}

      // Default when not in any Mongo zone
      return ResponseEntity.ok(Map.of(
        "message", "Not in a parking zone",
        "lat", lat,
        "lon", lon
      ));

    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(Map.of("error", "Error processing request: " + e.getMessage()));
    }
  }

  // Helpers
  private boolean isInsideZonePolygon(Zones zone, double lat, double lon) {
    List<List<Double>> coords = zone.getCoordinates();
    if (coords == null || coords.size() < 3) return false;
    double[][] polygon = new double[coords.size()][2];
    for (int i = 0; i < coords.size(); i++) {
      List<Double> p = coords.get(i);
      if (p == null || p.size() < 2) return false;
      polygon[i][0] = p.get(0); // lat
      polygon[i][1] = p.get(1); // lon
    }
    return isPointInPolygonCustom(lat, lon, polygon);
  }

  private ResponseEntity<?> buildParkingResponse(Zones zone, double lat, double lon) {
    List<Streets> parkableStreets = loadStreetsForZone(zone);

    boolean inParking = false;
    if (parkableStreets != null && !parkableStreets.isEmpty()) {
      outer:
      for (Streets s : parkableStreets) {
        List<List<Double>> line = s.getCoordinates(); // may be [lon, lat] or [lat, lon]
        if (line == null || line.size() < 2) continue;
        for (int i = 0; i < line.size() - 1; i++) {
          List<Double> a = line.get(i), b = line.get(i + 1);
          if (a == null || b == null || a.size() < 2 || b.size() < 2) continue;

          // Interpret as [lon, lat]
          double lon1A = a.get(0), lat1A = a.get(1);
          double lon2A = b.get(0), lat2A = b.get(1);
          double dA = pointToSegmentDistance2(lat, lon, lat1A, lon1A, lat2A, lon2A);

          // Interpret as [lat, lon]
          double lat1B = a.get(0), lon1B = a.get(1);
          double lat2B = b.get(0), lon2B = b.get(1);
          double dB = pointToSegmentDistance2(lat, lon, lat1B, lon1B, lat2B, lon2B);

          double d = Math.min(dA, dB); // km
          if (d < 0.04) { // ~40 meters
            inParking = true;
            break outer;
          }
        }
      }
    }
    List<String> names = (parkableStreets == null ? List.<Streets>of() : parkableStreets).stream()
      .map(Streets::getName)
      .filter(n -> n != null && !n.isBlank())
      .distinct()
      .toList();

    return ResponseEntity.ok(Map.of(
      "message", inParking ? "You are good to park your car" : "You are in the zone but not in a parking area",
      "lat", lat,
      "lon", lon,
      "zone", zone.getName(),
      "streets", parkableStreets,
      "allowedStreets", names
    ));
  }

  // Point-in-polygon where polygon is (lat, lon)
  private boolean isPointInPolygonCustom(double lat, double lon, double[][] polygon) {
    int n = polygon.length;
    boolean inside = false;
    for (int i = 0, j = n - 1; i < n; j = i++) {
      double lati = polygon[i][0], loni = polygon[i][1];
      double latj = polygon[j][0], lonj = polygon[j][1];
      boolean intersect = ((loni > lon) != (lonj > lon)) &&
        (lat < (latj - lati) * (lon - loni) / ((lonj - loni) + 1e-12) + lati);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private double pointToSegmentDistance2(double lat, double lon, double lat1, double lon1, double lat2, double lon2) {
    double dx = lon2 - lon1;
    double dy = lat2 - lat1;
    if (dx == 0 && dy == 0) {
      return distance2(lat, lon, lat1, lon1);
    }
    double t = ((lon - lon1) * dx + (lat - lat1) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    double projLon = lon1 + t * dx;
    double projLat = lat1 + t * dy;
    return distance2(lat, lon, projLat, projLon);
  }

  private double distance2(double lat1, double lon1, double lat2, double lon2) {
    double latRad1 = Math.toRadians(lat1);
    double latRad2 = Math.toRadians(lat2);
    double deltaLat = Math.toRadians(lat2 - lat1);
    double deltaLon = Math.toRadians(lon2 - lon1);
    double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(latRad1) * Math.cos(latRad2) *
      Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    return new ZoneController().distance2(lat1, lon1, lat2, lon2);
  }
}
