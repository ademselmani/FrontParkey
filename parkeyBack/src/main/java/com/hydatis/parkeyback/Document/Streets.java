package com.hydatis.parkeyback.Document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "streets")
public class Streets {
    @Id
    private String id;
    private String name; // optionnel
    @JsonProperty("capacity")
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private int capacity; // optionnel, à remplir plus tard
    private long zoneId; // référence à Zones.id
    @JsonProperty("isParkable")
    @Field("isParkable")
    private boolean isParkable;
    private Date lastUpdated;
    private List<List<Double>> coordinates;
    private String zoneName; // rempli par agrégation et stocké en base

    // Getters et setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public long getZoneId() { return zoneId; }
    public void setZoneId(long zoneId) { this.zoneId = zoneId; }
    public String getZoneName() { return zoneName; }
    public void setZoneName(String zoneName) { this.zoneName = zoneName; }
    @JsonProperty("isParkable")
    public boolean isParkable() { return isParkable; }
    public void setParkable(boolean parkable) { isParkable = parkable; }
    public Date getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(Date lastUpdated) { this.lastUpdated = lastUpdated; }
    public List<List<Double>> getCoordinates() { return coordinates; }
    public void setCoordinates(List<List<Double>> coordinates) { this.coordinates = coordinates; }

  public int getCapacity() {
    return capacity;
  }

  public void setCapacity(int capacity) {
    this.capacity = capacity;
  }

  // Constructeurs
    public Streets() {}
    public Streets(String id, String name,int capacity, long zoneId, boolean isParkable, Date lastUpdated, List<List<Double>> coordinates) {
        this.id = id;
        this.name = name;
        this.capacity = capacity;
        this.zoneId = zoneId;
        this.isParkable = isParkable;
        this.lastUpdated = lastUpdated;
        this.coordinates = coordinates;
    }

  @Override
  public String toString() {
    return "Streets{" +
      "id='" + id + '\'' +
      ", name='" + name + '\'' +
      ", capacity=" + capacity +
      ", zoneId=" + zoneId +
      ", isParkable=" + isParkable +
      ", lastUpdated=" + lastUpdated +
      ", coordinates=" + coordinates +
      ", zoneName='" + zoneName + '\'' +
      '}';
  }
}
