package com.hydatis.parkeyback.controlller;

import com.hydatis.parkeyback.Document.Streets;
import com.hydatis.parkeyback.Document.Zones;
import com.hydatis.parkeyback.repository.StreetsRepository;
import com.hydatis.parkeyback.repository.ZonesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/streets")
public class StreetDocController {
    @Autowired
    private StreetsRepository streetsRepository;
    @Autowired
    private ZonesRepository zonesRepository;

    @PostMapping
    public Streets createStreet(@RequestBody Streets street) {
        street.setLastUpdated(new Date());
        // Remplir zoneName si possible
        Optional<Zones> zoneOpt = zonesRepository.findById(street.getZoneId());
        zoneOpt.ifPresent(z -> street.setZoneName(z.getName()));
        Streets saved = streetsRepository.save(street);
        // Sync embedded streets in zone
        zoneOpt.ifPresent(z -> syncEmbeddedStreets(z.getId()));
        return saved;
    }

    @GetMapping
    public List<Streets> getAllStreets() {
        List<Streets> streets = streetsRepository.findAll();
        for (Streets street : streets) {
            Optional<Zones> zone = zonesRepository.findById(street.getZoneId());
            zone.ifPresent(z -> street.setZoneName(z.getName()));
        }
        return streets;
    }

    @GetMapping("/{id}")
    public Streets getStreetById(@PathVariable String id) {
        Optional<Streets> streetOpt = streetsRepository.findById(id);
        if (streetOpt.isPresent()) {
            Streets street = streetOpt.get();
            Optional<Zones> zone = zonesRepository.findById(street.getZoneId());
            zone.ifPresent(z -> street.setZoneName(z.getName()));
            return street;
        }
        return null;
    }

    @PutMapping("/{id}")
    public Streets updateStreet(@PathVariable String id, @RequestBody Streets street) {
        // Load existing to detect zone move
        Optional<Streets> existingOpt = streetsRepository.findById(id);
        Long oldZoneId = existingOpt.map(Streets::getZoneId).orElse(null);

        street.setId(id);
        street.setLastUpdated(new Date());
        Optional<Zones> zoneOpt = zonesRepository.findById(street.getZoneId());
        zoneOpt.ifPresent(z -> street.setZoneName(z.getName()));
        Streets saved = streetsRepository.save(street);
        // Sync embedded streets in the new zone
        zoneOpt.ifPresent(z -> syncEmbeddedStreets(z.getId()));
        // If the street moved between zones, also sync the old zone
        if (oldZoneId != null && oldZoneId != street.getZoneId()) {
            syncEmbeddedStreets(oldZoneId);
        }
        return saved;
    }

    @DeleteMapping("/{id}")
    public void deleteStreet(@PathVariable String id) {
        Optional<Streets> streetOpt = streetsRepository.findById(id);
        Long zoneId = streetOpt.map(Streets::getZoneId).orElse(null);
        streetsRepository.deleteById(id);
        if (zoneId != null) {
            syncEmbeddedStreets(zoneId);
        }
    }

    // Rebuild and persist the zone.streets array from Streets collection to avoid duplicates and keep in sync
    private void syncEmbeddedStreets(long zoneId) {
        Optional<Zones> zoneOpt = zonesRepository.findById(zoneId);
        if (zoneOpt.isEmpty()) return;
        Zones zone = zoneOpt.get();
        List<Streets> streets = streetsRepository.findByZoneId(zoneId);
        zone.setStreets(streets);
        zone.setLastUpdated(new Date());
        zonesRepository.save(zone);
    }
}
