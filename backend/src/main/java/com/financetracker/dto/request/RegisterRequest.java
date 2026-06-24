package com.financetracker.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data public class RegisterRequest {
    @NotBlank(message = "First name is required") private String firstName;
    @NotBlank(message = "Last name is required") private String lastName;
    @NotBlank @Email(message = "Invalid email format") private String email;
    @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") private String password;
}
