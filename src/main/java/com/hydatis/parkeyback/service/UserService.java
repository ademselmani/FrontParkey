package com.hydatis.parkeyback.service;

import com.hydatis.parkeyback.entity.Location;
import com.hydatis.parkeyback.entity.User;
import com.hydatis.parkeyback.repository.LocationRepository;
import com.hydatis.parkeyback.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService implements IUserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User getUserBynum(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
    }

    @Override
    public User addUser(User user) {
        // Ensure the location is persisted
        Location location = user.getLocation();
        if (location != null && location.getId() == null) {
            location = locationRepository.save(location);
        }
        user.setLocation(location);
        return userRepository.save(user);
    }

    @Override
    public User updateUser(User user) {
        if (!userRepository.existsById(user.getId())) {
            throw new RuntimeException("User not found with ID: " + user.getId());
        }
        Location location = user.getLocation();
        if (location != null && location.getId() == null) {
            location = locationRepository.save(location);
        }
        user.setLocation(location);
        return userRepository.save(user);
    }

    @Override
    public void deleteUserById(Long userId) {
        // Find the user first
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // Delete user first
        userRepository.deleteById(userId);

        // Then delete the associated location if exists
        Location location = user.getLocation();
        if (location != null && location.getId() != null) {
            locationRepository.deleteById(location.getId());
        }
    }


    @Override
    public List<User> getUsersByLocationId(Long locationId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found with ID: " + locationId));
        return userRepository.findByLocation(location);
    }

    @Override
    public List<User> getUsersByLocationName(String locationName) {
        return userRepository.findByLocation_LocationName(locationName);
    }


}
