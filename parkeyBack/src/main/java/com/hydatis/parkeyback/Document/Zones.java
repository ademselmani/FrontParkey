package com.hydatis.parkeyback.Document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import java.util.Date;
import java.util.List;

@Document(collection = "zones")
public class Zones {
    @Id
    private long id;
    private String name;
    private String description;
    private List<Integer> postCode;
    private List<List<Double>> coordinates;
    private Date lastUpdated;
    // Ce champ sera rempli par agrégation, pas stocké directement
    private List<Streets> streets;

    // Getters et setters
    public List<Integer> getPostCode() {
        return postCode;
    }
    public void setPostCode(List<Integer> postCode) {
        this.postCode = postCode;
    }
    public long getId() { return id; }
    public void setId(long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<List<Double>> getCoordinates() { return coordinates; }
    public void setCoordinates(List<List<Double>> coordinates) { this.coordinates = coordinates; }
    public Date getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(Date lastUpdated) { this.lastUpdated = lastUpdated; }
    public List<Streets> getStreets() { return streets; }
    public void setStreets(List<Streets> streets) { this.streets = streets; }

    // Constructeurs
    public Zones() {}
    public Zones(long id, String name, String description, List<List<Double>> coordinates, Date lastUpdated, List<Integer> postCode) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.coordinates = coordinates;
        this.lastUpdated = lastUpdated;
        this.postCode = postCode;
    }

  @Override
  public String toString() {
    return "Zones{" +
      "id=" + id +
      ", name='" + name + '\'' +
      ", description='" + description + '\'' +
      ", postCode=" + postCode +
      ", coordinates=" + coordinates +
      ", lastUpdated=" + lastUpdated +
      ", streets=" + streets +
      '}';
  }
}
