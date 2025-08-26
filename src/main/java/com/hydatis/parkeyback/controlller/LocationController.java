package com.hydatis.parkeyback.controlller;

import com.hydatis.parkeyback.entity.Location;
import com.hydatis.parkeyback.entity.User;
import com.hydatis.parkeyback.service.ILocationService;
import com.hydatis.parkeyback.service.IUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@CrossOrigin(origins = "*")
public class LocationController {

    @Autowired
    private ILocationService locationService;
    @Autowired
    private IUserService userService;

    @GetMapping
    public List<Location> getAllLocations() {
        return locationService.getAllLocations();
    }

    @GetMapping("/{id}")
    public Location getLocationById(@PathVariable Long id) {
        return locationService.getLocationById(id);
    }

    @PostMapping
    public Location addLocation(@RequestBody Location location) {
        return locationService.addLocation(location);
    }

    @PutMapping
    public Location updateLocation(@RequestBody Location location) {
        return locationService.updateLocation(location);
    }

    @DeleteMapping("/{id}")
    public void deleteLocation(@PathVariable Long id) {
        locationService.deleteLocation(id);
    }

    @GetMapping("/location/{locationId}")
    public List<User> getUsersByLocation(@PathVariable Long locationId) {
        return userService.getUsersByLocationId(locationId);

    }
    @GetMapping("/by-name/{locationName}")
    public List<User> getUsersByLocationName(@PathVariable String locationName) {
        return userService.getUsersByLocationName(locationName);
    }


}
