package com.hydatis.parkeyback.repository;

import com.hydatis.parkeyback.Document.Zones;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ZonesRepository extends MongoRepository<Zones, Long> {
  // Find zones where the postCode array contains the given value
  List<Zones> findByPostCode(Integer postCode);
}
