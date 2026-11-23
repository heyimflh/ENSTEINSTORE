package com.ensteinstore.service;

import com.ensteinstore.dto.request.UpdateProfileRequest;
import com.ensteinstore.dto.response.UserProfileResponse;
import com.ensteinstore.entity.Customer;
import com.ensteinstore.entity.User;
import com.ensteinstore.exception.UserNotFoundException;
import com.ensteinstore.repository.CustomerRepository;
import com.ensteinstore.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * User Profile Service (GET /api/me, PUT /api/me).
 */
@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    public ProfileService(UserRepository userRepository, CustomerRepository customerRepository) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Pengguna tidak ditemukan"));

        String address = null;
        String city = null;

        if (user instanceof Customer customer) {
            address = customer.getAddress();
            city = customer.getCity();
        }

        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getPhone(),
                address,
                city
        );
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Pengguna tidak ditemukan"));

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());

        String address = null;
        String city = null;

        if (user instanceof Customer customer) {
            customer.setAddress(request.getAddress());
            customer.setCity(request.getCity());
            customerRepository.save(customer);
            address = customer.getAddress();
            city = customer.getCity();
        } else {
            userRepository.save(user);
        }

        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getPhone(),
                address,
                city
        );
    }
}
