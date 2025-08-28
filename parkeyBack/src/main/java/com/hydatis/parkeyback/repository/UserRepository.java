package com.hydatis.parkeyback.repository;

import com.hydatis.parkeyback.entity.Location;
import com.hydatis.parkeyback.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findByLocation(Location location);
    List<User> findByLocation_LocationName(String locationName);

}
