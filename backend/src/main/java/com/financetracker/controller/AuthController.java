package com.financetracker.controller;

import com.financetracker.dto.request.*;
import com.financetracker.dto.response.ApiResponse;
import com.financetracker.dto.response.AuthResponse;
import com.financetracker.service.impl.AuthServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Auth APIs – register, login, OTP, password reset")
public class AuthController {

    private final AuthServiceImpl authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user – sends OTP email")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(ApiResponse.success(
                authService.register(req),
                "Registration successful. Please verify your email."));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify the 6-digit OTP sent by email")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(
                authService.verifyOtp(body.get("email"), body.get("otp")),
                "Account verified successfully!"));
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend OTP to the given email")
    public ResponseEntity<ApiResponse<Void>> resendOtp(
            @RequestBody Map<String, String> body) {
        authService.resendOtp(body.get("email"));
        return ResponseEntity.ok(ApiResponse.success("OTP resent successfully"));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email + password, returns JWT")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(req), "Login successful"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Send password-reset link to email")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Password reset link sent to your email"));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using the token from email")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok(ApiResponse.success("Password reset successful"));
    }
}
