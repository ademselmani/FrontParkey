package com.hydatis.parkeyback.service;

import com.hydatis.parkeyback.entity.User;

import java.util.List;

public interface IUserService {

    List<User> getAllUsers();

    User getUserBynum(Long userId);

    User addUser(User user);

    User updateUser(User user);

    void deleteUserById(Long userId);

    List<User> getUsersByLocationId(Long locationId);
    List<User> getUsersByLocationName(String locationName);


}
