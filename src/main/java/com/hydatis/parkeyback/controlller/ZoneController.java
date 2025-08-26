package com.hydatis.parkeyback.controlller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.util.StreamUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import com.hydatis.parkeyback.repository.ZonesRepository;
import com.hydatis.parkeyback.Document.Zones;
import java.util.List;
import java.util.Objects;
import com.hydatis.parkeyback.repository.StreetsRepository;
import com.hydatis.parkeyback.Document.Streets;
import java.util.ArrayList;
import java.util.stream.Collectors;

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

  // Helper: load only parkable streets by zone name
  private List<Streets> loadStreetsByZoneName(String zoneName) {
    if (zoneName == null || zoneName.isBlank()) return List.of();
    try {
      List<Streets> byName = streetsRepository.findByZoneNameIgnoreCaseAndParkableTrue(zoneName);
      return byName != null ? byName : List.of();
    } catch (Exception e) {
      return List.of();
    }
  }

  // Helper: resolve zone from Mongo for a given postcode and optional name hint
  private Zones resolveZone(Integer postcode, String nameHint) {
    try {
      List<Zones> candidates = zonesRepository.findByPostCode(postcode);
      if (candidates == null || candidates.isEmpty()) return null;
      if (candidates.size() == 1) return candidates.get(0);
      if (nameHint != null) {
        String norm = nameHint.toLowerCase().trim();
        for (Zones z : candidates) {
          String zn = z.getName() != null ? z.getName().toLowerCase().trim() : "";
          if (zn.equals(norm) || zn.contains(norm) || norm.contains(zn)) return z;
        }
      }
      // Fallback to first
      return candidates.get(0);
    } catch (Exception e) {
      return null;
    }
  }

    @GetMapping(value = "/lac1", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getLac1GeoJson() throws IOException {
        ClassPathResource resource = new ClassPathResource("geojson/1053 1055 Les Berges du Lac.geojson");
        String geoJson = StreamUtils.copyToString(resource.getInputStream(), java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok(geoJson);
    }

    @GetMapping(value = "/gammarth", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getGammarthGeoJson() throws IOException {
        ClassPathResource resource = new ClassPathResource("geojson/1057 gammarth.geojson");
        String geoJson = StreamUtils.copyToString(resource.getInputStream(), java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok(geoJson);
    }

    @GetMapping(value = "/jdc", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getJdcStreetsGeoJson() throws IOException {
        ClassPathResource resource = new ClassPathResource("geojson/1090 Les Jardins de Carthage .geojson");
        String geoJson = StreamUtils.copyToString(resource.getInputStream(), java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok(geoJson);
    }

    @GetMapping("/check-location")
    public ResponseEntity<?> checkLocation(@RequestParam double lat, @RequestParam double lon) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode gammarth = mapper.readTree(new ClassPathResource("geojson/1057 gammarth.geojson").getInputStream());
        JsonNode lac1 = mapper.readTree(new ClassPathResource("geojson/1053 1055 Les Berges du Lac.geojson").getInputStream());

        String zone = null;
        String closestArea = null;
        double minDistance = Double.MAX_VALUE;

        zone = findZone(lat, lon, gammarth, "gammarth", mapper);
        if (zone == null) zone = findZone(lat, lon, lac1, "lac1", mapper);

        if (zone != null) {
            return ResponseEntity.ok(mapper.createObjectNode()
                .put("message", "you are in the zone")
                .put("zone", zone)
                .put("lat", lat)
                .put("lon", lon));
        }


        double distGammarth = getMinDistance(lat, lon, gammarth, mapper);
        double distLac1 = getMinDistance(lat, lon, lac1, mapper);

        if (distGammarth < distLac1) {
            closestArea = "gammarth";
            minDistance = distGammarth;
        } else {
            closestArea = "lac1";
            minDistance = distLac1;
        }

        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode response = objectMapper.createObjectNode()
            .put("message", "out of zones")
            .put("lat", lat)
            .put("lon", lon)
            .put("closestArea", closestArea);
        return ResponseEntity.ok(response);
    }

    private String findZone(double lat, double lon, JsonNode geojson, String zoneName, ObjectMapper mapper) {
        for (JsonNode feature : geojson.get("features")) {
            JsonNode geometry = feature.get("geometry");
            if (geometry.get("type").asText().equals("LineString")) {
                JsonNode coords = geometry.get("coordinates");
                for (int i = 0; i < coords.size() - 1; i++) {
                    double lon1 = coords.get(i).get(0).asDouble();
                    double lat1 = coords.get(i).get(1).asDouble();
                    double lon2 = coords.get(i+1).get(0).asDouble();
                    double lat2 = coords.get(i+1).get(1).asDouble();
                    double d = pointToSegmentDistance(lat, lon, lat1, lon1, lat2, lon2);
                    if (d < 0.02) {
                        return zoneName;
                    }
                }
            }
        }
        return null;
    }


    private double pointToSegmentDistance(double lat, double lon, double lat1, double lon1, double lat2, double lon2) {
        double px = lon, py = lat;
        double x1 = lon1, y1 = lat1;
        double x2 = lon2, y2 = lat2;
        double dx = x2 - x1;
        double dy = y2 - y1;
        if (dx == 0 && dy == 0) {
            return distance(py, px, y1, x1);
        }
        double t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
        t = Math.max(0, Math.min(1, t));
        double projX = x1 + t * dx;
        double projY = y1 + t * dy;
        return distance(py, px, projY, projX);
    }

    private String findClosestArea(double lat, double lon, JsonNode geojson, ObjectMapper mapper) {
        String closest = null;
        double minDist = Double.MAX_VALUE;
        for (JsonNode feature : geojson.get("features")) {
            JsonNode geometry = feature.get("geometry");
            if (geometry.get("type").asText().equals("LineString")) {
                for (JsonNode coord : geometry.get("coordinates")) {
                    double lon2 = coord.get(0).asDouble();
                    double lat2 = coord.get(1).asDouble();
                    double d = distance(lat, lon, lat2, lon2);
                    if (d < minDist) {
                        minDist = d;
                        closest = feature.get("properties").has("name") ? feature.get("properties").get("name").asText() : null;
                    }
                }
            }
        }
        return closest;
    }

    private double getMinDistance(double lat, double lon, JsonNode geojson, ObjectMapper mapper) {
        double minDist = Double.MAX_VALUE;
        for (JsonNode feature : geojson.get("features")) {
            JsonNode geometry = feature.get("geometry");
            if (geometry.get("type").asText().equals("LineString")) {
                for (JsonNode coord : geometry.get("coordinates")) {
                    double lon2 = coord.get(0).asDouble();
                    double lat2 = coord.get(1).asDouble();
                    double d = distance(lat, lon, lat2, lon2);
                    if (d < minDist) minDist = d;
                }
            }
        }
        return minDist;
    }

    private double distance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371e3; // metres
        double phi1 = Math.toRadians(lat1);
        double phi2 = Math.toRadians(lat2);
        double deltaPhi = Math.toRadians(lat2 - lat1);
        double deltaLambda = Math.toRadians(lon2 - lon1);
        double a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        double d = R * c;
        return d / 1000.0;
    }


  @GetMapping("/check-parking-zone")
  public ResponseEntity<?> checkParkingZone(@RequestParam double lat, @RequestParam double lon) {
    try {
        // Call Nominatim API to get location details
        String nominatimUrl = String.format(Locale.US, "https://nominatim.openstreetmap.org/reverse?format=json&lat=%f&lon=%f", lat, lon);
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "ParkeyApp");
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(nominatimUrl, HttpMethod.GET, entity, String.class);
        ObjectMapper mapper = new ObjectMapper();
        JsonNode locationData = mapper.readTree(response.getBody());

        // Extract postcode from the response
        String postcode = locationData.path("address").path("postcode").asText();

        // Special handling for Les Jardins de Carthage (postcode 1090)
        if ("1090".equals(postcode)) {
            double[][] jardinCarthagePolygon = null;
            Zones jdcZone = null;
            try {
                List<Zones> dbZones = zonesRepository.findByPostCode(1090);
                for (Zones z : dbZones) {
                    if (z.getName() != null && z.getName().toLowerCase().contains("jardin")) { jdcZone = z; break; }
                    if (jdcZone == null) jdcZone = z;
                }
                if (jdcZone != null && jdcZone.getCoordinates() != null && !jdcZone.getCoordinates().isEmpty()) {
                    List<List<Double>> coords = jdcZone.getCoordinates();
                    jardinCarthagePolygon = new double[coords.size()][2];
                    for (int i = 0; i < coords.size(); i++) {
                        List<Double> pair = coords.get(i);
                        if (pair != null && pair.size() >= 2) {
                            // Assuming stored as [lat, lon]
                            jardinCarthagePolygon[i][0] = pair.get(0);
                            jardinCarthagePolygon[i][1] = pair.get(1);
                        }
                    }
                }
            } catch (Exception ignore) {}

            if (jardinCarthagePolygon != null && jardinCarthagePolygon.length > 2) {
                if (isPointInPolygonCustom(lat, lon, jardinCarthagePolygon)) {
                    // Inside JDC zone polygon, now check parking geojson
                    ObjectMapper mapper2 = new ObjectMapper();
                    JsonNode zoneGeoJson = mapper2.readTree(new ClassPathResource("geojson/1090 Les Jardins de Carthage .geojson").getInputStream());
                    boolean inParking = false;
                    for (JsonNode feature : zoneGeoJson.get("features")) {
                        JsonNode geometry = feature.get("geometry");
                        if (geometry.get("type").asText().equals("Polygon")) {
                            JsonNode coordinates = geometry.get("coordinates").get(0);
                            double[][] polygon = new double[coordinates.size()][2];
                            for (int i = 0; i < coordinates.size(); i++) {
                                polygon[i][0] = coordinates.get(i).get(1).asDouble(); // lat
                                polygon[i][1] = coordinates.get(i).get(0).asDouble(); // lon
                            }
                            if (isPointInPolygonCustom(lat, lon, polygon)) { inParking = true; break; }
                        } else if (geometry.get("type").asText().equals("LineString")) {
                            JsonNode coords = geometry.get("coordinates");
                            for (int i = 0; i < coords.size() - 1; i++) {
                                double lon1 = coords.get(i).get(0).asDouble();
                                double lat1 = coords.get(i).get(1).asDouble();
                                double lon2 = coords.get(i+1).get(0).asDouble();
                                double lat2 = coords.get(i+1).get(1).asDouble();
                                double d = pointToSegmentDistance2(lat, lon, lat1, lon1, lat2, lon2);
                                if (d < 0.02) { inParking = true; break; }
                            }
                        }
                        if (inParking) break;
                    }

                    List<Streets> streets = loadStreetsForZone(jdcZone);
                    if ((streets == null || streets.isEmpty())) {
                      // Fallback by zone name (DB or default label)
                      String zName = jdcZone != null && jdcZone.getName() != null && !jdcZone.getName().isBlank()
                        ? jdcZone.getName() : "Les Jardins de Carthage";
                      streets = loadStreetsByZoneName(zName);
                    }
                    List<String> streetNames = streets.stream()
                      .map(Streets::getName)
                      .filter(n -> n != null && !n.isBlank())
                      .distinct()
                      .toList();

                    if (inParking) {
                        return ResponseEntity.ok(Map.of(
                            "message", "You are good to park your car",
                            "lat", lat,
                            "lon", lon,
                            "zone", jdcZone != null ? jdcZone.getName() : "Les Jardins de Carthage",
                            "allowedStreets", streetNames
                        ));
                    } else {
                        return ResponseEntity.ok(Map.of(
                            "message", "You are in the zone but not in a parking area",
                            "lat", lat,
                            "lon", lon,
                            "zone", jdcZone != null ? jdcZone.getName() : "Les Jardins de Carthage",

                            "allowedStreets", streetNames
                        ));
                    }
                }
            }
            // If not inside DB polygon or polygon missing, fall through to default logic
        }

        // Resolve target geojson file by postcode
        Resource[] resources = new PathMatchingResourcePatternResolver()
            .getResources("classpath:geojson/*.geojson");

        String targetFileName = null;
        for (Resource resource : resources) {
            String filename = resource.getFilename();
            if (filename != null) {
                String[] parts = filename.split(" ");
                for (String part : parts) {
                    if (part.equals(postcode)) {
                        targetFileName = filename;

                        break;
                    }
                }
            }
            if (targetFileName != null) break;
        }



        ObjectMapper mapper2 = new ObjectMapper();

        // If found, check if point is in zone
        if (targetFileName != null) {
            JsonNode zoneGeoJson = mapper2.readTree(new ClassPathResource("geojson/" + targetFileName).getInputStream());
            // Attempt to resolve corresponding Mongo zone for streets fetch
            String nameHint = targetFileName.replace(".geojson", "").trim();
            Integer pcInt = null;
            try { pcInt = Integer.parseInt(postcode); } catch (Exception ignored) {}
            Zones matchedZone = pcInt != null ? resolveZone(pcInt, nameHint) : null;
            List<Streets> matchedStreets = loadStreetsForZone(matchedZone);
            if ((matchedStreets == null || matchedStreets.isEmpty())) {
              matchedStreets = loadStreetsByZoneName(nameHint);
            }
            List<String> matchedStreetNames = matchedStreets.stream()
              .map(Streets::getName)
              .filter(n -> n != null && !n.isBlank())
              .distinct()
              .toList();

            // Polygon check
            for (JsonNode feature : zoneGeoJson.get("features")) {
              JsonNode geometry = feature.get("geometry");
              if (geometry.get("type").asText().equals("Polygon")) {
                JsonNode coordinates = geometry.get("coordinates").get(0);
                double[][] polygon = new double[coordinates.size()][2];
                for (int i = 0; i < coordinates.size(); i++) {
                  polygon[i][0] = coordinates.get(i).get(0).asDouble();
                  polygon[i][1] = coordinates.get(i).get(1).asDouble();
                }
                if (isPointInPolygon(lat, lon, polygon)) {
                  return ResponseEntity.ok(Map.of(
                    "message", "You are good to park your car",
                    "lat", lat,
                    "lon", lon,
                    "zone", nameHint,
                    "streets", matchedStreets,
                    "allowedStreets", matchedStreetNames
                  ));
                }
              }
            }
            // LineString check
            for (JsonNode feature : zoneGeoJson.get("features")) {
              JsonNode geometry = feature.get("geometry");
              if (geometry.get("type").asText().equals("LineString")) {
                JsonNode coords = geometry.get("coordinates");
                for (int i = 0; i < coords.size() - 1; i++) {
                  double lon1 = coords.get(i).get(0).asDouble();
                  double lat1 = coords.get(i).get(1).asDouble();
                  double lon2 = coords.get(i+1).get(0).asDouble();
                  double lat2 = coords.get(i+1).get(1).asDouble();
                  double d = pointToSegmentDistance(lat, lon, lat1, lon1, lat2, lon2);
                  if (d < 0.02) {
                    return ResponseEntity.ok(Map.of(
                      "message", "You are good to park your car",
                      "lat", lat,
                      "lon", lon,
                      "zone", nameHint,
                      "streets", matchedStreets,
                      "allowedStreets", matchedStreetNames
                    ));
                  }
                }
              }
            }
        }

        // Always calculate closest area, even if postcode not found
        String closestZoneName = null;
        double minDist = Double.MAX_VALUE;
        for (Resource resource : resources) {
            String filename = resource.getFilename();
            if (filename == null) continue;
            JsonNode zoneGeoJsons = mapper2.readTree(new ClassPathResource("geojson/" + filename).getInputStream());
            double zoneMinDist = Double.MAX_VALUE;
            for (JsonNode feature : zoneGeoJsons.get("features")) {
                JsonNode geometry = feature.get("geometry");
                if (geometry.get("type").asText().equals("Polygon")) {
                    JsonNode coordinates = geometry.get("coordinates").get(0);
                    double[][] polygon = new double[coordinates.size()][2];
                    for (int i = 0; i < coordinates.size(); i++) {
                        polygon[i][0] = coordinates.get(i).get(0).asDouble();
                        polygon[i][1] = coordinates.get(i).get(1).asDouble();
                    }
                    double dist = getMinDistanceToPolygon(lat, lon, polygon);
                    zoneMinDist = Math.min(zoneMinDist, dist);
                } else if (geometry.get("type").asText().equals("LineString")) {
                    JsonNode coords = geometry.get("coordinates");
                    for (int i = 0; i < coords.size() - 1; i++) {
                        double lon1 = coords.get(i).get(0).asDouble();
                        double lat1 = coords.get(i).get(1).asDouble();
                        double lon2 = coords.get(i+1).get(0).asDouble();
                        double lat2 = coords.get(i+1).get(1).asDouble();
                        double dist = pointToSegmentDistance2(lat, lon, lat1, lon1, lat2, lon2);
                        zoneMinDist = Math.min(zoneMinDist, dist);
                    }
                }
            }
            if (zoneMinDist < minDist) {
                minDist = zoneMinDist;
                closestZoneName = filename.replace(".geojson", "");
            }
        }

        JsonNode closestGeoJson = null;
        if (closestZoneName != null) {
            // Load the geojson data for the closest area as JSON
            ClassPathResource closestResource = new ClassPathResource("geojson/" + closestZoneName + ".geojson");
            closestGeoJson = mapper2.readTree(closestResource.getInputStream());
        }

        return ResponseEntity.ok(Map.of(
            "message", "Not in a parking zone. Closest area: " + (closestZoneName != null ? closestZoneName : "none"),
            "lat", lat,
            "lon", lon,
            "closestArea", closestZoneName,
            "closestGeoJson", closestGeoJson
        ));

    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(Map.of("error", "Error processing request: " + e.getMessage()));
    }
  }

  private boolean isPointInPolygon(double lat, double lon, double[][] polygon) {

    int n = polygon.length;
    boolean inside = false;
    for (int i = 0, j = n - 1; i < n; j = i++) {
      double xi = polygon[i][0], yi = polygon[i][1]; // lon, lat
      double xj = polygon[j][0], yj = polygon[j][1]; // lon, lat
      boolean intersect = ((yi > lat) != (yj > lat)) &&
        (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Custom point-in-polygon for (lat, lon) order
  private boolean isPointInPolygonCustom(double lat, double lon, double[][] polygon) {
    int n = polygon.length;
    boolean inside = false;
    for (int i = 0, j = n - 1; i < n; j = i++) {
      double lati = polygon[i][0], loni = polygon[i][1];
      double latj = polygon[j][0], lonj = polygon[j][1];
      boolean intersect = ((loni > lon) != (lonj > lon)) &&
        (lat < (latj - lati) * (lon - loni) / (lonj - loni + 1e-12) + lati);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private double getMinDistanceToPolygon(double lat, double lon, double[][] polygon) {
    double minDistance = Double.MAX_VALUE;
    for (int i = 0; i < polygon.length - 1; i++) {
      double lat1 = polygon[i][1], lon1 = polygon[i][0];
      double lat2 = polygon[i + 1][1], lon2 = polygon[i + 1][0];
      double distance = pointToSegmentDistance2(lat, lon, lat1, lon1, lat2, lon2);
      minDistance = Math.min(minDistance, distance);
    }
    return minDistance;
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
