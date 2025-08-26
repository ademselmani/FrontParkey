package com.hydatis.parkeyback.controlller;

import com.hydatis.parkeyback.Document.Zones;
import com.hydatis.parkeyback.repository.ZonesRepository;
import com.hydatis.parkeyback.repository.StreetsRepository;
import com.hydatis.parkeyback.Document.Streets;
import com.hydatis.parkeyback.service.SequenceGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.Collections;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/zones")
@CrossOrigin(origins = "http://localhost:4200")
public class ZoneDocController {
    private static final Logger log = LoggerFactory.getLogger(ZoneDocController.class);

    @Autowired
    private ZonesRepository zonesRepository;
    @Autowired
    private StreetsRepository streetsRepository;
    @Autowired
    private SequenceGeneratorService sequenceGeneratorService;

    @PostMapping
    public Zones createZone(@RequestBody Zones zone) {
        zone.setId(sequenceGeneratorService.generateSequence("zones_sequence"));
        zone.setLastUpdated(new Date());
        // Embed current streets for this zone (if any exist already)
        List<Streets> streets = streetsRepository.findByZoneId(zone.getId());
        zone.setStreets(streets);
        return zonesRepository.save(zone);
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getAllZones() {
        try {
            List<Zones> zones = zonesRepository.findAll();
            if (zones.isEmpty()) {
                return ResponseEntity.ok(zones);
            }

            // Fetch all streets once and group by zoneId to avoid N+1 queries
            List<Streets> allStreets = streetsRepository.findAll();
            Map<Long, List<Streets>> streetsByZone = allStreets.stream()
                .collect(Collectors.groupingBy(Streets::getZoneId));

            for (Zones zone : zones) {
                List<Streets> streets = streetsByZone.getOrDefault(zone.getId(), Collections.emptyList());
                zone.setStreets(streets);
            }

            return ResponseEntity.ok(zones);
        } catch (Exception ex) {
            log.error("Failed to load zones from MongoDB", ex);
            return ResponseEntity.internalServerError().body(Map.of(
                "message", "Failed to load zones",
                "error", ex.getClass().getSimpleName(),
                "details", ex.getMessage()
            ));
        }
    }

    @GetMapping("/{id}")
    public Zones getZoneById(@PathVariable long id) {
        Optional<Zones> zoneOpt = zonesRepository.findById(id);
        if (zoneOpt.isPresent()) {
            Zones zone = zoneOpt.get();
            List<Streets> streets = streetsRepository.findByZoneId(zone.getId());
            zone.setStreets(streets);
            return zone;
        }
        return null;
    }

    @PutMapping("/{id}")
    public Zones updateZone(@PathVariable long id, @RequestBody Zones zone) {
        zone.setId(id);
        zone.setLastUpdated(new Date());
        // Update streets.zoneName to keep in sync if zone name changed
        List<Streets> streets = streetsRepository.findByZoneId(id);
        for (Streets s : streets) {
            s.setZoneName(zone.getName());
        }
        if (!streets.isEmpty()) streetsRepository.saveAll(streets);
        // Embed refreshed streets list
        zone.setStreets(streets);
        return zonesRepository.save(zone);
    }

    @DeleteMapping("/{id}")
    public void deleteZone(@PathVariable long id) {
        zonesRepository.deleteById(id);
    }

    @PostMapping("/sync-embedded-streets")
    public ResponseEntity<?> syncAllZonesEmbeddedStreets() {
        try {
            List<Zones> zones = zonesRepository.findAll();
            for (Zones zone : zones) {
                List<Streets> streets = streetsRepository.findByZoneId(zone.getId());
                zone.setStreets(streets);
                zone.setLastUpdated(new Date());
            }
            zonesRepository.saveAll(zones);
            return ResponseEntity.ok(Map.of("syncedZones", zones.size()));
        } catch (Exception ex) {
            log.error("Failed syncing embedded streets", ex);
            return ResponseEntity.internalServerError().body(Map.of(
                "message", "Failed syncing embedded streets",
                "error", ex.getClass().getSimpleName(),
                "details", ex.getMessage()
            ));
        }
    }
}
