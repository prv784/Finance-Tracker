package com.financetracker.service.impl;

import com.financetracker.dto.request.LoginRequest;
import com.financetracker.dto.request.RegisterRequest;
import com.financetracker.dto.request.ResetPasswordRequest;
import com.financetracker.dto.response.AuthResponse;
import com.financetracker.dto.response.UserResponse;
import com.financetracker.entity.Category;
import com.financetracker.entity.User;
import com.financetracker.exception.BadRequestException;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.repository.CategoryRepository;
import com.financetracker.repository.UserRepository;
import com.financetracker.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthServiceImpl {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final EmailService emailService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered. Please login.");
        }
        String otp = generateOtp();
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .enabled(false)
                .otpCode(passwordEncoder.encode(otp))
                .otpExpiryTime(LocalDateTime.now().plusMinutes(10))
                .build();
        User saved = userRepository.save(user);
        seedDefaultCategories(saved);
        log.info("Generated OTP for {}: {}", saved.getEmail(), otp);
        emailService.sendWelcomeEmail(saved.getEmail(), saved.getFirstName());
        emailService.sendOtpEmail(saved.getEmail(), saved.getFirstName(), otp);
        return AuthResponse.builder().user(toUserResponse(saved)).build();
    }

    public AuthResponse verifyOtp(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getOtpExpiryTime() == null || user.getOtpExpiryTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }
        if (!passwordEncoder.matches(otp, user.getOtpCode())) {
            throw new BadRequestException("Invalid OTP. Please check and try again.");
        }
        user.setEnabled(true);
        user.setOtpCode(null);
        user.setOtpExpiryTime(null);
        userRepository.save(user);
        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return buildAuthResponse(user);
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + email));
        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);
        emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), token);
    }

    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetPasswordToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token."));
        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Reset token has expired. Please request a new one.");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    public void resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.isEnabled()) {
            throw new BadRequestException("Account is already verified.");
        }
        String otp = generateOtp();
        user.setOtpCode(passwordEncoder.encode(otp));
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        log.info("Resent OTP for {}: {}", user.getEmail(), otp);
        emailService.sendOtpEmail(user.getEmail(), user.getFirstName(), otp);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        return AuthResponse.builder()
                .accessToken(jwtUtils.generateToken(userDetails))
                .refreshToken(jwtUtils.generateRefreshToken(userDetails))
                .user(toUserResponse(user))
                .build();
    }

    private String generateOtp() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId()).email(user.getEmail())
                .firstName(user.getFirstName()).lastName(user.getLastName())
                .profilePicture(user.getProfilePicture())
                .role(user.getRole().name()).enabled(user.isEnabled())
                .createdAt(user.getCreatedAt()).build();
    }

    private void seedDefaultCategories(User user) {
        List<Category> defaults = List.of(
            cat("Food & Dining",    "🍔", "#FF6B6B", Category.CategoryType.EXPENSE, user),
            cat("Transportation",   "🚗", "#4ECDC4", Category.CategoryType.EXPENSE, user),
            cat("Shopping",         "🛍️", "#45B7D1", Category.CategoryType.EXPENSE, user),
            cat("Entertainment",    "🎬", "#96CEB4", Category.CategoryType.EXPENSE, user),
            cat("Healthcare",       "💊", "#FFEAA7", Category.CategoryType.EXPENSE, user),
            cat("Utilities",        "💡", "#DDA0DD", Category.CategoryType.EXPENSE, user),
            cat("Housing",          "🏠", "#98D8C8", Category.CategoryType.EXPENSE, user),
            cat("Education",        "📚", "#F7DC6F", Category.CategoryType.EXPENSE, user),
            cat("Travel",           "✈️", "#74B9FF", Category.CategoryType.EXPENSE, user),
            cat("Fitness",          "💪", "#A29BFE", Category.CategoryType.EXPENSE, user),
            cat("Salary",           "💼", "#52BE80", Category.CategoryType.INCOME,  user),
            cat("Freelance",        "💻", "#3498DB", Category.CategoryType.INCOME,  user),
            cat("Investment",       "📈", "#9B59B6", Category.CategoryType.INCOME,  user),
            cat("Bonus",            "🎁", "#E67E22", Category.CategoryType.INCOME,  user),
            cat("Other",            "📌", "#95A5A6", Category.CategoryType.BOTH,    user)
        );
        categoryRepository.saveAll(defaults);
    }

    private Category cat(String name, String icon, String color,
                         Category.CategoryType type, User user) {
        return Category.builder().name(name).icon(icon).color(color)
                .type(type).isDefault(true).user(user).build();
    }
}
