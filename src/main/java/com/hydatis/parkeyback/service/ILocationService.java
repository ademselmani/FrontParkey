package com.hydatis.parkeyback.service;

import com.hydatis.parkeyback.entity.Location;
import java.util.List;

public interface ILocationService {
    List<Location> getAllLocations();
    Location getLocationById(Long id);
    Location addLocation(Location location);
    Location updateLocation(Location location);
    void deleteLocation(Long id);
}
