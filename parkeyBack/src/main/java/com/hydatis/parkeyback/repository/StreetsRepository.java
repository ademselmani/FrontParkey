package com.hydatis.parkeyback.repository;

import com.hydatis.parkeyback.Document.Streets;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StreetsRepository extends MongoRepository<Streets, String> {
  // Fetch streets belonging to a zone
  List<Streets> findByZoneId(long zoneId);
  // Fetch only parkable streets belonging to a zone
  List<Streets> findByZoneIdAndParkableTrue(long zoneId);
  // Fallback: fetch by zoneName exact (ignore case)
  List<Streets> findByZoneNameIgnoreCaseAndParkableTrue(String zoneName);
  // Fallback: fetch by zoneName regex (supply (?i) for case-insensitivity)

}
