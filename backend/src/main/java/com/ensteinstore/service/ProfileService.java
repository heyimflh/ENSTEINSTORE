package com.ensteinstore.service;

import com.ensteinstore.dto.request.ChangePasswordRequest;
import com.ensteinstore.dto.request.UpdateProfileRequest;
import com.ensteinstore.dto.response.UserProfileResponse;
import com.ensteinstore.entity.Customer;
import com.ensteinstore.entity.User;
import com.ensteinstore.exception.InvalidPasswordException;
import com.ensteinstore.exception.UserNotFoundException;
import com.ensteinstore.repository.CustomerRepository;
import com.ensteinstore.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * User Profile Service (GET /api/me, PUT /api/me, PUT /api/me/password).
 */
@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileService(UserRepository userRepository,
                          CustomerRepository customerRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
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

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Pengguna tidak ditemukan"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new InvalidPasswordException("Password saat ini tidak sesuai.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
